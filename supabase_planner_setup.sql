-- ============================================================================
-- SocialAssist: Temporary Media Storage & Multi-Platform Scheduler Setup
-- Paste into Supabase SQL Editor -> Click "Run"
-- Project: https://supabase.com/dashboard/project/ttmtmsafqmfjdkbtjglv/sql/new
-- ============================================================================

-- 1. Create Temporary Public Media Bucket (`scheduled-media`)
--    Public read is required ONLY while a post is pending so Instagram Graph API,
--    TikTok PULL_FROM_URL, Threads, and Facebook servers can fetch the video/slides.
--    Files are automatically deleted right after publishing (or after 48h expiry).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scheduled-media',
  'scheduled-media',
  true,
  52428800, -- 50 MB max per file (Supabase Free Tier limit)
  array[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS Policies (Users can only upload/delete inside their own `<auth.uid()>/` folder)
drop policy if exists "Public can fetch pending scheduled media" on storage.objects;
create policy "Public can fetch pending scheduled media"
  on storage.objects for select
  using (bucket_id = 'scheduled-media');

drop policy if exists "Users upload own temp scheduled media" on storage.objects;
create policy "Users upload own temp scheduled media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'scheduled-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own temp scheduled media" on storage.objects;
create policy "Users update own temp scheduled media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'scheduled-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own temp scheduled media" on storage.objects;
create policy "Users delete own temp scheduled media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'scheduled-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Scheduled Posts Queue Table
create table if not exists public.scheduled_posts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',
  caption text not null default '',
  captions jsonb not null default '{}'::jsonb,
  format text not null default 'video',
  platforms jsonb not null default '["instagram"]'::jsonb,
  media_urls jsonb not null default '[]'::jsonb,
  storage_paths jsonb not null default '[]'::jsonb,
  scheduled_date text not null default '',
  scheduled_time text not null default '18:00',
  scheduled_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  status text not null default 'scheduled',
  first_comment text not null default '',
  auto_dm_keyword text not null default '',
  auto_dm_url text not null default '',
  auto_cleanup boolean not null default true,
  media_cleaned_up boolean not null default false,
  dispatch_results jsonb not null default '[]'::jsonb,
  last_dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_posts_due
  on public.scheduled_posts (status, scheduled_at);

create index if not exists idx_scheduled_posts_expiry
  on public.scheduled_posts (media_cleaned_up, expires_at);

alter table public.scheduled_posts enable row level security;

drop policy if exists "Users manage own scheduled posts" on public.scheduled_posts;
create policy "Users manage own scheduled posts"
  on public.scheduled_posts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Per-User Platform Tokens Table (Used by 24/7 background cron publisher)
create table if not exists public.user_platform_tokens (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  tokens jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_platform_tokens enable row level security;

drop policy if exists "Users manage own platform tokens" on public.user_platform_tokens;
create policy "Users manage own platform tokens"
  on public.user_platform_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- OPTIONAL (For 24/7 Laptop-Closed Auto-Posting):
-- Once you add `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables,
-- uncomment & run the block below to trigger `/api/cron-publish` every 5 mins:
-- ============================================================================
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule(
--   'social-assist-publish-every-5m',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://techfairylab.com/api/cron-publish',
--     headers := '{"Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
