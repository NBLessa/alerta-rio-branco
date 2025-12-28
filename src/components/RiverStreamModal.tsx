import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Waves, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RiverStreamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STREAM_URL = 'https://stream.server.com/live/camera-rio-branco/playlist.m3u8';

export function RiverStreamModal({ open, onOpenChange }: RiverStreamModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hlsRef.current = hls;
      
      hls.loadSource(STREAM_URL);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Não foi possível carregar a transmissão');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      video.src = STREAM_URL;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });
      video.addEventListener('error', () => {
        setError('Não foi possível carregar a transmissão');
        setIsLoading(false);
      });
    } else {
      setError('Seu navegador não suporta reprodução de vídeo HLS');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            Rio Acre - Transmissão ao vivo
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-video bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                <p className="text-sm">Carregando transmissão...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white px-4">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            playsInline
            muted
          />
        </div>
        
        <div className="p-4 pt-2 text-xs text-muted-foreground">
          Câmera monitorando o nível do Rio Acre em Rio Branco, AC
        </div>
      </DialogContent>
    </Dialog>
  );
}