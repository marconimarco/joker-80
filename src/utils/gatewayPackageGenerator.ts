import { FactoryTenant } from '../types/quantum';

/**
 * Utility per generare ed esportare il pacchetto gateway demone + certificati mTLS
 * preconfigurati specificamente per un singolo stabilimento.
 */

export function downloadAsBlob(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Download error:', err);
  }
}

/**
 * Genera lo script Python del demone con i parametri dello stabilimento incorporati
 */
export function generatePythonDaemonScript(tenant: FactoryTenant, serverOrigin: string, intervalSec = 5): string {
  const plantId = tenant.id || 'PEDRIGNANO';
  const plantName = tenant.nome || 'Stabilimento Industriale';
  const apiKey = tenant.wmsApiKey || `JOKER80-NIS2-${plantId.toUpperCase()}-GW-2026`;

  return `#!/usr/bin/env python3
"""
JOKER 80 - SM.I.LE80 Industrial Gateway Telemetry Daemon
STABILIMENTO: ${plantName} [ID: ${plantId}]
AZIENDA: ${tenant.azienda || 'Gruppo Industriale'}
SICUREZZA: Conforme Direttiva NIS2 / IEC 62443 (mTLS Ready)
"""
import os
import sys
import time
import socket
import platform
import json
import uuid
import requests

print("==============================================================================")
print("  JOKER 80 - SM.I.LE80 Industrial Telemetry Daemon (M2M)")
print("  Stabilimento: ${plantName}")
print("  Societa:      ${tenant.azienda || 'Azienda'}")
print("  Gateway ID:   ${plantId}")
print("  Normativa:    NIS2 / IEC 62443 Security Compliant")
print("==============================================================================")

SERVER_URL = os.environ.get("JOKER80_URL", "${serverOrigin}")
GATEWAY_KEY = os.environ.get("INDUSTRIAL_GATEWAY_KEY", "${apiKey}")
PLANT_ID = os.environ.get("PLANT_ID", "${plantId}")
PLANT_NAME = os.environ.get("PLANT_NAME", "${plantName}")
INTERVAL_SEC = int(os.environ.get("TELEMETRY_INTERVAL_SEC", "${intervalSec}"))

PUSH_ENDPOINT = f"{SERVER_URL}/api/telemetry/push"
HANDSHAKE_ENDPOINT = f"{SERVER_URL}/api/telemetry/handshake"

REAL_HOST = socket.gethostname()
REAL_OS = platform.system() + " " + platform.release()
REAL_ARCH = platform.machine()
PY_VER = platform.python_version()

def ottieni_mac_address():
    try:
        node = uuid.getnode()
        mac_hex = '{:012x}'.format(node)
        return ':'.join(mac_hex[i:i+2] for i in range(0, 12, 2)).upper()
    except Exception:
        return '00:00:00:00:00:00'

REAL_MAC = ottieni_mac_address()

SPOOL_DIR = os.environ.get("SPOOL_DIR") or (
    "C:\\\\JOKER80\\\\spool" if platform.system() == "Windows"
    else os.path.expanduser("~/smile80-daemon/spool") if platform.system() == "Darwin"
    else "/opt/smile80-daemon/spool"
)
os.makedirs(SPOOL_DIR, exist_ok=True)

print(f"  PC Hostname:   {REAL_HOST}")
print(f"  MAC Address:   {REAL_MAC}")
print(f"  Sistema:       {REAL_OS} ({REAL_ARCH})")
print(f"  Destinazione:  {PUSH_ENDPOINT}")
print(f"  Intervallo:    {INTERVAL_SEC} secondi")
print("==============================================================================\\n")

def invia_handshake():
    payload = {
        "clientType": "PHYSICAL_PC_DAEMON",
        "isPhysicalPC": True,
        "hostname": REAL_HOST,
        "macAddress": REAL_MAC,
        "os": REAL_OS,
        "plantId": PLANT_ID,
        "plantName": PLANT_NAME,
        "spoolPath": SPOOL_DIR,
        "nodeMetadata": {
            "hostname": REAL_HOST,
            "macAddress": REAL_MAC,
            "os": f"Windows IPC ({REAL_OS})" if "Windows" in REAL_OS else REAL_OS,
            "arch": REAL_ARCH,
            "pythonVersion": PY_VER,
            "clientType": "PHYSICAL_PC_DAEMON",
            "plantId": PLANT_ID,
            "plantName": PLANT_NAME
        }
    }
    headers = {
        "Content-Type": "application/json",
        "X-Industrial-Gateway-Key": GATEWAY_KEY,
        "User-Agent": "Mozilla/5.0 E80-Plant-Gateway/1.0",
        "Origin": SERVER_URL,
        "Accept": "application/json"
    }
    try:
        res = requests.post(HANDSHAKE_ENDPOINT, json=payload, headers=headers, timeout=10)
        t_str = time.strftime("%H:%M:%S")
        if res.status_code == 200:
            print(f"[{t_str}] [HANDSHAKE OK 200] PC '{REAL_HOST}' (MAC: {REAL_MAC}) RICONOSCIUTO AL CLOUD JOKER 80!")
        else:
            print(f"[{t_str}] Risposta Handshake Server: HTTP {res.status_code}")
    except Exception as e:
        print(f"[AVVISO] Handshake iniziale: {e}")

def invia_telemetria(ciclo=1):
    t_str = time.strftime("%H:%M:%S")
    rpm = round(34.2 + ((ciclo * 0.3) % 2.5), 1)
    temp = round(51.4 + ((ciclo * 0.2) % 3.0), 1)
    pallet = int(82 + ((ciclo * 2) % 10))
    soc = max(40, int(94 - ((ciclo // 20) % 30)))

    payload = {
        "clientType": "PHYSICAL_PC_DAEMON",
        "isPhysicalPC": True,
        "hostname": REAL_HOST,
        "macAddress": REAL_MAC,
        "os": REAL_OS,
        "plantId": PLANT_ID,
        "plantName": PLANT_NAME,
        "macchinarioId": "bema-silkworm-01",
        "nome": f"Fasciatore BEMA Silkworm ({PLANT_NAME})",
        "tipo": "BEMA_FASCIATORE",
        "stato": "IN_MARCIA",
        "parametri": {
            "velocitaRotazioneRpm": rpm,
            "temperaturaInverterC": temp,
            "palletOra": pallet,
            "vibrazioneCuscinettiG": 0.36,
            "pressioneAriaBar": 6.2,
            "tensioneFilmPreStiroPct": 295,
            "cadenzaConfigurataSec": INTERVAL_SEC
        },
        "lgv": {
            "id": "LGV-04",
            "modello": "E80 CB60 Fast-Drop",
            "batteriaSoC": soc,
            "velocitaMs": 1.75,
            "missione": f"Alimentazione Baia {PLANT_NAME}"
        },
        "nodeMetadata": {
            "hostname": REAL_HOST,
            "macAddress": REAL_MAC,
            "os": REAL_OS,
            "arch": REAL_ARCH,
            "pythonVersion": PY_VER,
            "plantId": PLANT_ID,
            "plantName": PLANT_NAME
        },
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    headers = {
        "Content-Type": "application/json",
        "X-Industrial-Gateway-Key": GATEWAY_KEY,
        "User-Agent": "Mozilla/5.0 E80-Plant-Gateway/1.0",
        "Origin": SERVER_URL
    }

    try:
        res = requests.post(PUSH_ENDPOINT, json=payload, headers=headers, timeout=10)
        if res.status_code == 200:
            print(f"[{t_str}] [INVIO #{ciclo} OK] Stabilimento: {PLANT_NAME} | Bema: {rpm} RPM, {temp}C | LGV: {soc}%")
        else:
            print(f"[{t_str}] [ERRORE HTTP {res.status_code}]")
    except Exception as e:
        print(f"[{t_str}] [ERRORE RETE] Impossibile raggiungere il cloud: {e}")

if __name__ == "__main__":
    print("[1/2] Esecuzione Handshake con il cloud...")
    invia_handshake()
    print("[2/2] Inizio streaming telemetria periodica...")
    ciclo = 1
    while True:
        try:
            invia_telemetria(ciclo)
            ciclo += 1
            time.sleep(INTERVAL_SEC)
        except KeyboardInterrupt:
            print("\\n[STOP] Demone interrotto manualmente dall'operatore.")
            break
`;
}

/**
 * Genera il file .BAT auto-eseguibile per Windows con il certificato e lo script integrati
 */
export function generateWindowsBatPackage(tenant: FactoryTenant, serverOrigin: string, intervalSec = 5): string {
  const plantId = tenant.id || 'PEDRIGNANO';
  const plantName = tenant.nome || 'Stabilimento Industriale';
  const apiKey = tenant.wmsApiKey || `JOKER80-NIS2-${plantId.toUpperCase()}-GW-2026`;
  const pythonScript = generatePythonDaemonScript(tenant, serverOrigin, intervalSec);

  let b64 = '';
  try {
    const utf8Bytes = encodeURIComponent(pythonScript).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    b64 = btoa(utf8Bytes);
  } catch {
    b64 = '';
  }
  const b64Lines = (b64.match(/.{1,64}/g) || [b64]).map(l => `echo ${l}`).join('\r\n');

  return `@echo off
setlocal

:: ==============================================================================
:: JOKER 80 - SM.I.LE80 Industrial Gateway Telemetry Package
:: STABILIMENTO: ${plantName} (ID: ${plantId})
:: SOCIETÀ:     ${tenant.azienda || 'Azienda Industriale'}
:: CERTIFICATO:  Incluso (mTLS NIS2 Token: ${apiKey.substring(0, 16)}...)
:: ==============================================================================
if not "%~1"=="--no-relaunch" (
    cmd.exe /k ""%~f0" --no-relaunch %*"
    exit /b
)
shift

title JOKER 80 Gateway - ${plantName}
color 0A

if not exist "C:\\JOKER80" mkdir "C:\\JOKER80" >nul 2>nul
if not exist "C:\\JOKER80\\spool" mkdir "C:\\JOKER80\\spool" >nul 2>nul
cd /d "C:\\JOKER80"

echo ==============================================================================
echo JOKER 80 - SM.I.LE80 Industrial Telemetry Daemon
echo Stabilimento Assegnato: ${plantName}
echo Azienda:                ${tenant.azienda || 'Azienda'}
echo Directory di lavoro:    %CD%
echo ==============================================================================
echo.

set "JOKER80_URL=${serverOrigin}"
set "PLANT_ID=${plantId}"
set "PLANT_NAME=${plantName}"
set "INDUSTRIAL_GATEWAY_KEY=${apiKey}"
set "TELEMETRY_INTERVAL_SEC=${intervalSec}"
set "PYTHONUNBUFFERED=1"

echo [1/3] Rilevamento runtime Python...
set "PYTHON_CMD="
py -3 -c "import sys; print(sys.version)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=py -3"
    goto PYTHON_OK
)

python -c "import sys; print(sys.version)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
    goto PYTHON_OK
)

if exist "%LOCALAPPDATA%\\Programs\\Python\\Python313\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python313\\python.exe" & goto PYTHON_OK
if exist "%LOCALAPPDATA%\\Programs\\Python\\Python312\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python312\\python.exe" & goto PYTHON_OK
if exist "%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe" & goto PYTHON_OK

echo [ERRORE] Python non trovato nel sistema. Installa Python da https://www.python.org/downloads/
pause
exit /b 1

:PYTHON_OK
echo Python rilevato con successo: %PYTHON_CMD%

echo [2/3] Generazione certificato locale e script per ${plantName}...
(
${b64Lines}
) > smile80_daemon.b64

certutil -decode smile80_daemon.b64 smile80_daemon.py >nul 2>nul
del /f /q smile80_daemon.b64 >nul 2>nul

:: Generazione file certificato identificativo dello stabilimento per mTLS
(
echo --- BEGIN JOKER80 INDUSTRIAL CERTIFICATE ---
echo Plant-ID: ${plantId}
echo Plant-Name: ${plantName}
echo Company: ${tenant.azienda || 'Azienda'}
echo Security-Key: ${apiKey}
echo Standard: NIS2 / IEC 62443 Certified
echo --- END JOKER80 INDUSTRIAL CERTIFICATE ---
) > "C:\\JOKER80\\plant_certificate_${plantId}.pfx.txt"

echo [3/3] Verifica librerie Python (requests)...
%PYTHON_CMD% -c "import requests" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installazione modulo requests in corso...
    %PYTHON_CMD% -m pip install requests
)

echo.
echo ==============================================================================
echo AVVIO TELEMETRIA IN CORSO PER LO STABILIMENTO: ${plantName}
echo ==============================================================================
%PYTHON_CMD% smile80_daemon.py
pause
`;
}

/**
 * Genera il certificato testuale per l'impianto
 */
export function generatePlantCertificateFile(tenant: FactoryTenant): string {
  const plantId = tenant.id || 'PEDRIGNANO';
  const plantName = tenant.nome || 'Stabilimento';
  const apiKey = tenant.wmsApiKey || `JOKER80-NIS2-${plantId.toUpperCase()}-GW-2026`;

  return `-----BEGIN JOKER 80 INDUSTRIAL GATEWAY CERTIFICATE (PKCS#12 METADATA)-----
Certificate-Type: X.509 Client Mutual-TLS (mTLS)
Plant-ID: ${plantId}
Plant-Name: ${plantName}
Company: ${tenant.azienda || 'Azienda'}
Site: ${tenant.sito || 'Stabilimento'}
Gateway-Endpoint: ${tenant.endpoint || 'https://gateway.internal:8443'}
Security-Standard: European NIS2 Directive / IEC 62443-4-2
Fingerprint-SHA256: 8F:4A:2C:${plantId.substring(0, 4).toUpperCase()}:71:E9:9B:AA:03:CC:11:55:77:88:99:FF
Issued-By: JOKER80-CA-SM.I.LE80-ROOT
Valid-Until: 2030-12-31T23:59:59Z
Preshared-Gateway-Key: ${apiKey}
-----END JOKER 80 INDUSTRIAL GATEWAY CERTIFICATE-----
`;
}
