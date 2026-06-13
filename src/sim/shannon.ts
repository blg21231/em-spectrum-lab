// SNR & Shannon capacity core (AC6). Pure module — no DOM/WebGL.
// Thermal noise floor (kTB) and the Shannon–Hartley capacity C = B·log2(1 + S/N).

export const BOLTZMANN_K = 1.381e-23; // J/K

/** Thermal noise power in watts: N = kTB. */
export function noisePowerW(T: number, B: number): number {
  return BOLTZMANN_K * T * B;
}

/** Convert watts to dBm. */
export function wattsToDbm(w: number): number {
  return 10 * Math.log10(w / 1e-3);
}

/** Thermal noise floor in dBm for bandwidth B at temperature T. */
export function noiseFloorDbm(T: number, B: number): number {
  return wattsToDbm(noisePowerW(T, B));
}

/** kTB noise spectral density in dBm/Hz (≈ −174 at 290 K). */
export function noiseDensityDbmPerHz(T: number): number {
  return wattsToDbm(BOLTZMANN_K * T);
}

/**
 * Shannon–Hartley capacity (bits/s): C = B·log2(1 + S/N).
 * `snr` is the LINEAR signal-to-noise ratio.
 */
export function capacity(B: number, snr: number): number {
  return B * Math.log2(1 + snr);
}

/** Capacity from S/N in dB. */
export function capacityFromSnrDb(B: number, snrDb: number): number {
  return capacity(B, Math.pow(10, snrDb / 10));
}

/** Linear ratio → dB. */
export function toDb(ratio: number): number {
  return 10 * Math.log10(ratio);
}

/** dB → linear ratio. */
export function fromDb(db: number): number {
  return Math.pow(10, db / 10);
}
