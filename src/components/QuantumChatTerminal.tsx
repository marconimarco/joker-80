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
  Bell
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
}

const PRESET_SCENARIOS = [
  {
    label: "[1] Inbound",
    query: "Ho 12 camion in attesa nel piazzale con 45 minuti di ritardo e saturazione magazzino WMS all'88.5%"
  },
  {
    label: "[2] Rischio Fermo",
    query: "Ritardo stimato del materiale di 75 minuti con 1 sola baia di scarico libera"
  },
  {
    label: "[4] Qualità Lotto",
    query: "Controllo lotto materie prime: umidità rilevata al 13.2% e spessore micro-bobina a 45.2"
  },
  {
    label: "[6] Bin Packing",
    query: "Pallet in ingresso PALLET_BEMA_099 classe HIGH con 124 celle libere nello SmartStore"
  },
  {
    label: "[14] Bema QFT",
    query: "Analisi braccio rotante Bema Silkworm: velocità a 48 giri al minuto con forti micro-vibrazioni"
  },
  {
    label: "[15] Tensione Film",
    query: "Allarme fasciatore Bema: tensione del film estensibile a 148.5 Newton a 12.4 m/s"
  },
  {
    label: "[16] Flotta AGV",
    query: "Traffico flotta LGV critico: 3 veicoli attivi con NODO_03_BLOCCATO nei corridoi"
  },
  {
    label: "[17] Batterie AGV",
    query: "Assegna missioni urgenti 942 e 943: AGV_04 batteria 78% temp 42.5°C, AGV_11 92% 31°C"
  },
  {
    label: "[18] Robot VQE",
    query: "Robot pallettizzatore isola 1: pressione vuoto a -0.62 bar e sovraccarico joint J2 a 410 Nm"
  },
  {
    label: "[19] Microgrid",
    query: "Picco potenza ricarica flotta a 125 kW con piastra a terra a 46.5°C"
  },
  {
    label: "[20] Woodpecker",
    query: "Ispezione pallet Woodpecker: forza pattini a 2300 N, umidità 19.2% e chiodo sporgente"
  },
  {
    label: "[21] Raptor ZKP",
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
      elements.push(<div key={`sp-${idx}`} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      currentBullets.push(trimmed.replace(/^[-•*]\s+/, ''));
    } else {
      flushBullets(idx);
      elements.push(
        <p key={`p-${idx}`} className="text-justify [text-align-last:left] text-[13.5px] leading-relaxed tracking-normal text-slate-200 font-sans selection:bg-cyan-500/30">
          {parseInlineMarkup(line)}
        </p>
      );
    }
  });

  flushBullets(lines.length);

  return (
    <div className={`space-y-1 font-sans ${isUser ? 'text-cyan-50' : 'text-slate-100'} antialiased`}>
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
  onNavigateToNotifications
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

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

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
              Quantum Kernel Router & Solver v2026.2
            </span>
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700 font-semibold">
            CUDA-Q 21 Kernels
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
          {anomaliesCount > 0 && onNavigateToNotifications && (
            <button
              onClick={onNavigateToNotifications}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold transition-colors cursor-pointer animate-pulse"
              title="Visualizza le anomalie fuori linea riscontrate dal download automatico"
            >
              <Bell className="w-3 h-3 text-rose-400" />
              <span>{anomaliesCount} Calcoli Fuori Linea</span>
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
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">Gateway:</span> <code className="text-cyan-300">{activeTenantEndpoint}</code>
          </div>
        </div>
      </div>

      {/* Preset Quick Scenario Pills */}
      <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center gap-1.5 shrink-0 overflow-hidden">
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 font-semibold mr-1 shrink-0">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Scenari Rapidi:
        </span>
        {PRESET_SCENARIOS.map((scenario, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(scenario.query)}
            disabled={isProcessing}
            className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-slate-800/80 hover:bg-cyan-950/60 hover:text-cyan-200 hover:border-cyan-500/40 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
            title={scenario.query}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-4 font-sans">
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
              <div className={`max-w-3xl w-full rounded-2xl p-4 sm:p-5 ${
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
      <div className="p-2.5 sm:px-4 border-t border-slate-800 bg-slate-950 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descrivi la situazione o inserisci dati (es. 'orario', 'fasciatore bema', oppure '4 baie e 8 ore', '52 rpm')..."
              className="w-full pl-3.5 pr-12 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
              disabled={isProcessing}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hidden sm:inline-block">
              Invio ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>Risolvi</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
