import { describe, expect, it } from "vitest";
import { processingGainDb, simulateDsss } from "../../src/sim/spreading";

describe("Matched-filter / spreading core (AC7) — the magic", () => {
  it("(a) processing gain = 10·log10(N) within 0.2 dB for N = 31/127/1023", () => {
    for (const N of [31, 127, 1023]) {
      expect(Math.abs(processingGainDb(N) - 10 * Math.log10(N))).toBeLessThanOrEqual(0.2);
    }
  });

  it("(b) DSSS-BPSK at raw SNR −15 dB: despread BER <1% over ≥1000 bits; undespread control ≈50%", () => {
    const r = simulateDsss(1200, 1023, -15, 2024);
    expect(r.despreadBer).toBeLessThan(0.01);
    // control is at chance — count it as ≈50% (within ±10%)
    expect(r.controlBer).toBeGreaterThanOrEqual(0.4);
    expect(r.controlBer).toBeLessThanOrEqual(0.6);
  });

  it("(c) despread peak SNR exceeds raw SNR by the analytic processing gain within 1 dB", () => {
    const N = 1023;
    const r = simulateDsss(1200, N, -15, 7);
    const gain = r.despreadPeakSnrDb - r.rawSnrDb;
    expect(Math.abs(gain - processingGainDb(N))).toBeLessThanOrEqual(1);
  });
});
