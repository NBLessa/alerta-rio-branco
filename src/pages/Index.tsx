import { useState } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { MapView } from '@/components/MapView';
import { RiverLevelBadge } from '@/components/RiverLevelBadge';
import { SplashScreen } from '@/components/SplashScreen';
import { Alert, FILTER_OPTIONS } from '@/types/alert';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';

const Index = () => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeFilter, setActiveFilter] = useState('active-24h');
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('sentinela_splash_seen');
    return !hasSeenSplash;
  });

  // Get filter options
  const filter = FILTER_OPTIONS.find(f => f.id === activeFilter);
  
  // Use realtime alerts hook for automatic updates
  const { alerts, activeCount } = useRealtimeAlerts({
    filterHours: filter?.hours,
    includeHistory: filter?.includeHistory,
    pollingInterval: 30000, // 30 seconds backup polling
  });

  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);
    setSelectedAlert(null);
  };

  const handleSplashFinish = () => {
    sessionStorage.setItem('sentinela_splash_seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <FilterBar 
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        activeCount={activeCount}
      />
      
      {/* River Level Badge */}
      <RiverLevelBadge />
      
      <MapView 
        alerts={alerts}
        selectedAlert={selectedAlert}
        onAlertSelect={setSelectedAlert}
      />
      
      {/* Footer */}
      <footer className="bg-card border-t border-border py-3 px-4 text-center text-xs text-muted-foreground">
        <p>
          Desenvolvido pela{' '}
          <a 
            href="https://instagram.com/inovacehub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            @Inovacehub
          </a>
        </p>
        <p className="mt-1">Todos os direitos reservados ao desenvolvedor Nathan Lessa</p>
      </footer>
    </div>
  );
};

export default Index;
