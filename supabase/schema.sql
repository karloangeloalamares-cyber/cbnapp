-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Linked to Auth)
-- Prefixed to avoid conflict in shared project
create table public.cbn_app_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  display_name text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.cbn_app_profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.cbn_app_profiles for select using (true);
create policy "Users can insert their own profile." on public.cbn_app_profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.cbn_app_profiles for update using (auth.uid() = id);

-- 2. NEWS (News Feed)
create table public.cbn_app_news (
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
create policy "News is viewable by everyone." on public.cbn_app_news for select using (true);
create policy "Only Admins can insert news." on public.cbn_app_news for insert with check (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
create policy "Only Admins can update news." on public.cbn_app_news for update using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
create policy "Only Admins can delete news." on public.cbn_app_news for delete using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);

-- 3. ANNOUNCEMENTS (Official Announcements)
create table public.cbn_app_announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_id uuid references public.cbn_app_profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Announcements
alter table public.cbn_app_announcements enable row level security;
create policy "Announcements are viewable by everyone." on public.cbn_app_announcements for select using (true);
create policy "Only Admins can insert announcements." on public.cbn_app_announcements for insert with check (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
create policy "Only Admins can update announcements." on public.cbn_app_announcements for update using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);
create policy "Only Admins can delete announcements." on public.cbn_app_announcements for delete using (
  exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'admin')
);

-- 4. REACTIONS (Users only)
create table public.cbn_app_reactions (
  id uuid default uuid_generate_v4() primary key,
  target_type text not null check (target_type in ('news', 'announcement')),
  target_id uuid not null,
  user_id uuid references public.cbn_app_profiles(id) not null,
  reaction text not null check (reaction in ('like', 'love', 'laugh', 'wow', 'sad', 'thanks')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index cbn_app_reactions_unique on public.cbn_app_reactions (target_type, target_id, user_id);
create index cbn_app_reactions_target_idx on public.cbn_app_reactions (target_type, target_id);

-- RLS for Reactions
alter table public.cbn_app_reactions enable row level security;
create policy "Reactions are viewable by everyone." on public.cbn_app_reactions for select using (true);
create policy "Users can add reactions." on public.cbn_app_reactions for insert with check (
  auth.uid() = user_id and exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'user')
);
create policy "Users can delete own reactions." on public.cbn_app_reactions for delete using (
  auth.uid() = user_id and exists (select 1 from public.cbn_app_profiles where id = auth.uid() and role = 'user')
);

-- 5. STORAGE (Buckets)
-- We'll use a specific folder convention or a separate bucket if possible, 
-- but a dedicated bucket 'cbn_app_media' is safest.
insert into storage.buckets (id, name, public) values ('cbn_app_media', 'cbn_app_media', true);

-- Storage Policies for 'cbn_app_media' bucket
create policy "Media is viewable by everyone" on storage.objects for select using ( bucket_id = 'cbn_app_media' );
create policy "Authenticated users can upload media" on storage.objects for insert with check ( bucket_id = 'cbn_app_media' and auth.role() = 'authenticated' );
create policy "Users can update their own media" on storage.objects for update using ( bucket_id = 'cbn_app_media' and auth.uid() = owner );
create policy "Users can delete their own media" on storage.objects for delete using ( bucket_id = 'cbn_app_media' and auth.uid() = owner );

-- 6. FUNCTION to handle new user signup automatically
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
