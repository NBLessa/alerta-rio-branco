import { useEffect, useState, useCallback, useRef } from 'react';
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

// Enhanced custom marker icons with pulse ring for active alerts
const createCustomIcon = (status: Alert['status'], isSelected: boolean) => {
  const colors = {
    ACTIVE: { main: '#f97316', ring: 'rgba(249,115,22,0.3)', shadow: 'rgba(249,115,22,0.4)' },
    RESOLVED: { main: '#22c55e', ring: 'rgba(34,197,94,0.2)', shadow: 'rgba(34,197,94,0.3)' },
    EXPIRED: { main: '#94a3b8', ring: 'rgba(148,163,184,0.2)', shadow: 'rgba(148,163,184,0.3)' },
  };

  const c = colors[status];
  const size = isSelected ? 42 : 34;
  const pulseRing = status === 'ACTIVE' ? `
    <div style="
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 2px solid ${c.main};
      opacity: 0.5;
      animation: marker-pulse 2s ease-out infinite;
    "></div>
  ` : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${pulseRing}
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${c.main}, ${c.main}dd);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 12px ${c.shadow}, ${isSelected ? `0 0 0 4px ${c.ring}` : '0 1px 4px rgba(0,0,0,0.15)'};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size + 12, size + 12],
    iconAnchor: [(size + 12) / 2, size + 6],
    popupAnchor: [0, -(size + 6)],
  });
};

export function MapView({ alerts, selectedAlert, onAlertSelect }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Inject marker pulse animation
  useEffect(() => {
    const styleId = 'sentinela-marker-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes marker-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        .custom-marker { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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

    currentMarkers.forEach((marker, id) => {
      if (!alertIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    });

    alerts.forEach((alert) => {
      const isSelected = selectedAlert?.id === alert.id;
      const existingMarker = currentMarkers.get(alert.id);

      if (existingMarker) {
        existingMarker.setIcon(createCustomIcon(alert.status, isSelected));
        existingMarker.setLatLng([alert.lat, alert.lng]);
      } else {
        const marker = L.marker([alert.lat, alert.lng], {
          icon: createCustomIcon(alert.status, isSelected),
        });

        marker.bindPopup(`
          <div style="min-width: 160px; font-family: 'Inter', system-ui, sans-serif;">
            <p style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px; color: #1e293b;">${alert.addressText}</p>
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">${timeAgo(alert.createdAt)}</p>
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
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Carregando mapa...</p>
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
      <div className="absolute bottom-1 right-1 text-[9px] text-muted-foreground/40 bg-card/70 backdrop-blur-sm px-2 py-0.5 rounded-full z-[500] border border-border/20">
        Sentinela • Rio Branco
      </div>
    </div>
  );
}
