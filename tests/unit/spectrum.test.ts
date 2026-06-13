import { describe, expect, it } from "vitest";
import {
  bandForFreq,
  emBandForSound,
  freqFromEnergyEv,
  freqFromWavelength,
  ionizationClass,
  isIonizing,
  mechanicalSound,
  photonEnergyEv,
  photonEnergyJoules,
  PLANCK_H,
  SOUND_SPEED_MS,
  SPEED_OF_LIGHT,
  wavelengthFromFreq,
} from "../../src/sim/spectrum";

describe("Spectrum & photon core (AC1)", () => {
  it("(a) c = fλ and E = hf round-trip to ≤1e-9 over 1e3–1e25 Hz (1000 cases, both directions)", () => {
    let maxRel = 0;
    for (let i = 0; i < 1000; i++) {
      const logF = 3 + Math.random() * 22; // 1e3 .. 1e25
      const f = Math.pow(10, logF);
      // f → λ → f
      const lambda = wavelengthFromFreq(f);
      const fBack = freqFromWavelength(lambda);
      maxRel = Math.max(maxRel, Math.abs(fBack - f) / f);
      // λ = c/f exactness
      expect(Math.abs(lambda - SPEED_OF_LIGHT / f) / lambda).toBeLessThanOrEqual(1e-12);
      // E = hf in J and eV; invert eV → f
      const ev = photonEnergyEv(f);
      const fFromEv = freqFromEnergyEv(ev);
      maxRel = Math.max(maxRel, Math.abs(fFromEv - f) / f);
      expect(Math.abs(photonEnergyJoules(f) - PLANCK_H * f) / (PLANCK_H * f)).toBeLessThanOrEqual(1e-12);
    }
    expect(maxRel).toBeLessThanOrEqual(1e-9);
  });

  it("(b) ionizing classifier: boundary at exactly 10 eV", () => {
    const f10 = freqFromEnergyEv(10);
    expect(isIonizing(f10)).toBe(true); // ≥10 eV ionizing
    expect(isIonizing(freqFromEnergyEv(9.999))).toBe(false);
    expect(isIonizing(freqFromEnergyEv(10.001))).toBe(true);
  });

  it("(b) named bands classify correctly", () => {
    // non-ionizing: Wi-Fi 2.4 GHz, visible 550 nm, UVA 360 nm
    expect(ionizationClass(2.4e9)).toBe("non-ionizing");
    expect(ionizationClass(freqFromWavelength(550e-9))).toBe("non-ionizing");
    expect(ionizationClass(freqFromWavelength(360e-9))).toBe("non-ionizing");
    // ionizing: 30 keV X-ray, 1 MeV gamma
    expect(ionizationClass(freqFromEnergyEv(30_000))).toBe("ionizing");
    expect(ionizationClass(freqFromEnergyEv(1e6))).toBe("ionizing");
    // band labels
    expect(bandForFreq(2.4e9)).toBe("radio");
    expect(bandForFreq(freqFromWavelength(550e-9))).toBe("visible");
    expect(bandForFreq(freqFromWavelength(360e-9))).toBe("ultraviolet");
    expect(bandForFreq(freqFromEnergyEv(30_000))).toBe("x-ray");
    expect(bandForFreq(freqFromEnergyEv(1e6))).toBe("gamma");
  });

  it("(c) photon energies: 10 eV boundary ≈ 124 nm", () => {
    const f = freqFromEnergyEv(10);
    const lambda = wavelengthFromFreq(f);
    expect(Math.abs(lambda * 1e9 - 124) / 124).toBeLessThanOrEqual(0.02);
  });

  it("(d) sound is mechanical, longitudinal, 343 m/s, and NEVER an EM band", () => {
    const s = mechanicalSound(1000);
    expect(s.electromagnetic).toBe(false);
    expect(s.longitudinal).toBe(true);
    expect(s.speed).toBe(343);
    expect(s.speed).toBe(SOUND_SPEED_MS);
    expect(s.speed).not.toBe(SPEED_OF_LIGHT);
    // wavelength uses sound speed, not c
    expect(Math.abs(s.wavelengthM - 343 / 1000)).toBeLessThanOrEqual(1e-9);
    expect(s.emBand).toBe("not-electromagnetic");
    // the EM-band lookup for a sound frequency is rejected/flagged
    expect(emBandForSound(1000)).toBe("not-electromagnetic");
    expect(emBandForSound(20)).toBe("not-electromagnetic");
    expect(emBandForSound(20000)).toBe("not-electromagnetic");
  });
});
