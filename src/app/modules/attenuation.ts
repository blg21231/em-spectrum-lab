import { ATMOSPHERIC_WINDOWS, beerLambert, CONDUCTORS, conductorAttenuation, skinDepth } from "../../sim/attenuation";
import { onTick } from "../clock";
import { el, makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "attenuation";
export const title = "What Blocks What";
export const subtitle =
  "Skin depth and Faraday cages, Beer–Lambert for X-rays, and the atmosphere's transparency windows. Sweep frequency or thickness and watch transmitted vs blocked respond.";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("attenuation"));
  root.append(renderPanel("atten-skin"));

  const cu = CONDUCTORS.find((c) => c.id === "copper")!;
  let logF = 9; // 1 GHz
  let thicknessUm = 5;

  const canvas = makeCanvas(900, 360);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    // transmission vs thickness at current frequency
    const f = Math.pow(10, logF);
    const delta = skinDepth(f, cu.sigma, cu.muR);
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const maxX = 20e-6;
    for (let i = 0; i <= 600; i++) {
      const x = (maxX * i) / 600;
      const t = conductorAttenuation(x, f, cu.sigma, cu.muR);
      const px = (i / 600) * W;
      const py = H - 40 - t * (H * 0.7);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    // operating point
    const t = conductorAttenuation(thicknessUm * 1e-6, f, cu.sigma, cu.muR);
    const px = ((thicknessUm * 1e-6) / maxX) * W;
    const py = H - 40 - t * (H * 0.7);
    ctx.fillStyle = "#ff9e5e";
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText(`copper @ ${(f / 1e9).toFixed(2)} GHz · skin depth δ = ${(delta * 1e6).toFixed(2)} µm`, 14, 22);
    ctx.fillText(`through ${thicknessUm} µm: ${(t * 100).toFixed(1)}% field transmitted (${(t * 100) < 1 ? "Faraday-shielded" : "leaks"})`, 14, 42);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const fControl = slider({
    label: "frequency (log Hz)",
    min: 7,
    max: 11,
    step: 0.05,
    value: logF,
    format: (v) => `${Math.pow(10, v).toExponential(1)} Hz`,
    testid: "atten-freq",
    onInput: (v) => {
      logF = v;
      draw();
    },
  });
  const tControl = slider({
    label: "metal thickness (µm)",
    min: 0.5,
    max: 20,
    step: 0.5,
    value: thicknessUm,
    format: (v) => `${v.toFixed(1)} µm`,
    testid: "atten-thickness",
    onInput: (v) => {
      thicknessUm = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [fControl, tControl], "attenuation-shield"));
  registerScene("attenuation-shield", () => {
    const f = Math.pow(10, logF);
    return {
      freqHz: f,
      skinDepthUm: skinDepth(f, cu.sigma, cu.muR) * 1e6,
      transmission: conductorAttenuation(thicknessUm * 1e-6, f, cu.sigma, cu.muR),
      beerLambertHalf: beerLambert(0.693, 1),
    };
  });

  // atmospheric windows table
  const tableWrap = el("section", { "data-panel": "atten-windows-table", "data-tag": "established" });
  tableWrap.append(el("span", { class: "tag-chip tag-established" }, "established"), el("h3", {}, "Atmospheric windows"));
  const ul = el("ul", { class: "data-list" });
  for (const w of ATMOSPHERIC_WINDOWS) {
    ul.append(el("li", { "data-window": w.band }, el("span", {}, w.band + " "), el("b", {}, w.classification), el("span", { class: "prov" }, w.note)));
  }
  tableWrap.append(ul);
  root.append(tableWrap);

  root.append(renderPanel("atten-beer"));
  return () => cleanups.forEach((fn) => fn());
}
