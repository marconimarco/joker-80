import React, { useState } from 'react';
import { 
  QUANTUM_CALCULATIONS 
} from '../data/calculationsMeta';
import { 
  Compass, 
  HelpCircle, 
  ChevronRight, 
  Play, 
  Layers, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Check,
  X,
  Zap
} from 'lucide-react';
import { MacroCategory, QuantumCalculationMeta, UserRole, FactoryTenant } from '../types/quantum';

interface Props {
  onSelectCalculationAndInputs: (queryText: string) => void;
  onOpenCircuit: (calc: QuantumCalculationMeta) => void;
  userRole?: UserRole;
  activeTenant?: FactoryTenant;
}

const CATEGORY_NAMES: MacroCategory[] = [
  '1. Inbound & Materie Prime',
  '2. Magazzino & Stoccaggio',
  '3. Outbound & Spedizioni',
  '4. IoT & Controllo Macchine'
];

export const GuidedChatAssistant: React.FC<Props> = ({ 
  onSelectCalculationAndInputs,
  onOpenCircuit,
  userRole = 'Operatore di Linea',
  activeTenant
}) => {
  const [selectedCat, setSelectedCat] = useState<MacroCategory>('1. Inbound & Materie Prime');
  const [activeCalcId, setActiveCalcId] = useState<number>(1);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const currentCalc = QUANTUM_CALCULATIONS.find(c => c.id === activeCalcId) || QUANTUM_CALCULATIONS[0];

  // Local draft inputs for the wizard
  const [draftInputs, setDraftInputs] = useState<Record<string, any>>(() => ({ ...currentCalc.defaultInputs }));

  const handleSelectCalc = (calc: QuantumCalculationMeta) => {
    setActiveCalcId(calc.id);
    setDraftInputs({ ...calc.defaultInputs });
  };

  const handleSyncPlantTelemetry = () => {
    if (!activeTenant?.plantTopology) return;
    const topo = activeTenant.plantTopology;
    const newInputs = { ...currentCalc.defaultInputs };

    if (currentCalc.id === 1) {
      newInputs.camion_attesa = topo.baie.filter(b => b.stato === 'OCCUPATA').length + 2;
    } else if (currentCalc.id === 2) {
      newInputs.baie_libere = Math.max(1, topo.baie.filter(b => b.stato === 'LIBERA').length);
    } else if (currentCalc.id === 3) {
      newInputs.baie_totali = topo.baie.length;
    } else if (currentCalc.id === 14) {
      const bema = topo.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
      if (bema?.telemetria?.rpm) newInputs.giri_minuto = bema.telemetria.rpm;
    } else if (currentCalc.id === 15) {
      const bema = topo.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
      if (bema?.telemetria?.tensione_newton) newInputs.tensione_newton = bema.telemetria.tensione_newton;
    } else if (currentCalc.id === 16 && topo.flottaAgv.length > 0) {
      const posMap: Record<string, string> = {};
      topo.flottaAgv.slice(0, 4).forEach(agv => {
        posMap[agv.id] = agv.posizione;
      });
      newInputs.coordinate_agv_attivi = posMap;
    } else if (currentCalc.id === 17 && topo.flottaAgv.length > 0) {
      const batteryMap: Record<string, { SoC: number; Temp: number }> = {};
      topo.flottaAgv.slice(0, 4).forEach(agv => {
        batteryMap[agv.id] = { SoC: agv.batteriaSoC, Temp: agv.temperatura };
      });
      newInputs.telemetria_batterie_agv = batteryMap;
    }

    setDraftInputs(newInputs);
  };

  const handleApplyToChat = () => {
    const paramStrings = Object.entries(draftInputs).map(([k, v]) => `${k}: ${v}`).join(', ');
    const query = `Esegui Calcolo [${currentCalc.id}] (${currentCalc.name}) con i seguenti parametri: ${paramStrings}`;
    onSelectCalculationAndInputs(query);
  };

  const handleResetInputs = () => {
    setDraftInputs({ ...currentCalc.defaultInputs });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mb-3 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 transition-all w-fit cursor-pointer shadow-sm"
      >
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Apri Assistente Guidato Step-by-Step & Parametri</span>
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-2xl p-4 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              Assistente Virtuale Intelligente: Guida Interattiva ai 17 Calcoli
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Ruolo: {userRole}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Esplora i calcoli, controlla le regole sui parametri (singoli o in coppia) e le soglie anomale prima di avviare il solutore.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          title="Minimizza assistente"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Macro Categories Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORY_NAMES.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCat(cat);
              const firstInCat = QUANTUM_CALCULATIONS.find(c => c.category === cat);
              if (firstInCat) handleSelectCalc(firstInCat);
            }}
            className={`py-1.5 px-2.5 rounded-lg text-[11px] font-mono font-medium transition-all text-left truncate ${
              selectedCat === cat
                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Calculations in this Category */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Left Column: Calculation List */}
        <div className="md:col-span-5 space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {QUANTUM_CALCULATIONS.filter(c => c.category === selectedCat).map(c => {
            const isSelected = c.id === activeCalcId;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCalc(c)}
                className={`w-full p-2.5 rounded-xl text-left font-mono text-xs transition-all flex items-center justify-between border ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="text-cyan-400">[{c.id}]</span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <span>{c.subFunction}</span>
                    <span>•</span>
                    <span className="text-slate-400">{c.technicalModule}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                    c.parameterRules?.modalita === 'COPPIA'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : c.parameterRules?.modalita === 'MULTI_ENTANGLED'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`} title={`Modalità parametri: ${c.parameterRules?.modalita || 'SINGOLO'}`}>
                    {c.parameterRules?.modalita === 'COPPIA' ? 'COPPIA' : c.parameterRules?.modalita === 'MULTI_ENTANGLED' ? 'MULTI' : 'SOLO'}
                  </span>

                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                    c.entanglement === 'OBBLIGATORIO'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {c.entanglement === 'OBBLIGATORIO' ? '[+] 🔒' : '[-] 🔓'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Guided Parameter Form & Rules Details */}
        <div className="md:col-span-7 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2 flex-wrap">
                <span>Calcolo [{currentCalc.id}]: {currentCalc.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Modulo {currentCalc.technicalModule}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{currentCalc.description}</div>
            </div>

            <button
              onClick={() => onOpenCircuit(currentCalc)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
              title="Vedi circuito quantistico (gate & registri)"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          {/* Parameter Structure & Anomaly Rules Card */}
          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Modalità Parametri:
                <strong className={
                  currentCalc.parameterRules?.modalita === 'COPPIA' 
                    ? 'text-indigo-300' 
                    : currentCalc.parameterRules?.modalita === 'MULTI_ENTANGLED'
                    ? 'text-purple-300'
                    : 'text-slate-300'
                }>
                  {currentCalc.parameterRules?.modalita || 'SINGOLO'}
                </strong>
              </span>

              <span className="text-slate-500 text-[10px]">
                {currentCalc.isCrossCategory ? '[+] Cross-Reparto' : '[-] Locale'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              {currentCalc.parameterRules?.regola || 'I parametri vengono elaborati all\'interno del singolo modulo.'}
            </p>

            {currentCalc.parameterRules?.soglieAnomale && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Soglia Irregolare / Allerta di Linea:</strong> {currentCalc.parameterRules.soglieAnomale}
                </div>
              </div>
            )}
          </div>

          {/* Parameter Inputs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-cyan-400" />
                Parametri per la Simulazione:
              </span>
              <div className="flex items-center gap-2">
                {activeTenant?.plantTopology && (
                  <button
                    type="button"
                    onClick={handleSyncPlantTelemetry}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors flex items-center gap-1 font-bold"
                    title="Carica i valori rilevati in tempo reale dalle macchine e baie dell'impianto attivo"
                  >
                    <Zap className="w-3 h-3" />
                    Telemetria {activeTenant.nome.split('(')[0].trim()}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetInputs}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.keys(currentCalc.defaultInputs).map(field => {
                const val = draftInputs[field] !== undefined ? draftInputs[field] : currentCalc.defaultInputs[field];
                const isCoupled = currentCalc.parameterRules?.parametriAccoppiati?.includes(field);

                return (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                      <span className="truncate">{field}:</span>
                      {isCoupled && (
                        <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded">accoppiato</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={typeof val === 'object' ? JSON.stringify(val) : val}
                      onChange={e => {
                        let parsed: any = e.target.value;
                        if (!isNaN(Number(parsed)) && parsed.trim() !== '') {
                          parsed = Number(parsed);
                        }
                        setDraftInputs(prev => ({ ...prev, [field]: parsed }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleApplyToChat}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Invia alla Chat e Risolvi con il Kernel Quantistico</span>
          </button>
        </div>

      </div>
    </div>
  );
};

