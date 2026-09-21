# RELAZIONE TECNICA: ARCHITETTURA CERTIFICATI mTLS & CONFORMITÀ NIS2
## Progetto: JOKER 80 Quantum Control Panel - Gateway SM.I.LE80 / Elettric80

---

### 1. SITUAZIONE ATTUALE DELL'APPLICAZIONE

#### A. Cosa è già stato implementato:
1. **Modulo Proxy Backend mTLS (`server.ts` & `server/mtlsClient.ts`)**:
   - Implementato proxy HTTPS con autenticazione reciproca (mTLS) per interrogare i gateway industriali.
   - Endpoint di diagnostica integrato: `GET /api/mtls/status`.
   - Client socket HTTPS configurato con vincoli di sicurezza stringenti:
     - **TLS 1.3 forzato**: `minVersion: 'TLSv1.3'`, `maxVersion: 'TLSv1.3'`.
     - **Curve Ellittiche**: `ecdhCurve: 'prime256v1:X25519'`.
     - **Validazione rigorosa certificati**: `rejectUnauthorized: true`.
2. **Struttura Cartelle e Ambiente**:
   - Cartella dedicata `/certs/` presente alla radice del progetto per ospitare i file pubblici `.crt`.
   - File `.env.example` configurato con i parametri:
     - `MTLS_PRIVATE_KEY=""` (chiave privata ECDSA memorizzata in modo protetto nei Secrets).
     - `PLANT_REMOTE_GATEWAY_URL=""` (endpoint HTTPS/mTLS del gateway di fabbrica).
3. **Gestione Sicura della Chiave in Memoria**:
   - Caricamento dinamico della chiave privata dalla variabile d'ambiente (`process.env.MTLS_PRIVATE_KEY`).
   - Scrittura temporanea su filesystem virtuale in `/tmp` con maschera permessi restrittiva `0600` (`-rw-------`, accessibile esclusivamente al processo Node.js attivo).
   - Eliminazione immediata del file temporaneo (`fs.unlinkSync`) una volta istanziato il socket TLS, azzerando il rischio di esposizione a riposo.

#### B. Criticità Tecnica Rilevata (Ispezione OpenSSL):
- L'ispezione con `openssl x509` sui file attualmente presenti in `/certs/` ha evidenziato che il certificato client è in formato **X.509 Version 1 (senza estensioni)**.
- **Impatto Industriale**: I firewall di stabilimento Next-Generation (NGFW) come **Fortinet FortiGate, Palo Alto Networks (PAN-OS) e Check Point Quantum** con profili di Deep Packet Inspection (DPI) **rigettano tassativamente i certificati Version 1 o privi dell'estensione SAN (Subject Alternative Name)**, provocando l'interruzione immediata della negoziazione TLS (`UNKNOWN_CA`, `CERTIFICATE_REQUIRED` o handshake drop).

#### C. Azioni da compiere per completare l'infrastruttura:
1. Generare una nuova coppia di certificati conforme a **X.509 Version 3** con estensioni **SAN** e cifratura **ECDSA prime256v1 (P-256)**.
2. Posizionare i certificati pubblici (`ca_radice.crt` e `programma_google.crt`) all'interno della cartella `/certs/`.
3. Inserire la chiave privata (`programma_google.key`) nel pannello **Settings -> Secrets** di Google AI Studio sotto il nome `MTLS_PRIVATE_KEY`.
4. Configurare l'indirizzo IP o FQDN del gateway di stabilimento in `PLANT_REMOTE_GATEWAY_URL`.

---

### 2. SPECIFICA CRITTOGRAFICA & REQUISITI FIREWALL (NIS2)

| Parametro | Valore Richiesto | Motivazione Tecnica / Industriale |
| :--- | :--- | :--- |
| **Protocollo TLS** | TLS 1.3 (Strict) | Elimina cifrari deboli e vulnerabilità storiche (Heartbleed, BEAST). Obbligatorio per conformità NIS2. |
| **Algoritmo Chiave** | ECDSA (Elliptic Curve) | Chiavi corte (256 bit), overhead di calcolo minimo e latenza ultra-bassa (cruciale per scambio dati AGV e PLC in tempo reale). |
| **Curva Ellittica** | `prime256v1` (NIST P-256) | Standard internazionale per la sicurezza industriale e crittografia asimmetrica ad alta efficienza. |
| **Formato Certificato** | X.509 Version 3 | Richiesto per ospitare estensioni di sicurezza (`KeyUsage`, `ExtendedKeyUsage`, `SAN`). |
| **Estensioni SAN** | DNS e IP SAN espliciti | Evita il blocco DPI da parte di firewall Fortinet, Palo Alto e Check Point che scartano il Common Name deprecato. |
| **Hashing Algoritmo** | SHA-256 | Integrità crittografica garantita. |

---

### 3. PROCEDURA DI CREAZIONE CERTIFICATI SU LINUX (OpenSSL 3.0)

Eseguire la seguente procedura direttamente sul terminale Linux di sviluppo o configurazione.

#### Passo 3.1: Creazione del file di configurazione OpenSSL (`openssl_nis2.cnf`)
```ini
[ req ]
default_bits        = 256
default_md          = sha256
distinguished_name  = req_distinguished_name
prompt              = no

[ req_distinguished_name ]
C   = IT
ST  = ReggioEmilia
L   = Viano
O   = Elettric80-SM.I.LE80
OU  = Cybersecurity-NIS2
CN  = programma_google

[ v3_ca ]
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints       = critical, CA:TRUE, pathlen:0
keyUsage               = critical, digitalSignature, cRLSign, keyCertSign

[ v3_client ]
basicConstraints       = critical, CA:FALSE
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid,issuer
keyUsage               = critical, digitalSignature, keyAgreement
extendedKeyUsage       = clientAuth
subjectAltName         = @alt_names

[ alt_names ]
DNS.1 = programma_google
DNS.2 = *.elettric80.local
DNS.3 = *.smile80.internal
DNS.4 = localhost
IP.1  = 127.0.0.1
IP.2  = 192.168.1.100    # Sostituire con l'IP statico del Gateway di stabilimento
```

#### Passo 3.2: Generazione della CA Radice Industriale (ECDSA prime256v1)
```bash
# 1. Genera la chiave privata della CA Radice
openssl ecparam -name prime256v1 -genkey -noout -out ca_radice.key

# 2. Genera il certificato autofirmato X.509v3 della CA (validità 10 anni)
openssl req -new -x509 -sha256 -days 3650 \
  -key ca_radice.key \
  -out ca_radice.crt \
  -subj "/C=IT/ST=ReggioEmilia/O=Elettric80/OU=Security-NIS2/CN=JOKER80-Root-CA-Industrial" \
  -config openssl_nis2.cnf -extensions v3_ca
```

#### Passo 3.3: Generazione del Certificato Client con SAN (`programma_google`)
```bash
# 1. Genera la chiave privata per l'applicazione client
openssl ecparam -name prime256v1 -genkey -noout -out programma_google.key

# 2. Crea la richiesta di firma certificato (CSR)
openssl req -new -sha256 \
  -key programma_google.key \
  -out programma_google.csr \
  -config openssl_nis2.cnf

# 3. Firma il certificato client applicando le estensioni X.509v3 e i campi SAN (validità 2 anni)
openssl x509 -req -days 730 -sha256 \
  -in programma_google.csr \
  -CA ca_radice.crt \
  -CAkey ca_radice.key \
  -CAcreateserial \
  -out programma_google.crt \
  -extfile openssl_nis2.cnf \
  -extensions v3_client

# 4. Verifica di conformità (deve restituire Version: 3 e la lista SAN)
openssl x509 -in programma_google.crt -text -noout | grep -E "(Version|Subject Alternative Name)" -A 1
```

---

### 4. ARCHITETTURA DEI FILE E ISOLAMENTO DELLA CHIAVE PRIVATA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE DI PRODUZIONE                          │
│                                                                         │
│  Cartella /certs/ (File Pubblici - Versionabili in Git):                 │
│   ├── ca_radice.crt          -> Certificato CA Radice di Stabilimento   │
│   └── programma_google.crt    -> Certificato Client X.509v3 (con SAN)   │
│                                                                         │
│  Pannello Secrets / Variabili d'Ambiente Protette:                      │
│   └── MTLS_PRIVATE_KEY       -> Contenuto stringa PEM di                │
│                                 programma_google.key                    │
│   └── PLANT_REMOTE_GATEWAY_URL -> Endpoint del Gateway Elettric80      │
│                                   (es. https://192.168.1.100:8443)      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 Richiesta Telemetria Live (/api/plant/telemetry)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND RUNTIME (server.ts)                  │
│                                                                         │
│ 1. Lettura certificati pubblici da disco (/certs/)                      │
│ 2. Recupero MTLS_PRIVATE_KEY da memoria sicura                          │
│ 3. Creazione temporanea atomica con permessi 0600:                      │
│    fs.writeFileSync('/tmp/nis2_key_*.key', keyPem, { mode: 0o600 })    │
│ 4. Istanziazione del client mTLS con parametri forzati:                 │
│    - minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3'                       │
│    - ecdhCurve: 'prime256v1:X25519'                                    │
│    - rejectUnauthorized: true                                          │
│ 5. Eliminazione immediata del file temporaneo con fs.unlinkSync         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
           Handshake Bilaterale mTLS TLS 1.3 (Curve P-256 + SAN)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            FIREWALL PERIMETRALE (Fortinet / Palo Alto / Check Point)    │
│  - Ispezione DPI: Riconosce cifrario TLS 1.3 e curva approvata ECDSA    │
│  - Risoluzione SAN: Corrispondenza IP / FQDN verificata                 │
│  - Esito: TRAFFICO mTLS AUTORIZZATO SENZA INTERRUZIONI                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 GATEWAY DI STABILIMENTO SM.I.LE80 / E80                 │
│  - Valida 'programma_google.crt' contro la Root CA                      │
│  - Rilascia telemetria in tempo reale dei nodi industriali:             │
│     * Fasciatori Bema Silkworm (RPM, vibrazioni braccio, tiro film)     │
│     * Flotta Navette LGV / AGV (coordinate XYZ, SoC batterie, tratte)   │
│     * Magazzini SmartStore, Isole Robot, Woodpecker, Raptor             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. CHECKLIST OPERATIVA DI COMPLETAMENTO

- [ ] **Generazione Certificati**: Eseguire i comandi del Capitolo 3 per ottenere `ca_radice.crt`, `programma_google.crt` e `programma_google.key`.
- [ ] **Caricamento Certificati Pubblici**: Copiare `ca_radice.crt` e `programma_google.crt` all'interno della cartella `/certs/`.
- [ ] **Configurazione Secret**: Nel menù Settings dell'ambiente, creare il Secret `MTLS_PRIVATE_KEY` e incollare l'intero blocco PEM (inclusi `-----BEGIN EC PRIVATE KEY-----` e `-----END EC PRIVATE KEY-----`).
- [ ] **Configurazione Endpoint**: Impostare `PLANT_REMOTE_GATEWAY_URL` con l'indirizzo IP o nome DNS e porta del gateway di fabbrica.
- [ ] **Collaudo Handshake**: Eseguire una chiamata all'endpoint `/api/mtls/status` o avviare la scansione nel pannello amministratore per confermare il collegamento bidirezionale.
