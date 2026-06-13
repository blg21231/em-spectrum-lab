import { QUESTIONS } from "./content/questions";
import { startClock } from "./app/clock";
import { installHook, unregisterScene } from "./app/hook";
import { el } from "./app/ui";
import * as spectrum from "./app/modules/spectrum";
import * as room from "./app/modules/room";
import * as fourier from "./app/modules/fourier";
import * as thermal from "./app/modules/thermal";
import * as resonance from "./app/modules/resonance";
import * as modulation from "./app/modules/modulation";
import * as shannon from "./app/modules/shannon";
import * as spreading from "./app/modules/spreading";
import * as vision from "./app/modules/vision";
import * as hearing from "./app/modules/hearing";
import * as attenuation from "./app/modules/attenuation";
import * as scenario from "./app/modules/scenario";
import * as graphview from "./app/modules/graph";

interface ModuleDef {
  id: string;
  title: string;
  subtitle: string;
  mount: (root: HTMLElement) => () => void;
}

const MODULES: ModuleDef[] = [
  spectrum,
  room,
  fourier,
  thermal,
  resonance,
  modulation,
  shannon,
  spreading,
  vision,
  hearing,
  attenuation,
  scenario,
  graphview,
];

const app = document.getElementById("app")!;
let cleanup: (() => void) | null = null;

function header(activeId: string | null): HTMLElement {
  const head = el("header", { class: "site" });
  head.append(el("h1", {}, el("a", { href: "#/" }, "Spectrum Lab")));
  const nav = el("nav", { class: "modules", "data-testid": "module-nav" });
  for (const m of MODULES) {
    nav.append(el("a", { href: `#/${m.id}`, class: m.id === activeId ? "active" : "", "data-nav": m.id }, m.title));
  }
  const wrap = el("div", {});
  wrap.append(head, nav);
  return wrap;
}

function renderHome(): void {
  app.replaceChildren(header(null));
  const hero = el("div", {});
  hero.append(
    el("h2", { class: "module-title" }, "The invisible ocean of waves you live inside"),
    el(
      "p",
      { class: "module-sub" },
      "At every instant your room is a deafening superposition of waves across twenty-plus decades of frequency — Wi-Fi, Bluetooth, cellular, the visible glow of the lamp, the infrared pouring off every warm body, sunlight, and (on its own separate axis) sound. So why isn't it chaos? This lab builds the instruments to feel the four-part answer: linearity & superposition, the vastness of frequency space, selective receivers, and information theory's noise floor that coding beats. Every visual is driven by live, benchmarked numerics.",
    ),
  );
  app.append(hero);

  const cards = el("div", { class: "cards", "data-testid": "module-cards" });
  for (const m of MODULES) {
    cards.append(el("a", { class: "card", href: `#/${m.id}`, "data-card": m.id }, el("h3", {}, m.title), el("p", {}, m.subtitle)));
  }
  app.append(cards);

  app.append(el("h2", { class: "module-title" }, "The nine driving questions"));
  const ql = el("ul", { class: "qlist", "data-testid": "question-list" });
  for (const q of QUESTIONS) {
    const li = el("li", { "data-question": q.id });
    li.append(
      el("span", { class: "qid" }, q.id + " "),
      document.createTextNode(q.text + " → "),
    );
    q.routes.forEach((r, i) => {
      if (i > 0) li.append(", ");
      li.append(el("a", { href: `#/${r}` }, MODULES.find((m) => m.id === r)?.title ?? r));
    });
    ql.append(li);
  }
  app.append(ql);
  app.append(footer());
}

function footer(): HTMLElement {
  return el(
    "footer",
    { class: "site" },
    "Every visual is driven by live, benchmarked numerics — no canned animation. Tags: established · engineering-convention · model-simplification · order-of-magnitude · misconception-corrected. The room is chaos; here is exactly why it still works.",
  );
}

function renderModule(m: ModuleDef): void {
  app.replaceChildren(header(m.id));
  app.append(el("h2", { class: "module-title" }, m.title), el("p", { class: "module-sub" }, m.subtitle));
  const rootEl = el("div", { "data-module-root": m.id });
  app.append(rootEl);
  cleanup = m.mount(rootEl);
  app.append(footer());
}

function route(): void {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  for (const m of MODULES) unregisterScene(m.id);
  const hash = location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
  const m = MODULES.find((x) => x.id === hash);
  window.scrollTo(0, 0);
  if (m) renderModule(m);
  else renderHome();
}

installHook();
startClock();
window.addEventListener("hashchange", route);
route();
