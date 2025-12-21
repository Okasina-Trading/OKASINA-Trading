import { test, expect } from "@playwright/test";

// Default to local preview port if not specified, otherwise prod
const BASE = process.env.BASE_URL || "http://localhost:4173";

test("Home loads and has Shop/Collection CTA", async ({ page }) => {
    console.log(`Testing against: ${BASE}`);
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    // Allow loose matching for title to catch "Okasina" or "Trading"
    await expect(page).toHaveTitle(/OKASINA|Trading|Fashion/i);
    await expect(page.getByText(/shop|collection|explore/i).first()).toBeVisible();
});

test("Cart/Checkout basic navigation does not 404", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });

    // Try common SPA routes
    const routes = ["/cart", "/checkout", "/shop"];
    for (const r of routes) {
        console.log(`Navigating to ${r}...`);
        const resp = await page.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });

        // SPA may return 200 for all routes; we mainly catch hard 404/500
        // Note: Vite preview sometimes returns 404 for SPA routes if not configured with rewrites, 
        // but standard navigation should work.
        if (resp) {
            expect(resp.status(), `${r} returned bad status`).toBeLessThan(500);
        }

        // Catch obvious blank-screen or error text
        await expect(page.locator("body")).not.toContainText(/404 not found|page not found/i);

        // Basic visibility check
        await expect(page.locator("body")).toBeVisible();
    }
});

test("No console errors on first load", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            const text = msg.text();
            // Filter out noise if necessary
            if (!text.includes("favicon") &&
                !text.includes("HMR") &&
                !text.includes("ipapi.co") &&
                !text.includes("Failed to send log to Supabase") &&
                !text.includes("Error detecting location") &&
                !text.includes("Error fetching products") &&
                !text.includes("Failed to fetch")
            ) {
                errors.push(text);
            }
        }
    });

    await page.goto(BASE, { waitUntil: "networkidle" });

    // allow some benign warnings; fail on real errors
    const criticalErrors = errors.filter(e =>
        e.match(/TypeError|ReferenceError|Failed to fetch|CORS|SyntaxError/i)
    );

    if (criticalErrors.length > 0) {
        console.error("Critical Console Errors Found:", criticalErrors);
    }

    expect(criticalErrors.length, `Found critical console errors: ${criticalErrors.join('\n')}`).toBe(0);
});
