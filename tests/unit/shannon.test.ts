import { describe, expect, it } from "vitest";
import { capacity, noiseDensityDbmPerHz, noiseFloorDbm } from "../../src/sim/shannon";

describe("SNR & Shannon capacity core (AC6)", () => {
  it("(a) kTB noise floor ≈ −174 dBm/Hz at 290 K within 0.1 dB across ≥3 bandwidths", () => {
    expect(Math.abs(noiseDensityDbmPerHz(290) - -173.97)).toBeLessThanOrEqual(0.1);
    // N = kTB scales as 10·log10(B): floor for B Hz = density + 10log10(B)
    for (const B of [1e3, 1e6, 20e6]) {
      const expected = noiseDensityDbmPerHz(290) + 10 * Math.log10(B);
      expect(Math.abs(noiseFloorDbm(290, B) - expected)).toBeLessThanOrEqual(0.1);
    }
  });

  it("(b) C = B·log2(1+S/N) exact (≤1e-9) and strictly increasing in B and S/N", () => {
    // hand-checked: B=1, S/N=1 → 1 bit/s; S/N=3 → 2; S/N=7 → 3
    expect(Math.abs(capacity(1, 1) - 1)).toBeLessThanOrEqual(1e-9);
    expect(Math.abs(capacity(1, 3) - 2)).toBeLessThanOrEqual(1e-9);
    expect(Math.abs(capacity(1, 7) - 3)).toBeLessThanOrEqual(1e-9);
    expect(Math.abs(capacity(1e6, 1) - 1e6)).toBeLessThanOrEqual(1e-3);
    // monotone in B
    let prev = -Infinity;
    for (const B of [1e3, 1e4, 1e5, 1e6]) {
      const c = capacity(B, 10);
      expect(c).toBeGreaterThan(prev);
      prev = c;
    }
    // monotone in S/N
    prev = -Infinity;
    for (const snr of [0.1, 1, 3, 10, 100, 1000]) {
      const c = capacity(1e6, snr);
      expect(c).toBeGreaterThan(prev);
      prev = c;
    }
  });
});
