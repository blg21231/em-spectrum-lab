import { bandwidth, qualityFactor, resonantFrequency, rlcResponse, tunedReceiver, type Carrier } from "../../sim/resonance";
import { onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "resonance";
export const title = "Tuning In, Tuning Out";
export const subtitle =
  "A resonant receiver passes its own band and rejects the rest by 20 dB or more. Re-tune it across a crowded spectrum of carriers and watch it select just one.";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("resonance"));
  root.append(renderPanel("resonance-tuning"));

  const carriers: Carrier[] = [
    { freqHz: 0.9e6, amp: 1 },
    { freqHz: 1.2e6, amp: 1 },
    { freqHz: 1.6e6, amp: 1 },
    { freqHz: 2.1e6, amp: 1 },
  ];
  const L = 2.5e-4;
  let C = 1e-10;
  let f0 = resonantFrequency(L, C);
  const R = 8;
  const Q = qualityFactor(R, L, C);

  const canvas = makeCanvas(900, 380);
  const fMin = 0.5e6;
  const fMax = 2.6e6;

  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const xOf = (f: number) => ((f - fMin) / (fMax - fMin)) * W;
    // carriers
    for (const c of carriers) {
      ctx.strokeStyle = "#5c6a88";
      ctx.beginPath();
      ctx.moveTo(xOf(c.freqHz), H - 30);
      ctx.lineTo(xOf(c.freqHz), H - 30 - c.amp * (H * 0.6));
      ctx.stroke();
    }
    // RLC response curve scaled to selected
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 600; i++) {
      const f = fMin + ((fMax - fMin) * i) / 600;
      const h = rlcResponse(f, f0, Q);
      const px = (i / 600) * W;
      const py = H - 30 - h * (H * 0.6);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    // passed carriers (amp × |H|)
    const passed = tunedReceiver(carriers, f0, Q);
    for (const p of passed) {
      ctx.fillStyle = "#ff9e5e";
      const h = p.passedAmp * (H * 0.6);
      ctx.fillRect(xOf(p.freqHz) - 3, H - 30 - h, 6, h);
    }
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText(`tuned to f₀ = ${(f0 / 1e6).toFixed(3)} MHz · Q = ${Q.toFixed(0)} · Δf = ${(bandwidth(f0, Q) / 1e3).toFixed(1)} kHz`, 14, 22);
    ctx.fillText("grey = carriers present · orange = what this receiver passes (others suppressed ≥20 dB)", 14, 42);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const tuneControl = slider({
    label: "tuning C (pF)",
    min: 40,
    max: 220,
    step: 1,
    value: C * 1e12,
    format: (v) => `${v.toFixed(0)} pF → ${(resonantFrequency(L, v * 1e-12) / 1e6).toFixed(2)} MHz`,
    testid: "resonance-tune",
    onInput: (v) => {
      C = v * 1e-12;
      f0 = resonantFrequency(L, C);
      draw();
    },
  });
  root.append(sceneBox(canvas, [tuneControl], "resonance-tuner"));
  registerScene("resonance-tuner", () => {
    const passed = tunedReceiver(carriers, f0, Q);
    const best = passed.reduce((a, b) => (b.passedAmp > a.passedAmp ? b : a));
    return { f0, Q, selectedCarrierHz: best.freqHz, selectedAmp: best.passedAmp, maxPassed: best.passedAmp };
  });

  root.append(renderPanel("resonance-ofdm"));
  return () => cleanups.forEach((fn) => fn());
}
