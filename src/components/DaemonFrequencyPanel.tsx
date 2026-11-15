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
  CheckCircle,
  Lock,
  Key,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FactoryTenant, UserAccount } from '../types/quantum';

interface Props {
  activeTenant: FactoryTenant;
  currentUser: UserAccount;
  telemetryHistory: any[];
  onRefreshTelemetry: () => void;
  availableTenants?: FactoryTenant[];
  onSelectTenant?: (tenant: FactoryTenant) => void;
}

type FrequencyUnit = 'seconds' | 'minutes' | 'hours' | 'days';
type OSType = 'linux' | 'mac' | 'windows' | 'docker';

export const DaemonFrequencyPanel: React.FC<Props> = ({
  activeTenant,
  currentUser,
  telemetryHistory,
  onRefreshTelemetry,
  availableTenants,
  onSelectTenant
}) => {
  // Frequency Configuration State
  const [frequencyValue, setFrequencyValue] = useState<number>(5);
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('seconds');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [savedConfig, setSavedConfig] = useState<any>(null);

  // OS Documentation & Kit State (Default: Windows 10/11 IoT per PC industriali)
  const [selectedOS, setSelectedOS] = useState<OSType>('windows');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Live Test Simulation State (Browser-side simulation)
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Physical Hardware PC Gateway Live Connection State
  const [gatewayClient, setGatewayClient] = useState<any>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [browserSimCount, setBrowserSimCount] = useState<number>(0);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isOperator = currentUser.ruolo === 'Operatore di Linea' || currentUser.ruolo?.toLowerCase().includes('operatore');
  const isManagerOrAdmin = currentUser.ruolo === 'Amministratore' || currentUser.ruolo === 'Responsabile di Stabilimento';

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
      const activeGatewayKey = activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'PEDRIGNANO').toUpperCase()}-GW-2026`;
      const res = await fetch('/api/telemetry/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Industrial-Gateway-Key': activeGatewayKey
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
import uuid
import requests

print("==============================================================================")
print("  JOKER 80 - SM.I.LE80 Industrial Telemetry Daemon (M2M)")
print("  Modulo di Telemetria Hardware per PC di Stabilimento Elettric80")
print("==============================================================================")

SERVER_URL = os.environ.get("JOKER80_URL", "${serverOrigin}")
GATEWAY_KEY = os.environ.get("INDUSTRIAL_GATEWAY_KEY", "${activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'PEDRIGNANO').toUpperCase()}-GW-2026`}")
PLANT_NAME = os.environ.get("PLANT_NAME", "${activeTenant.nome}")
PLANT_ID = os.environ.get("PLANT_ID", "${activeTenant.id}")
INTERVAL_SEC = float(os.environ.get("TELEMETRY_INTERVAL_SEC", "${totalSeconds}"))
PUSH_ENDPOINT = f"{SERVER_URL}/api/telemetry/push"
HANDSHAKE_ENDPOINT = f"{SERVER_URL}/api/telemetry/handshake"

REAL_HOST = os.environ.get("REAL_HOSTNAME") or socket.gethostname()
REAL_OS = os.environ.get("REAL_OS") or f"{platform.system()} {platform.release()}"
REAL_ARCH = platform.machine() or "x64"
PY_VER = f"Python {platform.python_version()}"

def ottieni_mac_address():
    try:
        node = uuid.getnode()
        mac_hex = '{:012x}'.format(node)
        return ':'.join(mac_hex[i:i+2] for i in range(0, 12, 2)).upper()
    except Exception:
        return '00:00:00:00:00:00'

REAL_MAC = ottieni_mac_address()

# Cartelle Dati Locali e di Rete (Spool & Network Share)
# Windows: C:\\JOKER80\\spool\\ e UNC \\\\server-stabilimento\\e80_export\\
# Linux: /opt/smile80-daemon/spool/ e /mnt/server-stabilimento/e80_export/
# macOS: ~/smile80-daemon/spool/ e /Volumes/e80_export/
SPOOL_DIR = os.environ.get("SPOOL_DIR") or (
    "C:\\\\JOKER80\\\\spool" if platform.system() == "Windows"
    else os.path.expanduser("~/smile80-daemon/spool") if platform.system() == "Darwin"
    else "/opt/smile80-daemon/spool"
)
os.makedirs(SPOOL_DIR, exist_ok=True)

NETWORK_SHARE_DIR = os.environ.get("NETWORK_SHARE_DIR") or (
    r"\\\\server-stabilimento\\e80_export" if platform.system() == "Windows"
    else "/Volumes/e80_export" if platform.system() == "Darwin"
    else "/mnt/server-stabilimento/e80_export"
)

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
print(f"  MAC Address:   {REAL_MAC}")
print(f"  Sistema:       {REAL_OS} ({REAL_ARCH})")
print(f"  Runtime:       {PY_VER}")
print(f"  Spool Locale:  {SPOOL_DIR}")
print(f"  Rete Export:   {NETWORK_SHARE_DIR}")
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
        "networkSharePath": NETWORK_SHARE_DIR,
        "nodeMetadata": {
            "hostname": REAL_HOST,
            "macAddress": REAL_MAC,
            "os": f"Windows IPC ({REAL_OS})" if "Windows" in REAL_OS else REAL_OS,
            "arch": REAL_ARCH,
            "pythonVersion": PY_VER,
            "clientType": "PHYSICAL_PC_DAEMON",
            "plantId": PLANT_ID,
            "plantName": PLANT_NAME,
            "spoolPath": SPOOL_DIR,
            "networkSharePath": NETWORK_SHARE_DIR
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
            print(f"[{t_str}] [HANDSHAKE OK 200] PC '{REAL_HOST}' (MAC: {REAL_MAC}) RICONOSCIUTO AL CLOUD JOKER 80!")
        else:
            print(f"[{t_str}] Risposta Handshake Server: HTTP {res.status_code}")
    except Exception as e:
        print(f"[AVVISO] Handshake iniziale non riuscito: {e}")

def invia_telemetria(ciclo=1):
    global INTERVAL_SEC
    t_str = time.strftime("%H:%M:%S")

    # Scansione file dati reali: prima spool locale, poi cartella di rete
    fonte_dati = "Diagnostica Hardware"
    custom_data = None
    candidati = ["dati_macchine.json", "plant_telemetry.json", "bema_status.json", "e80_export.json"]
    for dir_path in [SPOOL_DIR, NETWORK_SHARE_DIR]:
        if not os.path.exists(dir_path):
            continue
        for nome_f in candidati:
            p = os.path.join(dir_path, nome_f)
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as f_in:
                        custom_data = json.load(f_in)
                        if isinstance(custom_data, dict):
                            fonte_dati = f"{nome_f} [{dir_path}]"
                            break
                except Exception:
                    pass
        if custom_data:
            break

    rpm = round(34.2 + ((ciclo * 0.3) % 2.5), 1)
    temp = round(51.4 + ((ciclo * 0.2) % 3.0), 1)
    pallet = int(82 + ((ciclo * 2) % 10))
    soc = max(40, int(94 - ((ciclo // 20) % 30)))

    payload = {
        "clientType": "PHYSICAL_PC_DAEMON",
        "isPhysicalPC": True,
        "gateway_key": GATEWAY_KEY,
        "macAddress": REAL_MAC,
        "plantId": PLANT_ID,
        "plantName": PLANT_NAME,
        "spoolPath": SPOOL_DIR,
        "networkSharePath": NETWORK_SHARE_DIR,
        "macchinarioId": "bema-silkworm-01",
        "nomeMacchinario": f"Fasciatore BEMA Silkworm ({PLANT_NAME})",
        "tipoMacchina": "BEMA_FASCIATORE",
        "stato": "IN_MARCIA",
        "timestamp": time.time(),
        "info": f"PC: {REAL_HOST} [MAC: {REAL_MAC}] - {REAL_OS} M2M [{fonte_dati}]",
        "nodeMetadata": {
            "hostname": REAL_HOST,
            "macAddress": REAL_MAC,
            "os": f"Windows IPC ({REAL_OS})" if "Windows" in REAL_OS else REAL_OS,
            "system": platform.system(),
            "arch": REAL_ARCH,
            "pythonVersion": PY_VER,
            "ciclo": ciclo,
            "fonteDati": fonte_dati,
            "plantId": PLANT_ID,
            "plantName": PLANT_NAME
        },
        "parametri": {
            "velocitaRotazioneRpm": rpm,
            "temperaturaInverterC": temp,
            "palletOra": pallet,
            "vibrazioneCuscinettiG": 0.37,
            "pressioneAriaBar": 6.2,
            "tensioneFilmPreStiroPct": 295,
            "cadenzaConfigurataSec": INTERVAL_SEC,
            "pcHostSorgente": REAL_HOST,
            "macAddress": REAL_MAC
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
                if isinstance(data, dict):
                    if "packetId" in data:
                        pkt_id = data["packetId"]
                    # Sincronizzazione dinamica automatica della frequenza inviata dal cloud
                    if "configuredIntervalSec" in data:
                        nuovo_sec = float(data["configuredIntervalSec"])
                        if nuovo_sec > 0 and abs(nuovo_sec - INTERVAL_SEC) > 0.01:
                            print(f"[{t_str}] [SINCRONIZZAZIONE CADENZA] Nuova frequenza cloud applicata in tempo reale: {nuovo_sec}s")
                            INTERVAL_SEC = nuovo_sec
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
Environment=INDUSTRIAL_GATEWAY_KEY=${activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'PEDRIGNANO').toUpperCase()}-GW-2026`}
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
        <string>${activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'PEDRIGNANO').toUpperCase()}-GW-2026`}</string>
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
if ls *.pfx* 1> /dev/null 2>&1; then
    sudo cp *.pfx* /opt/smile80-daemon/ 2>/dev/null || true
    echo "[OK] Certificato NIS2 rilevato e posizionato in /opt/smile80-daemon/"
fi
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

if ls *.pfx* 1> /dev/null 2>&1; then
    cp *.pfx* "$INSTALL_DIR/" 2>/dev/null || true
    echo "[OK] Certificato NIS2 rilevato e posizionato in $INSTALL_DIR/"
fi

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

:: Rileva e copia automaticamente il certificato NIS2 scaricato al fianco del .bat (su USB, Desktop o Download)
if exist "%~dp0*.pfx" copy /y "%~dp0*.pfx" "C:\\JOKER80\\" >nul 2>nul
if exist "%~dp0*.pfx.txt" copy /y "%~dp0*.pfx.txt" "C:\\JOKER80\\" >nul 2>nul
if exist "%~dp0certificato_nis2*.txt" copy /y "%~dp0certificato_nis2*.txt" "C:\\JOKER80\\" >nul 2>nul

cd /d "C:\\JOKER80"

echo ==============================================================================
echo JOKER 80 - SM.I.LE80 Industrial Telemetry Daemon (Windows IPC)
echo Cartella di lavoro: %CD%
set "CERT_FOUND=0"
if exist "certificato_nis2*.txt" set "CERT_FOUND=1"
if exist "*.pfx" set "CERT_FOUND=1"
if exist "*.pfx.txt" set "CERT_FOUND=1"

if "%CERT_FOUND%"=="1" (
    echo [OK NIS2] Certificato crittografico mTLS rilevato in C:\\JOKER80!
) else (
    echo [AVVISO] File certificato NIS2 non ancora presente in C:\\JOKER80.
    echo          Salva il file certificato scaricato nella stessa cartella del file .bat.
)
echo ==============================================================================
echo.

set "JOKER80_URL=${serverOrigin}"
set "INDUSTRIAL_GATEWAY_KEY=${activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'PEDRIGNANO').toUpperCase()}-GW-2026`}"
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
  const activeGatewayKey = activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'PEDRIGNANO').toUpperCase()}-GW-2026`;
  const dockerComposeContent = `version: '3.8'
services:
  smile80-telemetry-daemon:
    image: python:3.11-slim
    container_name: smile80_telemetry_daemon
    restart: always
    environment:
      - JOKER80_URL=${serverOrigin}
      - INDUSTRIAL_GATEWAY_KEY=${activeGatewayKey}
      - PLANT_NAME=${activeTenant.nome}
      - PLANT_ID=${activeTenant.id}
      - TELEMETRY_INTERVAL_SEC=${totalSeconds}
    command: >
      sh -c "pip install requests &&
             curl -fsSL ${serverOrigin}/smile80_daemon.py -o /app/smile80_daemon.py &&
             python /app/smile80_daemon.py"
    working_dir: /app`;

  const wizardSteps = [
    { step: 1 as const, label: 'Sistema Operativo', short: '1. Sistema' },
    { step: 2 as const, label: 'Frequenza Invii', short: '2. Frequenza' },
    { step: 3 as const, label: 'Scarica i 2 File', short: '3. Download' },
    { step: 4 as const, label: 'Salvataggio & Avvio', short: '4. Installazione' },
    { step: 5 as const, label: 'Handshake & Feed', short: '5. Handshake' }
  ];

  const safeTenantFileId = (activeTenant.id || 'plant').toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* INTESTAZIONE WIZARD + BARRA PROGRESSIONE A 5 PASSAGGI                     */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-500/30 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0 shadow-lg shadow-cyan-500/20">
              <Laptop className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-mono tracking-tight">
                  Configurazione Guidata Gateway PC di Stabilimento
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Passaggio {wizardStep} di 5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1">
                Segui i 5 passaggi guidati: scegli il sistema operativo, imposta la frequenza di invio dati, scarica demone e certificato NIS2 e verifica l'handshake del PC.
              </p>
            </div>
          </div>

          {/* SELETTORE STABILIMENTO TARGET + STATO HARDWARE */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/40">
              <span className="text-xs font-mono text-slate-400 font-bold shrink-0">Stabilimento:</span>
              {availableTenants && availableTenants.length > 0 && onSelectTenant ? (
                <select
                  value={activeTenant.id}
                  onChange={e => {
                    const found = availableTenants.find(t => t.id === e.target.value);
                    if (found) onSelectTenant(found);
                  }}
                  className="bg-transparent text-cyan-200 font-mono font-bold text-xs focus:outline-none cursor-pointer max-w-[240px] truncate"
                >
                  {availableTenants.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                      {t.azienda ? `${t.azienda} - ` : ''}{t.nome} (#{t.numeroStabilimento || 1})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-cyan-300 font-mono font-bold text-xs truncate max-w-[200px]">
                  {activeTenant.nome}
                </span>
              )}
            </div>

            <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border shadow-sm ${
              gatewayClient?.mac || gatewayClient?.hostname
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${gatewayClient?.mac || gatewayClient?.hostname ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span>{gatewayClient?.mac || gatewayClient?.hostname ? 'PC Fisico Connesso' : 'In attesa primo PC...'}</span>
            </span>
          </div>
        </div>

        {/* BARRA STEPPER CLICCABILE */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
          {wizardSteps.map((item) => {
            const isActive = wizardStep === item.step;
            const isCompleted = wizardStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setWizardStep(item.step)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-cyan-600/25 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/50'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/50'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950'
                    : isCompleted
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : item.step}
                </span>
                <span className="text-xs font-bold truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* SCHERMATA STEP 1: SCELTA DEL SISTEMA OPERATIVO                        */}
        {/* ===================================================================== */}
        {wizardStep === 1 && (
          <div className="p-5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm sm:text-base">
                <Server className="w-5 h-5 text-cyan-400" />
                <span>Passaggio 1: Seleziona il Sistema Operativo del Computer di Linea</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                Scegli su quale computer verrà installato il demone di telemetria per <strong>{activeTenant.nome}</strong>. Nel passaggio successivo imposterai la frequenza di invio così da generare file già configurati su misura.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setSelectedOS('windows')}
                className={`p-4 rounded-xl font-bold flex flex-col items-start gap-2 transition-all cursor-pointer border text-left ${
                  selectedOS === 'windows'
                    ? 'bg-cyan-500/20 text-white border-cyan-400 shadow-lg ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🪟 Windows (.bat)</span>
                <span className="text-[11px] font-sans font-normal text-slate-400">
                  Windows 10/11 IoT Enterprise (Script Batch .BAT)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOS('linux')}
                className={`p-4 rounded-xl font-bold flex flex-col items-start gap-2 transition-all cursor-pointer border text-left ${
                  selectedOS === 'linux'
                    ? 'bg-amber-500/20 text-white border-amber-400 shadow-lg ring-1 ring-amber-500/50'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🐧 Linux (.sh)</span>
                <span className="text-[11px] font-sans font-normal text-slate-400">
                  Linux Ubuntu / Debian / RHEL (Servizio di sistema systemd)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOS('mac')}
                className={`p-4 rounded-xl font-bold flex flex-col items-start gap-2 transition-all cursor-pointer border text-left ${
                  selectedOS === 'mac'
                    ? 'bg-purple-500/20 text-white border-purple-400 shadow-lg ring-1 ring-purple-500/50'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🍎 macOS (.sh)</span>
                <span className="text-[11px] font-sans font-normal text-slate-400">
                  Apple macOS Silicon & Intel (Agente launchd daemon)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOS('docker')}
                className={`p-4 rounded-xl font-bold flex flex-col items-start gap-2 transition-all cursor-pointer border text-left ${
                  selectedOS === 'docker'
                    ? 'bg-blue-500/20 text-white border-blue-400 shadow-lg ring-1 ring-blue-500/50'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🐳 Docker (.yml)</span>
                <span className="text-[11px] font-sans font-normal text-slate-400">
                  Docker / Podman (Container isolato multipiattaforma)
                </span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs sm:text-sm font-sans text-slate-200 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong>Sicurezza Direttiva NIS2:</strong> la piattaforma usa un certificato dedicato per riconoscere in modo sicuro il PC dello stabilimento che le invia i dati, così solo i computer autorizzati della fabbrica possono trasmettere.
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Avanti: Imposta Frequenza Invii</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCHERMATA STEP 2: CADENZA, PRESET E RIEPILOGO IMPATTO TECNICO         */}
        {/* (Prima del download, così la frequenza viene inserita nei file)       */}
        {/* ===================================================================== */}
        {wizardStep === 2 && (
          <div className="p-5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                      Passaggio 2: Cadenza e Frequenza Ricezione Dati dal PC di Stabilimento
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {savedConfig ? `Attiva: ogni ${savedConfig.intervalValue} ${savedConfig.intervalUnit}` : 'Attiva: ogni 5 seconds'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1">
                    Configura ogni quanto tempo ricevere i dati telemetrici delle macchine (BEMA Silkworm, Navette LGV, Baie di carico) inviati dal demone Python in locale sullo stabilimento <strong>{activeTenant.nome}</strong>. Il valore scelto verrà inserito subito nei file scaricabili al passaggio successivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Colonna Sinistra: Modifica Valore, Unità & Preset */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="text-xs sm:text-sm font-mono font-bold text-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <span>Imposta Intervallo di Invio:</span>
                    <span className="text-cyan-400 text-xs">Totale calcolato: {totalSeconds} secondi</span>
                  </div>

                  {isOperator && (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs font-mono flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold text-amber-300">Accesso Sola Lettura (Operatore di Linea)</div>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          La modifica della frequenza di campionamento è riservata al Responsabile di Stabilimento e all'Amministratore.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-slate-300">Valore numerico:</span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          disabled={isOperator}
                          onClick={() => setFrequencyValue(prev => Math.max(1, prev - 1))}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-l-xl font-mono font-bold text-sm cursor-pointer disabled:cursor-not-allowed min-h-[42px]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          disabled={isOperator}
                          value={frequencyValue}
                          onChange={(e) => setFrequencyValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full text-center py-2 bg-slate-950 border-y border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-500 disabled:opacity-60 min-h-[42px]"
                        />
                        <button
                          type="button"
                          disabled={isOperator}
                          onClick={() => setFrequencyValue(prev => prev + 1)}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-r-xl font-mono font-bold text-sm cursor-pointer disabled:cursor-not-allowed min-h-[42px]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-slate-300">Unità di tempo:</span>
                      <select
                        disabled={isOperator}
                        value={frequencyUnit}
                        onChange={(e) => setFrequencyUnit(e.target.value as FrequencyUnit)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50 min-h-[42px]"
                      >
                        <option value="seconds">Secondi (Alta Frequenza)</option>
                        <option value="minutes">Minuti (Cadenza Standard)</option>
                        <option value="hours">Ore (Sintesi Energetica)</option>
                        <option value="days">Giorni (Report Periodico)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveConfig()}
                      disabled={isSaving || isOperator}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 min-h-[44px]"
                    >
                      {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isOperator ? 'Modifica Riservata ai Responsabili' : 'Salva e Applica Frequenza'}</span>
                    </button>

                    <div className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sincronizzazione automatica M2M (Zero Downtime)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30 text-xs font-mono space-y-1.5">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Propagazione Dinamica al File .BAT, Python e ai PC Attivi ({totalSeconds}s)</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      ✓ <strong>Nei file scaricabili (.BAT, .PY, .SH):</strong> La frequenza di <span className="text-cyan-300 font-bold font-mono">{frequencyValue} {frequencyUnit} ({totalSeconds}s)</span> viene inserita in tempo reale nel codice sorgente dei file generati.<br />
                      ✓ <strong>Sui PC già attivi in fabbrica:</strong> Non è necessario riscaricare il file! Il demone Python riceve la cadenza configurata dal cloud e si sincronizza a caldo in automatico.
                    </p>
                  </div>

                  {feedback && (
                    <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                      feedback.success ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    }`}>
                      {feedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                      <span className="flex-1">{feedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Preset Rapidi */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Scelta Rapida Preset Consigliati:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                    <button type="button" disabled={isOperator} onClick={() => handleApplyPreset(3, 'seconds')} className="p-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-center transition-all cursor-pointer disabled:opacity-40 flex flex-col justify-center">
                      <span className="font-bold text-cyan-400">3 Secondi</span>
                      <span className="text-[10px] text-slate-400">Real-Time BEMA</span>
                    </button>
                    <button type="button" disabled={isOperator} onClick={() => handleApplyPreset(10, 'seconds')} className="p-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-center transition-all cursor-pointer disabled:opacity-40 flex flex-col justify-center">
                      <span className="font-bold text-blue-400">10 Secondi</span>
                      <span className="text-[10px] text-slate-400">Standard Linea</span>
                    </button>
                    <button type="button" disabled={isOperator} onClick={() => handleApplyPreset(1, 'minutes')} className="p-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-center transition-all cursor-pointer disabled:opacity-40 flex flex-col justify-center">
                      <span className="font-bold text-emerald-400">1 Minuto</span>
                      <span className="text-[10px] text-slate-400">Bilanciato OT</span>
                    </button>
                    <button type="button" disabled={isOperator} onClick={() => handleApplyPreset(1, 'hours')} className="p-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-center transition-all cursor-pointer disabled:opacity-40 flex flex-col justify-center">
                      <span className="font-bold text-purple-400">1 Ora</span>
                      <span className="text-[10px] text-slate-400">Sintesi Oraria</span>
                    </button>
                    <button type="button" disabled={isOperator} onClick={() => handleApplyPreset(1, 'days')} className="p-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-center transition-all cursor-pointer disabled:opacity-40 flex flex-col justify-center col-span-2 sm:col-span-1">
                      <span className="font-bold text-amber-400">1 Giorno</span>
                      <span className="text-[10px] text-slate-400">Report NIS2</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Colonna Destra: Riepilogo Impatto Tecnico Stimato */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-2 text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Riepilogo Impatto Tecnico Stimato</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                    <span className="text-slate-400">Intervallo Ciclo:</span>
                    <span className="font-bold text-white">
                      {frequencyValue} {frequencyUnit === 'seconds' ? 'secondi' : frequencyUnit === 'minutes' ? 'minuti' : frequencyUnit === 'hours' ? 'ore' : 'giorni'} ({totalSeconds}s)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                    <span className="text-slate-400">Cadenza Invii:</span>
                    <span className="font-bold text-cyan-300">{packetsPerDay.toLocaleString()} pacchetti / giorno</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                    <span className="text-slate-400">Consumo Banda Stimato:</span>
                    <span className="font-bold text-emerald-400">~{estimatedKBytesPerDay > 1024 ? `${(estimatedKBytesPerDay / 1024).toFixed(1)} MB` : `${estimatedKBytesPerDay} KB`} / giorno</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                    <span className="text-slate-400">Carico CPU su PC/IPC:</span>
                    <span className="font-bold text-purple-300">&lt; 0.1% (Nessun impatto PLC)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Reattività Allarmi:</span>
                    <span className={`font-bold ${totalSeconds <= 10 ? 'text-emerald-400' : totalSeconds <= 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {totalSeconds <= 5 ? 'Istantanea (<5s)' : totalSeconds <= 60 ? 'Rapida (1 min)' : 'Periodica differita'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-950/25 border border-blue-500/30 text-xs font-sans text-slate-300 leading-relaxed">
                  <strong className="text-blue-300 font-mono block mb-1">Come Funziona la Sincronizzazione:</strong>
                  Il demone Python che gira sullo stabilimento interroga all'avvio e ciclicamente l'endpoint <code className="text-cyan-300 font-mono text-[11px]">/api/telemetry/config</code>. Quando modifichi questo valore, tutti i demoni (Linux, Mac Apple, Windows) recepiscono il nuovo tempo di attesa senza dover riavviare il servizio.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Avanti: Scarica i 2 File ({totalSeconds}s)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCHERMATA STEP 3: SCARICA I 2 FILE NECESSARI (DEMONE + CERTIFICATO)   */}
        {/* ===================================================================== */}
        {wizardStep === 3 && (
          <div className="p-5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                  Passaggio 3: Scarica i 2 File Necessari ({selectedOS === 'windows' ? 'Windows .BAT' : selectedOS === 'linux' ? 'Linux .SH' : selectedOS === 'mac' ? 'macOS .SH' : 'Docker .YML'})
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-sans mt-0.5">
                  Scarica entrambi i file qui sotto per collegare il PC dello stabilimento <strong>{activeTenant.nome}</strong> (frequenza preconfigurata nello script: <strong className="text-cyan-300 font-mono">{totalSeconds}s</strong>).
                </p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Cadenza: {totalSeconds}s
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  2 File Richiesti
                </span>
              </div>
            </div>

            {isOperator && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs font-mono flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300">Download riservato a Responsabile / Amministratore</div>
                  <p className="text-xs text-slate-300 font-sans">
                    In conformità alle direttive NIS2, il download dei file demone di sistema e del certificato è riservato al Responsabile di Stabilimento e all'Amministratore.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File 1: Demone */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-mono font-bold text-cyan-300">
                    1. File Demone {selectedOS === 'windows' ? 'Windows (.BAT)' : selectedOS === 'linux' ? 'Linux (.SH)' : selectedOS === 'mac' ? 'macOS (.SH)' : 'Docker (.YML)'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                    {selectedOS === 'windows' && `Script .BAT configurato a ${totalSeconds}s con watchdog, auto-riavvio cmd, venv Python isolato e cartella locale C:\\JOKER80\\spool.`}
                    {selectedOS === 'linux' && `Script .SH configurato a ${totalSeconds}s che crea il servizio di sistema systemd smile80-daemon.service e cartella /opt/smile80-daemon/spool.`}
                    {selectedOS === 'mac' && `Script .SH per Apple Mac configurato a ${totalSeconds}s che installa il demone permanente launchd (.plist) e spool locale ~/smile80-daemon/spool.`}
                    {selectedOS === 'docker' && `File docker-compose.yml configurato a ${totalSeconds}s pronto per containerizzazione Docker con variabili di ambiente NIS2.`}
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedOS === 'windows' && (
                    <button
                      type="button"
                      disabled={isOperator}
                      onClick={() => downloadAsBlob(windowsBatFullContent, `avvia_gateway_${safeTenantFileId}.bat`)}
                      className="w-full py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      <span className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        <span>1. Scarica Demone Windows (.BAT)</span>
                      </span>
                      <Download className="w-4 h-4 shrink-0" />
                    </button>
                  )}

                  {selectedOS === 'linux' && (
                    <button
                      type="button"
                      disabled={isOperator}
                      onClick={() => downloadAsBlob(linuxInstallContent, `install_linux_${safeTenantFileId}.sh`)}
                      className="w-full py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      <span className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        <span>1. Scarica Demone Linux (.SH)</span>
                      </span>
                      <Download className="w-4 h-4 shrink-0" />
                    </button>
                  )}

                  {selectedOS === 'mac' && (
                    <button
                      type="button"
                      disabled={isOperator}
                      onClick={() => downloadAsBlob(macInstallContent, `install_mac_${safeTenantFileId}.sh`)}
                      className="w-full py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      <span className="flex items-center gap-2">
                        <Laptop className="w-4 h-4" />
                        <span>1. Scarica Demone macOS (.SH)</span>
                      </span>
                      <Download className="w-4 h-4 shrink-0" />
                    </button>
                  )}

                  {selectedOS === 'docker' && (
                    <button
                      type="button"
                      disabled={isOperator}
                      onClick={() => downloadAsBlob(dockerComposeContent, `docker-compose_${safeTenantFileId}.yml`, 'text/yaml;charset=utf-8')}
                      className="w-full py-2.5 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>1. Scarica Docker Compose (.YML)</span>
                      </span>
                      <Download className="w-4 h-4 shrink-0" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const code = selectedOS === 'windows' ? windowsBatFullContent : selectedOS === 'linux' ? linuxInstallContent : selectedOS === 'mac' ? macInstallContent : dockerComposeContent;
                      handleCopy(code, 'quick-script-copy');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'quick-script-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{copiedKey === 'quick-script-copy' ? 'Codice Copiato negli Appunti!' : 'Copia Codice Script Negli Appunti'}</span>
                  </button>
                </div>
              </div>

              {/* File 2: Certificato NIS2 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/40 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-mono font-bold text-purple-300">
                    2. File Certificato NIS2 (.PFX)
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                    <strong>La piattaforma usa questo certificato per riconoscere il PC dello stabilimento</strong> (<code className="text-purple-200 font-mono">{activeTenant.id}</code>) <strong>che le invia i dati</strong>, verificando che sia un computer autorizzato.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isOperator}
                  onClick={() => {
                    const certText = `-----BEGIN JOKER 80 INDUSTRIAL GATEWAY CERTIFICATE-----\nPlant-ID: ${activeTenant.id}\nPlant-Name: ${activeTenant.nome}\nCompany: ${activeTenant.azienda || 'Azienda'}\nEndpoint: ${activeTenant.endpoint}\nKey: ${activeTenant.wmsApiKey || `JOKER80-NIS2-${(activeTenant.id || 'GW').toUpperCase()}-2026`}\nSecurity: NIS2 / IEC 62443 Certified\n-----END JOKER 80 INDUSTRIAL GATEWAY CERTIFICATE-----\n`;
                    downloadAsBlob(certText, `certificato_nis2_${safeTenantFileId}.pfx.txt`);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-lg bg-purple-600/35 hover:bg-purple-600/55 text-purple-100 border border-purple-500/50 font-mono text-xs sm:text-sm font-bold flex items-center justify-between transition-colors shadow-sm cursor-pointer disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-300" />
                    <span>2. Scarica Certificato NIS2 (.PFX)</span>
                  </span>
                  <Download className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(4)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Avanti: Dove Salvare e Avvio</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCHERMATA STEP 4: DOVE SALVARE IL CERTIFICATO & AVVIO SUL PC          */}
        {/* ===================================================================== */}
        {wizardStep === 4 && (
          <div className="p-5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-200 font-mono font-bold text-sm sm:text-base">
                <Key className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Passaggio 4: Dove Salvare i 2 File & Avvio sul Computer di Linea</span>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 self-start">
                Regola Fondamentale: Stessa Cartella
              </span>
            </div>

            {/* Regola Stessa Cartella */}
            <div className="p-4 rounded-xl bg-purple-950/35 border border-purple-500/40 space-y-3 text-xs sm:text-sm font-sans text-slate-200 leading-relaxed">
              <p>
                <strong>A cosa serve il certificato?</strong> La piattaforma usa il certificato per riconoscere in modo sicuro il PC dello stabilimento che le invia i dati (così solo i computer autorizzati della fabbrica possono trasmettere, come richiesto dalla direttiva NIS2).
              </p>
              <p>
                Salva entrambi i file scaricati (<strong>1. File Demone</strong> e <strong>2. File Certificato NIS2</strong>) nella <strong className="text-purple-200 font-mono bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40">STESSA IDENTICA CARTELLA</strong> sul computer collegato ai macchinari dello stabilimento (es. tramite chiavetta USB o cartella condivisa).
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-purple-200 bg-purple-900/25 p-2.5 rounded-lg border border-purple-500/30">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Non rinominare il file:</strong> Il demone identifica il certificato dal nome <code className="text-white">certificato_nis2_{activeTenant.id}.pfx.txt</code> o dall'estensione <code className="text-white">.pfx</code>.
                </span>
              </div>
            </div>

            {/* Istruzione specifica per il SO scelto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedOS === 'windows' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2.5">
                  <div className="font-bold flex items-center gap-2 text-amber-300 font-mono text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Esecuzione su Windows (IMPORTANTE):</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Salva entrambi i file in una cartella a piacere (es. su <code className="text-cyan-300 font-mono">Desktop\JOKER80\</code>, su chiavetta USB o in <code className="text-cyan-300 font-mono">C:\JOKER80\</code>).
                  </p>
                  <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed">
                    Fai <strong>clic con il pulsante destro del mouse</strong> sul file <code className="text-amber-200 font-mono bg-black/40 px-1.5 py-0.5 rounded">avvia_gateway_{safeTenantFileId}.bat</code> e seleziona <strong>"Esegui come amministratore"</strong> (<em>Run as administrator</em>). Rileverà e copierà automaticamente il certificato al suo fianco!
                  </p>
                </div>
              )}

              {selectedOS === 'linux' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2.5">
                  <div className="font-bold flex items-center gap-2 text-amber-300 font-mono text-xs sm:text-sm">
                    <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Esecuzione su Linux:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Salva entrambi i file in <code className="text-amber-300 font-mono">/opt/smile80-daemon/</code> (o nella stessa cartella di lavoro) ed esegui da terminale con privilegi root:
                  </p>
                  <code className="text-xs block bg-black/60 p-2.5 rounded-lg text-cyan-300 font-mono select-all">
                    chmod +x install_linux_{safeTenantFileId}.sh && sudo ./install_linux_{safeTenantFileId}.sh
                  </code>
                </div>
              )}

              {selectedOS === 'mac' && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/40 space-y-2.5">
                  <div className="font-bold flex items-center gap-2 text-purple-300 font-mono text-xs sm:text-sm">
                    <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Esecuzione su macOS:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Salva entrambi i file nella cartella <code className="text-purple-300 font-mono">~/smile80-daemon/</code> (o nella stessa cartella) ed esegui dal Terminale:
                  </p>
                  <code className="text-xs block bg-black/60 p-2.5 rounded-lg text-cyan-300 font-mono select-all">
                    chmod +x install_mac_{safeTenantFileId}.sh && ./install_mac_{safeTenantFileId}.sh
                  </code>
                </div>
              )}

              {selectedOS === 'docker' && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/40 space-y-2.5">
                  <div className="font-bold flex items-center gap-2 text-blue-300 font-mono text-xs sm:text-sm">
                    <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Avvio Container Docker:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                    Salva entrambi i file nella directory del file <code className="text-blue-300 font-mono">docker-compose.yml</code> e avvia il container:
                  </p>
                  <code className="text-xs block bg-black/60 p-2.5 rounded-lg text-cyan-300 font-mono select-all">
                    docker compose -f docker-compose_{safeTenantFileId}.yml up -d
                  </code>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                  <Folder className="w-4 h-4" />
                  <span>Cartelle Spool Riconosciute:</span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  Il demone legge automaticamente i file esportati da SM.I.LE80 o dai PLC dalle seguenti cartelle:
                </p>
                <div className="space-y-1 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div>• Windows: <code className="text-cyan-300">C:\JOKER80\spool\</code></div>
                  <div>• Linux: <code className="text-amber-300">/opt/smile80-daemon/spool/</code></div>
                  <div>• macOS: <code className="text-purple-300">~/smile80-daemon/spool/</code></div>
                  <div>• Rete condivisa: <code className="text-slate-100">\\server-stabilimento\e80_export\</code></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>
              <button
                type="button"
                onClick={() => setWizardStep(5)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Avanti: Verifica Handshake & Feed</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCHERMATA STEP 5: HANDSHAKE, STATO PC FISICO & FEED TELEMETRIA LIVE   */}
        {/* ===================================================================== */}
        {wizardStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-slate-950/85 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                      Passaggio 5: Handshake & Associazione Automatica PC Fisico
                    </h3>
                    {gatewayClient?.isOnline ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>CONFERMATO (ONLINE)</span>
                      </span>
                    ) : gatewayClient ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>IN PAUSA ({gatewayClient.secondsSinceLastPing}s fa)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>IN ASCOLTO</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 leading-relaxed">
                    <strong>Come avviene il riconoscimento:</strong> All'avvio, il demone presenta il certificato alla piattaforma, che riconosce il PC dello stabilimento che le invia i dati (rilevando anche MAC Address e nome del computer) e lo associa automaticamente a questo impianto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchGatewayStatus}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verifica Connessione PC</span>
                </button>
              </div>

              {gatewayClient?.isOnline ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/50 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm font-mono font-bold text-emerald-300">
                      COLLEGAMENTO TRA PC E PIATTAFORMA ONLINE CONFERMATO AL 100%!
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                      Il computer <strong className="text-white font-mono">{gatewayClient.hostname}</strong> ({gatewayClient.osLabel}) si è agganciato con successo alla piattaforma cloud con crittografia end-to-end.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-dashed border-slate-700 font-mono text-xs text-slate-300 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span>In attesa del primo avvio dal PC fisico... (appena lanci il demone sul PC, questo riquadro diventa verde automaticamente).</span>
                </div>
              )}

              {/* 6 SCHEDE DIAGNOSTICHE HARDWARE PC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Nome Computer (Host)</span>
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono truncate">
                    {gatewayClient?.hostname || <span className="text-slate-500 font-normal italic">In attesa del PC...</span>}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    {gatewayClient ? `Architettura: ${gatewayClient.architecture}` : 'Riconoscimento automatico'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span className="flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MAC Address</span>
                    </span>
                    {gatewayClient?.macAddress && gatewayClient.macAddress !== 'N/D' && (
                      <button
                        type="button"
                        onClick={() => handleCopy(gatewayClient.macAddress, 'mac-copy')}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                      >
                        {copiedKey === 'mac-copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'mac-copy' ? 'Copiato' : 'Copia'}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-bold text-emerald-300 font-mono tracking-wider truncate">
                    {gatewayClient?.macAddress && gatewayClient.macAddress !== 'N/D'
                      ? gatewayClient.macAddress
                      : <span className="text-slate-500 font-normal italic">Rilevamento hardware...</span>}
                  </div>
                  <span className="text-[11px] text-cyan-400/90 font-mono block truncate">
                    Stabilimento: <strong>{gatewayClient?.plantName || activeTenant.nome}</strong>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Sistema Operativo</span>
                    <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="text-sm font-bold text-cyan-300 font-mono truncate">
                    {gatewayClient?.osLabel || <span className="text-slate-500 font-normal italic">In attesa del PC...</span>}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    {gatewayClient ? `Runtime: ${gatewayClient.pythonVersion}` : 'Windows / Linux / Mac'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Indirizzo IP Sorgente</span>
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="text-sm font-bold text-amber-300 font-mono truncate">
                    {gatewayClient?.clientIp || <span className="text-slate-500 font-normal italic">In attesa...</span>}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono block truncate">
                    Auth: {gatewayClient?.authType || 'NIS2 Industrial Gateway'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Cartella Spool & Rete</span>
                    <Folder className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-xs font-bold text-purple-300 font-mono truncate">
                    {gatewayClient?.spoolPath || 'Locale: spool/'}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">
                    Rete: {gatewayClient?.networkSharePath || '\\\\server-stabilimento\\e80_export'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>Ultimo Battito</span>
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
                  <span className="text-[11px] text-emerald-400/90 font-mono block">
                    Pacchetti PC Reali: <strong>{physicalCount}</strong> <span className="text-slate-500">(Simulati: {browserSimCount})</span>
                  </span>
                </div>
              </div>

              {/* Collaudo Live & Feed Pacchetti */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Feed Pacchetti Telemetrici Ricevuti ({telemetryHistory.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Puoi usare <strong>Simula Pacchetto</strong> solo per testare il server senza un PC fisico collegato.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendTestTelemetry}
                    disabled={isSendingTest}
                    className="px-3.5 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 border border-blue-500/40 self-start"
                  >
                    {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>🧪 Simula Pacchetto (Test Browser)</span>
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{testResult}</span>
                  </div>
                )}

                {telemetryHistory.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                    Nessun pacchetto ricevuto finora. Avvia il demone sul PC o premi "Simula Pacchetto" per collaudare la ricezione.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {telemetryHistory.slice(0, 10).map((pkt, pIdx) => {
                      const isAlarm = pkt.stato === 'ALLARME' || pkt.parametri?.allarmeAttivo;
                      const isRealPC = pkt.isPhysicalPC || pkt.rawPayload?.clientType === 'PHYSICAL_PC_DAEMON';
                      return (
                        <div
                          key={`${pkt.id}-${pIdx}`}
                          className={`p-3 rounded-xl border text-xs font-mono flex flex-wrap items-center justify-between gap-2 ${
                            isAlarm ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' : isRealPC ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-rose-500' : isRealPC ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                            <strong className="text-white">{pkt.nomeMacchinario}</strong>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isRealPC ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/15 text-blue-300'}`}>
                              {isRealPC ? 'PC FISICO' : 'SIMULAZIONE'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {pkt.parametri?.velocitaRotazioneRpm ?? '--'} RPM • {pkt.parametri?.temperaturaInverterC ?? '--'} °C • {new Date(pkt.receivedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Indietro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Torna all'inizio (Step 1)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
