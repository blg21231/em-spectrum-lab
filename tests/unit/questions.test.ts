import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../../src/content/questions";
import { NODES } from "../../src/content/graph";
import { PANELS } from "../../src/content/panels";

describe("Driving-questions ledger (AC13)", () => {
  it("exactly nine questions Q1–Q9, each mapping to ≥1 route, ≥1 node, and an answer", () => {
    expect(QUESTIONS.length).toBe(9);
    for (let i = 0; i < 9; i++) {
      const q = QUESTIONS[i];
      expect(q.id).toBe(`Q${i + 1}`);
      expect(q.routes.length).toBeGreaterThanOrEqual(1);
      expect(q.nodes.length).toBeGreaterThanOrEqual(1);
      expect(q.text.length).toBeGreaterThan(20);
      expect(q.answer.length).toBeGreaterThan(20);
    }
  });

  it("no question maps to nothing; every route owns ≥1 panel; every node resolves", () => {
    const nodeIds = new Set(NODES.map((n) => n.id));
    const modulesWithPanels = new Set(PANELS.map((p) => p.module));
    for (const q of QUESTIONS) {
      for (const r of q.routes) {
        expect(["spectrum", "room", "fourier", "thermal", "resonance", "modulation", "shannon", "spreading", "vision", "hearing", "attenuation", "scenario", "graph"]).toContain(r);
        if (r !== "graph") expect(modulesWithPanels.has(r), `route ${r} has no panel`).toBe(true);
      }
      for (const n of q.nodes) expect(nodeIds.has(n), `${q.id} node ${n}`).toBe(true);
    }
  });
});
