-- ─────────────────────────────────────────────────────────────────────────────
-- FIX (part 2): repoint every RLS policy to public.tenantid()
-- ─────────────────────────────────────────────────────────────────────────────
--
-- WHY THIS IS REQUIRED:
--   20260703000000_fix_tenant_isolation added public.tenantid() (reads the
--   server-managed app_metadata claim) because the reserved `auth` schema can't
--   be modified on hosted Supabase. But the TABLE policies from
--   20250201103718_create_tables.sql still call the OLD `auth.tenantid()` (and,
--   for savingsbuckets/transactionitems, an undefined `app_auth.tenantid()`),
--   which reads the CLIENT-WRITABLE user_metadata. Until the policies call
--   public.tenantid(), the rls-tenant-vuln remains fully open — adding the new
--   function alone changes nothing.
--
-- WHAT THIS DOES, for every tenant-scoped table:
--   • drops the old "Tenant access" policy and recreates it against
--     public.tenantid() — for BOTH read (USING) and write (WITH CHECK). The
--     original policies had only USING, so INSERT/UPDATE could set an arbitrary
--     tenantid; WITH CHECK closes that.
--   • repoints the column DEFAULT to public.tenantid() so server-side inserts
--     still stamp the caller's (app_metadata) tenant.
--
-- Idempotent (drop-if-exists + create). Safe to run after the part-1 migration.
-- After applying, sessions must refresh their JWT once (app_metadata claim).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

do $$
declare t text;
begin
  foreach t in array array[
    'accountcategories','accounts','transactiongroups','transactioncategories',
    'transactions','configruations','recurrings','savingsbuckets','transactionitems'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "Tenant access" on public.%I;', t);
    execute format($f$
      create policy "Tenant access" on public.%I
        as permissive for all
        using (tenantid = public.tenantid())
        with check (tenantid = public.tenantid());
    $f$, t);
    -- Keep the DB-side default aligned with the new resolver.
    execute format('alter table public.%I alter column tenantid set default public.tenantid();', t);
  end loop;
end $$;

commit;
