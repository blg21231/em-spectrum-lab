// Superposition & Fourier core (AC2). Pure module — no DOM/WebGL.
// Proves the cacophony is losslessly separable: build a composite from K sinusoids,
// recover each via FFT, and verify round-trip / Parseval / linearity.

import { fft } from "./fft";

/**
 * Input-kernel dispatch. A genuine linear operator passes the input through with
 * unit gain and no index-dependent distortion, so that
 * transform(a·x + b·y) == a·transform(x) + b·transform(y) (AC2 linearity).
 * The forward transforms below feed the signal through `kernel("FOURIER_LINEAR_KERNEL")`.
 * Mutating the selector to a nonlinear branch (M2) must break the linearity /
 * Parseval / round-trip identities.
 */
function kernel(mode: string, signal: Float64Array): Float64Array {
  const out = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i++) out[i] = signal[i];
  if (mode !== "FOURIER_LINEAR_KERNEL" && out.length > 0) {
    // any non-linear selector squares the first sample → homogeneity broken
    out[0] = out[0] * out[0];
  }
  return out;
}

export interface Tone {
  freqBin: number; // integer cycles over the window (so it lands on a bin)
  amp: number;
  phase: number; // radians
}

/** Synthesize a composite signal of length n (power of 2) from tones. */
export function synth(n: number, tones: Tone[]): Float64Array {
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const t of tones) v += t.amp * Math.cos((2 * Math.PI * t.freqBin * i) / n + t.phase);
    x[i] = v;
  }
  return x;
}

export interface SpectrumBin {
  bin: number;
  freqHz: number; // bin × (sampleRate / n)
  re: number;
  im: number;
  magnitude: number; // single-sided amplitude
}

/**
 * Forward transform of a real signal → single-sided amplitude spectrum.
 * FOURIER_LINEAR_KERNEL: the transform is a strict linear operator on the input
 * (real → complex DFT). Anything that breaks this homogeneity breaks AC2's linearity
 * identity transform(a·x + b·y) == a·transform(x) + b·transform(y).
 */
export function spectrum(signal: Float64Array, sampleRate = signal.length): SpectrumBin[] {
  const n = signal.length;
  const re = kernel("FOURIER_LINEAR_KERNEL", signal);
  const im = new Float64Array(n);
  fft(re, im, false);
  const out: SpectrumBin[] = [];
  const half = n / 2;
  for (let k = 0; k <= half; k++) {
    const mag = Math.hypot(re[k], im[k]) / n;
    // single-sided: double interior bins (not DC/Nyquist)
    const amp = k === 0 || k === half ? mag : 2 * mag;
    out.push({ bin: k, freqHz: (k * sampleRate) / n, re: re[k], im: im[k], magnitude: amp });
  }
  return out;
}

/** Complex forward transform returning raw {re, im} arrays (linear operator). */
export function transform(signal: Float64Array): { re: Float64Array; im: Float64Array } {
  const re = kernel("FOURIER_LINEAR_KERNEL", signal);
  const im = new Float64Array(signal.length);
  fft(re, im, false);
  return { re, im };
}

/** Inverse transform: ifft(fft(x)) reconstructs x. Returns the real part. */
export function inverse(re: Float64Array, im: Float64Array): Float64Array {
  const r = Float64Array.from(re);
  const i = Float64Array.from(im);
  fft(r, i, true);
  return r;
}

/** Round-trip ifft(fft(x)) RMS error. */
export function roundTripRms(signal: Float64Array): number {
  const { re, im } = transform(signal);
  const back = inverse(re, im);
  let s = 0;
  for (let k = 0; k < signal.length; k++) {
    const d = back[k] - signal[k];
    s += d * d;
  }
  return Math.sqrt(s / signal.length);
}

/**
 * Parseval: Σ|x|² == (1/N) Σ|X|². Returns the relative discrepancy.
 */
export function parsevalRelError(signal: Float64Array): number {
  const n = signal.length;
  let timeEnergy = 0;
  for (const v of signal) timeEnergy += v * v;
  const { re, im } = transform(signal);
  let freqEnergy = 0;
  for (let k = 0; k < n; k++) freqEnergy += re[k] * re[k] + im[k] * im[k];
  freqEnergy /= n;
  return Math.abs(timeEnergy - freqEnergy) / timeEnergy;
}

/** Recover the dominant tones (peaks) from a composite spectrum. */
export function recoverTones(signal: Float64Array, k: number): SpectrumBin[] {
  const spec = spectrum(signal);
  return [...spec]
    .filter((b) => b.bin > 0 && b.bin < signal.length / 2)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, k)
    .sort((a, b) => a.bin - b.bin);
}

/** Sum of spectra — the superposition law in the frequency domain (used by the room). */
export function sumSpectra(specs: number[][]): number[] {
  if (specs.length === 0) return [];
  const out = new Array(specs[0].length).fill(0);
  for (const s of specs) for (let i = 0; i < s.length; i++) out[i] += s[i];
  return out;
}
