import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Cpu, 
  Building2, 
  Factory, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  FileText, 
  Radio, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { FactoryTenant, UserAccount } from '../types/quantum';
import { PlantTelemetryHistoryService, PlantTelemetryRecord } from '../services/plantTelemetryHistory';
import { PLANT_MACHINERY_NODES } from '../data/plantNodeCalculations';

interface Props {
  activeTenant: FactoryTenant;
  currentUser: UserAccount;
  tenants: FactoryTenant[];
}

export const PlantTelemetryTrendCharts: React.FC<Props> = ({
  activeTenant,
  currentUser,
  tenants
}) => {
  const isAdmin = currentUser.ruolo === 'Amministratore';

  // Scope level: 'azienda' (Total Company) | 'stabilimento' (Specific Plant) | 'macchinario' (Specific Machinery)
  const [scopeLevel, setScopeLevel] = useState<'azienda' | 'stabilimento' | 'macchinario'>('stabilimento');

  // Time scope: 'ALL' (Da quando sono stati inseriti i primi dati) | '24H' | '7D' | 'SHIFT'
  const [timeRange, setTimeRange] = useState<'ALL' | '7D' | '24H' | 'SHIFT'>('ALL');

  // Selected company (for company scope)
  const [selectedAzienda, setSelectedAzienda] = useState<string>(activeTenant.azienda || 'Barilla G. e R. Fratelli');

  // Selected machinery node (for machinery scope)
  const [selectedMachineKey, setSelectedMachineKey] = useState<string>(() => {
    if (currentUser.allowedMachineIds && currentUser.allowedMachineIds.length > 0) {
      return currentUser.allowedMachineIds[0];
    }
    return 'BEMA_FASCIATORE';
  });

  // Hovered point for interactive tooltip
  const [hoveredPoint, setHoveredPoint] = useState<PlantTelemetryRecord | null>(null);

  // Available machinery for this user
  const availableMachines = useMemo(() => {
    if (isAdmin || !currentUser.allowedMachineIds || currentUser.allowedMachineIds.length === 0) {
      return PLANT_MACHINERY_NODES;
    }
    return PLANT_MACHINERY_NODES.filter(m => currentUser.allowedMachineIds?.includes(m.key));
  }, [isAdmin, currentUser.allowedMachineIds]);

  // Unique companies available
  const availableCompanies = useMemo(() => {
    const set = new Set<string>();
    tenants.forEach(t => {
      if (t.azienda) set.add(t.azienda);
    });
    return Array.from(set);
  }, [tenants]);

  // Query records from history service
  const records = useMemo(() => {
    let companyFilter: string | undefined = undefined;
    let plantFilter: string | undefined = undefined;

    if (scopeLevel === 'azienda') {
      companyFilter = selectedAzienda;
    } else if (scopeLevel === 'stabilimento' || scopeLevel === 'macchinario') {
      plantFilter = activeTenant.id;
    }

    const filtered = PlantTelemetryHistoryService.getFilteredHistory({
      azienda: companyFilter,
      stabilimentoId: plantFilter,
      timeRange
    });

    return filtered;
  }, [scopeLevel, selectedAzienda, activeTenant.id, timeRange]);

  // Earliest record timestamp
  const firstRecord = records[0];
  const lastRecord = records[records.length - 1];

  // Selected machine definition
  const currentMachineDef = useMemo(() => {
    return PLANT_MACHINERY_NODES.find(m => m.key === selectedMachineKey) || PLANT_MACHINERY_NODES[0];
  }, [selectedMachineKey]);

  // Chart coordinates calculation (SVG SVG viewBox: 0 0 800 240)
  const chartWidth = 800;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const graphW = chartWidth - paddingX * 2;
  const graphH = chartHeight - paddingY * 2;

  const pointsData = useMemo(() => {
    if (records.length === 0) return [];
    const minVal = 40;
    const maxVal = 100;

    return records.map((r, i) => {
      const x = paddingX + (i / Math.max(1, records.length - 1)) * graphW;
      
      // Metric 1: Indice di salute / stabilità (0-100)
      const health = r.indiceSaluteGlobale || 85;
      const yHealth = chartHeight - paddingY - ((health - minVal) / (maxVal - minVal)) * graphH;

      // Metric 2: OEE %
      const oee = r.oee || 80;
      const yOee = chartHeight - paddingY - ((oee - minVal) / (maxVal - minVal)) * graphH;

      // Metric 3: Parametro fisico macchina
      const machData = r.macchinari?.[selectedMachineKey];
      let machineVal = 0;
      let machineUnit = '';
      if (selectedMachineKey === 'BEMA_FASCIATORE') {
        machineVal = machData?.vibrazioneG ?? 0.4;
        machineUnit = 'mm/s';
      } else if (selectedMachineKey === 'FLOTTA_LGV') {
        machineVal = machData?.batteriaSoC ?? 85;
        machineUnit = '% SoC';
      } else if (selectedMachineKey === 'BAIE_INBOUND_OUTBOUND') {
        machineVal = machData?.ritardoMinuti ?? 12;
        machineUnit = 'min ritardo';
      } else {
        machineVal = machData?.cicliOra ?? 85;
        machineUnit = 'cicli/h';
      }

      return {
        record: r,
        x,
        yHealth: Math.max(paddingY, Math.min(chartHeight - paddingY, yHealth)),
        yOee: Math.max(paddingY, Math.min(chartHeight - paddingY, yOee)),
        health,
        oee,
        machineVal,
        machineUnit
      };
    });
  }, [records, selectedMachineKey, graphW, graphH, chartHeight]);

  // Build SVG path strings
  const healthPath = useMemo(() => {
    if (pointsData.length === 0) return '';
    return pointsData.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.yHealth}` : `${acc} L ${p.x} ${p.yHealth}`;
    }, '');
  }, [pointsData]);

  const oeePath = useMemo(() => {
    if (pointsData.length === 0) return '';
    return pointsData.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.yOee}` : `${acc} L ${p.x} ${p.yOee}`;
    }, '');
  }, [pointsData]);

  const healthAreaPath = useMemo(() => {
    if (pointsData.length === 0) return '';
    const firstX = pointsData[0].x;
    const lastX = pointsData[pointsData.length - 1].x;
    const bottomY = chartHeight - paddingY;
    return `${healthPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [healthPath, pointsData, chartHeight, paddingY]);

  // Overall plant / machine status badge
  const currentStatus = useMemo(() => {
    if (!lastRecord) return { label: 'A REGIME', color: 'emerald', icon: CheckCircle2 };
    if (lastRecord.criticiCount > 0) return { label: 'CRITICO - INTERVENTO', color: 'rose', icon: AlertOctagon };
    if (lastRecord.attenzioneCount > 0) return { label: 'ATTENZIONE', color: 'amber', icon: AlertTriangle };
    return { label: 'OTTIMALE', color: 'emerald', icon: CheckCircle2 };
  }, [lastRecord]);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-cyan-500/30 shadow-2xl space-y-4 font-mono text-xs">
      
      {/* Intestazione e Controlli del Grafico di Andamento */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                Andamento Dati & Risultati Quantistici
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Storico Continuo
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monitoraggio evolutivo di telemetria, OEE e rischio QPU da quando sono stati inseriti i primi dati.
              </p>
            </div>
          </div>
        </div>

        {/* Selettore Livello Aggregazione (Società / Stabilimento / Singolo Macchinario) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start lg:self-center">
          <button
            type="button"
            onClick={() => setScopeLevel('azienda')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scopeLevel === 'azienda'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Visualizza aggregato di tutti gli stabilimenti della società"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Totale Società</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeLevel('stabilimento')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scopeLevel === 'stabilimento'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Visualizza dati dello stabilimento attivo"
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Stabilimento</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeLevel('macchinario')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              scopeLevel === 'macchinario'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Visualizza parametri del singolo macchinario o nodo autorizzato"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Singolo Macchinario</span>
          </button>
        </div>
      </div>

      {/* Barra Filtri Secondari (Azienda, Macchinario e Arco Temporale) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selettore Azienda (se livello 'azienda') */}
          {scopeLevel === 'azienda' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Società:</span>
              <select
                value={selectedAzienda}
                onChange={e => setSelectedAzienda(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
              >
                {availableCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Selettore Macchinario / Nodo (se livello 'macchinario') */}
          {scopeLevel === 'macchinario' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Macchinario:</span>
              <select
                value={selectedMachineKey}
                onChange={e => setSelectedMachineKey(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 max-w-[280px]"
              >
                {availableMachines.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dettaglio del Target Attuale */}
          <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-500">Target:</span>
            <strong className="text-cyan-300">
              {scopeLevel === 'azienda' 
                ? selectedAzienda 
                : scopeLevel === 'stabilimento' 
                  ? activeTenant.nome 
                  : currentMachineDef.label.split('(')[0].trim()}
            </strong>
          </div>
        </div>

        {/* Selettore Arco Temporale */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 mr-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Arco:</span>
          </span>
          <button
            type="button"
            onClick={() => setTimeRange('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              timeRange === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dall'inserimento dei primi dati (storico completo)"
          >
            Da Inizio Dati
          </button>

          <button
            type="button"
            onClick={() => setTimeRange('7D')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              timeRange === '7D'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 Giorni
          </button>

          <button
            type="button"
            onClick={() => setTimeRange('24H')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              timeRange === '24H'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24 Ore
          </button>

          <button
            type="button"
            onClick={() => setTimeRange('SHIFT')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              timeRange === 'SHIFT'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Turno (8h)
          </button>
        </div>
      </div>

      {/* KPI Riassuntivi dell'Arco Temporale */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Primo Dato Registrato</div>
          <div className="text-xs font-bold text-white mt-1 truncate">
            {firstRecord ? firstRecord.timestamp : 'In attesa'}
          </div>
          <div className="text-[9px] text-cyan-400 mt-0.5 truncate">
            {firstRecord?.fonte.replace(/_/g, ' ') || 'Archivio'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Ultimo Campionamento</div>
          <div className="text-xs font-bold text-white mt-1 truncate">
            {lastRecord ? lastRecord.timestamp : 'Oggi'}
          </div>
          <div className="text-[9px] text-emerald-400 mt-0.5 truncate flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>{lastRecord?.fonte.replace(/_/g, ' ') || 'Live Gateway'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-[10px] text-slate-400">Punti Campionati</div>
          <div className="text-xs font-bold text-cyan-300 mt-1">
            {records.length} campioni nel tempo
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">
            Campionamento continuo
          </div>
        </div>

        <div className={`p-3 rounded-xl border bg-slate-950/70 ${
          currentStatus.color === 'rose'
            ? 'border-rose-500/40 text-rose-300'
            : currentStatus.color === 'amber'
              ? 'border-amber-500/40 text-amber-300'
              : 'border-emerald-500/40 text-emerald-300'
        }`}>
          <div className="text-[10px] text-slate-400">Stato Impianto / Nodo</div>
          <div className="text-xs font-bold mt-1 flex items-center gap-1.5">
            <currentStatus.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{currentStatus.label}</span>
          </div>
          <div className="text-[9px] opacity-80 mt-0.5">
            {lastRecord?.criticiCount ? `${lastRecord.criticiCount} allarmi attivi` : 'Nessuna anomalia critica'}
          </div>
        </div>
      </div>

      {/* Grafico SVG Responsivo con Curve di Andamento */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-800 relative">
        <div className="flex items-center justify-between text-[11px] mb-2 px-1">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" />
              <span>Indice di Stabilità & Salute Quantistica (%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <span className="w-3 h-1 bg-purple-400 rounded-full" />
              <span>OEE di Linea (%)</span>
            </div>
            {scopeLevel === 'macchinario' && (
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-3 h-1 bg-emerald-400 rounded-full" />
                <span>Parametro Fisico ({selectedMachineKey === 'BEMA_FASCIATORE' ? 'Vibrazioni mm/s' : selectedMachineKey === 'FLOTTA_LGV' ? 'Batteria SoC %' : 'Ritardo min'})</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Passa il mouse sui nodi per i dettagli dell'evento
          </span>
        </div>

        {/* SVG Container */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 sm:h-56 select-none"
          >
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Griglia orizzontale */}
            {[100, 80, 60].map((level) => {
              const y = chartHeight - paddingY - ((level - 40) / 60) * graphH;
              return (
                <g key={level}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Area riempita sotto la curva di salute */}
            {healthAreaPath && (
              <path d={healthAreaPath} fill="url(#healthGradient)" />
            )}

            {/* Linea OEE */}
            {oeePath && (
              <path
                d={oeePath}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="2 2"
                strokeLinecap="round"
              />
            )}

            {/* Linea Indice Salute Quantistica */}
            {healthPath && (
              <path
                d={healthPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Punti campionati nel tempo */}
            {pointsData.map((pt, i) => {
              const hasAlert = pt.record.criticiCount > 0;
              const hasWarning = pt.record.attenzioneCount > 0;
              const isHovered = hoveredPoint?.id === pt.record.id;

              return (
                <g key={pt.record.id} className="cursor-pointer">
                  {/* Punto sulla linea salute */}
                  <circle
                    cx={pt.x}
                    cy={pt.yHealth}
                    r={isHovered ? 6 : hasAlert ? 4.5 : 3.5}
                    fill={hasAlert ? '#f43f5e' : hasWarning ? '#f59e0b' : '#06b6d4'}
                    stroke="#020617"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredPoint(pt.record)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Asse orizzontale timestamp label (mostra solo alcuni punti per leggibilità) */}
                  {(i === 0 || i === Math.floor(pointsData.length / 2) || i === pointsData.length - 1) && (
                    <text
                      x={pt.x}
                      y={chartHeight - 8}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor={i === 0 ? 'start' : i === pointsData.length - 1 ? 'end' : 'middle'}
                      fontFamily="monospace"
                    >
                      {pt.record.timestamp.split(' ')[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip Dinamico al passaggio del mouse */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 z-20 p-3 rounded-xl bg-slate-900 border border-cyan-500/50 shadow-2xl text-[11px] font-mono text-slate-200 pointer-events-none animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-bold text-white">{hoveredPoint.timestamp}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {hoveredPoint.fonte.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <div>Salute Quantistica: <strong className="text-cyan-400">{hoveredPoint.indiceSaluteGlobale}%</strong></div>
              <div>OEE Linea: <strong className="text-purple-400">{hoveredPoint.oee}%</strong></div>
              <div>Throughput: <strong className="text-slate-300">{hoveredPoint.throughputPalletOra} pallet/ora</strong></div>
              {hoveredPoint.criticiCount > 0 ? (
                <div className="text-rose-400 font-bold">⚠️ {hoveredPoint.criticiCount} Problematica Critica Rilevata</div>
              ) : hoveredPoint.attenzioneCount > 0 ? (
                <div className="text-amber-400 font-bold">⚡ {hoveredPoint.attenzioneCount} Parametri in Attenzione</div>
              ) : (
                <div className="text-emerald-400">✓ Operazioni regolari a regime</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nota Operativa */}
      <div className="text-[10px] text-slate-400 flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
        <span>
          Visualizzazione automatica aggiornata con ogni acquisizione da demone Python mTLS o caricamento file CSV.
        </span>
        <span className="text-cyan-400">
          Nessuna manipolazione manuale necessaria: diagnosi in tempo reale attiva.
        </span>
      </div>

    </div>
  );
};
