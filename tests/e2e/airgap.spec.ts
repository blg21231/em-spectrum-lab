import { expect, test } from "@playwright/test";
import { trackConsoleErrors } from "./helpers";

// AC18: fully self-contained — an air-gapped browser (every cross-origin request
// aborted) still boots the landing page and renders a module.

test("air-gapped boot renders the landing page and a module", async ({ page, baseURL }) => {
  const base = new URL(baseURL!);
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.host === base.host || url.protocol === "data:") return route.continue();
    return route.abort();
  });
  const errors = trackConsoleErrors(page);
  await page.goto("/");
  await expect(page.locator('[data-testid="module-cards"] a.card')).toHaveCount(13);
  await page.goto("/#/fourier");
  await page.waitForSelector('[data-module-root="fourier"]');
  await page.waitForTimeout(500);
  const shot = await page.locator('[data-scene="fourier-decompose"] canvas').screenshot();
  expect(shot.byteLength).toBeGreaterThan(3000);
  expect(errors, errors.join("\n")).toHaveLength(0);
});
