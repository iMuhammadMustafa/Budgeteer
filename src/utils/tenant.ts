/**
 * Resolve the active tenant id for a Supabase session.
 *
 * Prefers the SERVER-MANAGED `app_metadata` claim — the authoritative source
 * after the rls-tenant-vuln fix (migration 20260703000000_fix_tenant_isolation),
 * where the tenant is minted/assigned server-side and cannot be forged by the
 * client. Falls back to `user_metadata` for:
 *   • sessions issued before the fix (their JWT has no app_metadata claim yet), and
 *   • local/demo synthetic sessions (see src/utils/localSession.ts).
 *
 * Centralizing this read means the whole app switches claim source in one place.
 */
import type { Session } from "@supabase/supabase-js";

// Returns `string` (not `string | undefined`) to match the pre-existing implicit
// contract at the ~20 call sites: they read `session.user.user_metadata.tenantid`
// (typed `any`) and passed it straight to repos expecting `string`. Runtime
// behavior is unchanged — an absent claim was, and still is, a falsy value the
// callers already guard with `!tenantId` / `!!tenantId`.
export function resolveTenantId(session: Session | null | undefined): string {
  const claim = session?.user?.app_metadata?.tenantid ?? session?.user?.user_metadata?.tenantid;
  return claim as string;
}
