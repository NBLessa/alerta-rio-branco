import { useState, useEffect } from 'react';
import { Waves, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RiverData {
  nivel?: number;
  altura?: number;
  value?: number;
  data?: string;
  dataHora?: string;
  tendencia?: string;
}

export function RiverLevelBadge() {
  const [riverData, setRiverData] = useState<RiverData | null>(null);
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
        setRiverData(data.data);
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

  const level = riverData?.nivel ?? riverData?.altura ?? riverData?.value ?? null;
  
  const getLevelStatus = (level: number) => {
    if (level >= 14) return { color: 'bg-destructive', text: 'Crítico', textColor: 'text-destructive-foreground' };
    if (level >= 13) return { color: 'bg-orange-500', text: 'Alerta', textColor: 'text-white' };
    if (level >= 12) return { color: 'bg-yellow-500', text: 'Atenção', textColor: 'text-black' };
    return { color: 'bg-success', text: 'Normal', textColor: 'text-success-foreground' };
  };

  const status = level !== null ? getLevelStatus(level) : null;

  const getTrendIcon = () => {
    if (!riverData?.tendencia) return <Minus className="w-3 h-3" />;
    if (riverData.tendencia === 'subindo') return <TrendingUp className="w-3 h-3" />;
    if (riverData.tendencia === 'descendo') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div className="fixed bottom-24 right-4 z-[1000]">
      <div 
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
          ${status ? status.color : 'bg-muted'} 
          ${status ? status.textColor : 'text-muted-foreground'}
          cursor-pointer hover:scale-105 transition-transform
        `}
        onClick={fetchRiverLevel}
        title="Clique para atualizar"
      >
        <Waves className="w-5 h-5" />
        
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : error ? (
          <span className="text-sm font-medium">{error}</span>
        ) : level !== null ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{level.toFixed(2)}m</span>
            {getTrendIcon()}
            <span className="text-xs opacity-90">{status?.text}</span>
          </div>
        ) : (
          <span className="text-sm">--</span>
        )}
      </div>
      
      <div className="text-center mt-1">
        <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
          Rio Acre
        </span>
      </div>
    </div>
  );
}