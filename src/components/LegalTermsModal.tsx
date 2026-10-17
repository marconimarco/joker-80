import React, { useState, useRef } from 'react';
import {
  FileText,
  ShieldAlert,
  CheckSquare,
  Square,
  Search,
  Lock,
  Download,
  AlertTriangle,
  ScrollText,
  CheckCircle2,
  X,
  ExternalLink,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import { LEGAL_SECTIONS, LegalSection } from '../data/legalTerms';

interface Props {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  /** If viewOnly is true, user already accepted and is just re-reading */
  viewOnly?: boolean;
}

export const LegalTermsModal: React.FC<Props> = ({
  isOpen,
  onAccept,
  onDecline,
  viewOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'nda' | 'eula' | 'disclaimer' | 'privacy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasScrolledNearEnd, setHasScrolledNearEnd] = useState(false);
  const [acceptedGeneral, setAcceptedGeneral] = useState(false);
  const [acceptedClauses, setAcceptedClauses] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const diff = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (diff < 120 && !hasScrolledNearEnd) {
      setHasScrolledNearEnd(true);
    }
  };

  const handleConfirm = () => {
    if (!acceptedGeneral || !acceptedClauses) {
      setValidationError('È obbligatorio apporre il flag su entrambe le caselle di presa visione ed approvazione espressa per poter procedere.');
      return;
    }
    setValidationError(null);
    onAccept();
  };

  const handleDownload = () => {
    const fullText = LEGAL_SECTIONS.map(s => `=========================================\n${s.title} (${s.badge})\n=========================================\n\n${s.content}\n\n`).join('\n\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JOKER80_EULA_NDA_DISCLAIMER_PRIVACY_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const contentHtml = LEGAL_SECTIONS.map(s => `
      <div style="margin-bottom: 40px; font-family: monospace; white-space: pre-wrap; font-size: 12px; line-height: 1.6;">
        <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 6px;">${s.title}</h2>
        <p><strong>${s.badge}</strong> - ${s.shortDesc}</p>
        <hr/>
        <div>${s.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>JOKER 80 - Condizioni Legali (EULA, Disclaimer, NDA, Privacy Policy)</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 24px; color: #1e293b; }
          </style>
        </head>
        <body>
          <h1>JOKER 80 QUANTUM CONTROL PANEL - ATTI LEGALI E REGOLAMENTARI</h1>
          <p>Presa visione integrale: EULA, Disclaimer 89 Articoli, NDA, Privacy Policy</p>
          <hr/>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Filter content if search query is present
  const displaySections = LEGAL_SECTIONS.filter(sec => {
    if (activeTab !== 'all' && sec.id !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q) || sec.badge.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[880px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Gradient Stripe */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-500 shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                  Presa Visione & Accettazione Obbligatoria
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  EULA • DISCLAIMER • NDA • PRIVACY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Passaggio obbligatorio: è necessario visionare e flaggare i termini prima di accedere al secondo pannello di selezione utente.
              </p>
            </div>
          </div>

          {/* Action buttons (Print, Download, Close if viewOnly) */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              title="Stampa documento legale"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Stampa</span>
            </button>
            <button
              onClick={handleDownload}
              type="button"
              title="Scarica testo completo in .txt"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Scarica (.txt)</span>
            </button>
            {viewOnly && (
              <button
                onClick={onDecline}
                type="button"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Highlight Banner: Zero Data Retention & AI Disclaimer */}
        <div className="px-4 py-2.5 bg-cyan-950/30 border-b border-cyan-800/30 flex items-center justify-between gap-2 text-xs font-mono text-cyan-200 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Punti Chiave:</strong> Zero Data Retention (Art. 6 NDA / Art. 60 Disclaimer) • Modello AI Probabilistico • Validazione Umana Obbligatoria (Art. 15) • Blockchain Timestamping
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 whitespace-nowrap">
            89 Articoli Contrattuali
          </span>
        </div>

        {/* Tab & Search Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          {/* Document Section Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Tutti i 4 Atti ({LEGAL_SECTIONS.length})
            </button>
            {LEGAL_SECTIONS.map((sec, idx) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === sec.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>#{idx + 1}</span>
                <span>{sec.id.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca negli articoli..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Legal Document Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
        >
          {displaySections.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Nessun articolo trovato con la ricerca &quot;{searchQuery}&quot;.
            </div>
          ) : (
            displaySections.map((sec) => (
              <div
                key={sec.id}
                id={`legal-${sec.id}`}
                className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {sec.title}
                    </h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {sec.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {sec.shortDesc}
                </p>
                <div className="text-slate-300 whitespace-pre-wrap text-[11px] sm:text-xs leading-relaxed max-w-none pt-2 font-mono">
                  {sec.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Acceptance Controls & Validation (Footer) */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/95 shrink-0 flex flex-col gap-3">
          {validationError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {!viewOnly ? (
            <>
              {/* Checkbox 1: General Reading and Acceptance */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedGeneral(!acceptedGeneral);
                    if (validationError) setValidationError(null);
                  }}
                  className={`mt-0.5 p-0.5 rounded transition-colors shrink-0 ${
                    acceptedGeneral ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
                  {acceptedGeneral ? (
                    <CheckSquare className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <span className="text-[11px] sm:text-xs font-mono text-slate-300 leading-snug">
                  <strong className="text-white">Presa Visione & Accettazione Integrale:</strong> Dichiaro di aver letto, compreso e accettato integralmente i 4 documenti: <strong>NON-DISCLOSURE AGREEMENT (NDA)</strong>, <strong>END-USER LICENSE AGREEMENT (EULA)</strong>, <strong>DISCLAIMER & GENERAL TERMS (Art. 1 - 89)</strong> e <strong>PRIVACY POLICY</strong>.
                </span>
              </label>

              {/* Checkbox 2: Express Specific Clauses Acceptance (art. 1341-1342 c.c.) */}
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedClauses(!acceptedClauses);
                    if (validationError) setValidationError(null);
                  }}
                  className={`mt-0.5 p-0.5 rounded transition-colors shrink-0 ${
                    acceptedClauses ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
                  {acceptedClauses ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <span className="text-[11px] sm:text-xs font-mono text-slate-300 leading-snug">
                  <strong className="text-white">Approvazione Specifica ex Artt. 1341 e 1342 c.c.:</strong> Approvo espressamente le seguenti clausole: <strong>Art. 11-23</strong> (Esonero totale da responsabilità, esclusioni danni diretti e indiretti, rischio allucinazioni AI), <strong>Art. 15</strong> (Obbligo tassativo di revisione e firma umana Human-in-the-Loop), <strong>Art. 49-60</strong> (Zero-Retention client side e assenza di log o archivio conversazioni), <strong>Art. 81-82</strong> (Legge applicabile e foro competente esclusivo).
                </span>
              </label>

              {/* Confirmation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onDecline}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 font-mono text-xs transition-colors cursor-pointer"
                >
                  Rifiuta ed Esci (Blocco Accesso)
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!acceptedGeneral || !acceptedClauses}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                      acceptedGeneral && acceptedClauses
                        ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                        : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-75'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferma Presa Visione & Accedi al Secondo Pannello</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Termini precedentemente visionati ed accettati per questa sessione.
              </span>
              <button
                type="button"
                onClick={onDecline}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
