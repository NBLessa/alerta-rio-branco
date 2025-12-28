-- Add DELETE policy for alerts (needed for admin)
CREATE POLICY "Anyone can delete alerts" 
ON public.alerts 
FOR DELETE 
USING (true);

-- Add DELETE policy for alert_media
CREATE POLICY "Anyone can delete alert media" 
ON public.alert_media 
FOR DELETE 
USING (true);

-- Add DELETE policy for sentinela_users (needed for admin)
CREATE POLICY "Anyone can delete users" 
ON public.sentinela_users 
FOR DELETE 
USING (true);