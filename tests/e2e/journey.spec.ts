import { expect, test } from "@playwright/test";
import { ROUTES, gotoModule, trackConsoleErrors, trackRequests } from "./helpers";

const TAGS = ["established", "engineering-convention", "model-simplification", "order-of-magnitude", "misconception-corrected"];

test("full journey: ≥11 module routes render, zero console errors, zero cross-origin requests (AC13/AC18)", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto("/");
  const { crossOrigin } = trackRequests(page);
  await expect(page.locator('[data-testid="module-cards"] a.card')).toHaveCount(13);
  await expect(page.locator('[data-testid="question-list"] li')).toHaveCount(9);

  expect(ROUTES.length).toBeGreaterThanOrEqual(11);
  for (const r of ROUTES) {
    await gotoModule(page, r);
    await expect(page.locator(`[data-module-root="${r}"]`)).toBeVisible();
    expect(await page.locator("[data-scene]").count()).toBeGreaterThanOrEqual(1);
  }
  expect(crossOrigin, `cross-origin requests: ${crossOrigin.join(", ")}`).toHaveLength(0);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("driving-questions ledger: each Q renders on its route with question text + answer (AC13)", async ({ page }) => {
  await page.goto("/");
  const items = page.locator('[data-testid="question-list"] li');
  await expect(items).toHaveCount(9);
  for (let i = 0; i < 9; i++) {
    expect(await items.nth(i).getAttribute("data-question")).toBe(`Q${i + 1}`);
  }
  const expectQ = async (route: string, qid: string, fragment: string | RegExp) => {
    await gotoModule(page, route);
    const banner = page.locator(`.question-banner[data-question="${qid}"]`);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(fragment);
    await expect(banner.locator(`[data-qanswer="${qid}"]`)).toBeVisible();
  };
  await expectQ("room", "Q1", "flooding a typical room");
  await expectQ("fourier", "Q2", "Why isn't it chaos");
  await expectQ("spectrum", "Q3", "room for everyone");
  await expectQ("resonance", "Q4", "only its");
  await expectQ("modulation", "Q5", "put onto a wave");
  await expectQ("shannon", "Q6", "weaker than the noise");
  await expectQ("vision", "Q7", "vision and meaning");
  await expectQ("attenuation", "Q8", "blocks what");
  await expectQ("scenario", "Q9", "airplane vs your room");
});

test("physical-honesty walk: every panel tagged, pinned tags, 5 misconception panels (AC15)", async ({ page }) => {
  const seenTags: Record<string, string> = {};
  for (const r of ROUTES) {
    await gotoModule(page, r);
    const panels = page.locator("[data-panel]");
    const count = await panels.count();
    expect(count, `module ${r} has no panels`).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < count; i++) {
      const p = panels.nth(i);
      const tag = await p.getAttribute("data-tag");
      const pid = await p.getAttribute("data-panel");
      expect(tag, `panel ${pid} untagged`).toBeTruthy();
      expect(TAGS, `panel ${pid} invalid tag ${tag}`).toContain(tag!);
      await expect(p.locator(".tag-chip").first()).toHaveText(tag!);
      seenTags[pid!] = tag!;
    }
  }
  // pinned tags
  expect(seenTags["thermal-convection"]).toBe("misconception-corrected");
  expect(seenTags["room-overview"]).toBe("order-of-magnitude");
  expect(seenTags["resonance-tuning"]).toBe("model-simplification");
  expect(seenTags["spec-sound"]).toBe("misconception-corrected");
  // five misconception-corrected panels present
  const mc = ["spec-sound", "spec-ionizing", "spec-5g", "thermal-convection", "thermal-microwave"];
  for (const id of mc) expect(seenTags[id], `misconception panel ${id}`).toBe("misconception-corrected");
});

test("concept graph renders and node-click navigates (AC14)", async ({ page }) => {
  await gotoModule(page, "graph");
  const f = await page.evaluate(() => (window as any).__LAB__.facts("concept-graph"));
  expect(f.nodes).toBeGreaterThanOrEqual(24);
  expect(f.edges).toBeGreaterThanOrEqual(36);
  const canvas = page.locator('[data-scene="concept-graph"] canvas');
  const shot = await canvas.screenshot();
  expect(shot.byteLength).toBeGreaterThan(4000);
  // navigate via the hook action to a node with a module
  await page.evaluate(() => (window as any).__LAB__.action("concept-graph", "navTo", "resonance"));
  await page.waitForTimeout(400);
  expect(page.url()).toContain("#/resonance");
});
