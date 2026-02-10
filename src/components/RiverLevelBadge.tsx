import { useState, useEffect } from 'react';
import { Waves, RefreshCw, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RiverApiData {
  id: string | null;
  rio: string;
  data: string;
  hora: string;
  chuvaEmMm: number;
  cotaEmCm: number;
}

export function RiverLevelBadge() {
  const [riverData, setRiverData] = useState<RiverApiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiverLevel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('river-level');

      if (fnError) {
        console.error('Error fetching river level:', fnError);
        setError('Erro ao carregar');
        return;
      }

      if (data?.success && data?.data) {
        const apiData = Array.isArray(data.data) ? data.data[0] : data.data;
        setRiverData(apiData);
      } else {
        setError(data?.error || 'Dados indisponíveis');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiverLevel();
    const interval = setInterval(fetchRiverLevel, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const levelInMeters = riverData?.cotaEmCm ? riverData.cotaEmCm / 100 : null;

  const getLevelStatus = (levelMeters: number) => {
    if (levelMeters >= 14) return {
      bg: 'bg-red-600',
      text: 'Crítico',
      textColor: 'text-white',
      glow: 'shadow-[0_0_16px_rgba(220,38,38,0.4)]',
    };
    if (levelMeters >= 13.5) return {
      bg: 'bg-orange-500',
      text: 'Alerta',
      textColor: 'text-white',
      glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]',
    };
    if (levelMeters >= 13) return {
      bg: 'bg-amber-500',
      text: 'Atenção',
      textColor: 'text-amber-950',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.25)]',
    };
    return {
      bg: 'bg-emerald-500',
      text: 'Normal',
      textColor: 'text-white',
      glow: 'shadow-md',
    };
  };

  const status = levelInMeters !== null ? getLevelStatus(levelInMeters) : null;

  const formatDateTime = () => {
    if (!riverData?.data || !riverData?.hora) return '';
    return `${riverData.hora.slice(0, 5)}`;
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-4 z-[1000] animate-slide-up">
      {/* Main badge */}
      <button
        className={`
          flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl
          ${status ? status.bg : 'bg-muted'} 
          ${status ? status.textColor : 'text-muted-foreground'}
          ${status ? status.glow : 'shadow-md'}
          hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation
          border border-white/20
        `}
        onClick={fetchRiverLevel}
        title="Clique para atualizar"
      >
        <Waves className="w-4 h-4 sm:w-5 sm:h-5" />

        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : error ? (
          <span className="text-xs sm:text-sm font-medium">{error}</span>
        ) : levelInMeters !== null ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-lg font-bold tabular-nums">{levelInMeters.toFixed(2)}m</span>
            <span className="text-[10px] sm:text-xs font-medium opacity-85 hidden sm:inline px-1.5 py-0.5 bg-white/15 rounded-full">
              {status?.text}
            </span>
          </div>
        ) : (
          <span className="text-sm">--</span>
        )}
      </button>

      {/* Info subtitle */}
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-border/30">
          Rio Acre {formatDateTime() && `• ${formatDateTime()}`}
        </span>
        {riverData?.chuvaEmMm !== undefined && riverData.chuvaEmMm > 0 && (
          <span className="text-[9px] sm:text-[10px] text-water bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-border/30 flex items-center gap-1">
            <Droplets className="w-2.5 h-2.5" />
            {riverData.chuvaEmMm}mm
          </span>
        )}
      </div>
    </div>
  );
}