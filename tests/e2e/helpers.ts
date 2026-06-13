import type { Locator, Page } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export async function pixelDiffFraction(a: Buffer, b: Buffer): Promise<number> {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  const w = Math.min(pa.width, pb.width);
  const h = Math.min(pa.height, pb.height);
  const changed = pixelmatch(pa.data, pb.data, undefined, w, h, { threshold: 0.08 });
  return changed / (w * h);
}

export async function freezeResumeDiffs(
  page: Page,
  sceneCanvas: Locator,
  resumeWaitMs = 1400,
): Promise<{ frozen: number; running: number }> {
  await page.evaluate(() => (window as any).__LAB__.setPaused(true));
  await page.waitForTimeout(350);
  const f1 = await sceneCanvas.screenshot();
  await page.waitForTimeout(500);
  const f2 = await sceneCanvas.screenshot();
  const frozen = await pixelDiffFraction(f1, f2);
  await page.evaluate(() => (window as any).__LAB__.setPaused(false));
  await page.waitForTimeout(250);
  const r1 = await sceneCanvas.screenshot();
  await page.waitForTimeout(resumeWaitMs);
  const r2 = await sceneCanvas.screenshot();
  const running = await pixelDiffFraction(r1, r2);
  return { frozen, running };
}

export function trackRequests(page: Page): { crossOrigin: string[] } {
  const crossOrigin: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    const base = new URL(page.url() || "http://localhost");
    if (url.protocol === "data:") return;
    if (url.host !== base.host) crossOrigin.push(req.url());
  });
  return { crossOrigin };
}

export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

export const ROUTES = [
  "spectrum",
  "room",
  "fourier",
  "thermal",
  "resonance",
  "modulation",
  "shannon",
  "spreading",
  "vision",
  "hearing",
  "attenuation",
  "scenario",
  "graph",
];

export async function gotoModule(page: Page, route: string): Promise<void> {
  await page.goto(`/#/${route}`);
  await page.waitForSelector(`[data-module-root="${route}"]`);
  await page.waitForTimeout(400);
}

export async function facts(page: Page, scene: string): Promise<Record<string, number>> {
  return page.evaluate((s) => (window as any).__LAB__.facts(s), scene);
}

/** Set a range input to any value (fill() rejects non-step-aligned values). */
export async function setRange(page: Page, testid: string, value: number): Promise<void> {
  await page.evaluate(
    ({ t, v }) => {
      const input = document.querySelector(`[data-testid="${t}"]`) as HTMLInputElement;
      input.value = String(v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { t: testid, v: value },
  );
  await page.waitForTimeout(250);
}

export async function action(page: Page, scene: string, name: string, ...args: unknown[]): Promise<unknown> {
  return page.evaluate(
    ({ s, n, a }) => (window as any).__LAB__.action(s, n, ...a),
    { s: scene, n: name, a: args },
  );
}
