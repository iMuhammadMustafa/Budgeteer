import { StorageMode } from "@/src/types/StorageMode";
import { SQLITE_DEFAULTS, SQLITE_DEMO } from "@/src/types/database/sqlite/constants";
import { Session } from "@supabase/supabase-js";

/**
 * Build the synthetic, Supabase-shaped session used by Local and Demo modes
 * (neither has a real auth server). Shared by the landing-page selection flow
 * and the E2E storage-mode injection path so both produce an identical session
 * — same tenant/user ids as the seeded data, so queries resolve.
 */
export function buildLocalSession(mode: StorageMode.Local | StorageMode.Demo): Session {
  const c = mode === StorageMode.Demo ? SQLITE_DEMO : SQLITE_DEFAULTS;
  const prefix = mode === StorageMode.Demo ? "demo" : "local";
  return {
    user: {
      id: c.userId,
      email: c.email,
      // tenantid lives in app_metadata to mirror the server-managed cloud model
      // (see resolveTenantId / migration 20260703000000_fix_tenant_isolation);
      // kept in user_metadata too for any pre-fix read path.
      user_metadata: { tenantid: c.tenantId, full_name: c.name },
      app_metadata: { tenantid: c.tenantId },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
    access_token: `${prefix}-access-token`,
    refresh_token: `${prefix}-refresh-token`,
    expires_in: 3600,
    token_type: "bearer",
  } as Session;
}
