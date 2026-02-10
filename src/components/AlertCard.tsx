import { Alert, timeAgo, getWhatsAppHelpUrl } from '@/types/alert';
import { MapPin, Clock, MessageCircle, Image, X, Maximize2 } from 'lucide-react';
import { useState } from 'react';

interface AlertCardProps {
  alert: Alert;
  onClose?: () => void;
  compact?: boolean;
}

export function AlertCard({ alert, onClose, compact = false }: AlertCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const statusConfig = {
    ACTIVE: {
      class: 'status-active',
      label: 'Alagado agora',
      dotClass: 'bg-primary',
      showPulse: true,
    },
    EXPIRED: {
      class: 'status-expired',
      label: 'Expirado',
      dotClass: 'bg-muted-foreground',
      showPulse: false,
    },
    RESOLVED: {
      class: 'status-resolved',
      label: 'Resolvido',
      dotClass: 'bg-success',
      showPulse: false,
    },
  }[alert.status];

  const handlePhotoClick = (photo: string) => {
    setSelectedPhoto(photo);
    setShowPhoto(true);
  };

  return (
    <>
      <div className={`card-alert animate-scale-in ${compact ? 'p-3' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={statusConfig.class}>
              {statusConfig.showPulse && (
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
              {statusConfig.label}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo(alert.createdAt)}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <div className="mt-0.5 p-1 rounded-md bg-primary/10">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{alert.addressText}</p>
            {alert.neighborhood && (
              <p className="text-xs text-muted-foreground">{alert.neighborhood}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        {alert.notes && (
          <div className="mb-3 p-2.5 bg-muted/40 rounded-xl border border-border/40">
            <p className="text-sm text-muted-foreground leading-relaxed">{alert.notes}</p>
          </div>
        )}

        {/* Photos */}
        {alert.photos && alert.photos.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {alert.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => handlePhotoClick(photo)}
                className="relative flex-shrink-0 group rounded-xl overflow-hidden"
              >
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* WhatsApp Help Button */}
        <a
          href={getWhatsAppHelpUrl(alert)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #25d366, #128c7e)',
            color: 'white',
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Pedir ajuda via WhatsApp
        </a>
      </div>

      {/* Photo Modal */}
      {showPhoto && selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPhoto(false)}
        >
          <button
            className="absolute top-4 right-4 p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            onClick={() => setShowPhoto(false)}
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Foto do alagamento"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
