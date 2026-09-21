import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createNIS2MtlsAgent, getNIS2MtlsStatus } from './server/mtlsClient';
import https from 'https';

async function startServer() {
  const app = express();
  
  // Porta dinamica richiesta da Google Cloud (usa la 8080 di default)
  const PORT = process.env.PORT || 8080;

  app.use(express.json());

  // 1. Health Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'JOKER 80 Quantum Control Panel Backend',
      timestamp: new Date().toISOString()
    });
  });

  // 2. NIS2 mTLS Security Status
  app.get('/api/mtls/status', (_req: Request, res: Response) => {
    const status = getNIS2MtlsStatus();
    res.json(status);
  });

  // 3. Plant Telemetry Proxy with mTLS (TLS 1.3)
  app.post('/api/plant/telemetry', async (req: Request, res: Response) => {
    const { targetUrl, tenantId } = req.body || {};
    const remoteUrl = targetUrl || process.env.PLANT_REMOTE_GATEWAY_URL;
    const mtlsStatus = getNIS2MtlsStatus();

    // If remote gateway URL is provided and mTLS is configured, try direct TLS 1.3 mTLS connection
    if (remoteUrl && mtlsStatus.configured) {
      let agentObj: ReturnType<typeof createNIS2MtlsAgent> | null = null;
      try {
        agentObj = createNIS2MtlsAgent();
        const responseData = await new Promise((resolve, reject) => {
          const parsedUrl = new URL(remoteUrl);
          const requestOptions: https.RequestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 8443,
            path: parsedUrl.pathname || '/api/v1/telemetry',
            method: 'GET',
            agent: agentObj!.agent,
            timeout: 8000,
            headers: {
              'Accept': 'application/json',
              'X-Client-Platform': 'JOKER-80-Quantum-NIS2'
            }
          };

          const request = https.request(requestOptions, (response) => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed);
              } catch {
                resolve({ raw: data, statusCode: response.statusCode });
              }
            });
          });

          request.on('error', (err) => reject(err));
          request.on('timeout', () => {
            request.destroy();
            reject(new Error('Timeout mTLS verso gateway industriale'));
          });
          request.end();
        });

        if (agentObj) agentObj.cleanup();

        return res.json({
          source: 'REMOTE_INDUSTRIAL_NODE_MTLS',
          protocol: 'TLSv1.3_mTLS_ECDSA_NIS2',
          targetUrl: remoteUrl,
          data: responseData,
          authenticated: true,
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        if (agentObj) agentObj.cleanup();
        console.warn('[mTLS Proxy Warning]', err.message);
        // Fallback to local high-precision telemetry with diagnostic warning
        return res.json({
          source: 'LOCAL_HIGH_PRECISION_FALLBACK',
          protocol: 'TLSv1.3_mTLS_ECDSA_NIS2',
          targetUrl: remoteUrl,
          error: err.message,
          authenticated: false,
          fallbackReason: 'Impossibile completare handshake con nodo esterno (offline o firewall upstream)',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Default response returning status and acknowledging telemetry request
    return res.json({
      source: 'LOCAL_HIGH_PRECISION_DIAGNOSTIC',
      mtlsStatus,
      tenantId: tenantId || 'barilla_pedrignano',
      timestamp: new Date().toISOString(),
      message: 'Proxy mTLS pronto per l’acquisizione telemetrica in tempo reale'
    });
  });

  // 4. Vite Middleware for Development / Static for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In produzione esbuild si trova dentro 'dist/', quindi i file statici di React sono nella stessa cartella
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[JOKER 80] Quantum Control Panel running on port ${PORT}`);
  });
}

startServer();
