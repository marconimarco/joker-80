import React, { useState, useMemo, useEffect } from 'react';
import { 
  QUANTUM_CALCULATIONS, 
} from '../data/calculationsMeta';
import { QuantumCalculationMeta, MacroCategory, FactoryTenant } from '../types/quantum';
import { QuantumEngine } from '../services/quantumEngine';
import { isCalculationSupportedByPlant, PLANT_NODE_REQUIREMENTS } from '../data/plantNodeCalculations';
import { ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION } from '../data/quantumLogicDocumentation';
import { evaluateCalculationStatus, extractDiagnosticSummary } from '../data/industrialThresholds';
import { 
  Cpu, 
  Lock, 
  Play, 
  Copy, 
  Check, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sliders,
  HelpCircle,
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
  Code2,
  Shuffle,
  ArrowRight
} from 'lucide-react';
import { PlantTelemetryTrendCharts } from './PlantTelemetryTrendCharts';
import { getUserPermittedCalculations } from '../data/plantNodeCalculations';
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
  { id: 'INBOUND_CAMION', label: 'Camion & Baie', icon: '🚚', calcIds: [1, 2, 10, 11, 12, 13, 21], description: 'Ottimizzazione attracco baie, saturazione piazzale, carico camion ed e-CMR' },
  { id: 'LGV_AGV', label: 'Navette LGV', icon: '🚜', calcIds: [16, 17, 19], description: 'Routing anti-collisione, batterie BMS e microgrid di ricarica navette' },
  { id: 'SMARTSTORE', label: 'Magazzino SmartStore', icon: '🏬', calcIds: [6, 7, 8, 9, 20], description: 'Saturazione stoccaggio, integrità scaffali, slotting 3D e ispezione pallet' },
  { id: 'BEMA_SILKWORM', label: 'Fasciatori Bema', icon: '📦', calcIds: [14, 15], description: 'Tensione film, pre-stiro pallet, usura cuscinetti e vibrazioni Bema Silkworm' },
  { id: 'ENERGY_MAINT', label: 'Robot, Qualità & Energia', icon: '⚡', calcIds: [4, 5, 14, 18, 19, 20, 21], description: 'Pallettizzatori robotici, controllo qualità, picchi potenza e manutenzione predittiva' },
  { id: 'SHIFTS_OPS', label: 'Turni & Reparto', icon: '👥', calcIds: [3, 9, 12, 17], description: 'Schedulazione turni baie, batching ordini e allocazione risorse flotta' },
];

export interface SimulationMetricDef {
  key: string;
  label: string;
  unit?: string;
  betterDirection: 'higher' | 'lower' | 'neutral';
  inputType?: 'number' | 'text' | 'boolean' | 'select';
  options?: string[];
  step?: string;
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
      { key: 'saturazione_wms', label: 'Saturazione WMS', unit: '%', betterDirection: 'lower', step: '0.5' },
    ],
    outputs: [
      { key: 'congestione_percentuale', label: 'Indice di congestione', unit: '%', betterDirection: 'lower' },
      { key: 'allarme_blocco_imminente', label: 'Allarme Blocco Imminente', betterDirection: 'lower' },
      { key: 'stato_qubit', label: 'Stato Qubit', betterDirection: 'neutral' },
    ]
  },
  2: {
    inputs: [
      { key: 'ritardo_stimato_minuti', label: 'Ritardo stimato', unit: 'min', betterDirection: 'lower' },
      { key: 'baie_libere', label: 'Baie libere', unit: 'baie', betterDirection: 'higher' },
    ],
    outputs: [
      { key: 'probabilita_fermo_linea_pct', label: 'Probabilità fermo linea', unit: '%', betterDirection: 'lower' },
      { key: 'costo_var_95_eur', label: 'Costo VaR 95%', unit: '€', betterDirection: 'lower' },
      { key: 'rischio_critico', label: 'Allarme Rischio Critico', betterDirection: 'lower' },
    ]
  },
  3: {
    inputs: [
      { key: 'ore_lavoro_disponibili', label: 'Ore lavoro disponibili', unit: 'h', betterDirection: 'neutral' },
      { key: 'baie_totali', label: 'Baie totali da coprire', unit: 'baie', betterDirection: 'neutral' },
    ],
    outputs: [
      { key: 'energia_ground_state', label: 'Energia Ground State', unit: 'eV', betterDirection: 'lower' },
      { key: 'efficienza_oraria_pct', label: 'Efficienza oraria', unit: '%', betterDirection: 'higher' },
      { key: 'costo_ottimo_turno_eur', label: 'Costo ottimo turno', unit: '€', betterDirection: 'lower' },
    ]
  },
  4: {
    inputs: [
      { key: 'umidita_rilevata', label: 'Umidità rilevata', unit: '%', betterDirection: 'lower', step: '0.1' },
      { key: 'spessore_interfalda_mm', label: 'Spessore interfalda', unit: 'mm', betterDirection: 'neutral', step: '0.1' },
      { key: 'forza_deformazione_n', label: 'Forza deformazione', unit: 'N', betterDirection: 'higher' },
    ],
    outputs: [
      { key: 'indice_conformita_lotto_pct', label: 'Conformità lotto', unit: '%', betterDirection: 'higher' },
      { key: 'esito_collaudo', label: 'Esito collaudo', betterDirection: 'neutral' },
    ]
  },
  6: {
    inputs: [
      { key: 'classe_rotazione', label: 'Classe rotazione', betterDirection: 'neutral', inputType: 'select', options: ['HIGH', 'MEDIUM', 'LOW'] },
      { key: 'celle_libere_3d', label: 'Celle 3D libere', unit: 'celle', betterDirection: 'higher' },
      { key: 'peso_bilancia_kg', label: 'Peso bilancia', unit: 'kg', betterDirection: 'neutral' },
      { key: 'sagoma_fuori_asse', label: 'Sagoma fuori asse', betterDirection: 'lower', inputType: 'boolean' },
    ],
    outputs: [
      { key: 'efficienza_slotting_pct', label: 'Efficienza slotting', unit: '%', betterDirection: 'higher' },
      { key: 'tempo_ciclo_trasloelevatore_sec', label: 'Tempo ciclo trasloelevatore', unit: 's', betterDirection: 'lower' },
      { key: 'coordinata_3d_esatta', label: 'Cella assegnata', betterDirection: 'neutral' },
    ]
  },
  7: {
    inputs: [
      { key: 'micro_inclinazione', label: 'Micro-inclinazione', unit: '°', betterDirection: 'lower', step: '0.05' },
      { key: 'pressione_pattini_bar', label: 'Pressione pattini max', unit: 'bar', betterDirection: 'lower', step: '0.5' },
      { key: 'carico_pattini_integri', label: 'Pattini integri', betterDirection: 'higher', inputType: 'boolean' },
    ],
    outputs: [
      { key: 'fattore_sicurezza', label: 'Fattore sicurezza EN 15635', unit: 'x', betterDirection: 'higher' },
      { key: 'stress_strutturale_mpa', label: 'Stress strutturale', unit: 'MPa', betterDirection: 'lower' },
      { key: 'conformita_asrs', label: 'Esito strutturale', betterDirection: 'neutral' },
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
  9: {
    inputs: [
      { key: 'ordini_in_coda', label: 'Ordini in coda', unit: 'ordini', betterDirection: 'neutral' },
      { key: 'coefficiente_traffico', label: 'Coefficiente traffico (0-1)', unit: '', betterDirection: 'lower', step: '0.05' },
    ],
    outputs: [
      { key: 'efficienza_batching_pct', label: 'Efficienza batching QGNN', unit: '%', betterDirection: 'higher' },
      { key: 'tempo_consolidamento_sec', label: 'Tempo consolidamento', unit: 's', betterDirection: 'lower' },
      { key: 'validazione_logica_lotto', label: 'Esito batching', betterDirection: 'neutral' },
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
      { key: 'esito_sagoma', label: 'Conformità carico 44t', betterDirection: 'neutral' },
      { key: 'stato_qubit_incastro', label: 'Configurazione Qubit', betterDirection: 'neutral' },
    ]
  },
  12: {
    inputs: [
      { key: 'camion_in_coda', label: 'Camion in coda / piazzale', unit: 'camion', betterDirection: 'lower' },
      { key: 'baie_disponibili', label: 'Baie disponibili', unit: 'baie', betterDirection: 'higher' },
      { key: 'pallet_pronti_linea', label: 'Pallet pronti linea', unit: 'plt', betterDirection: 'higher' },
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
      { key: 'saturazione_buffer', label: 'Saturazione buffer (0-1)', unit: '', betterDirection: 'lower', step: '0.05' },
    ],
    outputs: [
      { key: 'tempo_medio_attesa_min', label: 'Tempo medio attesa', unit: 'min', betterDirection: 'lower' },
      { key: 'saturazione_buffer_pct', label: 'Saturazione buffer', unit: '%', betterDirection: 'lower' },
      { key: 'stato_congestione', label: 'Stato congestione', betterDirection: 'neutral' },
    ]
  },
  14: {
    inputs: [
      { key: 'rpm_tavola_bema', label: 'Velocità tavola Bema', unit: 'RPM', betterDirection: 'neutral', step: '0.5' },
      { key: 'vibrazione_cuscinetti_g', label: 'Vibrazione cuscinetti', unit: 'g', betterDirection: 'lower', step: '0.02' },
      { key: 'pre_stiro_pct', label: 'Pre-stiro applicato', unit: '%', betterDirection: 'neutral' },
    ],
    outputs: [
      { key: 'frequenza_fondamentale_hz', label: 'Frequenza fondamentale (f0)', unit: 'Hz', betterDirection: 'neutral' },
      { key: 'diagnosi_vibrazionale', label: 'Diagnosi cuscinetti', betterDirection: 'neutral' },
      { key: 'stato_qubit_frequenza', label: 'Qubit Spettrale', betterDirection: 'neutral' },
    ]
  },
  15: {
    inputs: [
      { key: 'tensione_newton', label: 'Tensione', unit: 'N', betterDirection: 'lower', step: '0.5' },
      { key: 'velocita_svolgimento', label: 'Velocità svolgimento', unit: 'm/s', betterDirection: 'neutral', step: '0.2' },
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
      { key: 'distanza_laser_ostacolo_mm', label: 'Distanza laser ostacolo', unit: 'mm', betterDirection: 'higher' },
    ],
    outputs: [
      { key: 'indice_fluidita_flotta_pct', label: 'Fluidità flotta', unit: '%', betterDirection: 'higher' },
      { key: 'tempo_medio_transito_sec', label: 'Tempo medio transito', unit: 's', betterDirection: 'lower' },
      { key: 'valutazione_traffico', label: 'Valutazione traffico', betterDirection: 'neutral' },
    ]
  },
  17: {
    inputs: [
      { key: 'missioni_urgenti', label: 'Missioni urgenti', unit: 'missioni', betterDirection: 'neutral' },
      { key: 'soc_medio_flotta_pct', label: 'SoC medio flotta', unit: '%', betterDirection: 'higher', step: '1' },
      { key: 'temperatura_batterie_c', label: 'Temperatura batterie', unit: '°C', betterDirection: 'lower', step: '0.5' },
    ],
    outputs: [
      { key: 'efficienza_accoppiamento_pct', label: 'Efficienza accoppiamento BMS', unit: '%', betterDirection: 'higher' },
      { key: 'stato_qubit_allocazione', label: 'Qubit Allocazione', betterDirection: 'neutral' },
    ]
  },
  18: {
    inputs: [
      { key: 'pressione_vuoto_bar', label: 'Vuoto ventose', unit: 'bar', betterDirection: 'lower', step: '0.02' },
      { key: 'coppia_motori_nm', label: 'Coppia picco motori', unit: 'Nm', betterDirection: 'lower', step: '5' },
      { key: 'forza_pinze_n', label: 'Forza pinze', unit: 'N', betterDirection: 'higher', step: '10' },
    ],
    outputs: [
      { key: 'energia_ground_state_trovata', label: 'Energia Ground State VQE', unit: 'eV', betterDirection: 'neutral' },
      { key: 'tenuta_vuoto_pinza', label: 'Tenuta vuoto pinza', betterDirection: 'neutral' },
      { key: 'stato_manutenzione', label: 'Stato manutenzione', betterDirection: 'neutral' },
    ]
  },
  19: {
    inputs: [
      { key: 'potenza_erogata_totale_kw', label: 'Potenza erogata', unit: 'kW', betterDirection: 'neutral', step: '1' },
      { key: 'temp_piastre_c', label: 'Temp piastre contatto', unit: '°C', betterDirection: 'lower', step: '0.5' },
      { key: 'livello_supercondensatori_pct', label: 'Supercondensatori', unit: '%', betterDirection: 'higher', step: '1' },
    ],
    outputs: [
      { key: 'picco_tagliato_kw', label: 'Picco tagliato', unit: 'kW', betterDirection: 'higher' },
      { key: 'energia_recuperata_kwh', label: 'Energia recuperata', unit: 'kWh', betterDirection: 'higher' },
      { key: 'stato_termico', label: 'Stato termico microgrid', betterDirection: 'neutral' },
    ]
  },
  20: {
    inputs: [
      { key: 'throughput_pallet_ora', label: 'Throughput', unit: 'plt/h', betterDirection: 'higher' },
      { key: 'umidita_legno_pct', label: 'Umidità legno', unit: '%', betterDirection: 'lower', step: '0.2' },
      { key: 'forza_deformazione_pattini_n', label: 'Forza deformazione pattini', unit: 'N', betterDirection: 'higher', step: '50' },
    ],
    outputs: [
      { key: 'tasso_scarto_stimato_pct', label: 'Tasso scarto stimato', unit: '%', betterDirection: 'lower' },
      { key: 'pallet_scartati_ora_stima', label: 'Pallet scartati stima', unit: '/h', betterDirection: 'lower' },
      { key: 'esito_collaudo', label: 'Esito collaudo', betterDirection: 'neutral' },
    ]
  },
  21: {
    inputs: [
      { key: 'grado_qualita_stampa_iso', label: 'Qualità stampa ISO', betterDirection: 'neutral', inputType: 'select', options: ['CLASSE_A', 'CLASSE_B', 'CLASSE_C', 'CLASSE_F'] },
      { key: 'contrasto_ottico_pct', label: 'Contrasto ottico', unit: '%', betterDirection: 'higher', step: '1' },
      { key: 'temp_testina_termica_c', label: 'Temp testina termica', unit: '°C', betterDirection: 'lower', step: '0.5' },
    ],
    outputs: [
      { key: 'affidabilita_ricostruzione_barcode_pct', label: 'Affidabilità lettura barcode', unit: '%', betterDirection: 'higher' },
      { key: 'esito_lettura', label: 'Esito lettura GS1', betterDirection: 'neutral' },
      { key: 'stato_qubit_mitigato', label: 'Qubit Mitigato', betterDirection: 'neutral' },
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
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentFilter>('INBOUND_CAMION');
  const [operatorMode, setOperatorMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('joker80_operator_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLogicDocModalOpen, setIsLogicDocModalOpen] = useState<boolean>(false);
  const [showTrendCharts, setShowTrendCharts] = useState<boolean>(false);

  const buildTenantFormInputs = React.useCallback((tenantId?: string) => {
    const fresh: Record<number, Record<string, any>> = {};
    for (const c of QUANTUM_CALCULATIONS) {
      fresh[c.id] = { ...c.defaultInputs };
    }
    if (tenantId) {
      try {
        const saved = localStorage.getItem(`joker_custom_telemetry_${tenantId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          for (const c of QUANTUM_CALCULATIONS) {
            fresh[c.id] = { ...fresh[c.id], ...parsed };
          }
        }
      } catch {}
    }
    return fresh;
  }, []);

  const [formInputs, setFormInputs] = useState<Record<number, Record<string, any>>>(() =>
    buildTenantFormInputs(activeTenant?.id)
  );
  const [results, setResults] = useState<Record<number, any>>({});
  const lastComputedTenantRef = React.useRef<string | undefined>(undefined);
  const activeTenantIdRef = React.useRef<string | undefined>(activeTenant?.id);
  activeTenantIdRef.current = activeTenant?.id;

  // Re-sync form inputs & clear stale results when activeTenant changes
  useEffect(() => {
    setResults({});
    setSimulationCalcId(null);
    setSimComparisonResult(null);
    setSimPrimaInputs({});
    setSimDopoInputs({});
    setFormInputs(buildTenantFormInputs(activeTenant?.id));
  }, [activeTenant?.id, buildTenantFormInputs]);

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

  const [executingId, setExecutingId] = useState<number | null>(null);
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
    const raw = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
    const current: Record<string, any> = { ...raw };

    // Normalizza gli input complessi (vettori/mappe/chiavi legacy) nei campi scalari esposti dalla simulazione
    if (calc.id === 4) {
      current.forza_deformazione_n = current.forza_deformazione_n ?? 3400;
    } else if (calc.id === 7) {
      if (current.pressione_pattini_bar === undefined) {
        current.pressione_pattini_bar = Array.isArray(current.vettore_pressione_bar) && current.vettore_pressione_bar.length > 0
          ? Math.max(...current.vettore_pressione_bar.map(Number))
          : 15.0;
      }
      if (current.micro_inclinazione === undefined) current.micro_inclinazione = 0.4;
      if (current.carico_pattini_integri === undefined) current.carico_pattini_integri = true;
    } else if (calc.id === 8) {
      current.nodi_prelievo_count = current.nodi_prelievo_count ?? current.nodi_prelievo ?? (Array.isArray(current.lista_id_pallet) ? current.lista_id_pallet.length : 4);
      current.distanza_totale_metri = current.distanza_totale_metri ?? Math.max(120, Number(current.nodi_prelievo_count) * 85);
    } else if (calc.id === 9) {
      current.ordini_in_coda = current.ordini_in_coda ?? (Array.isArray(current.lista_ordini_camion) ? current.lista_ordini_camion.length : 24);
      current.coefficiente_traffico = current.coefficiente_traffico ?? 0.45;
    } else if (calc.id === 12) {
      current.camion_in_coda = current.camion_in_coda ?? current.camion_in_piazzale ?? 8;
      current.baie_disponibili = current.baie_disponibili ?? 2;
      current.pallet_pronti_linea = current.pallet_pronti_linea ?? 24;
      current.costo_orario_attesa_eur = current.costo_orario_attesa_eur ?? 65;
    } else if (calc.id === 13) {
      current.camion_attesa = current.camion_attesa ?? current.camion_in_attesa ?? 14;
      current.saturazione_buffer = current.saturazione_buffer ?? current.codice_saturazione_buffer ?? 0.75;
    } else if (calc.id === 14) {
      current.rpm_tavola_bema = current.rpm_tavola_bema ?? current.giri_minuto ?? 48.5;
      current.vibrazione_cuscinetti_g = current.vibrazione_cuscinetti_g ?? (Array.isArray(current.vettore_accelerometro) ? Math.max(...current.vettore_accelerometro.map(Number)) : 0.36);
      current.pre_stiro_pct = current.pre_stiro_pct ?? current.rapporto_prestiro_pct ?? 250;
    } else if (calc.id === 15) {
      current.pre_stiro_pct = current.pre_stiro_pct ?? 250;
      current.velocita_svolgimento = current.velocita_svolgimento ?? 12.4;
    } else if (calc.id === 16) {
      const coords = current.coordinate_agv_attivi && typeof current.coordinate_agv_attivi === 'object' ? current.coordinate_agv_attivi : null;
      current.navette_attive = current.navette_attive ?? current.navette_in_missione ?? (coords ? Object.keys(coords).length : 3);
      current.nodi_critici = current.nodi_critici ?? current.nodi_critici_congestione ?? (Array.isArray(current.mappa_ingorghi_nodi) ? current.mappa_ingorghi_nodi.length : 1);
      current.distanza_laser_ostacolo_mm = current.distanza_laser_ostacolo_mm ?? 4200;
    } else if (calc.id === 17) {
      const bats = current.telemetria_batterie_agv && typeof current.telemetria_batterie_agv === 'object' ? Object.values(current.telemetria_batterie_agv) as any[] : [];
      const avgSoc = bats.length > 0 ? Number((bats.reduce((a, b) => a + Number(b?.SoC ?? 65), 0) / bats.length).toFixed(1)) : 64.5;
      const maxTemp = bats.length > 0 ? Math.max(...bats.map(b => Number(b?.Temp ?? 34))) : 34.2;
      current.missioni_urgenti = current.missioni_urgenti ?? (Array.isArray(current.elenco_missioni_urgenti) ? current.elenco_missioni_urgenti.length : 8);
      current.soc_medio_flotta_pct = current.soc_medio_flotta_pct ?? avgSoc;
      current.temperatura_batterie_c = current.temperatura_batterie_c ?? maxTemp;
    } else if (calc.id === 18) {
      current.coppia_motori_nm = Array.isArray(current.coppia_motori_nm) ? Math.max(...current.coppia_motori_nm.map(Number)) : (current.coppia_motori_nm ?? 380);
      current.pressione_vuoto_bar = current.pressione_vuoto_bar ?? -0.84;
      current.forza_pinze_n = current.forza_pinze_n ?? 480;
    } else if (calc.id === 21) {
      current.contrasto_ottico_pct = current.contrasto_ottico_pct ?? 84.5;
      current.temp_testina_termica_c = current.temp_testina_termica_c ?? 54.2;
    }

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
    const targetTenantId = activeTenant?.id;
    const newResults: Record<number, any> = {};

    try {
      let count = 0;
      for (const calc of targetCalcs) {
        if (activeTenantIdRef.current !== targetTenantId) return;
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
      if (activeTenantIdRef.current === targetTenantId) {
        setResults(newResults);
        setToastMessage(`Ricalcolo completato con successo: aggiornati tutti i ${targetCalcs.length} calcoli con telemetria e timestamp live!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
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
    const currentTenantId = activeTenant?.id;
    const tenantChanged = lastComputedTenantRef.current !== currentTenantId;
    lastComputedTenantRef.current = currentTenantId;
    const activeFormInputs = tenantChanged ? buildTenantFormInputs(currentTenantId) : formInputs;

    // 1. Sync from scanSummary notifications ONLY if matching activeTenant
    const notifResults: Record<number, any> = {};
    const notifInputsMap: Record<number, Record<string, any>> = {};
    if (scanSummary && scanSummary.stabilimentoId === currentTenantId && scanSummary.notifiche?.length > 0) {
      for (const notif of scanSummary.notifiche) {
        if (notif.risultatoPayload && notif.risultatoPayload.calcolo_id === notif.calcoloId) {
          notifResults[notif.calcoloId] = notif.risultatoPayload;
        }
        if (notif.inputsUtilizzati && Object.keys(notif.inputsUtilizzati).length > 0) {
          const meta = QUANTUM_CALCULATIONS.find(c => c.id === notif.calcoloId);
          notifInputsMap[notif.calcoloId] = {
            ...(meta?.defaultInputs || {}),
            ...(activeFormInputs[notif.calcoloId] || {}),
            ...notif.inputsUtilizzati
          };
        }
      }
      if (Object.keys(notifInputsMap).length > 0) {
        setFormInputs(prev => ({ ...prev, ...notifInputsMap }));
      }
      if (Object.keys(notifResults).length > 0) {
        setResults(prev => tenantChanged ? notifResults : ({ ...prev, ...notifResults }));
      }
    }

    // 2. Pre-calculate any missing results in the background (always reset when tenantChanged)
    const computeMissing = async () => {
      for (const calc of plantSupportedCalcs) {
        if (!active || activeTenantIdRef.current !== currentTenantId) break;
        const alreadyHas = !tenantChanged && Boolean(results[calc.id] || notifResults[calc.id]);
        if (!alreadyHas && !notifResults[calc.id]) {
          try {
            const raw = { ...(calc.defaultInputs || {}), ...(notifInputsMap[calc.id] || activeFormInputs[calc.id] || {}) };
            const inputs: Record<string, any> = {};
            for (const [k, v] of Object.entries(raw)) {
              inputs[k] = parseFlexibleInput(v, k);
            }
            const res = await QuantumEngine.executeCalculation(calc.id, inputs);
            if (active && activeTenantIdRef.current === currentTenantId) {
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
  }, [scanSummary, activeTenant?.id, plantSupportedCalcs, buildTenantFormInputs]);

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
      (lower.includes('bema') && [14, 15].includes(c.id)) ||
      (lower.includes('silkworm') && [14, 15].includes(c.id)) ||
      (lower.includes('lgv') && [16, 17, 19].includes(c.id)) ||
      (lower.includes('agv') && [16, 17, 19].includes(c.id)) ||
      (lower.includes('camion') && [1, 2, 10, 12, 13].includes(c.id)) ||
      (lower.includes('baia') && [1, 2, 3, 12].includes(c.id)) ||
      (lower.includes('baie') && [1, 2, 3, 12].includes(c.id)) ||
      (lower.includes('batteri') && [17, 19].includes(c.id)) ||
      (lower.includes('film') && [4, 14, 15].includes(c.id)) ||
      (lower.includes('vibraz') && [7, 14, 18].includes(c.id)) ||
      (lower.includes('smart') && [6, 7, 8, 9, 20].includes(c.id)) ||
      (lower.includes('robot') && [18].includes(c.id)) ||
      (lower.includes('woodpecker') && [20].includes(c.id)) ||
      ((lower.includes('raptor') || lower.includes('sscc')) && [5, 21].includes(c.id)) ||
      (lower.includes('oee') && [3, 14, 18].includes(c.id))
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

  // Se cambiano i calcoli supportati dallo stabilimento o il gruppo selezionato, mantieni un gruppo valido e un calcolo selezionato coerente
  useEffect(() => {
    if (plantSupportedCalcs.length === 0) return;
    const currentDep = DEPARTMENT_FILTERS.find(d => d.id === selectedDepartment && d.id !== 'ALL');
    const hasCalcsInCurrentDep = currentDep
      ? plantSupportedCalcs.some(c => currentDep.calcIds.includes(c.id))
      : false;

    if (!hasCalcsInCurrentDep) {
      const firstValidDep = DEPARTMENT_FILTERS.find(
        d => d.id !== 'ALL' && plantSupportedCalcs.some(c => d.calcIds.includes(c.id))
      );
      if (firstValidDep) {
        setSelectedDepartment(firstValidDep.id);
        const firstCalc = plantSupportedCalcs.find(c => firstValidDep.calcIds.includes(c.id));
        if (firstCalc) setSelectedCalcId(firstCalc.id);
        return;
      }
    }

    if (displayedCalculations.length > 0 && !displayedCalculations.some(c => c.id === selectedCalcId)) {
      setSelectedCalcId(displayedCalculations[0].id);
    }
  }, [plantSupportedCalcs, selectedDepartment, displayedCalculations, selectedCalcId]);

  // Gli utenti non amministratori visualizzano esclusivamente la modalità a tabella focalizzata con calcolo ingrandito
  useEffect(() => {
    if (!isAdmin && displayMode === 'grid') {
      setDisplayMode('table-focus');
    }
  }, [isAdmin, displayMode]);

  // Calcolo selezionato per la visualizzazione ingrandita
  const selectedCalc = useMemo(() => {
    return (
      displayedCalculations.find(c => c.id === selectedCalcId) ||
      displayedCalculations[0] ||
      plantSupportedCalcs.find(c => c.id === selectedCalcId) ||
      QUANTUM_CALCULATIONS.find(c => c.id === selectedCalcId) ||
      plantSupportedCalcs[0] ||
      QUANTUM_CALCULATIONS[0]
    );
  }, [selectedCalcId, displayedCalculations, plantSupportedCalcs]);

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

  // Esecuzione in memoria isolata (Modalità Esempio/Test): non sovrascrive la telemetria reale né i grafici dell'impianto
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

      setToastMessage(`⚡ Prova Calcolo [${calc.id}] "${calc.name}" completata in memoria di esempio (dati reali e grafici di stabilimento invariati).`);
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

    const statusEval = evaluateCalculationStatus(calc.id, res, formInputs[calc.id] || {}, calc.subFunction);
    const isCritical = statusEval.livelloAllarme === 'CRITICO';
    const isWarning = statusEval.livelloAllarme === 'ATTENZIONE';

    return (
      <div id={`result-card-${calc.id}`} className={`p-3 sm:p-4 rounded-xl border space-y-2.5 font-mono text-sm shadow-md transition-all ${
        isCritical 
          ? 'bg-gradient-to-br from-rose-950/35 via-slate-950 to-slate-950 border-rose-500/50 shadow-rose-950/20'
          : isWarning
            ? 'bg-gradient-to-br from-amber-950/35 via-slate-950 to-slate-950 border-amber-500/50 shadow-amber-950/20'
            : 'bg-gradient-to-br from-emerald-950/25 via-slate-950 to-slate-950 border-emerald-500/40 shadow-emerald-950/20'
      }`}>
        {/* Riga Unica Superiore: Metrica Principale + DIAGNOSI REALE (attaccati) + Stato Allarme & Orario */}
        <div className={`px-2.5 py-2 rounded-lg border flex items-center justify-between flex-wrap gap-2 ${
          isCritical
            ? 'bg-rose-950/30 border-rose-500/40'
            : isWarning
              ? 'bg-amber-950/30 border-amber-500/40'
              : 'bg-cyan-950/25 border-cyan-500/35'
        }`}>
          {res.metrica_principale_valore ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-300 font-bold">
                {res.metrica_principale_etichetta || 'Metrica Principale'}:
              </span>
              <span className={`text-lg sm:text-xl font-black tracking-tight font-mono leading-none ${
                isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-cyan-300'
              }`}>
                {res.metrica_principale_valore}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
                DIAGNOSI REALE
              </span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
              isCritical
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isWarning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {isCritical ? (
                <>
                  <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>CRITICO - PROBLEMATICA ATTIVA</span>
                </>
              ) : isWarning ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>ATTENZIONE - MONITORAGGIO</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>A REGIME - NESSUNA ANOMALIA</span>
                </>
              )}
            </span>
            {res.timestamp_esecuzione && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                Agg. {res.timestamp_esecuzione}
              </span>
            )}
          </div>
        </div>

        {/* Detailed KPIs Row - Compatti sulla stessa riga a larghezza ridotta */}
        {res.metriche_dettagliate && Object.keys(res.metriche_dettagliate).length > 0 && (() => {
          const primaryValClean = String(res.metrica_principale_valore || '').replace(/[^\d.-]/g, '');
          const primaryLabelClean = String(res.metrica_principale_etichetta || '').toLowerCase().trim();

          const entries = Object.entries(res.metriche_dettagliate).filter(([key, val]) => {
            const keyLower = key.toLowerCase().trim();
            const valClean = String(val).replace(/[^\d.-]/g, '');

            // Calcolo 1: Rimuovi congestione dal dettaglio secondario per evitare doppioni con metrica principale
            if (calc.id === 1 && keyLower.includes('congestione')) {
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
            <div className="flex flex-nowrap items-stretch gap-2 w-full overflow-x-auto no-scrollbar">
              {entries.map(([key, val]) => (
                <div
                  key={key}
                  className="flex-1 min-w-[104px] sm:min-w-0 px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 font-mono leading-tight flex flex-col justify-center"
                >
                  <span className="text-slate-400 text-[11px] block truncate" title={key}>{key}:</span>
                  <span className="font-bold text-cyan-300 text-xs sm:text-[13px] block mt-0.5 truncate" title={String(val)}>{String(val)}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Diagnosi e Consiglio Operativo Ingrandito con Badge Motivo Allarme */}
        {(() => {
          const diagnosticPhrase = extractDiagnosticSummary(res);
          const actionPhrase =
            res.azione_correttiva_suggerita ||
            res.piano_azione ||
            res.azione_immediata ||
            res.azione_logistica_immediata ||
            res.azione_misure_sicurezza ||
            res.azione_suggerita;

          if (!diagnosticPhrase && !actionPhrase) return null;

          return (
            <div className={`grid ${diagnosticPhrase && actionPhrase ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-xs font-mono items-stretch`}>
              {diagnosticPhrase && (
                <div className={`px-2.5 py-1.5 rounded-lg border min-w-0 flex flex-col justify-center ${
                  isCritical ? 'bg-rose-950/20 border-rose-500/30' : isWarning ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-bold mb-0.5 truncate" title="Diagnosi / Valutazione">
                    Diagnosi / Valutazione:
                  </span>
                  <span className={`font-semibold text-xs leading-snug break-words ${isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-slate-200'}`}>
                    {diagnosticPhrase}
                  </span>
                </div>
              )}

              {actionPhrase && (
                <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 min-w-0 flex flex-col justify-center gap-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider truncate" title="Consiglio Operativo / Azione Suggerita">
                      Consiglio Operativo / Azione Suggerita:
                    </span>
                    {res.motivo_allarme && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold">
                        <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Allarme: {res.motivo_allarme}</span>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-cyan-200 block leading-snug break-words">
                    {actionPhrase}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  const renderOperatorTrafficLightCard = (calc: QuantumCalculationMeta, res: any) => {
    const isExecuting = executingId === calc.id;
    const statusEval = evaluateCalculationStatus(calc.id, res, formInputs[calc.id] || {}, calc.subFunction);
    const isCritical = statusEval.livelloAllarme === 'CRITICO';
    const isWarning = statusEval.livelloAllarme === 'ATTENZIONE';

    const statusTitle = isCritical ? 'ROSSO: Anomalia Rilevata' : isWarning ? 'GIALLO: Attenzione Richiesta' : 'VERDE: Regolare in Marcia';
    const statusIcon = isCritical ? '🔴' : isWarning ? '🟡' : '🟢';

    const diagnosticText = extractDiagnosticSummary(res) || statusEval.dettaglio;

    const operatorAction = res?.azione_correttiva_suggerita || 
      res?.piano_azione || 
      res?.azione_immediata || 
      res?.azione_logistica_immediata || 
      statusEval.azione;

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
              calc.id === 14 || calc.id === 15 ? 'pre_stretch' :
              calc.id === 17 || calc.id === 19 ? 'soc_batteria' :
              calc.id === 1 ? 'saturazione_baie' :
              'ansatz_qaoa'
            } label="Spiegazione Pratica" />
          </div>
        </div>

        {/* Banner Reparti Uniti per Operatore */}
        {calc.entanglement === 'OBBLIGATORIO' && calc.crossCategoryDetails ? (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-mono flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Più reparti:</strong> [{calc.category}] ⟷ [{calc.crossCategoryDetails.crossedWith}]</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">
              {calc.crossCategoryDetails.modules}
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs sm:text-sm font-mono flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Reparto singolo:</strong> [{calc.category}] ({calc.technicalModule})</span>
          </div>
        )}

        {/* Grandi Schede KPI per l'Operatore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 block font-semibold">Valutazione di Linea:</span>
            <span className={`text-sm sm:text-base font-bold font-mono block leading-snug ${
              isCritical ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {diagnosticText}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-mono text-slate-400 block font-semibold">Cosa Fare Subito (Istruzione Operatore):</span>
              {res?.motivo_allarme && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold font-mono">
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
            <span className="text-xs font-mono text-slate-400 block font-semibold">Stato Connessione Macchina:</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gateway M2M Attivo</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                NIS2 Conforme
              </span>
            </div>
          </div>
        </div>

        {/* Metriche dettagliate se presenti - Deduplicazione contro metrica principale */}
        {res?.metriche_dettagliate && Object.keys(res.metriche_dettagliate).length > 0 && (() => {
          const primaryValClean = String(res.metrica_principale_valore || '').replace(/[^\d.-]/g, '');
          const primaryLabelClean = String(res.metrica_principale_etichetta || '').toLowerCase().trim();
          const entries = Object.entries(res.metriche_dettagliate).filter(([k, v]) => {
            const keyLower = k.toLowerCase().trim();
            const valClean = String(v).replace(/[^\d.-]/g, '');
            if (calc.id === 1 && keyLower.includes('congestione')) {
              return false;
            }
            if (primaryLabelClean && keyLower === primaryLabelClean && valClean === primaryValClean) {
              return false;
            }
            return true;
          });

          if (entries.length === 0) return null;

          return (
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                Telemetria Sensori Chiave:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {entries.map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <span className="text-xs font-mono text-slate-400 truncate" title={k}>{k}:</span>
                    <span className="text-sm font-bold font-mono text-cyan-300 truncate mt-0.5">{String(v)}</span>
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
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border-2 border-indigo-500/60 shadow-2xl space-y-4 font-mono text-xs sm:text-sm">
        {/* Header del Pannello di Simulazione */}
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/30 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Simulazione Confronto (Prima / Dopo)</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/50">
                  Calcolo #{calc.id}
                </span>
              </div>
              <p className="text-xs text-indigo-300/80">
                Esecuzione in memoria isolata • Snapshot telemetria congelata
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseSimulation}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
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
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                PRIMA: Telemetria Congelata
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-700 text-slate-400">
                Sola Lettura
              </span>
            </div>
            <div className="space-y-2">
              {config.inputs.map(input => (
                <div key={input.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 text-xs">{input.label}:</span>
                  <span className="font-bold text-slate-200 text-sm">
                    {typeof simPrimaInputs[input.key] === 'boolean'
                      ? (simPrimaInputs[input.key] ? 'SÌ (Attivo)' : 'NO (Disattivo)')
                      : formatInputValue(simPrimaInputs[input.key])} {input.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Colonna DOPO: Modificabile dall'operatore */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-1.5">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                DOPO: Parametri di Simulazione
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold">
                Modificabile
              </span>
            </div>
            <div className="space-y-2">
              {config.inputs.map(input => (
                <div key={input.key} className="space-y-1">
                  <label className="text-xs text-slate-300 flex justify-between">
                    <span>{input.label}:</span>
                    {input.unit && <span className="text-slate-400">{input.unit}</span>}
                  </label>
                  {input.inputType === 'boolean' ? (
                    <select
                      value={simDopoInputs[input.key] ? 'true' : 'false'}
                      onChange={e => setSimDopoInputs(prev => ({ ...prev, [input.key]: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-indigo-100 font-mono text-sm focus:ring-1 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                    >
                      <option value="true">SÌ (Attivo / Conforme)</option>
                      <option value="false">NO (Disattivo / Anomalia)</option>
                    </select>
                  ) : input.inputType === 'select' && input.options ? (
                    <select
                      value={String(simDopoInputs[input.key] ?? input.options[0])}
                      onChange={e => setSimDopoInputs(prev => ({ ...prev, [input.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-indigo-100 font-mono text-sm focus:ring-1 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                    >
                      {input.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : input.inputType === 'text' ? (
                    <input
                      type="text"
                      value={simDopoInputs[input.key] ?? ''}
                      onChange={e => setSimDopoInputs(prev => ({ ...prev, [input.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-indigo-100 font-mono text-sm focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="number"
                      step={input.step || 'any'}
                      value={simDopoInputs[input.key] ?? ''}
                      onChange={e => {
                        const raw = e.target.value;
                        setSimDopoInputs(prev => ({ ...prev, [input.key]: raw === '' ? '' : Number(raw) }));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-indigo-100 font-mono text-sm focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                    />
                  )}
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
                    const pNum = typeof p === 'number' ? p : NaN;
                    const dNum = typeof d === 'number' ? d : (d === '' ? 0 : NaN);
                    const diff = Number.isFinite(pNum) && Number.isFinite(dNum) ? Number((dNum - pNum).toFixed(2)) : null;
                    const formatInVal = (v: any) => typeof v === 'boolean' ? (v ? 'SÌ' : 'NO') : formatInputValue(v === '' ? 0 : v);
                    return (
                      <tr key={input.key} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-300 font-semibold">{input.label}</td>
                        <td className="p-2 text-slate-400">{formatInVal(p)} {input.unit}</td>
                        <td className="p-2 text-indigo-300 font-bold">{formatInVal(d)} {input.unit}</td>
                        <td className="p-2 font-mono">
                          {diff !== null ? (
                            <span className={diff === 0 ? 'text-slate-400' : 'text-cyan-300'}>
                              {diff > 0 ? `+${diff}` : diff} {input.unit}
                            </span>
                          ) : (
                            <span className={p === d ? 'text-slate-400' : 'text-cyan-300'}>
                              {p === d ? 'Invariato (=)' : 'MODIFICATO'}
                            </span>
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

                    // Non trattare MAI stringhe binarie di qubit ("1111", "0101"), booleani o coordinate come numeri decimali!
                    const isQubitKey = output.key.includes('qubit') || output.key.includes('nash');
                    const isPureNumericOutput = !isQubitKey && (
                      typeof pVal === 'number' && typeof dVal === 'number'
                    );
                    const diff = isPureNumericOutput ? Number((Number(dVal) - Number(pVal)).toFixed(2)) : null;

                    const isAlarmBoolKey = output.key.includes('allarme') || output.key.includes('rischio') || output.key.includes('sagoma');
                    const formatOutCell = (val: any) => {
                      if (typeof val === 'boolean') {
                        if (output.key === 'integrita_verificata') return val ? 'VERIFICATA' : 'ANOMALIA';
                        return val ? 'ATTIVO' : 'DISATTIVO';
                      }
                      return formatInputValue(val);
                    };

                    let isBetter: boolean | null = null;
                    if (diff !== null && diff !== 0) {
                      if (output.betterDirection === 'higher') {
                        isBetter = diff > 0;
                      } else if (output.betterDirection === 'lower') {
                        isBetter = diff < 0;
                      }
                    } else if (typeof pVal === 'boolean' && typeof dVal === 'boolean') {
                      if (pVal !== dVal) {
                        isBetter = output.betterDirection === 'higher' ? dVal : !dVal;
                      }
                    } else if (typeof pVal === 'string' && typeof dVal === 'string' && pVal !== dVal) {
                      const dUp = dVal.toUpperCase();
                      const pUp = pVal.toUpperCase();
                      const goodMatch = (s: string) => s.includes('REGOLARE') || s.includes('APPROVATO') || s.includes('PARETO') || s.includes('CONFORME') || s.includes('SICURO') || s.includes('OTTIMALE') || s.includes('SIGILLATO');
                      const badMatch = (s: string) => s.includes('ALLARME') || s.includes('SCARTATO') || s.includes('CRITICO') || s.includes('ANOMAL') || s.includes('ECCEDENZA') || s.includes('SUB-OTTIMALE') || s.includes('ALLERTA');
                      if (goodMatch(dUp) && !goodMatch(pUp)) isBetter = true;
                      else if (badMatch(dUp) && !badMatch(pUp)) isBetter = false;
                      else if (!badMatch(dUp) && badMatch(pUp)) isBetter = true;
                    }

                    const deltaText = (() => {
                      if (diff !== null) {
                        const base = `${diff > 0 ? `+${diff}` : diff} ${output.unit || ''}`.trim();
                        if (diff === 0) return `${base} (Invariato =)`;
                        return `${base}${isBetter === true ? ' (Migliorato ✓)' : isBetter === false ? ' (Peggiorato ✗)' : ''}`;
                      }
                      if (typeof pVal === 'boolean' && typeof dVal === 'boolean') {
                        if (pVal === dVal) return 'Invariato (=)';
                        if (isAlarmBoolKey) return dVal ? 'Attivato (Peggiorato ✗)' : 'Risolto (Migliorato ✓)';
                        return `${dVal ? 'Verificato' : 'Non conforme'}${isBetter === true ? ' (Migliorato ✓)' : isBetter === false ? ' (Peggiorato ✗)' : ''}`;
                      }
                      if (isQubitKey) {
                        return pVal === dVal ? 'Stato invariato (=)' : `${String(pVal)} → ${String(dVal)}`;
                      }
                      if (String(pVal) === String(dVal)) {
                        return 'Invariato (=)';
                      }
                      return `${String(dVal)}${isBetter === true ? ' (Migliorato ✓)' : isBetter === false ? ' (Peggiorato ✗)' : ' (Modificato)'}`;
                    })();

                    return (
                      <tr key={output.key} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-200 font-semibold">{output.label}</td>
                        <td className="p-2 text-slate-400">
                          {formatOutCell(pVal)} {output.unit || ''}
                        </td>
                        <td className="p-2 text-white font-bold">
                          {formatOutCell(dVal)} {output.unit || ''}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            isBetter === true
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isBetter === false
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {deltaText}
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
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/40 shadow-xl flex flex-col gap-4 font-mono text-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shrink-0 shadow-sm shadow-cyan-500/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-base sm:text-lg">
                  Calcoli dello Stabilimento: {activeTenant.nome}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeTenant.azienda || 'Azienda'} #{activeTenant.numeroStabilimento || 1}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Mostrando esclusivamente i calcoli compatibili con i macchinari e i nodi fisici autorizzati per "{activeTenant.nome}" ({activeTenant.sito}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap pt-3 border-t border-cyan-500/20">
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
      {focusedCalcId === null && (
      <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar touch-pan-x flex-nowrap sm:flex-wrap font-mono">
        {DEPARTMENT_FILTERS.filter(dep => dep.id !== 'ALL').map((dep) => {
          const isSelected = selectedDepartment === dep.id;
          const pool = activeTenant ? plantSupportedCalcs : QUANTUM_CALCULATIONS;
          const countInDep = pool.filter(c => dep.calcIds.includes(c.id)).length;

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
              className={`shrink-0 sm:flex-1 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap min-h-[40px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
              title={dep.description}
            >
              <span>{dep.icon}</span>
              <span>{dep.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-xs font-bold ${
                isSelected ? 'bg-black/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {countInDep}
              </span>
            </button>
          );
        })}
      </div>
      )}

      <div className={displayMode === 'table-focus' ? "flex flex-col lg:flex-row gap-4 sm:gap-6 items-start" : ""}>
        {/* COLONNA SINISTRA: TABELLA DEI SOLI PULSANTI (solo in modalità table-focus e quando non isolato) */}
        {displayMode === 'table-focus' && focusedCalcId === null && (
          <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 font-mono shadow-xl sticky top-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <LayoutList className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-sm font-bold text-white uppercase tracking-wider truncate">
                  {DEPARTMENT_FILTERS.find(d => d.id === selectedDepartment && d.id !== 'ALL')?.label ||
                    (selectedCategory === 'ALL' ? 'Camion & Baie' : selectedCategory)}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                {tableCalculations.length} {tableCalculations.length === 1 ? 'Nodo' : 'Nodi'}
              </span>
            </div>

            {/* Tabella dei soli pulsanti */}
            <div className="flex flex-col gap-2 max-h-[calc(100vh-210px)] min-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {tableCalculations.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nessun calcolo inerente per questo filtro.
                </div>
              ) : (
                tableCalculations.map(c => {
                  const isSelected = selectedCalc.id === c.id;
                  const nodeReq = PLANT_NODE_REQUIREMENTS[c.id];
                  const hasResult = Boolean(results[c.id]);
                  const isExecuting = executingId === c.id;
                  const itemResult = results[c.id];
                  const itemStatus = itemResult ? evaluateCalculationStatus(c.id, itemResult, formInputs[c.id] || {}, c.subFunction).livelloAllarme : null;
                  const trafficLight = itemStatus === 'CRITICO' ? '🔴' : itemStatus === 'ATTENZIONE' ? '🟡' : itemResult ? '🟢' : '⚪';

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
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-900 border-cyan-400 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                      title={`Clicca per aprire il calcolo #${c.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                          isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                        }`}>
                          <span className="text-xs leading-none">{trafficLight}</span>
                          <span>#{c.id}</span>
                        </span>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {isExecuting && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" title="In esecuzione" />
                          )}
                          <span
                            className={`p-1 rounded font-bold flex items-center justify-center ${
                              c.entanglement === 'OBBLIGATORIO'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                            title={c.entanglement === 'OBBLIGATORIO' ? 'Più reparti' : 'Reparto singolo'}
                          >
                            {c.entanglement === 'OBBLIGATORIO' ? (
                              <Shuffle className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          {isSelected && <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </div>
                      </div>
                      <span className="text-sm font-bold leading-snug whitespace-normal break-words w-full">
                        {nodeReq?.nodeName ? nodeReq.nodeName : c.subFunction || c.technicalModule}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* AREA DEI CALCOLI: SE table-focus MOSTRA SOLO QUELLO SELEZIONATO INGRANDITO, ALTRIMENTI GRIGLIA */}
        <div id="enlarged-calc-view" className={displayMode === 'table-focus' ? "flex-1 min-w-0 w-full" : "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1"}>
          {(displayMode === 'table-focus' ? ((focusedCalcMeta || selectedCalc) ? [focusedCalcMeta || selectedCalc!] : []) : visibleCalculations).length === 0 ? (
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
            (displayMode === 'table-focus' ? ((focusedCalcMeta || selectedCalc) ? [focusedCalcMeta || selectedCalc!] : []) : visibleCalculations).map((calc) => {
              const result = results[calc.id];
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
                  className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-3 sm:space-y-4 transition-all ${
                    isEnlarged
                      ? 'border-cyan-500/50 shadow-2xl shadow-cyan-950/40 ring-1 ring-cyan-500/30 w-full'
                      : isSupported 
                      ? 'border-slate-800 hover:border-slate-700' 
                      : 'border-slate-800/60 opacity-85'
                  }`}
                >
                  {/* Riga superiore con il nome diretto del calcolo */}
                  {isEnlarged && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-between gap-2.5 font-mono">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Focus className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                        <span className="text-base sm:text-lg font-bold text-cyan-200 truncate">
                          [#{calc.id}] {calc.name}
                        </span>
                      </div>
                    </div>
                  )}
              {/* Header: Nodo Associato + Modulo, Sottofunzione, ?, Isola sulla stessa riga */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-mono">
                    {nodeReq && (
                      <div className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-mono flex items-center gap-2 border ${
                        isSupported
                          ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/80 shadow-xs'
                          : 'bg-slate-950/60 text-slate-500 border-slate-800'
                      }`}>
                        <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Nodo Associato: <strong className="text-white">{nodeReq.nodeName}</strong></span>
                      </div>
                    )}
                    {!isEnlarged && (
                      <span className="px-2.5 py-0.5 text-xs sm:text-sm font-mono font-bold rounded-md border bg-slate-800 text-cyan-300 border-slate-700 flex items-center gap-1 shadow-xs">
                        Calcolo #{calc.id}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs sm:text-sm font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                      {calc.technicalModule}
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-200 font-medium px-0.5">
                      {calc.subFunction}
                    </span>

                    {/* Pulsante Info ? giallo neon per aprire il popup completo */}
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setSelectedCpuCalc(calc)}
                        onMouseEnter={() => setHoveredCalcId(calc.id)}
                        onMouseLeave={() => setHoveredCalcId(null)}
                        className="px-2.5 py-0.5 rounded-md bg-yellow-400 hover:bg-yellow-300 border border-yellow-300 text-slate-950 transition-all cursor-pointer shadow-[0_0_12px_rgba(250,204,21,0.55)] group flex items-center gap-1 font-black text-xs sm:text-sm"
                        title="Clicca per vedere reparti, parametri accoppiati e specifiche del calcolo"
                      >
                        <span>Info</span>
                        <HelpCircle className="w-4 h-4 text-slate-950 stroke-[2.5] group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Tooltip popup al passaggio del mouse */}
                      {hoveredCalcId === calc.id && !selectedCpuCalc && (
                        <div className="absolute z-50 left-0 top-full mt-2 w-72 sm:w-80 p-2.5 rounded-xl bg-slate-950/95 border border-yellow-400/60 shadow-2xl backdrop-blur-md text-left font-mono text-[11px] pointer-events-none animate-in fade-in zoom-in-95 space-y-1.5">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                            <span className="font-bold text-cyan-400 flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              Calcolo #{calc.id}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-1 ${calc.isCrossCategory ? 'bg-yellow-400 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {calc.isCrossCategory ? 'Più reparti' : 'Reparto singolo'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9.5px] block font-semibold">
                              {calc.isCrossCategory ? 'Parametri accoppiati:' : 'Dettaglio:'}
                            </span>
                            <span className="text-slate-200 text-[10px] leading-snug">
                              {calc.crossCategoryDetails?.parametersOrData || calc.description}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-yellow-300 pt-1 border-t border-slate-800/80 font-bold">
                            Clicca per aprire il popup completo
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFocusedCalcId(focusedCalcId === calc.id ? null : calc.id)}
                    className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border shadow-xs ${
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
                        <span>Isola</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  {!isEnlarged && (
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 font-mono">
                      {calc.name}
                    </h3>
                  )}
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    {calc.description}
                  </p>
                </div>
              </div>

              {/* RISULTATO DIAGNOSTICO IMMEDIATO (Visibile subito senza premere calcolo) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Risultato & Stato Problematiche in Tempo Reale:
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Telemetria gateway / log attivi
                  </span>
                </div>
                {renderDiagnosticResultBox(calc, result)}
              </div>

              {/* Barra Azioni: Simula (Prima / Dopo) e File Python & Risultato */}
              {(SIMULATION_CONFIGS[calc.id] || canViewPythonCode) && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2.5 flex-wrap">
                  {SIMULATION_CONFIGS[calc.id] && (
                    <button
                      type="button"
                      onClick={() => handleOpenSimulation(calc)}
                      className="w-full sm:w-auto px-3.5 py-2 h-[40px] rounded-lg bg-gradient-to-r from-purple-900/90 to-indigo-900/90 hover:from-purple-800 hover:to-indigo-800 border border-purple-500/60 hover:border-purple-400 text-purple-200 hover:text-white text-xs sm:text-sm font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                      title={`Avvia simulazione di confronto Prima / Dopo per il Calcolo #${calc.id}`}
                    >
                      <Sliders className="w-4 h-4 text-purple-300" />
                      <span>Simula (Prima / Dopo)</span>
                    </button>
                  )}

                  {canViewPythonCode && (
                    <button
                      type="button"
                      onClick={() => setSelectedPythonCalc(calc)}
                      className="w-full sm:w-auto px-3.5 py-2 h-[40px] rounded-lg bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs sm:text-sm font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                      title={`Apri il file con codice Python e risultato per ${calc.name}`}
                    >
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <span>File Python & Risultato</span>
                    </button>
                  )}
                </div>
              )}
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
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-base font-bold text-white">
                      Calcolo #{selectedCpuCalc.id} — {selectedCpuCalc.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedCpuCalc.technicalModule}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedCpuCalc.subFunction}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCpuCalc(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Table / Specs (senza duplicati o frasi ripetute) */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Descrizione */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
                {selectedCpuCalc.description}
              </div>

              {/* Reparti & Parametri Accoppiati (Più reparti vs Reparto singolo) */}
              {selectedCpuCalc.isCrossCategory && selectedCpuCalc.crossCategoryDetails ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border border-yellow-400/40 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(250,204,21,0.35)]">
                      <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
                      Più reparti
                    </span>
                    {selectedCpuCalc.crossCategoryDetails.modules && (
                      <span className="px-2 py-0.5 rounded bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 font-bold text-xs">
                        {selectedCpuCalc.crossCategoryDetails.modules}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-yellow-400/20">
                    <span className="px-2.5 py-1 rounded bg-slate-950 text-cyan-300 border border-slate-700 font-bold text-xs">
                      {selectedCpuCalc.category}
                    </span>
                    <span className="text-yellow-300 font-black text-base px-0.5">⟷</span>
                    <span className="px-2.5 py-1 rounded bg-slate-950 text-yellow-300 border border-yellow-400/40 font-bold text-xs">
                      {selectedCpuCalc.crossCategoryDetails.crossedWith}
                    </span>
                  </div>

                  {selectedCpuCalc.crossCategoryDetails.parametersOrData && (
                    <div className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                      <span className="text-yellow-300 font-bold">Parametri accoppiati: </span>
                      <span>{selectedCpuCalc.crossCategoryDetails.parametersOrData}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Intreccia qubit e variabili tra più reparti tramite Gate CNOT quantistici.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Reparto singolo
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-700 font-semibold text-xs">
                      {selectedCpuCalc.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Elabora parametri interni alla propria macchina o isola senza dipendenze da altri reparti.
                  </p>
                </div>
              )}

              {/* Parametri Input & Hardware Target */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block mb-1">Parametri Input:</span>
                  <code className="text-cyan-300 text-xs leading-relaxed block">{selectedCpuCalc.inputDescription}</code>
                </div>
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-slate-400">Target Hardware di Esecuzione:</span>
                  <span className="text-slate-200 font-bold">{selectedCpuCalc.hardwareTarget}</span>
                </div>
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
          const raw = { ...(calc.defaultInputs || {}), ...(formInputs[calc.id] || {}) };
          const safeInputs: Record<string, any> = {};
          for (const [k, v] of Object.entries(raw)) {
            safeInputs[k] = parseFlexibleInput(v, k);
          }
          const targetTenantId = activeTenantIdRef.current;
          const res = await QuantumEngine.executeCalculation(calc.id, safeInputs);
          if (activeTenantIdRef.current === targetTenantId) {
            setResults(prev => ({ ...prev, [calc.id]: res }));
          }
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
