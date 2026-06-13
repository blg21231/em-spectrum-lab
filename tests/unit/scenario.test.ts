import { describe, expect, it } from "vitest";
import { buildScenario, cosmicDoseRate, doseMultiple } from "../../src/sim/scenario";

describe("Scenarios core (AC11)", () => {
  it("(a) dose strictly increases with altitude (a decreasing model FAILS)", () => {
    let prev = -Infinity;
    for (const h of [0, 1000, 2000, 4000, 8000, 10000, 12000]) {
      const d = cosmicDoseRate(h);
      expect(d).toBeGreaterThan(prev);
      prev = d;
    }
  });

  it("(a) dose ≈2× per 2000 m near the ground within 15%, and ≈10× ground at 10 km within 15%", () => {
    // the doubling-per-2000m rule of thumb holds in the lower troposphere
    for (const h of [0, 2000]) {
      const ratio = cosmicDoseRate(h + 2000) / cosmicDoseRate(h);
      expect(Math.abs(ratio - 2) / 2).toBeLessThanOrEqual(0.15);
    }
    const mult10k = doseMultiple(10000);
    expect(Math.abs(mult10k - 10) / 10).toBeLessThanOrEqual(0.15);
  });

  it("(b) airplane scenario raises cosmic + attenuates external cellular vs room", () => {
    const room = buildScenario("room");
    const plane = buildScenario("airplane");
    expect(plane.cosmicIndicator).toBeGreaterThan(room.cosmicIndicator);
    expect(plane.cellularIndicator).toBeLessThan(room.cellularIndicator);
  });
});
