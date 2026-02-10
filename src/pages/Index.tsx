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
  const [activeFilter, setActiveFilter] = useState('active-all');
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('sentinela_splash_seen');
    return !hasSeenSplash;
  });

  const filter = FILTER_OPTIONS.find(f => f.id === activeFilter);

  const { alerts, activeCount } = useRealtimeAlerts({
    filterHours: filter?.hours,
    includeHistory: filter?.includeHistory,
    pollingInterval: 30000,
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

      <RiverLevelBadge />

      <MapView
        alerts={alerts}
        selectedAlert={selectedAlert}
        onAlertSelect={setSelectedAlert}
      />

      {/* Footer */}
      <footer className="relative bg-card border-t border-border/50 py-3 sm:py-4 px-4 sm:px-6 text-center safe-area-bottom">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Desenvolvido por{' '}
          <a
            href="https://instagram.com/inovacehub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold transition-colors"
          >
            @Inovacehub
          </a>
          {' '}• Nathan Lessa
        </p>
      </footer>
    </div>
  );
};

export default Index;
