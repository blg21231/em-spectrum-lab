import { basilarPattern, chordSignal, greenwoodFrequency, placeForFrequency } from "../../sim/hearing";
import { onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "hearing";
export const title = "The Ear as a Spectrum Analyzer";
export const subtitle =
  "The cochlea maps frequency to place (Greenwood tonotopy). Play a chord and watch the basilar-membrane excitation pattern light up at each note's place. Sound is mechanical — never electromagnetic.";

const SR = 44100;
const NSAMP = 8192;

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("hearing"));
  root.append(renderPanel("hearing-tonotopy"));

  let rootHz = 220;
  const ratios = [1, 1.5, 2]; // root, fifth, octave

  const freqs = () => ratios.map((r) => rootHz * r);
  const canvas = makeCanvas(900, 380);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const sig = chordSignal(freqs(), SR, NSAMP);
    const pat = basilarPattern(sig, SR);
    const maxE = Math.max(...pat.excitation, 1e-9);
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < pat.x.length; i++) {
      const px = pat.x[i] * W;
      const py = H - 40 - (pat.excitation[i] / maxE) * (H * 0.7);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    // mark expected places
    for (const f of freqs()) {
      const x = placeForFrequency(f) * W;
      ctx.strokeStyle = "#ff9e5e";
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, H - 36);
      ctx.stroke();
    }
    ctx.fillStyle = "#93a1bf";
    ctx.font = "12px system-ui";
    ctx.fillText("apex (≈20 Hz)", 8, H - 18);
    ctx.fillText("base (≈20 kHz)", W - 100, H - 18);
    ctx.fillText(`chord: ${freqs().map((f) => f.toFixed(0) + " Hz").join(", ")} (mechanical, 343 m/s)`, 14, 22);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const control = slider({
    label: "root note (Hz)",
    min: 110,
    max: 880,
    step: 5,
    value: rootHz,
    format: (v) => `${v.toFixed(0)} Hz`,
    testid: "hearing-root",
    onInput: (v) => {
      rootHz = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [control], "hearing-cochlea"));
  registerScene("hearing-cochlea", () => {
    const pat = basilarPattern(chordSignal(freqs(), SR, NSAMP), SR);
    const peakX = pat.peakPlaces.map((p) => p.x);
    return {
      rootHz,
      greenwoodApex: greenwoodFrequency(0),
      greenwoodBase: greenwoodFrequency(1),
      peakCount: pat.peakPlaces.length,
      firstPeakPlace: peakX[0] ?? -1,
    };
  });

  root.append(renderPanel("hearing-mechanical"));
  return () => cleanups.forEach((fn) => fn());
}
