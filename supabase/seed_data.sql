DO $$
DECLARE
  v_author_id uuid;
BEGIN
  -- Attempt to find an admin user first
  SELECT id INTO v_author_id FROM public.cbn_app_profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin found, fallback to any user
  IF v_author_id IS NULL THEN
    SELECT id INTO v_author_id FROM public.cbn_app_profiles LIMIT 1;
  END IF;

  -- Only proceed if a user profile exists
  IF v_author_id IS NOT NULL THEN
    
    -- Insert News Items
    INSERT INTO public.cbn_app_news (headline, content, image_url, author_id, created_at)
    VALUES 
    (
      'Welcome to CBN App', 
      'This is the first news post in the CBN application. We are excited to have you here! Check back often for the latest updates and stories from our community.', 
      'https://picsum.photos/seed/cbn1/800/600', 
      v_author_id, 
      now() - interval '2 hours'
    ),
    (
      'Community Guidelines Update', 
      'We have updated our community guidelines to ensure a safe and welcoming environment for everyone. Please take a moment to review them.', 
      'https://picsum.photos/seed/cbn2/800/600', 
      v_author_id, 
      now() - interval '1 day'
    ),
    (
      'Tech Corner: New Features', 
      'The new Avatar Upload feature is now live! Go to your profile to upload a custom picture. We are also working on push notifications.', 
      'https://picsum.photos/seed/cbn3/800/600', 
      v_author_id, 
      now() - interval '3 days'
    );

    -- Insert Announcements
    INSERT INTO public.cbn_app_announcements (title, content, author_id, created_at)
    VALUES
    (
      'System Maintenance Scheduled', 
      'The server will undergo scheduled maintenance this Sunday from 2 AM to 4 AM UTC. Please plan accordingly.', 
      v_author_id, 
      now()
    ),
    (
      'Holiday Hours', 
      'Our administrative offices will be closed for the upcoming holiday. Support will be available via email.', 
      v_author_id, 
      now() - interval '5 days'
    );

    RAISE NOTICE 'Seed data inserted successfully using author_id: %', v_author_id;
  ELSE
    RAISE NOTICE 'No user profiles found. Please sign up a user in the app first.';
  END IF;
END $$;
