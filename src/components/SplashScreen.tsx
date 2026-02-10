import { useState, useEffect } from 'react';
import { SentinelaLogo } from '@/components/SentinelaLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Phase transitions
    const holdTimer = setTimeout(() => setPhase('hold'), 800);
    const exitTimer = setTimeout(() => setPhase('exit'), 2200);
    const finishTimer = setTimeout(() => onFinish(), 2800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        transition-all duration-600
        ${phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
      `}
      style={{
        background: 'linear-gradient(160deg, #0f1f3d 0%, #1a365d 40%, #1e3a5f 60%, #0f2847 100%)',
      }}
    >
      {/* Ambient glow effects */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, hsl(24 95% 53% / 0.4) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, hsl(210 100% 45% / 0.3) 0%, transparent 70%)' }}
      />

      {/* Animated Logo */}
      <div className="relative">
        {/* Outer ripple ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-56 h-56 rounded-full border-2 border-white/10 animate-ripple"
            style={{ animationDuration: '2.5s' }}
          />
        </div>

        {/* Inner ripple ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-48 h-48 rounded-full border border-white/15 animate-ripple"
            style={{ animationDuration: '2s', animationDelay: '0.5s' }}
          />
        </div>

        {/* Logo with scale animation */}
        <div className="relative z-10 animate-[splash-logo_0.8s_ease-out_forwards] drop-shadow-2xl">
          <SentinelaLogo size={200} />
        </div>
      </div>

      {/* Text with staggered reveal */}
      <div className="mt-8 text-center space-y-2">
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-[0.3em] uppercase animate-[fade-in_0.6s_ease-out_0.4s_forwards] opacity-0"
        >
          SENTINELA
        </h1>
        <p className="text-white/50 text-sm sm:text-base font-medium tracking-widest animate-[fade-in_0.6s_ease-out_0.7s_forwards] opacity-0">
          Monitoramento de Alagamentos
        </p>
        <p className="text-white/30 text-xs tracking-wider animate-[fade-in_0.6s_ease-out_0.9s_forwards] opacity-0">
          Rio Branco — Acre
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-10 w-48 animate-[fade-in_0.5s_ease-out_1s_forwards] opacity-0">
        <div className="progress-bar bg-white/10">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(24 95% 53%), hsl(210 100% 45%))',
            }}
          />
        </div>
      </div>
    </div>
  );
}