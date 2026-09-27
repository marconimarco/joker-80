import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  Radio, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bot, 
  Compass, 
  Layers, 
  CheckCircle2,
  X
} from 'lucide-react';
import { FactoryTenant } from '../types/quantum';
import { AvatarVoiceService } from '../services/avatarVoiceService';

interface GeminiLiveVoiceProps {
  activeTenant: FactoryTenant;
  userRole?: string;
  allowPlcWrite?: boolean;
  onChangeView?: (view: 'chat' | 'catalog' | 'notifications' | 'admin') => void;
  onOpenCompanyPlantSelector?: () => void;
}

export const GeminiLiveVoice: React.FC<GeminiLiveVoiceProps> = ({
  activeTenant,
  userRole,
  onChangeView,
  onOpenCompanyPlantSelector
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Assistenza Live Pronta');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Keep a ref to isActive to know inside callbacks
  const isActiveRef = useRef<boolean>(false);
  isActiveRef.current = isActive;

  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening, isSpeaking]);

  // Clean up on unmount or tenant switch
  useEffect(() => {
    return () => {
      AvatarVoiceService.stopListening();
      AvatarVoiceService.stopSpeaking();
    };
  }, [activeTenant.id]);

  /**
   * Helper that interprets what the user said, navigates if needed, and formulates spoken assistance
   */
  const processUserVoiceCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    let reply = '';

    // 1. Navigation intents
    if (lower.includes('catalogo') || lower.includes('21 calcoli') || lower.includes('algoritmi')) {
      onChangeView?.('catalog');
      reply = `Apro subito il Catalogo dei 21 calcoli quantistici per lo stabilimento ${activeTenant.nome}. Ogni calcolo ha un punto di domanda con le specifiche tecniche.`;
    } else if (lower.includes('notific') || lower.includes('allarm') || lower.includes('anomali') || lower.includes('fuori linea')) {
      onChangeView?.('notifications');
      reply = `Ti mostro le notifiche e le problematiche fuori linea rilevate sul gateway di ${activeTenant.nome}.`;
    } else if (lower.includes('chat') || lower.includes('terminal') || lower.includes('console')) {
      onChangeView?.('chat');
      reply = `Torniamo alla chat terminal interattiva per eseguire i calcoli con i parametri di fabbrica.`;
    } else if (lower.includes('cambia stabilimento') || lower.includes('azienda') || lower.includes('fabbrica') || lower.includes('stabilimenti')) {
      onOpenCompanyPlantSelector?.();
      reply = `Apro la pagina di selezione multi-stabilimento. Puoi scegliere l'azienda e il relativo impianto industriale.`;
    } else if (lower.includes('chi sei') || lower.includes('come ti chiami') || lower.includes('cosa fai')) {
      reply = `Sono l'assistente vocale live di JOKER 80 per ${activeTenant.nome}. Posso coordinare i 21 moduli quantistici, guidarti tra le sezioni o spiegarti parametri e anomalie.`;
    } else if (lower.includes('calcolo 1') || lower.includes('camion') || lower.includes('inbound')) {
      reply = `Il Calcolo 1 ottimizza l'ingresso dei camion e la saturazione del magazzino. Richiede il numero di camion in attesa, i minuti di ritardo e la saturazione dello SmartStore.`;
    } else if (lower.includes('bema') || lower.includes('fasciatore') || lower.includes('film')) {
      reply = `I fasciatori Bema Silkworm monitorano i giri al minuto e la tensione del film in Newton tramite i calcoli 14 e 15. Tutti i parametri sono telemetrati in tempo reale.`;
    } else if (lower.includes('lgv') || lower.includes('agv') || lower.includes('navette') || lower.includes('batteri')) {
      reply = `La flotta di navette automatiche LGV è monitorata per rotte e stato di carica della batteria tramite i calcoli 8, 9, 16 e 17.`;
    } else if (lower.includes('aiuto') || lower.includes('difficolt') || lower.includes('come funziona')) {
      reply = `Non preoccuparti! Nel catalogo puoi cliccare sul punto di domanda per vedere le specifiche CPU di ciascun calcolo. Nelle notifiche vedi le anomalie dell'impianto, e nella chat puoi inserire i parametri.`;
    } else {
      reply = `Ricevuto per lo stabilimento ${activeTenant.nome}. Posso aiutarti a navigare nel catalogo, vedere le notifiche o coordinare uno dei 21 calcoli CUDA-Q. Cosa preferisci fare?`;
    }

    setAssistantReply(reply);
    setStatusMessage(reply);

    // Speak response if not muted
    if (!isMuted) {
      AvatarVoiceService.speak(
        reply,
        'it-IT',
        'laila',
        () => {
          setIsSpeaking(true);
        },
        () => {
          setIsSpeaking(false);
          // Restart listening after speaking if still active
          if (isActiveRef.current) {
            startListeningLoop();
          }
        }
      );
    }
  }, [activeTenant.nome, isMuted, onChangeView, onOpenCompanyPlantSelector]);

  /**
   * Continuous Speech Recognition Loop while active
   */
  const startListeningLoop = useCallback(() => {
    if (!isActiveRef.current) return;

    setStatusMessage('In ascolto... Parla pure');
    setIsListening(true);

    AvatarVoiceService.startListening(
      'it-IT',
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 0) {
          setIsListening(false);
          processUserVoiceCommand(text);
        }
      },
      (error: any) => {
        console.warn('Voice listening note:', error);
        setIsListening(false);
        if (isActiveRef.current) {
          // Retry listening briefly after pause
          setTimeout(() => {
            if (isActiveRef.current) startListeningLoop();
          }, 1000);
        }
      },
      () => {
        setIsListening(false);
        if (isActiveRef.current && !isSpeaking) {
          setTimeout(() => {
            if (isActiveRef.current && !isSpeaking) startListeningLoop();
          }, 500);
        }
      }
    ).catch(err => {
      console.warn('Voice start listening failed', err);
      setIsListening(false);
    });
  }, [isSpeaking, processUserVoiceCommand]);

  /**
   * START VOCE
   */
  const handleStart = async () => {
    setIsActive(true);
    isActiveRef.current = true;
    setStatusMessage('Attivazione assistenza vocale in corso...');

    // 1. Initial verbal greeting
    const welcomeText = `Assistenza vocale attiva per ${activeTenant.nome}. Come posso aiutarti a coordinare i calcoli o a navigare nell'applicazione?`;
    setAssistantReply(welcomeText);

    if (!isMuted) {
      AvatarVoiceService.speak(
        welcomeText,
        'it-IT',
        'laila',
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          if (isActiveRef.current) {
            startListeningLoop();
          }
        }
      );
    } else {
      startListeningLoop();
    }
  };

  /**
   * STOP VOCE
   */
  const handleStop = () => {
    setIsActive(false);
    isActiveRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    AvatarVoiceService.stopListening();
    AvatarVoiceService.stopSpeaking();
    setStatusMessage('Assistenza vocale terminata');
    setTranscript('');
    setAssistantReply('');
  };

  const toggleMute = () => {
    if (isSpeaking) {
      AvatarVoiceService.stopSpeaking();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-2 sm:right-4 z-40 flex flex-col items-end gap-1.5 sm:gap-2 font-mono select-none max-w-[calc(100vw-1rem)]">
      {/* Active Conversation Bubble */}
      {isActive && (transcript || assistantReply || statusMessage) && (
        <div className="bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-3 sm:p-3.5 text-xs text-slate-200 max-w-[280px] sm:max-w-sm shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini 3.8 Live Voice Assistant</span>
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
              isSpeaking ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' : isListening ? 'bg-rose-500/20 text-rose-300 animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
              {isSpeaking ? 'PARLA VOCE' : isListening ? 'IN ASCOLTO' : 'ATTIVO'}
            </span>
          </div>

          {/* User speech */}
          {transcript && (
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300">
              <span className="text-[9px] font-bold text-slate-400 block mb-0.5">Hai detto:</span>
              <p className="italic">"{transcript}"</p>
            </div>
          )}

          {/* Assistant answer */}
          {assistantReply && (
            <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-100">
              <span className="text-[9px] font-bold text-cyan-400 block mb-0.5">Assistente JOKER 80:</span>
              <p className="leading-snug">{assistantReply}</p>
            </div>
          )}

          {!transcript && !assistantReply && (
            <p className="text-[11px] text-slate-400">
              Parla pure liberamente al microfono: ti guiderò tra i calcoli e le sezioni della fabbrica.
            </p>
          )}
        </div>
      )}

      {/* Floating Control Bar with explicit START / STOP button */}
      <div className={`bg-slate-900/95 border rounded-2xl sm:rounded-full px-3 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2.5 sm:gap-3 transition-all duration-300 ${
        isActive 
          ? 'border-cyan-400 shadow-cyan-500/20' 
          : 'border-slate-700/80 hover:border-slate-600'
      }`}>
        {/* Avatar Status Badge */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isSpeaking 
              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/50 scale-105' 
              : isListening 
              ? 'bg-gradient-to-tr from-rose-500 to-amber-500 animate-pulse' 
              : isActive
              ? 'bg-cyan-600'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            <Sparkles className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
          </div>

          {/* Wave ring if speaking or listening */}
          {(isListening || isSpeaking) && (
            <span className="absolute -inset-1 rounded-full border border-cyan-400/60 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Info & Dynamic Waveform */}
        <div className="flex flex-col pr-1 min-w-[110px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-200 tracking-tight">Gemini 3.8</span>
            <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
              isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              Voce Live
            </span>
          </div>

          {/* Audio Wave Visualizer */}
          <div className="flex items-center gap-0.5 h-2.5 mt-0.5">
            {[0.4, 0.9, 0.6, 0.8, 0.3, 0.7, 0.5].map((height, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full transition-all duration-75 bg-cyan-400"
                style={{
                  height: (isListening || isSpeaking)
                    ? `${Math.max(2, Math.min(10, Math.sin(i + (audioLevel * 10)) * 5 + 5))}px`
                    : '2px',
                  opacity: (isListening || isSpeaking) ? 0.9 : 0.3
                }}
              />
            ))}
            <span className="text-[9px] text-slate-400 ml-1 truncate max-w-[80px]">
              {isSpeaking ? 'Parlando...' : isListening ? 'In ascolto...' : isActive ? 'Attivo' : 'Spento'}
            </span>
          </div>
        </div>

        {/* EXPLICIT START / STOP BUTTON (As specifically requested by user) */}
        {!isActive ? (
          <button
            type="button"
            onClick={handleStart}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Avvia conversazione a voce in tempo reale (START)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>START</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/40 transition-all cursor-pointer animate-pulse hover:scale-105 active:scale-95"
            title="Ferma conversazione vocale (STOP)"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>STOP</span>
          </button>
        )}

        {/* Volume Mute Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Riattiva voce assistente' : 'Silenzia voce assistente'}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMuted
              ? 'bg-slate-800 text-slate-500 border border-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
