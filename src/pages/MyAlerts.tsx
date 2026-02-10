import { useState } from 'react';
import { Header } from '@/components/Header';
import { Alert, AlertStatus, timeAgo, getWhatsAppHelpUrl } from '@/types/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, AlertTriangle, Check, RefreshCw,
  MapPin, Clock, Edit3, MessageCircle, Loader2,
  Key, Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface AlertFromDB {
  id: string;
  user_id: string;
  address_text: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  notes: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  resolved_at: string | null;
}

const MyAlerts = () => {
  const [token, setToken] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const transformAlert = (dbAlert: AlertFromDB, photos: string[] = []): Alert => {
    return {
      id: dbAlert.id,
      userId: dbAlert.user_id,
      addressText: dbAlert.address_text,
      neighborhood: dbAlert.neighborhood || undefined,
      lat: dbAlert.lat,
      lng: dbAlert.lng,
      status: dbAlert.status as AlertStatus,
      notes: dbAlert.notes || undefined,
      photos,
      createdAt: new Date(dbAlert.created_at),
      updatedAt: new Date(dbAlert.updated_at),
      expiresAt: new Date(dbAlert.expires_at),
      resolvedAt: dbAlert.resolved_at ? new Date(dbAlert.resolved_at) : undefined,
    };
  };

  const handleSearch = async () => {
    if (!token.trim()) {
      toast.error('Digite seu código Sentinela');
      return;
    }

    setIsSearching(true);

    try {
      const { data: users, error: userError } = await supabase
        .from('sentinela_users')
        .select('*')
        .eq('token', token.toUpperCase().trim())
        .limit(1);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        toast.error('Código não encontrado');
        setAlerts([]);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      const user = users[0];

      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      if (!alertsData || alertsData.length === 0) {
        toast.info('Nenhum alerta encontrado');
        setAlerts([]);
        setHasSearched(true);
        setIsSearching(false);
        return;
      }

      const alertIds = alertsData.map(a => a.id);
      const { data: mediaData } = await supabase
        .from('alert_media')
        .select('alert_id, photo_url')
        .in('alert_id', alertIds);

      const photosByAlert: Record<string, string[]> = {};
      (mediaData || []).forEach((m) => {
        if (!photosByAlert[m.alert_id]) {
          photosByAlert[m.alert_id] = [];
        }
        photosByAlert[m.alert_id].push(m.photo_url);
      });

      const transformedAlerts = alertsData.map((dbAlert: AlertFromDB) =>
        transformAlert(dbAlert, photosByAlert[dbAlert.id] || [])
      );

      setAlerts(transformedAlerts);
      toast.success(`${transformedAlerts.length} alerta(s) encontrado(s)`);

    } catch (error) {
      console.error('Error searching alerts:', error);
      toast.error('Erro ao buscar alertas');
      setAlerts([]);
    } finally {
      setHasSearched(true);
      setIsSearching(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'RESOLVED' as const,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a =>
        a.id === alertId
          ? { ...a, status: 'RESOLVED' as AlertStatus, resolvedAt: new Date() }
          : a
      ));
      toast.success('Alerta encerrado');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erro ao encerrar alerta');
    }
  };

  const handleRenew = async (alertId: string) => {
    try {
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'ACTIVE' as const,
          expires_at: newExpiresAt,
          resolved_at: null
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a =>
        a.id === alertId
          ? { ...a, status: 'ACTIVE' as AlertStatus, expiresAt: new Date(newExpiresAt), resolvedAt: undefined }
          : a
      ));
      toast.success('Alerta renovado por mais 24h');
    } catch (error) {
      console.error('Error renewing alert:', error);
      toast.error('Erro ao renovar alerta');
    }
  };

  const handleSaveNotes = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ notes: tempNotes })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, notes: tempNotes } : a
      ));
      setEditingNotes(null);
      toast.success('Observação atualizada');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Erro ao salvar observação');
    }
  };

  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="status-active flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
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
          {/* Hero section */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/10">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1.5">
              Meus Alertas
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus alertas de alagamento
            </p>
          </div>

          {/* Token Search */}
          <div className="bg-card rounded-2xl shadow-lg border border-border/60 p-5 sm:p-6 mb-6 animate-slide-up">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Key className="w-4 h-4 text-primary" />
              Código Sentinela
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
                className="btn-emergency px-5"
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
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-base font-medium text-muted-foreground">Nenhum alerta encontrado</p>
                  <p className="text-sm text-muted-foreground/70 mt-1.5">Verifique o código e tente novamente</p>
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className="card-alert animate-slide-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground/60 mb-1.5">
                          #{alert.id.slice(0, 8)}
                        </p>
                        {getStatusBadge(alert.status)}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {timeAgo(alert.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 mb-4">
                      <div className="mt-0.5 p-1 rounded-md bg-primary/10 flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.addressText}</p>
                        {alert.neighborhood && (
                          <p className="text-xs text-muted-foreground">{alert.neighborhood}</p>
                        )}
                      </div>
                    </div>

                    {/* Photos */}
                    {alert.photos.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                        {alert.photos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo}
                            alt={`Foto ${i + 1}`}
                            className="w-16 h-16 object-cover rounded-xl border border-border/50 flex-shrink-0"
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
                            className="flex-1 py-2.5 text-sm bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveNotes(alert.id)}
                            className="flex-1 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl font-medium hover:brightness-110 transition-all"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : alert.notes ? (
                      <div className="mb-4 p-3 bg-muted/40 rounded-xl border border-border/40">
                        <p className="text-sm text-muted-foreground">{alert.notes}</p>
                        <button
                          onClick={() => {
                            setEditingNotes(alert.id);
                            setTempNotes(alert.notes || '');
                          }}
                          className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
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
                        className="text-sm text-primary mb-4 flex items-center gap-1 hover:underline"
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
                            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white transition-all active:scale-[0.97]"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                          >
                            <Check className="w-5 h-5" />
                            Encerrar alerta
                          </button>
                          <button
                            onClick={() => handleRenew(alert.id)}
                            className="w-full py-3 btn-secondary rounded-xl font-semibold flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Ainda está alagado (+24h)
                          </button>
                        </>
                      )}

                      {alert.status === 'EXPIRED' && (
                        <button
                          onClick={() => handleRenew(alert.id)}
                          className="w-full py-3 btn-emergency rounded-xl font-semibold flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Reativar alerta
                        </button>
                      )}

                      <a
                        href={getWhatsAppHelpUrl(alert)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                        style={{
                          background: 'linear-gradient(135deg, #25d366, #128c7e)',
                          color: 'white',
                        }}
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
