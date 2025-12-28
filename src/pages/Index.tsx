import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { MapView } from '@/components/MapView';
import { RiverStreamModal } from '@/components/RiverStreamModal';
import { Alert, FILTER_OPTIONS } from '@/types/alert';
import { getFilteredAlerts, countActiveAlerts } from '@/store/alertStore';
import { Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeFilter, setActiveFilter] = useState('active-24h');
  const [activeCount, setActiveCount] = useState(0);
  const [streamOpen, setStreamOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <FilterBar 
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        activeCount={activeCount}
      />
      
      {/* Floating River Stream Button */}
      <Button
        onClick={() => setStreamOpen(true)}
        className="fixed bottom-24 right-4 z-[1000] shadow-lg gap-2"
        size="lg"
      >
        <Waves className="w-5 h-5" />
        Ver o Rio
      </Button>
      
      <MapView 
        alerts={alerts}
        selectedAlert={selectedAlert}
        onAlertSelect={setSelectedAlert}
      />
      
      <RiverStreamModal 
        open={streamOpen} 
        onOpenChange={setStreamOpen} 
      />
    </div>
  );
};

export default Index;
