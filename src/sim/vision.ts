// Vision core (AC8). Pure module — no DOM/WebGL.
// The three cone fundamentals (S/M/L) as broad overlapping spectral filters that
// integrate a spectral power distribution into three numbers → a color; metamerism.

// Cone sensitivity peak wavelengths (nm). The M-cone peak is the M7 mutation target.
export const S_CONE_PEAK = 420;
export const M_CONE_PEAK = 534; // M7 shifts this to 600 nm (far off green)
export const L_CONE_PEAK = 564;

// Gaussian-on-log-wavelength widths (nm-ish) approximating the broad cone curves.
const S_WIDTH = 30;
const M_WIDTH = 45;
const L_WIDTH = 50;

/** A single cone's spectral sensitivity (Gaussian model), normalized to peak 1. */
function coneSensitivity(lambdaNm: number, peakNm: number, width: number): number {
  const d = (lambdaNm - peakNm) / width;
  return Math.exp(-0.5 * d * d);
}

export function sSensitivity(lambdaNm: number): number {
  return coneSensitivity(lambdaNm, S_CONE_PEAK, S_WIDTH);
}
export function mSensitivity(lambdaNm: number, peak = M_CONE_PEAK): number {
  return coneSensitivity(lambdaNm, peak, M_WIDTH);
}
export function lSensitivity(lambdaNm: number): number {
  return coneSensitivity(lambdaNm, L_CONE_PEAK, L_WIDTH);
}

export interface SpdSample {
  lambdaNm: number;
  power: number;
}

export interface ConeResponse {
  S: number;
  M: number;
  L: number;
}

/** Integrate an SPD against the three cone fundamentals → (S, M, L) responses. */
export function coneResponse(spd: SpdSample[], mPeak = M_CONE_PEAK): ConeResponse {
  let S = 0;
  let M = 0;
  let L = 0;
  for (const { lambdaNm, power } of spd) {
    S += power * sSensitivity(lambdaNm);
    M += power * mSensitivity(lambdaNm, mPeak);
    L += power * lSensitivity(lambdaNm);
  }
  return { S, M, L };
}

/** Chromaticity (x, y) from cone responses via a simple normalization. */
export function chromaticity(r: ConeResponse): { x: number; y: number } {
  const sum = r.S + r.M + r.L;
  if (sum <= 0) return { x: 0, y: 0 };
  // map (L, M) onto a chromaticity-like plane: x≈long-dominance, y≈mid-dominance
  return { x: r.L / sum, y: r.M / sum };
}

/** Monochromatic SPD: a single spectral line at lambda. */
export function monochromatic(lambdaNm: number, power = 1): SpdSample[] {
  return [{ lambdaNm, power }];
}

/** Equal-energy white: flat SPD across the visible band. */
export function equalEnergyWhite(): SpdSample[] {
  const out: SpdSample[] = [];
  for (let l = 400; l <= 700; l += 5) out.push({ lambdaNm: l, power: 1 });
  return out;
}

/** A Gaussian "bump" SPD around centerNm with the given sigma. */
export function gaussianSpd(centerNm: number, sigmaNm: number, power = 1): SpdSample[] {
  const out: SpdSample[] = [];
  for (let l = 400; l <= 700; l += 5) {
    const d = (l - centerNm) / sigmaNm;
    out.push({ lambdaNm: l, power: power * Math.exp(-0.5 * d * d) });
  }
  return out;
}

/** Convert a cone response to a displayable sRGB-ish triple [0..255]. */
export function coneToRgb(r: ConeResponse): [number, number, number] {
  const max = Math.max(r.S, r.M, r.L, 1e-9);
  // crude but stable mapping: L→red, M→green, S→blue
  const red = Math.round(255 * (r.L / max));
  const green = Math.round(255 * (r.M / max));
  const blue = Math.round(255 * (r.S / max));
  return [red, green, blue];
}

/**
 * Find a metamer: a second SPD (a 3-line mixture) whose cone response matches a target
 * SPD's response to within `tol` relative. Returns the matched SPD and the responses.
 */
export function findMetamer(target: SpdSample[]): { spd: SpdSample[]; a: ConeResponse; b: ConeResponse; relError: number } {
  const a = coneResponse(target);
  // build a 3-primary metamer (S/M/L peaks) and solve weights so responses match.
  // responses are linear in weights → solve the 3×3 system.
  const primaries = [S_CONE_PEAK, M_CONE_PEAK, L_CONE_PEAK];
  // matrix Aij = response_i of primary_j
  const Amat: number[][] = [];
  for (const peak of primaries) {
    const resp = coneResponse([{ lambdaNm: peak, power: 1 }]);
    Amat.push([resp.S, resp.M, resp.L]);
  }
  // We want w · Amat = [a.S, a.M, a.L]; solve Amatᵀ w = a
  const At = [
    [Amat[0][0], Amat[1][0], Amat[2][0]],
    [Amat[0][1], Amat[1][1], Amat[2][1]],
    [Amat[0][2], Amat[1][2], Amat[2][2]],
  ];
  const w = solve3(At, [a.S, a.M, a.L]);
  const spd: SpdSample[] = primaries.map((p, i) => ({ lambdaNm: p, power: Math.max(0, w[i]) }));
  const b = coneResponse(spd);
  const relError = Math.max(
    Math.abs(a.S - b.S) / (a.S || 1),
    Math.abs(a.M - b.M) / (a.M || 1),
    Math.abs(a.L - b.L) / (a.L || 1),
  );
  return { spd, a, b, relError };
}

/** Solve a 3×3 linear system by Cramer's rule. */
function solve3(A: number[][], rhs: number[]): number[] {
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(A);
  const col = (k: number) => A.map((row, i) => row.map((v, j) => (j === k ? rhs[i] : v)));
  return [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D];
}
