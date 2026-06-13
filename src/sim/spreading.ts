// Matched-filter / spreading core (AC7) — "the magic". Pure module — no DOM/WebGL.
// Direct-sequence spread BPSK pulled out from BELOW the noise floor by correlating
// against its pseudo-random code, with processing gain = 10·log10(N).

/** Processing gain in dB for spreading factor (chips/bit) N: PG = 10·log10(N). */
export function processingGainDb(N: number): number {
  return 10 * Math.log10(N);
}

/** Deterministic LCG so tests are reproducible. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Box–Muller standard normal from a uniform RNG. */
function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Generate a ±1 PN code (maximal-length-style) of length N from a seed. */
export function pnCode(N: number, seed = 12345): Int8Array {
  const rng = lcg(seed);
  const code = new Int8Array(N);
  for (let i = 0; i < N; i++) code[i] = rng() < 0.5 ? -1 : 1;
  return code;
}

export interface DsssResult {
  despreadBer: number;
  controlBer: number;
  despreadPeakSnrDb: number;
  rawSnrDb: number;
  processingGainDb: number;
}

/**
 * Simulate a DSSS-BPSK link. bits transmitted at chip-level raw SNR `rawSnrDb` (negative ⇒
 * signal below noise). Despreading correlates the received chips against the code
 * (DESPREAD_CORRELATE); the undespread control integrates the chips WITHOUT the code.
 *
 * Returns despread BER (must be <1% at −15 dB), control BER (~50%, at chance), and the
 * despread peak SNR gain.
 */
export function simulateDsss(
  nBits: number,
  N: number,
  rawSnrDb: number,
  seed = 2024,
  mode: string = "DESPREAD_CORRELATE",
): DsssResult {
  const code = pnCode(N, seed + 7);
  const rng = lcg(seed);
  // chip-level signal amplitude=1; noise std from rawSnr per chip
  const snrLin = Math.pow(10, rawSnrDb / 10);
  const noiseStd = Math.sqrt(1 / snrLin); // signal power 1 per chip
  let despreadErrors = 0;
  let controlErrors = 0;
  let sumPeak = 0;
  let sumNoiseVar = 0;
  for (let b = 0; b < nBits; b++) {
    const bit = rng() < 0.5 ? -1 : 1;
    // spread: each chip = bit × code[c]; add noise
    let corr = 0; // despread accumulator (matched filter)
    let plain = 0; // control accumulator (no code)
    for (let c = 0; c < N; c++) {
      const chip = bit * code[c];
      const rx = chip + noiseStd * gaussian(rng);
      if (mode === "DESPREAD_CORRELATE") {
        corr += rx * code[c]; // multiply by the known code → signal coheres
      } else {
        corr += rx; // DESPREAD_PASSTHROUGH: skip the code multiply (M6)
      }
      plain += rx; // control: never applies the code
    }
    const despreadDecision = corr >= 0 ? 1 : -1;
    const controlDecision = plain >= 0 ? 1 : -1;
    if (despreadDecision !== bit) despreadErrors++;
    if (controlDecision !== bit) controlErrors++;
    // peak SNR bookkeeping: despread signal amplitude is ±N, noise variance N·noiseStd²
    sumPeak += Math.abs(corr);
    sumNoiseVar += N * noiseStd * noiseStd;
  }
  const despreadBer = despreadErrors / nBits;
  const controlBer = controlErrors / nBits;
  const meanPeak = sumPeak / nBits;
  const meanNoiseStd = Math.sqrt(sumNoiseVar / nBits);
  const despreadPeakSnrDb = 20 * Math.log10(meanPeak / meanNoiseStd);
  return {
    despreadBer,
    controlBer,
    despreadPeakSnrDb,
    rawSnrDb,
    processingGainDb: processingGainDb(N),
  };
}

/**
 * Produce time-series for rendering: the buried-in-noise received signal and the
 * despread correlation trace (a clean peak per bit). Deterministic.
 */
export function dsssTrace(nBits: number, N: number, rawSnrDb: number, seed = 99): { rx: number[]; correlation: number[] } {
  const code = pnCode(N, seed + 7);
  const rng = lcg(seed);
  const snrLin = Math.pow(10, rawSnrDb / 10);
  const noiseStd = Math.sqrt(1 / snrLin);
  const rx: number[] = [];
  const correlation: number[] = [];
  for (let b = 0; b < nBits; b++) {
    const bit = rng() < 0.5 ? -1 : 1;
    let corr = 0;
    for (let c = 0; c < N; c++) {
      const chip = bit * code[c];
      const r = chip + noiseStd * gaussian(rng);
      rx.push(r);
      corr += r * code[c];
    }
    correlation.push(corr / N);
  }
  return { rx, correlation };
}
