import { PANELS } from "../content/panels";
import { QUESTIONS } from "../content/questions";
import type { ModuleId } from "../content/types";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

export function renderPanel(id: string): HTMLElement {
  const p = PANELS.find((x) => x.id === id);
  if (!p) throw new Error(`unknown panel ${id}`);
  const sec = el("section", { "data-panel": p.id, "data-tag": p.tag });
  sec.append(el("span", { class: `tag-chip tag-${p.tag}` }, p.tag), el("h3", {}, p.title));
  for (const para of p.body.split("\n")) sec.append(el("p", {}, para));
  if (p.data && p.data.length) {
    const ul = el("ul", { class: "data-list" });
    for (const d of p.data) {
      const prov = d.formula ? `formula: ${d.formula}` : d.source ? `source: ${d.source}` : "";
      ul.append(
        el("li", {}, el("span", {}, d.label + " "), el("b", {}, d.value), el("span", { class: "prov" }, prov)),
      );
    }
    sec.append(ul);
  }
  return sec;
}

export function renderModulePanels(module: ModuleId): HTMLElement[] {
  return PANELS.filter((p) => p.module === module).map((p) => renderPanel(p.id));
}

export function renderQuestionBanners(module: ModuleId): HTMLElement[] {
  return QUESTIONS.filter((q) => q.routes.includes(module)).map((q) => {
    const div = el("div", { class: "question-banner", "data-question": q.id });
    div.append(
      el("span", { class: "qid" }, q.id),
      document.createTextNode(q.text),
      el("span", { class: "qanswer", "data-qanswer": q.id }, q.answer),
    );
    return div;
  });
}

export interface SliderSpec {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onInput: (v: number) => void;
  testid?: string;
}

export function slider(spec: SliderSpec): HTMLElement {
  const fmt = spec.format ?? ((v: number) => v.toFixed(2));
  const valEl = el("b", {}, fmt(spec.value));
  const input = el("input", {
    type: "range",
    min: String(spec.min),
    max: String(spec.max),
    step: String(spec.step),
    value: String(spec.value),
    ...(spec.testid ? { "data-testid": spec.testid } : {}),
  });
  input.addEventListener("input", () => {
    const v = Number(input.value);
    valEl.textContent = fmt(v);
    spec.onInput(v);
  });
  return el("label", {}, `${spec.label} `, valEl, input);
}

export function toggleButton(label: string, initial: boolean, onToggle: (on: boolean) => void, testid?: string): HTMLButtonElement {
  let on = initial;
  const btn = el("button", {
    class: on ? "secondary active" : "secondary",
    ...(testid ? { "data-testid": testid } : {}),
  }, label) as HTMLButtonElement;
  btn.addEventListener("click", () => {
    on = !on;
    btn.className = on ? "secondary active" : "secondary";
    btn.setAttribute("data-on", String(on));
    onToggle(on);
  });
  btn.setAttribute("data-on", String(on));
  return btn;
}

export function sceneBox(canvas: HTMLCanvasElement, controls: HTMLElement[], sceneId: string): HTMLElement {
  const box = el("div", { class: "scene", "data-scene": sceneId });
  box.append(canvas);
  if (controls.length) {
    const bar = el("div", { class: "controls" });
    bar.append(...controls);
    box.append(bar);
  }
  return box;
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
