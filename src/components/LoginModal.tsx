import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  User, 
  Key, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Mic,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Volume2,
  Radio
} from 'lucide-react';
import { UserAccount } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';
import { AvatarVoiceService } from '../services/avatarVoiceService';

interface Props {
  onLoginSuccess: (user: UserAccount, startVoiceImmediately?: boolean) => void;
}

export const LoginModal: React.FC<Props> = ({ onLoginSuccess }) => {
  // Step 1: Credential verification, Step 2: Microphone Consent & Activation
  const [step, setStep] = useState<'credentials' | 'microphone_consent'>('credentials');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [showQuickFill, setShowQuickFill] = useState(true);

  // Microphone permission state during consent step
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  /**
   * Request microphone permission via explicit user click
   */
  const handleAuthorizeMicrophone = async () => {
    if (!pendingUser) return;
    setMicStatus('requesting');
    setMicErrorMessage(null);

    try {
      const res = await AvatarVoiceService.requestMicrophonePermission();

      if (res.ok && res.stream) {
        setMicStatus('granted');
        localStorage.setItem('joker_mic_permitted', 'true');
        localStorage.setItem('joker_mic_prompted', 'true');

        // Stop preview tracks
        try {
          res.stream.getTracks().forEach(t => t.stop());
        } catch (_) {}

        // Complete login and automatically launch voice assistant in listening mode
        setTimeout(() => {
          AuthStorage.setCurrentUser(pendingUser);
          onLoginSuccess(pendingUser, true);
        }, 600);
      } else {
        setMicStatus('denied');
        setMicErrorMessage(res.error || 'Accesso al microfono negato o non autorizzato dal browser.');
        localStorage.setItem('joker_mic_permitted', 'false');
      }
    } catch (err: any) {
      console.warn('[LoginModal] Microphone request failed:', err);
      setMicStatus('denied');
      setMicErrorMessage(err?.message || 'Accesso al microfono bloccato dal browser.');
      localStorage.setItem('joker_mic_permitted', 'false');
    }
  };

  /**
   * Proceed without microphone (keyboard input & quick actions)
   */
  const handleProceedWithoutMic = () => {
    if (!pendingUser) return;
    localStorage.setItem('joker_mic_permitted', 'false');
    localStorage.setItem('joker_mic_prompted', 'true');
    AuthStorage.setCurrentUser(pendingUser);
    onLoginSuccess(pendingUser, false);
  };

  /**
   * Validate credentials and advance to Step 2 (Microphone Consent)
   */
  const handleValidateAndProceedToConsent = (foundUser: UserAccount) => {
    setPendingUser(foundUser);
    setMicStatus('idle');
    setMicErrorMessage(null);
    setStep('microphone_consent');
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

    handleValidateAndProceedToConsent(found);
  };

  const handleQuickLogin = (usr: string, pass: string) => {
    setUsername(usr);
    setPassword(pass);
    setError(null);
    const users = AuthStorage.getUsers();
    const found = users.find(u => u.username.toLowerCase() === usr.toLowerCase());
    if (found) {
      handleValidateAndProceedToConsent(found);
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
                {step === 'microphone_consent' 
                  ? 'Abilitazione Microfono & Assistente Vocale' 
                  : 'Autenticazione Middleware Industriale'}
              </p>
            </div>
          </div>

          <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shrink-0">
            21 CUDA-Q
          </span>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 pt-3.5 sm:pt-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          
          {/* STEP 2: MANDATORY MICROPHONE AUTHORIZATION & CONSENT */}
          {step === 'microphone_consent' && pendingUser && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-200">
              {/* User badge */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
                    {pendingUser.nomeCompleto.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{pendingUser.nomeCompleto}</div>
                    <div className="text-[10px] text-cyan-300">{pendingUser.ruolo}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Cambia Account
                </button>
              </div>

              {/* Big Microphone Consent Centerpiece */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/40 flex flex-col items-center text-center space-y-3 relative overflow-hidden shadow-xl shadow-cyan-950/40">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/30 animate-pulse">
                    <Mic className="w-8 h-8" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-cyan-500/20 blur-sm -z-10 animate-ping opacity-60" />
                </div>

                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold font-mono text-white">
                    Consenso e Abilitazione Microfono
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Per permettere all'assistente vocale <strong>Laila</strong> di ascoltarti a mani libere e governare i 21 calcoli quantistici senza usare il mouse, è necessario concedere l'accesso al microfono nel browser.
                  </p>
                </div>

                {/* State Feedback */}
                {micStatus === 'granted' && (
                  <div className="w-full p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2 animate-in zoom-in-95 duration-150">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Microfono autorizzato con successo! Apertura chat...</span>
                  </div>
                )}

                {micStatus === 'denied' && (
                  <div className="w-full p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200 text-xs font-mono space-y-2 text-left">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{micErrorMessage || 'Accesso al microfono non consentito dal browser.'}</span>
                    </div>

                    {isInsideIframe && (
                      <div className="p-2.5 rounded-lg bg-amber-900/40 border border-amber-700/60 text-[11px] space-y-2">
                        <p className="text-amber-100 font-semibold">
                          Attenzione su smartphone / anteprima AI Studio:
                        </p>
                        <p className="text-[10px] text-amber-200/90 leading-tight">
                          Il riquadro di anteprima blocca l'hardware. Clicca il pulsante qui sotto per aprirlo a schermo intero nella scheda principale di Chrome:
                        </p>
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Apri a Schermo Intero (Nuova Scheda)</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="w-full space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAuthorizeMicrophone}
                    disabled={micStatus === 'requesting' || micStatus === 'granted'}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    {micStatus === 'requesting' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Richiesta permesso in corso nel browser...</span>
                      </>
                    ) : micStatus === 'granted' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Autorizzato! Entro nell'app...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 text-cyan-200 animate-pulse" />
                        <span>CONSENTI E ABILITA MICROFONO SUBITO</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedWithoutMic}
                    disabled={micStatus === 'requesting' || micStatus === 'granted'}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Entra senza microfono (Modalità Tastiera & Comandi Rapidi)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* What happens next note */}
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-[11px] font-mono text-slate-400 flex items-start gap-2">
                <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Appena concesso il consenso, verrai reindirizzato direttamente alla <strong>Chat Terminal</strong> con l'assistente vocale <strong>Laila già aperta e in ascolto continuo</strong>, senza dover toccare il mouse.
                </span>
              </div>
            </div>
          )}

          {/* STEP 1: CREDENTIALS & DEMO QUICK ACCESS */}
          {step === 'credentials' && (
            <>
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
                    <strong className="block text-slate-200">Riconoscimento Automatico Ruolo & Sede</strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">
                      Il sistema rileva automaticamente il tuo ruolo: se sei un <strong>Operatore</strong> verrai instradato direttamente ed esclusivamente nello stabilimento per cui lavori; se sei un <strong>Amministratore</strong> avrai accesso alla gestione globale.
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Verifica Credenziali e Consenso Microfono</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin', 'admin')}
                      className="p-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
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
                      className="p-2.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
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
                      className="p-2.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
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
                      className="p-2.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
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
            </>
          )}

        </div>
      </div>
    </div>
  );
};
