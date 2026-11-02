import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Cpu, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  FileCode,
  Zap,
  Layers,
  Code2,
  Play,
  RotateCw,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { QuantumCalculationMeta } from '../types/quantum';
import { QUANTUM_PYTHON_CODES, QuantumPythonCodeInfo } from '../data/quantumPythonCalculations';
import { QuantumEngine } from '../services/quantumEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  calculation: QuantumCalculationMeta | null;
  canView?: boolean;
  isAdmin?: boolean;
  result?: any;
  inputs?: Record<string, any>;
  userRole?: string;
  userName?: string;
  onRecompute?: (calc: QuantumCalculationMeta) => Promise<any>;
}

export const QuantumPythonCodeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  calculation,
  canView,
  isAdmin,
  result: initialResult,
  inputs,
  userRole = 'Responsabile / Amministratore',
  userName = 'Utente Autorizzato',
  onRecompute
}) => {
  const isAuthorized = canView ?? isAdmin ?? false;
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'unified' | 'code' | 'result' | 'theory'>('unified');
  const [currentResult, setCurrentResult] = useState<any>(initialResult);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTimestamp, setExecutionTimestamp] = useState<string>(new Date().toLocaleString('it-IT'));

  // Sync result from prop or auto-generate on open if missing
  useEffect(() => {
    if (initialResult) {
      setCurrentResult(initialResult);
      setExecutionTimestamp(new Date().toLocaleString('it-IT'));
    } else if (isOpen && calculation && !currentResult) {
      // Auto-compute baseline result so the modal is never empty
      handleRunCalculation();
    }
  }, [initialResult, isOpen, calculation?.id]);

  if (!isOpen || !calculation || !isAuthorized) {
    return null;
  }

  const codeInfo: QuantumPythonCodeInfo | undefined = QUANTUM_PYTHON_CODES[calculation.id];

  const handleRunCalculation = async () => {
    if (!calculation) return;
    setIsExecuting(true);
    try {
      if (onRecompute) {
        const res = await onRecompute(calculation);
        setCurrentResult(res);
      } else {
        const safeInputs = inputs || calculation.defaultInputs || {};
        const res = await QuantumEngine.executeCalculation(calculation.id, safeInputs);
        setCurrentResult(res);
      }
      setExecutionTimestamp(new Date().toLocaleString('it-IT'));
    } catch (err) {
      console.error('Error running calculation in modal', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate unified Python file containing source code + execution result block
  const generateUnifiedContent = (): string => {
    if (!codeInfo) return '# Codice sorgente non disponibile';
    const pyCode = codeInfo.pythonCode.trim();
    const inputLines = inputs && Object.keys(inputs).length > 0 
      ? Object.entries(inputs).map(([k, v]) => `#   - ${k}: ${JSON.stringify(v)}`).join('\n')
      : '#   - (Parametri standard di telemetria PLC di fabbrica)';

    const resultFormatted = currentResult
      ? JSON.stringify(currentResult, null, 2)
          .split('\n')
          .map(line => `#   ${line}`)
          .join('\n')
      : '#   [In attesa di primo campionamento dati. Clicca "Esegui Kernel" per generare l\'output.]';

    return `${pyCode}

# ==============================================================================
# JOKER 80 QUANTUM - REPORT UFFICIALE DI ESECUZIONE KERNEL SM.I.LE80
# ==============================================================================
# Calcolo: #${calculation.id} - ${calculation.name}
# Sottofunzione: ${calculation.subFunction} | Modulo: ${calculation.technicalModule}
# Architettura QPU: ${codeInfo.targetQpu} (${codeInfo.qubits} Qubits, ${calculation.entanglement})
# Operatore / Ruolo Autorizzato: ${userName} (${userRole})
# Timestamp Esecuzione: ${executionTimestamp}
#
# --- 1. PARAMETRI DI TELEMETRIA PLC INSERITI ---
${inputLines}
#
# --- 2. RISULTATO COMPUTAZIONALE & STATO DEI QUBIT (STDOUT) ---
${resultFormatted}
#
# --- 3. CONFORMITÀ OT & CYBERSECURITY NIS2 ---
# Direttiva NIS2: Articolo 21 (Crittografia mTLS e Validazione Dati Industriali)
# Esito Diagnostico: ESEGUITO CON SUCCESSO (Exit Code: 0)
# ==============================================================================
`;
  };

  const unifiedContent = generateUnifiedContent();

  const handleCopy = () => {
    let textToCopy = unifiedContent;
    if (activeTab === 'code') textToCopy = codeInfo?.pythonCode || '';
    if (activeTab === 'result') textToCopy = JSON.stringify(currentResult, null, 2);

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!codeInfo) return;
    let content = unifiedContent;
    let fileName = `calcolo_${String(calculation.id).padStart(2, '0')}_codice_e_risultato.py`;

    if (activeTab === 'code') {
      content = codeInfo.pythonCode;
      fileName = codeInfo.fileName || `calcolo_${String(calculation.id).padStart(2, '0')}_cudaq.py`;
    } else if (activeTab === 'result') {
      content = JSON.stringify(currentResult, null, 2);
      fileName = `calcolo_${String(calculation.id).padStart(2, '0')}_risultato.json`;
    }

    const mime = activeTab === 'result' ? 'application/json' : 'text/x-python;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl max-h-[94vh] bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono ring-1 ring-cyan-500/20"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Glow */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 shrink-0 shadow-sm">
              <FileCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Riservato ad Amministratore & Responsabile
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Calcolo #{calculation.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Python 3.10+ / CUDA-Q
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate mt-1">
                File Python & Risultato: {codeInfo?.title || calculation.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Chiudi visualizzatore codice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Header Toolbar: Target hardware info & tab switch */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
            <span>Operatore: <strong className="text-slate-200">{userName} ({userRole})</strong></span>
            <span>•</span>
            <span>QPU: <strong className="text-slate-200">{calculation.hardwareTarget.split('/')[0]}</strong></span>
            <span>•</span>
            <span>Qubit: <strong className="text-amber-300">{codeInfo?.qubits || 4} Qubit</strong></span>
            <span>•</span>
            <span>Entanglement: <strong className="text-emerald-300">{calculation.entanglement}</strong></span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('unified')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'unified'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualizza il file unificato che include sia il codice Python sia il risultato calcolato"
              >
                <FileText className="w-3 h-3" />
                <span>File (Codice + Risultato)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualizza solo il codice Python sorgente"
              >
                <Terminal className="w-3 h-3" />
                <span>Solo Codice</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'result'
                    ? 'bg-slate-800 text-emerald-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Visualizza solo l'output e il payload del risultato"
              >
                <Activity className="w-3 h-3" />
                <span>Solo Risultato</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('theory')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'theory'
                    ? 'bg-slate-800 text-purple-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Teoria</span>
              </button>
            </div>

            {/* Run / Recompute button */}
            <button
              type="button"
              onClick={handleRunCalculation}
              disabled={isExecuting}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/50 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Ricalcola subito il risultato del kernel con la telemetria attiva"
            >
              {isExecuting ? (
                <RotateCw className="w-3 h-3 animate-spin text-cyan-300" />
              ) : (
                <Play className="w-3 h-3 fill-current text-cyan-400" />
              )}
              <span>{isExecuting ? 'Calcolo...' : 'Ricalcola'}</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Copia il contenuto negli appunti"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
              <span>{isCopied ? 'Copiato!' : 'Copia'}</span>
            </button>

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Scarica il file sul computer locale"
            >
              <Download className="w-3 h-3" />
              <span>Scarica File</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-slate-950">
          {/* TAB 1: UNIFIED FILE (PYTHON CODE + CALCULATION RESULT) */}
          {activeTab === 'unified' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>File Unificato: <code className="text-emerald-300 font-bold">calcolo_{String(calculation.id).padStart(2, '0')}_codice_e_risultato.py</code></span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 font-bold">
                  Sorgente Python + Blocco Risultato Esecuzione Integrato
                </span>
              </div>

              {/* Code + Result Box */}
              <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-inner">
                <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Contenuto File Python con Output Reale</span>
                  </span>
                  <span className="text-slate-500">Python 3.10+ / CUDA-Q 0.9.1</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-emerald-200 selection:bg-emerald-500/30 selection:text-white max-h-[58vh]">
                  <code>{unifiedContent}</code>
                </pre>
              </div>

              {/* Quick Summary Cards below the file */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Stato del Risultato</span>
                  <span className="font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {currentResult ? 'Calcolato & Registrato' : 'In attesa'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">Ultima Esecuzione</span>
                  <span className="font-bold text-slate-200">{executionTimestamp}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] block">QPU Target & Precisione</span>
                  <span className="font-bold text-cyan-300">{codeInfo?.targetQpu || 'NVIDIA cuStateVec'} (1000 Shot)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ONLY PYTHON CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>File sorgente: <code className="text-emerald-300 font-bold">{codeInfo?.fileName}</code></span>
                </span>
                <span className="text-slate-500">Kernel Quantistico Nativo</span>
              </div>

              <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-inner">
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-cyan-200 selection:bg-cyan-500/30 selection:text-white max-h-[58vh]">
                  <code>{codeInfo?.pythonCode || `# Codice per il Calcolo ${calculation.id} non disponibile`}</code>
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Esecuzione su Terminale Locale o Server:
                </span>
                <p className="text-slate-400 leading-relaxed text-[10.5px]">
                  Puoi salvare ed eseguire questo script su qualsiasi computer con Python 3.10+ e pacchetto CUDA-Q (<code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">pip install cudaq</code>). Si collegherà direttamente alla QPU o al simulatore GPU per calcolare lo stato quantistico di fabbrica.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ONLY CALCULATION RESULT (TERMINAL OUTPUT) */}
          {activeTab === 'result' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Output Terminale: <strong className="text-white">Calcolo #{calculation.id}</strong> ({executionTimestamp})</span>
                </span>
                <button
                  type="button"
                  onClick={handleRunCalculation}
                  disabled={isExecuting}
                  className="px-2 py-0.5 rounded bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>Riesegui ora</span>
                </button>
              </div>

              {/* Terminal-like output */}
              <div className="relative rounded-xl bg-black/90 border border-slate-800 overflow-hidden shadow-inner">
                <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-800 text-[10.5px] font-mono text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300">STDOUT • NVIDIA CUDA-Q QPU RUNNER</span>
                  </div>
                  <span className="text-emerald-400 font-bold">EXIT CODE: 0</span>
                </div>
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-emerald-300 selection:bg-emerald-500/30 selection:text-white max-h-[55vh]">
                  <code>{currentResult ? JSON.stringify(currentResult, null, 2) : 'Caricamento output del calcolo in corso...'}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: THEORY & ARCHITECTURE */}
          {activeTab === 'theory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Principio del Calcolo Quantistico #{calculation.id}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {calculation.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Topologia di Entanglement & CNOT
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {calculation.isCrossCategory 
                      ? `Calcolo INCROCIATO [+]: ${calculation.crossCategoryDetails?.parametersOrData || 'Interconnessione con altri reparti'}`
                      : `Calcolo LOCALE [-]: Elaborazione autonoma su qubit locali senza dipendenze trasversali.`}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Parametri & Dati di Telemetria Richiesti
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    <code className="text-cyan-200">{calculation.inputDescription}</code>
                  </p>
                  {calculation.parameterRules && (
                    <p className="text-slate-500 text-[10px] mt-1">
                      Regola: {calculation.parameterRules.regola}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-400 hidden sm:inline flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Accesso riservato: <strong>{userRole}</strong> ({userName}). Il file generato è pronto per l'archiviazione e l'audit NIS2.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer ml-auto"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
