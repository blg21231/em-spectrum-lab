import { describe, expect, it } from "vitest";
import {
  microwaveBandProfile,
  stefanBoltzmann,
  totalExitanceNumeric,
  visibleFraction,
  wienPeakWavelength,
} from "../../src/sim/thermal";

describe("Thermal / blackbody core (AC3)", () => {
  it("(a) Wien peak λ_max = b/T within 0.1% for room/body/bulb/sun", () => {
    const cases: [number, number][] = [
      [293, 9.89e-6],
      [310, 9.35e-6],
      [2700, 1.073e-6],
      [5778, 5.016e-7],
    ];
    for (const [T, expected] of cases) {
      const lam = wienPeakWavelength(T);
      expect(Math.abs(lam - expected) / expected).toBeLessThanOrEqual(0.001);
    }
  });

  it("(b) ∫Planck = σT⁴ within 0.5% at ≥3 temperatures", () => {
    for (const T of [293, 1000, 5778]) {
      const num = totalExitanceNumeric(T);
      const sb = stefanBoltzmann(T);
      expect(Math.abs(num - sb) / sb).toBeLessThanOrEqual(0.005);
    }
  });

  it("(c) visible fraction: 300 K in [1e-25,1e-20], 5778 K in [0.3,0.6]", () => {
    const f300 = visibleFraction(300);
    expect(f300).toBeGreaterThanOrEqual(1e-25);
    expect(f300).toBeLessThanOrEqual(1e-20);
    const fSun = visibleFraction(5778);
    expect(fSun).toBeGreaterThanOrEqual(0.3);
    expect(fSun).toBeLessThanOrEqual(0.6);
  });

  it("(iii AC15) microwave/water absorption is monotonic dielectric loss — NO in-band resonant peak", () => {
    const prof = microwaveBandProfile();
    expect(prof.monotonic).toBe(true);
    expect(prof.hasInBandPeak).toBe(false);
  });
});
