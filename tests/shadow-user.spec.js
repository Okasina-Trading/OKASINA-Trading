import { test, expect } from "@playwright/test";

// Default to local preview port if not specified, otherwise prod
const BASE = process.env.BASE_URL || "http://localhost:4173";

test.describe("Shadow User Protocol", () => {

    test("Complete Purchase Flow (Browse -> Cart -> Checkout)", async ({ page }) => {
        console.log(`[Shadow User] Starting patrol on: ${BASE}`);

        // 1. DISCOVERY: Go to Shop
        await page.goto(`${BASE}/shop`, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveTitle(/Shop|Collection|Okasina/i);

        // 2. SELECTION: Add first product to cart
        // Wait for products to load
        await page.waitForSelector('.product-card, button:has-text("Add to Cart")', { timeout: 10000 });

        // Find an "Add to Cart" button (either on card or quick view)
        // We'll try to find a direct button first
        const addToCartBtns = page.locator('button:has-text("Add Transaction"), button:has-text("Add to Cart")');
        const count = await addToCartBtns.count();

        if (count > 0) {
            await addToCartBtns.first().click();
        } else {
            // If no direct button, click a product to go to details then add
            await page.locator('.product-card').first().click();
            await page.locator('button:has-text("Add to Cart")').click();
        }

        // Verify Cart Toast or Counter update
        console.log("[Shadow User] Product added (supposedly). Waiting 2s...");
        await page.waitForTimeout(2000);

        // 3. CHECKOUT: Go to checkout
        console.log("[Shadow User] Navigating to Checkout...");
        await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded" });
        console.log("[Shadow User] Checkout loaded. Waiting for form...");

        // Explicitly wait for either the Name Input (Form loaded) OR the specific "empty cart" message
        const nameInput = page.locator('input[name="fullName"]');
        const emptyMsg = page.locator('text=Your cart is empty');

        try {
            await Promise.race([
                nameInput.waitFor({ state: 'visible', timeout: 10000 }),
                emptyMsg.waitFor({ state: 'visible', timeout: 10000 })
            ]);
            console.log("[Shadow User] Checkout state resolved.");
        } catch (e) {
            console.error("[Shadow User] Checkout timeout! Dumping page content:");
            const content = await page.innerHTML('body');
            console.error(content);
            throw e;
        }

        if (await emptyMsg.isVisible()) {
            throw new Error("Cart was empty after adding product! Shadow User failed at SELECTION phase.");
        }

        // 4. TRANSACTION: Fill form
        console.log("[Shadow User] Filling form...");
        await page.fill('input[name="fullName"]', "Jarvis Shadow");
        await page.fill('input[name="email"]', "jarvis.shadow@titan.local");
        await page.fill('input[name="phone"]', "5550001234");
        await page.fill('input[name="address"]', "123 Virtual Lane, Digital City");
        await page.fill('input[name="city"]', "Cybergrad");

        // Select Shipping (if radio exists)
        const shippingRadio = page.locator('input[name="shippingMethod"]').first();
        if (await shippingRadio.isVisible()) {
            await shippingRadio.check();
        }

        // Select Payment (COD is usually safest for tests)
        const codRadio = page.locator('input[value="cod"], input[value="cash"]');
        if (await codRadio.isVisible()) {
            await codRadio.check();
        }

        // Place Order
        const placeOrderBtn = page.locator('button:has-text("Place Order")');
        await expect(placeOrderBtn).toBeEnabled();
        await placeOrderBtn.click();

        // 5. FULFILLMENT: Verify Success
        // Expect redirection to success page or success message
        await expect(page.locator('body')).toContainText(/Order Placed|Thank you|Success/i, { timeout: 15000 });

        console.log("[Shadow User] Order successfully placed. Mission Complete.");
    });

});
