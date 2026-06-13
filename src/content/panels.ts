import type { Panel, PanelTag, Reference } from "./types";

// Every claim panel carries exactly one tag. The five named misconceptions each appear
// as a panel tagged `misconception-corrected`, positively asserting the correct physics.

// Pinned-tag tokens (mutation targets). M11 flips SOUND_NOT_EM_TAG → WRONG_TAG.
const SOUND_NOT_EM_TAG: PanelTag = "misconception-corrected";
const WRONG_TAG = "engineering-convention" as PanelTag;
void WRONG_TAG;

export const REFERENCES: Reference[] = [
  { id: "codata", text: "CODATA 2018 recommended values of the fundamental physical constants." },
  { id: "ieee-80211", text: "IEEE 802.11 — Wi-Fi operates in the 2.400–2.4835 GHz and 5 GHz ISM/U-NII bands." },
  { id: "bluetooth-sig", text: "Bluetooth Core Spec — 2.400–2.4835 GHz ISM band, ~2.5 mW (Class 2) typical." },
  { id: "itu-cellular", text: "ITU / 3GPP — cellular sub-6 GHz allocations (e.g. 1.8–2.1 GHz)." },
  { id: "planck-law", text: "Planck's law of blackbody radiation; Wien displacement & Stefan–Boltzmann follow." },
  { id: "nist-water-dielectric", text: "Liquid-water complex permittivity (Debye relaxation ~20 GHz); microwave heating is dielectric loss." },
  { id: "shannon-1948", text: "Shannon (1948), 'A Mathematical Theory of Communication' — C = B·log2(1+S/N)." },
  { id: "gps-is", text: "GPS Interface Spec IS-GPS-200 — C/A code (1023 chips), processing gain 10·log10(N)." },
  { id: "stockman-sharpe", text: "Stockman & Sharpe (2000) cone fundamentals; S/M/L peaks ≈ 420/534/564 nm." },
  { id: "greenwood-1990", text: "Greenwood (1990) cochlear frequency-position function; human A=165.4, a=2.1, k=0.88." },
  { id: "skin-depth", text: "Classical electromagnetism — skin depth δ = 1/√(πfµσ); Cu @ 1 GHz ≈ 2.06 µm." },
  { id: "icru-atten", text: "NIST XCOM mass-attenuation tables — lead half-value layers; Beer–Lambert I=I0·e^(−µx)." },
  { id: "icao-cosmic", text: "ICRP / aviation dosimetry — galactic cosmic-ray dose rises with altitude (~2×/2 km; ~10× at 10 km)." },
  { id: "atm-windows", text: "Atmospheric transmission windows — optical & radio transparent; UV/X-ray/γ absorbed." },
];

export const PANELS: Panel[] = [
  // ── spectrum ────────────────────────────────────────────────────────────
  {
    id: "spec-ruler",
    module: "spectrum",
    tag: "established",
    title: "One ruler, twenty-two decades",
    body: "Every electromagnetic wave obeys c = fλ and carries energy E = hf per photon. From the ~10³ Hz of power lines to the ~10²⁵ Hz of cosmic gamma rays, that is twenty-two orders of magnitude of frequency space — enormous room for radio, microwave, infrared, visible, ultraviolet, X-ray and gamma to each occupy their own slice. The whole spectrum is one continuous ruler; the band names are just human labels on it.",
    data: [
      { label: "Speed of light c", value: "2.998×10⁸ m/s", formula: "c = fλ (defining relation)", source: "codata" },
      { label: "Planck constant h", value: "6.626×10⁻³⁴ J·s", formula: "E = hf", source: "codata" },
      { label: "Visible 550 nm frequency", value: "5.45×10¹⁴ Hz", formula: "f = c/λ", source: "codata" },
    ],
  },
  {
    id: "spec-ionizing",
    module: "spectrum",
    tag: "misconception-corrected",
    misconception: "non-ionizing",
    title: "Non-ionizing radiation cannot ionize — and here is why",
    body: "Ionization needs a single photon energetic enough to knock an electron off an atom — roughly ≥10 eV. Because E = hf, only frequencies above the extreme-UV/X-ray boundary clear that bar. Radio, microwave, infrared, visible light and most ultraviolet are NON-IONIZING: each photon simply lacks the energy, no matter how many of them arrive. Wi-Fi at 2.4 GHz delivers ~10⁻⁵ eV per photon — a million times short of the ionizing threshold. Turning up the power adds more photons, not more energy per photon.",
    data: [
      { label: "Ionizing boundary", value: "≈ 10 eV (≈124 nm)", formula: "E = hf; threshold ≈ 10 eV", source: "codata" },
      { label: "Wi-Fi 2.4 GHz photon", value: "≈ 9.9×10⁻⁶ eV", formula: "E = hf", source: "codata" },
      { label: "Visible 550 nm photon", value: "≈ 2.25 eV", formula: "E = hf", source: "codata" },
    ],
  },
  {
    id: "spec-5g",
    module: "spectrum",
    tag: "misconception-corrected",
    misconception: "more-bars-5g",
    title: "\"More bars / 5G\" is not \"more dangerous radiation\"",
    body: "The fear that 5G or a stronger signal means more dangerous radiation confuses two different quantities. What makes radiation able to ionize (the genuinely hazardous mechanism) is the per-photon energy E = hf, set purely by frequency. 5G — even mmWave around 24–40 GHz — sits far below the ~10 eV ionizing threshold, exactly like 4G, Wi-Fi and visible light. More bars means more received POWER (more photons), not higher photon energy. Power can warm tissue at extreme levels, but it cannot turn non-ionizing radiation into ionizing radiation. Frequency, not bar count, decides.",
    data: [
      { label: "5G mmWave 28 GHz photon", value: "≈ 1.2×10⁻⁴ eV", formula: "E = hf", source: "codata" },
      { label: "Ionizing threshold", value: "≈ 10 eV", formula: "E = hf", source: "codata" },
    ],
  },
  {
    id: "spec-sound",
    module: "spectrum",
    tag: SOUND_NOT_EM_TAG,
    misconception: "sound-not-em",
    title: "Sound is NOT electromagnetic",
    body: "Sound is a longitudinal mechanical pressure wave: it needs a medium (air, water, solid), it travels at ~343 m/s in air, and its audible range is ~20 Hz–20 kHz. It is fundamentally different physics from light, which is a transverse electromagnetic wave that travels at 3×10⁸ m/s through vacuum. A 1 kHz sound has a 34 cm wavelength (λ = v_sound/f), NOT the 300 km an electromagnetic wave at 1 kHz would have. Sound therefore never appears on the electromagnetic frequency ruler — putting it there would be a category error.",
    data: [
      { label: "Speed of sound (air)", value: "343 m/s", formula: "λ = v_sound / f (v ≈ 343 m/s)", source: "codata" },
      { label: "1 kHz sound wavelength", value: "0.343 m", formula: "λ = v_sound / f", source: "codata" },
      { label: "Audible range", value: "20 Hz – 20 kHz", formula: "human hearing range", source: "greenwood-1990" },
    ],
  },

  // ── room ───────────────────────────────────────────────────────────────
  {
    id: "room-overview",
    module: "room",
    tag: "order-of-magnitude",
    title: "What is actually in this room right now",
    body: "At this instant your room is a superposition of dozens of waves: Wi-Fi and Bluetooth around 2.4 GHz, cellular near 1.9 GHz, the visible glow of the ceiling light, the far-infrared pouring off every warm body, and sunlight through the window. The device powers below are order-of-magnitude (typical EIRP / radiated power), not exact — they set the scale, not a precise meter reading. Crucially, they all add linearly and pass through each other unchanged.",
    data: [
      { label: "Wi-Fi router EIRP", value: "~0.1 W (20 dBm)", formula: "typical 802.11 EIRP", source: "ieee-80211" },
      { label: "Bluetooth (Class 2)", value: "~2.5 mW", formula: "typical Class-2 TX power", source: "bluetooth-sig" },
      { label: "Phone cellular TX", value: "~0.2 W", formula: "typical handset uplink", source: "itu-cellular" },
      { label: "Ceiling LED (visible)", value: "~10 W radiant", formula: "order-of-magnitude", source: "planck-law" },
      { label: "Warm body (thermal IR)", value: "~100 W", formula: "P = εσAT⁴ (T≈310 K, A≈1.8 m²)", source: "planck-law" },
    ],
  },
  {
    id: "room-superposition",
    module: "room",
    tag: "established",
    title: "The analyzer is a true sum",
    body: "The spectrum-analyzer overlay is computed as the linear sum of every enabled source's spectrum — analyzer(A+B) equals analyzer(A)+analyzer(B). That is not a display trick; it is the superposition principle, and it is exactly why toggling the Wi-Fi router changes the trace only in the 2.4 GHz band and nowhere else.",
    data: [{ label: "Combiner", value: "linear sum", formula: "superposition: S_total(f) = Σ Sᵢ(f)", source: "shannon-1948" }],
  },
  {
    id: "room-perception",
    module: "room",
    tag: "model-simplification",
    title: "Three receivers, three rooms",
    body: "The same room looks completely different to different receivers. The human eye sees only the visible glow. A radio/SDR sees only the GHz hum of Wi-Fi and cellular. A thermal-IR camera sees the warm body blaze while the eye-view shows it dark. Each is a simplified single-band view of one physical room — a reminder that every receiver is built to ignore almost all of the slush.",
    data: [{ label: "Perception bands", value: "eye / radio / thermal", formula: "band-limited receiver model", source: "atm-windows" }],
  },

  // ── fourier ──────────────────────────────────────────────────────────────
  {
    id: "fourier-linearity",
    module: "fourier",
    tag: "established",
    title: "Why the cacophony isn't permanent damage",
    body: "Maxwell's equations are linear at everyday field strengths, so waves add but pass through each other unchanged — two beams crossing emerge undistorted. The composite 'mess' in the room is therefore losslessly decomposable: a Fourier transform recovers every original frequency, amplitude and phase. The universe being linear is precisely why the room of noise is recoverable rather than permanently scrambled.",
    data: [
      { label: "Round-trip error", value: "≤ 10⁻⁹ RMS", formula: "x = ifft(fft(x))", source: "shannon-1948" },
      { label: "Parseval", value: "Σ|x|² = (1/N)Σ|X|²", formula: "energy conserved across domains", source: "shannon-1948" },
    ],
  },

  // ── thermal ──────────────────────────────────────────────────────────────
  {
    id: "thermal-planck",
    module: "thermal",
    tag: "established",
    title: "Everything warm glows — mostly where you can't see",
    body: "Every object above absolute zero radiates a Planck spectrum. Wien's law puts the peak at λ_max = b/T: a 293 K room peaks near 9.9 µm (far-IR), a 2700 K bulb near 1.07 µm, the 5778 K Sun near 500 nm. Stefan–Boltzmann gives the total: P = εσAT⁴. That is why a thermal camera sees people blaze while your eyes see nothing — at 300 K the visible fraction of the emission is around 10⁻²³.",
    data: [
      { label: "Wien constant b", value: "2.898×10⁻³ m·K", formula: "λ_max = b/T", source: "planck-law" },
      { label: "Room peak (293 K)", value: "9.9 µm (far-IR)", formula: "λ_max = b/T", source: "planck-law" },
      { label: "Sun peak (5778 K)", value: "≈ 502 nm (visible)", formula: "λ_max = b/T", source: "planck-law" },
      { label: "σ (Stefan–Boltzmann)", value: "5.670×10⁻⁸ W·m⁻²·K⁻⁴", formula: "P = εσAT⁴", source: "planck-law" },
    ],
  },
  {
    id: "thermal-convection",
    module: "thermal",
    tag: "misconception-corrected",
    misconception: "convection-vs-radiation",
    title: "\"Thermal air\" is convection, not thermal radiation",
    body: "Two different things get called 'thermal'. Thermal RADIATION is electromagnetic — infrared photons emitted by a warm surface following Planck's law, travelling at the speed of light, needing no medium (this is what a thermal camera detects). 'Thermal air' is CONVECTION — actual warm air molecules physically moving and carrying heat, a mechanical bulk-flow process that needs a medium and moves at the speed of air currents. The heater warms you both ways, but only the radiation is part of the electromagnetic spectrum.",
    data: [{ label: "Radiation vs convection", value: "IR photons vs moving air", formula: "Planck radiation ≠ bulk fluid transport", source: "planck-law" }],
  },
  {
    id: "thermal-microwave",
    module: "thermal",
    tag: "misconception-corrected",
    misconception: "microwave-dielectric",
    title: "Microwaves heat by dielectric loss, not by resonating with water",
    body: "The common claim that a microwave oven hits a 'resonant frequency of water' is wrong. Water has no resonance at 2.45 GHz. Heating is dielectric loss: the oscillating field torques the polar water molecules and friction with neighbours dissipates the energy as heat. The water-absorption curve across the 1–10 GHz band is a broad, MONOTONIC Debye roll-off (the relaxation peak sits near 20 GHz) — there is no sharp resonance peak in the oven band. 2.45 GHz was chosen for penetration depth and regulatory allocation, not resonance.",
    data: [
      { label: "Oven frequency", value: "2.45 GHz (ISM)", formula: "engineering allocation, not resonance", source: "nist-water-dielectric" },
      { label: "Water Debye relaxation", value: "≈ 20 GHz", formula: "ε''(f): broad, monotonic in-band", source: "nist-water-dielectric" },
    ],
  },

  // ── resonance ────────────────────────────────────────────────────────────
  {
    id: "resonance-tuning",
    module: "resonance",
    tag: "model-simplification",
    title: "A tuned circuit ignores almost everything",
    body: "A series-RLC circuit resonates at f₀ = 1/(2π√(LC)) with a sharpness set by its quality factor Q, giving a −3 dB bandwidth Δf = f₀/Q. Tuned to one carrier, it suppresses neighbours by 20 dB or more — this single-pole model is idealized (real front-ends cascade several), but it captures the essence: a receiver is built to pass its own band and reject the rest.",
    data: [
      { label: "Resonant frequency", value: "f₀ = 1/(2π√(LC))", formula: "series-RLC resonance", source: "skin-depth" },
      { label: "Bandwidth", value: "Δf = f₀/Q", formula: "Q = (1/R)√(L/C)", source: "skin-depth" },
    ],
  },
  {
    id: "resonance-ofdm",
    module: "resonance",
    tag: "engineering-convention",
    title: "OFDM: overlapping spectra that still separate",
    body: "Modern Wi-Fi and cellular pack subcarriers so close they overlap — yet they don't interfere, because they are orthogonal. Spacing the subcarriers by exactly one cycle per symbol (Δf = 1/T) places each one's peak on every neighbour's spectral null. Their inner product over a symbol is zero, so a receiver extracts each cleanly. It is the engineering convention that lets thousands of channels share the same crowded band.",
    data: [{ label: "Subcarrier spacing", value: "Δf = 1/T", formula: "orthogonality: ∫ over T = 0 for i≠j", source: "shannon-1948" }],
  },

  // ── modulation ─────────────────────────────────────────────────────────
  {
    id: "modulation-roundtrip",
    module: "modulation",
    tag: "established",
    title: "Putting information on a wave and taking it back off",
    body: "A bare carrier carries no information; modulation imprints a message on it. AM varies the amplitude, FM varies the instantaneous frequency, and digital schemes like BPSK flip the phase between symbols. The receiver inverts the process — envelope detection for AM, a frequency discriminator for FM, coherent correlation for BPSK — and recovers the message. In a clean channel the recovery is essentially perfect (BPSK round-trips with zero bit errors), which is why two-way links feel seamless.",
    data: [
      { label: "AM bandwidth", value: "2·B_msg", formula: "double-sideband occupied bandwidth", source: "shannon-1948" },
      { label: "FM bandwidth", value: "2(Δf + B_msg)", formula: "Carson's rule", source: "shannon-1948" },
    ],
  },

  // ── shannon ──────────────────────────────────────────────────────────────
  {
    id: "shannon-floor",
    module: "shannon",
    tag: "established",
    title: "The noise floor and the speed limit on information",
    body: "Thermal agitation sets an inescapable noise floor: N = kTB, about −174 dBm/Hz at 290 K. On top of that, Shannon's theorem caps the error-free rate of any channel at C = B·log₂(1 + S/N). More bandwidth or more signal-to-noise buys more capacity, in exactly the way the formula says — and no clever coding can beat it. This is the hard boundary every wireless system designs against.",
    data: [
      { label: "Thermal noise density", value: "−174 dBm/Hz @ 290 K", formula: "N = kTB", source: "shannon-1948" },
      { label: "Channel capacity", value: "C = B·log₂(1 + S/N)", formula: "Shannon–Hartley theorem", source: "shannon-1948" },
    ],
  },

  // ── spreading ────────────────────────────────────────────────────────────
  {
    id: "spreading-magic",
    module: "spreading",
    tag: "established",
    title: "Reading a signal that is weaker than the noise",
    body: "A GPS signal arrives ~20 dB BELOW the noise floor — invisible in the raw time signal. The receiver recovers it by correlating against the satellite's known pseudo-random code: the signal, multiplied by its own code, coheres and adds up, while the noise — uncorrelated with the code — averages toward zero. The gain is the processing gain, 10·log₁₀(N) for a spreading factor N (1023 chips ⇒ ~30 dB). Despread, the bit-error rate collapses below 1%; an undespread control stays at coin-flip chance. That is the concrete answer to 'the signal is weaker than the noise, yet the phone reads it.'",
    data: [
      { label: "Processing gain", value: "10·log₁₀(N)", formula: "PG = 10·log₁₀(spreading factor)", source: "gps-is" },
      { label: "GPS C/A code", value: "1023 chips → ~30 dB", formula: "PG = 10·log₁₀(1023)", source: "gps-is" },
    ],
  },

  // ── vision ───────────────────────────────────────────────────────────────
  {
    id: "vision-cones",
    module: "vision",
    tag: "model-simplification",
    title: "Your eye is a three-channel spectrum sampler",
    body: "Color vision throws away almost all the spectral detail. Three cone types — S, M, L, peaking near 420, 534 and 564 nm — are broad, overlapping spectral filters. Each integrates the incident spectrum into a single number, so any spectrum, however complex, collapses to just three values (S, M, L). The Gaussian cone model here is a simplification of the measured fundamentals, but it reproduces the key consequence faithfully.",
    data: [
      { label: "S/M/L cone peaks", value: "≈ 420 / 534 / 564 nm", formula: "cone fundamentals (Gaussian model)", source: "stockman-sharpe" },
    ],
  },
  {
    id: "vision-metamerism",
    module: "vision",
    tag: "established",
    title: "Metamerism: different spectra, identical color",
    body: "Because the eye reports only three numbers, two physically different spectra that happen to produce the same (S, M, L) are indistinguishable — they are metamers, perceived as exactly the same color. This is why an RGB screen can fake any color with just three primaries: it doesn't reproduce the spectrum, only the three cone responses.",
    data: [{ label: "Metamer match", value: "ΔS,M,L ≤ 1%", formula: "equal tristimulus ⇒ same color", source: "stockman-sharpe" }],
  },

  // ── hearing ──────────────────────────────────────────────────────────────
  {
    id: "hearing-tonotopy",
    module: "hearing",
    tag: "established",
    title: "The cochlea is a mechanical spectrum analyzer",
    body: "The basilar membrane is stiff and narrow at the base, floppy and wide at the apex, so each place along it resonates at a different frequency — high notes near the base, low notes near the apex. The Greenwood function f = A(10^{a·x} − k) maps place to frequency (human A=165.4, a=2.1, k=0.88), running from ~20 Hz at the apex to ~20 kHz at the base. A chord is split into a spatial pattern of excitation: the ear performs a biological Fourier transform, and that pattern IS pitch.",
    data: [
      { label: "Greenwood parameters", value: "A=165.4, a=2.1, k=0.88", formula: "f = A(10^{a·x} − k)", source: "greenwood-1990" },
      { label: "Endpoints", value: "≈ 20 Hz – 20 kHz", formula: "x = 0 (apex) → x = 1 (base)", source: "greenwood-1990" },
    ],
  },
  {
    id: "hearing-mechanical",
    module: "hearing",
    tag: "established",
    title: "Hearing is mechanical — light and sound are different waves",
    body: "What the ear transduces is a mechanical pressure wave, not light. Sound travels at ~343 m/s, is longitudinal, and needs a medium; electromagnetic waves travel at 3×10⁸ m/s, are transverse, and cross vacuum. The eye and ear are both spectrum analyzers, but of two completely different physical phenomena — which is exactly why sound never belongs on the electromagnetic ruler.",
    data: [{ label: "Sound speed", value: "343 m/s (≪ c)", formula: "mechanical longitudinal wave", source: "codata" }],
  },

  // ── attenuation ──────────────────────────────────────────────────────────
  {
    id: "atten-skin",
    module: "attenuation",
    tag: "established",
    title: "What metal blocks — skin depth and the Faraday cage",
    body: "Fields cannot penetrate a good conductor: they decay over the skin depth δ = 1/√(πfµσ). For copper at 1 GHz that is ~2.06 µm, so a few microns of metal already attenuate RF by e-folds — the principle behind a Faraday cage and why a metal-skinned aircraft, a microwave-oven door mesh, or a foil wrap blocks radio. Higher frequency ⇒ shallower skin depth ⇒ better shielding.",
    data: [
      { label: "Copper skin depth @ 1 GHz", value: "≈ 2.06 µm", formula: "δ = 1/√(πfµσ)", source: "skin-depth" },
    ],
  },
  {
    id: "atten-beer",
    module: "attenuation",
    tag: "established",
    title: "Beer–Lambert, half-value layers, and atmospheric windows",
    body: "For X-rays and gamma rays, intensity falls exponentially through matter: I = I₀·e^(−µx). The half-value layer x = ln2/µ is the thickness that halves the beam — for lead at 100 keV, under a millimetre. On the largest scale, the atmosphere itself is a filter with windows: it is transparent to visible light and radio (why we see stars and receive signals) but opaque to UV, X-ray and gamma (why those telescopes fly in space).",
    data: [
      { label: "Beer–Lambert", value: "I = I₀·e^(−µx)", formula: "exponential attenuation", source: "icru-atten" },
      { label: "Half-value layer", value: "x = ln2/µ", formula: "transmission = 0.5", source: "icru-atten" },
    ],
  },

  // ── scenario ─────────────────────────────────────────────────────────────
  {
    id: "scenario-altitude",
    module: "scenario",
    tag: "order-of-magnitude",
    title: "Your room vs an airplane at altitude",
    body: "On the ground the atmosphere is a thick cosmic-ray shield. Climb, and the shield thins: the galactic-cosmic-ray dose rate roughly doubles every ~2 km and is about 10× the ground rate at a 10 km cruise. Meanwhile the metal fuselage acts as a partial Faraday enclosure, attenuating external cellular RF. The dose numbers are order-of-magnitude aviation-dosimetry figures, not a personal measurement.",
    data: [
      { label: "Ground dose rate", value: "~0.03 µSv/h", formula: "order-of-magnitude sea-level GCR", source: "icao-cosmic" },
      { label: "Altitude doubling", value: "~2× per 2 km", formula: "saturating-exponential dose model", source: "icao-cosmic" },
      { label: "10 km dose", value: "~10× ground", formula: "dose(10 km)/dose(0)", source: "icao-cosmic" },
    ],
  },
  {
    id: "scenario-synthesis",
    module: "scenario",
    tag: "established",
    title: "Why it all just works — the four reasons",
    body: "Pulling it together: the room is a deafening superposition, and it still works for four reasons. (1) Linearity & superposition — waves add but pass through unchanged, so the mess is losslessly separable by Fourier. (2) The spectrum is vast — twenty-plus decades of frequency give every service its own slice. (3) Selective receivers — tuned circuits, orthogonal codes, and biological transducers are each built to ignore almost everything. (4) Information theory's floor — kTB sets a noise floor, Shannon caps the rate, and matched-filter processing gain even pulls signal out from below the noise. That is the machinery that turns cacophony into vision, hearing, and seamless two-way wireless.",
    data: [{ label: "The four reasons", value: "linearity · vastness · selectivity · coding", formula: "synthesis of Q1–Q9", source: "shannon-1948" }],
  },
];

export function panelsForModule(module: string): Panel[] {
  return PANELS.filter((p) => p.module === module);
}

export const MISCONCEPTION_PANELS = PANELS.filter((p) => p.tag === "misconception-corrected");
