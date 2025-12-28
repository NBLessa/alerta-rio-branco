-- Enable realtime for alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Enable realtime for alert_media table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_media;