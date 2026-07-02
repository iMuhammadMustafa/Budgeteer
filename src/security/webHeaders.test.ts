/**
 * Phase 6.3 — web hardening headers guard.
 * Locks the presence of the security response headers in vercel.json so a future
 * edit can't silently drop them. (A live-response E2E assertion is added in
 * Phase 5 once the static-export harness exists.)
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..", "..");

describe("vercel.json security headers", () => {
    const cfg = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
    const group = cfg.headers?.find((g: any) => g.source === "/(.*)");
    const byKey: Record<string, string> = Object.fromEntries(
        (group?.headers ?? []).map((h: any) => [h.key, h.value]),
    );

    it("applies headers to all routes", () => {
        expect(group).toBeTruthy();
    });

    it.each([
        ["X-Content-Type-Options", "nosniff"],
        ["X-Frame-Options", "DENY"],
        ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ])("sets %s", (key, value) => {
        expect(byKey[key]).toBe(value);
    });

    it("enables HSTS with a long max-age", () => {
        expect(byKey["Strict-Transport-Security"]).toMatch(/max-age=\d{7,}/);
        expect(byKey["Strict-Transport-Security"]).toMatch(/includeSubDomains/);
    });

    it("ships a CSP (report-only for now) that denies framing and object embeds", () => {
        const csp =
            byKey["Content-Security-Policy-Report-Only"] ?? byKey["Content-Security-Policy"];
        expect(csp).toBeTruthy();
        expect(csp).toMatch(/frame-ancestors 'none'/);
        expect(csp).toMatch(/object-src 'none'/);
        expect(csp).toMatch(/default-src 'self'/);
    });
});
