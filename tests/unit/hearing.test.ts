import { describe, expect, it } from "vitest";
import {
  acousticWave,
  basilarPattern,
  chordSignal,
  greenwoodFrequency,
  placeForFrequency,
  soundSpeed,
  SOUND_SPEED_MS,
} from "../../src/sim/hearing";
import { SPEED_OF_LIGHT } from "../../src/sim/spectrum";

describe("Hearing core (AC9)", () => {
  it("(a) Greenwood map is monotonic over x∈[0,1] and endpoints ≈20 Hz / 20 kHz within 5%", () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const f = greenwoodFrequency(i / 100);
      expect(f).toBeGreaterThan(prev);
      prev = f;
    }
    const fApex = greenwoodFrequency(0);
    const fBase = greenwoodFrequency(1);
    expect(Math.abs(fApex - 20) / 20).toBeLessThanOrEqual(0.05);
    expect(Math.abs(fBase - 20000) / 20000).toBeLessThanOrEqual(0.05);
  });

  it("(b) a chord (≥3 tones) decomposes; each tone maps to the correct place within 2%", () => {
    const sampleRate = 44100;
    const npow = 16384;
    const freqs = [220, 440, 880];
    const sig = chordSignal(freqs, sampleRate, npow);
    const pat = basilarPattern(sig, sampleRate);
    expect(pat.peakPlaces.length).toBeGreaterThanOrEqual(3);
    for (const f of freqs) {
      const expectedX = placeForFrequency(f);
      const nearest = pat.peakPlaces.reduce((best, p) =>
        Math.abs(p.x - expectedX) < Math.abs(best.x - expectedX) ? p : best,
      );
      expect(Math.abs(nearest.x - expectedX)).toBeLessThanOrEqual(0.02);
    }
  });

  it("(c) sound is mechanical — 343 m/s, never the speed of light, never an EM band", () => {
    expect(soundSpeed()).toBe(343);
    expect(SOUND_SPEED_MS).toBe(343);
    expect(SOUND_SPEED_MS).not.toBe(SPEED_OF_LIGHT);
    const w = acousticWave(1000);
    expect(w.electromagnetic).toBe(false);
    expect(w.longitudinal).toBe(true);
    expect(w.speedMs).toBe(343);
    expect(Math.abs(w.wavelengthM - 0.343)).toBeLessThanOrEqual(1e-9);
    // it never used c: λ would be 299792 m if it had
    expect(w.wavelengthM).toBeLessThan(1);
  });
});
