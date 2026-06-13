import { describe, expect, it } from "vitest";
import { capacityFromSnrDb, fromDb, noisePowerW, toDb, wattsToDbm } from "../../src/sim/shannon";
import { dsssTrace, simulateDsss } from "../../src/sim/spreading";
import { analyzer, bandPower, defaultSources, perceivedBrightness, sourceSpectrum } from "../../src/sim/room";
import { sumSpectra } from "../../src/sim/fourier";
import { bandForWavelength, ionizationClass, isAudible, NAMED_EM } from "../../src/sim/spectrum";
import { coneToRgb, coneResponse, monochromatic, sSensitivity, lSensitivity } from "../../src/sim/vision";
import { placeForFrequency } from "../../src/sim/hearing";
import { planckRadiance, radiatedPower, THERMAL_PRESETS, waterDielectricLoss } from "../../src/sim/thermal";
import { RLC_PRESETS } from "../../src/sim/resonance";
import { buildScenario, SCENARIOS } from "../../src/sim/scenario";
import { nodeById } from "../../src/content/graph";
import { panelsForModule, MISCONCEPTION_PANELS } from "../../src/content/panels";

describe("coverage: helper surface exercised", () => {
  it("shannon helpers", () => {
    expect(noisePowerW(290, 1)).toBeGreaterThan(0);
    expect(wattsToDbm(1e-3)).toBeCloseTo(0, 6);
    expect(capacityFromSnrDb(1e6, 10)).toBeGreaterThan(0);
    expect(fromDb(toDb(5))).toBeCloseTo(5, 6);
  });

  it("spreading trace + passthrough control branch", () => {
    const t = dsssTrace(10, 31, -10);
    expect(t.rx.length).toBe(10 * 31);
    expect(t.correlation.length).toBe(10);
    const passthrough = simulateDsss(200, 31, -3, 5, "DESPREAD_PASSTHROUGH");
    expect(passthrough.controlBer).toBeGreaterThanOrEqual(0);
  });

  it("room perception + spectrum + bandPower + max combiner", () => {
    const s = defaultSources();
    expect(sourceSpectrum(s[0]).length).toBeGreaterThan(0);
    expect(sourceSpectrum({ ...s[0], enabled: false }).every((v) => v === 0)).toBe(true);
    const tr = analyzer(s);
    expect(bandPower(tr, 1e9, 1e15)).toBeGreaterThan(0);
    const maxTr = analyzer(s, "max");
    expect(maxTr.length).toBe(tr.length);
    for (const view of ["eye", "radio", "thermal"] as const) {
      const body = s.find((x) => x.id === "body")!;
      expect(perceivedBrightness(body, view)).toBeGreaterThanOrEqual(0);
    }
    expect(perceivedBrightness(s.find((x) => x.id === "light")!, "eye")).toBeGreaterThan(0);
    expect(perceivedBrightness(s.find((x) => x.id === "wifi")!, "radio")).toBeGreaterThan(0);
  });

  it("fourier sumSpectra", () => {
    expect(sumSpectra([])).toEqual([]);
    expect(sumSpectra([[1, 2], [3, 4]])).toEqual([4, 6]);
  });

  it("spectrum helpers", () => {
    expect(bandForWavelength(550e-9)).toBe("visible");
    expect(ionizationClass(1e20)).toBe("ionizing");
    expect(isAudible(1000)).toBe(true);
    expect(isAudible(50000)).toBe(false);
    expect(NAMED_EM.length).toBeGreaterThan(5);
  });

  it("vision helpers", () => {
    const r = coneResponse(monochromatic(560));
    const rgb = coneToRgb(r);
    expect(rgb.length).toBe(3);
    expect(sSensitivity(420)).toBeCloseTo(1, 3);
    expect(lSensitivity(564)).toBeCloseTo(1, 3);
  });

  it("hearing place inverse", () => {
    expect(placeForFrequency(1000)).toBeGreaterThan(0);
  });

  it("thermal helpers + lorentzian branch", () => {
    expect(planckRadiance(10e-6, 300)).toBeGreaterThan(0);
    expect(radiatedPower(0.95, 1.8, 310)).toBeGreaterThan(0);
    expect(THERMAL_PRESETS.length).toBe(4);
    // lorentzian mode produces an in-band peak near 2.45 GHz
    const lo = waterDielectricLoss(1e9, "lorentzian-resonance");
    const peak = waterDielectricLoss(2.45e9, "lorentzian-resonance");
    expect(peak).toBeGreaterThan(lo);
  });

  it("resonance + scenario presets", () => {
    expect(RLC_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(SCENARIOS.length).toBe(3);
    expect(buildScenario("street").altitudeM).toBe(0);
    expect(buildScenario("unknown").id).toBe("room");
  });

  it("content helpers", () => {
    expect(nodeById("linearity")).toBeTruthy();
    expect(nodeById("nope")).toBeUndefined();
    expect(panelsForModule("spectrum").length).toBeGreaterThan(0);
    expect(MISCONCEPTION_PANELS.length).toBeGreaterThanOrEqual(5);
  });
});
