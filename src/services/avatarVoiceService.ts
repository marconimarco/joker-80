/**
 * JOKER 80 - Digital Human Voice & Speech Service
 * Supports 90+ languages via Web Speech API (SpeechRecognition & SpeechSynthesis)
 * and drives realistic lip-sync visemes for Laila & Marco avatars.
 */

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  group?: string;
}

export const SUPPORTED_LANGUAGES_90: SupportedLanguage[] = [
  // Most Popular / Industrial Hubs
  { code: 'it-IT', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹', group: 'Principali' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸', group: 'Principali' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧', group: 'Principali' },
  { code: 'de-DE', name: 'Tedesco', nativeName: 'Deutsch', flag: '🇩🇪', group: 'Principali' },
  { code: 'fr-FR', name: 'Francese', nativeName: 'Français', flag: '🇫🇷', group: 'Principali' },
  { code: 'es-ES', name: 'Spagnolo', nativeName: 'Español', flag: '🇪🇸', group: 'Principali' },
  { code: 'pt-BR', name: 'Portoghese (Brasile)', nativeName: 'Português (BR)', flag: '🇧🇷', group: 'Principali' },
  { code: 'pt-PT', name: 'Portoghese', nativeName: 'Português (PT)', flag: '🇵🇹', group: 'Principali' },
  { code: 'zh-CN', name: 'Cinese (Mandarino)', nativeName: '简体中文', flag: '🇨🇳', group: 'Principali' },
  { code: 'ja-JP', name: 'Giapponese', nativeName: '日本語', flag: '🇯🇵', group: 'Principali' },
  { code: 'ko-KR', name: 'Coreano', nativeName: '한국어', flag: '🇰🇷', group: 'Principali' },
  { code: 'ar-SA', name: 'Arabo', nativeName: 'العربية', flag: '🇸🇦', group: 'Principali' },
  { code: 'ru-RU', name: 'Russo', nativeName: 'Русский', flag: '🇷🇺', group: 'Principali' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', group: 'Principali' },
  { code: 'pl-PL', name: 'Polacco', nativeName: 'Polski', flag: '🇵🇱', group: 'Europa' },
  { code: 'nl-NL', name: 'Olandese', nativeName: 'Nederlands', flag: '🇳🇱', group: 'Europa' },
  { code: 'sv-SE', name: 'Svedese', nativeName: 'Svenska', flag: '🇸🇪', group: 'Europa' },
  { code: 'da-DK', name: 'Danese', nativeName: 'Dansk', flag: '🇩🇰', group: 'Europa' },
  { code: 'no-NO', name: 'Norvegese', nativeName: 'Norsk', flag: '🇳🇴', group: 'Europa' },
  { code: 'fi-FI', name: 'Finlandese', nativeName: 'Suomi', flag: '🇫🇮', group: 'Europa' },
  { code: 'el-GR', name: 'Greco', nativeName: 'Ελληνικά', flag: '🇬🇷', group: 'Europa' },
  { code: 'tr-TR', name: 'Turco', nativeName: 'Türkçe', flag: '🇹🇷', group: 'Europa' },
  { code: 'cs-CZ', name: 'Ceco', nativeName: 'Čeština', flag: '🇨🇿', group: 'Europa' },
  { code: 'ro-RO', name: 'Rumeno', nativeName: 'Română', flag: '🇷🇴', group: 'Europa' },
  { code: 'hu-HU', name: 'Ungherese', nativeName: 'Magyar', flag: '🇭🇺', group: 'Europa' },
  { code: 'uk-UA', name: 'Ucraino', nativeName: 'Українська', flag: '🇺🇦', group: 'Europa' },
  { code: 'sk-SK', name: 'Slovacco', nativeName: 'Slovenčina', flag: '🇸🇰', group: 'Europa' },
  { code: 'bg-BG', name: 'Bulgaro', nativeName: 'Български', flag: '🇧🇬', group: 'Europa' },
  { code: 'hr-HR', name: 'Croato', nativeName: 'Hrvatski', flag: '🇭🇷', group: 'Europa' },
  { code: 'sr-RS', name: 'Serbo', nativeName: 'Српски', flag: '🇷🇸', group: 'Europa' },
  { code: 'sl-SI', name: 'Sloveno', nativeName: 'Slovenščina', flag: '🇸🇮', group: 'Europa' },
  { code: 'et-EE', name: 'Estone', nativeName: 'Eesti', flag: '🇪🇪', group: 'Europa' },
  { code: 'lv-LV', name: 'Lettone', nativeName: 'Latviešu', flag: '🇱🇻', group: 'Europa' },
  { code: 'lt-LT', name: 'Lituano', nativeName: 'Lietuvių', flag: '🇱🇹', group: 'Europa' },
  { code: 'ga-IE', name: 'Irlandese', nativeName: 'Gaeilge', flag: '🇮🇪', group: 'Europa' },
  { code: 'is-IS', name: 'Islandese', nativeName: 'Íslenska', flag: '🇮🇸', group: 'Europa' },
  { code: 'mt-MT', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', group: 'Europa' },
  { code: 'ca-ES', name: 'Catalano', nativeName: 'Català', flag: '🇪🇸', group: 'Europa' },
  { code: 'eu-ES', name: 'Basco', nativeName: 'Euskara', flag: '🇪🇸', group: 'Europa' },
  { code: 'gl-ES', name: 'Galiziano', nativeName: 'Galego', flag: '🇪🇸', group: 'Europa' },
  // Asia & Pacific
  { code: 'vi-VN', name: 'Vietnamita', nativeName: 'Tiếng Việt', flag: '🇻🇳', group: 'Asia' },
  { code: 'th-TH', name: 'Tailandese', nativeName: 'ไทย', flag: '🇹🇭', group: 'Asia' },
  { code: 'id-ID', name: 'Indonesiano', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', group: 'Asia' },
  { code: 'ms-MY', name: 'Malese', nativeName: 'Bahasa Melayu', flag: '🇲🇾', group: 'Asia' },
  { code: 'tl-PH', name: 'Filippino (Tagalog)', nativeName: 'Filipino', flag: '🇵🇭', group: 'Asia' },
  { code: 'bn-IN', name: 'Bengalese', nativeName: 'বাংলা', flag: '🇮🇳', group: 'Asia' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', group: 'Asia' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', group: 'Asia' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', group: 'Asia' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', group: 'Asia' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', group: 'Asia' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', group: 'Asia' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', group: 'Asia' },
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', group: 'Asia' },
  { code: 'ne-NP', name: 'Nepalese', nativeName: 'नेपाली', flag: '🇳🇵', group: 'Asia' },
  { code: 'si-LK', name: 'Singalese', nativeName: 'සිංහල', flag: '🇱🇰', group: 'Asia' },
  { code: 'my-MM', name: 'Birmano', nativeName: 'မြန်မာ', flag: '🇲🇲', group: 'Asia' },
  { code: 'km-KH', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭', group: 'Asia' },
  { code: 'lo-LA', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', group: 'Asia' },
  { code: 'mn-MN', name: 'Mongolo', nativeName: 'Монгол', flag: '🇲🇳', group: 'Asia' },
  { code: 'ka-GE', name: 'Georgiano', nativeName: 'ქართული', flag: '🇬🇪', group: 'Asia' },
  { code: 'hy-AM', name: 'Armeno', nativeName: 'Հայերեն', flag: '🇦🇲', group: 'Asia' },
  { code: 'az-AZ', name: 'Azero', nativeName: 'Azərbaycan', flag: '🇦🇿', group: 'Asia' },
  { code: 'kk-KZ', name: 'Kazako', nativeName: 'Қазақша', flag: '🇰🇿', group: 'Asia' },
  { code: 'uz-UZ', name: 'Uzbeko', nativeName: 'Oʻzbek', flag: '🇺🇿', group: 'Asia' },
  { code: 'he-IL', name: 'Ebraico', nativeName: 'עברית', flag: '🇮🇱', group: 'Medio Oriente' },
  { code: 'fa-IR', name: 'Persiano (Farsi)', nativeName: 'فارسی', flag: '🇮🇷', group: 'Medio Oriente' },
  // Americas & Africa
  { code: 'es-MX', name: 'Spagnolo (Messico)', nativeName: 'Español (MX)', flag: '🇲🇽', group: 'Americhe' },
  { code: 'es-AR', name: 'Spagnolo (Argentina)', nativeName: 'Español (AR)', flag: '🇦🇷', group: 'Americhe' },
  { code: 'es-CO', name: 'Spagnolo (Colombia)', nativeName: 'Español (CO)', flag: '🇨🇴', group: 'Americhe' },
  { code: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', group: 'Africa' },
  { code: 'am-ET', name: 'Amarico', nativeName: 'አማርኛ', flag: '🇪🇹', group: 'Africa' },
  { code: 'yo-NG', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', group: 'Africa' },
  { code: 'ig-NG', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', group: 'Africa' },
  { code: 'ha-NG', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', group: 'Africa' },
  { code: 'zu-ZA', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', group: 'Africa' },
  { code: 'af-ZA', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', group: 'Africa' }
];

export interface LipSyncViseme {
  mouthOpen: number;     // 0 (closed) to 1 (wide open)
  mouthWidth: number;    // 0 (pursed) to 1 (wide smile)
  jawOpen: number;       // 0 to 1
  eyebrowRaise: number;  // 0 to 1
  isBlinking: boolean;
}

export class AvatarVoiceService {
  private static recognition: any = null;
  private static isListening: boolean = false;
  private static currentSpeechUtterance: SpeechSynthesisUtterance | null = null;
  private static animFrameId: number | null = null;
  private static visemeListeners: Set<(viseme: LipSyncViseme) => void> = new Set();
  private static audioLevelListeners: Set<(level: number) => void> = new Set();
  
  private static cachedVoices: SpeechSynthesisVoice[] = [];

  /**
   * Subscribe to real-time lip-sync mouth shape updates (0-60fps)
   */
  static subscribeViseme(cb: (viseme: LipSyncViseme) => void): () => void {
    this.visemeListeners.add(cb);
    return () => this.visemeListeners.delete(cb);
  }

  /**
   * Subscribe to audio level (for visualizer / glow effects)
   */
  static subscribeAudioLevel(cb: (level: number) => void): () => void {
    this.audioLevelListeners.add(cb);
    return () => this.audioLevelListeners.delete(cb);
  }

  /**
   * Check if Speech Recognition is supported in the current browser
   */
  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  /**
   * Check if Speech Synthesis is supported in the current browser
   */
  static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Safe optional check for microphone hardware permissions (used only in permission modals)
   */
  static async requestMicrophonePermission(): Promise<{ ok: boolean; error?: string; stream?: MediaStream }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { 
        ok: false, 
        error: 'Il tuo browser non supporta la cattura audio del microfono. Puoi utilizzare la console di scrittura.' 
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return { ok: true, stream };
    } catch (err: any) {
      let errorMsg = 'Permesso per il microfono non concesso.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg = 'Accesso al microfono bloccato. Consenti il microfono nelle impostazioni del browser.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errorMsg = 'Nessun microfono rilevato. Collega un microfono o usa la console di scrittura.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        errorMsg = 'Il microfono è attualmente occupato da un\'altra applicazione o scheda.';
      }
      return { ok: false, error: errorMsg };
    }
  }

  /**
   * Start listening to user voice via Web Speech API (NO getUserMedia needed)
   */
  static async startListening(
    langCode: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: { error: string; message: string; fatal: boolean }) => void,
    onEnd: () => void
  ): Promise<{ success: boolean; error?: string }> {
    this.stopSpeaking();

    // Verify Web Speech API support
    if (!this.isSpeechRecognitionSupported()) {
      const errorMsg = 'Riconoscimento vocale SpeechRecognition non supportato in questo browser. Puoi digitare nella console di scrittura.';
      onError({ error: 'not-supported', message: errorMsg, fatal: true });
      return { success: false, error: errorMsg };
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.onend = null;
          this.recognition.onerror = null;
          this.recognition.onresult = null;
          this.recognition.abort();
        } catch (_) {}
        this.recognition = null;
      }

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = langCode;
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        const errType = event.error || 'unknown';
        console.warn('[AvatarVoiceService] SpeechRecognition error:', errType);
        
        if (errType === 'no-speech') {
          // Normal timeout if user was silent
          return;
        }

        let userMsg = `Errore microfono: ${errType}`;
        const isFatal = errType === 'not-allowed' || errType === 'service-not-allowed';

        if (errType === 'not-allowed') {
          userMsg = 'Accesso al microfono non consentito. Abilitalo nelle impostazioni del browser o usa la digitazione.';
        } else if (errType === 'service-not-allowed') {
          userMsg = 'Riconoscimento vocale online non autorizzato.';
        } else if (errType === 'network') {
          userMsg = 'Problema di connessione nel servizio vocale. Puoi usare la tastiera.';
        } else if (errType === 'audio-capture') {
          userMsg = 'Nessun segnale audio catturato dal microfono.';
        }

        onError({ error: errType, message: userMsg, fatal: isFatal });
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return { success: true };
    } catch (e: any) {
      console.warn('[AvatarVoiceService] startListening error:', e);
      const errMsg = e?.message || 'Impossibile avviare il microfono.';
      onError({ error: 'start-failed', message: errMsg, fatal: true });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Stop listening to microphone
   */
  static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.onresult = null;
        this.recognition.stop();
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  /**
   * Speak a text response in the requested language, with realistic lip-sync animation
   */
  static speak(
    text: string,
    langCode: string,
    persona: 'laila' | 'marco',
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.isSpeechSynthesisSupported()) {
      onEnd?.();
      return;
    }

    try {
      this.stopListening();
      this.stopSpeaking();

      // Clean text for speech: remove code blocks, JSON snippets, markdown stars
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'dati tecnici in console')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .trim();

      if (!cleanText) {
        onEnd?.();
        return;
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = persona === 'marco' ? 0.95 : 1.05;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = langCode.split('-')[0].toLowerCase();
      const matchingVoices = voices.filter(v => 
        v.lang.toLowerCase() === langCode.toLowerCase() || 
        v.lang.toLowerCase().startsWith(langPrefix)
      );

      if (matchingVoices.length > 0) {
        const preferredVoice = matchingVoices.find(v => 
          (persona === 'laila' ? /female|woman|laila|elena|alice|monica|samantha|paola|federica/i.test(v.name) : /male|man|marco|luca|cosimo|jorge/i.test(v.name)) ||
          /google|natural|premium/i.test(v.name)
        ) || matchingVoices[0];
        utterance.voice = preferredVoice;
      }

      let isFinished = false;
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        this.stopLipSyncLoop();
        this.currentSpeechUtterance = null;
        (window as any).__jokerUtterance = null;
        onEnd?.();
      };

      utterance.onstart = () => {
        onStart?.();
        this.startLipSyncLoop();
      };

      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn('[AvatarVoiceService] TTS event:', e);
        finish();
      };

      this.currentSpeechUtterance = utterance;
      (window as any).__jokerUtterance = utterance;

      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch (err) {
          console.warn('[AvatarVoiceService] speak invocation error:', err);
          finish();
        }
      }, 25);
    } catch (e) {
      console.error('[AvatarVoiceService] Speech synthesis failed:', e);
      this.stopLipSyncLoop();
      onEnd?.();
    }
  }

  /**
   * Stop speaking immediately
   */
  static stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    this.stopLipSyncLoop();
    this.currentSpeechUtterance = null;
  }

  /**
   * Internal animated phoneme/viseme oscillator for lifelike lip movement while speaking
   */
  private static startLipSyncLoop(): void {
    this.stopLipSyncLoop();
    let startTime = Date.now();

    const frame = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      // Dynamic simulated speech envelope with natural syllabic cadence (3 to 6 Hz syllables)
      const syllableOsc = Math.sin(elapsed * 18);
      const accentOsc = Math.sin(elapsed * 7.5);
      const microJitter = (Math.random() - 0.5) * 0.15;

      const rawOpen = (Math.sin(elapsed * 12) * 0.5 + 0.5) * (0.6 + syllableOsc * 0.3) + microJitter;
      const mouthOpen = Math.min(1, Math.max(0.08, rawOpen));
      const mouthWidth = 0.5 + Math.sin(elapsed * 9) * 0.35;
      const jawOpen = mouthOpen * 0.85;
      const eyebrowRaise = Math.max(0, Math.sin(elapsed * 3) * 0.3);

      const viseme: LipSyncViseme = {
        mouthOpen,
        mouthWidth,
        jawOpen,
        eyebrowRaise,
        isBlinking: false
      };

      this.visemeListeners.forEach(cb => cb(viseme));
      this.audioLevelListeners.forEach(cb => cb(mouthOpen));

      this.animFrameId = requestAnimationFrame(frame);
    };

    this.animFrameId = requestAnimationFrame(frame);
  }

  private static stopLipSyncLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    const idleViseme: LipSyncViseme = {
      mouthOpen: 0,
      mouthWidth: 0.5,
      jawOpen: 0,
      eyebrowRaise: 0,
      isBlinking: false
    };
    this.visemeListeners.forEach(cb => cb(idleViseme));
    this.audioLevelListeners.forEach(cb => cb(0));
  }
}
