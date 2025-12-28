import { useState, useEffect } from 'react';
import { Waves, TrendingUp, TrendingDown, Minus, RefreshCw, Droplets } from 'lucide-react';
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
        // API returns an array, get the first element
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
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRiverLevel, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Convert centimeters to meters
  const levelInMeters = riverData?.cotaEmCm ? riverData.cotaEmCm / 100 : null;
  
  const getLevelStatus = (levelMeters: number) => {
    if (levelMeters >= 14) return { color: 'bg-destructive', text: 'Crítico', textColor: 'text-destructive-foreground' };
    if (levelMeters >= 13.5) return { color: 'bg-orange-500', text: 'Alerta', textColor: 'text-white' };
    if (levelMeters >= 13) return { color: 'bg-yellow-500', text: 'Atenção', textColor: 'text-black' };
    return { color: 'bg-success', text: 'Normal', textColor: 'text-success-foreground' };
  };

  const status = levelInMeters !== null ? getLevelStatus(levelInMeters) : null;

  const formatDateTime = () => {
    if (!riverData?.data || !riverData?.hora) return '';
    return `${riverData.hora.slice(0, 5)}`;
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-4 z-[1000]">
      <div 
        className={`
          flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg
          ${status ? status.color : 'bg-muted'} 
          ${status ? status.textColor : 'text-muted-foreground'}
          cursor-pointer hover:scale-105 active:scale-95 transition-transform touch-manipulation
        `}
        onClick={fetchRiverLevel}
        title="Clique para atualizar"
      >
        <Waves className="w-4 h-4 sm:w-5 sm:h-5" />
        
        {isLoading ? (
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        ) : error ? (
          <span className="text-xs sm:text-sm font-medium">{error}</span>
        ) : levelInMeters !== null ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-sm sm:text-lg font-bold">{levelInMeters.toFixed(2)}m</span>
            <span className="text-[10px] sm:text-xs opacity-90 hidden sm:inline">{status?.text}</span>
          </div>
        ) : (
          <span className="text-xs sm:text-sm">--</span>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
        <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-background/80 px-1.5 sm:px-2 py-0.5 rounded">
          Rio Acre {formatDateTime() && `• ${formatDateTime()}`}
        </span>
        {riverData?.chuvaEmMm !== undefined && riverData.chuvaEmMm > 0 && (
          <span className="text-[9px] sm:text-[10px] text-primary bg-background/80 px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-0.5 sm:gap-1">
            <Droplets className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {riverData.chuvaEmMm}mm
          </span>
        )}
      </div>
    </div>
  );
}