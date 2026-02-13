-- Create the Saved Items table
create table if not exists public.cbn_app_saved_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  target_type text not null check (target_type in ('news', 'announcement')),
  target_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, target_id, target_type)
);

-- Enable Row Level Security
alter table public.cbn_app_saved_items enable row level security;

-- Policies

-- Users can insert their own saved items
create policy "Users can insert their own saved items"
  on public.cbn_app_saved_items for insert
  with check (auth.uid() = user_id);

-- Users can view their own saved items
create policy "Users can view their own saved items"
  on public.cbn_app_saved_items for select
  using (auth.uid() = user_id);

-- Users can delete their own saved items
create policy "Users can delete their own saved items"
  on public.cbn_app_saved_items for delete
  using (auth.uid() = user_id);
