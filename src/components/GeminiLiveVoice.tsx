import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  Volume2, 
  VolumeX, 
  Bot, 
  Layers, 
  X, 
  Send, 
  HelpCircle, 
  Cpu, 
  Building2, 
  Bell, 
  Terminal,
  BookOpen,
  Sparkles,
  AlertTriangle
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
  onCloseAllModals?: () => void;
  onSelectTenant?: (tenant: FactoryTenant) => void;
  onExecuteVoiceQuery?: (query: string) => void;
  onOpenCircuit?: (calc: QuantumCalculationMeta) => void;
  onInspectCalculation?: (calc: QuantumCalculationMeta) => void;
  onOpenScenari?: () => void;
  onRefreshScan?: () => void;
  onOpenMicModal?: () => void;
  autoStartVoiceTrigger?: number;
}

export const GeminiLiveVoice: React.FC<GeminiLiveVoiceProps> = ({
  activeTenant,
  tenants,
  userRole,
  onChangeView,
  onOpenCompanyPlantSelector,
  onCloseAllModals,
  onSelectTenant,
  onExecuteVoiceQuery,
  onOpenCircuit,
  onInspectCalculation,
  onOpenScenari,
  onRefreshScan,
  onOpenMicModal,
  autoStartVoiceTrigger
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
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  // References to avoid stale state in asynchronous browser speech events
  const isActiveRef = useRef<boolean>(false);
  isActiveRef.current = isActive;
  const isSpeakingRef = useRef<boolean>(false);
  isSpeakingRef.current = isSpeaking;
  const pendingTranscriptRef = useRef<string>('');
  const silenceDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Visual audio pulse when listening or speaking
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
      if (silenceDebounceTimerRef.current) clearTimeout(silenceDebounceTimerRef.current);
      if (speechWatchdogTimerRef.current) clearTimeout(speechWatchdogTimerRef.current);
      AvatarVoiceService.stopListening();
      AvatarVoiceService.stopSpeaking();
    };
  }, [activeTenant.id]);

  // Automatically start voice if triggered externally (e.g. after granting mic permission)
  useEffect(() => {
    if (autoStartVoiceTrigger && autoStartVoiceTrigger > 0) {
      handleStart();
    }
  }, [autoStartVoiceTrigger]);

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
        const clean = text.trim();
        setTranscript(clean);
        pendingTranscriptRef.current = clean;

        if (silenceDebounceTimerRef.current) {
          clearTimeout(silenceDebounceTimerRef.current);
          silenceDebounceTimerRef.current = null;
        }

        if (isFinal && clean.length > 1) {
          // Final sentence detected by Web Speech API
          pendingTranscriptRef.current = '';
          AvatarVoiceService.stopListening();
          setIsListening(false);
          setLastRecognizedCommand(clean);
          handleVoiceCommand(clean);
        } else if (clean.length > 1) {
          // Silence debounce: If speaker paused for 750ms, commit interim transcript
          silenceDebounceTimerRef.current = setTimeout(() => {
            const pending = pendingTranscriptRef.current;
            if (pending && pending.length > 1 && !isSpeakingRef.current) {
              pendingTranscriptRef.current = '';
              AvatarVoiceService.stopListening();
              setIsListening(false);
              setLastRecognizedCommand(pending);
              handleVoiceCommand(pending);
            }
          }, 750);
        }
      },
      (errInfo: { error: string; message: string; fatal: boolean }) => {
        setIsListening(false);
        setStatusMessage(errInfo.message);

        // CRITICAL: NEVER retry on fatal or permission denied to avoid infinite loops
        if (errInfo.fatal || errInfo.error === 'not-allowed' || errInfo.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          return;
        }

        if (isActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (isActiveRef.current && !isSpeakingRef.current) {
              startListeningLoop();
            }
          }, 1500);
        }
      },
      () => {
        setIsListening(false);
        // If onend fired and we still had an uncommitted utterance, process it immediately
        if (pendingTranscriptRef.current && pendingTranscriptRef.current.length > 1 && !isSpeakingRef.current) {
          const pending = pendingTranscriptRef.current;
          pendingTranscriptRef.current = '';
          setLastRecognizedCommand(pending);
          handleVoiceCommand(pending);
          return;
        }

        // Restart listening loop if still active
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
      if (isActiveRef.current && !micPermissionDenied) {
        setTimeout(() => {
          if (isActiveRef.current && !micPermissionDenied) startListeningLoop();
        }, 1200);
      }
      return;
    }

    setIsSpeaking(true);
    isSpeakingRef.current = true;
    AvatarVoiceService.stopListening();

    // Watchdog timer: prevent speech hanging forever if browser fails to fire onend
    if (speechWatchdogTimerRef.current) clearTimeout(speechWatchdogTimerRef.current);
    speechWatchdogTimerRef.current = setTimeout(() => {
      if (isSpeakingRef.current) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (isActiveRef.current && !micPermissionDenied) startListeningLoop();
      }
    }, 9000);

    AvatarVoiceService.speak(
      replyText,
      'it-IT',
      'laila',
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      () => {
        if (speechWatchdogTimerRef.current) clearTimeout(speechWatchdogTimerRef.current);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (isActiveRef.current && !micPermissionDenied) {
          setTimeout(() => {
            if (isActiveRef.current && !micPermissionDenied) {
              startListeningLoop();
            }
          }, 350);
        }
      }
    );
  }, [isMuted, micPermissionDenied, startListeningLoop]);

  /**
   * Process and execute user voice or text commands across the entire application
   */
  const handleVoiceCommand = useCallback((rawText: string) => {
    const text = rawText.toLowerCase().trim();
    let reply = '';

    // ==========================================
    // 1. CLOSE ALL MODALS / CANCEL / BACK
    // ==========================================
    if (
      text.includes('chiudi') || 
      text.includes('esci') || 
      text.includes('annulla') || 
      text.includes('torna indietro') ||
      text.includes('nascondi')
    ) {
      onCloseAllModals?.();
      reply = `Ho chiuso la finestra attiva.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 2. QUESTION ABOUT THE LOCKS (Lucchetto Aperto e Lucchetto Chiuso)
    // ==========================================
    if (
      text.includes('lucchetto') || 
      text.includes('lucchetti') || 
      text.includes('chiave') ||
      text.includes('aperto e chiuso') ||
      text.includes('perché il lucchetto')
    ) {
      reply = `I lucchetti indicano il tipo di circuito: il lucchetto chiuso segnala l'Entanglement Quantistico Obbligatorio con porte CNOT tra variabili industriali dipendenti, come camion e magazzino. Il lucchetto aperto indica invece un calcolo locale o facoltativo, che elabora un singolo nodo o variabile indipendente.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 3. SWITCH PLANT DIRECTLY BY VOICE
    // ==========================================
    const foundTenant = tenants.find(t => {
      const tName = t.nome.toLowerCase();
      const tAzienda = (t.azienda || '').toLowerCase();
      const tSito = (t.sito || '').toLowerCase();
      const tId = t.id.toLowerCase();

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

      // Brand mentions
      if (text.includes('barilla') && !text.includes('novara') && !text.includes('foggia') && tId === 'barilla') return true;
      if (text.includes('nestle') && !text.includes('benevento') && !text.includes('perugia') && tId === 'nestle') return true;
      if (text.includes("sant'anna") && !text.includes('lanzo') && tId === 'santanna') return true;
      if (text.includes('granarolo') && !text.includes('pasturana') && tId.includes('bologna')) return true;
      if (text.includes('elettric') && !text.includes('dolo') && tId === 'elettric80') return true;

      return false;
    });

    if (
      foundTenant && 
      (text.includes('passa') || text.includes('metti') || text.includes('vai a') || text.includes('seleziona') || text.includes('apri') || text.includes('cambia') || text.includes('imposta'))
    ) {
      onSelectTenant?.(foundTenant);
      reply = `Impianto selezionato: ${foundTenant.nome}. Dati di fabbrica ricaricati e notifiche sincronizzate per questo sito.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 4. OPEN COMPANY & MULTI-PLANT SELECTOR MODAL
    // ==========================================
    if (
      text.includes('cambia stabilimento') || 
      text.includes('seleziona stabilimento') || 
      text.includes('elenco stabilimenti') || 
      text.includes('apri stabilimenti') ||
      text.includes('mostra stabilimenti') ||
      text.includes('clicca stabilimenti') ||
      text.includes('cambia fabbrica') ||
      text.includes('seleziona azienda') ||
      text.includes('mostra aziende') ||
      text.includes('apri aziende') ||
      text.includes('clicca aziende') ||
      text.includes('lista stabilimenti') ||
      text.includes('menu stabilimenti')
    ) {
      onOpenCompanyPlantSelector?.();
      reply = `Apro la schermata di selezione per scegliere azienda e stabilimento.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 5. OPEN SCENARI DROPDOWN IN CHAT TERMINAL
    // ==========================================
    if (
      text.includes('scenari') || 
      text.includes('apri scenari') || 
      text.includes('mostra scenari') || 
      text.includes('clicca scenari') || 
      text.includes('menu scenari') || 
      text.includes('scenari preconfigurati')
    ) {
      onChangeView?.('chat');
      onOpenScenari?.();
      reply = `Apro il menù Scenari nel terminale con i 21 casi quantistici preconfigurati.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 6. OPEN QUANTUM CIRCUIT MODAL
    // ==========================================
    if (
      text.includes('circuito') || 
      text.includes('diagramma') || 
      text.includes('porte quantistiche') || 
      text.includes('cnot') ||
      text.includes('schema quantistico') ||
      text.includes('mostra circuito') ||
      text.includes('apri circuito') ||
      text.includes('clicca circuito')
    ) {
      let targetCalc = QUANTUM_CALCULATIONS[0];
      for (let i = 1; i <= 21; i++) {
        if (text.includes(`calcolo ${i}`) || text.includes(`numero ${i}`) || text.includes(` ${i}`)) {
          const match = QUANTUM_CALCULATIONS.find(c => c.id === i);
          if (match) {
            targetCalc = match;
            break;
          }
        }
      }
      onOpenCircuit?.(targetCalc);
      reply = `Apro il diagramma del circuito CUDA-Q per il Calcolo ${targetCalc.id}: ${targetCalc.name}.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 7. OPEN CALCULATION DETAILS / CPU TELEMETRY (QUESTION MARK ?)
    // ==========================================
    if (
      text.includes('punto di domanda') || 
      text.includes('telemetria cpu') || 
      text.includes('specifiche tecniche') || 
      text.includes('dettagli calcolo') ||
      text.includes('spiega calcolo') ||
      text.includes('apri dettagli') ||
      text.includes('clicca sul punto di domanda')
    ) {
      let targetCalc = QUANTUM_CALCULATIONS[0];
      for (let i = 1; i <= 21; i++) {
        if (text.includes(`calcolo ${i}`) || text.includes(`numero ${i}`) || text.includes(` ${i}`)) {
          const match = QUANTUM_CALCULATIONS.find(c => c.id === i);
          if (match) {
            targetCalc = match;
            break;
          }
        }
      }
      onChangeView?.('catalog');
      onInspectCalculation?.(targetCalc);
      reply = `Apro le specifiche e la telemetria CPU per il Calcolo ${targetCalc.id}: ${targetCalc.name}.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 8. NAVIGATION TO NOTIFICATIONS
    // ==========================================
    if (
      text.includes('notific') || 
      text.includes('allarm') || 
      text.includes('anomali') || 
      text.includes('critici') || 
      text.includes('fuori linea') ||
      text.includes('avvisi') ||
      text.includes('apri notifiche') ||
      text.includes('vai alle notifiche') ||
      text.includes('clicca notifiche') ||
      text.includes('mostra allarmi')
    ) {
      onChangeView?.('notifications');
      reply = `Apro la pagina Notifiche e Allarmi dello stabilimento ${activeTenant.nome}.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 9. NAVIGATION TO CATALOG (21 CALCULATIONS)
    // ==========================================
    if (
      (text.includes('catalogo') || 
      text.includes('21 calcoli') || 
      text.includes('tutti i calcoli') || 
      text.includes('algoritmi') ||
      text.includes('apri catalogo') ||
      text.includes('vai al catalogo') ||
      text.includes('clicca catalogo') ||
      text.includes('mostra catalogo')) &&
      !text.includes('esegui')
    ) {
      onChangeView?.('catalog');
      reply = `Apro il Catalogo dei 21 Calcoli. Puoi cliccare sul punto di domanda di ciascun calcolo per vederne la telemetria CPU.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 10. NAVIGATION TO CHAT / TERMINAL
    // ==========================================
    if (
      text.includes('terminale') || 
      text.includes('chat') || 
      text.includes('console') || 
      text.includes('schermata principale') ||
      text.includes('apri chat') ||
      text.includes('vai alla chat') ||
      text.includes('clicca chat') ||
      text.includes('torna alla chat')
    ) {
      onChangeView?.('chat');
      reply = `Ti porto alla Chat Terminal interattiva.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 11. NAVIGATION TO ADMIN PANEL
    // ==========================================
    if (
      text.includes('admin') || 
      text.includes('amministrazione') || 
      text.includes('impostazioni') ||
      text.includes('apri amministrazione') ||
      text.includes('vai ad amministrazione') ||
      text.includes('clicca admin')
    ) {
      onChangeView?.('admin');
      reply = `Apro il Pannello di Amministrazione per la gestione dell'infrastruttura quantistica.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 12. REFRESH / SCAN TELEMETRY
    // ==========================================
    if (
      text.includes('aggiorna telemetria') || 
      text.includes('scansiona') || 
      text.includes('scarica telemetria') || 
      text.includes('nuova scansione') ||
      text.includes('fai scansione') ||
      text.includes('clicca scansione') ||
      text.includes('aggiorna dati')
    ) {
      onRefreshScan?.();
      reply = `Ho avviato la scansione telemetrica live dal gateway di ${activeTenant.nome} ed eseguito i 21 circuiti quantistici.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 13. OPEN OR EXECUTE A SPECIFIC CALCULATION (1 TO 21)
    // ==========================================
    let targetCalcId: number | null = null;
    const isExecuteIntent = text.includes('esegui') || text.includes('fai') || text.includes('lancia') || text.includes('calcola') || text.includes('risolvi');
    const isOpenIntent = text.includes('apri') || text.includes('mostra') || text.includes('clicca') || text.includes('vai al') || text.includes('vedi');

    for (let i = 1; i <= 21; i++) {
      if (text.includes(`calcolo ${i}`) || text.includes(`calcolo numero ${i}`) || text.includes(`numero ${i}`) || text.includes(`il ${i}`)) {
        targetCalcId = i;
        break;
      }
    }

    // Check by domain keywords if number wasn't explicitly said
    if (!targetCalcId) {
      if (text.includes('camion') || text.includes('inbound') || text.includes('piazzale')) targetCalcId = 1;
      else if (text.includes('monte carlo') || text.includes('rischio fornitore')) targetCalcId = 2;
      else if (text.includes('turni') || text.includes('orari dipendenti')) targetCalcId = 3;
      else if (text.includes('umidità') || text.includes('materie prime') || text.includes('nir')) targetCalcId = 4;
      else if (text.includes('lotto') || text.includes('tracciabilità') || text.includes('blockchain')) targetCalcId = 5;
      else if (text.includes('smartstore') || text.includes('stoccaggio 3d')) targetCalcId = 6;
      else if (text.includes('hopfield') || text.includes('inclinazione scaffale')) targetCalcId = 7;
      else if (text.includes('percorsi agv') || text.includes('percorsi navette')) targetCalcId = 8;
      else if (text.includes('traffico agv') || text.includes('code navette')) targetCalcId = 9;
      else if (text.includes('knapsack') || text.includes('saturazione camion')) targetCalcId = 10;
      else if (text.includes('vettori') || text.includes('spedizioni') || text.includes('penali')) targetCalcId = 11;
      else if (text.includes('buffer baie') || text.includes('carico simultaneo')) targetCalcId = 12;
      else if (text.includes('polmone') || text.includes('parcheggio camion')) targetCalcId = 13;
      else if (text.includes('bema') || text.includes('silkworm') || text.includes('vibrazioni') || text.includes('giri minuto')) targetCalcId = 14;
      else if (text.includes('tensione film') || text.includes('pre-stiro')) targetCalcId = 15;
      else if (text.includes('incroci agv') || text.includes('collisioni')) targetCalcId = 16;
      else if (text.includes('batteria') || text.includes('ricarica navetta')) targetCalcId = 17;
      else if (text.includes('robot') || text.includes('pallettizzazione') || text.includes('vuoto')) targetCalcId = 18;
      else if (text.includes('fast charge') || text.includes('piastre induttive')) targetCalcId = 19;
      else if (text.includes('woodpecker') || text.includes('ispezione pallet') || text.includes('scarto pallet')) targetCalcId = 20;
      else if (text.includes('raptor') || text.includes('etichetta') || text.includes('barcode') || text.includes('zkp')) targetCalcId = 21;
    }

    if (targetCalcId) {
      const calcMeta = QUANTUM_CALCULATIONS.find(c => c.id === targetCalcId);
      if (calcMeta) {
        // If user said "apri calcolo X" or "mostra calcolo X", open it in Catalog with CPU specs!
        if (isOpenIntent && !isExecuteIntent) {
          onChangeView?.('catalog');
          onInspectCalculation?.(calcMeta);
          reply = `Apro il Calcolo ${targetCalcId}: ${calcMeta.name} nel catalogo, con le specifiche CPU e la telemetria.`;
          speakReply(reply);
          return;
        }

        // Otherwise execute it in Terminal!
        let customQuery = '';
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

        reply = `Eseguo il Calcolo ${targetCalcId}: ${calcMeta.name} per ${activeTenant.nome}. I risultati sono visibili nella Chat Terminal.`;
        speakReply(reply);
        return;
      }
    }

    // ==========================================
    // 14. WHO ARE YOU / HELP
    // ==========================================
    if (text.includes('chi sei') || text.includes('come ti chiami') || text.includes('cosa sai fare') || text === 'aiuto') {
      reply = `Sono il supervisore vocale hands-free di JOKER 80. Puoi chiedermi a voce o digitando di aprire il catalogo, le notifiche, la chat, selezionare un impianto come Barilla Novara o Nestlé Assago, oppure eseguire uno dei 21 calcoli quantistici senza usare il mouse.`;
      speakReply(reply);
      return;
    }

    // ==========================================
    // 15. ANY OTHER INDUSTRIAL / FACTORY STATEMENT OR FREEFORM COMMAND:
    // ALWAYS FORWARD TO QUANTUM CHAT TERMINAL SO ACTION IS TAKEN!
    // ==========================================
    onChangeView?.('chat');
    onExecuteVoiceQuery?.(rawText);
    reply = `Ho preso in carico la tua richiesta "${rawText}" e l'ho inviata al risolutore quantistico CUDA-Q nel terminale per ${activeTenant.nome}.`;
    speakReply(reply);
  }, [
    activeTenant.nome, 
    tenants, 
    speakReply, 
    onChangeView, 
    onOpenCompanyPlantSelector, 
    onCloseAllModals,
    onSelectTenant, 
    onRefreshScan, 
    onOpenCircuit, 
    onInspectCalculation,
    onOpenScenari,
    onExecuteVoiceQuery
  ]);

  /**
   * START VOCE
   */
  const handleStart = async () => {
    setIsActive(true);
    isActiveRef.current = true;
    setIsExpanded(true);
    setMicPermissionDenied(false);
    setStatusMessage('Avvio assistente vocale...');

    // Warm up speech synthesis on user interaction
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }

    const welcome = `Assistenza vocale attiva per ${activeTenant.nome}. Puoi parlarmi liberamente o digitare per governare l'applicazione senza mouse.`;
    speakReply(welcome);
  };

  /**
   * STOP VOCE
   */
  const handleStop = () => {
    if (silenceDebounceTimerRef.current) clearTimeout(silenceDebounceTimerRef.current);
    if (speechWatchdogTimerRef.current) clearTimeout(speechWatchdogTimerRef.current);
    setIsActive(false);
    isActiveRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    pendingTranscriptRef.current = '';
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

          {/* Microphone Permission Banner if blocked */}
          {micPermissionDenied && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-300 font-sans flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <span className="font-bold block text-amber-200">Microfono non abilitato nel browser</span>
                <p className="text-[10px] text-amber-300/90 leading-tight">
                  L'accesso al microfono è stato rifiutato o non ancora concesso dal browser.
                </p>
                {onOpenMicModal && (
                  <button
                    type="button"
                    onClick={onOpenMicModal}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[10px] font-mono flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Richiedi Autorizzazione Microfono</span>
                  </button>
                )}
              </div>
            </div>
          )}

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

          {/* Hands-Free Quick Actions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Comandi Rapidi (Clicca o Pronuncia):
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
                onClick={() => handleVoiceCommand('apri le notifiche')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors"
              >
                🔔 Notifiche & Allarmi
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('apri gli scenari')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-indigo-950 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-colors"
              >
                ✨ Apri Scenari
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('apri calcolo 1')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-blue-950 text-slate-300 hover:text-blue-300 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-colors"
              >
                🔍 Calcolo 1 (Dettagli CPU)
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
                🏢 Seleziona Stabilimento
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('cosa significa il lucchetto')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-yellow-950 text-slate-300 hover:text-yellow-300 border border-slate-800 hover:border-yellow-500/50 cursor-pointer transition-colors"
              >
                🔒 Spiega Lucchetto
              </button>
              <button
                type="button"
                onClick={() => handleVoiceCommand('chiudi finestra')}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-colors"
              >
                ✕ Chiudi
              </button>
            </div>
          </div>

          {/* Text Input to control everything without mouse or if mic is blocked */}
          <form onSubmit={handleManualCommandSubmit} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={textCommand}
              onChange={(e) => setTextCommand(e.target.value)}
              placeholder="Scrivi qui qualsiasi comando o richiesta..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors"
              title="Invia comando all'assistente"
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
