import { EDGES, NODES } from "../../content/graph";
import { QUESTIONS } from "../../content/questions";
import { onTick } from "../clock";
import { el, makeCanvas, sceneBox } from "../ui";
import { registerScene } from "../hook";

export const id = "graph";
export const title = "The One Argument";
export const subtitle =
  "Every concept, one typed graph: linearity enables superposition enables Fourier decomposition… The room is chaos, and here is exactly why it still works. Click a node to jump to its module.";

interface Laid {
  id: string;
  x: number;
  y: number;
  label: string;
  module?: string;
}

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  // driving-questions ledger up top (Q9 synthesis lives here)
  const banner = el("div", { class: "question-banner", "data-question": "Q9" });
  const q9 = QUESTIONS.find((q) => q.id === "Q9")!;
  banner.append(el("span", { class: "qid" }, "Q9"), document.createTextNode(q9.text), el("span", { class: "qanswer", "data-qanswer": "Q9" }, q9.answer));
  root.append(banner);

  const W = 900;
  const H = 560;
  const canvas = makeCanvas(W, H);

  // deterministic circular-cluster layout
  const laid: Laid[] = NODES.map((n, i) => {
    const ang = (i / NODES.length) * Math.PI * 2;
    const ring = 0.62 + 0.28 * ((i % 3) / 2);
    return {
      id: n.id,
      label: n.label,
      module: n.module,
      x: W / 2 + Math.cos(ang) * (W * 0.42) * ring,
      y: H / 2 + Math.sin(ang) * (H * 0.42) * ring,
    };
  });
  const byId = new Map(laid.map((l) => [l.id, l]));

  const TAG_COLOR: Record<string, string> = {
    established: "#3fb68b",
    "engineering-convention": "#62d0ff",
    "model-simplification": "#b48cff",
    "order-of-magnitude": "#ffb86e",
    "misconception-corrected": "#ff7e96",
  };

  let pulse = 0;
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    // edges
    for (const e of EDGES) {
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b) continue;
      ctx.strokeStyle = e.type === "corrects-misconception" ? "rgba(255,126,150,0.35)" : e.type === "contrasts" ? "rgba(255,184,110,0.3)" : "rgba(98,208,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // nodes
    for (const l of laid) {
      const node = NODES.find((n) => n.id === l.id)!;
      const r = 6 + 2 * Math.sin(pulse + l.x * 0.01);
      ctx.fillStyle = TAG_COLOR[node.tag] ?? "#62d0ff";
      ctx.beginPath();
      ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  draw();
  cleanups.push(
    onTick((dt) => {
      pulse += dt * 1.5;
      draw();
    }),
  );

  // node labels as positioned DOM elements for e2e click-targeting
  const sBox = sceneBox(canvas, [], "concept-graph");
  sBox.style.position = "relative";
  for (const l of laid) {
    const lab = el("span", {
      "data-node-label": l.id,
      style: `position:absolute;left:${(l.x / W) * 100}%;top:${(l.y / H) * 100}%;transform:translate(-50%,-140%);font-size:10px;color:#cdd6ea;pointer-events:none;white-space:nowrap;`,
    }, l.label);
    sBox.append(lab);
  }
  // clicking the canvas navigates to the nearest node's module
  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ((ev.clientX - rect.left) / rect.width) * W;
    const cy = ((ev.clientY - rect.top) / rect.height) * H;
    let best: Laid | null = null;
    let bestD = Infinity;
    for (const l of laid) {
      const d = (l.x - cx) ** 2 + (l.y - cy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    if (best && best.module && best.module !== "graph" && bestD < 60 * 60) {
      location.hash = `#/${best.module}`;
    }
  });
  root.append(sBox);

  registerScene(
    "concept-graph",
    () => ({ nodes: NODES.length, edges: EDGES.length }),
    {
      navTo: (nodeId) => {
        const l = byId.get(String(nodeId));
        if (l?.module) location.hash = `#/${l.module}`;
        return l?.module ?? "";
      },
    },
  );

  // full ledger table of all nine questions
  const ledger = el("section", { "data-panel": "graph-ledger", "data-tag": "established" });
  ledger.append(el("span", { class: "tag-chip tag-established" }, "established"), el("h3", {}, "Driving-questions ledger (Q1–Q9)"));
  const ul = el("ul", { class: "data-list" });
  for (const q of QUESTIONS) {
    ul.append(el("li", { "data-ledger-q": q.id }, el("span", {}, q.id + " → " + q.routes.join(", ") + " "), el("b", {}, q.answer.slice(0, 60) + "…")));
  }
  ledger.append(ul);
  root.append(ledger);

  return () => cleanups.forEach((fn) => fn());
}
