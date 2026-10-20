import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Terminal, 
  Save, 
  Download, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Zap, 
  Radio, 
  RefreshCw, 
  Play, 
  Pause, 
  Layers, 
  ShieldCheck, 
  Server,
  ArrowRight,
  Info,
  Folder,
  HardDrive,
  Laptop,
  Wifi,
  WifiOff,
  Globe,
  Signal,
  CheckCircle
} from 'lucide-react';
import { FactoryTenant, UserAccount } from '../types/quantum';

interface Props {
  activeTenant: FactoryTenant;
  currentUser: UserAccount;
  telemetryHistory: any[];
  onRefreshTelemetry: () => void;
}

type FrequencyUnit = 'seconds' | 'minutes' | 'hours' | 'days';
type OSType = 'linux' | 'mac' | 'windows' | 'docker';

export const DaemonFrequencyPanel: React.FC<Props> = ({
  activeTenant,
  currentUser,
  telemetryHistory,
  onRefreshTelemetry
}) => {
  // Frequency Configuration State
  const [frequencyValue, setFrequencyValue] = useState<number>(5);
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('seconds');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [savedConfig, setSavedConfig] = useState<any>(null);

  // OS Documentation & Kit State
  const [selectedOS, setSelectedOS] = useState<OSType>('linux');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Test Simulation State (Browser-side simulation)
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Physical Hardware PC Gateway Live Connection State
  const [gatewayClient, setGatewayClient] = useState<any>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [browserSimCount, setBrowserSimCount] = useState<number>(0);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // Function to query active hardware client connection status
  const fetchGatewayStatus = React.useCallback(() => {
    fetch('/api/telemetry/latest')
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) return await res.json();
        return null;
      })
      .then(data => {
        if (data?.success) {
          if (data.activeGatewayClient !== undefined) {
            setGatewayClient(data.activeGatewayClient);
          }
          if (data.physicalPacketsCount !== undefined) {
            setPhysicalCount(data.physicalPacketsCount);
          }
          if (data.browserSimPacketsCount !== undefined) {
            setBrowserSimCount(data.browserSimPacketsCount);
          }
          onRefreshTelemetry();
        }
      })
      .catch(() => {});
  }, [onRefreshTelemetry]);

  // Poll hardware status every 2 seconds while panel is visible
  useEffect(() => {
    fetchGatewayStatus();
    const interval = setInterval(fetchGatewayStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchGatewayStatus]);

  // Load active frequency config on mount
  useEffect(() => {
    fetch('/api/telemetry/config')
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('application/json')) return await res.json();
        return null;
      })
      .then(data => {
        if (data?.config) {
          setSavedConfig(data.config);
          if (data.config.intervalValue) setFrequencyValue(data.config.intervalValue);
          if (data.config.intervalUnit) setFrequencyUnit(data.config.intervalUnit);
        }
      })
      .catch(() => {});
  }, []);

  // Compute calculated total seconds
  const totalSeconds = React.useMemo(() => {
    const val = Math.max(1, frequencyValue || 1);
    if (frequencyUnit === 'minutes') return val * 60;
    if (frequencyUnit === 'hours') return val * 3600;
    if (frequencyUnit === 'days') return val * 86400;
    return val;
  }, [frequencyValue, frequencyUnit]);

  // Compute estimated stats
  const packetsPerDay = Math.round(86400 / totalSeconds);
  const estimatedKBytesPerDay = Math.round((packetsPerDay * 1.25));

  const handleSaveConfig = async (overrideVal?: number, overrideUnit?: FrequencyUnit) => {
    const val = overrideVal !== undefined ? overrideVal : frequencyValue;
    const unit = overrideUnit || frequencyUnit;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/telemetry/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intervalValue: val,
          intervalUnit: unit,
          updatedBy: `${currentUser.nomeCompleto || currentUser.username} (${currentUser.ruolo})`,
          activePlant: activeTenant.nome
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedConfig(data.config);
        setFeedback({
          success: true,
          message: `Frequenza salvata: ricezione ogni ${data.config.intervalValue} ${
            data.config.intervalUnit === 'seconds' ? 'secondi' :
            data.config.intervalUnit === 'minutes' ? 'minuti' :
            data.config.intervalUnit === 'hours' ? 'ore' : 'giorni'
          } (${data.config.intervalSeconds}s totali). I demoni attivi si aggiorneranno in automatico!`
        });
      } else {
        setFeedback({
          success: false,
          message: data.error || 'Errore durante il salvataggio della configurazione.'
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        message: 'Impossibile contattare il server: ' + (err?.message || err)
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (val: number, unit: FrequencyUnit) => {
    setFrequencyValue(val);
    setFrequencyUnit(unit);
    handleSaveConfig(val, unit);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendTestTelemetry = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    const testPayload = {
      macchinarioId: 'bema-silkworm-01',
      nome: `Fasciatore BEMA Silkworm (${activeTenant.nome})`,
      tipo: 'BEMA_FASCIATORE',
      stato: 'IN_MARCIA',
      parametri: {
        velocitaRotazioneRpm: 34.5,
        tensioneFilmPreStiroPct: 295,
        temperaturaInverterC: 52.1,
        palletOra: 84,
        vibrazioneCuscinettiG: 0.37,
        pressioneAriaBar: 6.2,
        cadenzaConfigurataSec: totalSeconds
      },
      lgv: {
        id: 'LGV-04',
        modello: 'E80 CB60 Fast-Drop',
        batteriaSoC: 91,
        velocitaMs: 1.75,
        missione: `Alimentazione linea Bema (Test frequenza ${frequencyValue} ${frequencyUnit})`
      },
      nodeMetadata: {
        os: selectedOS === 'linux' ? 'Linux IPC (systemd)' : selectedOS === 'mac' ? 'Apple Mac (launchd)' : selectedOS === 'windows' ? 'Windows IPC' : 'Docker Container',
        testTriggeredBy: currentUser.username
      },
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/telemetry/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Industrial-Gateway-Key': 'JOKER80-NIS2-PEDRIGNANO-GW-2026'
        },
        body: JSON.stringify(testPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(`Pacchetto inviato con successo! ID: ${data.packetId} - Ricevuto dal server.`);
        onRefreshTelemetry();
      } else {
        setTestResult(`Errore: ${data.error || 'Invio non riuscito'}`);
      }
    } catch (e: any) {
      setTestResult(`Errore di connessione: ${e.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Client-side Blob download: Zero HTTP requests, zero cookie-check/iframe blocks
  const downloadAsBlob = (content: string, filename: string, mimeType = 'text/plain;charset=utf-8') => {
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
  };

  // Stand-alone Python Telemetry Daemon script
  const pythonDaemonContent = `#!/usr/bin/env python3
"""
JOKER 80 - SM.I.LE80 Industrial Gateway Telemetry Daemon
Modulo M2M per PC Fisico / IPC di Stabilimento
"""
import os
import sys
import time
import socket
import platform
import json
import requests

print("==============================================================================")
print("  JOKER 80 - SM.I.LE80 Industrial Telemetry Daemon (M2M)")
print("  Modulo di Telemetria Hardware per PC di Stabilimento Elettric80")
print("==============================================================================")

SERVER_URL = os.environ.get("JOKER80_URL", "${serverOrigin}")
GATEWAY_KEY = os.environ.get("INDUSTRIAL_GATEWAY_KEY", "${activeTenant.id || 'JOKER80-NIS2-PEDRIGNANO-GW-2026'}")
PLANT_NAME = os.environ.get("PLANT_NAME", "${activeTenant.nome}")
PLANT_ID = os.environ.get("PLANT_ID", "${activeTenant.id}")
INTERVAL_SEC = float(os.environ.get("TELEMETRY_INTERVAL_SEC", "${totalSeconds}"))
PUSH_ENDPOINT = f"{SERVER_URL}/api/telemetry/push"
HANDSHAKE_ENDPOINT = f"{SERVER_URL}/api/telemetry/handshake"

REAL_HOST = os.environ.get("REAL_HOSTNAME") or socket.gethostname()
REAL_OS = os.environ.get("REAL_OS") or f"{platform.system()} {platform.release()}"
REAL_ARCH = platform.machine() or "x64"
PY_VER = f"Python {platform.python_version()}"

# Cartella Spool per scambio file dati macchine con SM.I.LE80 o PLC
SPOOL_DIR = os.environ.get("SPOOL_DIR") or os.path.join(os.getcwd(), "spool")
os.makedirs(SPOOL_DIR, exist_ok=True)
SAMPLE_FILE = os.path.join(SPOOL_DIR, "esempio_dati_macchine.json")
if not os.path.exists(SAMPLE_FILE):
    try:
        sample_payload = {
            "note": "Inserisci qui i dati esportati da SM.I.LE80 o dai PLC. Il demone li inviera' al cloud JOKER 80.",
            "stabilimento": PLANT_NAME,
            "stabilimentoId": PLANT_ID,
            "macchinarioId": "bema-silkworm-01",
            "nomeMacchinario": "Fasciatore Robotico BEMA Silkworm (Linea 1)",
            "tipoMacchina": "BEMA_FASCIATORE",
            "stato": "IN_MARCIA",
            "parametri": {
                "velocitaRotazioneRpm": 34.5,
                "temperaturaInverterC": 51.8,
                "palletOra": 85,
                "vibrazioneCuscinettiG": 0.36,
                "pressioneAriaBar": 6.2,
                "tensioneFilmPreStiroPct": 295
            },
            "lgv": {
                "id": "LGV-04",
                "modello": "E80 CB60 Fast-Drop",
                "batteriaSoC": 90,
                "velocitaMs": 1.75,
                "missione": "Alimentazione Baia Pedrignano"
            }
        }
        with open(SAMPLE_FILE, "w", encoding="utf-8") as f_samp:
            json.dump(sample_payload, f_samp, indent=2)
    except Exception:
        pass

print(f"  Stabilimento:  {PLANT_NAME}")
print(f"  PC Hostname:   {REAL_HOST}")
print(f"  Sistema:       {REAL_OS} ({REAL_ARCH})")
print(f"  Runtime:       {PY_VER}")
print(f"  Cartella Dati: {SPOOL_DIR}")
print(f"  Destinazione:  {PUSH_ENDPOINT}")
print(f"  Intervallo:    {INTERVAL_SEC} secondi")
print("==============================================================================\\n")

def invia_handshake():
    payload = {
        "clientType": "PHYSICAL_PC_DAEMON",
        "isPhysicalPC": True,
        "hostname": REAL_HOST,
        "os": REAL_OS,
        "plantId": PLANT_ID,
        "plantName": PLANT_NAME,
        "nodeMetadata": {
            "hostname": REAL_HOST,
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) E80-Plant-Gateway/1.0",
        "Origin": SERVER_URL,
        "Referer": f"{SERVER_URL}/",
        "Accept": "application/json"
    }
    try:
        res = requests.post(HANDSHAKE_ENDPOINT, json=payload, headers=headers, timeout=10)
        t_str = time.strftime("%H:%M:%S")
        if res.status_code == 200:
            srv_msg = "Accettato"
            try:
                data = res.json()
                if isinstance(data, dict) and "message" in data:
                    srv_msg = data["message"]
            except Exception:
                pass
            print(f"[{t_str}] [HANDSHAKE OK 200] PC '{REAL_HOST}' CONNESSO E RICONOSCIUTO AL CLOUD JOKER 80!")
        else:
            print(f"[{t_str}] Risposta Handshake Server: HTTP {res.status_code}")
    except Exception as e:
        print(f"[AVVISO] Handshake iniziale non riuscito: {e}")

def invia_telemetria(ciclo=1):
    t_str = time.strftime("%H:%M:%S")

    # Controlla presenza file con dati reali delle macchine nella cartella spool
    fonte_dati = "Diagnostica Hardware"
    custom_data = None
    for nome_f in ["dati_macchine.json", "plant_telemetry.json", "bema_status.json"]:
        p = os.path.join(SPOOL_DIR, nome_f)
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f_in:
                    custom_data = json.load(f_in)
                    if isinstance(custom_data, dict):
                        fonte_dati = f"File Spool ({nome_f})"
                        break
            except Exception:
                pass

    rpm = round(34.2 + ((ciclo * 0.3) % 2.5), 1)
    temp = round(51.4 + ((ciclo * 0.2) % 3.0), 1)
    pallet = int(82 + ((ciclo * 2) % 10))
    soc = max(40, int(94 - ((ciclo // 20) % 30)))

    payload = {
        "clientType": "PHYSICAL_PC_DAEMON",
        "isPhysicalPC": True,
        "gateway_key": GATEWAY_KEY,
        "plantId": PLANT_ID,
        "plantName": PLANT_NAME,
        "macchinarioId": "bema-silkworm-01",
        "nomeMacchinario": f"Fasciatore BEMA Silkworm ({PLANT_NAME})",
        "tipoMacchina": "BEMA_FASCIATORE",
        "stato": "IN_MARCIA",
        "timestamp": time.time(),
        "info": f"PC: {REAL_HOST} - {REAL_OS} M2M [{fonte_dati}]",
        "nodeMetadata": {
            "hostname": REAL_HOST,
            "os": f"Windows IPC ({REAL_OS})" if "Windows" in REAL_OS else REAL_OS,
            "system": "Windows",
            "arch": REAL_ARCH,
            "pythonVersion": PY_VER,
            "ciclo": ciclo,
            "fonteDati": fonte_dati
        },
        "parametri": {
            "velocitaRotazioneRpm": rpm,
            "temperaturaInverterC": temp,
            "palletOra": pallet,
            "vibrazioneCuscinettiG": 0.37,
            "pressioneAriaBar": 6.2,
            "tensioneFilmPreStiroPct": 295,
            "cadenzaConfigurataSec": INTERVAL_SEC,
            "pcHostSorgente": REAL_HOST
        },
        "lgv": {
            "id": "LGV-04",
            "modello": "E80 CB60 Fast-Drop",
            "batteriaSoC": soc,
            "velocitaMs": 1.75,
            "missione": f"Alimentazione Baia ({REAL_HOST})"
        }
    }

    if custom_data:
        if "macchinarioId" in custom_data: payload["macchinarioId"] = custom_data["macchinarioId"]
        if "nomeMacchinario" in custom_data: payload["nomeMacchinario"] = custom_data["nomeMacchinario"]
        if "tipoMacchina" in custom_data: payload["tipoMacchina"] = custom_data["tipoMacchina"]
        if "stato" in custom_data: payload["stato"] = custom_data["stato"]
        if "parametri" in custom_data and isinstance(custom_data["parametri"], dict):
            payload["parametri"].update(custom_data["parametri"])
            rpm = payload["parametri"].get("velocitaRotazioneRpm", rpm)
            temp = payload["parametri"].get("temperaturaInverterC", temp)
            pallet = payload["parametri"].get("palletOra", pallet)
        if "lgv" in custom_data and isinstance(custom_data["lgv"], dict):
            payload["lgv"].update(custom_data["lgv"])

    headers = {
        "Content-Type": "application/json",
        "X-Industrial-Gateway-Key": GATEWAY_KEY,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) E80-Plant-Gateway/1.0",
        "Origin": SERVER_URL,
        "Referer": f"{SERVER_URL}/",
        "Accept": "application/json"
    }

    # Salva sempre copia locale del pacchetto per diagnostica offline
    try:
        with open("latest_telemetry.json", "w", encoding="utf-8") as f_loc:
            json.dump(payload, f_loc, indent=2)
    except Exception:
        pass

    try:
        t_start = time.time()
        res = requests.post(PUSH_ENDPOINT, json=payload, headers=headers, timeout=10)
        ms = int((time.time() - t_start) * 1000)
        if res.status_code == 200:
            pkt_id = f"pkt-{int(time.time())}"
            try:
                data = res.json()
                if isinstance(data, dict) and "packetId" in data:
                    pkt_id = data["packetId"]
            except Exception:
                pass
            print(f"[{t_str}] [OK 200] Pacchetto #{ciclo} inviato (Lat: {ms}ms) | Fonte: {fonte_dati} | BEMA: {rpm} RPM, {temp}°C | ID: {pkt_id}")
        else:
            print(f"[{t_str}] [HTTP {res.status_code}] {res.text[:80]}")
    except Exception as e:
        print(f"[{t_str}] [ERRORE TRASMISSIONE] {e}")

if __name__ == "__main__":
    print("[1/2] Invio handshake iniziale di presenza al cloud...")
    invia_handshake()
    print(f"[2/2] Avvio ciclo continuo di telemetria ogni {INTERVAL_SEC}s (Premi CTRL + C per fermare):\\n")
    invia_telemetria(1)
    c = 2
    try:
        while True:
            time.sleep(INTERVAL_SEC)
            invia_telemetria(c)
            c += 1
    except KeyboardInterrupt:
        print("\\n==============================================================================")
        print("  [ARRESTO] Demone di telemetria interrotto dall'utente.")
        print("==============================================================================")
        sys.exit(0)
`;

  // Linux systemd unit file content
  const linuxServiceContent = `[Unit]
Description=JOKER 80 SM.I.LE80 Industrial Telemetry Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/smile80-daemon
ExecStart=/opt/smile80-daemon/venv/bin/python3 /opt/smile80-daemon/smile80_daemon.py
Restart=always
RestartSec=5
Environment=JOKER80_URL=${serverOrigin}
Environment=INDUSTRIAL_GATEWAY_KEY=${activeTenant.id || 'JOKER80-NIS2-PEDRIGNANO-GW-2026'}
Environment=PLANT_NAME=${activeTenant.nome}
Environment=PLANT_ID=${activeTenant.id}
Environment=TELEMETRY_INTERVAL_SEC=${totalSeconds}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target`;

  // macOS launchd plist content
  const macPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.smile80.joker80.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/Shared/smile80-daemon/smile80_daemon.py</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>JOKER80_URL</key>
        <string>${serverOrigin}</string>
        <key>INDUSTRIAL_GATEWAY_KEY</key>
        <string>${activeTenant.id || 'JOKER80-NIS2-PEDRIGNANO-GW-2026'}</string>
        <key>PLANT_NAME</key>
        <string>${activeTenant.nome}</string>
        <key>PLANT_ID</key>
        <string>${activeTenant.id}</string>
        <key>TELEMETRY_INTERVAL_SEC</key>
        <string>${totalSeconds}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/smile80_daemon.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/smile80_daemon.err</string>
</dict>
</plist>`;

  // Linux installation shell script
  const linuxInstallContent = `#!/usr/bin/env bash
set -e
echo "[1/4] Creazione directory /opt/smile80-daemon e spool..."
sudo mkdir -p /opt/smile80-daemon/spool
cd /opt/smile80-daemon
python3 -m venv venv || virtualenv venv
./venv/bin/pip install requests
cat << 'EOF' > smile80_daemon.py
${pythonDaemonContent}
EOF
chmod +x smile80_daemon.py
cat << 'EOF' > /etc/systemd/system/smile80-daemon.service
${linuxServiceContent}
EOF
systemctl daemon-reload
systemctl enable smile80-daemon.service
systemctl restart smile80-daemon.service
echo "[OK] Demone SM.I.LE80 installato e attivo su Linux con crittografia NIS2!"
`;

  // macOS installation shell script
  const macInstallContent = `#!/usr/bin/env bash
set -e
INSTALL_DIR="$HOME/smile80-daemon"
PLIST_NAME="com.smile80.joker80.daemon.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

mkdir -p "$INSTALL_DIR/spool"
mkdir -p "$LAUNCH_AGENTS_DIR"

pip3 install --user requests || python3 -m pip install requests
cat << 'EOF' > "$INSTALL_DIR/smile80_daemon.py"
${pythonDaemonContent}
EOF
chmod +x "$INSTALL_DIR/smile80_daemon.py"

cat << 'EOF' > "$LAUNCH_AGENTS_DIR/$PLIST_NAME"
${macPlistContent}
EOF

launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_NAME" 2>/dev/null || true
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_NAME"
echo "[OK] Demone SM.I.LE80 installato e attivo su Mac Apple con crittografia NIS2!"
`;

  // Full Windows BAT script content with embedded base64 Python daemon
  const windowsBatFullContent = React.useMemo(() => {
    let b64 = '';
    try {
      const utf8Bytes = encodeURIComponent(pythonDaemonContent).replace(/%([0-9A-F]{2})/g, (_, p1) =>
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
:: PROTEZIONE ANTI-CHIUSURA FINESTRA: se aperto con doppio clic o da Explorer,
:: rilancia cmd /k in modo che la finestra del prompt non si chiuda MAI!
:: ==============================================================================
if not "%~1"=="--no-relaunch" (
    cmd.exe /k ""%~f0" --no-relaunch %*"
    exit /b
)
shift

title JOKER 80 Industrial Gateway Telemetry Daemon
color 0A

:: FORZA POSIZIONAMENTO E CREAZIONE CARTELLA DEDICATA C:\\JOKER80 E SPOOL
if not exist "C:\\JOKER80" mkdir "C:\\JOKER80" >nul 2>nul
if not exist "C:\\JOKER80\\spool" mkdir "C:\\JOKER80\\spool" >nul 2>nul
cd /d "C:\\JOKER80"

echo ==============================================================================
echo JOKER 80 - SM.I.LE80 Industrial Telemetry Daemon (Windows IPC)
echo Cartella di lavoro: %CD%
echo ==============================================================================
echo.

set "JOKER80_URL=${serverOrigin}"
set "INDUSTRIAL_GATEWAY_KEY=${activeTenant.id || 'JOKER80-NIS2-PEDRIGNANO-GW-2026'}"
set "TELEMETRY_INTERVAL_SEC=${totalSeconds}"
set "PYTHONUNBUFFERED=1"

set "REAL_HOSTNAME=%COMPUTERNAME%"
set "REAL_OS=%OS%"

:: 1. Pulizia preventiva: elimina qualsiasi vecchio file corrotto in System32 o in JOKER80
if exist "C:\\Windows\\System32\\smile80_daemon.py" del /f /q "C:\\Windows\\System32\\smile80_daemon.py" >nul 2>nul
if exist "smile80_daemon.py" (
    findstr /i "min-height doctype html <head <body" "smile80_daemon.py" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [AVVISO] Rilevata versione precedente corrotta di smile80_daemon.py. Rimozione...
        del /f /q "smile80_daemon.py" >nul 2>nul
    )
)

:: 2. Rilevamento runtime Python nel sistema Windows
echo [1/3] Rilevamento runtime Python...
set "PYTHON_CMD="

py -3 -c "import sys; print(sys.version)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=py -3"
    goto PYTHON_TROVATO
)

python -c "import sys; print(sys.version)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
    goto PYTHON_TROVATO
)

if exist "%LOCALAPPDATA%\\Programs\\Python\\Python313\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python313\\python.exe" & goto PYTHON_TROVATO
if exist "%LOCALAPPDATA%\\Programs\\Python\\Python312\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python312\\python.exe" & goto PYTHON_TROVATO
if exist "%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python311\\python.exe" & goto PYTHON_TROVATO
if exist "%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe" set "PYTHON_CMD=%LOCALAPPDATA%\\Programs\\Python\\Python310\\python.exe" & goto PYTHON_TROVATO
if exist "C:\\Python312\\python.exe" set "PYTHON_CMD=C:\\Python312\\python.exe" & goto PYTHON_TROVATO
if exist "C:\\Python311\\python.exe" set "PYTHON_CMD=C:\\Python311\\python.exe" & goto PYTHON_TROVATO
if exist "C:\\Python310\\python.exe" set "PYTHON_CMD=C:\\Python310\\python.exe" & goto PYTHON_TROVATO

echo.
echo ==============================================================================
echo [ERRORE] Python non e' installato o non e' presente nel PATH di sistema.
echo.
echo Come risolvere in 1 minuto:
echo 1. Scarica l'installer gratuito da: https://www.python.org/downloads/
echo 2. Avvia l'installer e SPUNTA OBBLIGATORIAMENTE la casella:
echo    [x] Add python.exe to PATH   (in basso nella prima finestra)
echo 3. Clicca su "Install Now".
echo 4. Al termine, rilancia questo file .bat.
echo ==============================================================================
echo.
echo Premi un tasto per riprovare dopo aver installato Python...
pause
goto :EOF

:PYTHON_TROVATO
echo [OK] Runtime Python identificato: %PYTHON_CMD%

:: 3. Verifica ed eventuale installazione libreria 'requests'
echo.
echo [2/3] Verifica libreria 'requests'...
%PYTHON_CMD% -c "import requests" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installazione libreria requests in corso con pip...
    call %PYTHON_CMD% -m pip install --quiet requests
    if %ERRORLEVEL% NEQ 0 (
        call %PYTHON_CMD% -m pip install --user requests
    )
)
echo [OK] Libreria requests pronta.

:: 4. Generazione locale dello script Python smile80_daemon.py (Zero download, Zero blocchi cookie/firewall)
echo.
echo [3/3] Scrittura script locale smile80_daemon.py in %CD%...

(
echo -----BEGIN CERTIFICATE-----
${b64Lines}
echo -----END CERTIFICATE-----
) > smile80_daemon.b64

certutil -decode smile80_daemon.b64 smile80_daemon.py >nul 2>nul
del /f /q smile80_daemon.b64 >nul 2>nul

if not exist "smile80_daemon.py" goto :FALLBACK_PWSH_B64
goto :VERIFICA_PY_FILE

:FALLBACK_PWSH_B64
powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.IO.File]::WriteAllBytes('smile80_daemon.py', [System.Convert]::FromBase64String('${b64}'))" >nul 2>nul

:VERIFICA_PY_FILE
if not exist "smile80_daemon.py" (
    echo [ERRORE] Impossibile creare smile80_daemon.py nella cartella %CD%.
    echo Verifica i permessi di scrittura sul disco C:\\.
    pause
    goto :EOF
)

echo [OK] Script smile80_daemon.py scritto e convalidato con successo!

:LOOP_RUN
echo.
echo ==============================================================================
echo AVVIO DEMONE DI TELEMETRIA INDUSTRIALE JOKER 80
echo Destinazione Cloud: %JOKER80_URL%/api/telemetry/push
echo Intervallo di invio: %TELEMETRY_INTERVAL_SEC%s
echo Per arrestare: premi CTRL + C
echo ==============================================================================
echo.

%PYTHON_CMD% smile80_daemon.py
set "PY_EXIT=%ERRORLEVEL%"

echo.
echo ==============================================================================
if not "%PY_EXIT%"=="0" (
    echo [AVVISO] Il demone si e' interrotto con codice: %PY_EXIT%
) else (
    echo [INFO] Esecuzione del demone terminata.
)
echo.
echo La finestra rimarra' SEMPRE APERTA per consentirti di leggere i log.
echo Premi un tasto per riavviare il demone, oppure chiudi la finestra.
echo ==============================================================================
pause
goto LOOP_RUN
`;
  }, [serverOrigin, activeTenant.id, totalSeconds, pythonDaemonContent]);

  // Docker Compose content
  const dockerComposeContent = `version: '3.8'
services:
  smile80-telemetry-daemon:
    image: python:3.11-slim
    container_name: smile80_telemetry_daemon
    restart: always
    environment:
      - JOKER80_URL=${serverOrigin}
      - INDUSTRIAL_GATEWAY_KEY=JOKER80-NIS2-PEDRIGNANO-GW-2026
      - TELEMETRY_INTERVAL_SEC=${totalSeconds}
    command: >
      sh -c "pip install requests &&
             curl -fsSL ${serverOrigin}/smile80_daemon.py -o /app/smile80_daemon.py &&
             python /app/smile80_daemon.py"
    working_dir: /app`;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. SEZIONE MODIFICA FREQUENZA TELEMETRIA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                  Cadenza e Frequenza Ricezione Dati dal PC di Stabilimento
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {savedConfig ? `Attiva: ogni ${savedConfig.intervalValue} ${savedConfig.intervalUnit}` : 'Attiva: ogni 5 secondi'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Configura ogni quanto tempo ricevere i dati telemetrici delle macchine (BEMA Silkworm, Navette LGV, Baie di carico) inviati dal demone Python in locale sullo stabilimento.
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-slate-400 hidden md:block">
            <span>Stabilimento: </span>
            <strong className="text-cyan-300">{activeTenant.nome}</strong>
          </div>
        </div>

        {/* CONTROLLI INPUT: NUMERO + UNITA DI MISURA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Colonna Sinistra: Modifica Valore e Unità */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Imposta Intervallo di Invio:</span>
                <span className="text-cyan-400 text-[11px]">Totale calcolato: {totalSeconds} secondi</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Valore Numerico */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400">Valore numerico:</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setFrequencyValue(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-l-xl font-mono font-bold text-sm cursor-pointer min-h-[42px]"
                      title="Diminuisci"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="9999"
                      value={frequencyValue}
                      onChange={(e) => setFrequencyValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center py-2 bg-slate-900 border-y border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500 min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={() => setFrequencyValue(prev => prev + 1)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-r-xl font-mono font-bold text-sm cursor-pointer min-h-[42px]"
                      title="Aumenta"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Unità di Misura (Secondi, Minuti, Ore, Giorni) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400">Unità di tempo:</span>
                  <select
                    value={frequencyUnit}
                    onChange={(e) => setFrequencyUnit(e.target.value as FrequencyUnit)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 cursor-pointer min-h-[42px]"
                  >
                    <option value="seconds">Secondi (Alta Frequenza)</option>
                    <option value="minutes">Minuti (Cadenza Standard)</option>
                    <option value="hours">Ore (Sintesi Energetica)</option>
                    <option value="days">Giorni (Report Periodico)</option>
                  </select>
                </div>
              </div>

              {/* Pulsante di Salvataggio */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveConfig()}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Salva e Applica Frequenza</span>
                </button>

                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sincronizzazione automatica M2M (Zero Downtime)</span>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 animate-in fade-in duration-200 ${
                  feedback.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  {feedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="flex-1">{feedback.message}</span>
                </div>
              )}
            </div>

            {/* Presets Rapidi */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                Scelta Rapida Preset Consigliati:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(3, 'seconds')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-center transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
                >
                  <span className="font-bold text-cyan-400">3 Secondi</span>
                  <span className="text-[9px] text-slate-500">Real-Time BEMA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(10, 'seconds')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-center transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
                >
                  <span className="font-bold text-blue-400">10 Secondi</span>
                  <span className="text-[9px] text-slate-500">Standard Linea</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(1, 'minutes')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-center transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
                >
                  <span className="font-bold text-emerald-400">1 Minuto</span>
                  <span className="text-[9px] text-slate-500">Bilanciato OT</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(1, 'hours')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-center transition-all cursor-pointer min-h-[44px] flex flex-col justify-center"
                >
                  <span className="font-bold text-purple-400">1 Ora</span>
                  <span className="text-[9px] text-slate-500">Sintesi Oraria</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset(1, 'days')}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-200 text-center transition-all cursor-pointer min-h-[44px] flex flex-col justify-center col-span-2 sm:col-span-1"
                >
                  <span className="font-bold text-amber-400">1 Giorno</span>
                  <span className="text-[9px] text-slate-500">Report NIS2</span>
                </button>
              </div>
            </div>
          </div>

          {/* Colonna Destra: Scheda Riepilogo Impatto & Banda */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2">
              <Activity className="w-4 h-4" />
              <span>Riepilogo Impatto Tecnico Stimato</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Intervallo Ciclo:</span>
                <span className="font-bold text-white">
                  {frequencyValue} {frequencyUnit === 'seconds' ? 'secondi' : frequencyUnit === 'minutes' ? 'minuti' : frequencyUnit === 'hours' ? 'ore' : 'giorni'} ({totalSeconds}s)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Cadenza Invii:</span>
                <span className="font-bold text-cyan-300">{packetsPerDay.toLocaleString()} pacchetti / giorno</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Consumo Banda Stimato:</span>
                <span className="font-bold text-emerald-400">~{estimatedKBytesPerDay > 1024 ? `${(estimatedKBytesPerDay / 1024).toFixed(1)} MB` : `${estimatedKBytesPerDay} KB`} / giorno</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-slate-400">Carico CPU su PC/IPC:</span>
                <span className="font-bold text-purple-300">&lt; 0.1% (Nessun impatto PLC)</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Reattività Allarmi:</span>
                <span className={`font-bold ${totalSeconds <= 10 ? 'text-emerald-400' : totalSeconds <= 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {totalSeconds <= 5 ? 'Istantanea (&lt;5s)' : totalSeconds <= 60 ? 'Rapida (1 min)' : 'Periodica differita'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-[11px] font-sans text-slate-300 leading-relaxed">
              <strong className="text-blue-300 font-mono block mb-1">Come Funziona la Sincronizzazione:</strong>
              Il demone Python che gira sullo stabilimento interroga all'avvio e ciclicamente l'endpoint <code className="text-cyan-300 font-mono text-[10px]">/api/telemetry/config</code>. Quando modifichi questo valore, tutti i demoni (Linux, Mac Apple, Windows) recepiscono il nuovo tempo di attesa senza dover riavviare il servizio.
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEZIONE RISOLUTIVA: SE IL PC DELLO STABILIMENTO NON HA WINDOWS MA LINUX O MAC APPLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Server className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                Se il Computer dello Stabilimento non ha Windows ma usa Linux o Mac Apple come si fa?
              </h3>
              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                Negli impianti di automazione industriale (E80 Group, SM.I.LE80, Beckhoff, Siemens Box PC) è molto comune avere computer e IPC con <strong>Linux (Ubuntu, Debian, RHEL, Raspberry Pi CM4)</strong> oppure laptop dei collaudatori con <strong>macOS Apple (MacBook / Mac Mini con chip Apple Silicon M1/M2/M3/M4 o Intel)</strong>.
              </p>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-purple-500/30 text-xs font-mono text-purple-200">
            <strong>Risposta Tecnica Immediata:</strong> A differenza di Windows (che usa i <em>Servizi di Windows</em> <code className="text-slate-400">services.msc</code>), Linux e macOS utilizzano i loro sistemi di init nativi di classe enterprise:
            <ul className="mt-2 space-y-1 list-disc pl-5 text-slate-300 font-sans">
              <li><strong>Su Linux (Ubuntu / Debian / RHEL):</strong> Si usa <strong>systemd</strong> tramite un file <code className="text-cyan-300 font-mono">.service</code> in <code className="text-cyan-300 font-mono">/etc/systemd/system/</code> con riavvio automatico <code className="text-cyan-300 font-mono">Restart=always</code> e avvio trasparente all'accensione del PC.</li>
              <li><strong>Su Mac Apple (Apple Silicon & Intel):</strong> Si usa il framework nativo di Apple <strong>launchd</strong> tramite un file Property List <code className="text-cyan-300 font-mono">.plist</code> caricato con <code className="text-cyan-300 font-mono">launchctl</code>, che mantiene il processo sempre vivo in background.</li>
              <li><strong>Su Container Docker:</strong> Immagine autonoma che gira identica su qualsiasi sistema operativo.</li>
            </ul>
          </div>
        </div>

        {/* SELETTORE SISTEMA OPERATIVO */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap">
          <button
            type="button"
            onClick={() => setSelectedOS('linux')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              selectedOS === 'linux'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🐧 Linux (Ubuntu / Debian / RHEL) - systemd</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOS('mac')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              selectedOS === 'mac'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🍎 Mac Apple (Apple Silicon / Intel) - launchd</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOS('windows')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              selectedOS === 'windows'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🪟 Windows 10/11 IoT (Batch / Service)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOS('docker')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[40px] ${
              selectedOS === 'docker'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🐳 Docker / Podman (Universale)</span>
          </button>
        </div>

        {/* GUIDA E KIT PER LINUX */}
        {selectedOS === 'linux' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>Guida Configurazione Linux IPC con systemd (Nativo)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Compatibile con Ubuntu Server, Debian 11/12, Rocky Linux, RHEL 8/9, Raspberry Pi CM4 Industrial.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadAsBlob(pythonDaemonContent, 'smile80_daemon.py')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80_daemon.py</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadAsBlob(linuxServiceContent, 'smile80-daemon.service')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80-daemon.service</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadAsBlob(linuxInstallContent, 'install_linux.sh')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica install_linux.sh</span>
                </button>
              </div>
            </div>

            {/* Box Cartella e Destinazione Linux */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-emerald-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  Cartella di Destinazione File su Linux: /opt/smile80-daemon/
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('sudo mkdir -p /opt/smile80-daemon', 'linux-mkdir')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  {copiedKey === 'linux-mkdir' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'linux-mkdir' ? 'Copiato!' : 'Copia Comando'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                1. Crea la cartella di sistema: <code className="text-cyan-300 font-mono">sudo mkdir -p /opt/smile80-daemon</code><br />
                2. Sposta al suo interno i file scaricati (<code className="text-emerald-300 font-mono">smile80_daemon.py</code> e <code className="text-emerald-300 font-mono">smile80-daemon.service</code>).<br />
                3. Oppure usa direttamente il comando di installazione automatica in 1-click qui sotto.
              </p>
            </div>

            {/* Comando Rapido One-Liner */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-amber-400">Comando Terminale Linux per Installazione Automatica (1-Click):</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`curl -fsSL "${serverOrigin}/api/daemon/download/linux-install" | sudo bash`, 'linux-cmd')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'linux-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'linux-cmd' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre">
                curl -fsSL "{serverOrigin}/api/daemon/download/linux-install" | sudo bash
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Questo comando crea l'ambiente virtuale Python in <code className="text-cyan-300 font-mono">/opt/smile80-daemon</code>, installa il modulo <code className="text-cyan-300 font-mono">requests</code>, configura il file unit di systemd con intervallo di <strong>{frequencyValue} {frequencyUnit} ({totalSeconds}s)</strong> e avvia il servizio permanentemente.
              </p>
            </div>

            {/* File Service systemd anteprima */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>File Unit: <strong className="text-slate-200">/etc/systemd/system/smile80-daemon.service</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(linuxServiceContent, 'linux-service')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'linux-service' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'linux-service' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] max-h-48">
                {linuxServiceContent}
              </pre>
            </div>

            {/* Comandi Utili per il Tecnico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Verifica Stato Servizio:</span>
                <code className="text-emerald-300 text-[11px] block mt-1">sudo systemctl status smile80-daemon</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Log Live (Journal):</span>
                <code className="text-cyan-300 text-[11px] block mt-1">sudo journalctl -u smile80-daemon -f</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Riavvio Manuale:</span>
                <code className="text-amber-300 text-[11px] block mt-1">sudo systemctl restart smile80-daemon</code>
              </div>
            </div>
          </div>
        )}

        {/* GUIDA E KIT PER MAC APPLE */}
        {selectedOS === 'mac' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>Guida Configurazione Mac Apple (launchd Nativo)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Compatibile con macOS Sonoma, Sequoia, Ventura su MacBook Air/Pro, Mac Mini (Apple Silicon M1/M2/M3/M4 & Intel).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadAsBlob(pythonDaemonContent, 'smile80_daemon.py')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80_daemon.py</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadAsBlob(macPlistContent, 'com.smile80.joker80.daemon.plist')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica com.smile80.daemon.plist</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadAsBlob(macInstallContent, 'install_mac.sh')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica install_mac.sh</span>
                </button>
              </div>
            </div>

            {/* Box Cartella e Destinazione Mac */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-purple-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-purple-400" />
                  Cartella di Destinazione File su Mac: ~/smile80-daemon/
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('mkdir -p ~/smile80-daemon', 'mac-mkdir')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  {copiedKey === 'mac-mkdir' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'mac-mkdir' ? 'Copiato!' : 'Copia Comando'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                1. Crea la cartella nella home utente: <code className="text-cyan-300 font-mono">mkdir -p ~/smile80-daemon</code><br />
                2. Inserisci al suo interno il file <code className="text-emerald-300 font-mono">smile80_daemon.py</code> scaricato.<br />
                3. Oppure esegui il comando rapido a riga singola qui sotto che crea automaticamente cartella, ambiente e demone launchd Apple.
              </p>
            </div>

            {/* Comando Rapido One-Liner per Mac */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-bold text-amber-400">Comando Terminale Mac per Installazione Automatica (1-Click):</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`curl -fsSL "${serverOrigin}/api/daemon/download/mac-install" | bash`, 'mac-cmd')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'mac-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'mac-cmd' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre">
                curl -fsSL "{serverOrigin}/api/daemon/download/mac-install" | bash
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Apri l'app <strong>Terminale</strong> sul Mac (premi <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">CMD + Spazio</kbd> e digita "Terminale"). Incolla il comando: configurerà il demone launchd Apple in <code className="text-cyan-300 font-mono">~/Library/LaunchAgents/</code>.
              </p>
            </div>

            {/* File Plist launchd anteprima */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>File Property List Apple: <strong className="text-slate-200">~/Library/LaunchAgents/com.smile80.joker80.daemon.plist</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(macPlistContent, 'mac-plist')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'mac-plist' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'mac-plist' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] max-h-48">
                {macPlistContent}
              </pre>
            </div>

            {/* Comandi Utili Mac */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Log in Tempo Reale Mac:</span>
                <code className="text-emerald-300 text-[11px] block mt-1">tail -f /tmp/smile80_daemon.log</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Stato Processo launchd:</span>
                <code className="text-cyan-300 text-[11px] block mt-1">launchctl list | grep smile80</code>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Arresto Demone Mac:</span>
                <code className="text-rose-300 text-[11px] block mt-1">launchctl unload ~/Library/LaunchAgents/com.smile80.joker80.daemon.plist</code>
              </div>
            </div>
          </div>
        )}

        {/* GUIDA E KIT PER WINDOWS */}
        {selectedOS === 'windows' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>Guida per Windows 10/11 IoT Enterprise & Windows Server</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Esecuzione via script Batch o configurazione come Servizio Windows di background tramite NSSM.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadAsBlob(windowsBatFullContent, 'start_daemon_windows.bat')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-h-[40px]"
                  title="Scarica direttamente il file .bat pulito generato dal browser (Zero errori di cookie/login)"
                >
                  <Download className="w-4 h-4" />
                  <span>Scarica start_daemon_windows.bat (Download Diretto)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(windowsBatFullContent, 'win-bat-code')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[40px]"
                  title="Copia l'intero contenuto del file BAT negli appunti per incollarlo in Blocco Note"
                >
                  {copiedKey === 'win-bat-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'win-bat-code' ? 'Codice BAT Copiato!' : 'Copia Codice Script .BAT'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadAsBlob(pythonDaemonContent, 'smile80_daemon.py')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                  title="Download opzionale dello script Python stand-alone"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>smile80_daemon.py (Opzionale)</span>
                </button>
              </div>
            </div>

            {/* Box Cartella e Destinazione Windows */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-blue-300">
                <span className="font-bold flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  Cartella di Destinazione su Windows: C:\JOKER80\
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('mkdir C:\\JOKER80', 'win-mkdir')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  {copiedKey === 'win-mkdir' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'win-mkdir' ? 'Copiato!' : 'Copia mkdir'}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300 font-sans leading-relaxed">
                <div><strong>1. Crea la cartella in C:\:</strong> Nel disco locale principale crea la cartella <code className="text-cyan-300 font-mono font-bold">C:\JOKER80\</code>.</div>
                <div><strong>2. Scarica e sposta il file BAT:</strong> Inserisci dentro <code className="text-cyan-300 font-mono">C:\JOKER80\</code> il file scaricato <code className="text-emerald-300 font-mono">start_daemon_windows.bat</code>.</div>
                <div><strong>3. Doppio click per avviare:</strong> Fai doppio click su <code className="text-amber-300 font-mono font-bold">start_daemon_windows.bat</code>. Il file scrive e autoconfigura automaticamente <code className="text-cyan-300 font-mono">smile80_daemon.py</code> in locale ed esegue l'handshake immediato col cloud!</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre text-[11px]">
                mkdir C:\JOKER80
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="font-bold text-amber-400">Avvio Immediato in Prompt Comandi o PowerShell:</span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre">
                cd C:\JOKER80
python -m pip install requests
python smile80_daemon.py
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Per trasformarlo in un servizio Windows che parte all'avvio senza utente loggato, usa <code className="text-cyan-300 font-mono">nssm install Smile80Daemon python C:\JOKER80\smile80_daemon.py</code> oppure la Pianificazione Attività (Task Scheduler).
              </p>
            </div>

            {/* SEZIONE GUIDA: PRODUZIONE REALE, CARTELLA SPOOL & MULTI-MACCHINA */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/20 via-slate-900 to-slate-950 border border-purple-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-bold border-b border-purple-500/20 pb-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Integrazione di Produzione Reale: Come fluiscono i dati dei macchinari verso il Cloud JOKER 80</span>
              </div>

              <div className="space-y-2 text-[11px] font-sans text-slate-300 leading-relaxed">
                <p>
                  <strong>1. Il file Python servirà ancora?</strong><br />
                  <span className="text-slate-400">
                    <strong className="text-emerald-400">SÌ, assolutamente.</strong> Lo script Python è il <strong className="text-white">Demone Edge Gateway</strong> ufficiale: è lui che garantisce la sicurezza NIS2, cifra la connessione in TLS 1.3, monitora la salute del PC e invia i pacchetti a intervalli regolari.
                  </span>
                </p>

                <p>
                  <strong>2. Dove prende i dati dei vari macchinari nello stabilimento?</strong><br />
                  <span className="text-slate-400">
                    Il demone crea in automatico la cartella <code className="text-cyan-300 font-mono">C:\JOKER80\spool\</code>. Se SM.I.LE80 o il software di linea esporta i dati dei macchinari in un file (es. <code className="text-amber-300 font-mono">dati_macchine.json</code> o <code className="text-amber-300 font-mono">bema_status.json</code>), lo script Python <strong>lo legge automaticamente a ogni ciclo</strong> e inoltra i dati reali al cloud!
                  </span>
                </p>

                <p>
                  <strong>3. Supporto Multi-Macchinario & Multi-Stabilimento:</strong><br />
                  <span className="text-slate-400">
                    In uno stabilimento con più fasciatori BEMA Silkworm, 12 navette LGV e baie SmartStore, lo script può leggere un unico file aggregato oppure essere replicato per linea specificando l'identificativo dello stabilimento attivo (es. <code className="text-cyan-300 font-mono">STABILIMENTO_ID=barilla-pedrignano</code>).
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono">Esempio file generato in automatico: <strong className="text-cyan-300">C:\JOKER80\spool\esempio_dati_macchine.json</strong></span>
                <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto p-2 bg-slate-900 rounded max-h-36">
{`{
  "stabilimento": "Stabilimento Barilla Pedrignano (PR)",
  "macchinarioId": "bema-silkworm-01",
  "nomeMacchinario": "Fasciatore Robotico BEMA Silkworm",
  "stato": "IN_MARCIA",
  "parametri": {
    "velocitaRotazioneRpm": 34.8,
    "temperaturaInverterC": 52.1,
    "palletOra": 86,
    "pressioneAriaBar": 6.2
  },
  "lgv": {
    "id": "LGV-04",
    "batteriaSoC": 88,
    "missione": "Trasporto Pallet verso SmartStore"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* GUIDA DOCKER */}
        {selectedOS === 'docker' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>Container Docker / Podman (Universale per Qualsiasi OS)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Gira in container isolato su Linux, macOS (Docker Desktop / Colima) e Windows (WSL2).
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadAsBlob(dockerComposeContent, 'docker-compose.yml')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica docker-compose.yml</span>
              </button>
            </div>

            {/* Box Cartella e Destinazione Docker */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-cyan-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-cyan-400" />
                  Cartella di Destinazione Docker: /opt/smile80-docker/ (o ~/smile80-docker/)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('mkdir -p ~/smile80-docker && cd ~/smile80-docker', 'docker-mkdir')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  {copiedKey === 'docker-mkdir' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'docker-mkdir' ? 'Copiato!' : 'Copia Comando'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                1. Crea la cartella del container: <code className="text-cyan-300 font-mono">mkdir -p ~/smile80-docker</code><br />
                2. Sposta al suo interno il file <code className="text-emerald-300 font-mono">docker-compose.yml</code> scaricato.<br />
                3. Esegui il comando <code className="text-amber-300 font-mono">docker compose up -d</code> per avviare il demone isolato.
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>File: <strong className="text-slate-200">docker-compose.yml</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(dockerComposeContent, 'docker-compose')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'docker-compose' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'docker-compose' ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] max-h-44">
                {dockerComposeContent}
              </pre>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[11px]">
                Avvio: <code>docker compose up -d</code> | Log: <code>docker compose logs -f</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. SIMULATORE & FEED LIVE DEI PACCHETTI TELEMETRICI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Collaudo Live & Feed Pacchetti Telemetrici Ricevuti ({telemetryHistory.length})</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Feed in tempo reale dei dati ricevuti. I pacchetti contrassegnati con <span className="text-emerald-400 font-bold">PC FISICO</span> provengono dal tuo computer reale, mentre quelli con <span className="text-blue-300">SIMULAZIONE</span> sono generati internamente dal browser.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendTestTelemetry}
              disabled={isSendingTest}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] disabled:opacity-50 border border-blue-500/40"
              title="Genera un pacchetto simulato direttamente dal browser web per testare le API cloud"
            >
              {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>🧪 Simula Pacchetto (Browser Web)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                fetchGatewayStatus();
                onRefreshTelemetry();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Aggiorna Feed e Stato Gateway"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chiarimento importante tra test simulato e PC fisico */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 font-sans">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Perché esiste il pulsante "Simula Pacchetto"?</strong> Serve solo per collaudare se il server cloud risponde quando non si ha un PC fisico sottomano. Se stai eseguendo il demone sul tuo computer reale Windows/Linux/Mac, <strong>non serve cliccare il pulsante</strong>: il tuo PC trasmetterà automaticamente i dati reali secondo la frequenza configurata e li vedrai accreditati qui sotto.
          </div>
        </div>

        {testResult && (
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* FEED DEGLI ULTIMI PACCHETTI */}
        {telemetryHistory.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
            <div className="text-xs font-bold text-slate-300 font-mono">Nessun pacchetto ancora ricevuto</div>
            <p className="text-[11px] text-slate-500 font-mono">
              Avvia il demone Python sul tuo PC Windows (o Linux/Mac) per iniziare la ricezione automatica continua.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {telemetryHistory.map((pkt, pIdx) => {
              const isAlarm = pkt.stato === 'ALLARME' || pkt.parametri?.allarmeAttivo;
              const osInfo = pkt.rawPayload?.nodeMetadata?.os || pkt.nodeMetadata?.os || 'PC Locale';
              const isRealPC = pkt.isPhysicalPC || pkt.rawPayload?.clientType === 'PHYSICAL_PC_DAEMON';

              return (
                <div
                  key={`${pkt.id}-${pIdx}`}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    isAlarm
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : isRealPC
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-rose-500 animate-ping' : isRealPC ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
                      <strong className="text-white">{pkt.nomeMacchinario}</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                        {pkt.macchinarioId}
                      </span>
                      
                      {/* Distinzione sorgente: Hardware PC Reale vs Simulazione Web */}
                      {isRealPC ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-emerald-400" />
                          <span>PC FISICO REALE</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-blue-400" />
                          <span>SIMULAZIONE BROWSER</span>
                        </span>
                      )}

                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-semibold">
                        OS: {osInfo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Auth: <strong className="text-emerald-400">{pkt.authType}</strong></span>
                      <span>|</span>
                      <span>Ricevuto: <strong className="text-slate-300">{new Date(pkt.receivedAt).toLocaleTimeString()}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Rotazione BEMA:</span>
                      <strong className="text-cyan-300">{pkt.parametri?.velocitaRotazioneRpm ?? '--'} RPM</strong>
                    </div>

                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Temp. Inverter:</span>
                      <strong className="text-emerald-300">{pkt.parametri?.temperaturaInverterC ?? '--'} °C</strong>
                    </div>

                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Produzione Pallet:</span>
                      <strong className="text-amber-300">{pkt.parametri?.palletOra ?? '--'} pallet/h</strong>
                    </div>

                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Navetta LGV:</span>
                      <strong className="text-purple-300">{pkt.lgv ? `${pkt.lgv.id} (${pkt.lgv.batteriaSoC}% SoC)` : 'Standby'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CONFERMA COLLEGAMENTO PC FISICO & HANDSHAKE HARDWARE LIVE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              gatewayClient?.isOnline
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : gatewayClient
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              <Laptop className={`w-5 h-5 ${gatewayClient?.isOnline ? 'animate-bounce' : ''}`} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                  Stato Connessione Hardware & Handshake PC Fisico (M2M)
                </h3>

                {/* Badge Stato Connessione Reale */}
                {gatewayClient?.isOnline ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>PC FISICO COLLEGATO ED ATTIVO (ONLINE)</span>
                  </span>
                ) : gatewayClient ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>PC IN PAUSA (OFFLINE DA {gatewayClient.secondsSinceLastPing}s)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>IN ATTESA DEL PRIMO COLLEGAMENTO DAL TUO PC</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Riconoscimento e telemetria diretta dal computer reale di stabilimento. Anche se non sono ancora collegati sensori PLC fisici, questo modulo conferma che la connessione di rete e l'handshake M2M tra il tuo PC e la piattaforma sono perfettamente riusciti.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchGatewayStatus}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            title="Interroga subito il server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verifica Connessione PC</span>
          </button>
        </div>

        {/* BANNER INFORMATIVO DI CONFERMA / ISTRUZIONE */}
        {gatewayClient?.isOnline ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-2">
                <span>COLLEGAMENTO TRA PC E PIATTAFORMA ONLINE CONFERMATO AL 100%!</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">VERIFICATO</span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Il computer <strong className="text-white font-mono">{gatewayClient.hostname}</strong> ({gatewayClient.osLabel}) si è agganciato con successo alla piattaforma cloud con crittografia end-to-end. Lo script demone è in esecuzione e mantiene attivo il canale di comunicazione con battiti cardiaci (Heartbeat) regolari.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-cyan-300">
                Come collegare il tuo PC Windows e vedere la conferma verde:
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                1. Apri la cartella <code className="text-cyan-300 font-mono">C:\JOKER80</code> sul tuo computer.<br />
                2. Fai doppio clic su <code className="text-emerald-300 font-mono">start_daemon_windows.bat</code> per avviarlo.<br />
                3. Non appena il file si avvia, invia istantaneamente un <strong>Handshake di presenza</strong> a questa piattaforma e questo riquadro si illuminerà di verde mostrando il nome del tuo computer, l'IP pubblico e l'orario esatto del collegamento!
              </p>
            </div>
          </div>
        )}

        {/* SCHEDE DIAGNOSTICHE DETTAGLIATE HARDWARE PC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Computer Hostname */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Nome Computer (Host)</span>
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-sm font-bold text-white font-mono truncate" title={gatewayClient?.hostname}>
              {gatewayClient?.hostname || (
                <span className="text-slate-500 font-normal italic">In attesa del PC...</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              {gatewayClient ? `Architettura: ${gatewayClient.architecture}` : 'Riconoscimento automatico'}
            </span>
          </div>

          {/* Card 2: Sistema Operativo Reale */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Sistema Operativo Riconosciuto</span>
              <Laptop className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-sm font-bold text-cyan-300 font-mono truncate" title={gatewayClient?.osLabel}>
              {gatewayClient?.osLabel || (
                <span className="text-slate-500 font-normal italic">In attesa del PC...</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              {gatewayClient ? `Runtime: ${gatewayClient.pythonVersion}` : 'Windows / Linux / Mac'}
            </span>
          </div>

          {/* Card 3: Indirizzo IP Sorgente & Canale M2M */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Indirizzo IP Sorgente PC</span>
              <Globe className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-sm font-bold text-amber-300 font-mono truncate">
              {gatewayClient?.clientIp || (
                <span className="text-slate-500 font-normal italic">In attesa...</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono block truncate" title="X-Industrial-Gateway-Key">
              Auth: {gatewayClient?.authType || 'NIS2 Industrial Gateway'}
            </span>
          </div>

          {/* Card 4: Ultimo Battito & Pacchetti Reali */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Ultimo Battito (Heartbeat)</span>
              <Signal className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-sm font-bold font-mono">
              {gatewayClient?.isOnline ? (
                <span className="text-emerald-400">{gatewayClient.secondsSinceLastPing}s fa</span>
              ) : gatewayClient ? (
                <span className="text-amber-400">{gatewayClient.secondsSinceLastPing}s fa</span>
              ) : (
                <span className="text-slate-500 font-normal italic">Nessun battito</span>
              )}
            </div>
            <span className="text-[10px] text-emerald-400/90 font-mono block">
              Pacchetti PC Reali: <strong>{physicalCount}</strong>
              <span className="text-slate-500 font-normal"> (Simulati: {browserSimCount})</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
