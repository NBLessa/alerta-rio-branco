import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { MapView } from '@/components/MapView';
import { Alert, FILTER_OPTIONS } from '@/types/alert';
import { getFilteredAlerts, countActiveAlerts } from '@/store/alertStore';

const Index = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeFilter, setActiveFilter] = useState('active-24h');
  const [activeCount, setActiveCount] = useState(0);

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
      
      <MapView 
        alerts={alerts}
        selectedAlert={selectedAlert}
        onAlertSelect={setSelectedAlert}
      />
    </div>
  );
};

export default Index;
