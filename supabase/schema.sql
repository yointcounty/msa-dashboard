-- Miami Skate Academy persistent data model
--
-- Run this file only on a fresh Supabase project. The production project already
-- has these objects plus its private auth trigger and RLS policies.
-- Parent signup writes parent_name and child_name into auth metadata. The
-- private.handle_new_user trigger creates the profile, skater, settings, and
-- one roadmap row per trick. All child records cascade from the parent profile.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  parent_name text,
  role text not null default 'family' check (role in ('family','coach')),
  created_at timestamptz not null default now()
);
create table if not exists public.skaters (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.tricks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  category text not null default 'core',
  created_at timestamptz not null default now()
);
create table if not exists public.skater_tricks (
  skater_id uuid not null references public.skaters(id) on delete cascade,
  trick_id uuid not null references public.tricks(id) on delete cascade,
  status text not null default 'not_started',
  progress int not null default 0 check (progress between 0 and 100),
  coach_note text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (skater_id, trick_id)
);
create table if not exists public.skater_settings (
  skater_id uuid primary key references public.skaters(id) on delete cascade,
  stance text not null default 'not_set',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.skater_notes (
  id uuid primary key default gen_random_uuid(),
  skater_id uuid not null references public.skaters(id) on delete cascade,
  author_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  skater_id uuid not null references public.skaters(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  skater_id uuid not null references public.skaters(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('photo','video')),
  caption text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.skater_next_sessions (
  skater_id uuid primary key references public.skaters(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  location text not null,
  title text not null default 'MSA Member Session',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists skater_next_sessions_updated_by_idx on public.skater_next_sessions(updated_by);

insert into public.tricks (name, sort_order, category) values
  ('Step Off Safely', 75, 'super_beginner'),
  ('Two-Foot Landing', 76, 'super_beginner'),
  ('Flip Board & Land', 77, 'super_beginner'),
  ('Jump On Board (Small Surface)', 78, 'super_beginner')
on conflict (name) do nothing;

insert into storage.buckets (id, name, public) values ('skater-media', 'skater-media', false) on conflict (id) do nothing;
