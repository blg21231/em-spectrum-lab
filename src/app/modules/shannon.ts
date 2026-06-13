import { capacity, noiseFloorDbm } from "../../sim/shannon";
import { onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "shannon";
export const title = "The Noise Floor & the Speed Limit";
export const subtitle =
  "Thermal noise sets a floor (kTB ≈ −174 dBm/Hz); Shannon caps the error-free rate at C = B·log₂(1+S/N). Slide S/N and bandwidth and watch capacity respond exactly as the formula says.";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("shannon"));
  root.append(renderPanel("shannon-floor"));

  let snrDb = 20;
  let bMHz = 20;

  const canvas = makeCanvas(900, 380);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const B = bMHz * 1e6;
    // capacity vs SNR curve at current B
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const cMax = capacity(B, Math.pow(10, 40 / 10));
    for (let i = 0; i <= 600; i++) {
      const db = -10 + (50 * i) / 600;
      const c = capacity(B, Math.pow(10, db / 10));
      const px = (i / 600) * W;
      const py = H - 40 - (c / cMax) * (H * 0.7);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // current operating point
    const cNow = capacity(B, Math.pow(10, snrDb / 10));
    const px = ((snrDb + 10) / 50) * W;
    const py = H - 40 - (cNow / cMax) * (H * 0.7);
    ctx.fillStyle = "#ff9e5e";
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText(`B = ${bMHz} MHz · S/N = ${snrDb} dB · capacity C = ${(cNow / 1e6).toFixed(1)} Mbit/s`, 14, 22);
    ctx.fillText(`noise floor N = kTB = ${noiseFloorDbm(290, B).toFixed(1)} dBm`, 14, 42);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const snrControl = slider({
    label: "S/N (dB)",
    min: -5,
    max: 40,
    step: 1,
    value: snrDb,
    format: (v) => `${v} dB`,
    testid: "shannon-snr",
    onInput: (v) => {
      snrDb = v;
      draw();
    },
  });
  const bControl = slider({
    label: "bandwidth (MHz)",
    min: 1,
    max: 100,
    step: 1,
    value: bMHz,
    format: (v) => `${v} MHz`,
    testid: "shannon-bw",
    onInput: (v) => {
      bMHz = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [snrControl, bControl], "shannon-capacity"));
  registerScene("shannon-capacity", () => ({
    snrDb,
    bandwidthMHz: bMHz,
    capacityBps: capacity(bMHz * 1e6, Math.pow(10, snrDb / 10)),
    noiseFloorDbm: noiseFloorDbm(290, bMHz * 1e6),
  }));
  return () => cleanups.forEach((fn) => fn());
}
