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
create index if not exists media_skater_id_idx on public.media(skater_id);
create index if not exists media_created_by_idx on public.media(created_by);

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

-- Coach-only repair path for incomplete or incorrect signups. This is one
-- transaction so a skater, settings row, and full roadmap are created together.
create or replace function public.coach_link_skater(target_user_id uuid, skater_name text, existing_skater_id uuid default null)
returns uuid language plpgsql security invoker set search_path = public, private as $function$
declare
  caller_id uuid := auth.uid();
  result_id uuid;
begin
  if caller_id is null or not private.is_coach() then raise exception 'Only an MSA coach can link a skater'; end if;
  if target_user_id is null then raise exception 'A family account is required'; end if;
  if nullif(btrim(coalesce(skater_name, '')), '') is null then raise exception 'A skater name is required'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id and role = 'family') then raise exception 'Family account not found'; end if;
  if existing_skater_id is not null then
    if not exists (select 1 from public.skaters where id = existing_skater_id) then raise exception 'Existing skater record not found'; end if;
    update public.skaters set parent_user_id = target_user_id, name = btrim(skater_name), active = true where id = existing_skater_id;
    result_id := existing_skater_id;
  else
    select id into result_id from public.skaters where parent_user_id = target_user_id and active = true order by created_at limit 1;
    if result_id is null then
      insert into public.skaters (parent_user_id, name, active) values (target_user_id, btrim(skater_name), true) returning id into result_id;
    else
      update public.skaters set name = btrim(skater_name), active = true where id = result_id;
    end if;
  end if;
  insert into public.skater_settings (skater_id, updated_by) values (result_id, caller_id)
    on conflict (skater_id) do update set updated_by = excluded.updated_by, updated_at = now();
  insert into public.skater_tricks (skater_id, trick_id) select result_id, id from public.tricks on conflict (skater_id, trick_id) do nothing;
  return result_id;
end;
$function$;
revoke all on function public.coach_link_skater(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.coach_link_skater(uuid, text, uuid) to authenticated;

drop policy if exists "media_select_family_or_coach" on public.media;
drop policy if exists "media_insert_coach" on public.media;
drop policy if exists "media_update_coach" on public.media;
drop policy if exists "media_delete_coach" on public.media;
create policy "media_select_family_or_coach" on public.media for select to authenticated using (exists (select 1 from public.skaters s where s.id = media.skater_id and (s.parent_user_id = (select auth.uid()) or (select private.is_coach()))));
create policy "media_insert_coach" on public.media for insert to authenticated with check ((select private.is_coach()));
create policy "media_update_coach" on public.media for update to authenticated using ((select private.is_coach())) with check ((select private.is_coach()));
create policy "media_delete_coach" on public.media for delete to authenticated using ((select private.is_coach()));

