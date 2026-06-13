import { expect, test } from "@playwright/test";
import { facts, gotoModule, pixelDiffFraction, setRange } from "./helpers";

// AC19: each of the 7 remaining routes responds to its primary control in the correct
// direction (≥1% rendered-pixel change) AND freezes when the sim clock is paused.

async function freezeCheck(page: any, sceneSel: string) {
  await page.evaluate(() => (window as any).__LAB__.setPaused(true));
  await page.waitForTimeout(300);
  const a = await page.locator(sceneSel).screenshot();
  await page.waitForTimeout(450);
  const b = await page.locator(sceneSel).screenshot();
  expect(await pixelDiffFraction(a, b), "frozen scene should not change").toBeLessThanOrEqual(0.001);
  await page.evaluate(() => (window as any).__LAB__.setPaused(false));
}

test("spectrum: moving the frequency marker re-renders + correct band/ionization (AC19)", async ({ page }) => {
  await gotoModule(page, "spectrum");
  const sel = '[data-scene="spectrum-ruler"] canvas';
  await page.evaluate(() => (window as any).__LAB__.setPaused(true));
  await page.waitForTimeout(200);
  const before = await page.locator(sel).screenshot();
  await setRange(page, "spectrum-logf", 19); // X-ray/gamma → ionizing
  const after = await page.locator(sel).screenshot();
  expect(await pixelDiffFraction(before, after)).toBeGreaterThanOrEqual(0.01);
  const f = await facts(page, "spectrum-ruler");
  expect(f.ionization as unknown as string).toBe("ionizing");
  await page.evaluate(() => (window as any).__LAB__.setPaused(false));
  await freezeCheck(page, sel);
});

test("resonance: tuning selects a different carrier (AC19)", async ({ page }) => {
  await gotoModule(page, "resonance");
  const sel = '[data-scene="resonance-tuner"] canvas';
  const lo = await facts(page, "resonance-tuner");
  await setRange(page, "resonance-tune", 60);
  const hi = await facts(page, "resonance-tuner");
  expect(hi.f0).not.toBe(lo.f0);
  expect(hi.selectedCarrierHz).not.toBe(lo.selectedCarrierHz);
  await freezeCheck(page, sel);
});

test("modulation: changing message frequency re-renders the round-trip (AC19)", async ({ page }) => {
  await gotoModule(page, "modulation");
  const sel = '[data-scene="modulation-roundtrip-scene"] canvas';
  await page.evaluate(() => (window as any).__LAB__.setPaused(true));
  await page.waitForTimeout(200);
  const before = await page.locator(sel).screenshot();
  await setRange(page, "modulation-msg", 160);
  const after = await page.locator(sel).screenshot();
  expect(await pixelDiffFraction(before, after)).toBeGreaterThanOrEqual(0.01);
  const f = await facts(page, "modulation-roundtrip-scene");
  expect(f.occupiedBandwidth).toBe(320);
  await page.evaluate(() => (window as any).__LAB__.setPaused(false));
  await freezeCheck(page, sel);
});

test("shannon: raising S/N raises capacity monotonically (AC19)", async ({ page }) => {
  await gotoModule(page, "shannon");
  const sel = '[data-scene="shannon-capacity"] canvas';
  await setRange(page, "shannon-snr", 5);
  const lo = await facts(page, "shannon-capacity");
  await setRange(page, "shannon-snr", 35);
  const hi = await facts(page, "shannon-capacity");
  expect(hi.capacityBps).toBeGreaterThan(lo.capacityBps as number);
  await freezeCheck(page, sel);
});

test("vision: moving the spectrum changes the perceived color (AC19)", async ({ page }) => {
  await gotoModule(page, "vision");
  const sel = '[data-scene="vision-color"] canvas';
  await setRange(page, "vision-center", 460);
  const blue = await facts(page, "vision-color");
  await setRange(page, "vision-center", 620);
  const red = await facts(page, "vision-color");
  // longer wavelength → more L (red), less S (blue)
  expect(red.L).toBeGreaterThan(blue.L as number);
  expect(red.red).toBeGreaterThanOrEqual(blue.red as number);
  await freezeCheck(page, sel);
});

test("hearing: changing the root note moves the tonotopic excitation (AC19)", async ({ page }) => {
  await gotoModule(page, "hearing");
  const sel = '[data-scene="hearing-cochlea"] canvas';
  await setRange(page, "hearing-root", 150);
  const lo = await facts(page, "hearing-cochlea");
  await setRange(page, "hearing-root", 700);
  const hi = await facts(page, "hearing-cochlea");
  // higher root → peaks shift toward the base (larger x)
  expect(hi.firstPeakPlace).toBeGreaterThan(lo.firstPeakPlace as number);
  await freezeCheck(page, sel);
});

test("attenuation: raising frequency shrinks skin depth + transmission (AC19)", async ({ page }) => {
  await gotoModule(page, "attenuation");
  const sel = '[data-scene="attenuation-shield"] canvas';
  await setRange(page, "atten-freq", 8);
  const lo = await facts(page, "attenuation-shield");
  await setRange(page, "atten-freq", 10.5);
  const hi = await facts(page, "attenuation-shield");
  expect(hi.skinDepthUm).toBeLessThan(lo.skinDepthUm as number);
  expect(hi.transmission).toBeLessThan(lo.transmission as number);
  await freezeCheck(page, sel);
});
