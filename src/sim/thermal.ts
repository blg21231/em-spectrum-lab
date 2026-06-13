// Thermal / blackbody core (AC3). Pure module — no DOM/WebGL.
// Planck spectral radiance, Wien displacement, Stefan–Boltzmann, visible fraction,
// and the microwave dielectric-loss artifact (NOT a water resonance) for AC15(iii).

export const PLANCK_H = 6.626e-34; // J·s
export const SPEED_OF_LIGHT = 2.998e8; // m/s
export const BOLTZMANN_K = 1.381e-23; // J/K
export const STEFAN_BOLTZMANN = 5.67e-8; // W·m⁻²·K⁻⁴
export const WIEN_B = 2.898e-3; // m·K

/** Wien displacement: λ_max = b / T (m). */
export function wienPeakWavelength(T: number): number {
  return WIEN_B / T;
}

/**
 * Planck spectral radiance per unit wavelength, B_λ(λ,T)
 * = 2hc²/λ⁵ · 1/(exp(hc/λkT) − 1)   [W·m⁻²·sr⁻¹·m⁻¹]
 */
export function planckRadiance(lambda: number, T: number): number {
  const a = (2 * PLANCK_H * SPEED_OF_LIGHT * SPEED_OF_LIGHT) / Math.pow(lambda, 5);
  const x = (PLANCK_H * SPEED_OF_LIGHT) / (lambda * BOLTZMANN_K * T);
  return a / (Math.expm1(x));
}

/** Spectral exitance M_λ = π·B_λ (W·m⁻²·m⁻¹), integrated over the hemisphere. */
export function planckExitance(lambda: number, T: number): number {
  return Math.PI * planckRadiance(lambda, T);
}

/**
 * Numerically integrate the Planck exitance over [lo, hi] (m) with adaptive log-spaced
 * Simpson sampling. Returns W·m⁻².
 */
export function integrateExitance(T: number, lo: number, hi: number, steps = 4000): number {
  // integrate in log-lambda for dynamic range; dλ = λ·d(lnλ)
  const a = Math.log(lo);
  const b = Math.log(hi);
  const h = (b - a) / steps;
  let sum = 0;
  for (let i = 0; i <= steps; i++) {
    const u = a + i * h;
    const lam = Math.exp(u);
    const f = planckExitance(lam, T) * lam; // dλ = λ du
    const w = i === 0 || i === steps ? 1 : i % 2 === 1 ? 4 : 2;
    sum += w * f;
  }
  return (sum * h) / 3;
}

/** Total radiant exitance via integration (should equal σT⁴). */
export function totalExitanceNumeric(T: number): number {
  // cover ~0.01·λ_max to ~100·λ_max — captures essentially all the power
  const peak = wienPeakWavelength(T);
  return integrateExitance(T, peak / 100, peak * 100, 6000);
}

/** Stefan–Boltzmann closed form: M = σT⁴ (W·m⁻²). */
export function stefanBoltzmann(T: number): number {
  return STEFAN_BOLTZMANN * Math.pow(T, 4);
}

/** Radiated power of a gray body: P = εσAT⁴ (W). */
export function radiatedPower(emissivity: number, areaM2: number, T: number): number {
  return emissivity * STEFAN_BOLTZMANN * areaM2 * Math.pow(T, 4);
}

/** Fraction of total emission falling in the visible band [380, 750] nm. */
export function visibleFraction(T: number): number {
  const total = totalExitanceNumeric(T);
  const vis = integrateExitance(T, 380e-9, 750e-9, 4000);
  return vis / total;
}

// ── Microwave heating: dielectric loss, NOT a water resonance (AC15 iii) ────
// The 2.45 GHz oven frequency is NOT a resonant peak of water. Liquid water's
// dielectric loss ε'' is a broad, MONOTONIC roll-off of the Debye relaxation tail
// across the GHz band (the relaxation peak sits ~20 GHz, and even that is a broad
// Debye shoulder, not a sharp Lorentzian). We model the absorption the honest way.

/**
 * MICROWAVE_DIELECTRIC_LOSS: dielectric-loss factor of liquid water vs frequency,
 * from a single-pole Debye relaxation (relaxation freq ~ fRelax). ε''(f) ∝
 * (f/fRelax) / (1 + (f/fRelax)²). Across the oven band (1–10 GHz) this is
 * monotonically INCREASING — there is NO in-band resonant peak. This is the
 * computed artifact AC15 demands (dielectric loss, not resonance).
 */
const DEBYE_MODE = "debye-dielectric-loss";
const LORENTZIAN_MODE = "lorentzian-resonance";
// Model-selector aliases. M14 flips the DEFAULT below from MICROWAVE_DIELECTRIC_LOSS
// (Debye loss, no in-band peak) to MICROWAVE_RESONANT_PEAK (a Lorentzian), which must
// trip the "no in-band resonant peak" test that backs the dielectric-loss panel.
const MICROWAVE_DIELECTRIC_LOSS = DEBYE_MODE;
const MICROWAVE_RESONANT_PEAK = LORENTZIAN_MODE;
const DEFAULT_MICROWAVE_MODEL = MICROWAVE_DIELECTRIC_LOSS;
void MICROWAVE_RESONANT_PEAK;
export function waterDielectricLoss(freqHz: number, mode: string = DEFAULT_MICROWAVE_MODEL): number {
  const fRelax = 20e9; // Debye relaxation frequency of liquid water (~20 GHz, 25°C)
  const r = freqHz / fRelax;
  if (mode === DEBYE_MODE) {
    // Debye loss: broad, no sharp in-band peak below ~20 GHz
    return r / (1 + r * r);
  }
  // Mutation control (M14): a sharp Lorentzian "resonance" centered at 2.45 GHz.
  const f0 = 2.45e9;
  const gamma = 0.05e9;
  const d = (freqHz - f0) / gamma;
  return 1 / (1 + d * d);
}

/**
 * Sample the water-absorption curve across the microwave band and report whether an
 * interior local maximum (a resonance peak) exists. Dielectric loss → monotonic →
 * no interior peak. A Lorentzian → interior peak.
 */
export function microwaveBandProfile(mode: string = DEFAULT_MICROWAVE_MODEL): {
  freqs: number[];
  loss: number[];
  hasInBandPeak: boolean;
  monotonic: boolean;
} {
  const freqs: number[] = [];
  const loss: number[] = [];
  const n = 60;
  const fLo = 1e9;
  const fHi = 10e9; // oven band neighborhood
  for (let i = 0; i < n; i++) {
    const f = fLo * Math.pow(fHi / fLo, i / (n - 1));
    freqs.push(f);
    loss.push(waterDielectricLoss(f, mode));
  }
  let hasInBandPeak = false;
  for (let i = 1; i < n - 1; i++) {
    if (loss[i] > loss[i - 1] && loss[i] > loss[i + 1]) hasInBandPeak = true;
  }
  let monotonic = true;
  for (let i = 1; i < n; i++) if (loss[i] < loss[i - 1] - 1e-12) monotonic = false;
  return { freqs, loss, hasInBandPeak, monotonic };
}

export interface ThermalPreset {
  id: string;
  label: string;
  T: number;
}
export const THERMAL_PRESETS: ThermalPreset[] = [
  { id: "room", label: "Room (293 K)", T: 293 },
  { id: "body", label: "Human body (310 K)", T: 310 },
  { id: "bulb", label: "Incandescent bulb (2700 K)", T: 2700 },
  { id: "sun", label: "Sun (5778 K)", T: 5778 },
];
