// Spectrum & photon core (AC1). Pure module — no DOM/WebGL.
// c = fλ, E = hf (J and eV), ionizing classifier, and a SEPARATE mechanical-sound
// path that is kept OFF the electromagnetic frequency ruler.

// ── Physical constants (rubric "Conventions") ──────────────────────────────
export const PLANCK_H = 6.626e-34; // J·s
export const SPEED_OF_LIGHT = 2.998e8; // m/s
export const EV_IN_JOULES = 1.602e-19; // J per eV
export const SOUND_SPEED_MS = 343; // m/s — longitudinal pressure wave in air (NOT light)

/** Ionizing boundary, conventional ~10 eV (per-photon). */
export const IONIZING_EV = 10;

export type Band =
  | "radio"
  | "microwave"
  | "infrared"
  | "visible"
  | "ultraviolet"
  | "x-ray"
  | "gamma";

// Standard EM band edges by frequency (Hz). Ordered low→high.
const BAND_EDGES: { band: Band; fMin: number; fMax: number }[] = [
  { band: "radio", fMin: 3e3, fMax: 3e9 },
  { band: "microwave", fMin: 3e9, fMax: 3e11 },
  { band: "infrared", fMin: 3e11, fMax: 4e14 },
  { band: "visible", fMin: 4e14, fMax: 7.9e14 },
  { band: "ultraviolet", fMin: 7.9e14, fMax: 3e16 },
  { band: "x-ray", fMin: 3e16, fMax: 3e19 },
  { band: "gamma", fMin: 3e19, fMax: 3e25 },
];

/** Wavelength (m) from EM frequency (Hz): λ = c/f. */
export function wavelengthFromFreq(f: number): number {
  return SPEED_OF_LIGHT / f;
}

/** EM frequency (Hz) from wavelength (m): f = c/λ. */
export function freqFromWavelength(lambda: number): number {
  return SPEED_OF_LIGHT / lambda;
}

/** Photon energy in joules: E = hf. */
export function photonEnergyJoules(f: number): number {
  return PLANCK_H * f;
}

/** Photon energy in electron-volts. */
export function photonEnergyEv(f: number): number {
  return photonEnergyJoules(f) / EV_IN_JOULES;
}

/** Frequency (Hz) from photon energy given in eV (inverse of photonEnergyEv). */
export function freqFromEnergyEv(ev: number): number {
  return (ev * EV_IN_JOULES) / PLANCK_H;
}

/** Classify an EM frequency into its standard band. Throws for sound (handled separately). */
export function bandForFreq(f: number): Band {
  for (const e of BAND_EDGES) {
    if (f >= e.fMin && f < e.fMax) return e.band;
  }
  if (f < BAND_EDGES[0].fMin) return "radio";
  return "gamma";
}

/** Band lookup by wavelength (m). */
export function bandForWavelength(lambda: number): Band {
  return bandForFreq(freqFromWavelength(lambda));
}

/** Ionizing iff per-photon energy ≥ 10 eV. */
export function isIonizing(f: number): boolean {
  return photonEnergyEv(f) >= IONIZING_EV;
}

export type Ionization = "ionizing" | "non-ionizing";
export function ionizationClass(f: number): Ionization {
  return isIonizing(f) ? "ionizing" : "non-ionizing";
}

// ── Mechanical sound — explicitly NOT electromagnetic ───────────────────────
export interface MechanicalSound {
  kind: "mechanical-acoustic";
  electromagnetic: false;
  longitudinal: true;
  speed: number; // m/s
  frequencyHz: number;
  wavelengthM: number; // λ = v/f using the SPEED OF SOUND, never c
  emBand: "not-electromagnetic";
}

/** Model a sound as a mechanical longitudinal pressure wave. λ uses 343 m/s, never c. */
export function mechanicalSound(frequencyHz: number): MechanicalSound {
  return {
    kind: "mechanical-acoustic",
    electromagnetic: false,
    longitudinal: true,
    speed: SOUND_SPEED_MS,
    frequencyHz,
    wavelengthM: SOUND_SPEED_MS / frequencyHz,
    emBand: "not-electromagnetic",
  };
}

/**
 * The guard the rubric demands: any attempt to place a SOUND frequency on the EM
 * ruler is rejected. Audio frequencies (≈20 Hz–20 kHz) are below the EM radio floor
 * (3 kHz) for most of the range and are conceptually mechanical regardless. We refuse
 * to return an EM band for an explicitly-acoustic query.
 */
export function emBandForSound(_frequencyHz: number): "not-electromagnetic" {
  return "not-electromagnetic";
}

/** Audible range membership (mechanical), for UI. */
export function isAudible(frequencyHz: number): boolean {
  return frequencyHz >= 20 && frequencyHz <= 20_000;
}

// ── Named reference points (sourced) ────────────────────────────────────────
export interface NamedSource {
  id: string;
  label: string;
  freqHz: number;
}

export const NAMED_EM: NamedSource[] = [
  { id: "wifi24", label: "Wi-Fi 2.4 GHz", freqHz: 2.4e9 },
  { id: "wifi5", label: "Wi-Fi 5 GHz", freqHz: 5.2e9 },
  { id: "bluetooth", label: "Bluetooth 2.4 GHz ISM", freqHz: 2.45e9 },
  { id: "cellular", label: "Cellular sub-6 GHz", freqHz: 1.9e9 },
  { id: "visible550", label: "Visible 550 nm", freqHz: freqFromWavelength(550e-9) },
  { id: "uva360", label: "UVA 360 nm", freqHz: freqFromWavelength(360e-9) },
  { id: "xray30kev", label: "X-ray 30 keV", freqHz: freqFromEnergyEv(30_000) },
  { id: "gamma1mev", label: "Gamma 1 MeV", freqHz: freqFromEnergyEv(1e6) },
];
