import { useState, useEffect } from 'react';
import logoSentinela from '@/assets/logo-sentinela.png';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Wait for animation to complete
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-b from-[#1a365d] to-[#2d4a7c]
        transition-opacity duration-500
        ${!isAnimating ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Animated Logo */}
      <div className="relative">
        {/* Pulse ring effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-white/10 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
        </div>
        
        {/* Logo with scale animation */}
        <img 
          src={logoSentinela} 
          alt="Sentinela" 
          className={`
            relative z-10 w-48 h-48 object-contain
            animate-[splash-logo_1s_ease-out_forwards]
          `}
        />
      </div>
      
      {/* Text */}
      <div className="mt-8 text-center animate-[fade-in_0.8s_ease-out_0.5s_forwards] opacity-0">
        <h1 className="text-3xl font-bold text-white tracking-wider">
          SENTINELA
        </h1>
        <p className="text-white/70 mt-2 text-sm">
          Monitoramento de Alagamentos
        </p>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-12 animate-[fade-in_0.5s_ease-out_1s_forwards] opacity-0">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}