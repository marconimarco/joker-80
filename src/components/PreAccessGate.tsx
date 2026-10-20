import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Unlock, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Cpu,
  CheckCircle2,
  FileText,
  Scale
} from 'lucide-react';
import { LegalTermsModal } from './LegalTermsModal';

interface Props {
  onUnlock: () => void;
}

export const PreAccessGate: React.FC<Props> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isLegalViewOnly, setIsLegalViewOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus password field on mount
    inputRef.current?.focus();
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPass = password.trim();

    // Verify password is 'nicopol' (case-insensitive)
    if (cleanPass.toLowerCase() === 'nicopol') {
      // Check if user has already accepted legal terms
      const alreadyAccepted = sessionStorage.getItem('joker80_legal_accepted') === 'true';

      if (alreadyAccepted) {
        setIsSuccess(true);
        try {
          sessionStorage.setItem('joker80_preaccess_unlocked', 'true');
        } catch (err) {
          console.error('Session storage error', err);
        }
        setTimeout(() => {
          onUnlock();
        }, 450);
      } else {
        // Must pop up the legal agreements (EULA, Disclaimer, NDA, Privacy Policy)
        // User must flag the checkboxes to proceed to the second panel (user choice)
        setIsLegalViewOnly(false);
        setShowLegalModal(true);
      }
    } else {
      setError('Password errata. Autorizzazione negata.');
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };

  const handleLegalAccept = () => {
    try {
      sessionStorage.setItem('joker80_legal_accepted', 'true');
      sessionStorage.setItem('joker80_preaccess_unlocked', 'true');
    } catch (err) {
      console.error('Session storage error', err);
    }
    setShowLegalModal(false);
    setIsSuccess(true);
    setTimeout(() => {
      onUnlock();
    }, 400);
  };

  const handleLegalDecline = () => {
    setShowLegalModal(false);
    setIsSuccess(false);
    setError('Accesso al secondo pannello negato: è obbligatorio prendere visione e flaggare i termini legali (EULA, Disclaimer, NDA e Privacy Policy) per poter scegliere la tipologia di utente.');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Top Glow Bar */}
          <div className={`h-1.5 transition-all duration-500 ${
            isSuccess 
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500' 
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
          }`} />

          {/* Header Bar */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl border transition-colors ${
                isSuccess 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                {isSuccess ? (
                  <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                ) : (
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                    JOKER 80
                  </h2>
                  <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                    GATEWAY
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                  Controllo di Sicurezza Perimetrale
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">ACCESSO PROTETTO</span>
              <span className="sm:hidden">PROTETTO</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-200 font-bold mb-1">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>Autenticazione di Primo Livello</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Inserisci la password di sicurezza per sbloccare l&apos;accesso al portale di controllo JOKER 80. Dopo l&apos;inserimento ti verrà richiesto il flag di presa visione dei termini legali (EULA, Disclaimer, NDA, Privacy) prima di poter selezionare la tipologia di utente.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {isSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Password verificata e termini convalidati! Accesso in corso...</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    Password di Accesso
                  </span>
                  <span className="text-[10px] text-slate-500">Gateway Token</span>
                </label>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isSuccess}
                    required
                    placeholder="Inserisci la password di sicurezza..."
                    className={`w-full pl-3.5 pr-10 py-3 rounded-xl bg-slate-950 border font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                      error 
                        ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/30' 
                        : isSuccess
                          ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-950/20'
                          : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Legal Notice Preview link */}
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Obbligo EULA • Disclaimer • NDA • Privacy</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsLegalViewOnly(true);
                    setShowLegalModal(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Consulta Testo
                </button>
              </div>

              <button
                type="submit"
                disabled={isSuccess || !password.trim()}
                className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/25'
                }`}
              >
                {isSuccess ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Accesso Confermato</span>
                  </>
                ) : (
                  <>
                    <span>Entra nel Portale</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security & System Info Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-500" />
                SM.I.LE80 Gateway
              </span>
              <span>mTLS 1.3 • AES-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Pop-up for EULA, Disclaimer, NDA, Privacy Policy */}
      <LegalTermsModal
        isOpen={showLegalModal}
        viewOnly={isLegalViewOnly}
        onAccept={handleLegalAccept}
        onDecline={handleLegalDecline}
      />
    </>
  );
};
