import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';

export const INDUSTRIAL_GLOSSARY: Record<string, { title: string; simpleExplanation: string; factoryContext: string }> = {
  'ansatz_qaoa': {
    title: 'Ansatz QAOA (Algoritmo Quantistico)',
    simpleExplanation: 'È la formula quantistica che calcola la sequenza perfetta di movimenti per evitare ingorghi.',
    factoryContext: 'Impedisce che due navette LGV si blocchino allo stesso incrocio o che un camion aspetti a baia vuota.'
  },
  'qubit': {
    title: 'Qubit (Unità Quantistica)',
    simpleExplanation: 'È la cella elementare del computer quantistico: a differenza dei bit normali (0 o 1), può valutare tutte le possibilità contemporaneamente.',
    factoryContext: 'Permette di simulare milioni di percorsi logistici in pochi millisecondi.'
  },
  'entanglement': {
    title: 'Entanglement Quantistico',
    simpleExplanation: 'Collegamento immediato tra stati diversi: se un macchinario rallenta, tutti gli altri si coordinano all\'istante.',
    factoryContext: 'Garantisce che il fasciatore Bema non aspetti pallet vuoti se la navetta LGV è in ritardo.'
  },
  'pre_stretch': {
    title: 'Pre-Stiro Film (BEMA Silkworm)',
    simpleExplanation: 'Percentuale di trazione applicata alla pellicola trasparente prima di avvolgere il bancale.',
    factoryContext: 'Un pre-stiro ideale (es. 280-310%) stabilizza il carico senza sprecare plastica né rischiare strappi.'
  },
  'oee': {
    title: 'OEE (Overall Equipment Effectiveness)',
    simpleExplanation: 'Percentuale di rendimento effettivo dell\'impianto: Disponibilità × Prestazioni × Qualità.',
    factoryContext: 'Sopra l\'85% è considerato eccellenza mondiale. Sotto il 65% indica troppi fermi macchina.'
  },
  'soc_batteria': {
    title: 'SoC (State of Charge Batteria LGV)',
    simpleExplanation: 'Percentuale di carica residua della batteria della navetta automatica.',
    factoryContext: 'Se scende sotto il 25%, il sistema instrada l\'LGV verso le spazzole di ricarica rapida.'
  },
  'spool': {
    title: 'Cartella Spool (Buffer Locale)',
    simpleExplanation: 'Cartella sul disco rigido locale dove i macchinari depositano i file CSV esportati.',
    factoryContext: 'Se la rete internet si interrompe temporaneamente, i dati si accumulano qui senza mai perdersi.'
  },
  'm2m_handshake': {
    title: 'Handshake M2M (Riconoscimento Macchina)',
    simpleExplanation: 'Riconoscimento crittografico sicuro tra il PC fisico di linea e il cloud JOKER 80.',
    factoryContext: 'Verifica il MAC Address della scheda di rete e impedisce a computer non autorizzati di inviare telemetria.'
  },
  'saturazione_baie': {
    title: 'Saturazione Baie di Carico',
    simpleExplanation: 'Percentuale di baie attualmente occupate da camion in carico/scarico.',
    factoryContext: 'Evita code di autotrasportatori sul piazzale riallocando i camion in anticipo.'
  },
  'vibrazione_cuscinetti': {
    title: 'Vibrazione Cuscinetti (G-Force)',
    simpleExplanation: 'Livello di vibrazione meccanica misurato dai sensori piezoelettrici sui rulli.',
    factoryContext: 'Segnala l\'usura dei cuscinetti giorni prima che si verifichi un fermo linea improvviso.'
  }
};

interface Props {
  termKey?: keyof typeof INDUSTRIAL_GLOSSARY;
  customTitle?: string;
  customText?: string;
  factoryContext?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const IndustrialHelpTooltip: React.FC<Props> = ({
  termKey,
  customTitle,
  customText,
  factoryContext,
  label,
  className = '',
  iconOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const entry = termKey ? INDUSTRIAL_GLOSSARY[termKey] : null;
  const title = customTitle || entry?.title || 'Informazione Pratica';
  const explanation = customText || entry?.simpleExplanation || '';
  const context = factoryContext || entry?.factoryContext || '';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer group p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
        title="Clicca per spiegazione semplice in linguaggio di fabbrica"
      >
        {label && <span className="text-[11px] font-mono group-hover:underline">{label}</span>}
        <HelpCircle className="w-3.5 h-3.5 text-cyan-400/80 group-hover:text-cyan-300 transition-transform group-hover:scale-110 shrink-0" />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-slate-100 shadow-2xl font-sans text-xs animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold font-mono text-[11px]">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
            <p className="text-slate-200">
              {explanation}
            </p>
            {context && (
              <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[10.5px]">
                <strong className="text-cyan-300">In fabbrica:</strong> {context}
              </div>
            )}
          </div>

          {/* Freccia tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-slate-900 border-r border-b border-cyan-500/50 rotate-45" />
        </div>
      )}
    </div>
  );
};
