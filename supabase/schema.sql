-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Linked to Auth)
-- Prefixed to avoid conflict in shared project
create table if not exists public.cbn_app_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  display_name text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.cbn_app_profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on public.cbn_app_profiles;
create policy "Public profiles are viewable by everyone." on public.cbn_app_profiles for select using (true);
drop policy if exists "Users can insert their own profile." on public.cbn_app_profiles;
create policy "Users can insert their own profile." on public.cbn_app_profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile." on public.cbn_app_profiles;
create policy "Users can update own profile." on public.cbn_app_profiles for update using (auth.uid() = id);

-- 2. NEWS (News Feed)
create table if not exists public.cbn_app_news (
  id uuid default uuid_generate_v4() primary key,
  headline text, -- Optional now
  content text not null,
  image_url text,
  link_url text,
  link_text text,
  author_id uuid references public.cbn_app_profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for News
alter table public.cbn_app_news enable row level security;
drop policy if exists "News is viewable by everyone." on public.cbn_app_news;
create policy "News is viewable by everyone." on public.cbn_app_news for select using (true);
drop policy if exists "Only Admins can insert news." on public.cbn_app_news;
create policy "Only Admins can insert news." on public.cbn_app_news for insert with check (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Only Admins can update news." on public.cbn_app_news;
create policy "Only Admins can update news." on public.cbn_app_news for update using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Only Admins can delete news." on public.cbn_app_news;
create policy "Only Admins can delete news." on public.cbn_app_news for delete using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);

-- 3. ANNOUNCEMENTS (Official Announcements)
create table if not exists public.cbn_app_announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.cbn_app_profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Announcements
alter table public.cbn_app_announcements enable row level security;
drop policy if exists "Announcements are viewable by everyone." on public.cbn_app_announcements;
create policy "Announcements are viewable by everyone." on public.cbn_app_announcements for select using (true);
drop policy if exists "Only Admins can insert announcements." on public.cbn_app_announcements;
create policy "Only Admins can insert announcements." on public.cbn_app_announcements for insert with check (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Only Admins can update announcements." on public.cbn_app_announcements;
create policy "Only Admins can update announcements." on public.cbn_app_announcements for update using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
drop policy if exists "Only Admins can delete announcements." on public.cbn_app_announcements;
create policy "Only Admins can delete announcements." on public.cbn_app_announcements for delete using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);

-- 4. REACTIONS (Users only)
create table if not exists public.cbn_app_reactions (
  id uuid default uuid_generate_v4() primary key,
  target_type text not null check (target_type in ('news', 'announcement')),
  target_id uuid not null,
  user_id uuid references public.cbn_app_profiles(id) not null,
  reaction text not null check (reaction in ('like', 'love', 'laugh', 'wow', 'sad', 'thanks')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists cbn_app_reactions_unique on public.cbn_app_reactions (target_type, target_id, user_id);
create index if not exists cbn_app_reactions_target_idx on public.cbn_app_reactions (target_type, target_id);

-- RLS for Reactions
alter table public.cbn_app_reactions enable row level security;
drop policy if exists "Reactions are viewable by everyone." on public.cbn_app_reactions;
create policy "Reactions are viewable by everyone." on public.cbn_app_reactions for select using (true);
drop policy if exists "Users can add reactions." on public.cbn_app_reactions;
create policy "Users can add reactions." on public.cbn_app_reactions for insert with check (
  auth.uid() = user_id and exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'user')
);
drop policy if exists "Users can delete own reactions." on public.cbn_app_reactions;
create policy "Users can delete own reactions." on public.cbn_app_reactions for delete using (
  auth.uid() = user_id and exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'user')
);

-- 5. POST VIEWS (Unique Reads)
create table if not exists public.cbn_app_post_views (
  id uuid default uuid_generate_v4() primary key,
  target_type text not null check (target_type in ('news', 'announcement')),
  target_id uuid not null,
  user_id uuid references public.cbn_app_profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists cbn_app_post_views_unique on public.cbn_app_post_views (target_type, target_id, user_id);
create index if not exists cbn_app_post_views_target_idx on public.cbn_app_post_views (target_type, target_id);

alter table public.cbn_app_post_views enable row level security;
drop policy if exists "Post views are viewable by everyone." on public.cbn_app_post_views;
create policy "Post views are viewable by everyone." on public.cbn_app_post_views for select using (true);
drop policy if exists "Users can add views." on public.cbn_app_post_views;
create policy "Users can add views." on public.cbn_app_post_views for insert with check (
  auth.uid() = user_id and exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'user')
);

-- 5B. PUSH TOKENS (For Push Notifications)
create table if not exists public.cbn_app_push_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.cbn_app_profiles(id) not null,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists cbn_app_push_tokens_user_idx on public.cbn_app_push_tokens (user_id);

alter table public.cbn_app_push_tokens enable row level security;
drop policy if exists "Users can view own push tokens." on public.cbn_app_push_tokens;
create policy "Users can view own push tokens." on public.cbn_app_push_tokens for select using (
  auth.uid() = user_id
);
drop policy if exists "Users can insert own push tokens." on public.cbn_app_push_tokens;
create policy "Users can insert own push tokens." on public.cbn_app_push_tokens for insert with check (
  auth.uid() = user_id
);
drop policy if exists "Users can update own push tokens." on public.cbn_app_push_tokens;
create policy "Users can update own push tokens." on public.cbn_app_push_tokens for update using (
  auth.uid() = user_id
);
drop policy if exists "Users can delete own push tokens." on public.cbn_app_push_tokens;
create policy "Users can delete own push tokens." on public.cbn_app_push_tokens for delete using (
  auth.uid() = user_id
);

-- Push token upsert function (bypasses RLS for device reassignment)
create or replace function public.upsert_push_token(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into cbn_app_push_tokens (user_id, token, platform, updated_at)
  values (auth.uid(), p_token, p_platform, now())
  on conflict (token) do update set
    user_id = auth.uid(),
    platform = p_platform,
    updated_at = now();
end;
$$;

-- 6. NOTIFICATIONS (In-App)
create table if not exists public.cbn_app_notifications (
  id uuid default uuid_generate_v4() primary key,
  recipient_id uuid references public.cbn_app_profiles(id) not null,
  type text not null check (type in ('news_posted', 'announcement_posted')),
  title text not null,
  body text not null,
  target_type text not null check (target_type in ('news', 'announcement')),
  target_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

create index if not exists cbn_app_notifications_recipient_idx on public.cbn_app_notifications (recipient_id, created_at desc);

alter table public.cbn_app_notifications enable row level security;
drop policy if exists "Notifications are viewable by recipient." on public.cbn_app_notifications;
create policy "Notifications are viewable by recipient." on public.cbn_app_notifications for select using (
  auth.uid() = recipient_id
);
drop policy if exists "Users can mark notifications read." on public.cbn_app_notifications;
create policy "Users can mark notifications read." on public.cbn_app_notifications for update using (
  auth.uid() = recipient_id
);

create or replace function public.notify_cbn_app_users(
  p_type text,
  p_title text,
  p_body text,
  p_target_type text,
  p_target_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cbn_app_notifications (recipient_id, type, title, body, target_type, target_id)
  select id, p_type, p_title, p_body, p_target_type, p_target_id
  from public.cbn_app_profiles
  where role = 'user';
end;
$$;

create or replace function public.on_cbn_app_news_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_cbn_app_users(
    'news_posted',
    'News Update',
    left(coalesce(new.content, ''), 140),
    'news',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_cbn_app_news_created on public.cbn_app_news;
create trigger on_cbn_app_news_created
  after insert on public.cbn_app_news
  for each row execute procedure public.on_cbn_app_news_created();

create or replace function public.on_cbn_app_announcement_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_cbn_app_users(
    'announcement_posted',
    concat('Announcement: ', coalesce(new.title, '')),
    left(coalesce(new.content, ''), 140),
    'announcement',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_cbn_app_announcement_created on public.cbn_app_announcements;
create trigger on_cbn_app_announcement_created
  after insert on public.cbn_app_announcements
  for each row execute procedure public.on_cbn_app_announcement_created();

-- 7. STORAGE (Buckets)
-- We'll use a specific folder convention or a separate bucket if possible, 
-- but a dedicated bucket 'cbn_app_media' is safest.
insert into storage.buckets (id, name, public)
values ('cbn_app_media', 'cbn_app_media', true)
on conflict (id) do nothing;

-- Storage Policies for 'cbn_app_media' bucket
drop policy if exists "Media is viewable by everyone" on storage.objects;
create policy "Media is viewable by everyone" on storage.objects for select using ( bucket_id = 'cbn_app_media' );
drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media" on storage.objects for insert with check ( bucket_id = 'cbn_app_media' and auth.role() = 'authenticated' );
drop policy if exists "Users can update their own media" on storage.objects;
create policy "Users can update their own media" on storage.objects for update using ( bucket_id = 'cbn_app_media' and auth.uid() = owner );
drop policy if exists "Users can delete their own media" on storage.objects;
create policy "Users can delete their own media" on storage.objects for delete using ( bucket_id = 'cbn_app_media' and auth.uid() = owner );

-- 8. FUNCTION to handle new user signup automatically
-- Checks meta data to see if source is 'cbn_app' or just defaults to user role
create or replace function public.handle_new_cbn_app_user()
returns trigger as $$
begin
  -- Optional: check if the user is signing up via this specific app if you separate auth
  -- For now, we just create a profile in cbn_app_profiles
  insert into public.cbn_app_profiles (id, email, display_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup. 
-- Note: Triggers on auth.users are global. This will run for ALL new users in the project.
-- Use ON CONFLICT DO NOTHING to avoid errors if other apps share this auth.
create or replace function public.handle_new_cbn_app_user()
returns trigger as $$
begin
  insert into public.cbn_app_profiles (id, email, display_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication errors when re-running
drop trigger if exists on_auth_user_created_cbn_app on auth.users;

create trigger on_auth_user_created_cbn_app
  after insert on auth.users
  for each row execute procedure public.handle_new_cbn_app_user();
