import React, { useState, useEffect } from 'react';
import { Mic, CheckCircle2, AlertTriangle, Volume2, ShieldCheck, X, RefreshCw, MessageSquare } from 'lucide-react';
import { AvatarVoiceService } from '../services/avatarVoiceService';

interface MicrophoneAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: (stream: MediaStream) => void;
  onUseTextMode: () => void;
  personaName?: string;
}

export const MicrophoneAccessModal: React.FC<MicrophoneAccessModalProps> = ({
  isOpen,
  onClose,
  onAccessGranted,
  onUseTextMode,
  personaName = 'Laila'
}) => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [requireConfirmationEveryTime, setRequireConfirmationEveryTime] = useState<boolean>(true);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage(null);
      setLiveVolume(0);
    } else {
      if (activeStream) {
        // don't close here if handed over to onAccessGranted
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Direct user-gesture click handler to trigger native browser prompt
  const handleRequestPermission = async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      const res = await AvatarVoiceService.requestMicrophonePermission();

      if (res.ok && res.stream) {
        setStatus('granted');
        setActiveStream(res.stream);

        // Live audio level meter
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          try {
            const ctx = new AudioCtxClass();
            const source = ctx.createMediaStreamSource(res.stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            const buffer = new Uint8Array(analyser.frequencyBinCount);

            const checkVolume = () => {
              if (ctx.state === 'closed') return;
              analyser.getByteFrequencyData(buffer);
              let sum = 0;
              for (let i = 0; i < buffer.length; i++) sum += buffer[i];
              const avg = sum / buffer.length;
              setLiveVolume(Math.min(100, Math.round(avg * 1.5)));
              requestAnimationFrame(checkVolume);
            };
            requestAnimationFrame(checkVolume);
          } catch (_) {}
        }
      } else {
        setStatus('denied');
        setErrorMessage(res.error || 'Accesso al microfono non consentito dal browser o dalle impostazioni di sistema.');
      }
    } catch (err: any) {
      setStatus('denied');
      setErrorMessage(err?.message || 'Accesso al microfono bloccato o negato dal browser.');
    }
  };

  const handleConfirmAndProceed = () => {
    if (activeStream) {
      onAccessGranted(activeStream);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/50 bg-slate-900 shadow-2xl p-5 text-slate-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Richiesta Accesso Microfono
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Conversazione Vocale JOKER 80 • {personaName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body based on Status */}
        {status === 'idle' && (
          <div className="space-y-3.5 text-xs text-slate-300">
            <p className="leading-relaxed">
              Per consentire a <strong className="text-cyan-400">{personaName}</strong> di ascoltare la tua voce e dialogare in tempo reale in oltre 90 lingue, è necessario autorizzare il microfono.
            </p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Sicurezza e Riservatezza</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                L'audio viene elaborato esclusivamente durante la sessione di conversazione attiva e non viene salvato.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer ring-2 ring-cyan-400/40 hover:scale-[1.01]"
              >
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Consenti e Attiva Microfono</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUseTextMode();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Preferisco scrivere nella chat</span>
              </button>
            </div>
          </div>
        )}

        {status === 'requesting' && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs font-semibold text-white">In attesa di autorizzazione...</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Se vedi una finestra del browser che richiede il permesso per il microfono, seleziona <strong>"Consenti"</strong>.
            </p>
          </div>
        )}

        {status === 'granted' && (
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Microfono Autorizzato con Successo!</p>
                <p className="text-[10px] text-emerald-200/80">Il segnale audio è pronto per parlare con {personaName}.</p>
              </div>
            </div>

            {/* Live Volume Meter Test */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Test Audio (Parla adesso):
                </span>
                <span className="text-cyan-300 font-bold">{liveVolume}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-75"
                  style={{ width: `${Math.max(4, liveVolume)}%` }}
                />
              </div>
            </div>

            {/* Confirmation on every access checkbox */}
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={requireConfirmationEveryTime}
                onChange={(e) => setRequireConfirmationEveryTime(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
              />
              <span>Richiedi conferma del microfono ad ogni accesso</span>
            </label>

            <button
              type="button"
              onClick={handleConfirmAndProceed}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Inizia a parlare con {personaName}</span>
            </button>
          </div>
        )}

        {status === 'denied' && (
          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-rose-300">Microfono non autorizzato</p>
                <p className="text-[10px] text-rose-200/90 leading-tight mt-1">{errorMessage}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-200">Come risolvere nel browser:</p>
              <ol className="list-decimal list-inside space-y-1 text-[10px]">
                <li>Clicca sull'icona a sinistra dell'URL (lucchetto 🔒 o permessi sito).</li>
                <li>Verifica che <strong>Microfono</strong> sia impostato su <strong>Consenti</strong>.</li>
                <li>Riprova premendo il pulsante qui sotto.</li>
              </ol>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Riprova Autorizzazione</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUseTextMode();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Usa la Console di Scrittura (Laila risponde a voce)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
