import { describe, expect, it } from "vitest";
import { analyzer, bandPower, defaultSources, type RoomSource } from "../../src/sim/room";

describe("Room model core (AC12 / M15)", () => {
  it("true superposition: analyzer(A+B) == analyzer(A) + analyzer(B) within 1% — incl. OVERLAPPING bands", () => {
    const all = defaultSources();
    // Wi-Fi (2.442 GHz) and Bluetooth (2.45 GHz) OVERLAP in the same band, so a max()
    // combiner (M15) gives a strictly smaller result than the linear sum where the two
    // bumps overlap — this is what makes the superposition test bite.
    const A = all.filter((s) => s.id === "wifi");
    const B = all.filter((s) => s.id === "bluetooth");
    const both = all.filter((s) => s.id === "wifi" || s.id === "bluetooth");
    const tA = analyzer(A);
    const tB = analyzer(B);
    const tBoth = analyzer(both);
    let maxRel = 0;
    let maxAbs = 0;
    let overlapChecked = false;
    for (let i = 0; i < tBoth.length; i++) {
      const sum = tA[i] + tB[i];
      maxAbs = Math.max(maxAbs, Math.abs(tBoth[i] - sum));
      if (sum > 1e-9) maxRel = Math.max(maxRel, Math.abs(tBoth[i] - sum) / sum);
      // assert there is a bin where BOTH sources contribute (overlap) so max≠sum there
      if (tA[i] > 1e-6 && tB[i] > 1e-6) overlapChecked = true;
    }
    expect(overlapChecked, "test must exercise an overlapping bin").toBe(true);
    expect(maxRel).toBeLessThanOrEqual(0.01);
    expect(maxAbs).toBeLessThanOrEqual(1e-9);
  });

  it("toggling Wi-Fi changes power only in the ~2.4 GHz band", () => {
    const sources = defaultSources();
    const withWifi = analyzer(sources);
    const noWifi = analyzer(sources.map((s) => (s.id === "wifi" ? { ...s, enabled: false } : s)));
    const wifiBand = bandPower(withWifi, 2.2e9, 2.7e9) - bandPower(noWifi, 2.2e9, 2.7e9);
    const visBand = bandPower(withWifi, 4e14, 7.9e14) - bandPower(noWifi, 4e14, 7.9e14);
    expect(wifiBand).toBeGreaterThan(0);
    expect(Math.abs(visBand)).toBeLessThanOrEqual(wifiBand * 0.01 + 1e-9);
  });

  it("≥6 sources at real bands; Wi-Fi center within 2.40–2.4835 GHz", () => {
    const sources = defaultSources();
    expect(sources.length).toBeGreaterThanOrEqual(6);
    const wifi = sources.find((s) => s.id === "wifi") as RoomSource;
    expect(wifi.centerHz).toBeGreaterThanOrEqual(2.40e9);
    expect(wifi.centerHz).toBeLessThanOrEqual(2.4835e9);
  });
});
