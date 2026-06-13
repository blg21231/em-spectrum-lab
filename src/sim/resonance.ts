// Resonance / tuning / selectivity core (AC4). Pure module — no DOM/WebGL.
// Series-RLC resonance, Q/bandwidth, multi-carrier selectivity, and OFDM
// subcarrier orthogonality.

/** Resonant frequency of a series RLC: f0 = 1/(2π√(LC)). */
export function resonantFrequency(L: number, C: number): number {
  return 1 / (2 * Math.PI * Math.sqrt(L * C));
}

/** Quality factor of a series RLC: Q = (1/R)·√(L/C). */
export function qualityFactor(R: number, L: number, C: number): number {
  return (1 / R) * Math.sqrt(L / C);
}

/** −3 dB bandwidth: Δf = f0 / Q. */
export function bandwidth(f0: number, Q: number): number {
  return f0 / Q;
}

/**
 * Magnitude response |H(f)| of a series-RLC bandpass (voltage across R), normalized to
 * 1 at resonance. |H| = 1 / √(1 + Q²(f/f0 − f0/f)²).
 */
export function rlcResponse(f: number, f0: number, Q: number): number {
  const x = f / f0 - f0 / f;
  return 1 / Math.sqrt(1 + Q * Q * x * x);
}

/** Response in dB relative to resonance. */
export function rlcResponseDb(f: number, f0: number, Q: number): number {
  return 20 * Math.log10(rlcResponse(f, f0, Q));
}

export interface Carrier {
  freqHz: number;
  amp: number;
}

/**
 * A receiver tuned to f0 with selectivity Q, applied to a sum of carriers: returns
 * each carrier's passed amplitude (amp × |H(f)|). The tuned carrier passes ~unattenuated;
 * off-resonance carriers are suppressed by the RLC skirt.
 */
export function tunedReceiver(carriers: Carrier[], f0: number, Q: number): { freqHz: number; passedAmp: number; suppressionDb: number }[] {
  return carriers.map((c) => {
    const h = rlcResponse(c.freqHz, f0, Q);
    return { freqHz: c.freqHz, passedAmp: c.amp * h, suppressionDb: -20 * Math.log10(h) };
  });
}

// ── OFDM subcarrier orthogonality ───────────────────────────────────────────
// SUBCARRIER_SPACING = 1/T: subcarriers spaced by exactly one cycle-per-symbol are
// mutually orthogonal. Offsetting the spacing destroys orthogonality (M4).

/** Subcarrier spacing (Hz) for symbol duration T (s): Δf = 1/T. */
export function subcarrierSpacing(T: number): number {
  const SUBCARRIER_SPACING = 1 / T;
  return SUBCARRIER_SPACING;
}

/**
 * Inner product of subcarrier i and j over one symbol of N samples, T seconds.
 * Returns the normalized correlation (≈1 for i=j, ≈0 for i≠j when orthogonal).
 */
export function subcarrierCorrelation(i: number, j: number, N: number, T: number, spacing = subcarrierSpacing(T)): number {
  let re = 0;
  let im = 0;
  for (let n = 0; n < N; n++) {
    const t = (n / N) * T;
    const phi = 2 * Math.PI * (i - j) * spacing * t;
    re += Math.cos(phi);
    im += Math.sin(phi);
  }
  return Math.hypot(re, im) / N;
}

/** Full N×N orthogonality matrix of correlation magnitudes. */
export function orthogonalityMatrix(K: number, N: number, T: number, spacing = subcarrierSpacing(T)): number[][] {
  const M: number[][] = [];
  for (let i = 0; i < K; i++) {
    M.push([]);
    for (let j = 0; j < K; j++) M[i].push(subcarrierCorrelation(i, j, N, T, spacing));
  }
  return M;
}

/** Max off-diagonal correlation (the orthogonality defect). */
export function maxOffDiagonal(M: number[][]): number {
  let m = 0;
  for (let i = 0; i < M.length; i++) for (let j = 0; j < M.length; j++) if (i !== j) m = Math.max(m, M[i][j]);
  return m;
}

export interface RlcPreset {
  id: string;
  label: string;
  L: number;
  C: number;
  R: number;
}
export const RLC_PRESETS: RlcPreset[] = [
  { id: "fm", label: "FM band (~100 MHz)", L: 1e-7, C: 2.5e-11, R: 6.3 },
  { id: "am", label: "AM band (~1 MHz)", L: 2.5e-4, C: 1e-10, R: 50 },
  { id: "wifi", label: "Wi-Fi (~2.4 GHz)", L: 1e-9, C: 4.4e-12, R: 1.5 },
];
