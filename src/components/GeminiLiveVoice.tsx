import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Radio, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bot, 
  Layers, 
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  Send,
  HelpCircle,
  Cpu,
  Building2,
  Bell,
  Terminal
} from 'lucide-react';
import { FactoryTenant, QuantumCalculationMeta } from '../types/quantum';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { AvatarVoiceService } from '../services/avatarVoiceService';

interface GeminiLiveVoiceProps {
  activeTenant: FactoryTenant;
  tenants: FactoryTenant[];
  userRole?: string;
  allowPlcWrite?: boolean;
  onChangeView?: (view: 'chat' | 'catalog' | 'notifications' | 'admin') => void;
  onOpenCompanyPlantSelector?: () => void;
  onSelectTenant?: (tenant: FactoryTenant) => void;
  onExecuteVoiceQuery?: (query: string) => void;
  onOpenCircuit?: (calc: QuantumCalculationMeta) => void;
  onRefreshScan?: () => void;
}

export const GeminiLiveVoice: React.FC<GeminiLiveVoiceProps> = ({
  activeTenant,
  tenants,
  userRole,
  onChangeView,
  onOpenCompanyPlantSelector,
  onSelectTenant,
  onExecuteVoiceQuery,
  onOpenCircuit,
  onRefreshScan
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastRecognizedCommand, setLastRecognizedCommand] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Assistente Vocale Live Pronto');
  const [textCommand, setTextCommand] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Keep a ref to isActive and isSpeaking to avoid stale state in async callbacks
  const isActiveRef = useRef<boolean>(false);
  isActiveRef.current = isActive;
  const isSpeakingRef = useRef<boolean>(false);
  isSpeakingRef.current = isSpeaking;

  // Visual audio pulse
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.75 + 0.25);
      }, 120);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening, isSpeaking]);

  // Clean up voice on unmount or tenant switch
  useEffect(() => {
    return () => {
      AvatarVoiceService.stopListening();
      AvatarVoiceService.stopSpeaking();
    };
  }, [activeTenant.id]);

  /**
   * Continuous Speech Recognition Loop while active
   */
  const startListeningLoop = useCallback(() => {
    if (!isActiveRef.current || isSpeakingRef.current) return;

    setStatusMessage('In ascolto continuo... Parla pure');
    setIsListening(true);

    AvatarVoiceService.startListening(
      'it-IT',
      (text: string, isFinal: boolean) => {
        setTranscript(text);
        if (isFinal && text.trim().length > 1) {
          // Immediately stop recognition before processing and answering
          AvatarVoiceService.stopListening();
          setIsListening(false);
          setLastRecognizedCommand(text.trim());
          handleVoiceCommand(text.trim());
        }
      },
      (error: any) => {
        console.warn('[GeminiLiveVoice] Listening note:', error);
        setIsListening(false);
        if (isActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && !isSpeakingRef.current) {
              startListeningLoop();
            }
          }, 800);
        }
      },
      () => {
        setIsListening(false);
        if (isActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && !isSpeakingRef.current) {
              startListeningLoop();
            }
          }, 400);
        }
      }
    ).catch(err => {
      console.warn('[GeminiLiveVoice] startListening failed:', err);
      setIsListening(false);
    });
  }, []);

  /**
   * Speak response and resume listening once done
   */
  const speakReply = useCallback((replyText: string) => {
    setAssistantReply(replyText);
    setStatusMessage(replyText);

    if (isMuted) {
      // If muted, resume listening shortly
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) startListeningLoop();
        }, 1000);
      }
      return;
    }

    setIsSpeaking(true);
    isSpeakingRef.current = true;
    AvatarVoiceService.stopListening();

    AvatarVoiceService.speak(
      replyText,
      'it-IT',
      'laila',
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // Resume listening automatically if still active
        if (isActiveRef.current) {
          setTimeout(() => {
            if (isActiveRef.current) {
              startListeningLoop();
            }
          }, 300);
        }
      }
    );
  }, [isMuted, startListeningLoop]);

  /**
   * Process and execute user voice commands across the entire application
   */
  const handleVoiceCommand = useCallback((rawText: string) => {
    const text = rawText.toLowerCase().trim();
    let reply = '';

    // 1. QUESTION ABOUT THE LOCKS (Lucchetto Aperto e Lucchetto Chiuso)
    if (
      text.includes('lucchetto') || 
      text.includes('lucchetti') || 
      text.includes('chiave') ||
      text.includes('aperto e chiuso')
    ) {
      reply = `Ti spiego i lucchetti: il lucchetto chiuso indica l'Entanglement Quantistico Obbligatorio tra variabili interconnesse, come camion e saturazione magazzino, che usano porte CNOT. Il lucchetto aperto indica invece un calcolo locale o facoltativo, che opera su una singola variabile o nodo indipendente.`;
      speakReply(reply);
      return;
    }

    // 2. SWITCH PLANT DIRECTLY BY VOICE
    const foundTenant = tenants.find(t => {
      const tName = t.nome.toLowerCase();
      const tAzienda = (t.azienda || '').toLowerCase();
      const tSito = (t.sito || '').toLowerCase();
      const tId = t.id.toLowerCase();

      // Check if command explicitly mentions plant or city or company
      if (text.includes(tId)) return true;
      if (text.includes('novara') && tId.includes('novara')) return true;
      if (text.includes('foggia') && tId.includes('foggia')) return true;
      if (text.includes('pedrignano') && tId === 'barilla') return true;
      if (text.includes('assago') && tId === 'nestle') return true;
      if (text.includes('benevento') && tId.includes('benevento')) return true;
      if (text.includes('perugia') && tId.includes('perugia')) return true;
      if (text.includes('vinadio') && tId === 'santanna') return true;
      if (text.includes('lanzo') && tId.includes('lanzo')) return true;
      if (text.includes('bologna') && tId.includes('bologna')) return true;
      if (text.includes('pasturana') && tId.includes('pasturana')) return true;
      if (text.includes('viano') && tId === 'elettric80') return true;
      if (text.includes('dolo') && tId.includes('dolo')) return true;

      // Or company mention
      if (text.includes('barilla') && !text.includes('novara') && !text.includes('foggia') && tId === 'barilla') return true;
      if (text.includes('nestle') && !text.includes('benevento') && !text.includes('perugia') && tId === 'nestle') return true;
      if (text.includes("sant'anna") && !text.includes('lanzo') && tId === 'santanna') return true;
      if (text.includes('granarolo') && !text.includes('pasturana') && tId.includes('bologna')) return true;
      if (text.includes('elettric') && !text.includes('dolo') && tId === 'elettric80') return true;

      return false;
    });

    if (foundTenant && (text.includes('passa') || text.includes('metti') || text.includes('vai a') || text.includes('seleziona') || text.includes('apri') || text.includes('cambia'))) {
      onSelectTenant?.(foundTenant);
      reply = `Impianto selezionato: ${foundTenant.nome}. Ho ricaricato i dati di fabbrica e aggiornato istantaneamente le notifiche per questo stabilimento.`;
      speakReply(reply);
      return;
    }

    // 3. OPEN COMPANY / PLANT SELECTOR MODAL
    if (
      text.includes('cambia stabilimento') || 
      text.includes('seleziona stabilimento') || 
      text.includes('elenco stabilimenti') || 
      text.includes('cambia fabbrica') ||
      text.includes('seleziona azienda') ||
      text.includes('mostra aziende')
    ) {
      onOpenCompanyPlantSelector?.();
      reply = `Apro la pagina di selezione per scegliere azienda e stabilimento. Puoi cliccare su una qualsiasi azienda per vedere i suoi stabilimenti.`;
      speakReply(reply);
      return;
    }

    // 4. NAVIGATION TO NOTIFICATIONS
    if (
      text.includes('notific') || 
      text.includes('allarm') || 
      text.includes('anomali') || 
      text.includes('critici') || 
      text.includes('fuori linea')
    ) {
      onChangeView?.('notifications');
      reply = `Ti porto alle Notifiche e agli Allarmi dello stabilimento ${activeTenant.nome}. Qui vedi i log telemetrici e le misure di sicurezza.`;
      speakReply(reply);
      return;
    }

    // 5. NAVIGATION TO CATALOG (21 CALCULATIONS)
    if (
      text.includes('catalogo') || 
      text.includes('21 calcoli') || 
      text.includes('tutti i calcoli') || 
      text.includes('algoritmi')
    ) {
      onChangeView?.('catalog');
      reply = `Apro il Catalogo dei 21 Calcoli. Su ogni calcolo trovi il punto di domanda con la telemetria CPU e i parametri specifici.`;
      speakReply(reply);
      return;
    }

    // 6. NAVIGATION TO CHAT / TERMINAL
    if (
      text.includes('terminale') || 
      text.includes('chat') || 
      text.includes('console') || 
      text.includes('schermata principale')
    ) {
      onChangeView?.('chat');
      reply = `Torniamo alla Chat Terminal per interagire direttamente con il processore quantistico.`;
      speakReply(reply);
      return;
    }

    // 7. NAVIGATION TO ADMIN PANEL
    if (
      text.includes('admin') || 
      text.includes('amministrazione') || 
      text.includes('impostazioni')
    ) {
      onChangeView?.('admin');
      reply = `Apro il Pannello di Amministrazione per la gestione delle frequenze dei demoni e la configurazione dei tenant.`;
      speakReply(reply);
      return;
    }

    // 8. REFRESH / SCAN TELEMETRY
    if (
      text.includes('aggiorna telemetria') || 
      text.includes('scansiona') || 
      text.includes('scarica telemetria') || 
      text.includes('nuova scansione')
    ) {
      onRefreshScan?.();
      reply = `Ho avviato il download della telemetria in tempo reale dal gateway di ${activeTenant.nome} ed eseguito i 21 circuiti quantistici.`;
      speakReply(reply);
      return;
    }

    // 9. OPEN QUANTUM CIRCUIT MODAL
    if (text.includes('circuito') || text.includes('diagramma') || text.includes('porte quantistiche') || text.includes('cnot')) {
      // Find which calculation is requested, or default to 1
      const calcMatch = QUANTUM_CALCULATIONS.find(c => text.includes(`calcolo ${c.id}`) || text.includes(`numero ${c.id}`)) || QUANTUM_CALCULATIONS[0];
      onOpenCircuit?.(calcMatch);
      reply = `Apro il diagramma del circuito quantistico CUDA-Q per il Calcolo ${calcMatch.id}: ${calcMatch.name}.`;
      speakReply(reply);
      return;
    }

    // 10. RUN QUANTUM CALCULATIONS DIRECTLY (HANDS-FREE EXECUTION!)
    let targetCalcId: number | null = null;
    let customQuery = '';

    // Check by calculation number: "calcolo 1", "calcolo 2", ... "calcolo 21"
    for (let i = 1; i <= 21; i++) {
      if (text.includes(`calcolo ${i}`) || text.includes(`calcolo numero ${i}`) || text.includes(`fai il ${i}`) || text.includes(`esegui il ${i}`)) {
        targetCalcId = i;
        break;
      }
    }

    // Check by domain keywords if number wasn't explicitly said
    if (!targetCalcId) {
      if (text.includes('camion') || text.includes('inbound') || text.includes('piazzale')) targetCalcId = 1;
      else if (text.includes('monte carlo') || text.includes('rischio')) targetCalcId = 2;
      else if (text.includes('turni') || text.includes('orari')) targetCalcId = 3;
      else if (text.includes('umidità') || text.includes('materie prime')) targetCalcId = 4;
      else if (text.includes('lotto') || text.includes('tracciabilità')) targetCalcId = 5;
      else if (text.includes('smartstore') || text.includes('stoccaggio 3d')) targetCalcId = 6;
      else if (text.includes('hopfield') || text.includes('inclinazione')) targetCalcId = 7;
      else if (text.includes('percorsi agv') || text.includes('percorsi navette')) targetCalcId = 8;
      else if (text.includes('traffico agv') || text.includes('code navette')) targetCalcId = 9;
      else if (text.includes('knapsack') || text.includes('saturazione camion')) targetCalcId = 10;
      else if (text.includes('vettori') || text.includes('spedizioni')) targetCalcId = 11;
      else if (text.includes('buffer baie') || text.includes('carico simultaneo')) targetCalcId = 12;
      else if (text.includes('polmone') || text.includes('parcheggio')) targetCalcId = 13;
      else if (text.includes('bema') || text.includes('silkworm') || text.includes('giri minuto') || text.includes('vibrazioni')) targetCalcId = 14;
      else if (text.includes('tensione film') || text.includes('pre-stiro')) targetCalcId = 15;
      else if (text.includes('incroci') || text.includes('collisioni agv')) targetCalcId = 16;
      else if (text.includes('batteria') || text.includes('ricarica navetta')) targetCalcId = 17;
      else if (text.includes('robot') || text.includes('pallettizzazione') || text.includes('vuoto')) targetCalcId = 18;
      else if (text.includes('fast charge') || text.includes('piastre induttive')) targetCalcId = 19;
      else if (text.includes('woodpecker') || text.includes('ispezione pallet') || text.includes('scarto')) targetCalcId = 20;
      else if (text.includes('raptor') || text.includes('etichetta') || text.includes('barcode') || text.includes('zkp')) targetCalcId = 21;
    }

    if (targetCalcId) {
      const calcMeta = QUANTUM_CALCULATIONS.find(c => c.id === targetCalcId);
      if (calcMeta) {
        // Map to realistic query
        if (targetCalcId === 1) customQuery = "Ho 12 camion in attesa nel piazzale con 45 minuti di ritardo e saturazione magazzino WMS all'88.5%";
        else if (targetCalcId === 2) customQuery = "Calcola il rischio Monte Carlo con ritardo stimato di 75 minuti e 1 baia libera";
        else if (targetCalcId === 3) customQuery = "Pianifica i turni di carico con 8 ore di lavoro disponibili su 6 baie operative";
        else if (targetCalcId === 4) customQuery = "Analizza spettro NIR materie prime con umidità al 14.8% e spessore grani 45 micron";
        else if (targetCalcId === 5) customQuery = "Verifica blockchain tracciabilità per lotto fornitore con id lotto GS1";
        else if (targetCalcId === 6) customQuery = "Ottimizza stoccaggio 3D SmartStore per classe di rotazione HIGH con 85 celle libere";
        else if (targetCalcId === 7) customQuery = "Verifica stabilità strutturale scaffali con sensore di micro-inclinazione a 0.38 gradi";
        else if (targetCalcId === 8) customQuery = "Calcola percorso ottimale per navetta AGV dalle coordinate attuali verso 5 nodi di prelievo";
        else if (targetCalcId === 9) customQuery = "Ribilancia flotta navette con coefficiente di traffico 0.78 e 12 ordini in coda";
        else if (targetCalcId === 10) customQuery = "Calcola saturazione volumetrica carico camion con volume disponibile 68 metri cubi";
        else if (targetCalcId === 11) customQuery = "Ottimizza contratti vettori di trasporto per minimizzare penali e costi";
        else if (targetCalcId === 12) customQuery = "Coordina buffer baie di carico con 5 camion nel piazzale e 60 pallet pronti a linea";
        else if (targetCalcId === 13) customQuery = "Gestisci polmone piazzale con 8 camion in attesa e saturazione buffer al 75%";
        else if (targetCalcId === 14) customQuery = "Analisi vibrazionale Bema Silkworm con velocità braccio a 48 giri al minuto";
        else if (targetCalcId === 15) customQuery = "Monitora tensione film fasciatore Bema con cella di carico a 148 Newton e velocità carrello 12 m/s";
        else if (targetCalcId === 16) customQuery = "Previeni collisioni incroci per navette LGV su nodi di svincolo";
        else if (targetCalcId === 17) customQuery = "Monitora telemetria batterie navette LGV con stato di carica e temperatura";
        else if (targetCalcId === 18) customQuery = "Ottimizza cinematica robot di pallettizzazione con pressione vuoto a meno 0.72 bar";
        else if (targetCalcId === 19) customQuery = "Modula potenza ricarica rapida navette su piastre a terra con assorbimento 95 kW";
        else if (targetCalcId === 20) customQuery = "Classifica integrità bancali con sistema Woodpecker forza di deformazione 2450 Newton";
        else if (targetCalcId === 21) customQuery = "Valida codice etichetta Raptor GS1 con prova a conoscenza zero per conformità tracciabilità";
        else customQuery = `Esegui il calcolo quantistico ${targetCalcId}: ${calcMeta.name}`;

        onChangeView?.('chat');
        onExecuteVoiceQuery?.(customQuery);

        reply = `Eseguo il Calcolo ${targetCalcId}: ${calcMeta.name} per lo stabilimento ${activeTenant.nome}. I risultati e la simulazione quantistica sono ora visibili nella Chat Terminal.`;
        speakReply(reply);
        return;
      }
    }

    // 11. GENERAL INDUSTRIAL EXPLANATIONS / WHO ARE YOU
    if (text.includes('chi sei') || text.includes('come ti chiami') || text.includes('cosa sai fare')) {
      reply = `Sono il supervisore vocale intelligente di JOKER 80 per ${activeTenant.nome}. Posso navigare per te senza mouse tra Catalogo, Notifiche, Chat e Amministrazione, cambiare impianto, ed eseguire ciascuno dei 21 algoritmi quantistici CUDA-Q. Dimmi pure cosa vuoi fare!`;
      speakReply(reply);
      return;
    }

    // 12. FALLBACK COURTEOUS REPLY
    reply = `Comando ricevuto per ${activeTenant.nome}: "${rawText}". Posso eseguire per te uno dei 21 calcoli, mostrarti le notifiche, aprire il catalogo, oppure passare a un altro stabilimento come Barilla Novara o Nestlé. Dimmi cosa preferisci.`;
    speakReply(reply);
  }, [
    activeTenant.nome, 
    tenants, 
    speakReply, 
    onChangeView, 
    onOpenCompanyPlantSelector, 
    onSelectTenant, 
    onRefreshScan, 
    onOpenCircuit, 
    onExecuteVoiceQuery
  ]);

  /**
   * START VOCE
   */
  const handleStart = async () => {
    setIsActive(true);
    isActiveRef.current = true;
    setIsExpanded(true);
    setStatusMessage('Attivazione assistenza vocale in corso...');

    // Welcome speech
    const welcome = `Assistenza vocale attiva per ${activeTenant.nome}. Puoi parlarmi liberamente: dimmi quale calcolo eseguire, quale pagina aprire o quale stabilimento selezionare. Ti ascolto!`;
    speakReply(welcome);
  };

  /**
   * STOP VOCE
   */
  const handleStop = () => {
    setIsActive(false);
    isActiveRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    AvatarVoiceService.stopListening();
    AvatarVoiceService.stopSpeaking();
    setStatusMessage('Assistente Vocale in Pausa');
    setTranscript('');
  };

  /**
   * Manual submission from text box inside voice widget
   */
  const handleManualCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    const cmd = textCommand.trim();
    setTextCommand('');
    setLastRecognizedCommand(cmd);
    handleVoiceCommand(cmd);
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex flex-col items-end gap-2 max-w-[95vw] sm:max-w-md font-sans">
      {/* Expanded Control Box when active or clicked */}
      {isExpanded && (
        <div className="w-full sm:w-96 bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-cyan-950/50 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${
                isSpeaking 
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                  : isListening 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1 font-mono">
                  <span>Gemini 3.8 Live Voice</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </h4>
                <p className="text-[10px] text-cyan-300 font-mono truncate max-w-[200px]">
                  Impianto: {activeTenant.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMuted(prev => !prev)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isMuted 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title={isMuted ? 'Voce Disattivata (Mute)' : 'Voce Attiva'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs cursor-pointer"
                title="Riduci a icona"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isSpeaking 
                  ? 'bg-cyan-400 animate-bounce' 
                  : isListening 
                  ? 'bg-emerald-400 animate-pulse' 
                  : 'bg-amber-400'
              }`} />
              <span className="truncate text-slate-300 text-[11px]">
                {statusMessage}
              </span>
            </div>

            {/* Visualizer wave bars */}
            {(isListening || isSpeaking) && (
              <div className="flex items-center gap-0.5 shrink-0 pl-1">
                <span className="w-1 bg-cyan-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, audioLevel * 16)}px` }} />
                <span className="w-1 bg-cyan-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(6, audioLevel * 22)}px` }} />
                <span className="w-1 bg-cyan-400 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, audioLevel * 14)}px` }} />
              </div>
            )}
          </div>

          {/* Real-time speech transcript feedback */}
          {transcript && (
            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 font-mono flex items-start gap-1.5">
              <Mic className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400 animate-pulse" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 block font-bold">Riconosciuto:</span>
                <p className="italic">"{transcript}"</p>
              </div>
            </div>
          )}

          {/* Assistant speech response */}
          {assistantReply && (
            <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200 font-sans leading-relaxed">
              <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 block font-bold mb-0.5">Assistente:</span>
              <p>{assistantReply}</p>
            </div>
          )}

          {/* Hands-Free Quick Voice Actions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Comandi Vocali Rapidi:
            </span>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => handleVoiceCommand('apri il catalogo')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors"
              >
                📖 Apri Catalogo
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('vai alle notifiche')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors"
              >
                🔔 Notifiche & Allarmi
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('esegui calcolo 3')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors"
              >
                ⚡ Esegui Calcolo 3 (Turni)
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('cambia stabilimento')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-purple-950 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-colors"
              >
                🏢 Seleziona Azienda
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('cosa significa il lucchetto')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-blue-950 text-slate-300 hover:text-blue-300 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-colors"
              >
                🔒 Spiega Lucchetto
              </button>
            </div>
          </div>

          {/* Fallback Text Input (useful in noisy room or without mic permission) */}
          <form onSubmit={handleManualCommandSubmit} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={textCommand}
              onChange={(e) => setTextCommand(e.target.value)}
              placeholder="Oppure digita qui un comando per l'assistente..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors"
              title="Invia comando"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Main Bottom START / STOP Interactive Button Bar */}
      <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
        {!isActive ? (
          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/80 cursor-pointer transition-all active:scale-95 border border-emerald-400/40"
          >
            <Play className="w-4 h-4 fill-white animate-pulse" />
            <span>START VOCE</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-rose-950/60 hover:shadow-rose-900/80 cursor-pointer transition-all active:scale-95 border border-rose-400/40 animate-pulse"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>STOP VOCE</span>
          </button>
        )}

        {/* Toggle Expand / Info Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isExpanded
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
          title="Mostra / Nascondi pannello comandi vocali"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
