# AC → test coverage map (`em-spectrum-lab`)

PRD: `~/Documents/Claude/tasks/prds/em-spectrum-lab.md`

| AC | What it gates | Asserting tests |
|----|---------------|-----------------|
| AC1 | c=fλ / E=hf exactness (≤1e-9, both directions), ionizing classifier at 10 eV, named bands, sound-not-EM rejection | `tests/unit/spectrum.test.ts` · `tests/e2e/interactions.spec.ts` ("spectrum") |
| AC2 | Fourier: K≥5 tone recovery, round-trip ≤1e-9, Parseval ≤1e-9, linearity ≤1e-9; live decomposition | `tests/unit/fourier.test.ts` · `tests/e2e/airgap.spec.ts` (fourier scene drawn) |
| AC3 | Wien (4 T) ≤0.1%, ∫Planck=σT⁴ ≤0.5%, visible fraction 300/5778 K bands; radiation≠convection panel | `tests/unit/thermal.test.ts` · `tests/e2e/sim-driven.spec.ts` ("thermal Planck") · `tests/e2e/journey.spec.ts` (panel walk) |
| AC4 | RLC f0 ≤0.1%, Δf=f0/Q ≤2%, ≥20 dB selectivity, OFDM orthogonality ≤1e-9; live re-tune | `tests/unit/resonance.test.ts` · `tests/e2e/interactions.spec.ts` ("resonance") |
| AC5 | AM/FM recover ≤5% RMS, BPSK zero-error round-trip, bandwidth direction; live waveforms | `tests/unit/modulation.test.ts` · `tests/e2e/interactions.spec.ts` ("modulation") |
| AC6 | kTB=−174 dBm/Hz@290K ≤0.1 dB, C=B·log2(1+S/N) exact + monotone; live sliders | `tests/unit/shannon.test.ts` · `tests/e2e/interactions.spec.ts` ("shannon") |
| AC7 | PG=10log10(N) ≤0.2 dB, despread BER<1% @ −15 dB vs control ≈50%, peak-SNR gain ≤1 dB; live peak | `tests/unit/spreading.test.ts` · `tests/e2e/sim-driven.spec.ts` ("matched-filter despread") |
| AC8 | Cone integrals vs SPDs ≤2% (530 nm→green, EE-white→white point), metamer ≤1%; live spectrum→color | `tests/unit/vision.test.ts` · `tests/e2e/interactions.spec.ts` ("vision") |
| AC9 | Greenwood monotone + endpoints ≤5%, chord→place ≤2%, sound mechanical (343 m/s, not c, no EM band); live pattern | `tests/unit/hearing.test.ts` · `tests/e2e/interactions.spec.ts` ("hearing") · `tests/e2e/journey.spec.ts` (sound≠EM panel) |
| AC10 | Cu skin depth @1 GHz ≈2.06 µm ≤1%, Beer–Lambert exact, lead HVL ≤1%, atmospheric windows; live transmission | `tests/unit/attenuation.test.ts` · `tests/e2e/interactions.spec.ts` ("attenuation") |
| AC11 | Dose monotone↑, ≈2×/2000m + ≈10×/10km within 15% (decreasing FAILS); room↔airplane indicators | `tests/unit/scenario.test.ts` · `tests/e2e/sim-driven.spec.ts` (room) + scenario route in journey |
| AC12 | Room: ≥6 real-band sources, true superposition analyzer(A+B)=analyzer(A)+analyzer(B) ≤1% (overlapping bands), per-source band change, 3 perception views differ | `tests/unit/room.test.ts` · `tests/e2e/sim-driven.spec.ts` ("room spectrum analyzer", "room perception views") |
| AC13 | 9 questions mapped to ≥1 route/node/answer, ≥11 routes render, no orphans | `tests/unit/questions.test.ts` · `tests/e2e/journey.spec.ts` ("full journey", "driving-questions ledger") |
| AC14 | Graph ≥24 nodes/≥36 edges, 14 pinned edges, ≥40-char justifications, node-resolution; render + node-click nav | `tests/unit/graph.test.ts` · `tests/e2e/journey.spec.ts` ("concept graph") |
| AC15 | Every panel tagged, pinned tags carry info, 5 misconception panels positively assert physics, microwave no-in-band-peak, content-lint | `tests/unit/panels.test.ts` · `tests/e2e/journey.spec.ts` ("physical-honesty walk") |
| AC16 | Every numeric panel field has a resolvable formula/source; references resolve | `tests/unit/panels.test.ts` ("AC16 every numeric field") |
| AC17 | 3 named scenes (thermal Planck, despread, room analyzer): freeze/resume + parameter-causality magnitude laws; bare-Node import smoke | `tests/e2e/sim-driven.spec.ts` · `scripts/import-smoke.sh` |
| AC18 | Live prod, three.js load-bearing, console-clean, zero cross-origin, airgap boot, 390/1440 px | `tests/e2e/journey.spec.ts` · `tests/e2e/airgap.spec.ts` · `tests/e2e/viewports.spec.ts` (+ prod smoke with `SMOKE_URL`) |
| AC19 | 7 remaining routes (spectrum, resonance, modulation, shannon, vision, hearing, attenuation): primary-control causality + freeze | `tests/e2e/interactions.spec.ts` |

Mutation tests: `python3 tasks/prds/mutate.py em-spectrum-lab` (run from `~/Documents/Claude`) — 15/15 killed.
