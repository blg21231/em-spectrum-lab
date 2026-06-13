import { describe, expect, it } from "vitest";
import {
  ATMOSPHERIC_WINDOWS,
  beerLambert,
  CONDUCTORS,
  conductorAttenuation,
  halfValueLayer,
  muFromHvl,
  skinDepth,
  windowFor,
} from "../../src/sim/attenuation";

describe("Attenuation & shielding core (AC10)", () => {
  it("(a) skin depth δ = 1/√(πfµσ): Cu @ 1 GHz ≈ 2.06 µm within 1% (≥3 pairs)", () => {
    const cu = CONDUCTORS.find((c) => c.id === "copper")!;
    const dCu = skinDepth(1e9, cu.sigma, cu.muR);
    expect(Math.abs(dCu * 1e6 - 2.06) / 2.06).toBeLessThanOrEqual(0.01);
    // aluminum @ 1 GHz and copper @ 100 MHz as additional pairs (analytic self-consistency)
    const al = CONDUCTORS.find((c) => c.id === "aluminum")!;
    const dAl = skinDepth(1e9, al.sigma, al.muR);
    expect(Math.abs(dAl - 1 / Math.sqrt(Math.PI * 1e9 * 4 * Math.PI * 1e-7 * al.sigma)) / dAl).toBeLessThanOrEqual(0.01);
    const dCu100 = skinDepth(100e6, cu.sigma, cu.muR);
    // δ ∝ 1/√f → 10× lower frequency → √10× larger depth
    expect(Math.abs(dCu100 / dCu - Math.sqrt(10)) / Math.sqrt(10)).toBeLessThanOrEqual(0.01);
  });

  it("(a) a few skin depths attenuate RF by ≥ e^−n (Faraday cage)", () => {
    const cu = CONDUCTORS.find((c) => c.id === "copper")!;
    const d = skinDepth(1e9, cu.sigma, cu.muR);
    const att = conductorAttenuation(5 * d, 1e9, cu.sigma, cu.muR);
    expect(att).toBeLessThanOrEqual(Math.exp(-5) + 1e-12);
  });

  it("(b) Beer–Lambert exact and HVL = ln2/µ within 1%", () => {
    expect(Math.abs(beerLambert(0.7, 0) - 1)).toBeLessThanOrEqual(1e-12);
    expect(Math.abs(beerLambert(2, 3) - Math.exp(-6))).toBeLessThanOrEqual(1e-12);
    const mu = 59.9;
    const hvl = halfValueLayer(mu);
    expect(Math.abs(beerLambert(mu, hvl) - 0.5)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(muFromHvl(hvl) - mu) / mu).toBeLessThanOrEqual(1e-9);
  });

  it("(c) atmospheric windows: visible+radio transparent; UV/X-ray/gamma absorbed", () => {
    expect(windowFor("visible")!.classification).toBe("transparent");
    expect(windowFor("radio")!.classification).toBe("transparent");
    expect(windowFor("ultraviolet")!.classification).toBe("absorbed");
    expect(windowFor("x-ray")!.classification).toBe("absorbed");
    expect(windowFor("gamma")!.classification).toBe("absorbed");
    expect(ATMOSPHERIC_WINDOWS.length).toBeGreaterThanOrEqual(7);
  });
});
