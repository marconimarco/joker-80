import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Scale,
  User,
  ShieldCheck,
  Building2,
  Check,
  Sliders,
  Sparkles
} from 'lucide-react';
import { LegalTermsModal } from './LegalTermsModal';
import { UserAccount } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';

interface Props {
  onUnlock: () => void;
  onLoginWithUser?: (user: UserAccount) => void;
}

interface CompanyOption {
  id: string;
  name: string;
  subTitle: string;
  color: string;
  badge: string;
}

const COMPANIES: CompanyOption[] = [
  { id: 'barilla', name: 'Barilla', subTitle: 'Pedrignano / Novara', color: 'bg-blue-600', badge: 'border-blue-500/40 text-blue-300' },
  { id: 'ferrero', name: 'Ferrero', subTitle: 'Alba / Pozzuolo', color: 'bg-amber-600', badge: 'border-amber-500/40 text-amber-300' },
  { id: 'nestle', name: 'Nestlé', subTitle: 'Assago / Benevento', color: 'bg-red-600', badge: 'border-red-500/40 text-red-300' },
  { id: 'santanna', name: "Sant'Anna", subTitle: 'Vinadio / Lanzo', color: 'bg-emerald-600', badge: 'border-emerald-500/40 text-emerald-300' },
];

export const PreAccessGate: React.FC<Props> = ({ onUnlock, onLoginWithUser }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [isLegalViewOnly, setIsLegalViewOnly] = useState(false);
  
  // Role & Company selection right at entry
  const [selectedRole, setSelectedRole] = useState<'Responsabile' | 'Operatore' | 'Amministratore'>('Responsabile');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('barilla');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus password field on mount
    inputRef.current?.focus();
  }, []);

  // Resolve matching UserAccount
  const users = useMemo(() => AuthStorage.getUsers(), []);
  
  const activeUser = useMemo<UserAccount>(() => {
    if (selectedRole === 'Amministratore') {
      const admin = users.find(u => u.username === 'admin');
      if (admin) return admin;
    }
    const targetUsername = selectedRole === 'Responsabile' 
      ? `resp_${selectedCompanyId}` 
      : `op_${selectedCompanyId}`;
    
    const found = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (found) return found;

    // Fallback to any user with that role
    const fallback = users.find(u => u.ruolo.includes(selectedRole));
    return fallback || users[0];
  }, [selectedRole, selectedCompanyId, users]);

  const completeAccess = () => {
    setIsSuccess(true);
    try {
      sessionStorage.setItem('joker80_preaccess_unlocked', 'true');
      sessionStorage.setItem('joker80_legal_accepted', 'true');
    } catch (err) {
      console.error('Session storage error', err);
    }
    setTimeout(() => {
      if (onLoginWithUser && activeUser) {
        onLoginWithUser(activeUser);
      } else {
        onUnlock();
      }
    }, 450);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPass = password.trim();

    // Verify password: master 'nicopol' or user account specific password
    const isMaster = cleanPass.toLowerCase() === 'nicopol';
    const isUserPass = activeUser?.password && cleanPass.toLowerCase() === activeUser.password.toLowerCase();

    if (isMaster || isUserPass) {
      // Check if user has already accepted legal terms
      const alreadyAccepted = sessionStorage.getItem('joker80_legal_accepted') === 'true';

      if (alreadyAccepted) {
        completeAccess();
      } else {
        // Must pop up the legal agreements (EULA, Disclaimer, NDA, Privacy Policy)
        setIsLegalViewOnly(false);
        setShowLegalModal(true);
      }
    } else {
      setError('Password errata. Autorizzazione negata (Password master: nicopol).');
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };

  const handleLegalAccept = () => {
    setShowLegalModal(false);
    completeAccess();
  };

  const handleLegalDecline = () => {
    setShowLegalModal(false);
    setIsSuccess(false);
    setError('Accesso al portale negato: è obbligatorio prendere visione e accettare i termini legali (EULA, Disclaimer, NDA e Privacy Policy).');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[96dvh]">
          {/* Top Glow Bar */}
          <div className={`h-1.5 transition-all duration-500 shrink-0 ${
            isSuccess 
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500' 
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
          }`} />

          {/* Header Bar */}
          <div className="p-4 sm:p-5 pb-3 sm:pb-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
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
                  Accesso di Sicurezza & Selezione Profilo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>GATEWAY PROTETTO</span>
            </div>
          </div>

          {/* Main Form Content */}
          <form onSubmit={handleVerify} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Accesso autorizzato per {activeUser.nomeCompleto}! Avvio in corso...</span>
              </div>
            )}

            {/* SEZIONE 1: SCELTA TIPOLOGIA DI ACCESSO (RESPONSABILE VS OPERATORE) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. Tipologia di Accesso Desiderata:</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Scegli il tuo ruolo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Opzione 1: RESPONSABILE DI STABILIMENTO */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('Responsabile')}
                  className={`p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedRole === 'Responsabile'
                      ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1.5 rounded-lg ${
                        selectedRole === 'Responsabile' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-100">
                        Responsabile
                      </span>
                    </div>
                    {selectedRole === 'Responsabile' && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 leading-tight">
                    Supervisione nodi, gestione allarmi e autorizzazioni di impianto
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      Coordinatore Nodi
                    </span>
                  </div>
                </button>

                {/* Opzione 2: OPERATORE DI LINEA */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('Operatore')}
                  className={`p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedRole === 'Operatore'
                      ? 'bg-cyan-950/40 border-cyan-500/80 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1.5 rounded-lg ${
                        selectedRole === 'Operatore' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-100">
                        Operatore
                      </span>
                    </div>
                    {selectedRole === 'Operatore' && (
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 leading-tight">
                    Telemetria live, semafori di linea e catalogo 21 calcoli di fabbrica
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      Operativo di Reparto
                    </span>
                  </div>
                </button>
              </div>

              {/* Opzione Discreta: Amministratore Globale */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('Amministratore')}
                  className={`text-[10.5px] font-mono flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                    selectedRole === 'Amministratore'
                      ? 'text-purple-300 bg-purple-500/15 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Sliders className="w-3 h-3 text-purple-400" />
                  <span>Accesso Amministratore Globale (Chat & Codice Python)</span>
                </button>
              </div>
            </div>

            {/* SEZIONE 2: SCELTA STABILIMENTO AZIENDALE (SE NON ADMIN) */}
            {selectedRole !== 'Amministratore' && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. Stabilimento di Fabbrica:</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Azienda attiva
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {COMPANIES.map(comp => {
                    const isSelected = selectedCompanyId === comp.id;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedCompanyId(comp.id)}
                        className={`p-2 rounded-xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-850 border-cyan-500 ring-1 ring-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white truncate">
                            {comp.name}
                          </span>
                          {isSelected && (
                            <span className="w-3 h-3 rounded-full bg-cyan-400 flex items-center justify-center shrink-0">
                              <Check className="w-2 h-2 text-slate-950 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 truncate">
                          {comp.subTitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CARD ANTEPRIMA PROFILO IN ENTRATA */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 font-mono flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  selectedRole === 'Responsabile'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : selectedRole === 'Operatore'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                }`}>
                  {selectedRole === 'Responsabile' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : selectedRole === 'Operatore' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Sliders className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-200 truncate flex items-center gap-1.5">
                    <span>{activeUser.nomeCompleto}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                      @{activeUser.username}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">
                    Ruolo: <strong className={selectedRole === 'Responsabile' ? 'text-amber-300' : selectedRole === 'Operatore' ? 'text-cyan-300' : 'text-purple-300'}>{activeUser.ruolo}</strong>
                    {activeUser.lineaAssegnata && ` • ${activeUser.lineaAssegnata}`}
                  </div>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shrink-0 font-bold hidden sm:inline">
                Pronto all&apos;accesso
              </span>
            </div>

            {/* SEZIONE 3: PASSWORD DI SICUREZZA */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <label className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. Password di Sicurezza Gateway:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Master: <code className="text-cyan-300">nicopol</code>
                </span>
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
                  placeholder="Inserisci la password di sicurezza (es. nicopol)..."
                  className={`w-full pl-3.5 pr-10 py-2.5 sm:py-3 rounded-xl bg-slate-950 border font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
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
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[10.5px]">Obbligo EULA • Disclaimer • NDA • Privacy</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLegalViewOnly(true);
                  setShowLegalModal(true);
                }}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer text-[10.5px]"
              >
                Consulta Testo
              </button>
            </div>

            {/* Bottone di Invio Accesso */}
            <button
              type="submit"
              disabled={isSuccess || !password.trim()}
              className={`w-full py-3 px-4 rounded-xl font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : selectedRole === 'Responsabile'
                    ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-500 hover:to-yellow-500 text-white shadow-amber-600/25'
                    : selectedRole === 'Operatore'
                    ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/25'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/25'
              }`}
            >
              {isSuccess ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Accesso Autorizzato</span>
                </>
              ) : (
                <>
                  <span>
                    Entra come {selectedRole === 'Responsabile' ? 'Responsabile' : selectedRole === 'Operatore' ? 'Operatore' : 'Amministratore'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & System Info Footer */}
          <div className="p-3 sm:px-6 py-2.5 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-500" />
              SM.I.LE80 Quantum Middleware
            </span>
            <span>mTLS 1.3 • 21 Algoritmi CUDA-Q</span>
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
