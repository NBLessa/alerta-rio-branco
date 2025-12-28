import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, RIO_BRANCO_BOUNDS } from '@/types/alert';
import { AlertCard } from './AlertCard';
import { MapPin, Loader2 } from 'lucide-react';

interface MapViewProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onAlertSelect: (alert: Alert | null) => void;
}

export function MapView({ alerts, selectedAlert, onAlertSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // For now, we'll use a static map placeholder since Google Maps requires an API key
  // The actual implementation would use @react-google-maps/api
  
  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAlertClick = useCallback((alert: Alert) => {
    onAlertSelect(alert);
  }, [onAlertSelect]);

  const getMarkerColor = (status: Alert['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-primary';
      case 'EXPIRED': return 'bg-alert-expired';
      case 'RESOLVED': return 'bg-success';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="relative flex-1 bg-muted">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/-67.8107,-9.9747,12,0/1200x800?access_token=pk.placeholder')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Fallback map background with grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/50 to-muted">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Rio Branco label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-lg font-semibold text-muted-foreground/50">Rio Branco - AC</p>
            <p className="text-sm text-muted-foreground/30">Mapa interativo</p>
          </div>
        </div>

        {/* Alert Markers */}
        <div className="absolute inset-0">
          {alerts.map((alert, index) => {
            // Calculate position based on lat/lng relative to bounds
            const latRange = RIO_BRANCO_BOUNDS.north - RIO_BRANCO_BOUNDS.south;
            const lngRange = RIO_BRANCO_BOUNDS.east - RIO_BRANCO_BOUNDS.west;
            
            const top = ((RIO_BRANCO_BOUNDS.north - alert.lat) / latRange) * 100;
            const left = ((alert.lng - RIO_BRANCO_BOUNDS.west) / lngRange) * 100;

            return (
              <button
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`absolute transform -translate-x-1/2 -translate-y-full group z-10 ${
                  selectedAlert?.id === alert.id ? 'z-20' : ''
                }`}
                style={{ 
                  top: `${Math.max(10, Math.min(90, top))}%`, 
                  left: `${Math.max(10, Math.min(90, left))}%` 
                }}
              >
                <div className={`relative`}>
                  {/* Pulse effect for active alerts */}
                  {alert.status === 'ACTIVE' && (
                    <span className="absolute inset-0 w-8 h-8 rounded-full bg-primary/30 animate-ping" />
                  )}
                  
                  {/* Marker */}
                  <div className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full 
                    ${getMarkerColor(alert.status)} 
                    shadow-lg border-2 border-card
                    transform transition-transform group-hover:scale-110
                    ${selectedAlert?.id === alert.id ? 'scale-125 ring-2 ring-primary ring-offset-2' : ''}
                  `}>
                    <MapPin className="w-4 h-4 text-primary-foreground" />
                  </div>
                  
                  {/* Marker stem */}
                  <div className={`
                    absolute left-1/2 -bottom-1 w-0 h-0 -translate-x-1/2
                    border-l-[6px] border-l-transparent
                    border-r-[6px] border-r-transparent
                    border-t-[8px] ${alert.status === 'ACTIVE' ? 'border-t-primary' : alert.status === 'EXPIRED' ? 'border-t-alert-expired' : 'border-t-success'}
                  `} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Selected Alert Card */}
      {selectedAlert && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto">
          <AlertCard 
            alert={selectedAlert} 
            onClose={() => onAlertSelect(null)}
          />
        </div>
      )}

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 bg-background/50 px-2 py-1 rounded z-10">
        Sentinela • Rio Branco, AC
      </div>
    </div>
  );
}
