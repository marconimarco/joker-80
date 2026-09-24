import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RotateCw, 
  Activity, 
  Cpu, 
  Server, 
  ExternalLink,
  ChevronRight,
  Filter,
  Flame,
  Zap,
  Clock
} from 'lucide-react';
import { PlantNotification, AutoScanSummary } from '../services/plantTelemetryScanner';
import { FactoryTenant, QuantumCalculationMeta } from '../types/quantum';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';

interface Props {
  summary: AutoScanSummary | null;
  isScanning: boolean;
  onRefreshScan: () => void;
  activeTenant: FactoryTenant;
  onOpenCircuit: (calc: QuantumCalculationMeta, state?: string) => void;
}

export const NotificationsView: React.FC<Props> = ({
  summary,
  isScanning,
  onRefreshScan,
  activeTenant,
  onOpenCircuit
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'ANOMALIES' | 'CRITICO' | 'ATTENZIONE'>('ANOMALIES');
  const [selectedNotif, setSelectedNotif] = useState<PlantNotification | null>(null);

  const notifications = summary?.notifiche || [];

  const filteredNotifs = notifications.filter(n => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'ANOMALIES') return n.livelloAllarme === 'CRITICO' || n.livelloAllarme === 'ATTENZIONE';
    if (filterLevel === 'CRITICO') return n.livelloAllarme === 'CRITICO';
    if (filterLevel === 'ATTENZIONE') return n.livelloAllarme === 'ATTENZIONE';
    return true;
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 py-1">
      {/* Top Banner Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  Centro Notifiche & Diagnostica Real-Time 21 Calcoli
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {activeTenant.nome}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Download automatico della telemetria dei nodi industriali ed elaborazione simultanea di tutti i 21 circuiti quantistici.
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sync Nodi Live</span>
            </div>
          </div>
        </div>

        {/* Metric Counter Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Calcoli Eseguiti</span>
                <span className="text-sm font-bold text-white font-mono">{summary.calcoliEseguiti} / 21</span>
              </div>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-rose-300 uppercase block">Critici (Fuori Linea)</span>
                <span className="text-sm font-bold text-rose-400 font-mono">{summary.criticiCount}</span>
              </div>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>

            <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-300 uppercase block">Attenzione Linea</span>
                <span className="text-sm font-bold text-amber-400 font-mono">{summary.attenzioneCount}</span>
              </div>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>

            <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-300 uppercase block">Ultimo Download Nodi</span>
                <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {summary.timestamp}
                </span>
              </div>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* Main Notification Area: Filters + Split List & Detail */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3">
        {/* Left Column: Notification Feed */}
        <div className="w-full md:w-7/12 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          {/* Filter Bar */}
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filtra Log:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterLevel('ANOMALIES')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  filterLevel === 'ANOMALIES'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Solo Anomalie ({summary?.anomalieTrovate || 0})
              </button>
              <button
                onClick={() => setFilterLevel('CRITICO')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  filterLevel === 'CRITICO'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Critici ({summary?.criticiCount || 0})
              </button>
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                  filterLevel === 'ALL'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tutti (21)
              </button>
            </div>
          </div>

          {/* List Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <div className="text-center font-mono">
                  <p className="text-sm font-semibold text-white">Download telemetria gateway {activeTenant.endpoint}...</p>
                  <p className="text-xs text-slate-400">Esecuzione dei 21 circuiti quantistici su NVIDIA CUDA-Q...</p>
                </div>
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-white">Nessuna anomalia riscontrata per questo filtro.</p>
                <p className="text-xs text-slate-500 mt-1">Tutti i nodi telemetrici rientrano nei parametri operativi normali.</p>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isSelected = selectedNotif?.id === notif.id;
                const isCritico = notif.livelloAllarme === 'CRITICO';
                const isAttenzione = notif.livelloAllarme === 'ATTENZIONE';

                return (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotif(notif)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md ring-1 ring-cyan-500/30'
                        : isCritico
                        ? 'bg-rose-950/15 border-rose-500/40 hover:bg-rose-950/25 hover:border-rose-400'
                        : isAttenzione
                        ? 'bg-amber-950/15 border-amber-500/40 hover:bg-amber-950/25 hover:border-amber-400'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCritico ? (
                          <span className="p-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            <Flame className="w-3.5 h-3.5" />
                          </span>
                        ) : isAttenzione ? (
                          <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              CALCOLO [{notif.calcoloId}]
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                              {notif.moduloTecnico} ➔ {notif.sottoFunzione}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-100 mt-0.5">
                            {notif.titoloProblematica}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                          isCritico
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isAttenzione
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {notif.livelloAllarme}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block mt-1">
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 font-sans mt-2 line-clamp-2">
                      {notif.dettaglioProblematica}
                    </p>

                    {/* Parameter snippet */}
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">
                        Parametro fuori linea: <code className="text-amber-300 font-bold">{notif.parametroCritico}</code> = <strong className="text-white">{notif.valoreRilevato}</strong>
                      </span>
                      <span className="text-cyan-400 flex items-center gap-1 hover:underline">
                        Dettagli <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Diagnostic & Resolution */}
        <div className="w-full md:w-5/12 flex flex-col bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden p-3.5">
          {selectedNotif ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-3">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      selectedNotif.livelloAllarme === 'CRITICO'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : selectedNotif.livelloAllarme === 'ATTENZIONE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {selectedNotif.livelloAllarme}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      Calcolo [{selectedNotif.calcoloId}] - {selectedNotif.calcoloNome}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedNotif.timestamp}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-bold text-white font-mono">
                    {selectedNotif.titoloProblematica}
                  </h3>
                  <p className="text-xs text-slate-300 font-sans mt-1.5 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    {selectedNotif.dettaglioProblematica}
                  </p>
                </div>

                {/* Directive & Immediate Action */}
                <div className="mt-3 p-3 rounded-lg bg-amber-950/25 border border-amber-500/40 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-300 block mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Direttiva Operativa Immediata SM.I.LE80:
                  </span>
                  <p className="text-amber-100 font-medium font-sans">
                    {selectedNotif.azioneImmediata}
                  </p>
                </div>

                {/* Input Telemetry Parameters read from plant */}
                <div className="mt-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1.5">
                    Dati Telemetrici Ricevuti da Impianto:
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    {Object.entries(selectedNotif.inputsUtilizzati).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between border-b border-slate-800/60 pb-0.5">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-cyan-300 font-semibold">{JSON.stringify(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Quantum JSON Payload Output */}
                <div className="mt-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1.5">
                    Payload di Risoluzione Quantistica CUDA-Q:
                  </span>
                  <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-40">
                    {JSON.stringify(selectedNotif.risultatoPayload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Button: Open Circuit Schema */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const calc = QUANTUM_CALCULATIONS.find(c => c.id === selectedNotif.calcoloId);
                    if (calc) {
                      onOpenCircuit(calc, selectedNotif.risultatoPayload.stato_collassato);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Ispeziona Circuito Quantistico (Qubits & Gates)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-mono">
              <Info className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Seleziona una notifica dall'elenco a sinistra</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Visualizzerai la causa scatenante dell'anomalia, i valori telemetrici esatti e la direttiva automatica per i PLC.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
