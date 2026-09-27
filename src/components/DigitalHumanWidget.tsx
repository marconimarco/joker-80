import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Minimize2, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Globe, 
  Sparkles, 
  Cpu, 
  RotateCcw, 
  Play, 
  Radio, 
  UserCheck, 
  ExternalLink,
  Bot,
  Activity,
  Layers,
  Wand2,
  X,
  Search,
  AlertTriangle
} from 'lucide-react';
import { 
  AvatarVoiceService, 
  SUPPORTED_LANGUAGES_90, 
  SupportedLanguage, 
  LipSyncViseme 
} from '../services/avatarVoiceService';
import { FactoryTenant, QuantumCalculationMeta } from '../types/quantum';
import { QuantumRouterService } from '../services/quantumRouter';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { AnimatedDigitalHumanFace } from './AnimatedDigitalHumanFace';
import { MicrophoneAccessModal } from './MicrophoneAccessModal';

interface DigitalHumanWidgetProps {
  activeTenant: FactoryTenant;
  userRole?: string;
  allowPlcWrite?: boolean;
  onOpenCircuit?: (calc: QuantumCalculationMeta, state?: string) => void;
  onExecuteCalculation?: (calcId: number, inputs: Record<string, any>) => void;
  onNavigateToView?: (view: 'chat' | 'catalog' | 'notifications' | 'telemetry' | 'admin') => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'avatar';
  text: string;
  timestamp: string;
  calcId?: number;
  actionSuggestion?: string;
}

export const DigitalHumanWidget: React.FC<DigitalHumanWidgetProps> = ({
  activeTenant,
  userRole = 'Operatore',
  allowPlcWrite = false,
  onOpenCircuit,
  onExecuteCalculation,
  onNavigateToView
}) => {
  // Widget display mode: 'docked' (open right panel), 'minimized' (compact floating avatar pill)
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Avatar persona: 'laila' (Female Senior AI Specialist) | 'marco' (Male Industrial Lead)
  const [persona, setPersona] = useState<'laila' | 'marco'>('laila');

  // Multi-language selection (90+ languages)
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(
    () => SUPPORTED_LANGUAGES_90.find(l => l.code === 'it-IT') || SUPPORTED_LANGUAGES_90[0]
  );
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');

  // Audio / Speech State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showMicModal, setShowMicModal] = useState<boolean>(false);
  const [isMicPermissionGranted, setIsMicPermissionGranted] = useState<boolean>(false);

  // Secondary Chat Drawer: "E nel caso ovviamente se devo scrivere qualcosa su cui fare, venga fuori la chat dopo"
  const [showChatDrawer, setShowChatDrawer] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome-1',
      sender: 'avatar',
      text: `Ciao! Sono Laila, il tuo assistente reale e specialista di automazione per ${activeTenant.nome}. Puoi parlare direttamente con me a voce in oltre 90 lingue!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Real-time lip-sync & voice driving state
  const [viseme, setViseme] = useState<LipSyncViseme>({
    mouthOpen: 0,
    mouthWidth: 0.5,
    jawOpen: 0,
    eyebrowRaise: 0,
    isBlinking: false
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to voice service lip-sync updates
  useEffect(() => {
    const unsubViseme = AvatarVoiceService.subscribeViseme((v) => {
      setViseme(v);
    });
    const unsubAudio = AvatarVoiceService.subscribeAudioLevel((lvl) => {
      setAudioLevel(lvl);
    });

    return () => {
      unsubViseme();
      unsubAudio();
      AvatarVoiceService.stopSpeaking();
      AvatarVoiceService.stopListening();
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChatDrawer]);

  // Handle conversational speech response from Gemini or JOKER 80 domain engine
  const handleProcessSpeech = useCallback(async (userSpeechText: string) => {
    if (!userSpeechText.trim()) return;

    setIsProcessing(true);
    setIsListening(false);
    AvatarVoiceService.stopListening();

    const userMsg: MessageItem = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userSpeechText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setTranscript('');

    try {
      // 1. Try server-side Gemini 3.8 Flash endpoint with plant topology & language context
      const res = await fetch('/api/avatar/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userSpeechText,
          language: selectedLang.code,
          languageName: selectedLang.name,
          persona: persona,
          activePlant: activeTenant.nome,
          plantTopology: activeTenant.plantTopology,
          conversationHistory: messages.slice(-4).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });

      let replyText = '';
      let calcId: number | undefined;

      if (res.ok) {
        const data = await res.json();
        replyText = data.replyText;
        calcId = data.detectedCalculationId;
      } else {
        throw new Error('Fallback to local intelligence');
      }

      // Add avatar response
      const avatarMsg: MessageItem = {
        id: 'reply-' + Date.now(),
        sender: 'avatar',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calcId
      };
      setMessages(prev => [...prev, avatarMsg]);

      // Speak response aloud in user's selected language
      if (!isMuted) {
        setIsSpeaking(true);
        AvatarVoiceService.speak(
          replyText,
          selectedLang.code,
          persona,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } catch (err) {
      console.warn('[Avatar Conversational fallback]', err);
      // Local client fallback: use QuantumRouterService for real industrial intelligence
      const routeRes = await QuantumRouterService.routeAndSolve(userSpeechText, activeTenant);

      let reply = routeRes.introduzione;
      if (routeRes.azione_immediata) {
        reply += ` Raccomandazione operativa: ${routeRes.azione_immediata}`;
      }

      const avatarMsg: MessageItem = {
        id: 'reply-' + Date.now(),
        sender: 'avatar',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calcId: routeRes.calcolo_id
      };
      setMessages(prev => [...prev, avatarMsg]);

      if (!isMuted) {
        setIsSpeaking(true);
        AvatarVoiceService.speak(
          reply,
          selectedLang.code,
          persona,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLang, persona, activeTenant, messages, isMuted, userRole]);

  // Toggle voice recognition listening with async permission handling
  // Handle start listening with permission check & modal trigger
  const handleToggleListening = async () => {
    setMicError(null);
    if (isListening) {
      AvatarVoiceService.stopListening();
      setIsListening(false);
      if (transcript.trim()) {
        handleProcessSpeech(transcript);
      }
      return;
    }

    // Explicitly prompt the user to confirm/grant microphone access
    if (!isMicPermissionGranted) {
      setShowMicModal(true);
      return;
    }

    await startListeningDirectly();
  };

  const startListeningDirectly = async () => {
    if (isSpeaking) {
      AvatarVoiceService.stopSpeaking();
      setIsSpeaking(false);
    }

    setIsListening(true);
    const res = await AvatarVoiceService.startListening(
      selectedLang.code,
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 2) {
          handleProcessSpeech(text);
        }
      },
      (err) => {
        console.warn('[Voice Recognition Error]', err);
        setMicError(err?.message || 'Accesso al microfono non consentito');
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (!res.success) {
      setIsListening(false);
      setMicError(res.error || 'Impossibile avviare il microfono');
      setShowMicModal(true);
    }
  };

  // Immediate voice greeting / speaker test
  const handleTestVoice = () => {
    setMicError(null);
    setIsSpeaking(true);
    const greetingText = persona === 'laila'
      ? `Ciao! Sono Laila, il tuo assistente reale per ${activeTenant.nome}. Il mio sintetizzatore vocale è attivo e posso parlare con te in oltre 90 lingue!`
      : `Ciao! Sono Marco, responsabile navette LGV e logistica SM.I.LE80. La voce è attiva e ti ascolto.`;

    AvatarVoiceService.speak(
      greetingText,
      selectedLang.code,
      persona,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Submit text input via Keyboard Drawer
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    const query = textInput;
    setTextInput('');
    handleProcessSpeech(query);
  };

  // Switch persona (Laila <-> Marco)
  const handleTogglePersona = () => {
    const next = persona === 'laila' ? 'marco' : 'laila';
    setPersona(next);
    AvatarVoiceService.stopSpeaking();
    setIsSpeaking(false);
    setMicError(null);

    const greeting = next === 'marco' 
      ? `Piacere! Sono Marco, responsabile dei sistemi navette LGV e logistica SM.I.LE80. Come posso supportare il tuo turno a ${activeTenant.nome}?`
      : `Ciao! Sono di nuovo Laila, specialista di controllo predittivo e fasciatori Bema Silkworm. Sono qui per aiutarti.`;

    const switchMsg: MessageItem = {
      id: 'sw-' + Date.now(),
      sender: 'avatar',
      text: greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, switchMsg]);

    if (!isMuted) {
      setIsSpeaking(true);
      AvatarVoiceService.speak(
        greeting,
        selectedLang.code,
        next,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  // Filtered languages for selection
  const filteredLanguages = SUPPORTED_LANGUAGES_90.filter(l => 
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const avatarImgUrl = persona === 'laila' ? '/avatars/laila.jpg' : '/avatars/marco.jpg';
  const personaTitle = persona === 'laila' ? 'Laila • AI Digital Twin Specialist' : 'Marco • LGV Systems Lead';

  // Floating Minimized Button (Pill at bottom-right or docked bead)
  if (isMinimized) {
    return (
      <aside 
        aria-label="Assistente Digitale Persona Reale JOKER 80"
        className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-2 group"
      >
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsMobileOpen(true);
          }}
          className="flex items-center gap-2.5 p-1.5 pr-3.5 rounded-full bg-slate-900/95 border-2 border-cyan-500/60 shadow-2xl backdrop-blur-md hover:border-cyan-400 hover:scale-105 transition-all text-left cursor-pointer group"
          title="Apri Persona Reale JOKER 80 (Laila / Marco - 90+ Lingue)"
        >
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-cyan-400/80 shrink-0 shadow-inner">
            <img 
              src={avatarImgUrl} 
              alt={persona === 'laila' ? 'Laila' : 'Marco'} 
              className="w-full h-full object-cover" 
            />
            {isSpeaking && (
              <span className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-ping pointer-events-none" />
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                {persona === 'laila' ? 'Laila' : 'Marco'}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                {selectedLang.flag}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Mic className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              Parla con {persona === 'laila' ? 'Laila' : 'Marco'}
            </span>
          </div>
        </button>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Backdrop when modal open */}
      {isMobileOpen && (
        <div 
          className="sm:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Right-Side Digital Human Panel */}
      <aside 
        aria-label="Pannello Persona Reale Gemini JOKER 80"
        className={`fixed z-40 transition-all duration-300 ease-out flex flex-col ${
          // Mobile style
          'inset-x-2 bottom-16 max-h-[85vh] sm:inset-auto ' +
          // Desktop docked style on the right
          'sm:right-4 sm:top-18 sm:bottom-8 sm:w-[380px] lg:w-[410px] sm:max-h-[calc(100vh-6.5rem)]'
        } ${isMobileOpen ? 'flex' : 'hidden sm:flex'} rounded-2xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpeaking ? 'bg-cyan-400' : isListening ? 'bg-emerald-400' : 'bg-emerald-500'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isSpeaking ? 'bg-cyan-500' : isListening ? 'bg-emerald-500' : 'bg-emerald-400'
              }`} />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  {persona === 'laila' ? 'Laila' : 'Marco'}
                  <span className="text-[10px] text-cyan-400 font-mono font-normal">
                    (Persona Reale)
                  </span>
                </span>
              </div>
              <span className="text-[9px] text-slate-400 truncate max-w-[170px]">
                {personaTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Persona Switcher */}
            <button
              onClick={handleTogglePersona}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-[10px] text-slate-300 hover:text-white font-mono flex items-center gap-1 border border-slate-700/60 transition-colors"
              title="Cambia persona reale (Laila / Marco)"
            >
              <UserCheck className="w-3 h-3 text-cyan-400" />
              <span>{persona === 'laila' ? 'Marco' : 'Laila'}</span>
            </button>

            {/* Mic Permission Status / Re-request Button */}
            <button
              type="button"
              onClick={() => setShowMicModal(true)}
              className={`px-1.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition-colors ${
                isMicPermissionGranted
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title={isMicPermissionGranted ? 'Microfono attivo e confermato (clicca per testare)' : 'Richiedi accesso al microfono'}
            >
              <Mic className="w-3 h-3 text-cyan-400" />
              <span className="hidden xs:inline">{isMicPermissionGranted ? 'Mic OK' : 'Abilita Mic'}</span>
            </button>

            {/* Language Selector Button */}
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-[10px] text-slate-200 font-mono flex items-center gap-1 border border-slate-700/60 transition-colors relative"
              title="Seleziona lingua (oltre 90 lingue supportate)"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{selectedLang.flag} {selectedLang.code.split('-')[0].toUpperCase()}</span>
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={() => {
                if (isSpeaking) AvatarVoiceService.stopSpeaking();
                setIsMuted(!isMuted);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Attiva voce' : 'Disattiva voce'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            </button>

            {/* Minimize / Close */}
            <button
              onClick={() => {
                setIsMinimized(true);
                setIsMobileOpen(false);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Riduci a icona"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 90+ Languages Dropdown Popover */}
        {showLangMenu && (
          <div className="absolute top-12 right-2 left-2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 max-h-72 flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Scegli Lingua di Conversazione (90+ Lingue)
              </span>
              <button 
                onClick={() => setShowLangMenu(false)}
                className="p-0.5 rounded text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative my-2">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="Cerca lingua (es. Italiano, Español, English, 中文)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangMenu(false);
                    setLangSearch('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                    selectedLang.code === lang.code
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <span className="font-medium text-white">{lang.name}</span>
                    <span className="text-[10px] text-slate-400">({lang.nativeName})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{lang.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photorealistic Digital Human Avatar 60fps Animated Face with Breathing, Blinking & Lip-Sync */}
        <AnimatedDigitalHumanFace
          avatarImgUrl={avatarImgUrl}
          isSpeaking={isSpeaking}
          isListening={isListening}
          isProcessing={isProcessing}
          audioLevel={audioLevel}
          viseme={viseme}
          personaName={persona === 'laila' ? 'Laila' : 'Marco'}
          plantName={activeTenant.nome}
        />

        {/* Live Subtitle Transcript Banner */}
        <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-200 min-h-[46px] flex flex-col justify-center shrink-0">
          {transcript ? (
            <p className="italic text-cyan-300 text-xs flex items-center gap-1.5">
              <Mic className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>"{transcript}"</span>
            </p>
          ) : messages.length > 0 ? (
            <p className="text-[11px] text-slate-300 line-clamp-2">
              <strong className="text-cyan-400">{messages[messages.length - 1].sender === 'avatar' ? (persona === 'laila' ? 'Laila: ' : 'Marco: ') : 'Tu: '}</strong>
              {messages[messages.length - 1].text}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              Tocca il microfono o usa la tastiera per iniziare a parlare.
            </p>
          )}
        </div>

        {/* Microphone Error Notification Banner (with diagnostic feedback & retry) */}
        {micError && (
          <div className="mx-2.5 my-2 p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-[11px] text-rose-200 flex items-start gap-2 shadow-lg shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-300">Stato Microfono:</p>
              <p className="text-[10px] text-rose-200/90 leading-tight mt-0.5">{micError}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Riprova Microfono
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMicError(null);
                    setShowChatDrawer(true);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  Scrivi Comandi
                </button>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setMicError(null)} 
              className="p-1 rounded text-rose-400 hover:text-white shrink-0"
              title="Chiudi avviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Primary Interaction Buttons (Voice + Test Voice + Chat Drawer Toggle) */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 shrink-0">
          {/* Main Push-To-Talk Microphone Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : isSpeaking
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white ring-2 ring-cyan-400/30'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Interrompi & Invia</span>
              </>
            ) : isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Ferma Voce</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Parla con {persona === 'laila' ? 'Laila' : 'Marco'}</span>
              </>
            )}
          </button>

          {/* Test Voice / Speaker Button */}
          <button
            type="button"
            onClick={handleTestVoice}
            className="p-2.5 rounded-xl border bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 border-slate-700/80 transition-all cursor-pointer"
            title={`Ascolta saluto vocale di prova di ${persona === 'laila' ? 'Laila' : 'Marco'}`}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Secondary Keyboard / Chat Toggle ("E nel caso se devo scrivere qualcosa su cui fare, venga fuori la chat dopo") */}
          <button
            type="button"
            onClick={() => setShowChatDrawer(!showChatDrawer)}
            className={`p-2.5 rounded-xl border font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${
              showChatDrawer
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/80 hover:text-white'
            }`}
            title={showChatDrawer ? 'Chiudi console di scrittura' : 'Apri console di scrittura (scrivi comandi)'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Chat Drawer (Visible when user wants to type or view details) */}
        {showChatDrawer && (
          <div className="flex-1 min-h-[180px] max-h-[280px] flex flex-col bg-slate-950/80 border-t border-slate-800 overflow-hidden">
            {/* Quick Action Pills for Plant Operations */}
            <div className="p-2 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
              <span className="text-[10px] font-mono text-slate-500 shrink-0">Rapidi:</span>
              <button
                type="button"
                onClick={() => handleProcessSpeech("Come stanno i fasciatori Bema Silkworm e le vibrazioni?")}
                className="px-2 py-0.8 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 font-mono whitespace-nowrap shrink-0 transition-colors"
              >
                Fasciatori Bema
              </button>
              <button
                type="button"
                onClick={() => handleProcessSpeech("Verifica stato batterie e rotte navette LGV")}
                className="px-2 py-0.8 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300 font-mono whitespace-nowrap shrink-0 transition-colors"
              >
                Flotta LGV
              </button>
              <button
                type="button"
                onClick={() => handleProcessSpeech("Ottimizza saturazione baie di carico camion")}
                className="px-2 py-0.8 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-purple-300 font-mono whitespace-nowrap shrink-0 transition-colors"
              >
                Baie Camion
              </button>
            </div>

            {/* Message History Feed */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs font-sans custom-scrollbar">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl p-2.5 ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-md'
                  }`}>
                    <p className="text-xs leading-relaxed">{m.text}</p>
                    
                    {/* If message references a calculation, offer 1-click execution or circuit preview */}
                    {m.calcId && (
                      <div className="mt-2 pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-cyan-400" />
                          Calcolo #{m.calcId}
                        </span>
                        <div className="flex items-center gap-1">
                          {onOpenCircuit && (
                            <button
                              type="button"
                              onClick={() => {
                                const meta = QUANTUM_CALCULATIONS.find(c => c.id === m.calcId);
                                if (meta) onOpenCircuit(meta);
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[9px] font-mono text-slate-200 transition-colors"
                            >
                              Circuito
                            </button>
                          )}
                          {onExecuteCalculation && (
                            <button
                              type="button"
                              onClick={() => onExecuteCalculation(m.calcId!, {})}
                              className="px-1.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-[9px] font-mono text-white font-bold transition-colors"
                            >
                              Esegui
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-0.5 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Text Input Form */}
            <form onSubmit={handleSendText} className="p-2 border-t border-slate-800 bg-slate-900/80 flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Scrivi un comando, domanda o parametro..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* Explicit Microphone Access Request Modal */}
      <MicrophoneAccessModal
        isOpen={showMicModal}
        onClose={() => setShowMicModal(false)}
        onAccessGranted={(_stream) => {
          setIsMicPermissionGranted(true);
          setShowMicModal(false);
          setMicError(null);
          startListeningDirectly();
        }}
        onUseTextMode={() => {
          setShowChatDrawer(true);
          setShowMicModal(false);
        }}
        personaName={persona === 'laila' ? 'Laila' : 'Marco'}
      />
    </>
  );
};
