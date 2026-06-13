import { planckRadiance, wienPeakWavelength } from "../../sim/thermal";
import { clock, onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "thermal";
export const title = "The Glow of Warm Things";
export const subtitle =
  "Everything above absolute zero radiates a Planck spectrum — your room glows in the far-IR, the Sun in the visible. Plus the difference between thermal radiation and \"thermal air.\"";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("thermal"));
  root.append(renderPanel("thermal-planck"));

  const canvas = makeCanvas(900, 460);
  let T = 300;
  let peakNm = wienPeakWavelength(T) * 1e9;

  // log-wavelength axis from 100 nm to 100 µm
  const lamMinNm = 100;
  const lamMaxNm = 100_000;
  const nPts = 600;
  const lam = new Float64Array(nPts);
  for (let i = 0; i < nPts; i++) {
    const u = i / (nPts - 1);
    lam[i] = lamMinNm * Math.pow(lamMaxNm / lamMinNm, u);
  }

  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    // compute curve (normalized to its own max for display)
    const vals = new Float64Array(nPts);
    let maxV = 0;
    for (let i = 0; i < nPts; i++) {
      vals[i] = planckRadiance(lam[i] * 1e-9, T);
      if (vals[i] > maxV) maxV = vals[i];
    }
    // visible band shading (380–750 nm)
    const xOf = (nm: number) => (Math.log(nm / lamMinNm) / Math.log(lamMaxNm / lamMinNm)) * W;
    ctx.fillStyle = "rgba(120,180,255,0.10)";
    ctx.fillRect(xOf(380), 0, xOf(750) - xOf(380), H);
    // curve
    ctx.strokeStyle = "#ff9e5e";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < nPts; i++) {
      const x = (i / (nPts - 1)) * W;
      const y = H - 30 - (vals[i] / maxV) * (H * 0.8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // peak marker
    peakNm = wienPeakWavelength(T) * 1e9;
    const px = xOf(peakNm);
    ctx.strokeStyle = "#62d0ff";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.stroke();
    ctx.setLineDash([]);
    // clock-driven emission sweep across the spectrum (freezes when the sim clock pauses)
    const sweepU = (clock.t * 0.3) % 1;
    const si = Math.floor(sweepU * (nPts - 1));
    const sx = (si / (nPts - 1)) * W;
    const sy = H - 30 - (vals[si] / maxV) * (H * 0.8);
    ctx.fillStyle = "rgba(255,231,176,0.16)";
    ctx.fillRect(sx - 16, 0, 32, H);
    ctx.fillStyle = "#ffe7b0";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText(`T = ${T.toFixed(0)} K · Wien peak λ_max = ${peakNm < 1000 ? peakNm.toFixed(0) + " nm" : (peakNm / 1000).toFixed(2) + " µm"}`, 14, 22);
    ctx.fillText("blue band = visible (380–750 nm) · curve = Planck spectral radiance (log-λ)", 14, 42);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const tControl = slider({
    label: "temperature T (K)",
    min: 100,
    max: 6000,
    step: 10,
    value: 300,
    format: (v) => `${v.toFixed(0)} K`,
    testid: "thermal-temp",
    onInput: (v) => {
      T = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [tControl], "thermal-planck-scene"));
  registerScene(
    "thermal-planck-scene",
    () => ({ T, peakNm, peakWavelengthM: wienPeakWavelength(T) }),
    {
      setT: (v) => {
        T = Number(v);
        draw();
        return T;
      },
    },
  );

  root.append(renderPanel("thermal-convection"));
  root.append(renderPanel("thermal-microwave"));
  return () => cleanups.forEach((fn) => fn());
}
