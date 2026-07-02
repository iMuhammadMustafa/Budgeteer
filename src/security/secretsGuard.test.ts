/**
 * Phase 6.1 — Secret hygiene guard (runs in the unit suite, no CI required).
 *
 * A cheap, always-on backstop that fails the build if a private credential is
 * ever committed into `src/`, if the Supabase client starts reading a non-public
 * env var, or if `.env` gains a key that is not `EXPO_PUBLIC_*`. gitleaks/semgrep
 * (CI) are the heavier nets; this catches the common cases instantly and locally.
 *
 * Rationale: only `EXPO_PUBLIC_*` env vars are safe to ship — they are inlined
 * into the client bundle. The Supabase anon key is public by design (RLS is the
 * real boundary). Anything else in client code or `.env` is a leak.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..", "..");
const SRC = join(ROOT, "src");

/** Patterns that must never appear in committed client source. */
const FORBIDDEN: { name: string; re: RegExp }[] = [
    { name: "Supabase service_role key usage", re: /service_role/i },
    { name: "SUPABASE_SERVICE env var", re: /SUPABASE_SERVICE[A-Z_]*/ },
    { name: "PEM private key block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { name: "AWS access key id", re: /AKIA[0-9A-Z]{16}/ },
    { name: "Generic hardcoded secret assignment", re: /(secret|password|passwd|api[_-]?key)\s*[:=]\s*["'][^"'$\s]{12,}["']/i },
];

/** Recursively collect .ts/.tsx source files, skipping tests and generated types. */
function collectSources(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
            collectSources(full, acc);
            continue;
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue;
        if (/\.(test|spec)\.tsx?$/.test(entry)) continue; // this file matches its own patterns
        if (full.includes(join("database", "supabase"))) continue; // generated types
        // Dev-only test utilities (e.g. the local-Supabase harness) legitimately
        // reference service_role / local keys and never ship in the app bundle.
        if (full.includes(join("src", "test-utils"))) continue;
        acc.push(full);
    }
    return acc;
}

describe("secret hygiene guard", () => {
    const files = collectSources(SRC);

    it("finds source files to scan (sanity)", () => {
        expect(files.length).toBeGreaterThan(50);
    });

    it("has no forbidden secret patterns anywhere in src/", () => {
        const hits: string[] = [];
        for (const file of files) {
            const text = readFileSync(file, "utf8");
            for (const { name, re } of FORBIDDEN) {
                if (re.test(text)) {
                    hits.push(`${name} → ${file.replace(ROOT + "/", "")}`);
                }
            }
        }
        expect(hits, `Potential secret leak(s):\n${hits.join("\n")}`).toEqual([]);
    });

    it("Supabase client only reads EXPO_PUBLIC_* env vars", () => {
        const text = readFileSync(join(SRC, "providers", "Supabase.ts"), "utf8");
        const envRefs = [...text.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1]);
        expect(envRefs.length).toBeGreaterThan(0);
        for (const ref of envRefs) {
            expect(ref, `Supabase client reads non-public env var: ${ref}`).toMatch(/^EXPO_PUBLIC_/);
        }
    });

    it(".env (if present) contains only EXPO_PUBLIC_* keys", () => {
        const envPath = join(ROOT, ".env");
        if (!existsSync(envPath)) return; // absent in CI — nothing to check
        const keys = readFileSync(envPath, "utf8")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith("#") && l.includes("="))
            .map((l) => l.split("=")[0].trim());
        for (const key of keys) {
            expect(key, `.env holds a non-public key that must not ship: ${key}`).toMatch(/^EXPO_PUBLIC_/);
        }
    });
});
