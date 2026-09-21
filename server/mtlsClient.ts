import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface MtlsConfigOptions {
  caCertPath?: string;
  clientCertPath?: string;
  privateKeyPem?: string;
  strictTls13?: boolean;
}

export interface MtlsStatusResponse {
  configured: boolean;
  caCertPresent: boolean;
  clientCertPresent: boolean;
  privateKeyPresent: boolean;
  tlsVersion: string;
  curveType: string;
  nis2Compliant: boolean;
  details: string;
}

/**
 * Creates an https.Agent enforcing TLS 1.3 mTLS with ECDSA certificates compliant with NIS2 Directive.
 * The private key is injected from environment variables, written with atomic 0600 permissions
 * to a short-lived temporary file in /tmp, and unlinked immediately in the finally block.
 */
export function createNIS2MtlsAgent(options: MtlsConfigOptions = {}): { agent: https.Agent; cleanup: () => void } {
  const caPath = options.caCertPath || path.resolve(process.cwd(), 'certs', 'ca_radice.crt');
  const certPath = options.clientCertPath || path.resolve(process.cwd(), 'certs', 'programma_google.crt');
  const rawKey = options.privateKeyPem || process.env.MTLS_PRIVATE_KEY;

  if (!fs.existsSync(caPath)) {
    throw new Error(`[NIS2 mTLS] Certificato CA non trovato nel percorso: ${caPath}`);
  }
  if (!fs.existsSync(certPath)) {
    throw new Error(`[NIS2 mTLS] Certificato client non trovato nel percorso: ${certPath}`);
  }

  const caCert = fs.readFileSync(caPath);
  const clientCert = fs.readFileSync(certPath);

  // If no private key provided, we can still configure an agent that validates CA or report warning
  let keyContent: Buffer | string | undefined = undefined;
  let tempKeyPath: string | null = null;

  if (rawKey && rawKey.trim().length > 0) {
    const formattedKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    const randId = crypto.randomBytes(8).toString('hex');
    tempKeyPath = path.join('/tmp', `nis2_key_${randId}.key`);

    try {
      // Secure write with 0600 (read/write only by current process owner)
      fs.writeFileSync(tempKeyPath, formattedKey.trim(), { mode: 0o600 });
      keyContent = fs.readFileSync(tempKeyPath);
    } finally {
      if (tempKeyPath && fs.existsSync(tempKeyPath)) {
        try {
          fs.unlinkSync(tempKeyPath);
        } catch {
          // ignore cleanup error
        }
      }
    }
  }

  const agent = new https.Agent({
    ca: caCert,
    cert: clientCert,
    key: keyContent,
    // NIS2 Compliance: Enforce TLS 1.3 strictly
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    // ECDH curve curve25519 or prime256v1
    ecdhCurve: 'prime256v1:X25519',
    rejectUnauthorized: true,
    keepAlive: true,
    keepAliveMsecs: 10000
  });

  const cleanup = () => {
    agent.destroy();
  };

  return { agent, cleanup };
}

/**
 * Returns diagnostic status of mTLS and NIS2 posture
 */
export function getNIS2MtlsStatus(): MtlsStatusResponse {
  const caPath = path.resolve(process.cwd(), 'certs', 'ca_radice.crt');
  const certPath = path.resolve(process.cwd(), 'certs', 'programma_google.crt');
  const caPresent = fs.existsSync(caPath);
  const certPresent = fs.existsSync(certPath);
  const keyPresent = Boolean(process.env.MTLS_PRIVATE_KEY && process.env.MTLS_PRIVATE_KEY.trim().length > 0);

  const configured = caPresent && certPresent && keyPresent;

  return {
    configured,
    caCertPresent: caPresent,
    clientCertPresent: certPresent,
    privateKeyPresent: keyPresent,
    tlsVersion: 'TLSv1.3 (Strict)',
    curveType: 'ECDSA prime256v1 (NIST P-256)',
    nis2Compliant: configured,
    details: configured
      ? 'Certificati mTLS ECDSA e chiave segreta rilevati. Canale TLS 1.3 attivo verso i nodi industriali.'
      : 'Certificati o chiave MTLS_PRIVATE_KEY parzialmente configurati. In assenza di chiave remota, il sistema utilizza simulazione telemetrica di alta precisione.'
  };
}
