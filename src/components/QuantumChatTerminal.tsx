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
  ArrowRight
} from 'lucide-react';
import { ChatMessage, QuantumCalculationMeta } from '../types/quantum';
import { QuantumRouterService } from '../services/quantumRouter';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta, state?: string) => void;
  allowPlcWrite: boolean;
  activeTenantEndpoint: string;
}

const PRESET_SCENARIOS = [
  {
    label: "Calcolo [1]: Inbound Congestione",
    query: "Ho 12 camion in attesa nel piazzale con 45 minuti di ritardo e saturazione magazzino WMS all'88.5%"
  },
  {
    label: "Calcolo [2]: Rischio Fermo Linea",
    query: "Ritardo stimato del materiale di 75 minuti con 1 sola baia di scarico libera"
  },
  {
    label: "Calcolo [4]: Controllo Qualità Lotto",
    query: "Controllo lotto materie prime: umidità rilevata al 13.2% e spessore micro-bobina a 45.2"
  },
  {
    label: "Calcolo [6]: Bin Packing Pallet 3D",
    query: "Pallet in ingresso PALLET_BEMA_099 classe HIGH con 124 celle libere nello SmartStore"
  },
  {
    label: "Calcolo [14]: Vibrazioni Bema QFT",
    query: "Analisi braccio rotante Bema Silkworm: velocità a 48 giri al minuto con forti micro-vibrazioni"
  },
  {
    label: "Calcolo [15]: Tensione Film QSVM",
    query: "Allarme fasciatore Bema: tensione del film estensibile a 148.5 Newton a 12.4 m/s"
  },
  {
    label: "Calcolo [16]: Traffico Flotta AGV QAOA",
    query: "Traffico flotta LGV critico: 3 veicoli attivi con NODO_03_BLOCCATO nei corridoi"
  },
  {
    label: "Calcolo [17]: Bipartite Matching Batterie",
    query: "Assegna missioni urgenti 942 e 943: AGV_04 batteria 78% temp 42.5°C, AGV_11 92% 31°C"
  }
];

export const QuantumChatTerminal: React.FC<Props> = ({ 
  onOpenCircuit, 
  allowPlcWrite,
  activeTenantEndpoint 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-sys',
      sender: 'quantum-core',
      timestamp: new Date().toLocaleTimeString(),
      text: `Benvenuto nella console front-end del **Nucleo Computazionale Quantistico SM.I.LE80**.
Tutti i **17 Calcoli Quantistici CUDA-Q** sono pre-caricati e attivi nel core:
- Categoria 1 (Inbound): [1] QBM 🔒, [2] Monte Carlo 🔒, [3] Integer Prog. 🔓, [4] Walk Clustering 🔓, [5] Post-Quantum Hash 🔓
- Categoria 2 (Magazzino): [6] Bin Packing Twin 🔒, [7] Hopfield 🔓, [8] TSP Walk 🔓, [9] QGNN Batching 🔒
- Categoria 3 (Outbound): [10] VQE Knapsack 🔓, [11] Crypto e-CMR 🔓, [12] Game Theory 🔒, [13] K-Means Yard 🔒
- Categoria 4 (IoT & Macchine): [14] QFT Bema 🔓, [15] QSVM Film 🔓, [16] QAOA Rotte 🔒, [17] Bipartite Matching 🔒

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

    const userMsgId = 'usr-' + Date.now();
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
      const res = await QuantumRouterService.routeAndSolve(query);
      const executionTime = Math.round(performance.now() - startTime);

      const botMsg: ChatMessage = {
        id: 'qcore-' + Date.now(),
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
        execution_time_ms: executionTime
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
    <div className="flex flex-col h-[calc(100vh-130px)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              Quantum Kernel Router & Solver v2026.2
            </span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
            CUDA-Q 17 Kernels Ready
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Endpoint: <code className="text-cyan-300">{activeTenantEndpoint}</code></span>
        </div>
      </div>

      {/* Preset Quick Scenario Pills */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Scenari Rapidi:
          </span>
          {PRESET_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(scenario.query)}
              disabled={isProcessing}
              className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors whitespace-nowrap"
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 font-sans">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const calcMeta = msg.calcolo_id ? QUANTUM_CALCULATIONS.find(c => c.id === msg.calcolo_id) : null;
          const jsonString = msg.payload ? JSON.stringify(msg.payload, null, 2) : '';

          return (
            <div 
              key={msg.id} 
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
                  {/* User query or Bot explanation */}
                  <div className="whitespace-pre-wrap text-slate-200">
                    {msg.text}
                  </div>

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
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inserisci dati di fabbrica (es. '12 camion in attesa, 45 min ritardo, wms 88%') oppure 'Calcolo 14 48 rpm'..."
              className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
              disabled={isProcessing}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 hidden sm:inline-block">
              Invio ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <span>Risolvi</span>
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
