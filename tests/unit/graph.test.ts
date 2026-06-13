import { describe, expect, it } from "vitest";
import { EDGES, NODES } from "../../src/content/graph";
import { QUESTIONS } from "../../src/content/questions";
import type { EdgeType } from "../../src/content/types";

const EDGE_TYPES: EdgeType[] = ["enables", "requires", "contrasts", "causes", "corrects-misconception"];

describe("Concept graph (AC14)", () => {
  it("≥24 nodes, ≥36 edges", () => {
    expect(NODES.length).toBeGreaterThanOrEqual(24);
    expect(EDGES.length).toBeGreaterThanOrEqual(36);
  });

  it("every edge is typed, justified ≥40 chars, references existing nodes", () => {
    const ids = new Set(NODES.map((n) => n.id));
    for (const e of EDGES) {
      expect(EDGE_TYPES, `edge ${e.from}->${e.to} type ${e.type}`).toContain(e.type);
      expect(e.justification.length, `edge ${e.from}->${e.to} justification too short`).toBeGreaterThanOrEqual(40);
      expect(ids.has(e.from), `edge from ${e.from} missing node`).toBe(true);
      expect(ids.has(e.to), `edge to ${e.to} missing node`).toBe(true);
    }
  });

  it("includes the 14 pinned edges", () => {
    const has = (from: string, to: string, type: EdgeType) =>
      EDGES.some((e) => e.from === from && e.to === to && e.type === type);
    expect(has("linearity", "superposition", "enables")).toBe(true);
    expect(has("superposition", "fourier-decomposition", "enables")).toBe(true);
    expect(has("fourier-decomposition", "channel-separation", "enables")).toBe(true);
    expect(has("resonance", "selective-reception", "enables")).toBe(true);
    expect(has("orthogonality", "ofdm", "enables")).toBe(true);
    expect(has("noise-floor", "shannon-capacity", "requires")).toBe(true);
    expect(has("spreading-code", "below-noise-recovery", "enables")).toBe(true);
    expect(has("cone-trichromacy", "color-vision", "enables")).toBe(true);
    expect(has("cochlear-tonotopy", "pitch-perception", "enables")).toBe(true);
    expect(has("sound-wave", "electromagnetic-wave", "contrasts")).toBe(true);
    expect(has("photon-energy", "ionizing-threshold", "causes")).toBe(true);
    expect(has("skin-depth", "faraday-shielding", "enables")).toBe(true);
    expect(has("convection", "thermal-radiation", "corrects-misconception")).toBe(true);
    expect(has("dielectric-heating", "microwave-resonance-myth", "corrects-misconception")).toBe(true);
  });

  it("every node id referenced by the questions manifest resolves to a node (AC13/AC14)", () => {
    const ids = new Set(NODES.map((n) => n.id));
    for (const q of QUESTIONS) {
      for (const n of q.nodes) {
        expect(ids.has(n), `question ${q.id} references missing node ${n}`).toBe(true);
      }
    }
  });
});
