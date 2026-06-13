import { describe, expect, it } from "vitest";
import {
  amBandwidth,
  amDemodulate,
  amModulate,
  bpskBandwidth,
  bpskDemodulate,
  bpskModulate,
  fmBandwidth,
  fmDemodulate,
  fmModulate,
  message,
  normalizedRmsError,
} from "../../src/sim/modulation";

describe("Modulation core (AC5)", () => {
  const sampleRate = 48000;
  const n = 4096;

  it("(a) AM recovers the baseband message with RMS error ≤5% (noiseless)", () => {
    const msg = message(n, sampleRate, [200]);
    const mod = amModulate(msg, sampleRate, 4000, 0.8);
    const dem = amDemodulate(mod, sampleRate, 4000, 0.8);
    const err = normalizedRmsError(msg, dem, 200);
    expect(err).toBeLessThanOrEqual(0.05);
  });

  it("(a) FM recovers the baseband message with RMS error ≤5% (noiseless)", () => {
    const msg = message(n, sampleRate, [150]);
    const mod = fmModulate(msg, sampleRate, 6000, 1500);
    const dem = fmDemodulate(mod, sampleRate, 6000, 1500);
    const err = normalizedRmsError(msg, dem, 300);
    expect(err).toBeLessThanOrEqual(0.05);
  });

  it("(b) BPSK round-trips with zero bit errors (noiseless)", () => {
    const bits = Array.from({ length: 200 }, () => (Math.random() < 0.5 ? 0 : 1));
    const mod = bpskModulate(bits, sampleRate, 4000, 40);
    const out = bpskDemodulate(mod, sampleRate, 4000, 40);
    expect(out.length).toBe(bits.length);
    let errors = 0;
    for (let i = 0; i < bits.length; i++) if (out[i] !== bits[i]) errors++;
    expect(errors).toBe(0);
  });

  it("(c) occupied bandwidth increases with message bandwidth / deviation", () => {
    expect(amBandwidth(2000)).toBeGreaterThan(amBandwidth(1000));
    expect(fmBandwidth(2000, 5000)).toBeGreaterThan(fmBandwidth(2000, 2000));
    expect(bpskBandwidth(2000)).toBeGreaterThan(bpskBandwidth(1000));
  });
});
