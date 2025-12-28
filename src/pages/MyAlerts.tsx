import { useState } from 'react';
import { Header } from '@/components/Header';
import { Alert, timeAgo, getWhatsAppHelpUrl } from '@/types/alert';
import { 
  findUserByToken, 
  getAlertsByToken, 
  updateAlertStatus, 
  updateAlertNotes 
} from '@/store/alertStore';
import { 
  Search, AlertTriangle, Check, RefreshCw, 
  MapPin, Clock, Edit3, MessageCircle, Loader2,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

const MyAlerts = () => {
  const [token, setToken] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const handleSearch = () => {
    if (!token.trim()) {
      toast.error('Digite seu código Sentinela');
      return;
    }

    setIsSearching(true);
    
    setTimeout(() => {
      const user = findUserByToken(token.toUpperCase().trim());
      
      if (!user) {
        toast.error('Código não encontrado');
        setAlerts([]);
      } else {
        const userAlerts = getAlertsByToken(token.toUpperCase().trim());
        setAlerts(userAlerts);
        
        if (userAlerts.length === 0) {
          toast.info('Nenhum alerta encontrado');
        } else {
          toast.success(`${userAlerts.length} alerta(s) encontrado(s)`);
        }
      }
      
      setHasSearched(true);
      setIsSearching(false);
    }, 500);
  };

  const handleResolve = (alertId: string) => {
    const updated = updateAlertStatus(alertId, 'RESOLVED');
    if (updated) {
      setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));
      toast.success('Alerta encerrado');
    }
  };

  const handleRenew = (alertId: string) => {
    const updated = updateAlertStatus(alertId, 'ACTIVE');
    if (updated) {
      setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));
      toast.success('Alerta renovado por mais 24h');
    }
  };

  const handleSaveNotes = (alertId: string) => {
    const updated = updateAlertNotes(alertId, tempNotes);
    if (updated) {
      setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));
      setEditingNotes(null);
      toast.success('Observação atualizada');
    }
  };

  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="status-active flex items-center gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Ativo
          </span>
        );
      case 'EXPIRED':
        return <span className="status-expired">Expirado</span>;
      case 'RESOLVED':
        return (
          <span className="status-resolved flex items-center gap-1">
            <Check className="w-3 h-3" />
            Resolvido
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Meus Alertas
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus alertas de alagamento
            </p>
          </div>

          {/* Token Search */}
          <div className="bg-card rounded-2xl shadow-lg border border-border p-6 mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Key className="w-4 h-4 inline mr-2" />
              Digite seu Código Sentinela
            </label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: ABC123"
                maxLength={8}
                className="input-field flex-1 font-mono text-lg tracking-wider text-center uppercase"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="btn-emergency px-6"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Alerts List */}
          {hasSearched && (
            <div className="space-y-4 animate-fade-in">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta encontrado</p>
                  <p className="text-sm mt-2">Verifique o código e tente novamente</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="card-alert">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="font-mono text-sm text-muted-foreground mb-1">
                          #{alert.id}
                        </p>
                        {getStatusBadge(alert.status)}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {timeAgo(alert.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{alert.addressText}</p>
                        {alert.neighborhood && (
                          <p className="text-xs text-muted-foreground">{alert.neighborhood}</p>
                        )}
                      </div>
                    </div>

                    {/* Photos */}
                    {alert.photos.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {alert.photos.map((photo, index) => (
                          <img 
                            key={index}
                            src={photo} 
                            alt={`Foto ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-border flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {editingNotes === alert.id ? (
                      <div className="mb-4">
                        <textarea
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          maxLength={200}
                          rows={2}
                          className="input-field text-sm resize-none mb-2"
                          placeholder="Adicione uma observação..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="flex-1 py-2 text-sm bg-muted text-foreground rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveNotes(alert.id)}
                            className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : alert.notes ? (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{alert.notes}</p>
                        <button
                          onClick={() => {
                            setEditingNotes(alert.id);
                            setTempNotes(alert.notes || '');
                          }}
                          className="text-xs text-primary mt-2 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNotes(alert.id);
                          setTempNotes('');
                        }}
                        className="text-sm text-primary mb-4 flex items-center gap-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        Adicionar observação
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {alert.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="w-full py-3 bg-success text-success-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Encerrar alerta
                          </button>
                          <button
                            onClick={() => handleRenew(alert.id)}
                            className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Ainda está alagado (+24h)
                          </button>
                        </>
                      )}

                      {alert.status === 'EXPIRED' && (
                        <button
                          onClick={() => handleRenew(alert.id)}
                          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Reativar alerta
                        </button>
                      )}

                      <a
                        href={getWhatsAppHelpUrl(alert)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-success/10 text-success rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-success/20 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Pedir ajuda
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyAlerts;
