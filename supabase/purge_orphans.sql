-- Cleanup Script: Delete Orphaned Polymorphic Database Records
-- This safely removes records pointing to News or Announcements that no longer exist.

BEGIN;

-- 1. DELETE ORPHANED SAVED ITEMS
-- Target Type: News
DELETE FROM public.cbn_app_saved_items
WHERE target_type = 'news' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_news news 
    WHERE news.id = cbn_app_saved_items.target_id
  );

-- Target Type: Announcements
DELETE FROM public.cbn_app_saved_items
WHERE target_type = 'announcement' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_announcements ann 
    WHERE ann.id = cbn_app_saved_items.target_id
  );


-- 2. DELETE ORPHANED NOTIFICATIONS
-- Target Type: News
DELETE FROM public.cbn_app_notifications
WHERE target_type = 'news' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_news news 
    WHERE news.id = cbn_app_notifications.target_id
  );

-- Target Type: Announcements
DELETE FROM public.cbn_app_notifications
WHERE target_type = 'announcement' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_announcements ann 
    WHERE ann.id = cbn_app_notifications.target_id
  );


-- 3. DELETE ORPHANED REACTIONS
-- Target Type: News
DELETE FROM public.cbn_app_reactions
WHERE target_type = 'news' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_news news 
    WHERE news.id = cbn_app_reactions.target_id
  );

-- Target Type: Announcements
DELETE FROM public.cbn_app_reactions
WHERE target_type = 'announcement' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_announcements ann 
    WHERE ann.id = cbn_app_reactions.target_id
  );


-- 4. DELETE ORPHANED POST VIEWS
-- Target Type: News
DELETE FROM public.cbn_app_post_views
WHERE target_type = 'news' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_news news 
    WHERE news.id = cbn_app_post_views.target_id
  );

-- Target Type: Announcements
DELETE FROM public.cbn_app_post_views
WHERE target_type = 'announcement' 
  AND NOT EXISTS (
    SELECT 1 FROM public.cbn_app_announcements ann 
    WHERE ann.id = cbn_app_post_views.target_id
  );

COMMIT;
