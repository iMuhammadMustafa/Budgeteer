-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: rls-tenant-vuln — move the tenant claim to server-managed app_metadata
-- ─────────────────────────────────────────────────────────────────────────────
--
-- PROBLEM (the live vulnerability):
--   auth.tenantid() read `tenantid` from the JWT `user_metadata` claim, which is
--   CLIENT-WRITABLE (supabase.auth.updateUser({ data: { tenantid } }) and the
--   signup `options.data`). An authenticated user could rewrite their own
--   user_metadata.tenantid to any other tenant's id and — because every RLS
--   policy filters on `tenantid = auth.tenantid()` — read and write that tenant's
--   rows. Confirmed by supabase.rls.cloud.test.ts → VULN(rls-tenant-vuln).
--
-- FIX:
--   1. auth.tenantid() now reads from `app_metadata`, which is SERVER-MANAGED:
--      PostgREST/GoTrue never let a client write it, so the claim can't be forged.
--   2. The active tenant is assigned SERVER-SIDE at signup (client-supplied
--      tenantid in user_metadata is IGNORED for the security claim).
--   3. Existing users are backfilled once, from their current profiles.tenantid.
--   4. The profiles UPDATE policy is hardened so a user can't rewrite id/tenantid.
--
-- FUTURE (join-a-different-tenancy — see docs/testing/SUPABASE-SECURITY-AUDIT.md §2):
--   `tenant_members` + `switch_active_tenant()` below are the forward path. The
--   active tenant lives in app_metadata; switching it is an authorization-checked
--   server operation, never a client write. A user can belong to many tenants and
--   switch between the ones they're a member of — the security model doesn't
--   change, only which membership is "active".
--
-- APPLY: run this whole file in the Supabase SQL editor (or `supabase db push`).
-- After applying, every existing session must refresh its JWT once (sign out/in
-- or a token refresh) so the new app_metadata claim is present in the token.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- 1. ── Tenant resolver now reads the server-managed app_metadata claim ────────
create or replace function auth.tenantid()
returns uuid as $$
declare
    tenantid_text text;
begin
    -- app_metadata is server-managed and NOT client-writable → not forgeable.
    tenantid_text := current_setting('request.jwt.claims', true)::jsonb
                       -> 'app_metadata' ->> 'tenantid';

    if tenantid_text is null or tenantid_text !~ '^[0-9a-fA-F-]{36}$' then
        return null;
    end if;

    return tenantid_text::uuid;
end;
$$ language plpgsql stable;

-- 2. ── Membership table (foundation for joining/switching tenancies) ──────────
create table if not exists public.tenant_members (
    user_id   uuid not null references auth.users on delete cascade,
    tenantid  uuid not null,
    role      text not null default 'owner',
    createdat timestamptz not null default now(),
    primary key (user_id, tenantid)
);
alter table public.tenant_members enable row level security;
-- A user may READ only their own membership rows. Writes go through the
-- SECURITY DEFINER functions below (never a direct client insert/update).
drop policy if exists tenant_members_self_read on public.tenant_members;
create policy tenant_members_self_read on public.tenant_members
    for select to authenticated
    using (user_id = auth.uid());
grant select on public.tenant_members to authenticated;

-- 3. ── Assign a tenant to a user SERVER-SIDE, into app_metadata ───────────────
-- Sets the user's active tenant in app_metadata and records the membership.
-- Client-supplied tenantid is never trusted here.
create or replace function public.assign_user_tenant(target_user uuid, target_tenant uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update auth.users
       set raw_app_meta_data =
           coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('tenantid', target_tenant::text)
     where id = target_user;

    insert into public.tenant_members (user_id, tenantid, role)
    values (target_user, target_tenant, 'owner')
    on conflict (user_id, tenantid) do nothing;
end;
$$;
revoke all on function public.assign_user_tenant(uuid, uuid) from public, authenticated, anon;

-- 4. ── New users get a fresh server-minted tenant (ignore client tenantid) ────
-- Replaces the old handle_new_user path's trust of raw_user_meta_data.tenantid.
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
declare
    new_tenant uuid := gen_random_uuid();  -- a brand-new, isolated tenant per signup
begin
    insert into public.profiles (id, email, full_name, avatar_url, timezone, tenantid)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'timezone',
        new_tenant
    );
    -- Authoritative tenant claim + membership, both server-side.
    perform public.assign_user_tenant(new.id, new_tenant);
    return new;
end;
$$ language plpgsql security definer;

-- (Trigger `on_auth_user_created` from the starter migration already points at
--  public.handle_new_user(); redefining the function above is enough.)

-- 5. ── One-time backfill for EXISTING users ───────────────────────────────────
-- Trust the current profiles.tenantid (set at their original signup) as the
-- canonical value and lift it into app_metadata + membership. Users created
-- before this migration keep the tenant they already own.
do $$
declare r record;
begin
    for r in
        select p.id, p.tenantid
        from public.profiles p
        where p.tenantid is not null
    loop
        perform public.assign_user_tenant(r.id, r.tenantid);
    end loop;
end $$;

-- 6. ── Harden the profiles UPDATE policy: no rewriting id or tenantid ─────────
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
    for update to authenticated
    using ((select auth.uid()) = id)
    with check (
        (select auth.uid()) = id
        and tenantid is not distinct from (select p.tenantid from public.profiles p where p.id = auth.uid())
    );

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- FORWARD PATH (apply later, when you build join-a-tenancy UX):
--
--   -- Invite/accept: an owner adds a member to their tenant.
--   -- create function public.add_tenant_member(member uuid, tenant uuid) ...
--   --   (verify auth.uid() is an owner of `tenant`, then insert tenant_members)
--
--   -- Switch active tenant to one the caller already belongs to:
--   -- create function public.switch_active_tenant(target_tenant uuid) returns void
--   --   language plpgsql security definer set search_path = '' as $$
--   --   begin
--   --     if not exists (select 1 from public.tenant_members
--   --                    where user_id = auth.uid() and tenantid = target_tenant) then
--   --       raise exception 'not a member of tenant %', target_tenant;
--   --     end if;
--   --     update auth.users set raw_app_meta_data =
--   --       coalesce(raw_app_meta_data,'{}'::jsonb) || jsonb_build_object('tenantid', target_tenant::text)
--   --     where id = auth.uid();
--   --   end; $$;
--   -- grant execute on function public.switch_active_tenant(uuid) to authenticated;
--
-- After a switch, the client must refresh its JWT for the new claim to take effect.
-- ─────────────────────────────────────────────────────────────────────────────
