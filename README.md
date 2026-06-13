# Spectrum Lab

**Live:** https://em-spectrum-lab.vercel.app

An interactive, simulation-driven web exploratorium (Three.js + TypeScript) of the **invisible ocean of electromagnetic waves** flooding a typical room — Wi-Fi, Bluetooth, cellular, the visible glow of the lamp, the infrared pouring off every warm body, sunlight — plus mechanical **sound**, kept rigorously distinct. It answers the question that motivates the whole thing: if the room is a deafening superposition of countless overlapping waves across twenty-plus decades of frequency, **why isn't it chaos?**

The four-part answer is woven through every module:

1. **Linearity & superposition** — waves add but pass through each other unchanged; the composite is losslessly decomposable by Fourier.
2. **The vastness of frequency space** — the EM spectrum spans ~10³–10²⁵ Hz, so every service gets its own slice (c=fλ, E=hf).
3. **Selective receivers** — tuned circuits, OFDM orthogonality, correlation codes, and biological transducers each ignore almost all of the slush.
4. **Information theory's noise floor that coding beats** — kTB, Shannon capacity, and matched-filter processing gain that pulls GPS out from *below* the noise.

Plus the everyday misconceptions corrected precisely: **sound ≠ electromagnetic**, **thermal radiation ≠ "thermal air" (convection)**, **microwave heating is dielectric loss, not water resonance**, **non-ionizing radiation can't ionize (E=hf)**, and **"more bars/5G ≠ more dangerous radiation."**

## Modules (13 routes)

`spectrum` · `room` (the 3D Three.js centerpiece) · `fourier` · `thermal` · `resonance` · `modulation` · `shannon` · `spreading` · `vision` · `hearing` · `attenuation` · `scenario` · `graph`

Every visual is driven by **live, benchmarked numerics** — pure sim cores in `src/sim/` (no DOM/WebGL, Node-importable), validated against the analytic physics (Planck, Wien, Stefan–Boltzmann, c=fλ, E=hf, Shannon, skin depth, Greenwood, cone fundamentals). No canned/keyframed physics anywhere.

## Architecture

- **`src/sim/`** — pure, dependency-free, unit-benchmarked physics cores (the renderer consumes them, never the reverse).
- **`src/content/`** — the typed concept graph (≥24 nodes, ≥36 edges), the driving-questions ledger (Q1–Q9), and every claim panel (each tagged + every number sourced).
- **`src/app/`** — the sim clock, the `window.__LAB__` testability hook, and the per-route renderers.

## Develop

```bash
npm install
npm run dev          # vite dev server on :3019
npm run lint         # eslint, zero warnings
npm run typecheck    # tsc --noEmit
npm run test         # vitest (sim cores + content)
npm run test:coverage
bash scripts/import-smoke.sh   # bare-Node sim-core import smoke
npm run build
npx playwright test  # e2e (journey, sim-driven, interactions, airgap, viewports)
```

## Tags

Every claim panel carries exactly one: `established · engineering-convention · model-simplification · order-of-magnitude · misconception-corrected`. The room is chaos; here is exactly why it still works.
