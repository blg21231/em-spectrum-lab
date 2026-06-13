// Hearing core (AC9). Pure module — no DOM/WebGL.
// The cochlea as a spatial spectrum analyzer (Greenwood place-frequency map), a chord
// decomposed by FFT onto tonotopic places, and sound kept rigorously MECHANICAL.

import { spectrum } from "./fourier";

// Sound is a longitudinal mechanical pressure wave — NOT electromagnetic.
export const SOUND_SPEED_MS = 343; // m/s in air (NOT the speed of light)
export const ELECTROMAGNETIC = false as const;

// Greenwood function parameters (human cochlea).
export const GREENWOOD_A = 165.4;
export const GREENWOOD_a = 2.1;
export const GREENWOOD_k = 0.88;

/**
 * Greenwood place→frequency map: f = A·(10^{a·x} − k), where x ∈ [0,1] is the
 * normalized distance from the apex. Monotonically increasing; endpoints ≈20 Hz / ≈20 kHz.
 */
export function greenwoodFrequency(x: number): number {
  return GREENWOOD_A * (Math.pow(10, GREENWOOD_a * x) - GREENWOOD_k);
}

/** Inverse: the tonotopic place x for a given frequency f. */
export function placeForFrequency(f: number): number {
  return Math.log10(f / GREENWOOD_A + GREENWOOD_k) / GREENWOOD_a;
}

/** Mechanical descriptor of a sound — never an EM band, never the speed of light. */
export interface AcousticWave {
  electromagnetic: false;
  longitudinal: true;
  speedMs: number;
  frequencyHz: number;
  wavelengthM: number; // λ = v_sound / f
}

export function acousticWave(frequencyHz: number): AcousticWave {
  return {
    electromagnetic: ELECTROMAGNETIC,
    longitudinal: true,
    speedMs: SOUND_SPEED_MS,
    frequencyHz,
    wavelengthM: SOUND_SPEED_MS / frequencyHz,
  };
}

/** The speed used for acoustic wavelength — asserted to be 343, never c. */
export function soundSpeed(): number {
  return SOUND_SPEED_MS;
}

export interface BasilarPattern {
  x: number[]; // place positions [0,1]
  excitation: number[]; // excitation at each place
  peakPlaces: { x: number; freqHz: number }[];
}

/**
 * Decompose a chord (sum of tones, sampled at sampleRate) via FFT and map each
 * spectral peak to its tonotopic place — the basilar membrane excitation pattern.
 */
export function basilarPattern(signal: Float64Array, sampleRate: number, nPlaces = 200): BasilarPattern {
  const spec = spectrum(signal, sampleRate);
  const x: number[] = [];
  const excitation: number[] = [];
  for (let i = 0; i < nPlaces; i++) {
    const xi = i / (nPlaces - 1);
    const fPlace = greenwoodFrequency(xi);
    // accumulate spectral energy near this place's characteristic frequency
    let e = 0;
    for (const bin of spec) {
      if (bin.freqHz <= 0) continue;
      const ratio = bin.freqHz / fPlace;
      const oct = Math.log2(ratio);
      e += bin.magnitude * Math.exp(-(oct * oct) / (2 * 0.04)); // ~1/5-octave tuning
    }
    x.push(xi);
    excitation.push(e);
  }
  // peak detection
  const peakPlaces: { x: number; freqHz: number }[] = [];
  for (let i = 1; i < nPlaces - 1; i++) {
    if (excitation[i] > excitation[i - 1] && excitation[i] > excitation[i + 1]) {
      const max = Math.max(...excitation);
      if (excitation[i] > max * 0.3) peakPlaces.push({ x: x[i], freqHz: greenwoodFrequency(x[i]) });
    }
  }
  return { x, excitation, peakPlaces };
}

/** Build a chord signal from tone frequencies. */
export function chordSignal(freqs: number[], sampleRate: number, n: number): Float64Array {
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const f of freqs) v += Math.sin((2 * Math.PI * f * i) / sampleRate);
    x[i] = v;
  }
  return x;
}
