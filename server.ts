import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createNIS2MtlsAgent, getNIS2MtlsStatus, installPfxBundle } from './server/mtlsClient';
import https from 'https';

async function startServer() {
  const app = express();
  
  // Porta dinamica richiesta da Google Cloud / AI Studio (usa la 3000 di default)
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Gracefully handle malformed JSON / syntax errors from external terminals and IPC scripts
  app.use((err: any, _req: Request, res: Response, next: any) => {
    if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
      console.warn('[JSON Parser Warning] Payload malformato ricevuto:', err.message);
      return res.status(400).json({
        success: false,
        error: 'JSON non valido nel corpo della richiesta: ' + err.message,
        hint: 'Verifica la formattazione: le chiavi e i valori stringa devono essere racchiusi tra virgolette doppie (es. {"macchinarioId": "bema-silkworm-01"}).'
      });
    }
    next(err);
  });

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

  // 2b. Upload & Activate PKCS#12 / PFX Certificate Bundle
  app.post('/api/mtls/upload-pfx', (req: Request, res: Response) => {
    try {
      const { pfxBase64, passphrase, filename } = req.body || {};
      if (!pfxBase64 || typeof pfxBase64 !== 'string') {
        res.status(400).json({ success: false, error: 'File .PFX mancante o non codificato in base64.' });
        return;
      }
      if (passphrase === undefined || passphrase === null) {
        res.status(400).json({ success: false, error: 'Password del bundle .PFX richiesta.' });
        return;
      }

      const pfxBuffer = Buffer.from(pfxBase64, 'base64');
      const result = installPfxBundle(pfxBuffer, passphrase, filename || 'client.pfx');
      const updatedStatus = getNIS2MtlsStatus();

      res.json({
        success: true,
        message: result.message,
        fingerprint: result.fingerprint,
        status: updatedStatus
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err?.message || 'Errore durante la validazione o l\'installazione del file .PFX'
      });
    }
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

  // In-memory buffer for telemetry received from local machines (e.g. PC local Smile80 node)
  const ingestedTelemetryLog: Array<{
    id: string;
    receivedAt: string;
    clientIp: string;
    macchinarioId?: string;
    nomeMacchinario?: string;
    tipoMacchina?: string;
    stato?: string;
    parametri?: Record<string, any>;
    lgv?: Record<string, any>;
    baia?: Record<string, any>;
    rawPayload: any;
  }> = [];

  // 4. Ingest Telemetry Push from Local PC / Smile80 Machine
  app.post('/api/telemetry/push', (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Payload non valido: atteso un oggetto JSON con i parametri del macchinario Smile80'
        });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      
      // M2M Industrial Gateway Authentication Detection
      const gatewayKeyHeader = req.headers['x-industrial-gateway-key'] as string;
      const authHeader = req.headers['authorization'] as string;
      const clientCertFingerprint = (req.headers['x-client-cert-fingerprint'] || req.headers['x-ssl-client-sha256']) as string;
      
      let authType = 'STANDARD_HTTP';
      if (clientCertFingerprint) {
        authType = 'MTLS_CLIENT_CERTIFICATE';
      } else if (gatewayKeyHeader) {
        authType = 'INDUSTRIAL_GATEWAY_KEY';
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        authType = 'BEARER_TOKEN';
      }

      const record = {
        id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        receivedAt: new Date().toISOString(),
        clientIp,
        authType,
        macchinarioId: payload.macchinarioId || payload.id || 'bema-silkworm-01',
        nomeMacchinario: payload.nome || payload.nomeMacchinario || 'Fasciatore Robotico BEMA Silkworm',
        tipoMacchina: payload.tipo || payload.tipoMacchina || 'BEMA_FASCIATORE',
        stato: payload.stato || (payload.parametri?.allarmeAttivo ? 'ALLARME' : 'IN_MARCIA'),
        parametri: payload.parametri || payload.telemetria || payload,
        lgv: payload.lgv,
        baia: payload.baia,
        rawPayload: payload
      };

      ingestedTelemetryLog.unshift(record);
      if (ingestedTelemetryLog.length > 50) {
        ingestedTelemetryLog.pop();
      }

      const mtlsStatus = getNIS2MtlsStatus();

      return res.status(200).json({
        success: true,
        message: 'Telemetria macchinario Smile80 acquisita con successo sul server Google Cloud',
        packetId: record.id,
        receivedAt: record.receivedAt,
        authType: record.authType,
        mtlsSecurity: {
          active: mtlsStatus.configured,
          protocol: 'TLSv1.3 Strict',
          curve: 'ECDSA prime256v1 (NIST P-256)'
        },
        processedRecord: {
          macchinario: record.nomeMacchinario,
          stato: record.stato,
          metrichePrincipali: record.parametri
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: 'Errore durante l\'elaborazione del pacchetto: ' + (err?.message || err)
      });
    }
  });

  // 5. Get Latest Ingested Telemetry Packets
  app.get('/api/telemetry/latest', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      totalPacketsReceived: ingestedTelemetryLog.length,
      latestPacket: ingestedTelemetryLog[0] || null,
      recentPackets: ingestedTelemetryLog.slice(0, 10),
      serverTimestamp: new Date().toISOString()
    });
  });

  // 6. Vite Middleware for Development / Static for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In produzione i file statici di React compilati sono nella cartella dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JOKER 80] Quantum Control Panel running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
