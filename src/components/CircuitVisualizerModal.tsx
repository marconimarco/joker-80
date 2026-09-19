import React from 'react';
import { QuantumCalculationMeta } from '../types/quantum';
import { X, Cpu, Zap, Lock, Unlock, Code2, Layers } from 'lucide-react';

interface Props {
  calculation: QuantumCalculationMeta | null;
  onClose: () => void;
  lastState?: string;
}

export const CircuitVisualizerModal: React.FC<Props> = ({ calculation, onClose, lastState }) => {
  if (!calculation) return null;

  const isLocked = calculation.entanglement === 'OBBLIGATORIO';
  const numQubits = 4;
  const qubits = Array.from({ length: numQubits }, (_, i) => i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1.5 ${
              isLocked 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' 
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
              Calcolo [{calculation.id}] {isLocked ? 'INCROCIATO' : 'LOCALE'}
            </span>
            <h3 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
              {calculation.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Metadata badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono block">Modulo Tecnico</span>
              <span className="font-semibold text-cyan-400 font-mono text-base">{calculation.technicalModule}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono block">Sotto-Funzione</span>
              <span className="font-medium text-slate-200 text-xs truncate block">{calculation.subFunction}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono block">Topologia Entanglement</span>
              <span className="font-semibold text-amber-400 font-mono text-xs flex items-center gap-1">
                {isLocked ? '🔒 CNOT Obbligatorio' : '🔓 Facoltativo / Locale'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono block">Hardware Target</span>
              <span className="font-medium text-slate-300 text-xs truncate block">{calculation.hardwareTarget}</span>
            </div>
          </div>

          {/* Cross Category Info in Modal */}
          {calculation.crossCategoryDetails && (
            <div className={`p-4 rounded-xl border font-mono text-xs ${
              calculation.isCrossCategory
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-slate-950/80 border-slate-800 text-slate-400'
            }`}>
              <div className="font-bold flex items-center gap-2 mb-1 text-slate-200">
                <span className={calculation.isCrossCategory ? 'text-amber-400' : 'text-emerald-400'}>
                  {calculation.isCrossCategory ? '[+] Interconnessione CNOT Inter-Categoria:' : '[-] Elaborazione Autonoma Locale:'}
                </span>
                <span>{calculation.crossCategoryDetails.crossedWith}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-slate-100">Dati e Parametri:</strong> {calculation.crossCategoryDetails.parametersOrData}
              </p>
            </div>
          )}

          {/* Interactive Circuit Schematic */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Schema Circuito Quantistico CUDA-Q (4 Qubit)
              </span>
              {lastState && (
                <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Collasso dominante: <strong className="text-cyan-200">|{lastState}&#x232A;</strong>
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono relative overflow-x-auto">
              <div className="min-w-[620px] space-y-6">
                {qubits.map((qIndex) => {
                  const isControl = isLocked && qIndex < 2;
                  const isTarget = isLocked && qIndex >= 2;
                  const bitValue = lastState ? lastState[qIndex] : (qIndex % 2 === 0 ? '0' : '1');

                  return (
                    <div key={qIndex} className="relative flex items-center h-10">
                      {/* Qubit label */}
                      <div className="w-16 flex items-center gap-1 text-slate-400 text-xs font-bold">
                        <span>q[{qIndex}]</span>
                        <span className="text-slate-600">|0&#x232A;</span>
                      </div>

                      {/* Continuous wire */}
                      <div className="flex-1 h-0.5 bg-slate-700 relative flex items-center justify-between px-6">
                        {/* Step 1: Hadamard Gate */}
                        <div className="z-10 w-8 h-8 rounded bg-cyan-600/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold text-xs shadow-sm hover:scale-105 transition-transform">
                          H
                        </div>

                        {/* Step 2: CNOT Gate / Local Rotation */}
                        <div className="z-10 relative flex items-center justify-center">
                          {isLocked ? (
                            isControl ? (
                              <div className="w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center shadow-lg" title="Control Qubit CNOT">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-bold text-xs" title="Target Qubit CNOT">
                                ⊕
                              </div>
                            )
                          ) : (
                            <div className="w-7 h-7 rounded bg-emerald-600/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 font-bold text-[11px]">
                              Rk
                            </div>
                          )}
                        </div>

                        {/* Step 3: Measurement Gate */}
                        <div className="z-10 w-9 h-8 rounded bg-purple-600/20 border border-purple-400/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                          Mz
                        </div>

                        {/* Final measured bit */}
                        <div className="z-10 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-600 text-xs font-bold">
                          {bitValue}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Vertical Entanglement line for CNOT pairs */}
                {isLocked && (
                  <div className="absolute top-[38px] bottom-[38px] left-[345px] w-0.5 bg-amber-400/80 pointer-events-none flex flex-col justify-center items-center">
                    <span className="px-1 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      CNOT 🔒
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 pt-1 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400/30 border border-cyan-400 inline-block" /> Gate di Hadamard H (Sovrapposizione Coerente)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400/30 border border-amber-400 inline-block" /> Gate CNOT (Entanglement Cross-Modulo)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-400/30 border border-purple-400 inline-block" /> Misura Mz (Collasso Distribuzione)
              </span>
            </div>
          </div>

          {/* Description & Scientific Blueprint */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Principio Computazionale Industriale
            </h4>
            <p className="text-slate-300 leading-relaxed text-xs">
              {calculation.description}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            Chiudi Dettagli Circuito
          </button>
        </div>
      </div>
    </div>
  );
};
