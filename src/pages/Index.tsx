import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { MapView } from '@/components/MapView';
import { RiverLevelBadge } from '@/components/RiverLevelBadge';
import { SplashScreen } from '@/components/SplashScreen';
import { Alert, FILTER_OPTIONS } from '@/types/alert';
import { getFilteredAlerts, countActiveAlerts } from '@/store/alertStore';

const Index = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeFilter, setActiveFilter] = useState('active-24h');
  const [activeCount, setActiveCount] = useState(0);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    const hasSeenSplash = sessionStorage.getItem('sentinela_splash_seen');
    return !hasSeenSplash;
  });

  useEffect(() => {
    const loadAlerts = () => {
      const filter = FILTER_OPTIONS.find(f => f.id === activeFilter);
      const filteredAlerts = getFilteredAlerts(filter?.hours, filter?.includeHistory);
      setAlerts(filteredAlerts);
      setActiveCount(countActiveAlerts());
    };

    loadAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [activeFilter]);

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
