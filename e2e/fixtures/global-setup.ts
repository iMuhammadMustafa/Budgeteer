import { chromium, FullConfig } from "@playwright/test";

/**
 * Global setup runs ONCE before all tests.
 * Warms up the web server by loading the landing page.
 */
export default async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:8081";

    console.log("[globalSetup] Warming up web server...");
    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    try {
        await page.goto("/", { timeout: 60000 });
        await page.waitForSelector('text="Welcome to"', { timeout: 30000 });
        console.log("[globalSetup] ✅ Web server is warm and landing page is reachable");
    } catch (error) {
        console.error("[globalSetup] ⚠️ Server warm-up failed:", error);
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
}
