import { expect, test } from "@playwright/test";
import { ROUTES, gotoModule } from "./helpers";

// AC18: usable at 390px and 1440px — no horizontal overflow, navigation reachable.

for (const width of [390, 1440]) {
  test(`no horizontal overflow and clickable navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const nav = page.locator('[data-testid="module-nav"]');
    await expect(nav).toBeVisible();
    for (const r of ROUTES.slice(0, 3)) {
      await page.locator(`[data-nav="${r}"]`).click();
      await expect(page.locator(`[data-module-root="${r}"]`)).toBeVisible();
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(ov, `overflow on ${r}`).toBeLessThanOrEqual(0);
    }
    await gotoModule(page, "room");
    const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ov2).toBeLessThanOrEqual(0);
  });
}
