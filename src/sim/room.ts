// Room model core (AC12, M15). Pure module — no DOM/WebGL.
// Assembles per-source EM spectra and SUMS them — true superposition: the analyzer
// of (A+B) equals analyzer(A)+analyzer(B). The 3D renderer consumes this; never the reverse.

import { freqFromWavelength } from "./spectrum";

export interface RoomSource {
  id: string;
  label: string;
  /** Center frequency (Hz). */
  centerHz: number;
  /** Band half-width (Hz) for the deposited bump. */
  widthHz: number;
  /** Relative emitted power (order-of-magnitude, arbitrary units). */
  power: number;
  /** Whether this source emits a warm body's thermal IR (for the thermal view). */
  thermal?: boolean;
  enabled: boolean;
}

// Real-world room sources at their real bands.
export function defaultSources(): RoomSource[] {
  return [
    { id: "wifi", label: "Wi-Fi router 2.4 GHz", centerHz: 2.442e9, widthHz: 0.04e9, power: 0.1, enabled: true },
    { id: "bluetooth", label: "Bluetooth 2.4 GHz", centerHz: 2.45e9, widthHz: 0.04e9, power: 0.0025, enabled: true },
    { id: "cellular", label: "Cellular 1.9 GHz", centerHz: 1.9e9, widthHz: 0.06e9, power: 0.2, enabled: true },
    { id: "light", label: "Ceiling light (visible)", centerHz: freqFromWavelength(550e-9), widthHz: 8e13, power: 10, enabled: true },
    { id: "body", label: "Warm body (thermal IR ~10 µm)", centerHz: freqFromWavelength(10e-6), widthHz: 1.2e13, power: 100, thermal: true, enabled: true },
    { id: "sun", label: "Sunlight through window", centerHz: freqFromWavelength(500e-9), widthHz: 1.5e14, power: 50, enabled: true },
  ];
}

/**
 * The analyzer is a LOG-frequency grid spanning radio→visible. Each source deposits a
 * Gaussian bump in its band. Frequencies are placed on a log axis (decades).
 */
export const ANALYZER_BINS = 256;
export const LOG_F_MIN = 9; // 1e9 Hz (radio/microwave)
export const LOG_F_MAX = 15; // 1e15 Hz (visible/UV)

function binCenterLogF(bin: number): number {
  return LOG_F_MIN + ((LOG_F_MAX - LOG_F_MIN) * bin) / (ANALYZER_BINS - 1);
}

/** Spectrum (power per bin) contributed by a single source on the log-frequency analyzer. */
export function sourceSpectrum(src: RoomSource): number[] {
  const out = new Array(ANALYZER_BINS).fill(0);
  if (!src.enabled) return out;
  const logCenter = Math.log10(src.centerHz);
  const logWidth = Math.max(0.03, Math.log10(1 + src.widthHz / src.centerHz) + 0.05);
  for (let b = 0; b < ANALYZER_BINS; b++) {
    const lf = binCenterLogF(b);
    const d = (lf - logCenter) / logWidth;
    out[b] = src.power * Math.exp(-0.5 * d * d);
  }
  return out;
}

/**
 * The superposed analyzer trace: SUM of each enabled source's spectrum.
 * ROOM_SUPERPOSE_SUM — linear superposition, so analyzer(A+B)=analyzer(A)+analyzer(B).
 * M15 swaps the combiner to max() (ROOM_SUPERPOSE_MAX), which breaks superposition.
 */
const COMBINE_SUM = "sum";
const COMBINE_MAX = "max";
const ROOM_SUPERPOSE_SUM = COMBINE_SUM;
const ROOM_SUPERPOSE_MAX = COMBINE_MAX;
void ROOM_SUPERPOSE_MAX;
export function analyzer(sources: RoomSource[], combine: string = ROOM_SUPERPOSE_SUM): number[] {
  const out = new Array(ANALYZER_BINS).fill(0);
  for (const s of sources) {
    const spec = sourceSpectrum(s);
    for (let b = 0; b < ANALYZER_BINS; b++) {
      if (combine === COMBINE_SUM) {
        out[b] = out[b] + spec[b]; // linear superposition
      } else {
        out[b] = Math.max(out[b], spec[b]); // NOT superposition
      }
    }
  }
  return out;
}

/** Total power in a frequency band [fLo, fHi] (Hz) of the analyzer trace. */
export function bandPower(trace: number[], fLo: number, fHi: number): number {
  const lLo = Math.log10(fLo);
  const lHi = Math.log10(fHi);
  let sum = 0;
  for (let b = 0; b < ANALYZER_BINS; b++) {
    const lf = binCenterLogF(b);
    if (lf >= lLo && lf <= lHi) sum += trace[b];
  }
  return sum;
}

export type PerceptionView = "eye" | "radio" | "thermal";

/** How bright a source appears in a given perception view (0..1-ish). */
export function perceivedBrightness(src: RoomSource, view: PerceptionView): number {
  const f = src.centerHz;
  if (view === "eye") {
    // visible band only
    return f >= 4e14 && f <= 7.9e14 ? Math.min(1, src.power / 50) : 0;
  }
  if (view === "radio") {
    return f >= 3e8 && f <= 3e11 ? Math.min(1, src.power / 0.2) : 0;
  }
  // thermal: IR sources (warm bodies) glow
  return src.thermal || (f >= 3e12 && f <= 4e14) ? Math.min(1, src.power / 100) : 0;
}
