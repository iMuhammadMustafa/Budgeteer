-- ============================================================================
-- Enable Supabase Realtime for the user-data tables (Perf Phase 2).
--
-- CloudSyncProvider subscribes to postgres_changes on these tables and
-- invalidates the matching TanStack Query caches, so external mutations (a
-- second device/tab, the SQL editor) reflect in the UI without a manual
-- refresh. Realtime only emits changes for tables in the `supabase_realtime`
-- publication — add them here.
--
-- `replica identity full` makes UPDATE/DELETE events carry the full OLD row so
-- the client can tenant-scope the payload (payload.old.tenantid).
--
-- Idempotent: safe to re-run. RLS still applies to realtime, so a subscriber
-- only receives rows its policies allow.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'transactions','transactionitems','accounts','transactioncategories','transactiongroups'
  ]
  loop
    execute format('alter table public.%I replica identity full;', t);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;
