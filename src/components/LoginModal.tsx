import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  User, 
  Key, 
  ArrowRight, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Lock, Scale, FileText } from 'lucide-react';
import { UserAccount } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';
import { LegalTermsModal } from './LegalTermsModal';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
  onLockPreAccess?: () => void;
}

export const LoginModal: React.FC<Props> = ({ onLoginSuccess, onLockPreAccess }) => {
  const [username, setUsername] = useState('resp_barilla');
  const [password, setPassword] = useState('barilla');
  const [error, setError] = useState<string | null>(null);
  const [showQuickFill, setShowQuickFill] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);

  const executeLogin = (foundUser: UserAccount) => {
    setIsSubmitting(true);
    AuthStorage.setCurrentUser(foundUser);
    onLoginSuccess(foundUser);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const users = AuthStorage.getUsers();
    const cleanUser = username.trim().toLowerCase();
    const found = users.find(
      u => u.username.toLowerCase() === cleanUser
    );

    if (!found) {
      setError(`Nessun account con username "${username}" trovato.`);
      return;
    }

    if (!found.attivo) {
      setError(`Questo account è stato disattivato dall'Amministratore.`);
      return;
    }

    if (found.password && found.password !== password) {
      setError('Password non corretta.');
      return;
    }

    executeLogin(found);
  };

  const handleQuickLogin = (usr: string, pass: string) => {
    setUsername(usr);
    setPassword(pass);
    setError(null);
    const users = AuthStorage.getUsers();
    const found = users.find(u => u.username.toLowerCase() === usr.toLowerCase());
    if (found) {
      executeLogin(found);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />

        {/* Modal Brand Bar */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
                JOKER 80 <span className="text-cyan-400 font-normal text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">QUANTUM</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                Autenticazione Middleware Industriale SM.I.LE80
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onLockPreAccess && (
              <button
                type="button"
                onClick={onLockPreAccess}
                title="Torna al pre-accesso con password master"
                className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Blocca Gateway</span>
              </button>
            )}
            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
              21 CUDA-Q
            </span>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 pt-3.5 sm:pt-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Username Identificativo
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                placeholder="Es. admin, op_barilla, op_nestle..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm text-white font-mono placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Password di Accesso
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Inserisci la tua password..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm text-white font-mono placeholder:text-slate-600"
              />
            </div>

            {/* Profile Auto-detection info card */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-200">Instradamento Automatico Ruolo & Sede</strong>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Se sei un <strong>Operatore</strong> o un <strong>Responsabile</strong> lavorerai esclusivamente sugli stabilimenti della tua società con i calcoli abilitati per i tuoi nodi; se sei un <strong>Amministratore</strong> avrai accesso alla gestione globale di tutti i siti industriali e dell'infrastruttura quantistica.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Accesso in corso...' : 'Accedi a JOKER 80'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Pre-configured Credentials Guide */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Accessi Rapidi Demo (Click Diretto):
              </span>
              <button
                type="button"
                onClick={() => setShowQuickFill(!showQuickFill)}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                {showQuickFill ? 'Nascondi' : 'Mostra'}
              </button>
            </div>

            {showQuickFill && (
              <div className="space-y-3 font-mono">
                {/* 1. SEZIONE RESPONSABILI DI STABILIMENTO */}
                <div>
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Responsabili di Stabilimento:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {/* Responsabile Barilla */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('resp_barilla', 'barilla')}
                      className="p-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/60 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-blue-300 text-[11px] truncate">Resp. Barilla (Ing. Giovanni)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Pedrignano, Novara, Foggia</div>
                        <div className="text-[9.5px] text-blue-400/80">user: <code className="text-blue-200">resp_barilla</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    </button>

                    {/* Responsabile Nestlé */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('resp_nestle', 'nestle')}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-red-300 text-[11px] truncate">Resp. Nestlé (Dott.ssa Conti)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Assago, Benevento, Perugia</div>
                        <div className="text-[9.5px] text-red-400/80">user: <code className="text-red-200">resp_nestle</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors shrink-0" />
                    </button>

                    {/* Responsabile Ferrero */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('resp_ferrero', 'ferrero')}
                      className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-amber-300 text-[11px] truncate">Resp. Ferrero (Ing. Ferrero)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Alba, Pozzuolo Martesana</div>
                        <div className="text-[9.5px] text-amber-400/80">user: <code className="text-amber-200">resp_ferrero</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    </button>

                    {/* Responsabile Sant'Anna */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('resp_santanna', 'santanna')}
                      className="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-emerald-300 text-[11px] truncate">Resp. Sant'Anna (Ing. Bertone)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Vinadio, Valli di Lanzo</div>
                        <div className="text-[9.5px] text-emerald-400/80">user: <code className="text-emerald-200">resp_santanna</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </button>
                  </div>
                </div>

                {/* 2. SEZIONE OPERATORI DI LINEA */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Operatori di Linea & Macchine:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {/* Operatore Barilla */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('op_barilla', 'barilla')}
                      className="p-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-slate-200 group-hover:text-blue-300 text-[11px] truncate">Op. Barilla (Luca Rossi)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Inbound & SmartStore • Pedrignano</div>
                        <div className="text-[9.5px] text-slate-500">user: <code className="text-blue-300">op_barilla</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                    </button>

                    {/* Operatore Nestlé */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('op_nestle', 'nestle')}
                      className="p-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-red-500/50 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-slate-200 group-hover:text-red-300 text-[11px] truncate">Op. Nestlé (Matteo Ferrari)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Fasciatori Bema & AGV • Assago</div>
                        <div className="text-[9.5px] text-slate-500">user: <code className="text-red-300">op_nestle</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-red-400 transition-colors shrink-0" />
                    </button>

                    {/* Operatore Ferrero */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('op_ferrero', 'ferrero')}
                      className="p-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-slate-200 group-hover:text-amber-300 text-[11px] truncate">Op. Ferrero (Marco Ferri)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Confezionamento & Navette • Alba</div>
                        <div className="text-[9.5px] text-slate-500">user: <code className="text-amber-300">op_ferrero</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
                    </button>

                    {/* Operatore Sant'Anna */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('op_santanna', 'santanna')}
                      className="p-2 rounded-lg bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors flex items-center justify-between group cursor-pointer shadow-xs"
                    >
                      <div className="min-w-0 pr-1">
                        <div className="font-bold text-slate-200 group-hover:text-emerald-300 text-[11px] truncate">Op. Sant'Anna (Chiara Galli)</div>
                        <div className="text-[9.5px] text-slate-400 truncate">Imbottigliamento & Fardelli • Vinadio</div>
                        <div className="text-[9.5px] text-slate-500">user: <code className="text-emerald-300">op_santanna</code></div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Documents Acknowledged notice */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] sm:text-[11px]">Termini Visionati: EULA, Disclaimer (89 Art.), NDA, Privacy</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLegalModal(true)}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer text-[10px] sm:text-[11px] shrink-0"
              >
                Rileggi Atti
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal terms viewer in viewOnly mode */}
      <LegalTermsModal
        isOpen={showLegalModal}
        viewOnly={true}
        onAccept={() => setShowLegalModal(false)}
        onDecline={() => setShowLegalModal(false)}
      />
    </div>
  );
};
