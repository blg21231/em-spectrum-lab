import {
  bandForFreq,
  freqFromWavelength,
  ionizationClass,
  mechanicalSound,
  photonEnergyEv,
  wavelengthFromFreq,
} from "../../sim/spectrum";
import { onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "spectrum";
export const title = "One Ruler, Twenty-Two Decades";
export const subtitle =
  "The whole electromagnetic spectrum on a log-frequency axis (c=fλ, E=hf), with the ionizing boundary — and sound on its own mechanical axis, never on the EM ruler.";

const LOG_MIN = 3;
const LOG_MAX = 25;

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("spectrum"));
  root.append(renderPanel("spec-ruler"));

  const canvas = makeCanvas(900, 300);
  let logF = Math.log10(freqFromWavelength(550e-9)); // start at visible

  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const xOf = (lf: number) => ((lf - LOG_MIN) / (LOG_MAX - LOG_MIN)) * W;
    // band shading
    const bands: [number, number, string, string][] = [
      [3, 9.48, "#1d3a5f", "radio"],
      [9.48, 11.48, "#1f4d5f", "micro"],
      [11.48, 14.6, "#5f3a1d", "IR"],
      [14.6, 14.9, "#3a5f1d", "vis"],
      [14.9, 16.48, "#4a1d5f", "UV"],
      [16.48, 19.48, "#5f1d3a", "X-ray"],
      [19.48, 25, "#5f1d1d", "γ"],
    ];
    for (const [lo, hi, col, label] of bands) {
      ctx.fillStyle = col;
      ctx.fillRect(xOf(lo), 40, xOf(hi) - xOf(lo), H - 110);
      ctx.fillStyle = "#cdd6ea";
      ctx.font = "12px system-ui";
      ctx.fillText(label, xOf(lo) + 4, 56);
    }
    // ionizing boundary (~10 eV)
    const f10 = 10 * 1.602e-19 / 6.626e-34;
    const xIon = xOf(Math.log10(f10));
    ctx.strokeStyle = "#ff7e96";
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(xIon, 30);
    ctx.lineTo(xIon, H - 60);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff7e96";
    ctx.fillText("← non-ionizing | ionizing →", xIon - 90, 28);
    // marker (with a highlight band so moving it changes the render substantially)
    const x = xOf(logF);
    ctx.fillStyle = "rgba(98,208,255,0.22)";
    ctx.fillRect(x - 18, 36, 36, H - 92);
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.lineTo(x, H - 56);
    ctx.stroke();
    ctx.lineWidth = 1;
    const f = Math.pow(10, logF);
    ctx.fillStyle = "#e8eef9";
    ctx.font = "13px system-ui";
    const lam = wavelengthFromFreq(f);
    const lamStr = lam > 1 ? `${lam.toExponential(2)} m` : lam > 1e-3 ? `${(lam * 1e3).toFixed(2)} mm` : lam > 1e-6 ? `${(lam * 1e6).toFixed(2)} µm` : `${(lam * 1e9).toFixed(1)} nm`;
    ctx.fillText(`f = ${f.toExponential(2)} Hz · λ = ${lamStr} · E = ${photonEnergyEv(f).toExponential(2)} eV · ${bandForFreq(f)} · ${ionizationClass(f)}`, 14, H - 30);
    // sound on a SEPARATE axis
    const s = mechanicalSound(1000);
    ctx.fillStyle = "#ffb86e";
    ctx.fillText(`Sound (mechanical, separate axis): 1 kHz → λ = ${s.wavelengthM.toFixed(3)} m at 343 m/s — NOT on the EM ruler`, 14, H - 10);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const control = slider({
    label: "log₁₀(frequency / Hz)",
    min: LOG_MIN,
    max: LOG_MAX,
    step: 0.05,
    value: logF,
    format: (v) => `10^${v.toFixed(1)} Hz`,
    testid: "spectrum-logf",
    onInput: (v) => {
      logF = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [control], "spectrum-ruler"));
  registerScene("spectrum-ruler", () => {
    const f = Math.pow(10, logF);
    return { logF, freqHz: f, wavelengthM: wavelengthFromFreq(f), photonEv: photonEnergyEv(f), band: bandForFreq(f), ionization: ionizationClass(f) };
  });

  root.append(renderPanel("spec-ionizing"));
  root.append(renderPanel("spec-5g"));
  root.append(renderPanel("spec-sound"));
  return () => cleanups.forEach((fn) => fn());
}
