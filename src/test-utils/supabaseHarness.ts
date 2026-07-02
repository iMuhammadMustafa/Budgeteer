/**
 * Phase 4.1 — local Supabase integration harness.
 *
 * Connects to a LOCAL Supabase stack only (`supabase start`), never production.
 * Connection info + keys come from env vars exported by the `test:integration:cloud`
 * script (which reads `supabase status -o env`). If they are absent, the
 * integration suites skip (see `cloudEnabled`) so the default `vitest run` stays
 * green without Docker.
 *
 * Local Supabase keys are the well-known demo keys — safe to read from env; they
 * are not production secrets.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Accept both our own names and the native `supabase status -o env` names
// (API_URL / ANON_KEY / SERVICE_ROLE_KEY), so the npm script can export the
// CLI output verbatim.
export const SUPABASE_URL =
    process.env.SUPABASE_URL ?? process.env.API_URL ?? process.env.EXPO_PUBLIC_SUPA_URL ?? "";
export const SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY ?? process.env.ANON_KEY ?? process.env.EXPO_PUBLIC_SUPA_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY ?? "";

/** Only run the cloud integration suites when pointed at a local stack. */
export const cloudEnabled =
    !!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !!SUPABASE_SERVICE_ROLE_KEY &&
    /127\.0\.0\.1|localhost/.test(SUPABASE_URL);

/** Loud message when someone runs the integration script without the stack up. */
export function assertCloudEnabled(): void {
    if (cloudEnabled) return;
    throw new Error(
        "Local Supabase not detected. Start it and export env first:\n" +
            "  supabase start\n" +
            "  export $(supabase status -o env | xargs) # SUPABASE_URL / ANON / SERVICE_ROLE\n" +
            "then run: npm run test:integration:cloud",
    );
}

/** Anonymous (unauthenticated) client — used for anon-access RLS probes. */
export function makeAnonClient(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

/** Service-role client — bypasses RLS. ADMIN ONLY: seeding parents, provisioning
 *  users, and cleanup. Never used to assert tenant behavior. */
export function makeServiceClient(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

export interface TestUser {
    email: string;
    password: string;
    tenantid: string;
    userId: string;
}

/**
 * Create (or reset) a confirmed auth user whose tenant lives in the
 * SERVER-MANAGED app_metadata claim — the identity source the RLS policies
 * trust. Idempotent: deletes any existing user with the same email first.
 */
export async function provisionUser(
    admin: SupabaseClient,
    email: string,
    tenantid: string,
    password = "test-password-123!",
): Promise<TestUser> {
    // Remove a stale user with this email (list → delete) so reruns are clean.
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === email);
    if (existing) await admin.auth.admin.deleteUser(existing.id);

    // Set tenantid in BOTH claim locations:
    //  • app_metadata → the server-managed, trusted source the FIXED policies read.
    //  • user_metadata → the user-writable source the CURRENT (vulnerable) prod
    //    policy reads (auth.tenantid()); lets the suite reproduce the live vuln.
    const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { tenantid },
        user_metadata: { tenantid },
    });
    if (error || !data.user) throw error ?? new Error("createUser returned no user");
    return { email, password, tenantid, userId: data.user.id };
}

/** Sign a fresh client in as the given user (RLS applies to this client). */
export async function clientFor(user: TestUser): Promise<SupabaseClient> {
    const client = makeAnonClient();
    const { error } = await client.auth.signInWithPassword({
        email: user.email,
        password: user.password,
    });
    if (error) throw error;
    return client;
}
