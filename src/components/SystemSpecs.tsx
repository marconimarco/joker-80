import React from 'react';
import { 
  QUANTUM_CALCULATIONS 
} from '../data/calculationsMeta';
import { 
  Cpu, 
  Lock, 
  Unlock, 
  Layers, 
  Server, 
  Radio, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Network
} from 'lucide-react';
import { QuantumCalculationMeta } from '../types/quantum';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta) => void;
}

export const SystemSpecs: React.FC<Props> = ({ onOpenCircuit }) => {
  const mandatoryCount = QUANTUM_CALCULATIONS.filter(c => c.entanglement === 'OBBLIGATORIO').length;
  const optionalCount = QUANTUM_CALCULATIONS.filter(c => c.entanglement === 'FACOLTATIVO').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Algoritmi Totali</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">17</div>
          <p className="text-[11px] text-slate-400 font-mono">
            4 Macro-Categorie Industriali SM.I.LE80
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Entanglement Obbligatorio</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400">{mandatoryCount} Calcoli</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Gate CNOT (Inter-categoria WMS/SDM/MIP)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Entanglement Facoltativo</span>
            <Unlock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">{optionalCount} Calcoli</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Stati Locali / QFT / VQE / Walk / Hash
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Campionamento CUDA-Q</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-purple-300">1000 iter.</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Default shots per estrazione most_probable()
          </p>
        </div>
      </div>

      {/* Complete Dictionary Matrix of the 17 Calculations */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Matrice dei 17 Calcoli Attivi nel Cervello Quantistico
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Topologia dei kernel quantistici CUDA-Q, vincoli di entanglement e mappatura dei moduli di fabbrica.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">ID</th>
                <th className="pb-3 px-3">Entanglement</th>
                <th className="pb-3 px-3">Algoritmo Quantistico</th>
                <th className="pb-3 px-3">Modulo & Sotto-Funzione</th>
                <th className="pb-3 px-3">Target Hardware</th>
                <th className="pb-3 px-3">Variabili Input di Fabbrica</th>
                <th className="pb-3 px-3 text-right">Circuito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {QUANTUM_CALCULATIONS.map((calc) => {
                const isLocked = calc.entanglement === 'OBBLIGATORIO';
                return (
                  <tr key={calc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-cyan-400">
                      [{calc.id}]
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 border ${
                        isLocked 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {calc.entanglementSymbol} {calc.entanglement}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-100">
                      {calc.name}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="text-cyan-400 font-bold">{calc.technicalModule}</span>
                        <span className="text-slate-400 text-[11px]">{calc.subFunction}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                      {calc.hardwareTarget}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {calc.inputDescription}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onOpenCircuit(calc)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Layers className="w-3 h-3 text-cyan-400" />
                        <span>Schema</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architectural Overview: CUDA-Q -> FastAPI -> Streamlit / Front-End */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-xs">FASE 1</span>
            <span>Kernel CUDA-Q</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            17 file Python indipendenti con decoratore <code>@cudaq.kernel</code>, circuiti con gate Hadamard H, blocchi CNOT intrecciati per le decisioni cross-modulo e misurazione stocastica con 1000 iterazioni.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-sm">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-xs">FASE 2</span>
            <span>FastAPI Central Router</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Middleware <code>main_backend.py</code> con endpoint unificato <code>/api/quantum-service</code> e <code>/api/health</code>, gestione CORS, validazione Pydantic ed esecuzione nativa su GPU.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-xs">FASE 3</span>
            <span>Front-End SM.I.LE80</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pannello di controllo multi-tenant con interruttore di sicurezza hardware (blocco scrittura PLC), terminale interattivo per la chat e cataloghi dei 17 moduli industriali.
          </p>
        </div>
      </div>
    </div>
  );
};
