import React, { useState } from 'react';
import { 
  QUANTUM_CALCULATIONS, 
} from '../data/calculationsMeta';
import { QuantumCalculationMeta, MacroCategory } from '../types/quantum';
import { QuantumEngine } from '../services/quantumEngine';
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
  Sliders
} from 'lucide-react';

interface Props {
  onOpenCircuit: (calc: QuantumCalculationMeta, state?: string) => void;
  allowPlcWrite: boolean;
}

const CATEGORIES: MacroCategory[] = [
  '1. Inbound & Materie Prime',
  '2. Magazzino & Stoccaggio',
  '3. Outbound & Spedizioni',
  '4. IoT & Controllo Macchine'
];

export const QuantumCatalog: React.FC<Props> = ({ onOpenCircuit, allowPlcWrite }) => {
  const [selectedCategory, setSelectedCategory] = useState<MacroCategory>('1. Inbound & Materie Prime');
  const [formInputs, setFormInputs] = useState<Record<number, Record<string, any>>>(() => {
    const initial: Record<number, Record<string, any>> = {};
    for (const c of QUANTUM_CALCULATIONS) {
      initial[c.id] = { ...c.defaultInputs };
    }
    return initial;
  });

  const [results, setResults] = useState<Record<number, any>>({});
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredCalculations = QUANTUM_CALCULATIONS.filter(
    c => c.category === selectedCategory
  );

  const handleInputChange = (calcId: number, field: string, value: any) => {
    setFormInputs(prev => ({
      ...prev,
      [calcId]: {
        ...prev[calcId],
        [field]: value
      }
    }));
  };

  const executeCalculation = async (calc: QuantumCalculationMeta) => {
    setExecutingId(calc.id);
    const inputs = formInputs[calc.id] || calc.defaultInputs;
    
    try {
      // Simulate GPU quantum sampling delay
      await new Promise(r => setTimeout(r, 400));
      const res = await QuantumEngine.executeCalculation(calc.id, inputs);
      setResults(prev => ({ ...prev, [calc.id]: res }));
    } catch (err: any) {
      setResults(prev => ({ ...prev, [calc.id]: { error: err.message } }));
    } finally {
      setExecutingId(null);
    }
  };

  const copyResult = (calcId: number, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(calcId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Calculations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCalculations.map((calc) => {
          const isLocked = calc.entanglement === 'OBBLIGATORIO';
          const inputs = formInputs[calc.id] || calc.defaultInputs;
          const result = results[calc.id];
          const isBusy = executingId === calc.id;

          return (
            <div 
              key={calc.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-slate-700 transition-colors"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border flex items-center gap-1.5 ${
                      isLocked
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
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
                      Calcolo [{calc.id}] {isLocked ? 'INCROCIATO' : 'LOCALE'}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {calc.technicalModule}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {calc.subFunction}
                  </span>
                </div>

                {calc.isCrossCategory && calc.crossCategoryDetails && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs font-mono flex items-center justify-between gap-2 text-amber-300">
                    <span className="font-semibold text-[11px]">
                      [+] Incrociato con: {calc.crossCategoryDetails.crossedWith}
                    </span>
                    <span className="text-[10px] text-amber-400/80 px-1.5 py-0.5 rounded bg-amber-500/20">
                      {calc.crossCategoryDetails.modules}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {calc.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {calc.description}
                  </p>
                </div>
              </div>

              {/* Dynamic Parameter Controls */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    Parametri di Fabbrica (Input)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Target: {calc.hardwareTarget.split('/')[0]}
                  </span>
                </div>

                {/* Calcolo 1 */}
                {calc.id === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Camion in attesa</label>
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
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Micro-spessore Film (micron)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.spessore_micro}
                        onChange={e => handleInputChange(4, 'spessore_micro', Number(e.target.value))}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Volume Cassone Camion (mc)</label>
                      <input
                        type="number"
                        value={inputs.volume_disponibile_mc}
                        onChange={e => handleInputChange(10, 'volume_disponibile_mc', Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Lista Pesi Pallet (kg)</label>
                      <input
                        type="text"
                        value={JSON.stringify(inputs.lista_pesi_pallet)}
                        onChange={e => {
                          try {
                            handleInputChange(10, 'lista_pesi_pallet', JSON.parse(e.target.value));
                          } catch {}
                        }}
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
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => onOpenCircuit(calc, result?.stato_qubit_dominante || result?.stato_qubit_rilevato || result?.stato_qubit_ottimale || result?.stato_qubit_calcolato)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Circuito CUDA-Q</span>
                </button>

                <button
                  onClick={() => executeCalculation(calc)}
                  disabled={isBusy}
                  className={`px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md ${
                    isBusy
                      ? 'bg-slate-800 text-slate-500 cursor-wait'
                      : isLocked
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                  }`}
                >
                  {isBusy ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      <span>Campionamento...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Esegui Calcolo ({calc.entanglementSymbol})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Container */}
              {result && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Risultato Payload JSON (Calcolo {calc.id})
                    </span>
                    <button
                      onClick={() => copyResult(calc.id, result)}
                      className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === calc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[10px]">{copiedId === calc.id ? 'Copiato' : 'Copia'}</span>
                    </button>
                  </div>

                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
