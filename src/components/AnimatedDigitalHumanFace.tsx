import React, { useRef, useEffect } from 'react';
import { LipSyncViseme } from '../services/avatarVoiceService';

interface AnimatedDigitalHumanFaceProps {
  avatarImgUrl: string;
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  audioLevel: number;
  viseme: LipSyncViseme;
  personaName: string;
  plantName: string;
}

export const AnimatedDigitalHumanFace: React.FC<AnimatedDigitalHumanFaceProps> = ({
  avatarImgUrl,
  isSpeaking,
  isListening,
  isProcessing,
  audioLevel,
  viseme,
  personaName,
  plantName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load avatar image once
  useEffect(() => {
    const img = new Image();
    img.src = avatarImgUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
    };
  }, [avatarImgUrl]);

  // Main 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = Date.now();
    let nextBlinkTime = Date.now() + 2500;
    let blinkDuration = 180; // ms
    let isBlinking = false;
    let blinkStartTime = 0;

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      // Handle natural blinking timing
      if (!isBlinking && now > nextBlinkTime) {
        isBlinking = true;
        blinkStartTime = now;
      }
      let blinkProgress = 0; // 0 = open, 1 = fully closed
      if (isBlinking) {
        const blinkElapsed = now - blinkStartTime;
        if (blinkElapsed >= blinkDuration) {
          isBlinking = false;
          nextBlinkTime = now + 2600 + Math.random() * 3200;
        } else {
          // Smooth bell curve for blink
          const progress = blinkElapsed / blinkDuration;
          blinkProgress = Math.sin(progress * Math.PI);
        }
      }

      ctx.clearRect(0, 0, w, h);

      // 1. Organic Breathing & Head Movement Simulation
      const breathPhase = Math.sin(elapsed * 1.4); // ~0.22 Hz (normal human resting breath rate ~13 breaths/min)
      const swayPhase = Math.sin(elapsed * 0.7);   // micro head sway
      const nodPhase = isSpeaking ? Math.sin(elapsed * 9) * 0.015 : 0; // subtle speech nodding

      const scale = 1.0 + breathPhase * 0.012 + (isListening ? 0.018 : 0);
      const offsetY = breathPhase * 3.5 + nodPhase * 20;
      const offsetX = swayPhase * 2.0;
      const rotation = swayPhase * 0.008 + (isListening ? 0.012 : 0);

      ctx.save();
      // Apply center-anchored transform for breathing and sway
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2 + offsetX, -h / 2 + offsetY);

      // Draw base avatar image if loaded
      const img = imageRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        // Fallback gradient if loading
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Realistic Dynamic Mouth & Lip-Sync Animation
      // Calibrated face coordinates:
      const mouthX = w * 0.505;
      const mouthY = h * 0.695;

      if (isSpeaking && viseme.mouthOpen > 0.04) {
        ctx.save();
        const openAmp = viseme.mouthOpen * 16;
        const widthAmp = 18 + viseme.mouthWidth * 10;

        // A. Dark Oral Cavity Depth
        ctx.beginPath();
        ctx.ellipse(mouthX, mouthY + openAmp * 0.28, widthAmp * 0.75, Math.max(1, openAmp * 0.8), 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(35, 12, 18, 0.88)';
        ctx.fill();

        // B. Upper Teeth Line (subtle white reflection)
        if (openAmp > 4) {
          ctx.beginPath();
          ctx.ellipse(mouthX, mouthY - openAmp * 0.08, widthAmp * 0.55, 2.5, 0, 0, Math.PI);
          ctx.fillStyle = 'rgba(240, 240, 245, 0.75)';
          ctx.fill();
        }

        // C. Upper Lip Contour
        ctx.beginPath();
        ctx.ellipse(mouthX, mouthY - openAmp * 0.18, widthAmp * 0.85, Math.max(2, 4.5 - openAmp * 0.12), 0, 0, Math.PI);
        ctx.fillStyle = 'rgba(190, 85, 95, 0.42)';
        ctx.fill();

        // D. Lower Lip Contour
        ctx.beginPath();
        ctx.ellipse(mouthX, mouthY + openAmp * 0.65, widthAmp * 0.78, Math.max(2.5, 5 - openAmp * 0.1), 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = 'rgba(205, 95, 105, 0.38)';
        ctx.fill();

        ctx.restore();
      }

      // 3. Smooth Eyelid Blinking
      if (blinkProgress > 0.05) {
        ctx.save();
        const eyeLY = h * 0.442;
        const eyeLX = w * 0.415;
        const eyeRY = h * 0.442;
        const eyeRX = w * 0.598;
        const eyeW = 15;
        const eyeH = 10 * blinkProgress;

        // Skin-matched eyelid color with gradient
        ctx.fillStyle = 'rgba(218, 178, 158, 0.95)';
        ctx.strokeStyle = 'rgba(120, 70, 60, 0.7)';
        ctx.lineWidth = 1.2;

        // Left eye
        ctx.beginPath();
        ctx.ellipse(eyeLX, eyeLY, eyeW, eyeH, -0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right eye
        ctx.beginPath();
        ctx.ellipse(eyeRX, eyeRY, eyeW, eyeH, 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore(); // restore center-anchored breathing transform

      // 4. Industrial Holographic Cyber-Ring & Audio Waves
      ctx.save();
      const ringPulse = isListening 
        ? (Math.sin(elapsed * 8) * 0.5 + 0.5) 
        : isSpeaking 
        ? (audioLevel * 1.4) 
        : (Math.sin(elapsed * 2) * 0.2 + 0.2);

      const ringColor = isListening 
        ? 'rgba(16, 185, 129, ' 
        : isSpeaking 
        ? 'rgba(6, 182, 212, ' 
        : 'rgba(56, 189, 248, ';

      // Animated Circular Halo
      ctx.strokeStyle = ringColor + (0.35 + ringPulse * 0.4) + ')';
      ctx.lineWidth = 1.5 + ringPulse * 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, (w / 2) - 8, 0, Math.PI * 2);
      ctx.stroke();

      // Holographic corner reticles
      ctx.strokeStyle = ringColor + '0.6)';
      ctx.lineWidth = 2;
      const cornerSize = 14;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(8, 8 + cornerSize);
      ctx.lineTo(8, 8);
      ctx.lineTo(8 + cornerSize, 8);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(w - 8 - cornerSize, 8);
      ctx.lineTo(w - 8, 8);
      ctx.lineTo(w - 8, 8 + cornerSize);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(8, h - 8 - cornerSize);
      ctx.lineTo(8, h - 8);
      ctx.lineTo(8 + cornerSize, h - 8);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(w - 8 - cornerSize, h - 8);
      ctx.lineTo(w - 8, h - 8);
      ctx.lineTo(w - 8, h - 8 - cornerSize);
      ctx.stroke();

      // Subtle horizontal scanning line when processing
      if (isProcessing) {
        const scanY = ((elapsed * 120) % h);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.fillRect(0, scanY, w, 2);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [avatarImgUrl, isSpeaking, isListening, isProcessing, audioLevel, viseme]);

  return (
    <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center border-b border-slate-800">
      {/* 60fps Canvas Displaying Realistic Avatar Face, Lip-Sync and Breathing */}
      <canvas 
        ref={canvasRef}
        width={420}
        height={315}
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Real-time Status Badge */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 border border-slate-700/80 backdrop-blur-md text-[10px] font-mono text-slate-200 shadow-md">
        <span className={`w-2 h-2 rounded-full ${
          isSpeaking 
            ? 'bg-cyan-400 animate-pulse' 
            : isListening 
            ? 'bg-emerald-400 animate-ping' 
            : isProcessing 
            ? 'bg-amber-400 animate-spin' 
            : 'bg-emerald-400'
        }`} />
        <span className="font-medium">
          {isSpeaking ? 'Laila sta parlando' : isListening ? 'In ascolto attivo...' : isProcessing ? 'Elaborazione JOKER 80...' : 'Laila è online'}
        </span>
      </div>

      {/* Plant Location Tag */}
      <div className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-full bg-slate-950/85 border border-cyan-500/40 backdrop-blur-md text-[9px] font-mono text-cyan-300 font-bold truncate max-w-[150px] shadow-md">
        {plantName.split(' - ')[0]}
      </div>

      {/* Live Audio Visualizer Overlay When Speaking */}
      {isSpeaking && (
        <div className="absolute bottom-2.5 inset-x-3 z-20 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/85 border border-cyan-500/50 backdrop-blur-md shadow-lg">
          <span className="text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Voce Attiva
          </span>
          <div className="flex items-end gap-1 h-4">
            {[0.4, 0.9, 0.6, 1.0, 0.7, 0.85, 0.5, 0.95, 0.65].map((h, i) => (
              <span 
                key={i} 
                className="w-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(4, h * (viseme.mouthOpen * 16 + 4))}px`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Live Microphone Meter When Listening */}
      {isListening && (
        <div className="absolute bottom-2.5 inset-x-3 z-20 flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/70 backdrop-blur-md shadow-lg animate-pulse">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
            <span>Parla adesso, ti ascolto...</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-emerald-400 font-mono">Volume:</span>
            <div className="w-14 h-2 bg-slate-800 rounded-full overflow-hidden border border-emerald-500/40">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                style={{ width: `${Math.max(10, Math.min(100, audioLevel * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
