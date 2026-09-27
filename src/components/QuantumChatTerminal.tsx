import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Cpu, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  ShieldCheck, 
  Radio, 
  CornerDownLeft,
  Sparkles,
  Layers,
  ArrowRight,
  Bell,
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import { ChatMessage, QuantumCalculationMeta, FactoryTenant } from '../types/quantum';
import { QuantumRouterService } from '../services/quantumRouter';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { GuidedChatAssistant } from './GuidedChatAssistant';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta, state?: string) => void;
  allowPlcWrite: boolean;
  activeTenantEndpoint: string;
  userRole?: 'Operatore di Linea' | 'Amministratore';
  activeTenantName?: string;
  activeTenant?: FactoryTenant;
  anomaliesCount?: number;
  onNavigateToNotifications?: () => void;
  voiceQueryToExecute?: string | null;
  onVoiceQueryHandled?: () => void;
}

interface PresetScenario {
  id: number;
  label: string;
  name: string;
  subFunction: string;
  category: 'Inbound' | 'Magazzino' | 'Outbound' | 'IoT';
  categoryFull: string;
  entanglementSymbol: string;
  entanglement: 'OBBLIGATORIO' | 'FACOLTATIVO';
  query: string;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 1,
    label: "[1] Inbound",
    name: "Quantum Boltzmann Machines (QBM)",
    subFunction: "Inbound Scheduler",
    category: "Inbound",
    categoryFull: "1. Inbound & Materie Prime",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Ho 12 camion in attesa nel piazzale con 45 minuti di ritardo e saturazione magazzino WMS all'88.5%"
  },
  {
    id: 2,
    label: "[2] Rischio Fermo",
    name: "Quantum Monte Carlo Risk Analysis",
    subFunction: "Inbound Scheduler",
    category: "Inbound",
    categoryFull: "1. Inbound & Materie Prime",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Ritardo stimato del materiale di 75 minuti con 1 sola baia di scarico libera"
  },
  {
    id: 3,
    label: "[3] Integer Prog.",
    name: "Quantum Integer Programming",
    subFunction: "Inbound Scheduler",
    category: "Inbound",
    categoryFull: "1. Inbound & Materie Prime",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Schedulazione baie 24h: 8 ore di lavoro disponibili con 4 baie totali da ottimizzare"
  },
  {
    id: 4,
    label: "[4] Qualità Lotto",
    name: "Quantum Walk-based Clustering",
    subFunction: "Material Inventory & Quality",
    category: "Inbound",
    categoryFull: "1. Inbound & Materie Prime",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Controllo lotto materie prime: umidità rilevata al 13.2% e spessore micro-bobina a 45.2"
  },
  {
    id: 5,
    label: "[5] Post-Quantum Hash",
    name: "Post-Quantum Cryptographic Hashing",
    subFunction: "Material Inventory & Quality",
    category: "Inbound",
    categoryFull: "1. Inbound & Materie Prime",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Tracciabilità lotti blindata: verifica salt NIST e qualità stampa ISO per lotto BOBINA_BEMA_2026_A fornitore PLAST_REGGIO_01"
  },
  {
    id: 6,
    label: "[6] Bin Packing Twin",
    name: "Quantum Digital Twin Alignment & Bin Packing",
    subFunction: "Put-Away Logic",
    category: "Magazzino",
    categoryFull: "2. Magazzino & Stoccaggio",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Pallet in ingresso PALLET_BEMA_099 classe HIGH con 124 celle libere nello SmartStore"
  },
  {
    id: 7,
    label: "[7] Hopfield Scaffali",
    name: "Quantum Hopfield Networks",
    subFunction: "Put-Away Logic",
    category: "Magazzino",
    categoryFull: "2. Magazzino & Stoccaggio",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Controllo integrità scaffali e shuttle: micro-inclinazione 0.4 gradi con carico pattini integri e pressione 14.1 bar"
  },
  {
    id: 8,
    label: "[8] TSP Walk Picking",
    name: "Quantum TSP Walk Navigation",
    subFunction: "Picking Optimization",
    category: "Magazzino",
    categoryFull: "2. Magazzino & Stoccaggio",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Missione picking e percorso navetta: sequenza su 6 nodi corsie SmartStore con saturazione corsia 72%"
  },
  {
    id: 9,
    label: "[9] QGNN Batching",
    name: "Quantum Graph Neural Network (QGNN)",
    subFunction: "Picking Optimization",
    category: "Magazzino",
    categoryFull: "2. Magazzino & Stoccaggio",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Ottimizzazione raggruppamento ordini e batching navette WMS per 14 missioni simultanee"
  },
  {
    id: 10,
    label: "[10] VQE Bilanciamento",
    name: "Variational Quantum Eigensolver (VQE) Knapsack",
    subFunction: "Outbound Dispatch",
    category: "Outbound",
    categoryFull: "3. Outbound & Spedizioni",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Bilanciamento carico camion e carico assi: pianale con 33 pallet per un totale di 24800 kg e tolleranza baricentro 1.8%"
  },
  {
    id: 11,
    label: "[11] Crypto e-CMR",
    name: "Post-Quantum Smart Contracts & e-CMR",
    subFunction: "Outbound Dispatch",
    category: "Outbound",
    categoryFull: "3. Outbound & Spedizioni",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Firma digitale e-CMR e transito doganale con certificato crittografico quantum-safe per trasporto merci"
  },
  {
    id: 12,
    label: "[12] Game Theory Baie",
    name: "Quantum Game Theory Bay Auction",
    subFunction: "Yard & Shipping",
    category: "Outbound",
    categoryFull: "3. Outbound & Spedizioni",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Teoria dei giochi per contesa baie di carico tra 5 trasportatori con ritardo medio 25 minuti"
  },
  {
    id: 13,
    label: "[13] K-Means Yard",
    name: "Quantum K-Means Yard Management",
    subFunction: "Yard & Shipping",
    category: "Outbound",
    categoryFull: "3. Outbound & Spedizioni",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Clustering piazzale e posizionamento rimorchi per 8 camion in attesa nell'area buffer est"
  },
  {
    id: 14,
    label: "[14] Bema QFT",
    name: "Quantum Fourier Transform (QFT) Vibration Analysis",
    subFunction: "Bema Silkworm Monitoring",
    category: "IoT",
    categoryFull: "4. IoT & Controllo Macchine",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Analisi braccio rotante Bema Silkworm: velocità a 48 giri al minuto con forti micro-vibrazioni"
  },
  {
    id: 15,
    label: "[15] Tensione Film",
    name: "Quantum Support Vector Machine (QSVM)",
    subFunction: "Bema Silkworm Monitoring",
    category: "IoT",
    categoryFull: "4. IoT & Controllo Macchine",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Allarme fasciatore Bema: tensione del film estensibile a 148.5 Newton a 12.4 m/s"
  },
  {
    id: 16,
    label: "[16] Flotta AGV",
    name: "Quantum Approximate Optimization (QAOA)",
    subFunction: "LGV Fleet Management",
    category: "IoT",
    categoryFull: "4. IoT & Controllo Macchine",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Traffico flotta LGV critico: 3 veicoli attivi con NODO_03_BLOCCATO nei corridoi"
  },
  {
    id: 17,
    label: "[17] Batterie AGV",
    name: "Quantum Bipartite Matching",
    subFunction: "LGV Fleet Management",
    category: "IoT",
    categoryFull: "4. IoT & Controllo Macchine",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Assegna missioni urgenti 942 e 943: AGV_04 batteria 78% temp 42.5°C, AGV_11 92% 31°C"
  },
  {
    id: 18,
    label: "[18] Robot VQE",
    name: "Robot Joint Space VQE",
    subFunction: "Robotic Island Control",
    category: "IoT",
    categoryFull: "4. IoT & Controllo Macchine",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Robot pallettizzatore isola 1: pressione vuoto a -0.62 bar e sovraccarico joint J2 a 410 Nm"
  },
  {
    id: 19,
    label: "[19] Microgrid",
    name: "Microgrid Knapsack Optimizer",
    subFunction: "Fast Charge Stations",
    category: "IoT",
    categoryFull: "4. IoT & Controllo Macchine",
    entanglementSymbol: "🔒",
    entanglement: "OBBLIGATORIO",
    query: "Picco potenza ricarica flotta a 125 kW con piastra a terra a 46.5°C"
  },
  {
    id: 20,
    label: "[20] Woodpecker",
    name: "Woodpecker Quality QSVM",
    subFunction: "Woodpecker Pallet Quality",
    category: "Inbound",
    categoryFull: "1. Inbound & Materie Prime",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Ispezione pallet Woodpecker: forza pattini a 2300 N, umidità 19.2% e chiodo sporgente"
  },
  {
    id: 21,
    label: "[21] Raptor ZKP",
    name: "Raptor Zero-Knowledge Proof (ZKP)",
    subFunction: "Anti-Counterfeiting Validation",
    category: "Outbound",
    categoryFull: "3. Outbound & Spedizioni",
    entanglementSymbol: "🔓",
    entanglement: "FACOLTATIVO",
    query: "Verifica anticontraffazione SSCC 080332190000458129 qualità ottica CLASSE_A"
  }
];

const FormattedChatMessage: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = (keyIdx: number) => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul key={`ul-${keyIdx}`} className="space-y-1.5 my-2.5 pl-1">
          {currentBullets.map((bullet, bIdx) => (
            <li key={bIdx} className="flex items-start gap-2.5 text-justify [text-align-last:left] text-[13.5px] leading-relaxed text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0 shadow-sm shadow-cyan-400/50" />
              <span className="flex-1">{parseInlineMarkup(bullet)}</span>
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  const parseInlineMarkup = (rawText: string) => {
    const parts = rawText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white tracking-tight">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900/90 text-amber-300 font-mono text-[11.5px] border border-slate-700/60 font-semibold shadow-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets(idx);
      elements.push(<div key={`sp-${idx}`} className="h-3 sm:h-3.5" />);
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      currentBullets.push(trimmed.replace(/^[-•*]\s+/, ''));
    } else {
      flushBullets(idx);
      elements.push(
        <p key={`p-${idx}`} className="text-left text-[13.5px] sm:text-[14px] leading-relaxed sm:leading-loose tracking-normal text-slate-200 font-sans selection:bg-cyan-500/30 mb-2.5">
          {parseInlineMarkup(line)}
        </p>
      );
    }
  });

  flushBullets(lines.length);

  return (
    <div className={`space-y-2.5 font-sans ${isUser ? 'text-cyan-50' : 'text-slate-100'} antialiased`}>
      {elements}
    </div>
  );
};

export const QuantumChatTerminal: React.FC<Props> = ({ 
  onOpenCircuit, 
  allowPlcWrite,
  activeTenantEndpoint,
  userRole = 'Operatore di Linea',
  activeTenantName,
  activeTenant,
  anomaliesCount = 0,
  onNavigateToNotifications,
  voiceQueryToExecute,
  onVoiceQueryHandled
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-sys',
      sender: 'quantum-core',
      timestamp: new Date().toLocaleTimeString(),
      text: `Benvenuto nella console front-end del **Nucleo Computazionale Quantistico SM.I.LE80**.
Tutti i **21 Calcoli Quantistici CUDA-Q** sono pre-caricati e attivi nel core:
- Categoria 1 (Inbound): [1] QBM 🔒, [2] Monte Carlo 🔒, [3] Integer Prog. 🔓, [4] Walk Clustering 🔓, [5] Post-Quantum Hash 🔓, [20] Woodpecker QSVM 🔓
- Categoria 2 (Magazzino): [6] Bin Packing Twin 🔒, [7] Hopfield 🔓, [8] TSP Walk 🔓, [9] QGNN Batching 🔒
- Categoria 3 (Outbound): [10] VQE Knapsack 🔓, [11] Crypto e-CMR 🔓, [12] Game Theory 🔒, [13] K-Means Yard 🔒, [21] Raptor ZKP 🔓
- Categoria 4 (IoT & Controllo Macchine): [14] QFT Bema 🔓, [15] QSVM Film 🔓, [16] QAOA Rotte 🔒, [17] Bipartite Matching 🔒, [18] Robot VQE 🔒, [19] Microgrid Knapsack 🔒

Descrivi qualsiasi situazione o fornisci i dati della fabbrica: il sistema identificherà la sotto-funzione, simulerà il circuito quantistico con Entanglement Obbligatorio (🔒) o Facoltativo (🔓) e restituirà il payload JSON con l'azione immediata.`
    }
  ]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dispatchedPlcId, setDispatchedPlcId] = useState<string | null>(null);
  const [isScenariOpen, setIsScenariOpen] = useState(false);
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsScenariOpen(false);
      }
    };
    if (isScenariOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isScenariOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScenariOpen) {
        setIsScenariOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScenariOpen]);

  const filteredScenarios = PRESET_SCENARIOS.filter(s => {
    const matchesCategory = selectedCategory === 'Tutti' || s.category.toLowerCase() === selectedCategory.toLowerCase();
    const queryTerm = scenarioSearch.trim().toLowerCase();
    if (!queryTerm) return matchesCategory;
    const matchesSearch = 
      s.label.toLowerCase().includes(queryTerm) ||
      s.name.toLowerCase().includes(queryTerm) ||
      s.subFunction.toLowerCase().includes(queryTerm) ||
      s.query.toLowerCase().includes(queryTerm) ||
      String(s.id) === queryTerm ||
      s.label.replace(/[^0-9]/g, '') === queryTerm;
    return matchesCategory && matchesSearch;
  });

  // Safely scroll ONLY the messages container itself, never the window or document
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length, isProcessing]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    const userMsgId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsProcessing(true);

    const startTime = performance.now();

    try {
      // Simulate GPU quantum sampling latency (300-600ms)
      await new Promise(r => setTimeout(r, 450));
      const res = await QuantumRouterService.routeAndSolve(query, activeTenant);
      const executionTime = Math.round(performance.now() - startTime);

      const botMsg: ChatMessage = {
        id: `qcore-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        sender: 'quantum-core',
        timestamp: new Date().toLocaleTimeString(),
        text: res.introduzione,
        calcolo_id: res.calcolo_id,
        sotto_funzione: res.sotto_funzione,
        entanglement: res.entanglement,
        entanglementSymbol: res.entanglementSymbol,
        payload: res.risultato,
        azione_immediata: res.azione_immediata,
        livello_allarme: res.livello_allarme,
        execution_time_ms: res.tipoRisposta === 'CALCOLO_ESEGUITO' ? executionTime : undefined,
        suggerimenti: res.suggerimenti,
        tipoRisposta: res.tipoRisposta,
        opzioniScelta: res.opzioniScelta,
        parametriMemorizzati: res.parametriMemorizzati,
        parametriTrasferiti: res.parametriTrasferiti
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'quantum-core',
        timestamp: new Date().toLocaleTimeString(),
        text: `[ERRORE ROUTER QUANTISTICO]: Impossibile risolvere il circuito per la richiesta specificata: ${err.message}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const dispatchToPlc = (msgId: string, payload: any) => {
    setDispatchedPlcId(msgId);
    setTimeout(() => setDispatchedPlcId(null), 3000);
  };

  // Handle voice query execution dispatched hands-free from GeminiLiveVoice
  useEffect(() => {
    if (voiceQueryToExecute && voiceQueryToExecute.trim()) {
      handleSend(voiceQueryToExecute);
      onVoiceQueryHandled?.();
    }
  }, [voiceQueryToExecute]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase truncate">
              Quantum Kernel Router <span className="hidden xs:inline">& Solver</span>
            </span>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700 font-semibold">
            CUDA-Q 21
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
          {anomaliesCount > 0 && onNavigateToNotifications && (
            <button
              type="button"
              onClick={onNavigateToNotifications}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[9px] sm:text-[10px] font-mono font-bold transition-colors cursor-pointer animate-pulse shrink-0"
              title="Visualizza le anomalie fuori linea riscontrate dal download automatico"
            >
              <Bell className="w-3 h-3 text-rose-400" />
              <span>{anomaliesCount} <span className="hidden xs:inline">Fuori Linea</span></span>
            </button>
          )}

          {activeTenant && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: activeTenant.logoColor || '#06b6d4' }}
              />
              <span className="text-slate-400">Plant:</span>
              <span className="text-cyan-300 font-bold">{activeTenant.nome}</span>
              {activeTenant.plantTopology && (
                <span className="text-[9px] text-slate-400">
                  [{activeTenant.plantTopology.macchinari.length} Macchine, QPU {activeTenant.plantTopology.qubitCapacity}Q]
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Gateway:</span> <code className="text-cyan-300 text-[9px] sm:text-[10px]">{activeTenantEndpoint}</code>
          </div>
        </div>
      </div>

      {/* Scenari Dropdown Toolbar */}
      <div className="px-2.5 sm:px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between shrink-0 relative z-30">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsScenariOpen(prev => !prev)}
            disabled={isProcessing}
            aria-expanded={isScenariOpen}
            aria-haspopup="true"
            className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-2 select-none min-h-[32px] ${
              isScenariOpen
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                : 'bg-slate-800/90 hover:bg-cyan-950/60 hover:text-cyan-200 hover:border-cyan-500/50 text-slate-200 border-slate-700/80'
            }`}
            title="Clicca per aprire il menù a tendina con i 21 scenari e calcoli quantistici preconfigurati"
          >
            <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isScenariOpen ? 'animate-pulse' : ''}`} />
            <span>Scenari</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60">
              21 Calcoli
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isScenariOpen ? 'rotate-180 text-cyan-300' : ''}`} />
          </button>

          {/* Menù a Tendina (Dropdown) */}
          {isScenariOpen && (
            <div className="absolute top-full left-0 mt-2 w-[340px] xs:w-[420px] sm:w-[540px] md:w-[620px] max-w-[94vw] bg-slate-950/95 border border-slate-700/90 rounded-xl shadow-2xl shadow-black/90 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
              {/* Dropdown Header */}
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      Scenari & Calcoli CUDA-Q
                      <span className="text-[10px] font-normal text-cyan-400">({filteredScenarios.length} di 21)</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Seleziona uno scenario per avviarlo nel terminale</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScenariOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Chiudi menù"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 space-y-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={scenarioSearch}
                    onChange={(e) => setScenarioSearch(e.target.value)}
                    placeholder="Cerca calcolo, ID, macchina o parametro..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                    autoFocus
                  />
                  {scenarioSearch && (
                    <button
                      type="button"
                      onClick={() => setScenarioSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Category Pills inside Dropdown */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar touch-pan-x">
                  {(['Tutti', 'Inbound', 'Magazzino', 'Outbound', 'IoT'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scenarios List */}
              <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto p-2 space-y-1.5 font-sans">
                {filteredScenarios.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-mono">
                    Nessun calcolo trovato per "{scenarioSearch}".
                  </div>
                ) : (
                  filteredScenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => {
                        setIsScenariOpen(false);
                        handleSend(scenario.query);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 shrink-0">
                            [{scenario.id}]
                          </span>
                          <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-200 truncate">
                            {scenario.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {scenario.subFunction}
                          </span>
                          <span 
                            className="text-[10px] font-mono" 
                            title={scenario.entanglement === 'OBBLIGATORIO' ? 'Entanglement Obbligatorio 🔒' : 'Entanglement Facoltativo 🔓'}
                          >
                            {scenario.entanglementSymbol}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-300 line-clamp-2 italic font-mono leading-relaxed pl-1 border-l-2 border-slate-800 group-hover:border-cyan-500/50">
                        "{scenario.query}"
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-semibold">🔒 Chiuso: Entanglement Obbligatorio (CNOT, dati incrociati)</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300">🔓 Aperto: Calcolo Locale / Indipendente</span>
                </div>
                <span className="text-cyan-400 font-bold shrink-0">Clicca per simulare</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side of bar: sleek informational notice */}
        <div className="text-[10px] font-mono text-slate-400 hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Menu rapido per i 21 algoritmi SM.I.LE80</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-5 sm:space-y-6 font-sans"
      >
        {/* Interactive Guided Assistant & Parameter Form */}
        <GuidedChatAssistant
          onSelectCalculationAndInputs={(query) => handleSend(query)}
          onOpenCircuit={onOpenCircuit}
          userRole={userRole}
          activeTenant={activeTenant}
        />

        {messages.map((msg, mIdx) => {
          const isUser = msg.sender === 'user';
          const calcMeta = msg.calcolo_id ? QUANTUM_CALCULATIONS.find(c => c.id === msg.calcolo_id) : null;
          const jsonString = msg.payload ? JSON.stringify(msg.payload, null, 2) : '';

          return (
            <div 
              key={`${msg.id || 'msg'}-${mIdx}`} 
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
            >
              <div className={`max-w-5xl sm:max-w-[96%] w-full rounded-2xl p-4 sm:p-6 ${
                isUser 
                  ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-700/50 text-slate-100 shadow-md ml-auto' 
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 shadow-xl'
              }`}>
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
                  <div className="flex items-center space-x-2">
                    {isUser ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        OPERATORE
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Cpu className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-bold font-mono text-purple-300">
                          NUCLEO QUANTISTICO CUDA-Q
                        </span>
                        {msg.calcolo_id && (
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1 border ${
                            msg.entanglement === 'OBBLIGATORIO' 
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {msg.entanglementSymbol} Calcolo [{msg.calcolo_id}]
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    {msg.execution_time_ms && (
                      <span className="text-cyan-400/90 font-medium">
                        QPU Sim: {msg.execution_time_ms}ms
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-4 text-sm leading-relaxed">
                  {/* Parameter Transfer Notification */}
                  {msg.parametriTrasferiti && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>Parametri concordati in chat trasferiti con successo al calcolo quantistico!</span>
                    </div>
                  )}

                  {/* User query or Bot explanation with elegant justified typography */}
                  <FormattedChatMessage text={msg.text || ''} isUser={isUser} />

                  {/* Interactive Decision Assistance Cards */}
                  {msg.opzioniScelta && msg.opzioniScelta.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Calcoli Consigliati per Sbloccare l'Operazione:
                        </span>
                        {msg.parametriMemorizzati && Object.keys(msg.parametriMemorizzati).length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {Object.keys(msg.parametriMemorizzati).length} dati salvati in memoria
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.opzioniScelta.map((opt, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between gap-2.5 shadow-sm"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold font-mono text-cyan-300">
                                  {opt.titolo}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                                  #{opt.calcolo_id}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug">
                                {opt.descrizione}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSend(opt.azionePrompt)}
                              disabled={isProcessing}
                              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-cyan-950/80 hover:bg-cyan-800/90 text-cyan-200 hover:text-white border border-cyan-700/60 hover:border-cyan-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Esegui con dati chat</span>
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestion pills if provided by the quantum router */}
                  {msg.suggerimenti && msg.suggerimenti.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold block mb-2">
                        Suggerimenti di esecuzione (clicca per inviare al sistema):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggerimenti.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSend(sug)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-cyan-950/50 hover:bg-cyan-900/80 text-cyan-200 hover:text-white border border-cyan-700/60 transition-all text-left shadow-sm hover:border-cyan-500 cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="text-cyan-400">➔</span> {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If Bot returned a structured calculation */}
                  {msg.payload && (
                    <div className="space-y-3 pt-2">
                      {/* JSON Payload box */}
                      <div className="relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 text-xs font-mono text-slate-400 border-b border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            PAYLOAD JSON RISULTATO
                          </span>
                          <button
                            onClick={() => copyToClipboard(jsonString, msg.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-[11px] text-emerald-400">Copiato</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[11px]">Copia JSON</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-tight selection:bg-cyan-500/20">
                          {jsonString}
                        </pre>
                      </div>

                      {/* Immediate Industrial Action Card */}
                      {msg.azione_immediata && (
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          msg.livello_allarme === 'CRITICO'
                            ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                            : msg.livello_allarme === 'ATTENZIONE'
                            ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                            : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-950/60 mt-0.5">
                              {msg.livello_allarme === 'CRITICO' ? (
                                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                              ) : msg.livello_allarme === 'ATTENZIONE' ? (
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                              ) : (
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-mono font-bold uppercase tracking-wider block">
                                Azione Industriale Immediata SM.I.LE80
                              </span>
                              <p className="font-semibold text-sm mt-0.5">
                                {msg.azione_immediata}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {calcMeta && (
                              <button
                                onClick={() => onOpenCircuit(calcMeta, msg.payload?.stato_qubit_dominante || msg.payload?.stato_qubit_rilevato || msg.payload?.stato_qubit_ottimale || msg.payload?.stato_qubit_calcolato || msg.payload?.stato_qubit_percorso || msg.payload?.stato_qubit_frequenza)}
                                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                              >
                                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                Circuito
                              </button>
                            )}

                            <button
                              onClick={() => dispatchToPlc(msg.id, msg.payload)}
                              disabled={dispatchedPlcId === msg.id}
                              className={`px-3 py-1.5 text-xs font-mono rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                                allowPlcWrite
                                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-300'
                              }`}
                              title={allowPlcWrite ? 'Invia correzione direttamente ai PLC' : 'Modalità Sicura: scrittura hardware bloccata'}
                            >
                              {dispatchedPlcId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Inviato!</span>
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span>{allowPlcWrite ? 'Dispiega su PLC' : 'Simula Invio PLC'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 text-purple-300 font-mono text-xs flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              <span>Simulazione circuito CUDA-Q e campionamento stocastico 1000 iterazioni...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-3 sm:px-4 border-t border-slate-800 bg-slate-950 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descrivi la situazione o inserisci dati (es. 'orario', 'bema 52 rpm')..."
              className="w-full pl-3 pr-10 py-2.5 sm:py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans min-h-[42px]"
              disabled={isProcessing}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hidden sm:inline-block">
              Invio ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0 min-h-[42px]"
          >
            <span>Risolvi</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
