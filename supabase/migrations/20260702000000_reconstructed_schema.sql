-- ============================================================================
-- RECONSTRUCTED local schema for integration + RLS testing (Phase 4).
--
-- ⚠️  RECONSTRUCTION — NOT a dump of production.
-- Production's schema + RLS policies live in the Supabase dashboard and are not
-- checked into this repo. This file is reverse-engineered from:
--   • src/types/database/sqlite/schema.ts  (the documented column mirror)
--   • src/types/database/supabase/supabase.types.ts (columns + enum values)
--   • the app's tenant model (tenantid scoping)
-- Column types are pragmatic (text ids/dates like the SQLite mirror) — good
-- enough to exercise the repository layer + PostgREST + RLS behavior, but you
-- MUST reconcile against the real schema via `supabase link` + `supabase db pull`
-- (needs your access token) before trusting these as a production guard.
--
-- RLS here is authored in the *fixed* form: tenantid is read from the
-- server-managed `app_metadata` JWT claim, NEVER the user-writable
-- `user_metadata`. See docs/testing/SUPABASE-SECURITY-AUDIT.md §2 and the
-- rls-tenant-vuln note. The RLS attack suite proves a user cannot escalate by
-- rewriting their own user_metadata.
-- ============================================================================

-- Type-check tokens (kept as text + CHECK to mirror the SQLite schema exactly).
-- Production uses real enums; valid values behave identically.
-- accounttypes:    Asset | Liability
-- transactiontypes: Expense | Income | Transfer | Adjustment | Initial | Refund
-- recurringtypes:  Standard | Transfer | CreditCardPayment

create table if not exists public.accountcategories (
  id text primary key,
  name text not null,
  type text not null check (type in ('Asset','Liability')),
  color text not null default 'error-100',
  icon text not null default 'Wallet',
  displayorder integer not null default 0,
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.accounts (
  id text primary key,
  name text not null,
  balance double precision not null default 0,
  currency text not null default 'USD',
  color text not null default 'error-100',
  icon text not null default 'Wallet',
  description text,
  notes text,
  owner text,
  displayorder integer not null default 0,
  statementdate integer,
  categoryid text not null references public.accountcategories(id),
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.transactiongroups (
  id text primary key,
  name text not null,
  type text not null check (type in ('Expense','Income','Transfer','Adjustment','Initial','Refund')),
  color text not null default 'error-100',
  icon text not null default 'Wallet',
  description text,
  displayorder integer not null default 0,
  budgetamount double precision not null default 0,
  budgetfrequency text not null default 'monthly',
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.transactioncategories (
  id text primary key,
  name text,
  groupid text not null references public.transactiongroups(id),
  type text not null check (type in ('Expense','Income','Transfer','Adjustment','Initial','Refund')),
  color text not null default 'error-100',
  icon text not null default 'Wallet',
  description text,
  displayorder integer not null default 0,
  budgetamount double precision not null default 0,
  budgetfrequency text not null default 'monthly',
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.transactions (
  id text primary key,
  name text,
  amount double precision not null default 0,
  original_amount double precision not null default 0,
  original_currency text not null default 'USD',
  exchange_rate double precision not null default 1,
  date text not null,
  description text,
  payee text,
  notes text,
  tags text,
  type text not null check (type in ('Expense','Income','Transfer','Adjustment','Initial','Refund')),
  accountid text not null references public.accounts(id),
  categoryid text not null references public.transactioncategories(id),
  transferaccountid text references public.accounts(id),
  transferid text references public.transactions(id),
  splitfromid text references public.transactions(id),
  isvoid boolean not null default false,
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.configurations (
  id text primary key,
  key text not null,
  value text not null,
  type text not null,
  "table" text not null,
  tenantid text,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.recurrings (
  id text primary key,
  name text not null,
  amount double precision,
  currencycode text not null default 'USD',
  description text,
  notes text,
  payeename text,
  type text not null check (type in ('Expense','Income','Transfer','Adjustment','Initial','Refund')),
  recurringtype text check (recurringtype in ('Standard','Transfer','CreditCardPayment')),
  recurrencerule text not null,
  intervalmonths integer,
  nextoccurrencedate text,
  enddate text,
  isactive boolean not null default true,
  isamountflexible boolean not null default false,
  isdateflexible boolean not null default false,
  autoapplyenabled boolean default false,
  lastautoappliedat text,
  lastexecutedat text,
  failedattempts integer default 0,
  maxfailedattempts integer default 3,
  categoryid text not null references public.transactioncategories(id),
  sourceaccountid text not null references public.accounts(id),
  transferaccountid text references public.accounts(id),
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.savingsbuckets (
  id text primary key,
  name text not null,
  targetamount double precision not null default 0,
  currentamount double precision not null default 0,
  accountid text not null references public.accounts(id),
  icon text not null default 'PiggyBank',
  color text not null default 'primary-100',
  displayorder integer not null default 0,
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

create table if not exists public.transactionitems (
  id text primary key,
  transactionid text not null references public.transactions(id),
  name text not null,
  amount double precision not null,
  categoryid text references public.transactioncategories(id),
  notes text,
  displayorder integer not null default 0,
  -- NOTE: Supabase has an `isvoid` column here that the SQLite mirror is
  -- missing (see sqlite-transactionitems-isvoid-bug). Included here to match
  -- production so voidByTransactionId works in Cloud mode.
  isvoid boolean not null default false,
  tenantid text not null,
  isdeleted boolean not null default false,
  createdat text not null,
  createdby text,
  updatedat text,
  updatedby text
);

-- profiles: 1 row per auth user (exists in Supabase, not in SQLite).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  currency text not null default 'USD',
  timezone text,
  tenantid text,
  updated_at text
);

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- current_tenant() mirrors production's `auth.tenantid()` AS FIXED by migration
-- 20260703000000_fix_tenant_isolation: it reads tenantid from the SERVER-MANAGED
-- `app_metadata` claim, which the client cannot write. Defined in `public` (not
-- `auth`) only because the local `supabase db reset` role cannot create objects
-- in the reserved `auth` schema — the LOGIC is identical, so the policies below
-- exercise production's ACTUAL (fixed) RLS behavior.
--
-- Before the fix this read `user_metadata` (client-writable), which was the live
-- rls-tenant-vuln. The RLS suite now proves the escalation is BLOCKED: a user who
-- rewrites their own user_metadata.tenantid gains nothing, because policies read
-- the untamperable app_metadata claim.
create or replace function public.current_tenant()
returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'tenantid',
    null
  );
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'accountcategories','accounts','transactiongroups','transactioncategories',
    'transactions','configurations','recurrings','savingsbuckets','transactionitems'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    -- authenticated users may only touch rows in their own tenant.
    execute format($f$
      create policy tenant_isolation on public.%I
        for all to authenticated
        using (tenantid = public.current_tenant())
        with check (tenantid = public.current_tenant());
    $f$, t);
    -- PostgREST needs table grants; RLS then filters. anon gets nothing (→ 401).
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
  end loop;
end $$;

-- profiles: a user sees/edits only their own row.
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
create policy profiles_self on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
grant select, insert, update, delete on public.profiles to authenticated;
