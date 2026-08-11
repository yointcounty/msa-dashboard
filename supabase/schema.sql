create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null, age int not null check (age between 3 and 18),
  skill_level text not null default ''beginner'' check (skill_level in (''beginner'',''intermediate'',''advanced'')),
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(), child_id uuid not null references public.children(id) on delete cascade,
  session_date date not null, location text not null, coach text not null, notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), child_id uuid not null references public.children(id) on delete cascade,
  name text not null, completed boolean not null default false, completed_at timestamptz
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), child_id uuid not null references public.children(id) on delete cascade,
  title text not null, description text, week_start date not null default current_date
);
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(), child_id uuid not null references public.children(id) on delete cascade,
  storage_path text not null, kind text not null check (kind in (''photo'',''video'')), caption text, created_at timestamptz not null default now()
);
alter table public.children enable row level security;
alter table public.sessions enable row level security;
alter table public.skills enable row level security;
alter table public.goals enable row level security;
alter table public.media enable row level security;
create policy "parents manage own children" on public.children for all to authenticated using ((select auth.uid()) = parent_id) with check ((select auth.uid()) = parent_id);
create policy "parents read child data" on public.sessions for select to authenticated using (exists (select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
create policy "parents read skills" on public.skills for select to authenticated using (exists (select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
create policy "parents read goals" on public.goals for select to authenticated using (exists (select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
create policy "parents manage media" on public.media for all to authenticated using (exists (select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid()))) with check (exists (select 1 from public.children c where c.id=child_id and c.parent_id=(select auth.uid())));
