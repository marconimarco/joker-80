import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onAccept: () => void;
  userName?: string;
}

export const TrialDisclaimerModal: React.FC<Props> = ({
  isOpen,
  onAccept,
  userName
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isAcknowledged) return;
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      {/* CARD CONTAINER */}
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden my-auto p-6 sm:p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* SFUMATURE E BAGLIORI DI SFONDO (AMBRA / ROSSO) */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* INTESTAZIONE */}
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>INFORMATIVA LEGALE • VERSIONE SPERIMENTALE</span>
            </span>

            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            AVVISO IMPORTANTE: VERSIONE TRIAL DI PROVA
          </h2>
        </div>

        {/* TESTO DEL CORPO */}
        <div className="relative z-10 flex flex-col gap-4 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p className="font-semibold text-slate-200">
            Gentile Utente{userName ? ` ${userName}` : ''},
          </p>
          <p>
            Si informa che questa applicazione è attualmente rilasciata esclusivamente come versione trial di prova e sperimentale. Sebbene i documenti legali (EULA, NDA e Disclaimer) facciano riferimento alla versione definitiva del prodotto, l'utente riconosce e accetta che il software potrebbe contenere bug, anomalie o malfunzionamenti.
          </p>

          {/* BOX DI AVVISO AMBRA EVIDENZIATO */}
          <div className="rounded-2xl p-4 bg-amber-950/25 border border-amber-900/40 flex items-start gap-3.5 shadow-inner">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/95 font-medium leading-normal text-xs sm:text-[13px]">
              Lo sviluppatore e l'organizzazione non si assumono alcuna responsabilità per eventuali danni, interruzioni operative o perdite di dati derivanti dall'utilizzo dell'applicazione in questa fase di collaudo e prova.
            </p>
          </div>
        </div>

        {/* CASELLA DI CONTROLLO OBBLIGATORIA */}
        <div className="relative z-10 pt-2 border-t border-slate-800/80">
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/40 accent-amber-500 cursor-pointer shrink-0"
            />
            <span className="text-xs sm:text-[13px] text-slate-200 font-medium leading-snug">
              Dichiaro di aver letto, compreso e accetto che l'applicazione è una versione trial di prova
            </span>
          </label>
        </div>

        {/* PULSANTE DI AZIONE */}
        <div className="relative z-10 flex items-center justify-end">
          <button
            type="button"
            disabled={!isAcknowledged}
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-xl ${
              isAcknowledged
                ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-amber-950/50'
                : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isAcknowledged ? 'text-slate-950' : 'text-slate-400'}`} />
            <span>Accetto e Prosegui</span>
          </button>
        </div>
      </div>
    </div>
  );
};
