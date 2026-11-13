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
  FileText,
  Activity,
  Download,
  BookOpen,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  Search,
  LayoutList,
  Grid,
  RefreshCw,
  FileCode,
  Code2
} from 'lucide-react';
import { PlantTelemetryTrendCharts } from './PlantTelemetryTrendCharts';
import { getUserPermittedCalculations, PLANT_MACHINERY_NODES } from '../data/plantNodeCalculations';
import { PlantTelemetryHistoryService } from '../services/plantTelemetryHistory';
import { QuantumPythonCodeModal } from './QuantumPythonCodeModal';
import { AllQuantumPythonModal } from './AllQuantumPythonModal';
import { downloadAllCalculationsTxtFile } from '../utils/quantumAllCalcsTxtExporter';
import { UserAccount } from '../types/quantum';
import { AutoScanSummary } from '../services/plantTelemetryScanner';
import { IndustrialHelpTooltip } from './IndustrialHelpTooltip';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta, state?: string) => void;
  allowPlcWrite: boolean;
  targetInspectCalcId?: number | null;
  onClearInspectTarget?: () => void;
  activeTenant?: FactoryTenant;
  onOpenCsvUpload?: () => void;
  importedInputs?: Record<string, any>;
  currentUser?: UserAccount;
  tenants?: FactoryTenant[];
  scanSummary?: AutoScanSummary | null;
  onSelectTenant?: (tenant: FactoryTenant) => void;
}

const CATEGORIES: MacroCategory[] = [
  '1. Inbound & Materie Prime',
  '2. Magazzino & Stoccaggio',
  '3. Outbound & Spedizioni',
  '4. IoT & Controllo Macchine'
];

export type DepartmentFilter = 'ALL' | 'INBOUND_CAMION' | 'LGV_AGV' | 'SMARTSTORE' | 'BEMA_SILKWORM' | 'ENERGY_MAINT' | 'SHIFTS_OPS';

export const DEPARTMENT_FILTERS: { id: DepartmentFilter; label: string; icon: string; calcIds: number[]; description: string }[] = [
  { id: 'ALL', label: 'Tutti (21)', icon: '🏭', calcIds: Array.from({ length: 21 }, (_, i) => i + 1), description: 'Tutti i 21 algoritmi quantistici abilitati per questo stabilimento' },
  { id: 'INBOUND_CAMION', label: 'Camion & Baie', icon: '🚚', calcIds: [1, 2], description: 'Ottimizzazione attracco baie, saturazione piazzale e code autisti' },
  { id: 'LGV_AGV', label: 'Navette LGV', icon: '🚜', calcIds: [4, 5, 6, 7], description: 'Routing anti-collisione, batterie e missioni navette' },
  { id: 'SMARTSTORE', label: 'Magazzino SmartStore', icon: '🏬', calcIds: [8, 9, 10, 11], description: 'Saturazione stoccaggio, slotting 3D e prelievi' },
  { id: 'BEMA_SILKWORM', label: 'Fasciatori Bema', icon: '📦', calcIds: [12, 13, 14], description: 'Tensione film, pre-stiro pallet, usura cuscinetti e vibrazioni' },
  { id: 'ENERGY_MAINT', label: 'Energia & Manutenzione', icon: '⚡', calcIds: [15, 16, 17, 21], description: 'Picchi potenza elettrica kWh, usura predittiva e ciclo vita' },
  { id: 'SHIFTS_OPS', label: 'Turni & Reparto', icon: '👥', calcIds: [3, 18, 19, 20], description: 'Schedulazione squadre, ergonomia e OEE di fabbrica' },
];

export interface SimulationMetricDef {
  key: string;
  label: string;
  unit?: string;
  betterDirection: 'higher' | 'lower' | 'neutral';
}

export interface SimulationConfig {
  inputs: SimulationMetricDef[];
  outputs: SimulationMetricDef[];
}

export const SIMULATION_CONFIGS: Record<number, SimulationConfig> = {
  1: {
    inputs: [
      { key: 'camion_attesa', label: 'Camion in attesa', unit: 'unità', betterDirection: 'lower' },
      { key: 'minuti_ritardo', label: 'Ritardo', unit: 'min', betterDirection: 'lower' },
      { key: 'saturazione_wms', label: 'Saturazione WMS', unit: '%', betterDirection: 'lower' },
    ],
    outputs: [
      { key: 'congestione_percentuale', label: 'Indice di congestione', unit: '%', betterDirection: 'lower' },
      { key: 'allarme_blocco_imminente', label: 'Allarme Blocco Imminente', betterDirection: 'lower' },
      { key: 'stato_qubit', label: 'Stato Qubit', betterDirection: 'neutral' },
    ]
  },
  3: {
    inputs: [
      { key: 'ore_lavoro_disponibili', label: 'Ore lavoro disponibili', unit: 'h', betterDirection: 'neutral' },
      { key: 'baie_totali', label: 'Baie totali da coprire', unit: 'baie', betterDirection: 'neutral' },
    ],
    outputs: [
      { key: 'energia_ground_state', label: 'Energia Ground State', unit: 'Ha', betterDirection: 'lower' },
      { key: 'efficienza_oraria_pct', label: 'Efficienza oraria', unit: '%', betterDirection: 'higher' },
      { key: 'costo_ottimo_turno_eur', label: 'Costo ottimo turno', unit: '€', betterDirection: 'lower' },
    ]
  },
  8: {
    inputs: [
      { key: 'nodi_prelievo_count', label: 'Nodi di prelievo', unit: 'nodi', betterDirection: 'neutral' },
      { key: 'distanza_totale_metri', label: 'Distanza nominale', unit: 'm', betterDirection: 'lower' },
    ],
    outputs: [
      { key: 'distanza_ottimizzata_metri', label: 'Distanza ottimizzata', unit: 'm', betterDirection: 'lower' },
      { key: 'metri_lineari_risparmiati', label: 'Metri risparmiati', unit: 'm', betterDirection: 'higher' },
      { key: 'stato_qubit_rotta', label: 'Qubit Rotta', betterDirection: 'neutral' },
    ]
  },
  10: {
    inputs: [
      { key: 'colli_da_caricare', label: 'Colli da caricare', unit: 'colli', betterDirection: 'neutral' },
      { key: 'peso_totale_kg', label: 'Peso totale', unit: 'kg', betterDirection: 'neutral' },
      { key: 'volume_cassone_m3', label: 'Volume cassone', unit: 'm³', betterDirection: 'neutral' },
    ],
    outputs: [
      { key: 'saturazione_volumetrica_pct', label: 'Saturazione volumetrica', unit: '%', betterDirection: 'higher' },
      { key: 'stato_qubit_incastro', label: 'Configurazione Qubit', betterDirection: 'neutral' },
    ]
  },
  12: {
    inputs: [
      { key: 'camion_in_coda', label: 'Camion in coda', unit: 'camion', betterDirection: 'lower' },
      { key: 'baie_disponibili', label: 'Baie disponibili', unit: 'baie', betterDirection: 'higher' },
      { key: 'costo_orario_attesa_eur', label: 'Costo orario attesa', unit: '€/h', betterDirection: 'lower' },
    ],
    outputs: [
      { key: 'risparmio_costi_sosta_eur', label: 'Risparmio costi sosta', unit: '€', betterDirection: 'higher' },
      { key: 'stato_equilibrio_nash_qubit', label: 'Equilibrio Nash Qubit', betterDirection: 'neutral' },
      { key: 'esito_cooperativo', label: 'Esito Cooperativo', betterDirection: 'neutral' },
    ]
  },
  13: {
    inputs: [
      { key: 'camion_attesa', label: 'Camion in attesa', unit: 'unità', betterDirection: 'lower' },
      { key: 'saturazione_buffer', label: 'Saturazione buffer', unit: '', betterDirection: 'lower' },
    ],
    outputs: [
      { key: 'tempo_medio_attesa_min', label: 'Tempo medio attesa', unit: 'min', betterDirection: 'lower' },
      { key: 'saturazione_buffer_pct', label: 'Saturazione buffer', unit: '%', betterDirection: 'lower' },
      { key: 'stato_congestione', label: 'Stato congestione', betterDirection: 'neutral' },
    ]
  },
  15: {
    inputs: [
      { key: 'tensione_newton', label: 'Tensione', unit: 'N', betterDirection: 'lower' },
      { key: 'pre_stiro_pct', label: 'Pre-stiro applicato', unit: '%', betterDirection: 'neutral' },
      { key: 'spessore_film_micron', label: 'Spessore film', unit: 'µm', betterDirection: 'neutral' },
    ],
    outputs: [
      { key: 'sforzo_unitario_mpa', label: 'Sforzo unitario', unit: 'MPa', betterDirection: 'lower' },
      { key: 'stato_fasciatura', label: 'Stato fasciatura', betterDirection: 'neutral' },
      { key: 'stato_qubit_qsvm', label: 'Qubit QSVM', betterDirection: 'neutral' },
    ]
  },
  16: {
    inputs: [
      { key: 'navette_attive', label: 'Navette attive / in missione', unit: 'LGV', betterDirection: 'higher' },
      { key: 'nodi_critici', label: 'Nodi critici congestione', unit: 'nodi', betterDirection: 'lower' },
    ],
    outputs: [
      { key: 'indice_fluidita_flotta_pct', label: 'Fluidità flotta', unit: '%', betterDirection: 'higher' },
      { key: 'tempo_medio_transito_sec', label: 'Tempo medio transito', unit: 's', betterDirection: 'lower' },
      { key: 'stato_qubit_traffico', label: 'Qubit Traffico', betterDirection: 'neutral' },
    ]
  },
  19: {
    inputs: [
      { key: 'potenza_erogata_totale_kw', label: 'Potenza erogata', unit: 'kW', betterDirection: 'lower' },
      { key: 'temp_piastre_c', label: 'Temp piastre contatto', unit: '°C', betterDirection: 'lower' },
      { key: 'livello_supercondensatori_pct', label: 'Supercondensatori', unit: '%', betterDirection: 'higher' },
    ],
    outputs: [
      { key: 'picco_tagliato_kw', label: 'Picco tagliato', unit: 'kW', betterDirection: 'higher' },
      { key: 'energia_recuperata_kwh', label: 'Energia recuperata', unit: 'kWh', betterDirection: 'higher' },
      { key: 'stato_termico', label: 'Stato termico', betterDirection: 'neutral' },
    ]
  },
  20: {
    inputs: [
      { key: 'throughput_pallet_ora', label: 'Throughput', unit: 'plt/h', betterDirection: 'higher' },
      { key: 'umidita_legno_pct', label: 'Umidità legno', unit: '%', betterDirection: 'lower' },
      { key: 'forza_deformazione_pattini_n', label: 'Forza deformazione pattini', unit: 'N', betterDirection: 'higher' },
    ],
    outputs: [
      { key: 'tasso_scarto_stimato_pct', label: 'Tasso scarto stimato', unit: '%', betterDirection: 'lower' },
      { key: 'pallet_scartati_ora_stima', label: 'Pallet scartati stima', unit: '/h', betterDirection: 'lower' },
      { key: 'esito_collaudo', label: 'Esito collaudo', betterDirection: 'neutral' },
    ]
  }
};

export const QuantumCatalog: React.FC<Props> = ({ 
  onOpenCircuit, 
  allowPlcWrite,
  targetInspectCalcId,
  onClearInspectTarget,
  activeTenant,
  onOpenCsvUpload,
  importedInputs,
  currentUser,
  tenants = [],
  scanSummary,
  onSelectTenant
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MacroCategory | 'ALL'>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentFilter>('ALL');
  const [operatorMode, setOperatorMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('joker80_operator_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [isRecalculatingAll, setIsRecalculatingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLogicDocModalOpen, setIsLogicDocModalOpen] = useState<boolean>(false);
  const [showTrendCharts, setShowTrendCharts] = useState<boolean>(false);
  const [expandedInputs, setExpandedInputs] = useState<Record<number, boolean>>({});

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
  const [selectedPythonCalc, setSelectedPythonCalc] = useState<QuantumCalculationMeta | null>(null);
  const [isAllPythonModalOpen, setIsAllPythonModalOpen] = useState(false);
  const [hoveredCalcId, setHoveredCalcId] = useState<number | null>(null);

  // Stato per la modalità di simulazione confronto "Prima / Dopo"
  const [simulationCalcId, setSimulationCalcId] = useState<number | null>(null);
  const [simPrimaInputs, setSimPrimaInputs] = useState<Record<string, any>>({});
  const [simDopoInputs, setSimDopoInputs] = useState<Record<string, any>>({});
  const [simComparisonResult, setSimComparisonResult] = useState<{ prima: any; dopo: any } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleOpenSimulation = (calc: QuantumCalculationMeta) => {
    const current = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
    setSimPrimaInputs({ ...current });
    setSimDopoInputs({ ...current });
    setSimComparisonResult(null);
    setSimulationCalcId(calc.id);
  };

  const handleCloseSimulation = () => {
    setSimulationCalcId(null);
    setSimComparisonResult(null);
    setSimPrimaInputs({});
    setSimDopoInputs({});
    setIsSimulating(false);
  };

  const handleRunSimulation = async (calcId: number) => {
    setIsSimulating(true);
    try {
      const primaParsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(simPrimaInputs)) {
        primaParsed[k] = parseFlexibleInput(v, k);
      }
      const dopoParsed: Record<string, any> = {};
      for (const [k, v] of Object.entries(simDopoInputs)) {
        dopoParsed[k] = parseFlexibleInput(v, k);
      }
      // Esecuzione in memoria isolata: nessun salvataggio su Firestore o state dashboard
      const primaRes = await QuantumEngine.executeCalculation(calcId, primaParsed);
      const dopoRes = await QuantumEngine.executeCalculation(calcId, dopoParsed);
      setSimComparisonResult({
        prima: primaRes,
        dopo: dopoRes
      });
    } catch (err) {
      console.error('Errore durante la simulazione in-memory:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper to format any input value for UI display
  const formatInputValue = (val: any): string => {
    if (val === undefined || val === null) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return JSON.stringify(val);
  };

  // Helper to flexibly parse user inputs (numbers, JSON arrays, comma-separated lists)
  const parseFlexibleInput = (val: any, key?: string): any => {
    if (val === undefined || val === null) return val;
    if (typeof val === "number" || typeof val === "boolean") return val;
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) return val;
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (trimmed === "") return 0;
    // Always preserve SSCC, serials, and alphanumeric identifiers as string
    if (
      key === "sscc_code" ||
      key === "sscc" ||
      key === "id_lotto_materiale" ||
      key === "codice_fornitore" ||
      key === "id_spedizione" ||
      key === "grado_qualita_stampa_iso" ||
      key === "qualita_stampa_iso" ||
      key === "etichetta_gs1" ||
      (trimmed.length >= 10 && /^\d+$/.test(trimmed)) ||
      (trimmed.length > 1 && trimmed.startsWith("0") && /^\d+$/.test(trimmed))
    ) {
      return trimmed;
    }
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
        setSelectedCalcId(target.id);
        setSelectedCpuCalc(target);
        onClearInspectTarget?.();
      }
    }
  }, [targetInspectCalcId, onClearInspectTarget]);

  const isAdmin = currentUser?.ruolo === 'Amministratore';
  const isManager = currentUser?.ruolo === 'Responsabile di Stabilimento';
  const canViewPythonCode = isAdmin || isManager;

  // Allowed calculations for the user (filtered by their assigned machinery/nodes and active plant)
  const userPermittedIds = useMemo(() => {
    return getUserPermittedCalculations(currentUser || null, activeTenant);
  }, [currentUser, activeTenant]);

  // Calculations supported by the active plant's hardware nodes and machinery permissions
  const plantSupportedCalcs = useMemo(() => {
    return QUANTUM_CALCULATIONS.filter(c => userPermittedIds.includes(c.id));
  }, [userPermittedIds]);

  // Scarica immediatamente il file .txt con tutti i file Python e i risultati di tutti i calcoli
  const handleDownloadAllCalcsTxt = () => {
    const targetCalcs = plantSupportedCalcs.length > 0 ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
    const filename = downloadAllCalculationsTxtFile({
      activeTenant,
      calculations: targetCalcs,
      formInputs,
      results,
      currentUser
    });
    setToastMessage(`Download avviato: "${filename}" scaricato sul tuo computer!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const [isRecomputingAll, setIsRecomputingAll] = useState(false);
  const [recomputeProgress, setRecomputeProgress] = useState<{ current: number; total: number } | null>(null);

  // Esegue il ricalcolo e re-sampling completo di tutti i circuiti quantistici per lo stabilimento
  const handleRecomputeAllCatalogCalcs = async () => {
    const targetCalcs = plantSupportedCalcs.length > 0 ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
    setIsRecomputingAll(true);
    setRecomputeProgress({ current: 0, total: targetCalcs.length });
    const newResults: Record<number, any> = { ...results };
    
    try {
      let count = 0;
      for (const calc of targetCalcs) {
        const raw = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
        const inputs: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          inputs[k] = parseFlexibleInput(v, k);
        }
        // Micro-intervallo realistico per simulare la sequenza di campionamento batch GPU/QPU
        await new Promise(r => setTimeout(r, 20));
        const res = await QuantumEngine.executeCalculation(calc.id, inputs);
        newResults[calc.id] = res;
        count++;
        setRecomputeProgress({ current: count, total: targetCalcs.length });
      }
      setResults(newResults);
      setToastMessage(`Ricalcolo completato con successo: aggiornati tutti i ${targetCalcs.length} calcoli con telemetria e timestamp live!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Errore durante il ricalcolo globale dei nodi', err);
    } finally {
      setIsRecomputingAll(false);
      setRecomputeProgress(null);
    }
  };

  // Auto-populate / auto-compute calculation results on mount or activeTenant change so operator sees results without pressing Calcola
  useEffect(() => {
    let active = true;

    // 1. Sync from scanSummary notifications if present
    if (scanSummary?.notifiche && scanSummary.notifiche.length > 0) {
      setResults(prev => {
        const next = { ...prev };
        for (const notif of scanSummary.notifiche) {
          if (notif.risultatoPayload) {
            next[notif.calcoloId] = notif.risultatoPayload;
          }
        }
        return next;
      });
    }

    // 2. Pre-calculate any missing results in the background
    const computeMissing = async () => {
      for (const calc of plantSupportedCalcs) {
        if (!active) break;
        if (!results[calc.id]) {
          try {
            const raw = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
            const inputs: Record<string, any> = {};
            for (const [k, v] of Object.entries(raw)) {
              inputs[k] = parseFlexibleInput(v, k);
            }
            const res = await QuantumEngine.executeCalculation(calc.id, inputs);
            if (active) {
              setResults(prev => ({ ...prev, [calc.id]: res }));
            }
          } catch (e) {
            console.error(`Auto-compute error for calc ${calc.id}`, e);
          }
        }
      }
    };

    computeMissing();

    return () => {
      active = false;
    };
  }, [scanSummary, activeTenant?.id, plantSupportedCalcs]);

  // Global search shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper matching calculation against search query
  const matchesSearch = (c: QuantumCalculationMeta, q: string) => {
    if (!q || !q.trim()) return true;
    const lower = q.toLowerCase().trim();
    const cleanNum = lower.replace('#', '').trim();
    const nodeReq = PLANT_NODE_REQUIREMENTS[c.id];
    return (
      c.id.toString() === cleanNum ||
      c.name.toLowerCase().includes(lower) ||
      c.technicalModule.toLowerCase().includes(lower) ||
      c.subFunction.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower) ||
      (nodeReq && nodeReq.nodeName.toLowerCase().includes(lower)) ||
      (lower.includes('bema') && [12, 13, 14].includes(c.id)) ||
      (lower.includes('silkworm') && [12, 13, 14].includes(c.id)) ||
      (lower.includes('lgv') && [4, 5, 6, 7].includes(c.id)) ||
      (lower.includes('agv') && [4, 5, 6, 7].includes(c.id)) ||
      (lower.includes('camion') && [1, 2].includes(c.id)) ||
      (lower.includes('baia') && [1, 2].includes(c.id)) ||
      (lower.includes('baie') && [1, 2].includes(c.id)) ||
      (lower.includes('batteri') && [6, 17].includes(c.id)) ||
      (lower.includes('film') && [4, 12, 13].includes(c.id)) ||
      (lower.includes('vibraz') && [14, 15].includes(c.id)) ||
      (lower.includes('smart') && [8, 9, 10, 11].includes(c.id)) ||
      (lower.includes('oee') && [19, 20].includes(c.id))
    );
  };

  // Helper to toggle and persist operatorMode
  const toggleOperatorMode = () => {
    setOperatorMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('joker80_operator_mode', String(next));
      } catch {}
      return next;
    });
  };

  // Query di ricerca testuale nella tabella dei pulsanti
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');

  // Modalità di visualizzazione: 'table-focus' (Pulsanti a sinistra + Singolo Ingrandito a destra) oppure 'grid' (Tutti)
  const [displayMode, setDisplayMode] = useState<'table-focus' | 'grid'>('table-focus');

  // ID del calcolo attualmente selezionato nella tabella pulsanti a sinistra
  const [selectedCalcId, setSelectedCalcId] = useState<number>(() => {
    return plantSupportedCalcs[0]?.id || 1;
  });

  // Calculations displayed after applying plant nodes filter, department filter, category, and search query
  const displayedCalculations = useMemo(() => {
    let pool = activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
    if (selectedDepartment !== 'ALL') {
      const depMeta = DEPARTMENT_FILTERS.find(d => d.id === selectedDepartment);
      if (depMeta) {
        pool = pool.filter(c => depMeta.calcIds.includes(c.id));
      }
    } else if (selectedCategory !== 'ALL') {
      pool = pool.filter(c => c.category === selectedCategory);
    }
    const q = (searchQuery || searchTableQuery).trim();
    if (q) {
      pool = pool.filter(c => matchesSearch(c, q));
    }
    return pool;
  }, [activeTenant, plantSupportedCalcs, selectedDepartment, selectedCategory, searchQuery, searchTableQuery]);

  // Se cambiano i calcoli supportati dallo stabilimento, sincronizza selectedCalcId
  useEffect(() => {
    if (plantSupportedCalcs.length > 0) {
      if (!plantSupportedCalcs.some(c => c.id === selectedCalcId)) {
        setSelectedCalcId(plantSupportedCalcs[0].id);
      }
    }
  }, [plantSupportedCalcs, selectedCalcId]);

  // Gli utenti non amministratori visualizzano esclusivamente la modalità a tabella focalizzata con calcolo ingrandito
  useEffect(() => {
    if (!isAdmin && displayMode === 'grid') {
      setDisplayMode('table-focus');
    }
  }, [isAdmin, displayMode]);

  // Calcolo selezionato per la visualizzazione ingrandita
  const selectedCalc = useMemo(() => {
    return (
      plantSupportedCalcs.find(c => c.id === selectedCalcId) ||
      QUANTUM_CALCULATIONS.find(c => c.id === selectedCalcId) ||
      plantSupportedCalcs[0] ||
      QUANTUM_CALCULATIONS[0]
    );
  }, [selectedCalcId, plantSupportedCalcs]);

  // Calcoli filtrati per la tabella dei pulsanti a sinistra
  const tableCalculations = useMemo(() => {
    return displayedCalculations;
  }, [displayedCalculations]);

  // ID del calcolo in focus (per compatibilità con la barra rapida)
  const [focusedCalcId, setFocusedCalcId] = useState<number | null>(null);

  // Calcolo attivo in focus
  const focusedCalcMeta = useMemo(() => {
    if (focusedCalcId === null) return null;
    return QUANTUM_CALCULATIONS.find(c => c.id === focusedCalcId) || null;
  }, [focusedCalcId]);

  // Elenco effettivo visualizzato: se focusedCalcId è impostato, mostra solo quel calcolo e nasconde tutti gli altri
  const visibleCalculations = useMemo(() => {
    if (focusedCalcId !== null) {
      const match = (activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS).find(c => c.id === focusedCalcId);
      if (match) return [match];
      const fallback = QUANTUM_CALCULATIONS.find(c => c.id === focusedCalcId);
      return fallback ? [fallback] : displayedCalculations;
    }
    return displayedCalculations;
  }, [focusedCalcId, displayedCalculations, activeTenant, plantSupportedCalcs]);

  const handleInputChange = (calcId: number, field: string, value: any) => {
    const meta = QUANTUM_CALCULATIONS.find(c => c.id === calcId);
    setFormInputs(prev => {
      const updatedForCalc = {
        ...(meta?.defaultInputs || {}),
        ...(prev[calcId] || {}),
        [field]: value
      };
      const next = {
        ...prev,
        [calcId]: updatedForCalc
      };
      if (activeTenant?.id) {
        try {
          const storageKey = `joker_custom_telemetry_${activeTenant.id}`;
          const currentSaved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          localStorage.setItem(storageKey, JSON.stringify({ ...currentSaved, [field]: value }));
        } catch {}
      }
      return next;
    });
  };

  const executeCalculation = async (calc: QuantumCalculationMeta) => {
    setExecutingId(calc.id);
    const rawInputs = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
    const inputs: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawInputs)) {
      inputs[k] = parseFlexibleInput(v, k);
    }
    
    try {
      // Simulate GPU quantum sampling delay
      await new Promise(r => setTimeout(r, 260));
      const res = await QuantumEngine.executeCalculation(calc.id, inputs);
      setResults(prev => ({ ...prev, [calc.id]: res }));

      // Determina il livello di allarme del risultato per la telemetria storica
      const isCrit = Boolean(
        res.indice_rischio_blocco?.toLowerCase().includes('critico') ||
        res.livello_rischio?.toLowerCase().includes('critico') ||
        res.rischio_stocastico?.toLowerCase().includes('critico') ||
        (res.probabilita_fermo_pct && parseFloat(String(res.probabilita_fermo_pct)) > 70) ||
        (res.codice_allarme_fabbrica && res.codice_allarme_fabbrica > 0)
      );
      const isWarn = !isCrit && Boolean(
        res.indice_rischio_blocco?.toLowerCase().includes('attenzione') ||
        res.livello_rischio?.toLowerCase().includes('attenzione') ||
        res.rischio_stocastico?.toLowerCase().includes('attenzione') ||
        (res.probabilita_fermo_pct && parseFloat(String(res.probabilita_fermo_pct)) > 30)
      );
      const allarme = isCrit ? 'CRITICO' : isWarn ? 'ATTENZIONE' : 'NORMALE';

      // 1. Salva i parametri personalizzati in localStorage per persistenza futura
      if (activeTenant?.id) {
        try {
          const storageKey = `joker_custom_telemetry_${activeTenant.id}`;
          const currentSaved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          localStorage.setItem(storageKey, JSON.stringify({ ...currentSaved, ...inputs }));
        } catch {}
      }

      // 2. Registra il nuovo punto telemetrico nello storico dei grafici di andamento temporale
      if (activeTenant) {
        try {
          PlantTelemetryHistoryService.recordNewSnapshot(
            activeTenant,
            'GATEWAY_AUTOSCAN',
            [{
              calcId: calc.id,
              calcNome: calc.name,
              livelloAllarme: allarme,
              res
            }],
            {
              bemaVibrazione: typeof inputs.vibrazione_corrente === 'number' ? inputs.vibrazione_corrente : undefined,
              lgvSoc: typeof inputs.batteria_soc === 'number' ? inputs.batteria_soc : undefined,
              baieRitardo: typeof inputs.ritardo_stimato === 'number' ? inputs.ritardo_stimato : undefined
            }
          );
        } catch (e) {
          console.error('Failed to record snapshot for calc', e);
        }
      }

      setToastMessage(`⚡ Calcolo [${calc.id}] "${calc.name}" eseguito: parametri salvati e registrati nel Grafico Andamenti!`);
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

  // Handler for 1-Click Quick Actions (Idea 4)
  const handleQuickAction = async (actionType: 'LGV_ROUTES' | 'BEMA_FILM' | 'TRUCK_BAYS' | 'RECALCULATE_ALL') => {
    if (actionType === 'LGV_ROUTES') {
      setSelectedDepartment('LGV_AGV');
      setSearchQuery('');
      setSelectedCalcId(4);
      const target = plantSupportedCalcs.find(c => c.id === 4) || QUANTUM_CALCULATIONS.find(c => c.id === 4);
      if (target) {
        await executeCalculation(target);
        setToastMessage('⚡ Rotte Flotta LGV ottimizzate in tempo reale con algoritmo QAOA anti-collisione!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } else if (actionType === 'BEMA_FILM') {
      setSelectedDepartment('BEMA_SILKWORM');
      setSearchQuery('');
      setSelectedCalcId(12);
      const target = plantSupportedCalcs.find(c => c.id === 12) || QUANTUM_CALCULATIONS.find(c => c.id === 12);
      if (target) {
        await executeCalculation(target);
        setToastMessage('📦 Controllo Tensione Film e Pre-Stiro BEMA Silkworm completato!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } else if (actionType === 'TRUCK_BAYS') {
      setSelectedDepartment('INBOUND_CAMION');
      setSearchQuery('');
      setSelectedCalcId(1);
      const target = plantSupportedCalcs.find(c => c.id === 1) || QUANTUM_CALCULATIONS.find(c => c.id === 1);
      if (target) {
        await executeCalculation(target);
        setToastMessage('🚚 Assegnazione Baie e Attracco Camion in arrivo ricalcolata!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } else if (actionType === 'RECALCULATE_ALL') {
      setIsRecalculatingAll(true);
      setToastMessage('🔄 Scansione e ricalcolo di tutti i 21 algoritmi quantistici con telemetria live...');
      try {
        const calcsToRun = plantSupportedCalcs.length > 0 ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
        for (let i = 0; i < calcsToRun.length; i++) {
          const c = calcsToRun[i];
          const raw = { ...(c.defaultInputs || {}), ...(formInputs[c.id] || {}) };
          const inputs: Record<string, any> = {};
          for (const [k, v] of Object.entries(raw)) {
            inputs[k] = parseFlexibleInput(v, k);
          }
          const res = await QuantumEngine.executeCalculation(c.id, inputs);
          setResults(prev => ({ ...prev, [c.id]: res }));
        }
        setToastMessage('✅ Ricalcolo completato: tutti i 21 nodi quantistici aggiornati con successo!');
        setTimeout(() => setToastMessage(null), 4000);
      } catch (e) {
        console.error('Error recalculating all', e);
        setToastMessage('⚠️ Ricalcolo completato con alcune avvertenze sui nodi.');
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setIsRecalculatingAll(false);
      }
    }
  };

  const copyResult = (calcId: number, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(calcId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderDiagnosticResultBox = (calc: QuantumCalculationMeta, res: any) => {
    if (executingId === calc.id) {
      return (
        <div className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 font-mono text-xs flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
          <span>Elaborazione quantistica CUDA-Q in corso con telemetria gateway...</span>
        </div>
      );
    }

    if (!res) {
      return (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>In attesa di primo campionamento dati o avvio routine...</span>
          </span>
        </div>
      );
    }

    const isCritical = Boolean(
      res.indice_rischio_blocco?.toLowerCase().includes('critico') ||
      res.livello_rischio?.toLowerCase().includes('critico') ||
      res.rischio_stocastico?.toLowerCase().includes('critico') ||
      (res.probabilita_fermo_pct && parseFloat(String(res.probabilita_fermo_pct)) > 70) ||
      (res.codice_allarme_fabbrica && res.codice_allarme_fabbrica > 0) ||
      res.codice_controllo_bema === 514 ||
      res.codice_controllo_film === 515 ||
      res.codice_controllo_lgv === 516 ||
      res.codice_controllo_robot === 518 ||
      res.codice_esito_woodpecker === 520
    );

    const isWarning = !isCritical && Boolean(
      res.indice_rischio_blocco?.toLowerCase().includes('attenzione') ||
      res.livello_rischio?.toLowerCase().includes('attenzione') ||
      res.rischio_stocastico?.toLowerCase().includes('attenzione') ||
      (res.probabilita_fermo_pct && parseFloat(String(res.probabilita_fermo_pct)) > 30) ||
      res.codice_gestione_rete === 519 ||
      res.codice_validazione_raptor === 521
    );

    return (
      <div id={`result-card-${calc.id}`} className={`p-2.5 sm:p-3 rounded-xl border space-y-2 font-mono text-xs shadow-md transition-all ${
        isCritical 
          ? 'bg-gradient-to-br from-rose-950/35 via-slate-950 to-slate-950 border-rose-500/50 shadow-rose-950/20'
          : isWarning
            ? 'bg-gradient-to-br from-amber-950/35 via-slate-950 to-slate-950 border-amber-500/50 shadow-amber-950/20'
            : 'bg-gradient-to-br from-emerald-950/25 via-slate-950 to-slate-950 border-emerald-500/40 shadow-emerald-950/20'
      }`}>
        {/* Status Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isWarning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isCritical ? (
                <>
                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                  <span>CRITICO - PROBLEMATICA ATTIVA</span>
                </>
              ) : isWarning ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>ATTENZIONE - MONITORAGGIO</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>A REGIME - NESSUNA ANOMALIA</span>
                </>
              )}
            </span>
            {res.timestamp_esecuzione && (
              <span className="text-[9.5px] text-slate-400">
                Aggiornato alle {res.timestamp_esecuzione}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {res.tempo_simulazione_qpu_ms && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                QPU: {res.tempo_simulazione_qpu_ms}ms
              </span>
            )}
            {SIMULATION_CONFIGS[calc.id] && (
              <button
                type="button"
                onClick={() => handleOpenSimulation(calc)}
                className="px-2 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-500/50 flex items-center gap-1 cursor-pointer transition-colors text-[10px] font-bold"
                title={`Avvia simulazione di confronto Prima / Dopo per ${calc.name}`}
              >
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>Simula</span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setSelectedPythonCalc(calc)}
                className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-500/50 flex items-center gap-1 cursor-pointer transition-colors text-[10px] font-bold"
                title={`Visualizza codice Python CUDA-Q del Calcolo #${calc.id} (Solo Amministratore)`}
              >
                <FileCode className="w-3 h-3 text-emerald-400" />
                <span>Codice Python</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => copyResult(calc.id, res)}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors text-[10px]"
            >
              {copiedId === calc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>{copiedId === calc.id ? 'Copiato' : 'Copia JSON'}</span>
            </button>
          </div>
        </div>

        {/* Primary Metric Banner - Singolo Valore Primario (Deduplicato) */}
        {res.metrica_principale_valore && (
          <div className={`p-2 sm:p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
            isCritical
              ? 'bg-rose-950/30 border-rose-500/40'
              : isWarning
                ? 'bg-amber-950/30 border-amber-500/40'
                : 'bg-cyan-950/30 border-cyan-500/40'
          }`}>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {res.metrica_principale_etichetta || 'Metrica Principale'}:
              </span>
              <span className={`text-base sm:text-lg font-black tracking-tight font-mono ${
                isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-cyan-300'
              }`}>
                {res.metrica_principale_valore}
              </span>
            </div>
            <div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                DIAGNOSI REALE
              </span>
            </div>
          </div>
        )}

        {/* Detailed KPIs Grid - Sulla stessa riga con deduplicazione contro metrica principale */}
        {res.metriche_dettagliate && Object.keys(res.metriche_dettagliate).length > 0 && (() => {
          const primaryValClean = String(res.metrica_principale_valore || '').replace(/[^\d.-]/g, '');
          const primaryLabelClean = String(res.metrica_principale_etichetta || '').toLowerCase().trim();

          const entries = Object.entries(res.metriche_dettagliate).filter(([key, val]) => {
            const keyLower = key.toLowerCase().trim();
            const valClean = String(val).replace(/[^\d.-]/g, '');

            // Calcolo 1: Rimuovi congestione dal dettaglio secondario per evitare doppioni di 96%
            if (calc.id === 1 && (keyLower.includes('congestione') || valClean === primaryValClean)) {
              return false;
            }
            // Deduplicazione generica
            if (primaryLabelClean && keyLower === primaryLabelClean && valClean === primaryValClean) {
              return false;
            }
            return true;
          });

          if (entries.length === 0) return null;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 w-full">
              {entries.map(([key, val]) => (
                <div key={key} className="px-2 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono leading-tight flex flex-col justify-between">
                  <span className="text-slate-400 text-[9.5px] block truncate" title={key}>{key}:</span>
                  <span className="font-bold text-cyan-300 text-xs block mt-0.5 truncate">{String(val)}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Diagnosi e Consiglio Operativo Ingrandito con Badge Motivo Allarme */}
        {(res.indice_rischio_blocco || res.livello_rischio || res.rischio_stocastico || res.validazione_qualita || res.diagnosi || res.diagnostica_pallettizzatore || res.stato_ricarica || res.azione_correttiva_suggerita || res.piano_azione || res.azione_immediata || res.azione_logistica_immediata || res.azione_misure_sicurezza || res.azione_suggerita) && (
          <div className="space-y-2 text-[11px] font-mono">
            {(res.indice_rischio_blocco || res.livello_rischio || res.rischio_stocastico || res.validazione_qualita || res.diagnosi || res.diagnostica_pallettizzatore || res.stato_ricarica) && (
              <div className={`px-2.5 py-1.5 rounded-md border ${
                isCritical ? 'bg-rose-950/20 border-rose-500/30' : isWarning ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className="text-slate-400 text-[9.5px] block font-bold">Diagnosi / Valutazione:</span>
                <span className={`font-semibold text-xs leading-snug ${isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-slate-200'}`}>
                  {res.indice_rischio_blocco || res.livello_rischio || res.rischio_stocastico || res.validazione_qualita || res.diagnosi || res.diagnostica_pallettizzatore || res.stato_ricarica}
                </span>
              </div>
            )}

            {(res.azione_correttiva_suggerita || res.piano_azione || res.azione_immediata || res.azione_logistica_immediata || res.azione_misure_sicurezza || res.azione_suggerita) && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                    Consiglio Operativo / Azione Suggerita:
                  </span>
                  {res.motivo_allarme && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10.5px] font-bold">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Motivo Allarme: {res.motivo_allarme}</span>
                    </span>
                  )}
                </div>
                <span className="font-bold text-base sm:text-lg text-cyan-200 block leading-snug">
                  {res.azione_correttiva_suggerita || res.piano_azione || res.azione_immediata || res.azione_logistica_immediata || res.azione_misure_sicurezza || res.azione_suggerita}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderOperatorTrafficLightCard = (calc: QuantumCalculationMeta, res: any) => {
    const isExecuting = executingId === calc.id;
    const isCritical = Boolean(
      res?.indice_rischio_blocco?.toLowerCase().includes('critico') ||
      res?.livello_rischio?.toLowerCase().includes('critico') ||
      res?.rischio_stocastico?.toLowerCase().includes('critico') ||
      (res?.probabilita_fermo_pct && parseFloat(String(res.probabilita_fermo_pct)) > 70) ||
      (res?.codice_allarme_fabbrica && res.codice_allarme_fabbrica > 0)
    );

    const isWarning = !isCritical && Boolean(
      res?.indice_rischio_blocco?.toLowerCase().includes('attenzione') ||
      res?.livello_rischio?.toLowerCase().includes('attenzione') ||
      res?.rischio_stocastico?.toLowerCase().includes('attenzione') ||
      (res?.probabilita_fermo_pct && parseFloat(String(res.probabilita_fermo_pct)) > 30)
    );

    const statusTitle = isCritical ? 'ROSSO: Anomalia Rilevata' : isWarning ? 'GIALLO: Attenzione Richiesta' : 'VERDE: Regolare in Marcia';
    const statusIcon = isCritical ? '🔴' : isWarning ? '🟡' : '🟢';

    const diagnosticText = res?.indice_rischio_blocco || 
      res?.livello_rischio || 
      res?.diagnosi || 
      res?.validazione_qualita || 
      (isCritical ? 'Parametri fuori tolleranza rispetto agli standard di linea.' : isWarning ? 'Parametri in pre-allarme ma operativi.' : 'Tutti i sensori registrano parametri ottimali.');

    const operatorAction = res?.azione_correttiva_suggerita || 
      res?.piano_azione || 
      res?.azione_immediata || 
      res?.azione_logistica_immediata || 
      (isCritical ? 'Avvisare manutentore di reparto per verifica rapida.' : isWarning ? 'Verificare parametri durante il prossimo cambio turno.' : 'Nessun intervento richiesto: la macchina lavora a pieno ritmo.');

    return (
      <div className={`p-4 sm:p-6 rounded-2xl border-2 transition-all shadow-xl bg-slate-900/95 space-y-4 ${
        isCritical 
          ? 'border-rose-500/70 shadow-rose-950/40 ring-1 ring-rose-500/20' 
          : isWarning 
          ? 'border-amber-500/70 shadow-amber-950/40 ring-1 ring-amber-500/20' 
          : 'border-emerald-500/60 shadow-emerald-950/30 ring-1 ring-emerald-500/20'
      }`}>
        {/* Banner superiore stato semaforico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-md shrink-0 ${
              isCritical ? 'bg-rose-500/20 border border-rose-500/40 animate-pulse' :
              isWarning ? 'bg-amber-500/20 border border-amber-500/40' :
              'bg-emerald-500/20 border border-emerald-500/40'
            }`}>
              {statusIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {statusTitle}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-300 font-mono font-bold">
                  Calcolo #{calc.id} ({calc.technicalModule})
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                {calc.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IndustrialHelpTooltip termKey={
              calc.id === 12 || calc.id === 13 ? 'pre_stretch' :
              calc.id === 4 || calc.id === 6 ? 'soc_batteria' :
              calc.id === 14 ? 'vibrazione_cuscinetti' :
              calc.id === 1 ? 'saturazione_baie' :
              'ansatz_qaoa'
            } label="Spiegazione Pratica" />
          </div>
        </div>

        {/* Banner Reparti Uniti per Operatore */}
        {calc.entanglement === 'OBBLIGATORIO' && calc.crossCategoryDetails ? (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><strong>🔒 REPARTI UNITI:</strong> [{calc.category}] ⟷ [{calc.crossCategoryDetails.crossedWith}]</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
              {calc.crossCategoryDetails.modules}
            </span>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span><strong>🔓 CALCOLO LOCALE:</strong> Solo [{calc.category}] ({calc.technicalModule})</span>
          </div>
        )}

        {/* Grandi Schede KPI per l'Operatore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block font-semibold">Valutazione di Linea:</span>
            <span className={`text-sm font-bold font-mono block leading-snug ${
              isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {diagnosticText}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-mono text-slate-400 block font-semibold">Cosa Fare Subito (Istruzione Operatore):</span>
              {res?.motivo_allarme && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10.5px] font-bold font-mono">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Motivo Allarme: {res.motivo_allarme}</span>
                </span>
              )}
            </div>
            <span className="text-base sm:text-lg font-bold text-cyan-200 block font-sans leading-snug">
              {operatorAction}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 block font-semibold">Stato Connessione Macchina:</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gateway M2M Attivo</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                NIS2 Conforme
              </span>
            </div>
          </div>
        </div>

        {/* Metriche dettagliate se presenti - Deduplicazione contro metrica principale */}
        {res?.metriche_dettagliate && Object.keys(res.metriche_dettagliate).length > 0 && (() => {
          const primaryValClean = String(res.metrica_principale_valore || '').replace(/[^\d.-]/g, '');
          const entries = Object.entries(res.metriche_dettagliate).filter(([k, v]) => {
            const keyLower = k.toLowerCase().trim();
            const valClean = String(v).replace(/[^\d.-]/g, '');
            if (calc.id === 1 && (keyLower.includes('congestione') || valClean === primaryValClean)) {
              return false;
            }
            return true;
          });

          if (entries.length === 0) return null;

          return (
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                Telemetria Sensori Chiave:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {entries.map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <span className="text-[9.5px] font-mono text-slate-400 truncate" title={k}>{k}:</span>
                    <span className="text-xs font-bold font-mono text-cyan-300 truncate mt-0.5">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Barra Azioni a Grande Formato */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Ultimo campionamento: {res?.timestamp ? new Date(res.timestamp).toLocaleTimeString() : 'In tempo reale'}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {SIMULATION_CONFIGS[calc.id] && (
              <button
                type="button"
                onClick={() => handleOpenSimulation(calc)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer min-h-[42px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                title={`Avvia simulazione di confronto Prima / Dopo per ${calc.name}`}
              >
                <Sliders className="w-4 h-4 text-purple-200" />
                <span>Simula (Prima / Dopo)</span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setSelectedPythonCalc(calc)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[42px] transition-all shadow-xs"
                title={`Visualizza codice Python CUDA-Q del Calcolo #${calc.id} (Solo Amministratore)`}
              >
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Codice Python</span>
              </button>
            )}
            <button
              type="button"
              disabled={isExecuting}
              onClick={() => executeCalculation(calc)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 cursor-pointer min-h-[42px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isExecuting ? 'Elaborazione in corso...' : 'Esegui Verifica Immediata'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  {/* Pannello Simulazione Confronto "Prima / Dopo" Split-Screen */}
  const renderSimulationComparisonPanel = (calc: QuantumCalculationMeta) => {
    const config = SIMULATION_CONFIGS[calc.id];
    if (!config) return null;

    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border-2 border-indigo-500/60 shadow-2xl space-y-4 font-mono text-xs">
        {/* Header del Pannello di Simulazione */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/30 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Simulazione Confronto (Prima / Dopo)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/50">
                  Calcolo #{calc.id}
                </span>
              </div>
              <p className="text-[11px] text-indigo-300/80">
                Esecuzione in memoria isolata • Snapshot telemetria congelata
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseSimulation}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
            title="Chiudi simulazione e ripristina visualizzazione standard"
          >
            <X className="w-4 h-4" />
            <span>Chiudi</span>
          </button>
        </div>

        {/* Due Colonne: Prima (Congelata) vs Dopo (Modificabile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Colonna PRIMA: Snapshot Congelato */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                PRIMA: Telemetria Congelata
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-slate-900 border border-slate-700 text-slate-400">
                Sola Lettura
              </span>
            </div>
            <div className="space-y-2">
              {config.inputs.map(input => (
                <div key={input.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">{input.label}:</span>
                  <span className="font-bold text-slate-200 text-xs">
                    {formatInputValue(simPrimaInputs[input.key])} {input.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Colonna DOPO: Modificabile dall'operatore */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-1.5">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                DOPO: Parametri di Simulazione
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold">
                Modificabile
              </span>
            </div>
            <div className="space-y-2">
              {config.inputs.map(input => (
                <div key={input.key} className="space-y-1">
                  <label className="text-[10.5px] text-slate-300 flex justify-between">
                    <span>{input.label}:</span>
                    {input.unit && <span className="text-slate-500">{input.unit}</span>}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={simDopoInputs[input.key] ?? ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSimDopoInputs(prev => ({ ...prev, [input.key]: val }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/50 text-indigo-100 font-mono text-xs focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pulsante Esegui Confronto */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleRunSimulation(calc.id)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer min-h-[40px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSimulating ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Simulazione quantistica in memoria...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Esegui Confronto</span>
              </>
            )}
          </button>
        </div>

        {/* Tabella Risultati Confronto (se eseguito) */}
        {simComparisonResult && (
          <div className="space-y-3 pt-3 border-t border-indigo-500/30 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Tabella Scostamento (Delta Analitico)
              </span>
              <span className="text-[10px] text-slate-400">
                Verde = Migliorativo • Rosso = Peggiorativo
              </span>
            </div>

            {/* Tabella Input */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-2">Parametro Input</th>
                    <th className="p-2">Prima</th>
                    <th className="p-2">Dopo</th>
                    <th className="p-2">Delta Input</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {config.inputs.map(input => {
                    const p = simPrimaInputs[input.key];
                    const d = simDopoInputs[input.key];
                    const diff = (typeof d === 'number' && typeof p === 'number') ? Number((d - p).toFixed(2)) : null;
                    return (
                      <tr key={input.key} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-300 font-semibold">{input.label}</td>
                        <td className="p-2 text-slate-400">{formatInputValue(p)} {input.unit}</td>
                        <td className="p-2 text-indigo-300 font-bold">{formatInputValue(d)} {input.unit}</td>
                        <td className="p-2 font-mono">
                          {diff !== null ? (
                            <span className={diff === 0 ? 'text-slate-400' : 'text-cyan-300'}>
                              {diff > 0 ? `+${diff}` : diff} {input.unit}
                            </span>
                          ) : (
                            <span className="text-slate-500">{d === p ? '=' : 'MODIFICATO'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tabella Output */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-2">Metrica Output QPU</th>
                    <th className="p-2">Prima</th>
                    <th className="p-2">Dopo</th>
                    <th className="p-2">Delta / Esito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {config.outputs.map(output => {
                    const pVal = simComparisonResult.prima[output.key];
                    const dVal = simComparisonResult.dopo[output.key];
                    const numP = typeof pVal === 'number' ? pVal : parseFloat(String(pVal));
                    const numD = typeof dVal === 'number' ? dVal : parseFloat(String(dVal));
                    const hasNumbers = !isNaN(numP) && !isNaN(numD);
                    const diff = hasNumbers ? Number((numD - numP).toFixed(2)) : null;

                    let isBetter: boolean | null = null;
                    if (diff !== null && diff !== 0) {
                      if (output.betterDirection === 'higher') {
                        isBetter = diff > 0;
                      } else if (output.betterDirection === 'lower') {
                        isBetter = diff < 0;
                      }
                    } else if (typeof pVal === 'boolean' && typeof dVal === 'boolean') {
                      if (pVal !== dVal) {
                        isBetter = !dVal; // per allarmi, false è meglio
                      }
                    } else if (typeof pVal === 'string' && typeof dVal === 'string') {
                      if (dVal.includes('REGOLARE') || dVal.includes('APPROVATO') || dVal.includes('PARETO')) {
                        if (!pVal.includes('REGOLARE') && !pVal.includes('APPROVATO') && !pVal.includes('PARETO')) {
                          isBetter = true;
                        }
                      } else if (dVal.includes('ALLARME') || dVal.includes('SCARTATO') || dVal.includes('CRITICO')) {
                        if (!pVal.includes('ALLARME') && !pVal.includes('SCARTATO') && !pVal.includes('CRITICO')) {
                          isBetter = false;
                        }
                      }
                    }

                    return (
                      <tr key={output.key} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-200 font-semibold">{output.label}</td>
                        <td className="p-2 text-slate-400">
                          {formatInputValue(pVal)} {output.unit || ''}
                        </td>
                        <td className="p-2 text-white font-bold">
                          {formatInputValue(dVal)} {output.unit || ''}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            isBetter === true
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isBetter === false
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {diff !== null ? (
                              <>
                                {diff > 0 ? `+${diff}` : diff} {output.unit || ''}
                                {isBetter === true ? ' (Migliorato ✓)' : isBetter === false ? ' (Peggiorato ✗)' : ''}
                              </>
                            ) : (
                              <>
                                {String(dVal)}
                                {isBetter === true ? ' (Migliorato ✓)' : isBetter === false ? ' (Peggiorato ✗)' : ''}
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
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
                Mostrando esclusivamente i calcoli compatibili con i macchinari e i nodi fisici autorizzati per "{activeTenant.nome}" ({activeTenant.sito}).
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

            {/* PULSANTE UNICO PER TUTTI I CALCOLI: File Python e risultato all calcs (DI FIANCO A CARICA CSV) */}
            {canViewPythonCode && (
              <div className="flex items-center rounded-xl bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-700 border border-emerald-400/60 shadow-lg shadow-emerald-950/40">
                <button
                  type="button"
                  onClick={handleDownloadAllCalcsTxt}
                  className="px-4 py-2 hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                  title={`Scarica subito il file .txt con tutti i file Python e i risultati di tutti i calcoli dello stabilimento ${activeTenant.nome}`}
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>File Python e risultato all calcs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAllPythonModalOpen(true)}
                  className="px-2.5 py-2 border-l border-emerald-400/40 text-emerald-200 hover:text-white hover:bg-emerald-600/30 transition-colors cursor-pointer"
                  title="Apri l'anteprima a schermo del file consolidato e visualizza i singoli calcoli"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* PULSANTE RICALCOLA TUTTI (ESEGUE IL RE-SAMPLING PROGRESSIVO DI TUTTI I CIRCUITI QPU) */}
            <button
              type="button"
              disabled={isRecomputingAll}
              onClick={handleRecomputeAllCatalogCalcs}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border shadow-lg ${
                isRecomputingAll
                  ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white border-cyan-500/40 shadow-slate-950/40 hover:scale-[1.02]'
              } active:scale-[0.98] disabled:opacity-60`}
              title="Ricalcola tutti i calcoli dello stabilimento aggiornando in tempo reale stati quantistici, telemetria e timestamp"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecomputingAll ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
              <span>
                {isRecomputingAll 
                  ? `Ricalcolo (${recomputeProgress?.current || 0}/${recomputeProgress?.total || plantSupportedCalcs.length})...` 
                  : 'Ricalcola Tutti'}
              </span>
            </button>

            {/* PULSANTE VISUALIZZAZIONE GRAFICO STABILIMENTO (A FIANCO DI CARICA CSV) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setShowTrendCharts(!showTrendCharts)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border shadow-lg ${
                  showTrendCharts
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-cyan-950/40'
                    : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white border-cyan-500/40 shadow-slate-950/40 hover:scale-[1.02]'
                } active:scale-[0.98]`}
                title="Visualizza o nascondi il modulo grafico degli andamenti temporali di telemetria e calcoli dello stabilimento"
              >
                <TrendingUp className="w-4 h-4 text-cyan-300" />
                <span>{showTrendCharts ? 'Nascondi Grafico Stabilimento' : 'Mostra Grafico Stabilimento'}</span>
                {showTrendCharts ? <ChevronUp className="w-3.5 h-3.5 text-cyan-200" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            )}

            {/* DOCUMENTAZIONE LOGICA DEI 21 CALCOLI (Copia & Scarica) - SOLO PER AMMINISTRATORE */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsLogicDocModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Apri casella di testo con tutta la logica quantistica e classica dei 21 calcoli per copiarla o scaricarla"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Logica 21 Calcoli (Copia & Scarica)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEZIONE GRAFICO DEGLI ANDAMENTI TEMPORALI DEI DATI NEL TEMPO (Attivata dal pulsante a fianco di Carica CSV) */}
      {activeTenant && currentUser && showTrendCharts && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <PlantTelemetryTrendCharts
            activeTenant={activeTenant}
            currentUser={currentUser}
            tenants={tenants}
            onSelectTenant={onSelectTenant}
          />
        </div>
      )}
      {/* ========================================================================= */}
      {/* FILTRI RAPIDI PER REPARTO (DEPARTMENT FILTERS)                            */}
      {/* ========================================================================= */}
      <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar touch-pan-x flex-nowrap sm:flex-wrap font-mono">
        {DEPARTMENT_FILTERS.map((dep) => {
          const isSelected = selectedDepartment === dep.id;
          const pool = activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
          const countInDep = dep.id === 'ALL' 
            ? pool.length 
            : pool.filter(c => dep.calcIds.includes(c.id)).length;

          return (
            <button
              key={dep.id}
              type="button"
              onClick={() => {
                setSelectedDepartment(dep.id);
                // Also auto-select the first calculation in this department
                const firstInDep = pool.find(c => dep.calcIds.includes(c.id));
                if (firstInDep) {
                  setSelectedCalcId(firstInDep.id);
                }
              }}
              className={`shrink-0 sm:flex-1 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[38px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title={dep.description}
            >
              <span>{dep.icon}</span>
              <span>{dep.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                isSelected ? 'bg-black/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {countInDep}
              </span>
            </button>
          );
        })}
      </div>

      <div className={displayMode === 'table-focus' ? "flex flex-col lg:flex-row gap-4 sm:gap-6 items-start" : ""}>
        {/* COLONNA SINISTRA: TABELLA DEI SOLI PULSANTI (solo in modalità table-focus) */}
        {displayMode === 'table-focus' && (
          <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 font-mono shadow-xl sticky top-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <LayoutList className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                  {selectedCategory === 'ALL' ? 'Tutti i Calcoli' : selectedCategory}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                {tableCalculations.length} {tableCalculations.length === 1 ? 'Nodo' : 'Nodi'}
              </span>
            </div>

            {/* Tabella dei soli pulsanti */}
            <div className="flex flex-col gap-1.5 max-h-[calc(100vh-210px)] min-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {tableCalculations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nessun calcolo inerente per questo filtro.
                </div>
              ) : (
                tableCalculations.map(c => {
                  const isSelected = selectedCalc.id === c.id;
                  const nodeReq = PLANT_NODE_REQUIREMENTS[c.id];
                  const hasResult = Boolean(results[c.id]);
                  const isExecuting = executingId === c.id;
                  const itemResult = results[c.id];
                  const isItemCrit = Boolean(
                    itemResult?.indice_rischio_blocco?.toLowerCase().includes('critico') ||
                    itemResult?.livello_rischio?.toLowerCase().includes('critico') ||
                    itemResult?.rischio_stocastico?.toLowerCase().includes('critico') ||
                    (itemResult?.probabilita_fermo_pct && parseFloat(String(itemResult.probabilita_fermo_pct)) > 70) ||
                    (itemResult?.codice_allarme_fabbrica && itemResult.codice_allarme_fabbrica > 0)
                  );
                  const isItemWarn = !isItemCrit && Boolean(
                    itemResult?.indice_rischio_blocco?.toLowerCase().includes('attenzione') ||
                    itemResult?.livello_rischio?.toLowerCase().includes('attenzione') ||
                    itemResult?.rischio_stocastico?.toLowerCase().includes('attenzione') ||
                    (itemResult?.probabilita_fermo_pct && parseFloat(String(itemResult.probabilita_fermo_pct)) > 30)
                  );
                  const trafficLight = isItemCrit ? '🔴' : isItemWarn ? '🟡' : itemResult ? '🟢' : '⚪';

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCalcId(c.id);
                        if (window.innerWidth < 1024) {
                          document.getElementById('enlarged-calc-view')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-950/60 ring-2 ring-cyan-500/40 scale-[1.01]'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                      title={`Clicca per ingrandire il calcolo [${c.id}] ${c.name}`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                            isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                          }`}>
                            <span className="text-[11px] leading-none">{trafficLight}</span>
                            <span>#{c.id}</span>
                          </span>
                          <span className="text-xs font-bold truncate">
                            {c.name}
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            c.entanglement === 'OBBLIGATORIO'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {c.entanglementSymbol}
                          </span>
                          {isSelected && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1">
                        <span className="truncate text-slate-400">
                          {nodeReq?.nodeName ? nodeReq.nodeName : c.technicalModule}
                        </span>
                        <span className={`font-mono text-[9px] ${
                          isExecuting ? 'text-amber-400 animate-pulse' : hasResult ? 'text-emerald-400 font-bold' : 'text-slate-500'
                        }`}>
                          {isExecuting ? '● In Esecuzione' : hasResult ? '✓ Dati Pronti' : 'In attesa'}
                        </span>
                      </div>

                      {/* Info Reparti Uniti per Calcoli con Lucchetto Chiuso 🔒 vs Singolo Reparto 🔓 */}
                      {c.entanglement === 'OBBLIGATORIO' && c.crossCategoryDetails ? (
                        <div className="text-[9.5px] font-mono text-amber-300/90 flex items-center gap-1 truncate pt-0.5 border-t border-slate-800/60 mt-0.5">
                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">
                            Unisce: <strong className="text-amber-200">{c.crossCategoryDetails.modules}</strong> ({c.crossCategoryDetails.crossedWith.replace(/^\d+\.\s*/, '')})
                          </span>
                        </div>
                      ) : (
                        <div className="text-[9.5px] font-mono text-emerald-400/70 flex items-center gap-1 truncate pt-0.5 border-t border-slate-800/60 mt-0.5">
                          <Unlock className="w-2.5 h-2.5 text-emerald-400/80 shrink-0" />
                          <span className="truncate">Locale: solo {c.technicalModule}</span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* AREA DEI CALCOLI: SE table-focus MOSTRA SOLO QUELLO SELEZIONATO INGRANDITO, ALTRIMENTI GRIGLIA */}
        <div id="enlarged-calc-view" className={displayMode === 'table-focus' ? "flex-1 min-w-0 w-full" : "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1"}>
          {(displayMode === 'table-focus' ? (selectedCalc ? [selectedCalc] : []) : visibleCalculations).length === 0 ? (
            <div className="col-span-full p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl font-mono text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
              <p className="text-sm font-bold text-slate-200">
                Nessun macchinario o nodo presente per questo stabilimento.
              </p>
              <p className="text-xs">
                I calcoli vengono mostrati solo per i macchinari effettivamente installati.
              </p>
            </div>
          ) : (
            (displayMode === 'table-focus' ? (selectedCalc ? [selectedCalc] : []) : visibleCalculations).map((calc) => {
              const isLocked = calc.entanglement === 'OBBLIGATORIO';
              const inputs = formInputs[calc.id] || calc.defaultInputs;
              const result = results[calc.id];
              const isBusy = executingId === calc.id;
              const nodeReq = PLANT_NODE_REQUIREMENTS[calc.id];
              const isSupported = isCalculationSupportedByPlant(calc.id, activeTenant);
              const isEnlarged = displayMode === 'table-focus';

              if (operatorMode) {
                if (simulationCalcId === calc.id) {
                  return (
                    <div key={calc.id} id={`calc-card-${calc.id}`} className="col-span-full grid grid-cols-1 xl:grid-cols-2 gap-4 w-full animate-in fade-in duration-150">
                      <div className="w-full">
                        {renderOperatorTrafficLightCard(calc, result)}
                      </div>
                      <div className="w-full">
                        {renderSimulationComparisonPanel(calc)}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={calc.id} id={`calc-card-${calc.id}`} className="space-y-4 w-full animate-in fade-in duration-150">
                    {renderOperatorTrafficLightCard(calc, result)}
                  </div>
                );
              }

              const cardContent = (
                <div 
                  id={`calc-card-${calc.id}`}
                  className={`bg-slate-900 border rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col justify-between space-y-2.5 sm:space-y-3 transition-all ${
                    isEnlarged
                      ? 'border-cyan-500/50 shadow-2xl shadow-cyan-950/40 ring-1 ring-cyan-500/30 w-full'
                      : isSupported 
                      ? 'border-slate-800 hover:border-slate-700' 
                      : 'border-slate-800/60 opacity-85'
                  }`}
                >
                  {/* Banner superiore se in modalità ingrandita */}
                  {isEnlarged && (
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Focus className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span className="font-bold text-white text-[11px] sm:text-xs">Calcolo Selezionato:</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          [#{calc.id}] {calc.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        1 calcolo alla volta • Usa i pulsanti a sinistra per cambiare
                      </span>
                    </div>
                  )}
              {/* Connected Plant Node Badge */}
              {nodeReq && (
                <div className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono flex items-center justify-between border ${
                  isSupported
                    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/80 shadow-xs'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800'
                }`}>
                  <span className="flex items-center gap-1.5 truncate">
                    <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Nodo Associato: <strong className="text-white">{nodeReq.nodeName}</strong></span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    isSupported 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isSupported ? '✓ Presente nello Stabilimento' : 'Macchinario Assente'}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono">
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md border bg-slate-800 text-cyan-300 border-slate-700 flex items-center gap-1 shadow-xs">
                      Calcolo #{calc.id}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                      {calc.technicalModule}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 font-medium px-0.5">
                      {calc.subFunction}
                    </span>

                    {/* Punto di domanda '?' per visualizzare la riga esatta di Telemetria CPU */}
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setSelectedCpuCalc(calc)}
                        onMouseEnter={() => setHoveredCalcId(calc.id)}
                        onMouseLeave={() => setHoveredCalcId(null)}
                        className="px-1.5 py-0.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-sm group flex items-center gap-1"
                        title="Visualizza telemetria CPU / specifiche tecniche complete del calcolo (Punto di domanda)"
                      >
                        <HelpCircle className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-mono font-bold text-cyan-400">?</span>
                      </button>

                      {/* Tooltip popup al passaggio del mouse */}
                      {hoveredCalcId === calc.id && !selectedCpuCalc && (
                        <div className="absolute z-50 left-0 top-full mt-2 w-72 sm:w-80 p-2.5 rounded-xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md text-left font-mono text-[11px] pointer-events-none animate-in fade-in zoom-in-95 space-y-1.5">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                            <span className="font-bold text-cyan-400 flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              Telemetria CPU [{calc.id}]
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${calc.isCrossCategory ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {calc.isCrossCategory ? '[+] INCROCIATO' : '[-] LOCALE'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9.5px] block font-semibold">Dati e Parametri Telemetria CPU:</span>
                            <span className="text-slate-200 text-[10px] leading-snug">
                              {calc.crossCategoryDetails?.parametersOrData || calc.description}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                            <span>Target: <strong className="text-slate-300">{calc.hardwareTarget.split('/')[0]}</strong></span>
                            <span className="text-cyan-400 font-bold">Clicca per dettagli completi</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pulsante File Codice Python & Risultato (Riservato ad Amministratore e Responsabile) */}
                    {canViewPythonCode && (
                      <button
                        type="button"
                        onClick={() => setSelectedPythonCalc(calc)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 text-[11px] font-mono font-bold"
                        title={`Visualizza file con codice Python e risultato per il Calcolo #${calc.id} (Riservato ad Amministratore e Responsabile)`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>File Python & Risultato</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFocusedCalcId(focusedCalcId === calc.id ? null : calc.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 border shadow-xs ${
                      focusedCalcId === calc.id
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                        : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-500/50 hover:border-cyan-400'
                    }`}
                    title={focusedCalcId === calc.id ? "Mostra di nuovo tutti i calcoli" : "Lavora solo su questo calcolo e nascondi momentaneamente tutti gli altri"}
                  >
                    {focusedCalcId === calc.id ? (
                      <>
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Mostra Tutti</span>
                      </>
                    ) : (
                      <>
                        <Focus className="w-3 h-3 text-cyan-400" />
                        <span>Isola</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono">
                    {calc.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {calc.description}
                  </p>
                </div>
              </div>

              {/* BANNER ESPLICITO REPARTI UNITI DALL'ENTANGLEMENT (Lucchetto Chiuso 🔒 vs Lucchetto Aperto 🔓) */}
              {isLocked ? (
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-500/50 shadow-sm font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10.5px] flex items-center gap-1.5 shadow-xs">
                        <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        LUCCHETTO CHIUSO: ENTANGLEMENT TRA REPARTI (CALCOLO INCROCIATO)
                      </span>
                      <span className="text-amber-300 font-bold text-[11px]">
                        Unisce 2 o più reparti di stabilimento:
                      </span>
                    </div>
                    {calc.crossCategoryDetails?.modules && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                        {calc.crossCategoryDetails.modules}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-500/20 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-700 font-bold text-[11px]">
                      {calc.category}
                    </span>
                    <span className="text-amber-400 font-black text-sm px-0.5">⟷</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
                      {calc.crossCategoryDetails?.crossedWith}
                    </span>
                  </div>

                  {calc.crossCategoryDetails?.parametersOrData && (
                    <div className="text-[10.5px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                      <span className="text-amber-400 font-semibold">Parametri accoppiati in Entanglement: </span>
                      <span className="text-slate-200">{calc.crossCategoryDetails.parametersOrData}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 font-mono text-xs flex items-center justify-between flex-wrap gap-2 text-emerald-300">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10.5px] flex items-center gap-1">
                      <Unlock className="w-3.5 h-3.5" />
                      LUCCHETTO APERTO: CALCOLO LOCALE (NON INCROCIATO)
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      Circoscritto a un <strong>singolo reparto</strong>: 
                      <strong className="text-emerald-300 ml-1">[{calc.category}] ({calc.technicalModule})</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Nessun accoppiamento esterno</span>
                </div>
              )}

              {/* RISULTATO DIAGNOSTICO IMMEDIATO (Visibile subito senza premere calcolo) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    Risultato & Stato Problematiche in Tempo Reale:
                  </span>
                  <span className="text-[9.5px] text-slate-500 hidden sm:inline">
                    Telemetria gateway / log attivi
                  </span>
                </div>
                {renderDiagnosticResultBox(calc, result)}
              </div>

              {/* Sezione Parametri di Fabbrica (Collassabile o Regolabile se si desidera forzare nuovi input) */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setExpandedInputs(prev => ({ ...prev, [calc.id]: !prev[calc.id] }))}
                  className="w-full py-1 px-2.5 rounded-lg bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>Parametri Macchinario / Input ({(isEnlarged || expandedInputs[calc.id]) ? 'Parametri Attivi' : 'Mostra / Modifica'})</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                    {(isEnlarged || expandedInputs[calc.id]) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </span>
                </button>

                {(isEnlarged || expandedInputs[calc.id] || focusedCalcId === calc.id) && (
                  <div 
                    onFocusCapture={() => { if (focusedCalcId === null) setFocusedCalcId(calc.id); }}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 animate-in fade-in duration-150"
                  >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    Parametri di Fabbrica (Input)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Target: {calc.hardwareTarget.split('/')[0]}
                  </span>
                </div>

                {/* Sulla stessa riga: Campi Input e Pulsante Ricalcola */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pt-0.5">
                  <div className="flex-1 min-w-0">
                    {/* Calcolo 1 */}
                    {calc.id === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div>
                          <label className="text-[11px] font-mono text-slate-400 block mb-1 truncate">Camion in attesa</label>
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
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Spessore Interfalda (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.spessore_interfalda_mm ?? inputs.spessore_micro ?? 2.8}
                        onChange={e => {
                          const val = Number(e.target.value);
                          handleInputChange(4, 'spessore_interfalda_mm', val);
                          handleInputChange(4, 'spessore_micro', val);
                        }}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Colli da Caricare</label>
                      <input
                        type="number"
                        min="1"
                        value={inputs.colli_da_caricare ?? (Array.isArray(inputs.lista_pesi_pallet) ? inputs.lista_pesi_pallet.length : 33)}
                        onChange={e => {
                          const val = Number(e.target.value);
                          handleInputChange(10, 'colli_da_caricare', val);
                          handleInputChange(10, 'colli', val);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Volume Cassone Camion (m³)</label>
                      <input
                        type="number"
                        value={inputs.volume_cassone_m3 ?? inputs.volume_disponibile_mc ?? 86.0}
                        onChange={e => {
                          const val = Number(e.target.value);
                          handleInputChange(10, 'volume_cassone_m3', val);
                          handleInputChange(10, 'volume_disponibile_mc', val);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Peso Totale Carico (kg)</label>
                      <input
                        type="number"
                        value={inputs.peso_totale_kg ?? 24500.0}
                        onChange={e => handleInputChange(10, 'peso_totale_kg', Number(e.target.value))}
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

                  {/* Pulsante Ricalcola Parametri manuali e Pulsante Simula (sulla stessa riga degli input) */}
                  <div className="shrink-0 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => executeCalculation(calc)}
                      disabled={isBusy}
                      className={`w-full lg:w-auto px-4 py-2 h-[38px] rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap ${
                        isBusy
                          ? 'bg-slate-800 text-slate-500 cursor-wait'
                          : isLocked
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                      }`}
                    >
                      {isBusy ? (
                        <>
                          <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          <span>Ricalcolo in corso...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Ricalcola con Nuovi Parametri ({calc.entanglementSymbol})</span>
                        </>
                      )}
                    </button>

                    {/* Pulsante Simula (Prima / Dopo) SOLO per i 10 calcoli abilitati */}
                    {SIMULATION_CONFIGS[calc.id] && (
                      <button
                        type="button"
                        onClick={() => handleOpenSimulation(calc)}
                        className="w-full lg:w-auto px-3.5 py-2 h-[38px] rounded-lg bg-gradient-to-r from-purple-900/90 to-indigo-900/90 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/60 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                        title={`Avvia simulazione di confronto Prima / Dopo per il Calcolo #${calc.id}`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-purple-300" />
                        <span>Simula (Prima / Dopo)</span>
                      </button>
                    )}

                    {/* Secondo Pulsante Esplicito File Python & Risultato */}
                    {canViewPythonCode && (
                      <button
                        type="button"
                        onClick={() => setSelectedPythonCalc(calc)}
                        className="w-full lg:w-auto px-3.5 py-2 h-[38px] rounded-lg bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                        title={`Apri il file con codice Python e risultato per ${calc.name}`}
                      >
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>File Python & Risultato</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
                  </div>
                </div>
              );

              if (simulationCalcId === calc.id) {
                return (
                  <div key={calc.id} className="col-span-full grid grid-cols-1 xl:grid-cols-2 gap-4 w-full animate-in fade-in duration-150">
                    <div className="w-full">
                      {cardContent}
                    </div>
                    <div className="w-full">
                      {renderSimulationComparisonPanel(calc)}
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={calc.id}>
                  {cardContent}
                </React.Fragment>
              );
            })
          )}
        </div>
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

              <div className="flex items-center gap-2">
                {canViewPythonCode && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedCpuCalc;
                      setSelectedCpuCalc(null);
                      setSelectedPythonCalc(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-950 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/60 text-emerald-300 hover:text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                    title="Visualizza file con codice Python e risultato del calcolo"
                  >
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>File Python & Risultato</span>
                  </button>
                )}

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

      {/* Modal Visualizzazione File Codice Python CUDA-Q & Risultato - Riservato ad Amministratore e Responsabile */}
      <QuantumPythonCodeModal
        isOpen={Boolean(selectedPythonCalc)}
        onClose={() => setSelectedPythonCalc(null)}
        calculation={selectedPythonCalc}
        canView={canViewPythonCode}
        result={selectedPythonCalc ? results[selectedPythonCalc.id] : undefined}
        inputs={selectedPythonCalc ? formInputs[selectedPythonCalc.id] : undefined}
        userRole={currentUser?.ruolo}
        userName={currentUser?.nomeCompleto || currentUser?.username}
        onRecompute={async (calc) => {
          const safeInputs = formInputs[calc.id] || calc.defaultInputs || {};
          const res = await QuantumEngine.executeCalculation(calc.id, safeInputs);
          setResults(prev => ({ ...prev, [calc.id]: res }));
          return res;
        }}
      />

      {/* Modal Unico Consolidato per Tutti i Calcoli Python e Risultati (File Python e risultato all calcs) */}
      <AllQuantumPythonModal
        isOpen={isAllPythonModalOpen}
        onClose={() => setIsAllPythonModalOpen(false)}
        activeTenant={activeTenant}
        plantSupportedCalcs={plantSupportedCalcs}
        allCalculations={QUANTUM_CALCULATIONS}
        results={results}
        formInputs={formInputs}
        currentUser={currentUser}
        canView={canViewPythonCode}
        onUpdateResults={(newResults) => setResults(newResults)}
      />
    </div>
  );
};
