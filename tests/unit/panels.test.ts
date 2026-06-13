import { describe, expect, it } from "vitest";
import { PANELS, REFERENCES } from "../../src/content/panels";
import type { PanelTag } from "../../src/content/types";
import { microwaveBandProfile } from "../../src/sim/thermal";

const VALID_TAGS: PanelTag[] = [
  "established",
  "engineering-convention",
  "model-simplification",
  "order-of-magnitude",
  "misconception-corrected",
];

describe("Panels — physical honesty & provenance (AC15, AC16)", () => {
  it("(a) every panel carries exactly one tag from the valid set", () => {
    for (const p of PANELS) {
      expect(VALID_TAGS, `panel ${p.id} tag ${p.tag}`).toContain(p.tag);
    }
  });

  it("(b) pinned tags carry information (not blanket-established)", () => {
    const byId = Object.fromEntries(PANELS.map((p) => [p.id, p]));
    // thermal radiation vs "thermal air" = misconception-corrected
    expect(byId["thermal-convection"].tag).toBe("misconception-corrected");
    // room device-power figures = order-of-magnitude
    expect(byId["room-overview"].tag).toBe("order-of-magnitude");
    // ≥1 idealized single-pole/single-Lorentzian model = model-simplification
    expect(byId["resonance-tuning"].tag).toBe("model-simplification");
    // the sound≠EM panel is a misconception-corrected panel (M11 target)
    expect(byId["spec-sound"].tag).toBe("misconception-corrected");
  });

  it("(c) five named misconceptions each appear, tagged misconception-corrected, positively asserting correct physics", () => {
    const mc = PANELS.filter((p) => p.tag === "misconception-corrected");
    const kinds = new Set(mc.map((p) => p.misconception));
    expect(kinds.has("sound-not-em")).toBe(true);
    expect(kinds.has("convection-vs-radiation")).toBe(true);
    expect(kinds.has("microwave-dielectric")).toBe(true);
    expect(kinds.has("non-ionizing")).toBe(true);
    expect(kinds.has("more-bars-5g")).toBe(true);
    expect(mc.length).toBeGreaterThanOrEqual(5);
    // positive assertions (a field/string match, not mere absence of bad phrasing)
    const byMis = Object.fromEntries(mc.map((p) => [p.misconception, p]));
    expect(byMis["sound-not-em"].body).toMatch(/longitudinal|343 m\/s|mechanical/);
    expect(byMis["sound-not-em"].body).toMatch(/needs a medium/);
    expect(byMis["convection-vs-radiation"].body).toMatch(/convection/i);
    expect(byMis["convection-vs-radiation"].body).toMatch(/Planck|infrared photons/);
    expect(byMis["microwave-dielectric"].body).toMatch(/dielectric loss/i);
    expect(byMis["microwave-dielectric"].body).toMatch(/no(t| sharp)? .*resonance|no resonance/i);
    expect(byMis["non-ionizing"].body).toMatch(/E = hf|per-photon/);
    expect(byMis["more-bars-5g"].body).toMatch(/E = hf|photon energy/);
  });

  it("(iii) the microwave/water absorption model has NO in-band resonant peak (computed artifact)", () => {
    const prof = microwaveBandProfile();
    expect(prof.hasInBandPeak).toBe(false);
    expect(prof.monotonic).toBe(true);
  });

  it("(d) content-lint: no unqualified-fear/overclaim phrasing; sound never placed in an EM band", () => {
    const banned = [
      /radiation gives you cancer/i,
      /5g is dangerous/i,
      /microwaves resonate with water/i,
      /sound is (an? )?electromagnetic/i,
      /sound.*(radio|microwave|infrared) band/i,
    ];
    for (const p of PANELS) {
      for (const re of banned) {
        expect(re.test(p.body), `panel ${p.id} matched banned phrase ${re}`).toBe(false);
      }
    }
  });

  it("(AC16) every numeric field has a resolvable formula or source", () => {
    const refIds = new Set(REFERENCES.map((r) => r.id));
    let count = 0;
    for (const p of PANELS) {
      for (const d of p.data ?? []) {
        count++;
        const hasFormula = typeof d.formula === "string" && d.formula.length > 0;
        const hasSource = typeof d.source === "string" && d.source.length > 0;
        expect(hasFormula || hasSource, `${p.id}:${d.label} unsourced`).toBe(true);
        if (hasSource) expect(refIds.has(d.source!), `${p.id}:${d.label} ref ${d.source} unresolved`).toBe(true);
      }
    }
    expect(count).toBeGreaterThan(20);
  });
});
