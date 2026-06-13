import { expect, test } from "@playwright/test";
import { action, facts, freezeResumeDiffs, gotoModule } from "./helpers";

// AC17: the three NAMED scenes each pass freeze/resume AND a parameter-causality
// magnitude law.

test("thermal Planck curve: freeze/resume + 300→600 K halves the peak wavelength (Wien)", async ({ page }) => {
  await gotoModule(page, "thermal");
  const canvas = page.locator('[data-scene="thermal-planck-scene"] canvas');
  const { frozen, running } = await freezeResumeDiffs(page, canvas, 1600);
  expect(frozen).toBeLessThanOrEqual(0.001);
  expect(running).toBeGreaterThanOrEqual(0.01);

  await action(page, "thermal-planck-scene", "setT", 300);
  const f300 = await facts(page, "thermal-planck-scene");
  await action(page, "thermal-planck-scene", "setT", 600);
  const f600 = await facts(page, "thermal-planck-scene");
  const ratio = (f300.peakWavelengthM as number) / (f600.peakWavelengthM as number);
  expect(Math.abs(ratio - 2) / 2, `peak ratio ${ratio}`).toBeLessThanOrEqual(0.1);
});

test("matched-filter despread: freeze/resume + lowering SNR 6 dB keeps despread≪control", async ({ page }) => {
  await gotoModule(page, "spreading");
  const canvas = page.locator('[data-scene="spreading-despread"] canvas');
  const { frozen, running } = await freezeResumeDiffs(page, canvas, 1600);
  expect(frozen).toBeLessThanOrEqual(0.001);
  expect(running).toBeGreaterThanOrEqual(0.01);

  await action(page, "spreading-despread", "setSnr", -9);
  const hi = await facts(page, "spreading-despread");
  await action(page, "spreading-despread", "setSnr", -15);
  const lo = await facts(page, "spreading-despread");
  // despread stays well below the chance control at both SNRs (the gap persists)
  expect(hi.despreadBer).toBeLessThan(0.05);
  expect(lo.despreadBer).toBeLessThan(0.05);
  expect(hi.controlBer).toBeGreaterThanOrEqual(0.35);
  expect(lo.controlBer).toBeGreaterThanOrEqual(0.35);
  // despread BER is far better than the control at the lower SNR
  expect((lo.despreadBer as number)).toBeLessThan((lo.controlBer as number) - 0.2);
});

test("room spectrum analyzer: freeze/resume + Wi-Fi toggle changes power only in the 2.4 GHz band", async ({ page }) => {
  await gotoModule(page, "room");
  const gl = page.locator('[data-scene="room-3d"] canvas');
  const { frozen, running } = await freezeResumeDiffs(page, gl, 1600);
  expect(frozen).toBeLessThanOrEqual(0.001);
  expect(running).toBeGreaterThanOrEqual(0.01);

  const withWifi = await facts(page, "room-analyzer");
  await action(page, "room-analyzer", "toggleSource", "wifi", false);
  const noWifi = await facts(page, "room-analyzer");
  const wifiDelta = (withWifi.wifiBandPower as number) - (noWifi.wifiBandPower as number);
  const visDelta = (withWifi.visibleBandPower as number) - (noWifi.visibleBandPower as number);
  expect(wifiDelta).toBeGreaterThan(0);
  // visible band essentially unchanged (within 1% of the wifi-band change)
  expect(Math.abs(visDelta)).toBeLessThanOrEqual(Math.abs(wifiDelta) * 0.01 + 1e-9);
});

test("room perception views differ: thermal vs eye renders the warm body differently", async ({ page }) => {
  await gotoModule(page, "room");
  await page.evaluate(() => (window as any).__LAB__.setPaused(true));
  await page.waitForTimeout(200);
  const gl = page.locator('[data-scene="room-3d"] canvas');
  await action(page, "room-analyzer", "setView", "eye");
  await page.waitForTimeout(200);
  const eye = await gl.screenshot();
  await action(page, "room-analyzer", "setView", "thermal");
  await page.waitForTimeout(200);
  const thermal = await gl.screenshot();
  const { pixelDiffFraction } = await import("./helpers");
  expect(await pixelDiffFraction(eye, thermal)).toBeGreaterThanOrEqual(0.01);
  await page.evaluate(() => (window as any).__LAB__.setPaused(false));
});
