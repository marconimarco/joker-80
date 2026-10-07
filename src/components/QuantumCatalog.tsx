import React, { useState, useMemo, useEffect } from 'react';
import { 
  QUANTUM_CALCULATIONS, 
} from '../data/calculationsMeta';
import { QuantumCalculationMeta, MacroCategory, FactoryTenant } from '../types/quantum';
import { QuantumEngine } from '../services/quantumEngine';
import { isCalculationSupportedByPlant, PLANT_NODE_REQUIREMENTS } from '../data/plantNodeCalculations';
import { ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION } from '../data/quantumLogicDocumentation';
import { 
  Cpu, 
  Lock, 
  Unlock, 
  Play, 
  Copy, 
  Check, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sliders,
  HelpCircle,
  Share2,
  Network,
  X,
  UploadCloud,
  Filter,
  Sparkles,
  Zap,
  Focus,
  Eye,
  Maximize2,
  FileText,
  Download,
  BookOpen
} from 'lucide-react';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta, state?: string) => void;
  allowPlcWrite: boolean;
  targetInspectCalcId?: number | null;
  onClearInspectTarget?: () => void;
  activeTenant?: FactoryTenant;
  onOpenCsvUpload?: () => void;
  importedInputs?: Record<string, any>;
}

const CATEGORIES: MacroCategory[] = [
  '1. Inbound & Materie Prime',
  '2. Magazzino & Stoccaggio',
  '3. Outbound & Spedizioni',
  '4. IoT & Controllo Macchine'
];

export const QuantumCatalog: React.FC<Props> = ({ 
  onOpenCircuit, 
  allowPlcWrite,
  targetInspectCalcId,
  onClearInspectTarget,
  activeTenant,
  onOpenCsvUpload,
  importedInputs
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MacroCategory | 'ALL'>('1. Inbound & Materie Prime');
  const [filterOnlyPlantNodes, setFilterOnlyPlantNodes] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLogicDocModalOpen, setIsLogicDocModalOpen] = useState<boolean>(false);

  const [formInputs, setFormInputs] = useState<Record<number, Record<string, any>>>(() => {
    const initial: Record<number, Record<string, any>> = {};
    for (const c of QUANTUM_CALCULATIONS) {
      initial[c.id] = { ...c.defaultInputs };
    }
    if (activeTenant?.id) {
      try {
        const saved = localStorage.getItem(`joker_custom_telemetry_${activeTenant.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          for (const c of QUANTUM_CALCULATIONS) {
            initial[c.id] = { ...initial[c.id], ...parsed };
          }
        }
      } catch {}
    }
    return initial;
  });

  // Re-sync form inputs when activeTenant changes or receives custom telemetry
  useEffect(() => {
    if (activeTenant?.id) {
      try {
        const saved = localStorage.getItem(`joker_custom_telemetry_${activeTenant.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormInputs(prev => {
            const next = { ...prev };
            for (const c of QUANTUM_CALCULATIONS) {
              next[c.id] = { ...(c.defaultInputs || {}), ...(next[c.id] || {}), ...parsed };
            }
            return next;
          });
        }
      } catch {}
    }
  }, [activeTenant?.id]);

  // When importedInputs changes from CSV upload, inject them immediately into all calculations
  useEffect(() => {
    if (importedInputs && Object.keys(importedInputs).length > 0) {
      setFormInputs(prev => {
        const next = { ...prev };
        for (const c of QUANTUM_CALCULATIONS) {
          next[c.id] = { ...(c.defaultInputs || {}), ...(next[c.id] || {}), ...importedInputs };
        }
        return next;
      });
      setToastMessage(`Dati CSV importati con successo nel catalogo (${Object.keys(importedInputs).length} parametri)!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  }, [importedInputs]);

  const [results, setResults] = useState<Record<number, any>>({});
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCpuCalc, setSelectedCpuCalc] = useState<QuantumCalculationMeta | null>(null);
  const [hoveredCalcId, setHoveredCalcId] = useState<number | null>(null);

  // Helper to format any input value for UI display
  const formatInputValue = (val: any): string => {
    if (val === undefined || val === null) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return JSON.stringify(val);
  };

  // Helper to flexibly parse user inputs (numbers, JSON arrays, comma-separated lists)
  const parseFlexibleInput = (val: any): any => {
    if (val === undefined || val === null) return val;
    if (typeof val === "number" || typeof val === "boolean") return val;
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) return val;
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (trimmed === "") return 0;
    // JSON arrays and objects
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        const cleaned = trimmed.replace(/^[|]$/g, "");
        const parts = cleaned.split(/[,;s]+/).map(s => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
        const nums = parts.map(Number);
        if (nums.length > 0 && nums.every(n => !isNaN(n))) return nums;
        if (parts.length > 0) return parts;
      }
    }
    // Comma-separated list
    if (trimmed.includes(",")) {
      const parts = trimmed.split(",").map(s => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
      const nums = parts.map(Number);
      if (nums.length > 0 && nums.every(n => !isNaN(n))) return nums;
      return parts;
    }
    // Pure number
    if (!isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed))) {
      return Number(trimmed);
    }
    return val;
  };

  // When instructed via voice or navigation to inspect a calculation:
  React.useEffect(() => {
    if (targetInspectCalcId) {
      const target = QUANTUM_CALCULATIONS.find(c => c.id === targetInspectCalcId);
      if (target) {
        setSelectedCategory(target.category);
        setSelectedCpuCalc(target);
        onClearInspectTarget?.();
      }
    }
  }, [targetInspectCalcId, onClearInspectTarget]);

  // Calculations supported by the active plant's hardware nodes
  const plantSupportedCalcs = useMemo(() => {
    return QUANTUM_CALCULATIONS.filter(c => isCalculationSupportedByPlant(c.id, activeTenant));
  }, [activeTenant]);

  // Calculations displayed after applying plant nodes filter and selected category
  const displayedCalculations = useMemo(() => {
    const pool = (filterOnlyPlantNodes && activeTenant) ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
    if (selectedCategory === 'ALL') return pool;
    return pool.filter(c => c.category === selectedCategory);
  }, [filterOnlyPlantNodes, activeTenant, plantSupportedCalcs, selectedCategory]);

  // ID del calcolo attualmente selezionato per lavorarci (quando attivo, gli altri si nascondono a scomparsa)
  const [focusedCalcId, setFocusedCalcId] = useState<number | null>(null);

  // Calcolo attivo in focus
  const focusedCalcMeta = useMemo(() => {
    if (focusedCalcId === null) return null;
    return QUANTUM_CALCULATIONS.find(c => c.id === focusedCalcId) || null;
  }, [focusedCalcId]);

  // Elenco effettivo visualizzato: se focusedCalcId è impostato, mostra solo quel calcolo e nasconde tutti gli altri
  const visibleCalculations = useMemo(() => {
    if (focusedCalcId !== null) {
      const match = (filterOnlyPlantNodes && activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS).find(c => c.id === focusedCalcId);
      if (match) return [match];
      const fallback = QUANTUM_CALCULATIONS.find(c => c.id === focusedCalcId);
      return fallback ? [fallback] : displayedCalculations;
    }
    return displayedCalculations;
  }, [focusedCalcId, displayedCalculations, filterOnlyPlantNodes, activeTenant, plantSupportedCalcs]);

  const handleInputChange = (calcId: number, field: string, value: any) => {
    const meta = QUANTUM_CALCULATIONS.find(c => c.id === calcId);
    setFormInputs(prev => ({
      ...prev,
      [calcId]: {
        ...(meta?.defaultInputs || {}),
        ...(prev[calcId] || {}),
        [field]: value
      }
    }));
  };

  const executeCalculation = async (calc: QuantumCalculationMeta) => {
    setExecutingId(calc.id);
    const rawInputs = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
    const inputs: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawInputs)) {
      inputs[k] = parseFlexibleInput(v);
    }
    
    try {
      // Simulate GPU quantum sampling delay
      await new Promise(r => setTimeout(r, 260));
      const res = await QuantumEngine.executeCalculation(calc.id, inputs);
      setResults(prev => ({ ...prev, [calc.id]: res }));
      setToastMessage(`⚡ Calcolo [${calc.id}] "${calc.name}" eseguito con successo con i parametri inseriti!`);
      setTimeout(() => setToastMessage(null), 3500);

      // Auto-scroll directly to result card so the user sees immediate feedback
      setTimeout(() => {
        const el = document.getElementById(`result-card-${calc.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    } catch (err: any) {
      console.error('Execution error for calc', calc.id, err);
      setResults(prev => ({ ...prev, [calc.id]: { error: err.message || 'Errore esecuzione calcolo' } }));
      setToastMessage(`❌ Errore durante l'esecuzione del calcolo: ${err.message || 'Verifica parametri'}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setExecutingId(null);
    }
  };

  const copyResult = (calcId: number, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(calcId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Active Plant Nodes & Calculations Banner with Carica CSV */}
      {activeTenant && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shrink-0 shadow-sm shadow-cyan-500/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm sm:text-base">
                  Calcoli dello Stabilimento: {activeTenant.nome}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {plantSupportedCalcs.length} calcoli operativi su 21 abilitati
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeTenant.azienda || 'Azienda'} #{activeTenant.numeroStabilimento || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {filterOnlyPlantNodes
                  ? `Mostrando esclusivamente i calcoli compatibili con i macchinari e i nodi fisici installati in "${activeTenant.nome}" (${activeTenant.sito}).`
                  : `Visualizzazione estesa a tutti i 21 nodi dell'infrastruttura Elettric80.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* PULSANTE CARICA CSV DELLO STABILIMENTO (Accessibile sia come Admin che come Utente) */}
            {onOpenCsvUpload && (
              <button
                type="button"
                onClick={onOpenCsvUpload}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98]"
                title={`Carica file CSV telemetria per lo stabilimento attivo (${activeTenant.nome})`}
              >
                <UploadCloud className="w-4 h-4 text-emerald-200" />
                <span>Carica CSV Stabilimento</span>
              </button>
            )}

            {/* FILTRO NODI ATTIVO */}
            <button
              type="button"
              onClick={() => setFilterOnlyPlantNodes(!filterOnlyPlantNodes)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                filterOnlyPlantNodes
                  ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/60 hover:bg-cyan-600/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Attiva/Disattiva il filtro per mostrare solo i calcoli che lo stabilimento può effettuare"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterOnlyPlantNodes ? `Filtro Stabilimento Attivo (${plantSupportedCalcs.length}/21)` : 'Mostra Tutti i 21 Nodi'}</span>
            </button>

            {/* DOCUMENTAZIONE LOGICA DEI 21 CALCOLI (Copia & Scarica) */}
            <button
              type="button"
              onClick={() => setIsLogicDocModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Apri casella di testo con tutta la logica quantistica e classica dei 21 calcoli per copiarla o scaricarla"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Logica 21 Calcoli (Copia & Scarica)</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs: Smooth touch-scroll on smartphones */}
      <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar touch-pan-x flex-nowrap sm:flex-wrap">
        {/* Tab "TUTTI I CALCOLI" per vedere l'insieme completo dei calcoli dello stabilimento */}
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`shrink-0 sm:flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap min-h-[38px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedCategory === 'ALL'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span>TUTTI I CALCOLI</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${selectedCategory === 'ALL' ? 'bg-black/30 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
            {(filterOnlyPlantNodes && activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS).length}
          </span>
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const countInCat = (filterOnlyPlantNodes && activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS).filter(c => c.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 sm:flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap min-h-[38px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{cat}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-black/30 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                {countInCat}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra di Selezione Rapida Calcolo (Modalità Singolo Calcolo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Focus className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300 font-bold">Lavora su un Calcolo Specifico:</span>
          <select
            value={focusedCalcId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setFocusedCalcId(val === '' ? null : Number(val));
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-xs focus:outline-none focus:border-cyan-400 cursor-pointer max-w-full sm:max-w-md"
          >
            <option value="">Tutti i calcoli abilitati ({displayedCalculations.length})</option>
            {displayedCalculations.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.id}] {c.name} ({c.technicalModule})
              </option>
            ))}
          </select>
        </div>

        {focusedCalcId !== null && (
          <button
            type="button"
            onClick={() => setFocusedCalcId(null)}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-300" />
            <span>Mostra tutti i calcoli ({displayedCalculations.length})</span>
          </button>
        )}
      </div>

      {/* Banner Modalità Focalizzata quando un calcolo è attivo ed isolato */}
      {focusedCalcId !== null && focusedCalcMeta && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
              <Focus className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">
                  Calcolo [{focusedCalcId}] Selezionato in Modalità Focalizzata
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Gli altri {displayedCalculations.length > 1 ? displayedCalculations.length - 1 : 0} calcoli sono temporaneamente nascosti
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Stai lavorando ed inserendo manualmente i parametri per questo specifico calcolo quantistico.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFocusedCalcId(null)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
            title="Fai ricomparire tutti i calcoli dell'elenco"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Mostra Tutti i Calcoli ({displayedCalculations.length})</span>
          </button>
        </div>
      )}

      {/* Calculations Grid */}
      <div className={focusedCalcId !== null ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"}>
        {visibleCalculations.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl font-mono text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
            <p className="text-sm font-bold text-slate-200">
              Nessun macchinario o nodo presente in questa categoria per lo stabilimento attivo.
            </p>
            <p className="text-xs">
              Fai clic su "Mostra Tutti i 21 Nodi" in alto per visualizzare l'intero catalogo Elettric80.
            </p>
          </div>
        ) : (
          visibleCalculations.map((calc) => {
            const isLocked = calc.entanglement === 'OBBLIGATORIO';
            const inputs = formInputs[calc.id] || calc.defaultInputs;
            const result = results[calc.id];
            const isBusy = executingId === calc.id;
            const nodeReq = PLANT_NODE_REQUIREMENTS[calc.id];
            const isSupported = isCalculationSupportedByPlant(calc.id, activeTenant);

          return (
            <div 
              key={calc.id}
              className={`bg-slate-900 border rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 sm:space-y-5 transition-colors ${
                isSupported ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-85'
              }`}
            >
              {/* Connected Plant Node Badge */}
              {nodeReq && (
                <div className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono flex items-center justify-between border ${
                  isSupported
                    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/80 shadow-xs'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800'
                }`}>
                  <span className="flex items-center gap-1.5 truncate">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Nodo Associato: <strong className="text-white">{nodeReq.nodeName}</strong></span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold shrink-0 ${
                    isSupported 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isSupported ? '✓ Presente nello Stabilimento' : 'Macchinario Assente'}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border flex items-center gap-1.5 ${
                      isLocked
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isLocked ? (
                        <>
                          <span className="font-extrabold text-amber-200">[+]</span>
                          <Lock className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span className="font-extrabold text-emerald-300">[-]</span>
                          <Unlock className="w-3.5 h-3.5" />
                        </>
                      )}
                      Calcolo [{calc.id}] {isLocked ? 'INCROCIATO' : 'LOCALE'}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {calc.technicalModule}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {calc.subFunction}
                    </span>

                    {/* Punto di domanda '?' per visualizzare la riga esatta di Telemetria CPU */}
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setSelectedCpuCalc(calc)}
                        onMouseEnter={() => setHoveredCalcId(calc.id)}
                        onMouseLeave={() => setHoveredCalcId(null)}
                        className="p-1 sm:p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm group flex items-center gap-1"
                        title="Visualizza telemetria CPU / specifiche tecniche complete del calcolo (Punto di domanda)"
                      >
                        <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-mono font-bold text-cyan-400">?</span>
                      </button>

                      {/* Tooltip popup al passaggio del mouse */}
                      {hoveredCalcId === calc.id && !selectedCpuCalc && (
                        <div className="absolute z-50 right-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md text-left font-mono text-[11px] pointer-events-none animate-in fade-in zoom-in-95 space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                            <span className="font-bold text-cyan-400 flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" />
                              Telemetria CPU [{calc.id}]
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${calc.isCrossCategory ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {calc.isCrossCategory ? '[+] INCROCIATO' : '[-] LOCALE'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block font-semibold">Dati e Parametri Telemetria CPU:</span>
                            <span className="text-slate-200 text-[10px] leading-snug">
                              {calc.crossCategoryDetails?.parametersOrData || calc.description}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                            <span>Target: <strong className="text-slate-300">{calc.hardwareTarget.split('/')[0]}</strong></span>
                            <span className="text-cyan-400 font-bold">Clicca per dettagli completi</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {calc.isCrossCategory && calc.crossCategoryDetails && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs font-mono flex items-center justify-between gap-2 text-amber-300">
                    <span className="font-semibold text-[11px]">
                      [+] Incrociato con: {calc.crossCategoryDetails.crossedWith}
                    </span>
                    <span className="text-[10px] text-amber-400/80 px-1.5 py-0.5 rounded bg-amber-500/20">
                      {calc.crossCategoryDetails.modules}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 font-mono">
                      {calc.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {calc.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFocusedCalcId(focusedCalcId === calc.id ? null : calc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border shadow-xs ${
                      focusedCalcId === calc.id
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                        : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-500/50 hover:border-cyan-400'
                    }`}
                    title={focusedCalcId === calc.id ? "Mostra di nuovo tutti i calcoli" : "Lavora solo su questo calcolo e nascondi momentaneamente tutti gli altri"}
                  >
                    {focusedCalcId === calc.id ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Mostra Tutti</span>
                      </>
                    ) : (
                      <>
                        <Focus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lavora solo su questo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Parameter Controls */}
              <div 
                onFocusCapture={() => { if (focusedCalcId === null) setFocusedCalcId(calc.id); }}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4"
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Parametri di Fabbrica (Input)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Target: {calc.hardwareTarget.split('/')[0]}
                  </span>
                </div>

                {/* Calcolo 1 */}
                {calc.id === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Camion in attesa</label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.camion_attesa}
                        onChange={e => handleInputChange(1, 'camion_attesa', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Ritardo (min)</label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.minuti_ritardo}
                        onChange={e => handleInputChange(1, 'minuti_ritardo', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Saturazione WMS (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={inputs.saturazione_wms}
                        onChange={e => handleInputChange(1, 'saturazione_wms', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 2 */}
                {calc.id === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Ritardo Stimato (minuti)</label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.ritardo_stimato_minuti}
                        onChange={e => handleInputChange(2, 'ritardo_stimato_minuti', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Baie di scarico libere</label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.baie_libere}
                        onChange={e => handleInputChange(2, 'baie_libere', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 3 */}
                {calc.id === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Ore Turno Disponibili</label>
                      <input
                        type="number"
                        min="1"
                        value={inputs.ore_lavoro_disponibili}
                        onChange={e => handleInputChange(3, 'ore_lavoro_disponibili', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Baie Totali da Coprire</label>
                      <input
                        type="number"
                        min="1"
                        value={inputs.baie_totali}
                        onChange={e => handleInputChange(3, 'baie_totali', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 4 */}
                {calc.id === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Umidità Rilevata (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.umidita_rilevata}
                        onChange={e => handleInputChange(4, 'umidita_rilevata', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Micro-spessore Film (micron)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.spessore_micro}
                        onChange={e => handleInputChange(4, 'spessore_micro', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 5 */}
                {calc.id === 5 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">ID Lotto Materiale</label>
                      <input
                        type="text"
                        value={inputs.id_lotto_materiale}
                        onChange={e => handleInputChange(5, 'id_lotto_materiale', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Codice Fornitore</label>
                      <input
                        type="text"
                        value={inputs.codice_fornitore}
                        onChange={e => handleInputChange(5, 'codice_fornitore', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 6 */}
                {calc.id === 6 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">ID Pallet</label>
                      <input
                        type="text"
                        value={inputs.id_pallet}
                        onChange={e => handleInputChange(6, 'id_pallet', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Classe Rotazione</label>
                      <select
                        value={inputs.classe_rotazione}
                        onChange={e => handleInputChange(6, 'classe_rotazione', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      >
                        <option value="HIGH">HIGH (Alta)</option>
                        <option value="MEDIUM">MEDIUM (Media)</option>
                        <option value="LOW">LOW (Bassa)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Celle 3D Libere</label>
                      <input
                        type="number"
                        min="0"
                        value={inputs.celle_libere_3d}
                        onChange={e => handleInputChange(6, 'celle_libere_3d', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 7 */}
                {calc.id === 7 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Micro-inclinazione (Gradi)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.micro_inclinazione}
                        onChange={e => handleInputChange(7, 'micro_inclinazione', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Vettore Pressione (Bar)</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.vettore_pressione_bar)}
                        onChange={e => {
                          try {
                            handleInputChange(7, 'vettore_pressione_bar', JSON.parse(e.target.value));
                          } catch {
                            // keep raw
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 8 */}
                {calc.id === 8 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Coordinate Partenza</label>
                      <input
                        type="text"
                        value={inputs.coordinate_partenza}
                        onChange={e => handleInputChange(8, 'coordinate_partenza', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Lista ID Pallet</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.lista_id_pallet)}
                        onChange={e => {
                          try {
                            handleInputChange(8, 'lista_id_pallet', JSON.parse(e.target.value));
                          } catch {}
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 9 */}
                {calc.id === 9 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Coefficiente Traffico (0 - 1.0)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={inputs.coefficiente_traffico}
                        onChange={e => handleInputChange(9, 'coefficiente_traffico', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Ordini Camion</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.lista_ordini_camion)}
                        onChange={e => {
                          try {
                            handleInputChange(9, 'lista_ordini_camion', JSON.parse(e.target.value));
                          } catch {}
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 10 */}
                {calc.id === 10 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Volume Cassone Camion (mc)</label>
                      <input
                        type="number"
                        value={inputs.volume_disponibile_mc}
                        onChange={e => handleInputChange(10, 'volume_disponibile_mc', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Lista Pesi Pallet (kg)</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.lista_pesi_pallet)}
                        onChange={e => {
                          try {
                            handleInputChange(10, 'lista_pesi_pallet', JSON.parse(e.target.value));
                          } catch {}
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 11 */}
                {calc.id === 11 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">ID Contratto Vettore</label>
                      <input
                        type="text"
                        value={inputs.id_contratto_vettore}
                        onChange={e => handleInputChange(11, 'id_contratto_vettore', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Dati e-CMR Spedizione</label>
                      <input
                        type="text"
                        value={inputs.dati_ecmr}
                        onChange={e => handleInputChange(11, 'dati_ecmr', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 12 */}
                {calc.id === 12 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Camion in Piazzale</label>
                      <input
                        type="number"
                        value={inputs.camion_in_piazzale}
                        onChange={e => handleInputChange(12, 'camion_in_piazzale', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Pallet Pronti Fine Linea</label>
                      <input
                        type="number"
                        value={inputs.pallet_pronti_linea}
                        onChange={e => handleInputChange(12, 'pallet_pronti_linea', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 13 */}
                {calc.id === 13 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Camion in Attesa</label>
                      <input
                        type="number"
                        value={inputs.camion_in_attesa}
                        onChange={e => handleInputChange(13, 'camion_in_attesa', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Saturazione Buffer (0 - 1.0)</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={inputs.codice_saturazione_buffer}
                        onChange={e => handleInputChange(13, 'codice_saturazione_buffer', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 14 */}
                {calc.id === 14 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Giri al minuto braccio (RPM)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={inputs.giri_minuto}
                        onChange={e => handleInputChange(14, 'giri_minuto', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Vettore Accelerometro</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.vettore_accelerometro)}
                        onChange={e => {
                          try {
                            handleInputChange(14, 'vettore_accelerometro', JSON.parse(e.target.value));
                          } catch {}
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 15 */}
                {calc.id === 15 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Tensione Film (N)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={inputs.tensione_newton}
                        onChange={e => handleInputChange(15, 'tensione_newton', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Velocità Svolg. (m/s)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.velocita_svolgimento}
                        onChange={e => handleInputChange(15, 'velocita_svolgimento', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Spessore (micron)</label>
                      <input
                        type="number"
                        value={inputs.spessore_film_micron}
                        onChange={e => handleInputChange(15, 'spessore_film_micron', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 16 */}
                {calc.id === 16 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-slate-400 block">Nodi Ingorgo e Ostacoli</label>
                    <input
                      type="text"
                      value={JSON.stringify(inputs.mappa_ingorghi_nodi)}
                      onChange={e => {
                        try {
                          handleInputChange(16, 'mappa_ingorghi_nodi', JSON.parse(e.target.value));
                        } catch {}
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                )}

                {/* Calcolo 17 */}
                {calc.id === 17 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono text-slate-400 block">Missioni Urgenti</label>
                    <input
                      type="text"
                      value={JSON.stringify(inputs.elenco_missioni_urgenti)}
                      onChange={e => {
                        try {
                          handleInputChange(17, 'elenco_missioni_urgenti', JSON.parse(e.target.value));
                        } catch {}
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                )}

                {/* Calcolo 18: Robot Pallettizzatore */}
                {calc.id === 18 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Vuoto Ventose (bar)</label>
                      <input
                        type="number"
                        step="0.01"
                        max="0"
                        value={inputs.pressione_vuoto_bar}
                        onChange={e => handleInputChange(18, 'pressione_vuoto_bar', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Coppia Motori Joint (Nm)</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.coppia_motori_nm)}
                        onChange={e => {
                          try {
                            handleInputChange(18, 'coppia_motori_nm', JSON.parse(e.target.value));
                          } catch {}
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Forza Pinze (N)</label>
                      <input
                        type="number"
                        value={inputs.forza_pinze_n}
                        onChange={e => handleInputChange(18, 'forza_pinze_n', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 19: Microgrid & Fast-Charge */}
                {calc.id === 19 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Potenza Totale (kW)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={inputs.potenza_erogata_totale_kw}
                        onChange={e => handleInputChange(19, 'potenza_erogata_totale_kw', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Temp Piastra Terra (°C)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={inputs.temp_piastre_c}
                        onChange={e => handleInputChange(19, 'temp_piastre_c', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Supercap (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inputs.livello_supercondensatori_pct}
                        onChange={e => handleInputChange(19, 'livello_supercondensatori_pct', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 20: Woodpecker Integrità Pallet */}
                {calc.id === 20 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Forza Pattini (N)</label>
                      <input
                        type="number"
                        step="50"
                        value={inputs.forza_deformazione_pattini_n}
                        onChange={e => handleInputChange(20, 'forza_deformazione_pattini_n', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Umidità Legno (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.umidita_legno_pct}
                        onChange={e => handleInputChange(20, 'umidita_legno_pct', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Throughput (pallet/h)</label>
                      <input
                        type="number"
                        value={inputs.throughput_pallet_ora}
                        onChange={e => handleInputChange(20, 'throughput_pallet_ora', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Calcolo 21: Raptor Tracciabilità GS1 SSCC */}
                {calc.id === 21 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Codice SSCC (18 cifre)</label>
                      <input
                        type="text"
                        value={inputs.sscc_code}
                        onChange={e => handleInputChange(21, 'sscc_code', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Qualità Stampa ISO</label>
                      <select
                        value={inputs.grado_qualita_stampa_iso}
                        onChange={e => handleInputChange(21, 'grado_qualita_stampa_iso', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      >
                        <option value="CLASSE_A">CLASSE_A (Ottimale)</option>
                        <option value="CLASSE_B">CLASSE_B (Accettabile)</option>
                        <option value="CLASSE_C">CLASSE_C (Degradato)</option>
                        <option value="CLASSE_F">CLASSE_F (Scarto)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons & Busy Banner */}
              <div className="space-y-3 pt-2">
                {isBusy && (
                  <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-mono text-xs flex items-center gap-2.5 shadow-lg animate-pulse">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                    <span>Elaborazione quantistica in corso sul circuito CUDA-Q con i parametri correnti...</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => executeCalculation(calc)}
                    disabled={isBusy}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isBusy
                        ? 'bg-slate-800 text-slate-500 cursor-wait'
                        : isLocked
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                    }`}
                  >
                    {isBusy ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        <span>Campionamento...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Esegui Calcolo ({calc.entanglementSymbol})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Result Container */}
              {result && (
                <div id={`result-card-${calc.id}`} className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 animate-in fade-in duration-150 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="text-emerald-300 font-bold">
                          Calcolo [{calc.id}] Eseguito con Successo
                        </span>
                        {result.timestamp_esecuzione && (
                          <span className="text-slate-400 text-[10px] ml-2">
                            alle {result.timestamp_esecuzione}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {result.tempo_simulazione_qpu_ms && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          QPU: {result.tempo_simulazione_qpu_ms}ms
                        </span>
                      )}
                      <button
                        onClick={() => copyResult(calc.id, result)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedId === calc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span className="text-[10px]">{copiedId === calc.id ? 'Copiato' : 'Copia JSON'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Metric Banner */}
                  {result.metrica_principale_valore && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/50 shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold block">
                          {result.metrica_principale_etichetta || 'Risultato Calcolo Quantistico'}
                        </span>
                        <span className="text-2xl font-black text-white tracking-tight font-mono">
                          {result.metrica_principale_valore}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                          CALCOLO REALE
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Detailed Recalculated KPIs Grid */}
                  {result.metriche_dettagliate && Object.keys(result.metriche_dettagliate).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(result.metriche_dettagliate).map(([key, val]) => (
                        <div key={key} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                          <span className="text-slate-400 text-[10px] block truncate">{key}:</span>
                          <span className="font-bold text-cyan-300 text-sm block mt-0.5 truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Human-readable diagnostic summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {(result.indice_rischio_blocco || result.livello_rischio || result.rischio_stocastico || result.validazione_qualita || result.diagnosi || result.diagnostica_pallettizzatore || result.stato_ricarica) && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Diagnosi / Rischio:</span>
                        <span className="font-bold text-amber-300">
                          {result.indice_rischio_blocco || result.livello_rischio || result.rischio_stocastico || result.validazione_qualita || result.diagnosi || result.diagnostica_pallettizzatore || result.stato_ricarica}
                        </span>
                      </div>
                    )}

                    {(result.azione_correttiva_suggerita || result.piano_azione || result.azione_immediata || result.azione_logistica_immediata || result.azione_misure_sicurezza || result.azione_suggerita) && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Azione Suggerita:</span>
                        <span className="font-bold text-cyan-300">
                          {result.azione_correttiva_suggerita || result.piano_azione || result.azione_immediata || result.azione_logistica_immediata || result.azione_misure_sicurezza || result.azione_suggerita}
                        </span>
                      </div>
                    )}

                    {(result.stato_qubit_dominante || result.stato_qubit_rilevato || result.stato_qubit_ottimale || result.stato_qubit_cluster || result.cluster_qubit_estratto || result.stato_qubit_robot || result.stato_qubit_ricarica || result.stato_qubit_zkp) && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 sm:col-span-2 flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Stato Qubit Collassato:</span>
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 font-bold border border-purple-800/80">
                          |{result.stato_qubit_dominante || result.stato_qubit_rilevato || result.stato_qubit_ottimale || result.stato_qubit_cluster || result.cluster_qubit_estratto || result.stato_qubit_robot || result.stato_qubit_ricarica || result.stato_qubit_zkp}⟩
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Parameters Echo */}
                  {(() => {
                    const paramsObj = result.parametri_elaborati || result.dati_elaborati;
                    if (!paramsObj || Object.keys(paramsObj).length === 0) return null;
                    return (
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                        <span className="text-slate-400 text-[10px] block font-mono mb-1">
                          Parametri di Fabbrica Elaborati (Input Utente Ricalcolati):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(paramsObj).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-500/30 text-[10px] font-mono text-slate-200">
                              <strong className="text-cyan-400">{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })
      )}
      </div>

      {/* Modal Popup Punto di Domanda: Riga Esatta Telemetria CPU */}
      {selectedCpuCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Telemetria CPU: Calcolo [{selectedCpuCalc.id}]
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedCpuCalc.technicalModule}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{selectedCpuCalc.subFunction}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCpuCalc(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Table / Specs */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Algorithm Name & Category */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-slate-400">Nome Algoritmo Quantistico:</span>
                  <span className="text-white font-bold">{selectedCpuCalc.name}</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-slate-400">Categoria di Origine:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
                    {selectedCpuCalc.category}
                  </span>
                </div>
              </div>

              {/* Incrocio / Entanglement */}
              <div className={`p-4 rounded-xl border ${
                selectedCpuCalc.isCrossCategory
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs uppercase mb-2">
                  <span>{selectedCpuCalc.entanglementSymbol}</span>
                  <span>{selectedCpuCalc.isCrossCategory ? '[+] INCROCIO / ENTANGLEMENT OBBLIGATORIO' : '[-] ELABORAZIONE LOCALE AUTONOMA'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedCpuCalc.isCrossCategory
                    ? 'Questo calcolo intreccia i qubit e le variabili con altri moduli della fabbrica tramite Gate CNOT quantistici.'
                    : 'Questo calcolo elabora parametri interni alla propria macchina o isola senza dipendenze inter-categoria.'}
                </p>
              </div>

              {/* Dati e Parametri Incrociati o Usati */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Dati e Parametri Incrociati o Usati</span>
                </div>

                {selectedCpuCalc.crossCategoryDetails ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Incrociato con:</span>
                      <span className="text-amber-300 font-bold">{selectedCpuCalc.crossCategoryDetails.crossedWith}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Flusso Dati & Specifiche CPU:</span>
                      <span className="text-slate-200 leading-relaxed block bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        {selectedCpuCalc.crossCategoryDetails.parametersOrData}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {selectedCpuCalc.description}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 text-[11px] block">Parametri Input:</span>
                  <code className="text-cyan-300 text-[11px]">{selectedCpuCalc.inputDescription}</code>
                </div>
              </div>

              {/* Hardware Target */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Target Hardware di Esecuzione:</span>
                <span className="text-slate-200 font-bold">{selectedCpuCalc.hardwareTarget}</span>
              </div>
            </div>

            {/* Footer with Circuit Action */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedCpuCalc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer"
              >
                Chiudi
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedCpuCalc;
                  setSelectedCpuCalc(null);
                  onOpenCircuit(target);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Visualizza Circuito CUDA-Q</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Casella di Testo per Tutta la Logica Quantistica & Classica (Copia & Scarica) */}
      {isLogicDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Logica Quantistica & Classica dei 21 Calcoli
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      SM.I.LE80 / CUDA-Q
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Trattazione matematica, circuitale e industriale completa per tutte le 4 categorie e scenari.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogicDocModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Chiudi casella di testo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">
                Seleziona, copia il testo o scarica il file completo in formato Markdown (.md):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION);
                    setToastMessage('Tutta la logica dei 21 calcoli copiata negli appunti!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copia Tutto il Testo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'LOGICA_21_CALCOLI_QUANTISTICI_SM_I_LE80.md';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setToastMessage('Download del file documentazione avviato!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica File (.md)</span>
                </button>
              </div>
            </div>

            {/* Textarea Content */}
            <div className="p-4 flex-1 min-h-0 flex flex-col">
              <textarea
                readOnly
                value={ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full h-[55vh] p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-200 text-xs font-mono leading-relaxed resize-none focus:outline-none focus:border-cyan-500/60 selection:bg-cyan-500/30 selection:text-white"
                placeholder="Caricamento logica dei 21 calcoli..."
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
              <span>{ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION.length} caratteri • 21 algoritmi documentati</span>
              <button
                type="button"
                onClick={() => setIsLogicDocModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
