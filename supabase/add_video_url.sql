-- Migration to add video_url to news
ALTER TABLE public.cbn_app_news ADD COLUMN IF NOT EXISTS video_url text;

-- Update RLS if necessary (it should be covered by existing policies if they use SELECT *)
