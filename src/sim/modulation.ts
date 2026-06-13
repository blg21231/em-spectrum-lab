// Modulation core (AC5). Pure module — no DOM/WebGL.
// AM / FM / BPSK encode → demodulate round-trip with the message recovered, plus
// occupied-bandwidth estimates.

import { fft } from "./fft";

/** Generate a baseband message: a sum of low-frequency tones. */
export function message(n: number, sampleRate: number, freqs: number[]): Float64Array {
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const f of freqs) v += Math.sin((2 * Math.PI * f * i) / sampleRate);
    x[i] = v / freqs.length;
  }
  return x;
}

// ── AM ──────────────────────────────────────────────────────────────────────
export function amModulate(msg: Float64Array, sampleRate: number, carrierHz: number, depth = 0.8): Float64Array {
  const out = new Float64Array(msg.length);
  for (let i = 0; i < msg.length; i++) {
    out[i] = (1 + depth * msg[i]) * Math.cos((2 * Math.PI * carrierHz * i) / sampleRate);
  }
  return out;
}

/** Envelope demodulation: rectify + low-pass (moving average), then remove DC. */
/** Centered moving average (zero group delay) of half-window `h`. */
function centeredMA(arr: Float64Array, h: number): Float64Array {
  const n = arr.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let acc = 0;
    let cnt = 0;
    for (let k = -h; k <= h; k++) {
      const j = i + k;
      if (j >= 0 && j < n) {
        acc += arr[j];
        cnt++;
      }
    }
    out[i] = acc / cnt;
  }
  return out;
}

export function amDemodulate(sig: Float64Array, sampleRate: number, carrierHz: number, depth = 0.8): Float64Array {
  const half = Math.max(1, Math.round(sampleRate / carrierHz));
  const env = centeredMA(sig.map(Math.abs) as Float64Array, half);
  // envelope ≈ (2/π)(1 + depth·m); remove DC and rescale to recover m
  let mean = 0;
  for (const v of env) mean += v;
  mean /= env.length;
  const out = new Float64Array(sig.length);
  for (let i = 0; i < sig.length; i++) out[i] = (env[i] - mean) / (depth * mean);
  return out;
}

// ── FM ──────────────────────────────────────────────────────────────────────
export function fmModulate(msg: Float64Array, sampleRate: number, carrierHz: number, deviationHz: number): Float64Array {
  const out = new Float64Array(msg.length);
  let phase = 0;
  for (let i = 0; i < msg.length; i++) {
    phase += (2 * Math.PI * (carrierHz + deviationHz * msg[i])) / sampleRate;
    out[i] = Math.cos(phase);
  }
  return out;
}

/**
 * FM demodulation via the analytic signal: build z(t) = Hilbert(sig) using the FFT
 * (zero the negative-frequency half, double the positive), then differentiate the
 * instantaneous phase after removing the carrier. Exact for power-of-2 lengths.
 */
export function fmDemodulate(sig: Float64Array, sampleRate: number, carrierHz: number, deviationHz: number): Float64Array {
  const n = sig.length;
  const isPow2 = (n & (n - 1)) === 0;
  const re = Float64Array.from(sig);
  const im = new Float64Array(n);
  if (isPow2) {
    fft(re, im, false);
    // analytic signal: double positive freqs, zero negative
    for (let k = 1; k < n / 2; k++) {
      re[k] *= 2;
      im[k] *= 2;
    }
    for (let k = n / 2 + 1; k < n; k++) {
      re[k] = 0;
      im[k] = 0;
    }
    fft(re, im, true);
  }
  const out = new Float64Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const phi = Math.atan2(im[i], re[i]) - (2 * Math.PI * carrierHz * i) / sampleRate;
    let d = phi - prev;
    prev = phi;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    out[i] = (d * sampleRate) / (2 * Math.PI * deviationHz);
  }
  return out;
}

/** Normalized RMS error between two signals over a settled interior window. */
export function normalizedRmsError(a: Float64Array, b: Float64Array, skip = 0): number {
  let num = 0;
  let den = 0;
  for (let i = skip; i < a.length - skip; i++) {
    const d = a[i] - b[i];
    num += d * d;
    den += a[i] * a[i];
  }
  return Math.sqrt(num / Math.max(den, 1e-12));
}

// ── Digital: BPSK ─────────────────────────────────────────────────────────
export function bpskModulate(bits: number[], sampleRate: number, carrierHz: number, samplesPerBit: number): Float64Array {
  const out = new Float64Array(bits.length * samplesPerBit);
  for (let b = 0; b < bits.length; b++) {
    const sym = bits[b] === 1 ? 1 : -1;
    for (let k = 0; k < samplesPerBit; k++) {
      const i = b * samplesPerBit + k;
      out[i] = sym * Math.cos((2 * Math.PI * carrierHz * i) / sampleRate);
    }
  }
  return out;
}

/** Coherent BPSK demodulation: correlate each bit window against the carrier. */
export function bpskDemodulate(sig: Float64Array, sampleRate: number, carrierHz: number, samplesPerBit: number): number[] {
  const nBits = Math.floor(sig.length / samplesPerBit);
  const bits: number[] = [];
  for (let b = 0; b < nBits; b++) {
    let corr = 0;
    for (let k = 0; k < samplesPerBit; k++) {
      const i = b * samplesPerBit + k;
      corr += sig[i] * Math.cos((2 * Math.PI * carrierHz * i) / sampleRate);
    }
    bits.push(corr >= 0 ? 1 : 0);
  }
  return bits;
}

/** Occupied bandwidth estimates (Hz). */
export function amBandwidth(messageBandwidthHz: number): number {
  return 2 * messageBandwidthHz; // double-sideband
}
export function fmBandwidth(messageBandwidthHz: number, deviationHz: number): number {
  return 2 * (deviationHz + messageBandwidthHz); // Carson's rule
}
export function bpskBandwidth(bitRate: number): number {
  return 2 * bitRate; // main-lobe null-to-null
}
