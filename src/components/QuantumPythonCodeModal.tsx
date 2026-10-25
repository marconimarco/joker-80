import React, { useState } from 'react';
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
  Code2
} from 'lucide-react';
import { QuantumCalculationMeta } from '../types/quantum';
import { QUANTUM_PYTHON_CODES, QuantumPythonCodeInfo } from '../data/quantumPythonCalculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  calculation: QuantumCalculationMeta | null;
  isAdmin: boolean;
}

export const QuantumPythonCodeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  calculation,
  isAdmin
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'theory'>('code');

  if (!isOpen || !calculation || !isAdmin) {
    return null;
  }

  const codeInfo: QuantumPythonCodeInfo | undefined = QUANTUM_PYTHON_CODES[calculation.id];

  const handleCopy = () => {
    if (!codeInfo) return;
    navigator.clipboard.writeText(codeInfo.pythonCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!codeInfo) return;
    const blob = new Blob([codeInfo.pythonCode], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = codeInfo.fileName || `calcolo_${String(calculation.id).padStart(2, '0')}_cudaq.py`;
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
        className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-mono ring-1 ring-cyan-500/20"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Glow */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <FileCode className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Riservato Amministratore Globale
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Calcolo #{calculation.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Python 3.10+ / CUDA-Q
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate mt-1">
                {codeInfo?.title || calculation.name}
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
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
            <span>Modulo: <strong className="text-cyan-300">{calculation.technicalModule}</strong></span>
            <span>•</span>
            <span>QPU: <strong className="text-slate-200">{calculation.hardwareTarget.split('/')[0]}</strong></span>
            <span>•</span>
            <span>Qubit: <strong className="text-amber-300">{codeInfo?.qubits || 4} Qubit</strong></span>
            <span>•</span>
            <span>Entanglement: <strong className="text-emerald-300">{calculation.entanglement}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Script Python (.py)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('theory')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'theory'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Logica Quantistica & Circuito</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Copia codice sorgente Python negli appunti"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isCopied ? 'Copiato!' : 'Copia'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Scarica lo script Python sul tuo computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Scarica</span> .py
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          {activeTab === 'code' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>File sorgente: <code className="text-emerald-300 font-bold">{codeInfo?.fileName}</code></span>
                </span>
                <span className="text-slate-500">NVIDIA CUDA-Q Native Kernel</span>
              </div>

              {/* Code Box */}
              <div className="relative rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-inner">
                <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-emerald-200 selection:bg-emerald-500/30 selection:text-white">
                  <code>{codeInfo?.pythonCode || `# Codice per il Calcolo ${calculation.id} non disponibile`}</code>
                </pre>
              </div>

              {/* Instructions on execution */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Come eseguire questo script in ambiente reale o locale:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Puoi lanciare questo script direttamente da terminale installando CUDA-Q con <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">pip install cudaq</code>. Lo script interroga il simulatore cuStateVec su GPU NVIDIA o la QPU fisica configurata nel cluster SM.I.LE80 dello stabilimento attivo.
                </p>
              </div>
            </div>
          ) : (
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
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            File riservato ad uso esclusivo di configurazione Gateway & Ingegneria di Sistema.
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
