import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert, RIO_BRANCO_BOUNDS, timeAgo } from '@/types/alert';
import { AlertCard } from './AlertCard';
import { Loader2, MapPin } from 'lucide-react';

interface MapViewProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onAlertSelect: (alert: Alert | null) => void;
}

// Custom marker icons
const createCustomIcon = (status: Alert['status'], isSelected: boolean) => {
  const color = status === 'ACTIVE' ? '#EF4444' : status === 'RESOLVED' ? '#22C55E' : '#9CA3AF';
  const size = isSelected ? 40 : 32;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        ${isSelected ? 'box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.3);' : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export function MapView({ alerts, selectedAlert, onAlertSelect }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [RIO_BRANCO_BOUNDS.center.lat, RIO_BRANCO_BOUNDS.center.lng],
      zoom: RIO_BRANCO_BOUNDS.defaultZoom,
      minZoom: RIO_BRANCO_BOUNDS.minZoom,
      maxZoom: RIO_BRANCO_BOUNDS.maxZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;
    setIsLoading(false);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when alerts change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const currentMarkers = markersRef.current;
    const alertIds = new Set(alerts.map(a => a.id));

    // Remove markers that no longer exist
    currentMarkers.forEach((marker, id) => {
      if (!alertIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    alerts.forEach((alert) => {
      const isSelected = selectedAlert?.id === alert.id;
      const existingMarker = currentMarkers.get(alert.id);

      if (existingMarker) {
        // Update existing marker icon
        existingMarker.setIcon(createCustomIcon(alert.status, isSelected));
        existingMarker.setLatLng([alert.lat, alert.lng]);
      } else {
        // Create new marker
        const marker = L.marker([alert.lat, alert.lng], {
          icon: createCustomIcon(alert.status, isSelected),
        });

        marker.bindPopup(`
          <div style="min-width: 150px;">
            <p style="font-weight: 600; margin: 0 0 4px 0;">${alert.addressText}</p>
            <p style="color: #666; margin: 0; font-size: 12px;">${timeAgo(alert.createdAt)}</p>
          </div>
        `);

        marker.on('click', () => {
          onAlertSelect(alert);
        });

        marker.addTo(map);
        currentMarkers.set(alert.id, marker);
      }
    });
  }, [alerts, selectedAlert, onAlertSelect]);

  // Center map on selected alert
  useEffect(() => {
    if (!mapRef.current || !selectedAlert) return;
    mapRef.current.setView([selectedAlert.lat, selectedAlert.lng], 15, { animate: true });
  }, [selectedAlert]);

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
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 z-0"
        style={{ height: '100%', width: '100%' }}
      />

      {/* Selected Alert Card */}
      {selectedAlert && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-[1000] max-w-md mx-auto safe-area-bottom">
          <AlertCard 
            alert={selectedAlert} 
            onClose={() => onAlertSelect(null)}
          />
        </div>
      )}

      {/* Map Attribution */}
      <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 text-[10px] sm:text-xs text-muted-foreground/50 bg-background/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded z-[500]">
        Sentinela • Rio Branco
      </div>
    </div>
  );
}
