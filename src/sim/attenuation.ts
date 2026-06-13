// Attenuation / shielding core (AC10). Pure module — no DOM/WebGL.
// Conductor skin depth, Beer–Lambert, X-ray half-value layer, atmospheric windows.

export const MU0 = 4 * Math.PI * 1e-7; // H/m, permeability of free space

export interface Conductor {
  id: string;
  label: string;
  sigma: number; // conductivity S/m
  muR: number; // relative permeability
}
export const CONDUCTORS: Conductor[] = [
  { id: "copper", label: "Copper", sigma: 5.96e7, muR: 1 },
  { id: "aluminum", label: "Aluminum", sigma: 3.77e7, muR: 1 },
  { id: "iron", label: "Iron", sigma: 1.0e7, muR: 1000 },
];

/**
 * SKIN_DEPTH_FORMULA: conductor skin depth δ = 1/√(π·f·µ·σ) (m).
 * δ DECREASES with increasing frequency. (Cu @ 1 GHz ≈ 2.06 µm.)
 */
export function skinDepth(freqHz: number, sigma: number, muR = 1): number {
  const mu = muR * MU0;
  // SKIN_DEPTH_FORMULA (M9 inverts the f-dependence): δ = 1/√(πfµσ)
  return 1 / Math.sqrt(Math.PI * freqHz * mu * sigma);
}

/** Field attenuation factor through thickness x of a conductor: e^(−x/δ). */
export function conductorAttenuation(x: number, freqHz: number, sigma: number, muR = 1): number {
  return Math.exp(-x / skinDepth(freqHz, sigma, muR));
}

/** Beer–Lambert intensity transmission: I/I0 = e^(−µx). */
export function beerLambert(mu: number, x: number): number {
  return Math.exp(-mu * x);
}

/** Half-value layer thickness: x where transmission = 0.5, x = ln2/µ. */
export function halfValueLayer(mu: number): number {
  return Math.LN2 / mu;
}

/** Linear attenuation coefficient from a half-value layer thickness. */
export function muFromHvl(hvl: number): number {
  return Math.LN2 / hvl;
}

// X-ray attenuation presets for lead (linear attenuation coefficient µ, 1/cm).
export interface ShieldPreset {
  id: string;
  label: string;
  mu: number; // 1/cm
}
export const LEAD_PRESETS: ShieldPreset[] = [
  { id: "lead-100kev", label: "Lead @ 100 keV", mu: 59.9 }, // 1/cm
  { id: "lead-500kev", label: "Lead @ 500 keV", mu: 1.7 },
  { id: "lead-1mev", label: "Lead @ 1 MeV", mu: 0.8 },
];

// ── Atmospheric windows ─────────────────────────────────────────────────────
export type WindowClass = "transparent" | "absorbed" | "partial";
export interface AtmosphericWindow {
  band: string;
  classification: WindowClass;
  note: string;
}
export const ATMOSPHERIC_WINDOWS: AtmosphericWindow[] = [
  { band: "radio", classification: "transparent", note: "Radio window (~10 MHz–30 GHz) passes; ionosphere reflects below." },
  { band: "microwave", classification: "partial", note: "Mostly transparent with water-vapor/O₂ absorption lines." },
  { band: "infrared", classification: "partial", note: "Several narrow windows; CO₂/H₂O absorb much of the mid-IR." },
  { band: "visible", classification: "transparent", note: "The optical window (~300–1100 nm) — why we see the sky." },
  { band: "ultraviolet", classification: "absorbed", note: "Ozone absorbs UV-B/UV-C." },
  { band: "x-ray", classification: "absorbed", note: "Absorbed high in the atmosphere (why X-ray astronomy is space-based)." },
  { band: "gamma", classification: "absorbed", note: "Absorbed by the atmosphere." },
];

export function windowFor(band: string): AtmosphericWindow | undefined {
  return ATMOSPHERIC_WINDOWS.find((w) => w.band === band);
}
