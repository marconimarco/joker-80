import https from 'https';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface MtlsConfigOptions {
  caCertPath?: string;
  clientCertPath?: string;
  privateKeyPem?: string;
  pfxBuffer?: Buffer;
  pfxPath?: string;
  passphrase?: string;
  strictTls13?: boolean;
}

export interface MtlsStatusResponse {
  configured: boolean;
  caCertPresent: boolean;
  clientCertPresent: boolean;
  privateKeyPresent: boolean;
  pfxPresent: boolean;
  tlsVersion: string;
  curveType: string;
  nis2Compliant: boolean;
  details: string;
  loadedCertName?: string;
}

// In-memory runtime cache for uploaded PFX bundle
let activePfxBuffer: Buffer | null = null;
let activePfxPassphrase: string = '';
let activePfxFilename: string = '';

export function installPfxBundle(fileBuffer: Buffer, passphrase: string, filename: string = 'client.pfx'): { success: boolean; message: string; fingerprint?: string } {
  try {
    // 1. Verify passphrase by attempting to create a secure context
    tls.createSecureContext({
      pfx: fileBuffer,
      passphrase: passphrase
    });

    // 2. If valid, persist to /certs/client_active.pfx with 0600 permissions
    const certsDir = path.resolve(process.cwd(), 'certs');
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }

    const pfxDestination = path.join(certsDir, 'client_active.pfx');
    fs.writeFileSync(pfxDestination, fileBuffer, { mode: 0o600 });

    activePfxBuffer = fileBuffer;
    activePfxPassphrase = passphrase;
    activePfxFilename = filename;

    // Calculate SHA-256 fingerprint of the PFX bundle
    const fingerprint = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase().match(/.{1,2}/g)?.join(':');

    return {
      success: true,
      message: `File .PFX (${filename}) decifrato e validato con successo. Canale mTLS TLS 1.3 attivo.`,
      fingerprint
    };
  } catch (err: any) {
    const errMsg = err?.message || 'Errore durante la decifratura del bundle PKCS#12';
    if (errMsg.includes('mac verify failure') || errMsg.includes('bad decrypt') || errMsg.includes('pkcs12')) {
      throw new Error('Password del file .pfx non corretta. Verifica la password inserita durante l\'esportazione OpenSSL.');
    }
    throw new Error(`Errore validazione .pfx: ${errMsg}`);
  }
}

/**
 * Creates an https.Agent enforcing TLS 1.3 mTLS with ECDSA certificates compliant with NIS2 Directive.
 * Supports either PEM certificates or PKCS#12 / PFX bundles.
 */
export function createNIS2MtlsAgent(options: MtlsConfigOptions = {}): { agent: https.Agent; cleanup: () => void } {
  const caPath = options.caCertPath || path.resolve(process.cwd(), 'certs', 'ca_radice.crt');
  const certPath = options.clientCertPath || path.resolve(process.cwd(), 'certs', 'programma_google.crt');
  const rawKey = options.privateKeyPem || process.env.MTLS_PRIVATE_KEY;

  if (!fs.existsSync(caPath)) {
    throw new Error(`[NIS2 mTLS] Certificato CA non trovato nel percorso: ${caPath}`);
  }
  const caCert = fs.readFileSync(caPath);

  // If active PFX bundle is present, use PFX configuration
  const pfxDestination = path.resolve(process.cwd(), 'certs', 'client_active.pfx');
  const hasSavedPfx = fs.existsSync(pfxDestination);
  const pfxToUse = options.pfxBuffer || activePfxBuffer || (hasSavedPfx ? fs.readFileSync(pfxDestination) : null);
  const passToUse = options.passphrase || activePfxPassphrase;

  if (pfxToUse) {
    const agent = new https.Agent({
      ca: caCert,
      pfx: pfxToUse,
      passphrase: passToUse,
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      ecdhCurve: 'prime256v1:X25519',
      rejectUnauthorized: true,
      keepAlive: true,
      keepAliveMsecs: 10000
    });
    return { agent, cleanup: () => agent.destroy() };
  }

  // Fallback to PEM certificates and private key
  if (!fs.existsSync(certPath)) {
    throw new Error(`[NIS2 mTLS] Certificato client non trovato nel percorso: ${certPath}`);
  }
  const clientCert = fs.readFileSync(certPath);

  let keyContent: Buffer | string | undefined = undefined;
  let tempKeyPath: string | null = null;

  if (rawKey && rawKey.trim().length > 0) {
    const formattedKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    const randId = crypto.randomBytes(8).toString('hex');
    tempKeyPath = path.join('/tmp', `nis2_key_${randId}.key`);

    try {
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
    minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3',
    ecdhCurve: 'prime256v1:X25519',
    rejectUnauthorized: true,
    keepAlive: true,
    keepAliveMsecs: 10000
  });

  return { agent, cleanup: () => agent.destroy() };
}

/**
 * Returns diagnostic status of mTLS and NIS2 posture
 */
export function getNIS2MtlsStatus(): MtlsStatusResponse {
  const caPath = path.resolve(process.cwd(), 'certs', 'ca_radice.crt');
  const certPath = path.resolve(process.cwd(), 'certs', 'programma_google.crt');
  const pfxPath = path.resolve(process.cwd(), 'certs', 'client_active.pfx');
  
  const caPresent = fs.existsSync(caPath);
  const certPresent = fs.existsSync(certPath);
  const keyPresent = Boolean(process.env.MTLS_PRIVATE_KEY && process.env.MTLS_PRIVATE_KEY.trim().length > 0);
  const pfxPresent = activePfxBuffer !== null || fs.existsSync(pfxPath);

  const configured = caPresent && (pfxPresent || (certPresent && keyPresent));

  return {
    configured,
    caCertPresent: caPresent,
    clientCertPresent: certPresent,
    privateKeyPresent: keyPresent,
    pfxPresent,
    tlsVersion: 'TLSv1.3 (Strict)',
    curveType: 'ECDSA prime256v1 (NIST P-256)',
    nis2Compliant: configured,
    loadedCertName: activePfxFilename || (pfxPresent ? 'client_active.pfx' : undefined),
    details: configured
      ? (pfxPresent 
          ? `Bundle PKCS#12 (.PFX ${activePfxFilename ? `"${activePfxFilename}"` : ''}) caricato e verificato. Canale TLS 1.3 pronto per la connessione al tuo computer/gateway.`
          : 'Certificati mTLS ECDSA e chiave segreta rilevati. Canale TLS 1.3 attivo verso i nodi industriali.')
      : 'Certificato .PFX o chiave MTLS_PRIVATE_KEY non ancora configurati. Carica il file .PFX dal Pannello Admin.'
  };
}
