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
  Info
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

  // Live Test Simulation State
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : '';

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
Environment=INDUSTRIAL_GATEWAY_KEY=JOKER80-NIS2-PEDRIGNANO-GW-2026
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
        <string>JOKER80-NIS2-PEDRIGNANO-GW-2026</string>
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

  // Windows batch script content
  const windowsBatContent = `@echo off
title JOKER 80 Industrial Gateway Telemetry Daemon
set JOKER80_URL=${serverOrigin}
set INDUSTRIAL_GATEWAY_KEY=JOKER80-NIS2-PEDRIGNANO-GW-2026
set TELEMETRY_INTERVAL_SEC=${totalSeconds}

python -m pip install --quiet requests
python smile80_daemon.py
pause`;

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
                <a
                  href="/smile80_daemon.py"
                  download="smile80_daemon.py"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80_daemon.py</span>
                </a>
                <a
                  href="/api/daemon/download/linux-service"
                  download="smile80-daemon.service"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80-daemon.service</span>
                </a>
                <a
                  href="/api/daemon/download/linux-install"
                  download="install_linux.sh"
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica install_linux.sh</span>
                </a>
              </div>
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
                <a
                  href="/smile80_daemon.py"
                  download="smile80_daemon.py"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80_daemon.py</span>
                </a>
                <a
                  href="/api/daemon/download/mac-plist"
                  download="com.smile80.joker80.daemon.plist"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica com.smile80.daemon.plist</span>
                </a>
                <a
                  href="/api/daemon/download/mac-install"
                  download="install_mac.sh"
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica install_mac.sh</span>
                </a>
              </div>
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
                <a
                  href="/smile80_daemon.py"
                  download="smile80_daemon.py"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica smile80_daemon.py</span>
                </a>
                <a
                  href="/api/daemon/download/windows-bat"
                  download="start_daemon_windows.bat"
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica start_daemon_windows.bat</span>
                </a>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <span className="font-bold text-amber-400">Avvio Immediato in Prompt Comandi o PowerShell:</span>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto whitespace-pre">
                python -m pip install requests
python smile80_daemon.py
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Per trasformarlo in un servizio Windows che parte all'avvio senza utente loggato, usa <code className="text-cyan-300 font-mono">nssm install Smile80Daemon python C:\smile80\smile80_daemon.py</code> oppure la Pianificazione Attività (Task Scheduler).
              </p>
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

              <a
                href="/api/daemon/download/docker-compose"
                download="docker-compose.yml"
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica docker-compose.yml</span>
              </a>
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
              Verifica in tempo reale la ricezione dei pacchetti inviati con la frequenza configurata.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendTestTelemetry}
              disabled={isSendingTest}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
            >
              {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Invia Pacchetto Test ({selectedOS.toUpperCase()})</span>
            </button>

            <button
              type="button"
              onClick={onRefreshTelemetry}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Aggiorna Feed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
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
              Fai clic su "Invia Pacchetto Test" sopra o avvia il demone Python su Linux / Mac Apple per vedere i dati in tempo reale.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {telemetryHistory.map((pkt, pIdx) => {
              const isAlarm = pkt.stato === 'ALLARME' || pkt.parametri?.allarmeAttivo;
              const osInfo = pkt.rawPayload?.nodeMetadata?.os || pkt.nodeMetadata?.os || 'PC Locale';

              return (
                <div
                  key={`${pkt.id}-${pIdx}`}
                  className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                    isAlarm
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                      <strong className="text-white">{pkt.nomeMacchinario}</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                        {pkt.macchinarioId}
                      </span>
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
    </div>
  );
};
