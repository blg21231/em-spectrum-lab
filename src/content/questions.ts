import type { Question } from "./types";

// The nine driving questions — canonical text from the PRD rubric (em-spectrum-lab).
export const QUESTIONS: Question[] = [
  {
    id: "Q1",
    text: "What is actually flooding a typical room at this instant — which waves, at what frequencies, wavelengths, photon energies, and roughly what powers — and how do you visualize \"all of it at once\"?",
    routes: ["room", "spectrum"],
    nodes: ["room-superposition", "electromagnetic-wave", "spectrum-vastness"],
    answer: "Wi-Fi/Bluetooth ~2.4 GHz, cellular ~1.9 GHz, visible light, thermal IR off warm bodies, sunlight — visualized as a live superposed spectrum analyzer over the 3D room.",
  },
  {
    id: "Q2",
    text: "Why isn't it chaos? How can countless waves occupy the same space at the same time without permanently corrupting each other? (linearity / superposition / lossless Fourier decomposition)",
    routes: ["fourier"],
    nodes: ["linearity", "superposition", "fourier-decomposition"],
    answer: "Because the universe is linear at everyday amplitudes: waves add but pass through each other unchanged, so the composite is losslessly separable by Fourier transform.",
  },
  {
    id: "Q3",
    text: "Why is there room for everyone? How vast is the spectrum, and how is it carved into bands/channels? (c=fλ, E=hf, the scale of frequency space)",
    routes: ["spectrum"],
    nodes: ["spectrum-vastness", "photon-energy", "channel-separation"],
    answer: "The EM spectrum spans ~22 decades of frequency (c=fλ, E=hf); that vastness gives every service its own mostly non-overlapping slice.",
  },
  {
    id: "Q4",
    text: "How does each receiver get only its piece and ignore the rest? (resonance/tuning, FDMA, OFDM orthogonality, correlation codes — selective filtering)",
    routes: ["resonance"],
    nodes: ["resonance", "selective-reception", "orthogonality", "ofdm"],
    answer: "Tuned circuits resonate only near their band, OFDM subcarriers are orthogonal, and correlation codes pick out one signal — each receiver is built to ignore almost everything.",
  },
  {
    id: "Q5",
    text: "How is information put onto a wave and pulled back off, two ways, seamlessly? (modulation/demodulation, bandwidth)",
    routes: ["modulation"],
    nodes: ["modulation", "bandwidth"],
    answer: "Modulation imprints the message on a carrier (AM/FM/BPSK); the receiver inverts it. In a clean channel the round-trip is essentially lossless, so two-way links feel seamless.",
  },
  {
    id: "Q6",
    text: "How is a signal recovered when it is weaker than the noise around it? (noise floor kTB, Shannon capacity, matched-filter/spreading processing gain — the GPS \"magic\")",
    routes: ["shannon", "spreading"],
    nodes: ["noise-floor", "shannon-capacity", "spreading-code", "below-noise-recovery"],
    answer: "kTB sets the noise floor and Shannon caps the rate, but correlating against a known spreading code gives processing gain 10·log10(N) — enough to read a signal from below the noise.",
  },
  {
    id: "Q7",
    text: "How do your eye and ear turn waves into vision and meaning — and how is sound different from light? (cones as 3 spectral filters; cochlea as a mechanical spectrum analyzer; sound is mechanical, not EM)",
    routes: ["vision", "hearing"],
    nodes: ["cone-trichromacy", "color-vision", "cochlear-tonotopy", "sound-wave", "electromagnetic-wave"],
    answer: "Three cones sample the spectrum into a color; the cochlea maps frequency to place (tonotopy). Sound is a mechanical pressure wave at 343 m/s — never electromagnetic.",
  },
  {
    id: "Q8",
    text: "What blocks what, and what passes through? (skin depth/Faraday cage, Beer–Lambert, X-ray half-value layer, atmospheric windows; ionizing vs non-ionizing)",
    routes: ["attenuation"],
    nodes: ["skin-depth", "faraday-shielding", "atmospheric-windows", "photon-energy", "ionizing-threshold"],
    answer: "Metal blocks RF via skin depth (Faraday cage); matter attenuates X-rays by Beer–Lambert; the atmosphere passes visible+radio but absorbs UV/X-ray/gamma. Photon energy sets ionizing capability.",
  },
  {
    id: "Q9",
    text: "How does the picture change on an airplane vs your room — and, pulling it all together, what is the unifying reason \"it all just works\"?",
    routes: ["scenario", "graph"],
    nodes: ["cosmic-dose", "altitude", "faraday-shielding", "superposition", "selective-reception"],
    answer: "At altitude cosmic-ray dose rises (~10× at 10 km) and the fuselage shields cellular RF. It all works because of four things: linearity, the vast spectrum, selective receivers, and information theory's beatable noise floor.",
  },
];
