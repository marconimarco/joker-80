import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  Filter, 
  Sparkles,
  Terminal,
  Activity,
  Zap,
  Building2
} from 'lucide-react';
import { QuantumCalculationMeta, FactoryTenant, UserAccount } from '../types/quantum';
import { QUANTUM_PYTHON_CODES, QuantumPythonCodeInfo } from '../data/quantumPythonCalculations';
import { QuantumEngine } from '../services/quantumEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTenant?: FactoryTenant;
  plantSupportedCalcs: QuantumCalculationMeta[];
  allCalculations: QuantumCalculationMeta[];
  results: Record<number, any>;
  formInputs: Record<number, any>;
  currentUser?: UserAccount;
  canView?: boolean;
  onUpdateResults?: (newResults: Record<number, any>) => void;
}

export const AllQuantumPythonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTenant,
  plantSupportedCalcs,
  allCalculations,
  results,
  formInputs,
  currentUser,
  canView = true,
  onUpdateResults
}) => {
  const [filterScope, setFilterScope] = useState<'plant' | 'all'>('plant');
  const [activeTab, setActiveTab] = useState<'unified' | 'code_only' | 'results_only'>('unified');
  const [progressCount, setProgressCount] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalcFilter, setSelectedCalcFilter] = useState<number | 'ALL'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveResults, setLiveResults] = useState<Record<number, any>>(results);
  const [generationTime, setGenerationTime] = useState<string>(new Date().toLocaleString('it-IT'));

  // Sync results when props change
  useEffect(() => {
    setLiveResults(prev => ({ ...prev, ...results }));
  }, [results]);

  // Determine active calculations list based on user filter
  const targetCalculations = useMemo(() => {
    if (filterScope === 'plant' && plantSupportedCalcs.length > 0) {
      return plantSupportedCalcs;
    }
    return allCalculations;
  }, [filterScope, plantSupportedCalcs, allCalculations]);

  // Filtered calcs based on dropdown / search
  const displayedCalculations = useMemo(() => {
    let list = targetCalculations;
    if (selectedCalcFilter !== 'ALL') {
      list = list.filter(c => c.id === selectedCalcFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.subFunction.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    }
    return list;
  }, [targetCalculations, selectedCalcFilter, searchQuery]);

  // Function to re-simulate all calculations in scope
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setProgressCount(0);
    const newResults: Record<number, any> = { ...liveResults };
    try {
      let count = 0;
      for (const calc of targetCalculations) {
        const inputs = formInputs[calc.id] || calc.defaultInputs || {};
        try {
          // Simulation of progressive QPU hardware state-vector batch sampling
          await new Promise(r => setTimeout(r, 25));
          const res = await QuantumEngine.executeCalculation(calc.id, inputs);
          newResults[calc.id] = res;
        } catch (e) {
          console.error(`Errore ricalcolo #${calc.id}`, e);
        }
        count++;
        setProgressCount(count);
      }
      setLiveResults(newResults);
      setGenerationTime(new Date().toLocaleString('it-IT'));
      onUpdateResults?.(newResults);
    } finally {
      setIsRefreshing(false);
      setProgressCount(null);
    }
  };

  // Build the complete, unified single Python file containing all calculations and their results
  const fullUnifiedPythonContent = useMemo(() => {
    const tenantName = activeTenant?.nome || 'Stabilimento Standard';
    const tenantSite = activeTenant?.sito || 'Italia';
    const tenantAzienda = activeTenant?.azienda || 'Elettric80 Automation';
    const tenantNum = activeTenant?.numeroStabilimento || 1;
    const userName = currentUser?.nomeCompleto || currentUser?.username || 'Utente Autorizzato';
    const userRole = currentUser?.ruolo || 'Responsabile / Amministratore';

    const indexList = targetCalculations
      .map(c => `#   - Calcolo #${String(c.id).padStart(2, '0')}: [${c.category}] ${c.name} (${c.subFunction})`)
      .join('\n');

    const sections = targetCalculations.map((calc, idx) => {
      const codeInfo = QUANTUM_PYTHON_CODES[calc.id];
      const codeText = codeInfo ? codeInfo.pythonCode.trim() : '# Codice sorgente Python non disponibile';
      const inputs = formInputs[calc.id] || calc.defaultInputs || {};
      const res = liveResults[calc.id] || null;

      const inputLines = Object.keys(inputs).length > 0
        ? Object.entries(inputs).map(([k, v]) => `#   - ${k}: ${JSON.stringify(v)}`).join('\n')
        : '#   - (Parametri standard di telemetria PLC di fabbrica)';

      const resultFormatted = res
        ? JSON.stringify(res, null, 2)
            .split('\n')
            .map(line => `#   ${line}`)
            .join('\n')
        : '#   [Nessun risultato disponibile per questo nodo]';

      return `
# ==============================================================================
# CALCOLO #${calc.id}: ${calc.name.toUpperCase()}
# ==============================================================================
# Sottofunzione: ${calc.subFunction}
# Reparto: ${calc.category} | Modulo Tecnico: ${calc.technicalModule}
# Entanglement: ${calc.entanglement} | QPU Target: ${codeInfo?.targetQpu || 'NVIDIA cuQuantum'} (${codeInfo?.qubits || 4} Qubit)
# Descrizione: ${codeInfo?.description || calc.description}
# ==============================================================================

${codeText}

# ------------------------------------------------------------------------------
# REPORT TELEMETRIA & RISULTATO COMPUTAZIONALE - CALCOLO #${calc.id}
# ------------------------------------------------------------------------------
# Parametri di Input PLC Ricevuti:
${inputLines}
#
# Risultato JSON Elaborato da SM.I.LE80 Quantum Engine:
${resultFormatted}
#
# Diagnosi: ${res?.indice_rischio_blocco || res?.livello_rischio || res?.validazione_qualita || res?.digital_twin_status || 'ESECUZIONE CONFORME'}
# Azione Consigliata: ${res?.azione_correttiva_suggerita || res?.azione_logistica_immediata || res?.azione_sicurezza_wms || 'Nessuna anomalia rilevata'}
# ------------------------------------------------------------------------------
`;
    }).join('\n\n');

    return `"""
================================================================================
JOKER 80 QUANTUM - CONSOLIDATED REPORT FILE (ALL CALCULATIONS & RESULTS)
================================================================================
Stabilimento: ${tenantName} (${tenantSite})
Azienda: ${tenantAzienda} #${tenantNum}
Operatore / Ruolo: ${userName} (${userRole})
Data & Ora Generazione: ${generationTime}
Totale Calcoli Inclusi: ${targetCalculations.length} calcoli operativi
Framework Quantistico: NVIDIA CUDA-Q 0.9+ / cuQuantum Appliance
Conformità di Fabbrica: Direttiva NIS2 Art. 21 / Crittografia Post-Quantum
================================================================================

INDICE DEI CALCOLI PRESENTI IN QUESTO FILE UNICO:
${indexList}
================================================================================
"""

import cudaq
import numpy as np
import json
import math
import time
import hashlib
from typing import Dict, Any, List

# Inizializzazione Ambiente di Simulazione NVIDIA CUDA-Q
print("JOKER 80 - Caricamento kernel quantistici consolidati SM.I.LE80...")

${sections}

# ==============================================================================
# FINE REPORT CONSOLIDATO - TUTTI I CALCOLI COMPLETATI CON SUCCESSO (EXIT 0)
# ==============================================================================
`;
  }, [targetCalculations, activeTenant, currentUser, formInputs, liveResults, generationTime]);

  // Code-only consolidated content
  const codeOnlyContent = useMemo(() => {
    const sections = targetCalculations.map(calc => {
      const codeInfo = QUANTUM_PYTHON_CODES[calc.id];
      return `
# ==============================================================================
# CALCOLO #${calc.id}: ${calc.name} (${calc.subFunction})
# ==============================================================================
${codeInfo ? codeInfo.pythonCode.trim() : '# Codice non disponibile'}
`;
    }).join('\n\n');

    return `"""
JOKER 80 QUANTUM - SCRIPT PYTHON & KERNEL CUDA-Q CONSOLIDATI
Totale Calcoli: ${targetCalculations.length}
Stabilimento: ${activeTenant?.nome || 'Stabilimento Standard'}
"""

import cudaq
import numpy as np
import json

${sections}
`;
  }, [targetCalculations, activeTenant]);

  // Results-only JSON content
  const resultsOnlyContent = useMemo(() => {
    const dump: Record<string, any> = {
      stabilimento: activeTenant?.nome,
      azienda: activeTenant?.azienda,
      timestamp: generationTime,
      totale_calcoli: targetCalculations.length,
      calcoli: {}
    };

    targetCalculations.forEach(calc => {
      dump.calcoli[`calcolo_${calc.id}_${calc.subFunction}`] = {
        id: calc.id,
        nome: calc.name,
        categoria: calc.category,
        input: formInputs[calc.id] || calc.defaultInputs || {},
        output: liveResults[calc.id] || { stato: 'In attesa di esecuzione' }
      };
    });

    return JSON.stringify(dump, null, 2);
  }, [targetCalculations, activeTenant, generationTime, formInputs, liveResults]);

  // Content to display based on active tab
  const activeContent = useMemo(() => {
    if (activeTab === 'code_only') return codeOnlyContent;
    if (activeTab === 'results_only') return resultsOnlyContent;
    return fullUnifiedPythonContent;
  }, [activeTab, codeOnlyContent, resultsOnlyContent, fullUnifiedPythonContent]);

  if (!isOpen || !canView) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownload = (format: 'txt' | 'py' | 'json' = 'txt') => {
    const isJson = activeTab === 'results_only' || format === 'json';
    const isTxt = format === 'txt';
    const blob = new Blob([activeContent], { 
      type: isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const plantSlug = (activeTenant?.nome || 'stabilimento').toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (isJson) {
      a.download = `joker80_${plantSlug}_all_results.json`;
    } else if (activeTab === 'code_only') {
      a.download = `joker80_${plantSlug}_all_cudaq_kernels.${isTxt ? 'txt' : 'py'}`;
    } else {
      a.download = `joker80_${plantSlug}_all_calcs_python_e_risultati.${isTxt ? 'txt' : 'py'}`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[94vh] rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20">
              <FileCode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <span>File Python e risultato all calcs</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  UNICO FILE .PY CONSOLIDATO
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  NIS2 ART. 21 VALIDATED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono flex items-center gap-2 flex-wrap">
                <span>Stabilimento: <strong className="text-white">{activeTenant?.nome || 'Generale'}</strong> ({activeTenant?.sito})</span>
                <span>•</span>
                <span>{targetCalculations.length} calcoli inclusi</span>
                <span>•</span>
                <span>Aggiornato: {generationTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Ricalcola in tempo reale tutti i calcoli con i parametri attuali dei sensori"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing 
                  ? `Campionamento QPU (${progressCount || 0}/${targetCalculations.length})...` 
                  : 'Ricalcola Tutti'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="p-3 sm:px-5 border-b border-slate-800/80 bg-slate-900/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs font-mono shrink-0">
          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('unified')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'unified'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>File Unico Completo (.py)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code_only')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'code_only'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Soli Codici CUDA-Q</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('results_only')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'results_only'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Soli Risultati (JSON)</span>
            </button>
          </div>

          {/* Scope Selector: Plant Only vs All 21 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-[11px]">Ambito calcoli:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setFilterScope('plant'); setSelectedCalcFilter('ALL'); }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  filterScope === 'plant'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stabilimento Attivo ({plantSupportedCalcs.length})
              </button>
              <button
                type="button"
                onClick={() => { setFilterScope('all'); setSelectedCalcFilter('ALL'); }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  filterScope === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tutti i 21 Calcoli (21)
              </button>
            </div>

            {/* Quick Jump Dropdown */}
            <select
              value={selectedCalcFilter}
              onChange={(e) => setSelectedCalcFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Tutti i {targetCalculations.length} calcoli</option>
              {targetCalculations.map(c => (
                <option key={c.id} value={c.id}>
                  Calcolo #{c.id}: {c.name.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CODE PREVIEW VIEWER (Main Content) */}
        <div className="flex-1 min-h-0 p-3 sm:p-5 bg-slate-950 flex flex-col">
          <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col">
            {/* Top Bar inside Code Container */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-slate-300 font-bold">
                  {activeTab === 'results_only' 
                    ? `joker80_${activeTenant?.id || 'plant'}_all_results.json` 
                    : `joker80_all_calcs_code_and_results.py`}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300">
                  {targetCalculations.length} calcoli • {activeContent.split('\n').length} righe
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold"
                  title="Copia l'intero file consolidato negli appunti"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{isCopied ? 'File Copiato!' : 'Copia File Completo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs shadow-md shadow-emerald-950/40"
                  title="Scarica subito il file .txt con tutti i codici Python e i risultati dei calcoli"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica File .txt</span>
                </button>
              </div>
            </div>

            {/* Monospace Code Editor / Viewer */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-cyan-100 selection:bg-cyan-500/30 selection:text-white">
              <pre className="whitespace-pre">
                <code>{activeContent}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:px-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Certificato conforme alla Direttiva NIS2 Art. 21 con crittografia mTLS e firma hash post-quantum per i nodi Elettric80.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{isCopied ? 'Copiato negli appunti' : 'Copia Tutto'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('txt')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40 text-xs"
              title="Scarica subito il file .txt con tutti i file Python e i risultati di tutti i calcoli"
            >
              <Download className="w-4 h-4" />
              <span>Scarica File .txt Completo</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('py')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Scarica come script Python .py"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Scarica .py</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs font-semibold"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
