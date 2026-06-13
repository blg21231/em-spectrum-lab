// Scenarios core (AC11). Pure module — no DOM/WebGL.
// Cosmic-ray dose rising with altitude (room vs airplane), fuselage RF attenuation.

// Ground-level cosmic-ray dose rate (µSv/h), order-of-magnitude.
export const GROUND_DOSE_USV_H = 0.03; // ~0.03 µSv/h at sea level

// Saturating-exponential dose model fit to two anchors (sourced rules of thumb):
//   • ≈2× per 2000 m of climb near the ground (troposphere rule of thumb), and
//   • ≈10× the ground rate at 10 km cruise altitude.
// ln(mult) = DOSE_A · (1 − e^(−h/DOSE_TAU)); the low-altitude slope reproduces the
// doubling-per-2000m rule and the 10 km value lands at 10× ground.
export const DOSE_TAU = 11335; // m
export const DOSE_A = 3.9284;

/**
 * DOSE_ALTITUDE_SIGN: cosmic-ray dose rate vs altitude.
 * SIGN = +1 ⇒ dose INCREASES with altitude (correct). M10 flips it negative.
 */
export const DOSE_ALTITUDE_SIGN = 1;
export const DOSE_ALTITUDE_SIGN_NEGATIVE = -1; // mutation control (M10)

export function cosmicDoseRate(altitudeM: number): number {
  const sign = DOSE_ALTITUDE_SIGN;
  return GROUND_DOSE_USV_H * Math.exp(DOSE_A * (1 - Math.exp((-sign * altitudeM) / DOSE_TAU)));
}

/** Dose multiple relative to ground at a given altitude. */
export function doseMultiple(altitudeM: number): number {
  return cosmicDoseRate(altitudeM) / GROUND_DOSE_USV_H;
}

export interface Scenario {
  id: string;
  label: string;
  altitudeM: number;
  /** External cellular signal indicator after enclosure attenuation (0..1). */
  cellularIndicator: number;
  cosmicIndicator: number; // dose multiple vs ground
}

// Fuselage attenuation of external cellular RF (a partial Faraday enclosure).
export const FUSELAGE_CELLULAR_ATTENUATION = 0.25; // ~25% of external signal gets in

export function buildScenario(id: string): Scenario {
  if (id === "airplane") {
    const altitudeM = 10_000;
    return {
      id,
      label: "Airplane at cruise (~10 km)",
      altitudeM,
      cellularIndicator: FUSELAGE_CELLULAR_ATTENUATION,
      cosmicIndicator: doseMultiple(altitudeM),
    };
  }
  if (id === "street") {
    return { id, label: "City street", altitudeM: 0, cellularIndicator: 1.0, cosmicIndicator: doseMultiple(0) };
  }
  return { id: "room", label: "Your room (ground)", altitudeM: 0, cellularIndicator: 1.0, cosmicIndicator: doseMultiple(0) };
}

export const SCENARIOS = ["room", "airplane", "street"] as const;
