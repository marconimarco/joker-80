import React, { useState } from 'react';
import { 
  QUANTUM_CALCULATIONS 
} from '../data/calculationsMeta';
import { 
  Cpu, 
  Lock, 
  Unlock, 
  Layers, 
  Network,
  Share2
} from 'lucide-react';
import { QuantumCalculationMeta } from '../types/quantum';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta) => void;
}

export const SystemSpecs: React.FC<Props> = ({ onOpenCircuit }) => {
  const [filterType, setFilterType] = useState<'all' | 'crossed' | 'local'>('all');
  const mandatoryCount = QUANTUM_CALCULATIONS.filter(c => c.entanglement === 'OBBLIGATORIO').length;
  const optionalCount = QUANTUM_CALCULATIONS.filter(c => c.entanglement === 'FACOLTATIVO').length;

  const displayedCalculations = QUANTUM_CALCULATIONS.filter(calc => {
    if (filterType === 'crossed') return calc.isCrossCategory;
    if (filterType === 'local') return !calc.isCrossCategory;
    return true;
  });

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
            4 Macro-Categorie Industriali JOKER 80
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">[+] INCROCIATI</span>
            </span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400">{mandatoryCount} Calcoli</div>
          <p className="text-[11px] text-amber-200/80 font-mono">
            Gate CNOT Inter-Categoria (MIP ⟷ WMS ⟷ SDM ⟷ ECS)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">[-] LOCALI</span>
            </span>
            <Unlock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">{optionalCount} Calcoli</div>
          <p className="text-[11px] text-emerald-200/80 font-mono">
            Elaborazione Autonoma (QFT / VQE / Walk / Hash)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Campionamento CUDA-Q</span>
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-purple-300">1000 iter.</div>
          <p className="text-[11px] text-slate-400 font-mono">
            Default shots per estrazione most_probable()
          </p>
        </div>
      </div>

      {/* Complete Dictionary Matrix of the 17 Calculations */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Matrice dei 17 Calcoli Attivi nel Cervello Quantistico
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Topologia dei kernel quantistici CUDA-Q, vincoli di entanglement e mappatura dettagliata dei flussi e parametri incrociati tra categorie.
            </p>
          </div>

          {/* Quick Filter buttons */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tutti (17)
            </button>
            <button
              onClick={() => setFilterType('crossed')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                filterType === 'crossed'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <span className="font-bold">[+]</span> Solo Incrociati ({mandatoryCount})
            </button>
            <button
              onClick={() => setFilterType('local')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                filterType === 'local'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <span className="font-bold">[-]</span> Solo Locali ({optionalCount})
            </button>
          </div>
        </div>

        {/* Legend for the user */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono flex flex-wrap items-center gap-6 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <span>[+]</span> 🔒 INCROCIATO
            </span>
            <span className="text-slate-400 text-[11px]">
              Intreccia qubit/dati con altre categorie di stabilimento (Gate CNOT obbligatorio)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span>[-]</span> 🔓 LOCALE
            </span>
            <span className="text-slate-400 text-[11px]">
              Elabora solo parametri interni alla propria categoria/macchina (Entanglement facoltativo)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">ID</th>
                <th className="pb-3 px-3">Incrocio / Entanglement</th>
                <th className="pb-3 px-3">Algoritmo Quantistico</th>
                <th className="pb-3 px-3">Categoria di Origine</th>
                <th className="pb-3 px-3">Dati e Parametri Incrociati o Usati</th>
                <th className="pb-3 px-3">Target Hardware</th>
                <th className="pb-3 px-3 text-right">Circuito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayedCalculations.map((calc) => {
                const isCrossed = calc.isCrossCategory;
                const details = calc.crossCategoryDetails;

                return (
                  <tr key={calc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-cyan-400 whitespace-nowrap">
                      [{calc.id}]
                    </td>

                    {/* Incrocio / Entanglement status column */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isCrossed ? (
                        <div className="flex flex-col gap-1">
                          <span className="px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 w-fit">
                            <span className="font-extrabold text-amber-200">[+]</span>
                            <span>{calc.entanglementSymbol} INCROCIATO</span>
                          </span>
                          <span className="text-[10px] text-amber-400/90 font-semibold pl-1">
                            {details?.modules}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit">
                            <span className="font-extrabold text-emerald-300">[-]</span>
                            <span>{calc.entanglementSymbol} LOCALE</span>
                          </span>
                          <span className="text-[10px] text-slate-500 pl-1">
                            {calc.technicalModule} isolato
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Algoritmo */}
                    <td className="py-3.5 px-3 font-semibold text-slate-100 max-w-[200px]">
                      <div>{calc.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{calc.subFunction}</div>
                    </td>

                    {/* Categoria di Origine */}
                    <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {calc.category}
                      </span>
                    </td>

                    {/* Nuova colonna dettagliata richiesta dall'utente: DATI E PARAMETRI INCROCIATI O USATI */}
                    <td className="py-3.5 px-3 min-w-[280px] max-w-[380px]">
                      {isCrossed ? (
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                            <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Incrociato con: {details?.crossedWith}</span>
                          </div>
                          <div className="text-[11px] text-slate-200 leading-snug">
                            <strong className="text-amber-200/90 font-semibold">Flusso dati:</strong> {details?.parametersOrData}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Parametri input: <code className="text-cyan-300">{calc.inputDescription}</code>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                          <div className="text-[11px] text-emerald-400 font-medium">
                            {details?.crossedWith}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-snug">
                            {details?.parametersOrData}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Parametri input: <code className="text-slate-300">{calc.inputDescription}</code>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Target Hardware */}
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {calc.hardwareTarget.split('/')[0]}
                    </td>

                    {/* Circuito Button */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenCircuit(calc)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Circuito</span>
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
            <span>Front-End JOKER 80</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pannello di controllo multi-tenant con interruttore di sicurezza hardware (blocco scrittura PLC), terminale interattivo per la chat e cataloghi dei 17 moduli industriali.
          </p>
        </div>
      </div>
    </div>
  );
};
