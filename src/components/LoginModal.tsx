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
import { UserAccount } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginModal: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [showQuickFill, setShowQuickFill] = useState(true);

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

    // Login successful - role and tenant are automatically resolved from user profile
    AuthStorage.setCurrentUser(found);
    onLoginSuccess(found);
  };

  const handleQuickLogin = (usr: string, pass: string) => {
    setUsername(usr);
    setPassword(pass);
    setError(null);
    const users = AuthStorage.getUsers();
    const found = users.find(u => u.username.toLowerCase() === usr.toLowerCase());
    if (found) {
      AuthStorage.setCurrentUser(found);
      onLoginSuccess(found);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />

        {/* Modal Brand Bar */}
        <div className="p-6 pb-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-white tracking-tight flex items-center gap-2">
                JOKER 80 <span className="text-cyan-400 font-normal text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">QUANTUM CORE</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Autenticazione Sicura al Middleware Industriale
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg">
            17 CUDA-Q ONLINE
          </span>
        </div>

        {/* Form Container */}
        <div className="p-6 pt-5 space-y-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nome Utente (Username)
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
              <label className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
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
                <strong className="block text-slate-200">Riconoscimento Automatico Ruolo & Sede</strong>
                <span className="text-slate-400 text-[11px] leading-relaxed">
                  Il sistema rileva automaticamente il tuo ruolo: se sei un <strong>Operatore</strong> verrai instradato direttamente ed esclusivamente nello stabilimento per cui lavori; se sei un <strong>Amministratore</strong> avrai accesso alla gestione globale.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <span>Accedi a JOKER 80</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Pre-configured Credentials Guide */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Accessi Rapidi Demo (Selezione Automatica):
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin')}
                  className="p-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/50 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-purple-300">Amministratore Globale</div>
                    <div className="text-[10px] text-slate-400">user: <code className="text-purple-200">admin</code> | pass: <code className="text-purple-200">admin</code></div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </button>

                {/* Operator Barilla */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('op_barilla', 'barilla')}
                  className="p-2.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/50 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-blue-300">Operatore Barilla (Pedrignano)</div>
                    <div className="text-[10px] text-slate-400">user: <code className="text-blue-200">op_barilla</code> | pass: <code className="text-blue-200">barilla</code></div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>

                {/* Operator Nestlé */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('op_nestle', 'nestle')}
                  className="p-2.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-red-300">Operatore Nestlé (Assago)</div>
                    <div className="text-[10px] text-slate-400">user: <code className="text-red-200">op_nestle</code> | pass: <code className="text-red-200">nestle</code></div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors" />
                </button>

                {/* Operator Sant'Anna */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('op_santanna', 'santanna')}
                  className="p-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/50 text-left transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-emerald-300">Operatore Sant'Anna (Vinadio)</div>
                    <div className="text-[10px] text-slate-400">user: <code className="text-emerald-200">op_santanna</code> | pass: <code className="text-emerald-200">santanna</code></div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
