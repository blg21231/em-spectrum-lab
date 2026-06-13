import { amDemodulate, amModulate, message } from "../../sim/modulation";
import { onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "modulation";
export const title = "Riding the Carrier";
export const subtitle =
  "How information gets put onto a wave and pulled back off. Vary the message and watch the carrier, the modulated wave, and the recovered message respond live.";

const SR = 8000;
const NSAMP = 1600;

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("modulation"));
  root.append(renderPanel("modulation-roundtrip"));

  let msgFreq = 80;
  let depth = 0.8;
  const carrier = 800;

  const canvas = makeCanvas(900, 440);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const msg = message(NSAMP, SR, [msgFreq]);
    const mod = amModulate(msg, SR, carrier, depth);
    const rec = amDemodulate(mod, SR, carrier, depth);
    const band = (arr: Float64Array, yc: number, col: string, scale: number) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < NSAMP; i++) {
        const px = (i / (NSAMP - 1)) * W;
        const py = yc - arr[i] * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    const third = H / 3;
    band(msg, third * 0.5, "#62d0ff", third * 0.32);
    band(mod, third * 1.5, "#ff9e5e", third * 0.28);
    band(rec, third * 2.5, "#b48cff", third * 0.32);
    ctx.fillStyle = "#93a1bf";
    ctx.font = "12px system-ui";
    ctx.fillText("message (blue)", 12, 16);
    ctx.fillText("AM modulated carrier (orange)", 12, third + 16);
    ctx.fillText("recovered message (purple)", 12, 2 * third + 16);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const msgControl = slider({
    label: "message frequency (Hz)",
    min: 30,
    max: 200,
    step: 5,
    value: msgFreq,
    format: (v) => `${v.toFixed(0)} Hz`,
    testid: "modulation-msg",
    onInput: (v) => {
      msgFreq = v;
      draw();
    },
  });
  const depthControl = slider({
    label: "modulation depth",
    min: 0.2,
    max: 1,
    step: 0.05,
    value: depth,
    testid: "modulation-depth",
    onInput: (v) => {
      depth = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [msgControl, depthControl], "modulation-roundtrip-scene"));
  registerScene("modulation-roundtrip-scene", () => {
    const msg = message(NSAMP, SR, [msgFreq]);
    const mod = amModulate(msg, SR, carrier, depth);
    const rec = amDemodulate(mod, SR, carrier, depth);
    // recovered amplitude (peak-to-peak proxy)
    let mn = Infinity;
    let mx = -Infinity;
    for (let i = 200; i < NSAMP - 200; i++) {
      mn = Math.min(mn, rec[i]);
      mx = Math.max(mx, rec[i]);
    }
    return { msgFreq, depth, recoveredPeakToPeak: mx - mn, occupiedBandwidth: 2 * msgFreq };
  });
  return () => cleanups.forEach((fn) => fn());
}
