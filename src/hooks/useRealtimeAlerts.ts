import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertStatus, FILTER_OPTIONS } from '@/types/alert';

interface UseRealtimeAlertsOptions {
  filterHours?: number;
  includeHistory?: boolean;
  pollingInterval?: number; // in milliseconds
}

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

interface AlertMediaFromDB {
  alert_id: string;
  photo_url: string;
}

// Transform database alert to app Alert type
function transformAlert(dbAlert: AlertFromDB, photos: string[] = []): Alert {
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
}

export function useRealtimeAlerts(options: UseRealtimeAlertsOptions = {}) {
  const { filterHours, includeHistory = false, pollingInterval = 30000 } = options;
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const isMountedRef = useRef(true);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch alerts from Supabase
  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch all alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      if (!alertsData || !isMountedRef.current) return;

      // Fetch all media for alerts
      const alertIds = alertsData.map(a => a.id);
      const { data: mediaData } = await supabase
        .from('alert_media')
        .select('alert_id, photo_url')
        .in('alert_id', alertIds);

      // Group photos by alert_id
      const photosByAlert: Record<string, string[]> = {};
      (mediaData || []).forEach((m: AlertMediaFromDB) => {
        if (!photosByAlert[m.alert_id]) {
          photosByAlert[m.alert_id] = [];
        }
        photosByAlert[m.alert_id].push(m.photo_url);
      });

      // Transform and filter alerts
      const now = new Date();
      let transformedAlerts = alertsData.map((dbAlert: AlertFromDB) => 
        transformAlert(dbAlert, photosByAlert[dbAlert.id] || [])
      );

      // Count active alerts before filtering
      const activeAlertsCount = transformedAlerts.filter(a => a.status === 'ACTIVE').length;

      // Apply filters
      if (!includeHistory) {
        transformedAlerts = transformedAlerts.filter(alert => {
          if (alert.status !== 'ACTIVE') return false;
          if (filterHours) {
            const alertAge = (now.getTime() - alert.createdAt.getTime()) / (1000 * 60 * 60);
            return alertAge <= filterHours;
          }
          return true;
        });
      }

      if (isMountedRef.current) {
        setAlerts(transformedAlerts);
        setActiveCount(activeAlertsCount);
        setLastUpdated(new Date());
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch alerts'));
        setIsLoading(false);
      }
    }
  }, [filterHours, includeHistory]);

  // Setup polling
  const setupPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }

    const poll = async () => {
      await fetchAlerts();
      if (isMountedRef.current) {
        pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
      }
    };

    pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
  }, [fetchAlerts, pollingInterval]);

  // Initial fetch and setup realtime subscription
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchAlerts();

    // Setup realtime subscription for instant updates
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          // Refetch on any change
          fetchAlerts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alert_media'
        },
        () => {
          // Refetch when media changes
          fetchAlerts();
        }
      )
      .subscribe();

    // Setup polling as backup
    setupPolling();

    return () => {
      isMountedRef.current = false;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts, setupPolling]);

  // Refetch when filter options change
  useEffect(() => {
    fetchAlerts();
  }, [filterHours, includeHistory, fetchAlerts]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setIsLoading(true);
    return fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    activeCount,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}
