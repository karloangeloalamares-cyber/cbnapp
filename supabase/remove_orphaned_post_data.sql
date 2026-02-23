-- Function to clean up orphaned records for Polymorphic Associations
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_post_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_type text;
BEGIN
  -- Determine the target_type string dynamically based on the table name
  IF TG_TABLE_NAME = 'cbn_app_news' THEN
    v_target_type := 'news';
  ELSIF TG_TABLE_NAME = 'cbn_app_announcements' THEN
    v_target_type := 'announcement';
  END IF;

  -- 1. Cascade Delete: Saved Items
  DELETE FROM public.cbn_app_saved_items 
  WHERE target_type = v_target_type AND target_id = OLD.id;

  -- 2. Cascade Delete: Notifications
  DELETE FROM public.cbn_app_notifications
  WHERE target_type = v_target_type AND target_id = OLD.id;

  -- 3. Cascade Delete: Reactions
  DELETE FROM public.cbn_app_reactions
  WHERE target_type = v_target_type AND target_id = OLD.id;

  -- 4. Cascade Delete: Post Views Tracking
  DELETE FROM public.cbn_app_post_views
  WHERE target_type = v_target_type AND target_id = OLD.id;

  RETURN OLD;
END;
$$;

-- Drop existing triggers to avoid overlap errors if run multiple times
DROP TRIGGER IF EXISTS trigger_cleanup_news ON public.cbn_app_news;
DROP TRIGGER IF EXISTS trigger_cleanup_announcements ON public.cbn_app_announcements;

-- Attach trigger to the News table -> Executed BEFORE DELETE so references remain valid during cleanup
CREATE TRIGGER trigger_cleanup_news
  BEFORE DELETE ON public.cbn_app_news
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_orphaned_post_data();

-- Attach trigger to the Announcements table 
CREATE TRIGGER trigger_cleanup_announcements
  BEFORE DELETE ON public.cbn_app_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_orphaned_post_data();
