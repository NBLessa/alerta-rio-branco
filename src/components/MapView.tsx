import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert, RIO_BRANCO_BOUNDS, timeAgo } from '@/types/alert';
import { AlertCard } from './AlertCard';
import { Loader2 } from 'lucide-react';

interface MapViewProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onAlertSelect: (alert: Alert | null) => void;
}

// Custom marker icons
const createCustomIcon = (status: Alert['status']) => {
  const color = status === 'ACTIVE' ? '#EF4444' : status === 'RESOLVED' ? '#22C55E' : '#9CA3AF';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        ${status === 'ACTIVE' ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background-color: ${color};
            opacity: 0.3;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to handle map center changes
function MapController({ selectedAlert }: { selectedAlert: Alert | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedAlert) {
      map.setView([selectedAlert.lat, selectedAlert.lng], 15, { animate: true });
    }
  }, [selectedAlert, map]);
  
  return null;
}

export function MapView({ alerts, selectedAlert, onAlertSelect }: MapViewProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure styles are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkerClick = useCallback((alert: Alert) => {
    onAlertSelect(alert);
  }, [onAlertSelect]);

  return (
    <div className="relative flex-1 bg-muted">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={[RIO_BRANCO_BOUNDS.center.lat, RIO_BRANCO_BOUNDS.center.lng]}
        zoom={RIO_BRANCO_BOUNDS.defaultZoom}
        minZoom={RIO_BRANCO_BOUNDS.minZoom}
        maxZoom={RIO_BRANCO_BOUNDS.maxZoom}
        className="absolute inset-0 z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController selectedAlert={selectedAlert} />
        
        {alerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.lat, alert.lng]}
            icon={createCustomIcon(alert.status)}
            eventHandlers={{
              click: () => handleMarkerClick(alert),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{alert.addressText}</p>
                <p className="text-muted-foreground">{timeAgo(alert.createdAt)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Selected Alert Card */}
      {selectedAlert && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto">
          <AlertCard 
            alert={selectedAlert} 
            onClose={() => onAlertSelect(null)}
          />
        </div>
      )}

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/50 bg-background/50 px-2 py-1 rounded z-[500]">
        Sentinela • Rio Branco, AC
      </div>

      {/* CSS for marker animation */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
