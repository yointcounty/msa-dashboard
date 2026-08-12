-- MSA account lifecycle migration (applied to Supabase project epanlocaznmaydpnzomr)
-- Profiles and skaters are created by private.handle_new_user() from auth metadata:
-- parent_name and child_name. All progress, notes, notifications, and media use
-- foreign keys with ON DELETE CASCADE so data persists across app deployments and
-- is removed only when the family account is intentionally deleted.

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  skater_id uuid not null references public.skaters(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('photo','video')),
  caption text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;
grant select, insert, update, delete on public.media to authenticated;

create or replace function public.delete_family_account(target_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $function$
declare caller_id uuid := (select auth.uid());
begin
  if caller_id is null then raise exception 'Authentication required'; end if;
  if target_user_id is null then raise exception 'A target account is required'; end if;
  if caller_id <> target_user_id and not (select private.is_coach()) then raise exception 'Only the account owner or an MSA coach can delete this account'; end if;
  if exists (select 1 from public.profiles where id = target_user_id and role = 'coach') then raise exception 'Coach accounts cannot be deleted from the family account tool'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id and role = 'family') then raise exception 'Family account not found'; end if;
  delete from storage.objects o where o.bucket_id = 'skater-media' and exists (select 1 from public.media m join public.skaters s on s.id = m.skater_id where m.storage_path = o.name and s.parent_user_id = target_user_id);
  delete from auth.users where id = target_user_id;
end;
$function$;
revoke all on function public.delete_family_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_family_account(uuid) to authenticated;

insert into storage.buckets (id, name, public) values ('skater-media', 'skater-media', false) on conflict (id) do nothing;
