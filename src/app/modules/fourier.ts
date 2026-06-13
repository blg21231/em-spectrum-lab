import { spectrum, synth, type Tone } from "../../sim/fourier";
import { onTick } from "../clock";
import { el, makeCanvas, renderPanel, renderQuestionBanners, sceneBox, toggleButton } from "../ui";
import { registerScene } from "../hook";

export const id = "fourier";
export const title = "Why the Cacophony Is Separable";
export const subtitle =
  "Sum many sinusoids into one messy composite — then watch the Fourier transform decompose it losslessly back into its components. The computational heart of \"it isn't chaos.\"";

const N = 512;

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("fourier"));
  root.append(renderPanel("fourier-linearity"));

  const allTones: Tone[] = [
    { freqBin: 8, amp: 1.0, phase: 0 },
    { freqBin: 21, amp: 0.7, phase: 0.6 },
    { freqBin: 40, amp: 0.9, phase: 1.2 },
    { freqBin: 67, amp: 0.5, phase: 2.0 },
    { freqBin: 100, amp: 0.8, phase: 0.3 },
  ];
  const enabled = allTones.map(() => true);

  const canvas = makeCanvas(900, 440);

  const activeTones = () => allTones.filter((_, i) => enabled[i]);

  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const x = synth(N, activeTones());
    const halfH = H / 2;
    // top: composite time signal
    ctx.strokeStyle = "#ff9e5e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const maxA = Math.max(...Array.from(x).map(Math.abs), 1);
    for (let i = 0; i < N; i++) {
      const px = (i / (N - 1)) * W;
      const py = halfH * 0.5 - (x[i] / maxA) * (halfH * 0.4);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // bottom: spectrum (the decomposition)
    const spec = spectrum(x);
    const maxM = Math.max(...spec.map((s) => s.magnitude), 1e-9);
    ctx.fillStyle = "#62d0ff";
    for (const b of spec) {
      if (b.bin === 0) continue;
      const px = (b.bin / (N / 2)) * W;
      const h = (b.magnitude / maxM) * (halfH * 0.8);
      ctx.fillRect(px, H - 24 - h, 3, h);
    }
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText("top: messy composite (sum of sinusoids) · bottom: FFT decomposition (one peak per component)", 12, 16);
    ctx.fillText(`${activeTones().length} components active`, 12, halfH + 4);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const controls: HTMLElement[] = allTones.map((t, i) =>
    toggleButton(
      `bin ${t.freqBin}`,
      true,
      (on) => {
        enabled[i] = on;
        draw();
      },
      `tone-${t.freqBin}`,
    ),
  );
  root.append(sceneBox(canvas, controls, "fourier-decompose"));
  registerScene("fourier-decompose", () => {
    const spec = spectrum(synth(N, activeTones()));
    const peaks = spec.filter((s) => s.bin > 0 && s.magnitude > 0.25).map((s) => s.bin);
    return { activeCount: activeTones().length, peakBins: peaks, peakCount: peaks.length };
  });
  void el;
  return () => cleanups.forEach((fn) => fn());
}
