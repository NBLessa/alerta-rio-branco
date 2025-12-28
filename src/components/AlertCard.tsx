import { Alert, timeAgo, getWhatsAppHelpUrl } from '@/types/alert';
import { MapPin, Clock, MessageCircle, Image, X } from 'lucide-react';
import { useState } from 'react';

interface AlertCardProps {
  alert: Alert;
  onClose?: () => void;
  compact?: boolean;
}

export function AlertCard({ alert, onClose, compact = false }: AlertCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const statusClass = {
    ACTIVE: 'status-active',
    EXPIRED: 'status-expired',
    RESOLVED: 'status-resolved',
  }[alert.status];

  const statusLabel = {
    ACTIVE: 'Alagado agora',
    EXPIRED: 'Expirado',
    RESOLVED: 'Resolvido',
  }[alert.status];

  const handlePhotoClick = (photo: string) => {
    setSelectedPhoto(photo);
    setShowPhoto(true);
  };

  return (
    <>
      <div className={`card-alert ${compact ? 'p-3' : 'p-4'} animate-fade-in`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <span className={statusClass}>{statusLabel}</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Clock className="w-4 h-4" />
          <span>{timeAgo(alert.createdAt)}</span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{alert.addressText}</p>
            {alert.neighborhood && (
              <p className="text-xs text-muted-foreground">{alert.neighborhood}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        {alert.notes && (
          <p className="text-sm text-muted-foreground mb-3 bg-muted/50 p-2 rounded-lg">
            {alert.notes}
          </p>
        )}

        {/* Photos */}
        {alert.photos && alert.photos.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {alert.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => handlePhotoClick(photo)}
                className="relative flex-shrink-0 group"
              >
                <img 
                  src={photo} 
                  alt={`Foto ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-border group-hover:border-primary transition-colors"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 rounded-lg transition-colors flex items-center justify-center">
                  <Image className="w-5 h-5 text-card opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <a
          href={getWhatsAppHelpUrl(alert)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-success text-success-foreground rounded-xl font-semibold hover:brightness-110 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          Pedir ajuda
        </a>
      </div>

      {/* Photo Modal */}
      {showPhoto && selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setShowPhoto(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-card hover:text-card/80 transition-colors"
            onClick={() => setShowPhoto(false)}
            aria-label="Fechar"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedPhoto} 
            alt="Foto do alagamento"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
