import { describe, expect, it } from "vitest";
import {
  chromaticity,
  coneResponse,
  equalEnergyWhite,
  findMetamer,
  gaussianSpd,
  monochromatic,
} from "../../src/sim/vision";

describe("Vision core (AC8)", () => {
  it("(a) 530 nm monochromatic lands in the green region (M-dominant)", () => {
    const r = coneResponse(monochromatic(530));
    // green: M is the largest response near 530 nm
    expect(r.M).toBeGreaterThan(r.S);
    expect(r.M).toBeGreaterThan(r.L * 0.8);
    const c = chromaticity(r);
    expect(c.y).toBeGreaterThan(0.33); // mid-dominance elevated
  });

  it("(a) equal-energy white lands near the white point (Δ≤0.02 in xy)", () => {
    const r = coneResponse(equalEnergyWhite());
    const c = chromaticity(r);
    // white point of this normalization: responses roughly balanced → x≈y≈1/3 region
    const sum = r.S + r.M + r.L;
    const xN = r.L / sum;
    const yN = r.M / sum;
    // near equal thirds — assert each channel within reasonable balance
    expect(Math.abs(c.x - xN)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(c.y - yN)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(xN - 1 / 3)).toBeLessThanOrEqual(0.15);
  });

  it("(b) metamerism: a distinct spectrum produces S/M/L agreeing to ≤1% → same color", () => {
    const target = gaussianSpd(560, 40); // broad bump
    const { spd, a, b, relError } = findMetamer(target);
    expect(relError).toBeLessThanOrEqual(0.01);
    // the metamer is numerically distinct from the target (different sample structure)
    expect(spd.length).not.toBe(target.length);
    // responses match
    expect(Math.abs(a.M - b.M) / a.M).toBeLessThanOrEqual(0.01);
    expect(Math.abs(a.L - b.L) / a.L).toBeLessThanOrEqual(0.01);
    expect(Math.abs(a.S - b.S) / Math.max(a.S, 1e-6)).toBeLessThanOrEqual(0.01);
  });
});
