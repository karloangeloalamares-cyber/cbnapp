-- Add avatar_url column to cbn_app_profiles table
ALTER TABLE public.cbn_app_profiles 
ADD COLUMN avatar_url text;

-- Optional: Add a comment
COMMENT ON COLUMN public.cbn_app_profiles.avatar_url IS 'URL to the user''s avatar image';
