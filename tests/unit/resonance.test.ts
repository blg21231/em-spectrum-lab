import { describe, expect, it } from "vitest";
import {
  bandwidth,
  maxOffDiagonal,
  orthogonalityMatrix,
  qualityFactor,
  resonantFrequency,
  rlcResponse,
  subcarrierCorrelation,
  tunedReceiver,
  type Carrier,
} from "../../src/sim/resonance";

describe("Resonance / selectivity core (AC4)", () => {
  it("(a) f0 = 1/(2π√LC) within 0.1% and Δf = f0/Q within 2% for ≥3 sets", () => {
    const sets: [number, number, number][] = [
      [1e-7, 2.5e-11, 0],
      [2.5e-4, 1e-10, 0],
      [1e-9, 4.4e-12, 0],
    ];
    for (const [L, C] of sets) {
      const f0 = resonantFrequency(L, C);
      expect(Math.abs(f0 - 1 / (2 * Math.PI * Math.sqrt(L * C))) / f0).toBeLessThanOrEqual(0.001);
      const R = 5;
      const Q = qualityFactor(R, L, C);
      const bw = bandwidth(f0, Q);
      // measure -3dB bandwidth numerically from the response curve
      const target = 1 / Math.SQRT2;
      // find upper and lower -3dB points
      const findEdge = (dir: number) => {
        let f = f0;
        const step = f0 / 1e5;
        for (let i = 0; i < 2e6; i++) {
          f += dir * step;
          if (rlcResponse(f, f0, Q) <= target) return f;
        }
        return f;
      };
      const fHi = findEdge(1);
      const fLo = findEdge(-1);
      const measured = fHi - fLo;
      expect(Math.abs(measured - bw) / bw).toBeLessThanOrEqual(0.02);
    }
  });

  it("(b) selectivity: tuned receiver suppresses each off-resonance carrier ≥20 dB; re-tuning selects another", () => {
    const carriers: Carrier[] = [
      { freqHz: 1.0e6, amp: 1 },
      { freqHz: 1.5e6, amp: 1 },
      { freqHz: 2.2e6, amp: 1 },
    ];
    const Q = 80;
    // tune to carrier 0
    let res = tunedReceiver(carriers, carriers[0].freqHz, Q);
    expect(res[0].suppressionDb).toBeLessThanOrEqual(0.5);
    expect(res[1].suppressionDb).toBeGreaterThanOrEqual(20);
    expect(res[2].suppressionDb).toBeGreaterThanOrEqual(20);
    // re-tune to carrier 2
    res = tunedReceiver(carriers, carriers[2].freqHz, Q);
    expect(res[2].suppressionDb).toBeLessThanOrEqual(0.5);
    expect(res[0].suppressionDb).toBeGreaterThanOrEqual(20);
  });

  it("(c) OFDM: N≥8 subcarriers orthogonal — correlation ≤1e-9 for i≠j, 1 for i=j", () => {
    const K = 8;
    const N = 512;
    const T = 1e-3;
    const M = orthogonalityMatrix(K, N, T);
    for (let i = 0; i < K; i++) {
      expect(Math.abs(M[i][i] - 1)).toBeLessThanOrEqual(1e-9);
    }
    expect(maxOffDiagonal(M)).toBeLessThanOrEqual(1e-9);
    // spot-check a single pair
    expect(subcarrierCorrelation(2, 5, N, T)).toBeLessThanOrEqual(1e-9);
  });
});
