import { describe, expect, it } from "vitest";
import { parsevalRelError, recoverTones, roundTripRms, synth, transform, type Tone } from "../../src/sim/fourier";

describe("Superposition & Fourier core (AC2)", () => {
  const N = 1024;
  const tones: Tone[] = [
    { freqBin: 13, amp: 1.0, phase: 0.3 },
    { freqBin: 47, amp: 0.6, phase: 1.1 },
    { freqBin: 90, amp: 0.9, phase: -0.7 },
    { freqBin: 150, amp: 0.4, phase: 2.0 },
    { freqBin: 220, amp: 0.75, phase: 0.0 },
  ];

  it("(a) recovers each of K≥5 components: frequency within one bin, amplitude within 2%", () => {
    const x = synth(N, tones);
    const recovered = recoverTones(x, tones.length);
    expect(recovered.length).toBe(tones.length);
    const sorted = [...tones].sort((a, b) => a.freqBin - b.freqBin);
    for (let i = 0; i < sorted.length; i++) {
      expect(Math.abs(recovered[i].bin - sorted[i].freqBin)).toBeLessThanOrEqual(1);
      expect(Math.abs(recovered[i].magnitude - sorted[i].amp) / sorted[i].amp).toBeLessThanOrEqual(0.02);
    }
  });

  it("(b) round-trip ifft(fft(x)) reconstructs x to ≤1e-9 RMS", () => {
    const x = synth(N, tones);
    expect(roundTripRms(x)).toBeLessThanOrEqual(1e-9);
    // random signal too
    const r = new Float64Array(N);
    for (let i = 0; i < N; i++) r[i] = Math.random() * 2 - 1;
    expect(roundTripRms(r)).toBeLessThanOrEqual(1e-9);
  });

  it("(c) Parseval identity holds to ≤1e-9 relative", () => {
    const x = synth(N, tones);
    expect(parsevalRelError(x)).toBeLessThanOrEqual(1e-9);
  });

  it("(d) linearity: transform(a·x + b·y) == a·transform(x) + b·transform(y) to ≤1e-9", () => {
    const x = synth(N, [{ freqBin: 11, amp: 1, phase: 0 }]);
    const y = synth(N, [{ freqBin: 33, amp: 0.7, phase: 0.5 }]);
    const a = 1.7;
    const b = -0.4;
    const comb = new Float64Array(N);
    for (let i = 0; i < N; i++) comb[i] = a * x[i] + b * y[i];
    const Tc = transform(comb);
    const Tx = transform(x);
    const Ty = transform(y);
    let maxErr = 0;
    for (let k = 0; k < N; k++) {
      const reExp = a * Tx.re[k] + b * Ty.re[k];
      const imExp = a * Tx.im[k] + b * Ty.im[k];
      maxErr = Math.max(maxErr, Math.abs(Tc.re[k] - reExp), Math.abs(Tc.im[k] - imExp));
    }
    expect(maxErr).toBeLessThanOrEqual(1e-9);
  });
});
