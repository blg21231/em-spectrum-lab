import type { GraphEdge, GraphNode } from "./types";

// The synthesis concept graph (AC14): ≥24 nodes, ≥36 typed edges, every edge with a
// ≥40-char justification, every node referenced by questions.json resolving here.

export const NODES: GraphNode[] = [
  // foundations
  { id: "linearity", label: "Linearity (Maxwell)", module: "fourier", tag: "established" },
  { id: "superposition", label: "Superposition", module: "fourier", tag: "established" },
  { id: "fourier-decomposition", label: "Fourier decomposition", module: "fourier", tag: "established" },
  { id: "channel-separation", label: "Channel separation", module: "resonance", tag: "established" },
  { id: "electromagnetic-wave", label: "Electromagnetic wave", module: "spectrum", tag: "established" },
  { id: "sound-wave", label: "Sound (mechanical wave)", module: "hearing", tag: "established" },
  { id: "spectrum-vastness", label: "Vast frequency space", module: "spectrum", tag: "established" },
  { id: "photon-energy", label: "Photon energy E=hf", module: "spectrum", tag: "established" },
  { id: "ionizing-threshold", label: "Ionizing threshold", module: "spectrum", tag: "established" },
  { id: "non-ionizing", label: "Non-ionizing radiation", module: "spectrum", tag: "misconception-corrected" },
  // receivers / selectivity
  { id: "resonance", label: "Resonance / tuning", module: "resonance", tag: "model-simplification" },
  { id: "selective-reception", label: "Selective reception", module: "resonance", tag: "established" },
  { id: "orthogonality", label: "Orthogonality", module: "resonance", tag: "established" },
  { id: "ofdm", label: "OFDM", module: "resonance", tag: "engineering-convention" },
  { id: "modulation", label: "Modulation", module: "modulation", tag: "established" },
  { id: "bandwidth", label: "Bandwidth", module: "modulation", tag: "established" },
  // information theory
  { id: "noise-floor", label: "Thermal noise floor kTB", module: "shannon", tag: "established" },
  { id: "shannon-capacity", label: "Shannon capacity", module: "shannon", tag: "established" },
  { id: "spreading-code", label: "Spreading code", module: "spreading", tag: "established" },
  { id: "below-noise-recovery", label: "Below-noise recovery", module: "spreading", tag: "established" },
  { id: "processing-gain", label: "Processing gain", module: "spreading", tag: "established" },
  // biology
  { id: "cone-trichromacy", label: "Cone trichromacy", module: "vision", tag: "model-simplification" },
  { id: "color-vision", label: "Color vision", module: "vision", tag: "established" },
  { id: "metamerism", label: "Metamerism", module: "vision", tag: "established" },
  { id: "cochlear-tonotopy", label: "Cochlear tonotopy", module: "hearing", tag: "established" },
  { id: "pitch-perception", label: "Pitch perception", module: "hearing", tag: "established" },
  // thermal
  { id: "thermal-radiation", label: "Thermal radiation (Planck)", module: "thermal", tag: "established" },
  { id: "convection", label: "Convection (\"thermal air\")", module: "thermal", tag: "misconception-corrected" },
  { id: "dielectric-heating", label: "Dielectric heating", module: "thermal", tag: "established" },
  { id: "microwave-resonance-myth", label: "Microwave water-resonance myth", module: "thermal", tag: "misconception-corrected" },
  // shielding / scenarios
  { id: "skin-depth", label: "Skin depth", module: "attenuation", tag: "established" },
  { id: "faraday-shielding", label: "Faraday shielding", module: "attenuation", tag: "established" },
  { id: "atmospheric-windows", label: "Atmospheric windows", module: "attenuation", tag: "established" },
  { id: "cosmic-dose", label: "Cosmic-ray dose", module: "scenario", tag: "order-of-magnitude" },
  { id: "altitude", label: "Altitude", module: "scenario", tag: "established" },
  { id: "room-superposition", label: "Room superposition", module: "room", tag: "established" },
];

export const EDGES: GraphEdge[] = [
  // ── the 14 pinned edges (AC14) ──────────────────────────────────────────
  { from: "linearity", to: "superposition", type: "enables", tag: "established", justification: "Maxwell's equations are linear at everyday field strengths, so independent wave solutions add — that additivity IS superposition." },
  { from: "superposition", to: "fourier-decomposition", type: "enables", tag: "established", justification: "Because waves add linearly, any composite is a sum of sinusoids and the Fourier transform recovers each component losslessly." },
  { from: "fourier-decomposition", to: "channel-separation", type: "enables", tag: "established", justification: "Decomposing the superposed spectrum into its frequency components is exactly what lets each channel be pulled out separately." },
  { from: "resonance", to: "selective-reception", type: "enables", tag: "established", justification: "A resonant circuit passes its own band and suppresses neighbours by 20 dB or more, so a receiver selects only its own signal." },
  { from: "orthogonality", to: "ofdm", type: "enables", tag: "established", justification: "Spacing subcarriers by exactly 1/T makes them mutually orthogonal, which is the mathematical basis that lets OFDM overlap them." },
  { from: "noise-floor", to: "shannon-capacity", type: "requires", tag: "established", justification: "The thermal noise floor kTB sets the N in the signal-to-noise ratio, so capacity C=B·log2(1+S/N) is defined relative to it." },
  { from: "spreading-code", to: "below-noise-recovery", type: "enables", tag: "established", justification: "Correlating against the known pseudo-random code coheres the signal while noise averages away, recovering it from below the noise floor." },
  { from: "cone-trichromacy", to: "color-vision", type: "enables", tag: "established", justification: "Three broad overlapping cone filters integrate any spectrum into three numbers, and those three responses are perceived as color." },
  { from: "cochlear-tonotopy", to: "pitch-perception", type: "enables", tag: "established", justification: "Each place on the basilar membrane resonates at its own frequency, so the spatial excitation pattern is read out as pitch." },
  { from: "sound-wave", to: "electromagnetic-wave", type: "contrasts", tag: "established", justification: "Sound is a longitudinal mechanical pressure wave at ~343 m/s needing a medium; an EM wave is transverse, at c, in vacuum — different physics." },
  { from: "photon-energy", to: "ionizing-threshold", type: "causes", tag: "established", justification: "Because each photon carries E=hf, only frequencies above ~10 eV per photon can ionize — photon energy sets the ionizing threshold." },
  { from: "skin-depth", to: "faraday-shielding", type: "enables", tag: "established", justification: "Fields decay over the skin depth in a conductor, so a few skin depths of metal attenuate RF and form a Faraday cage." },
  { from: "convection", to: "thermal-radiation", type: "corrects-misconception", tag: "misconception-corrected", justification: "'Thermal air' is convection — moving warm molecules — which is mechanical bulk transport, NOT the Planck infrared photons of thermal radiation." },
  { from: "dielectric-heating", to: "microwave-resonance-myth", type: "corrects-misconception", tag: "misconception-corrected", justification: "A microwave oven heats by dielectric loss (broad Debye absorption), not by resonating with a fictitious water resonant frequency at 2.45 GHz." },

  // ── supporting edges ──────────────────────────────────────────────────────
  { from: "electromagnetic-wave", to: "spectrum-vastness", type: "enables", tag: "established", justification: "EM waves span ~22 decades of frequency from power lines to gamma rays, giving the enormous frequency space services divide up." },
  { from: "spectrum-vastness", to: "channel-separation", type: "enables", tag: "established", justification: "With twenty-plus decades available, different services occupy mostly non-overlapping slices, which makes separating them tractable." },
  { from: "photon-energy", to: "non-ionizing", type: "causes", tag: "established", justification: "Radio through most UV carry far less than 10 eV per photon, so by E=hf they physically cannot ionize regardless of power." },
  { from: "selective-reception", to: "channel-separation", type: "enables", tag: "established", justification: "A receiver that passes only its own band is the practical mechanism by which the many overlapping channels are separated in hardware." },
  { from: "ofdm", to: "channel-separation", type: "enables", tag: "established", justification: "Orthogonal subcarriers can overlap in frequency yet still be separated at the receiver, packing many channels into a crowded band." },
  { from: "modulation", to: "bandwidth", type: "causes", tag: "established", justification: "Imprinting a message on a carrier spreads it over a finite bandwidth set by the message rate and deviation (Carson's rule)." },
  { from: "modulation", to: "channel-separation", type: "requires", tag: "established", justification: "Each modulated signal must fit inside its allotted bandwidth so that frequency-division keeps channels from colliding." },
  { from: "bandwidth", to: "shannon-capacity", type: "causes", tag: "established", justification: "Capacity grows linearly with bandwidth in C=B·log2(1+S/N), so the occupied bandwidth directly bounds the achievable rate." },
  { from: "spreading-code", to: "processing-gain", type: "causes", tag: "established", justification: "A spreading factor of N chips per bit yields a processing gain of 10·log10(N) dB when the receiver despreads by correlation." },
  { from: "processing-gain", to: "below-noise-recovery", type: "enables", tag: "established", justification: "The processing gain raises the post-despread SNR by 10·log10(N), which is what lifts a sub-noise signal above the detection threshold." },
  { from: "shannon-capacity", to: "below-noise-recovery", type: "contrasts", tag: "established", justification: "Shannon caps error-free rate even at low SNR; spreading does not beat Shannon, it trades bandwidth to operate below the noise floor." },
  { from: "cone-trichromacy", to: "metamerism", type: "causes", tag: "established", justification: "Reducing any spectrum to just three cone responses means distinct spectra with equal responses look identical — metamerism." },
  { from: "fourier-decomposition", to: "cochlear-tonotopy", type: "enables", tag: "established", justification: "The cochlea performs a biological Fourier transform, mapping each frequency to a place — tonotopy is decomposition in hardware." },
  { from: "thermal-radiation", to: "electromagnetic-wave", type: "enables", tag: "established", justification: "Planck thermal radiation IS electromagnetic — infrared photons emitted by warm bodies, part of the same spectrum as light and radio." },
  { from: "thermal-radiation", to: "spectrum-vastness", type: "enables", tag: "established", justification: "A blackbody emits across a broad band whose peak shifts with temperature (Wien), populating much of the IR-visible spectrum." },
  { from: "atmospheric-windows", to: "electromagnetic-wave", type: "contrasts", tag: "established", justification: "The atmosphere passes visible and radio but blocks UV/X-ray/gamma, so which EM band a wave occupies decides if it reaches the ground." },
  { from: "altitude", to: "cosmic-dose", type: "causes", tag: "order-of-magnitude", justification: "Climbing thins the atmospheric shield, so the galactic cosmic-ray dose rate rises — roughly doubling every ~2 km of altitude." },
  { from: "skin-depth", to: "channel-separation", type: "enables", tag: "established", justification: "Conductive shielding keeps unwanted bands out of a receiver, complementing tuning in isolating the desired channel." },
  { from: "superposition", to: "room-superposition", type: "enables", tag: "established", justification: "The room analyzer is the linear sum of every source's spectrum — a direct instance of superposition you can toggle source by source." },
  { from: "room-superposition", to: "fourier-decomposition", type: "requires", tag: "established", justification: "Reading the superposed room back into its per-source contributions is precisely a Fourier-style decomposition of the composite." },
  { from: "non-ionizing", to: "ionizing-threshold", type: "contrasts", tag: "misconception-corrected", justification: "Non-ionizing radiation sits below the ~10 eV threshold; more power adds photons, not per-photon energy, so it never becomes ionizing." },
  { from: "resonance", to: "bandwidth", type: "causes", tag: "established", justification: "The quality factor of a resonant circuit sets its −3 dB bandwidth Δf=f0/Q, trading selectivity against how much signal it admits." },
  { from: "selective-reception", to: "modulation", type: "requires", tag: "established", justification: "To recover a message a receiver must first select its carrier, then demodulate — selection precedes demodulation in every link." },
];

export function nodeById(id: string): GraphNode | undefined {
  return NODES.find((n) => n.id === id);
}
