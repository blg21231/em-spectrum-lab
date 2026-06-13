import { dsssTrace, processingGainDb, simulateDsss } from "../../sim/spreading";
import { clock, onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "spreading";
export const title = "Reading Below the Noise";
export const subtitle =
  "A GPS signal arrives ~20 dB below the noise floor — invisible. Correlate against its known code and it emerges. The concrete answer to \"the signal is weaker than the noise, yet the phone reads it.\"";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("spreading"));
  root.append(renderPanel("spreading-magic"));

  const canvas = makeCanvas(900, 460);
  let rawSnrDb = -15;
  const N = 127;
  let result = simulateDsss(1200, N, rawSnrDb, 2024);
  let trace = dsssTrace(24, N, rawSnrDb, 99);

  const recompute = () => {
    result = simulateDsss(1200, N, rawSnrDb, 2024);
    trace = dsssTrace(24, N, rawSnrDb, 99);
  };

  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const halfH = H / 2;
    // top: buried-in-noise received signal
    ctx.strokeStyle = "#5c6a88";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const rxMax = Math.max(...trace.rx.map(Math.abs), 1);
    for (let i = 0; i < trace.rx.length; i++) {
      const x = (i / (trace.rx.length - 1)) * W;
      const y = halfH * 0.5 - (trace.rx[i] / rxMax) * (halfH * 0.4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // bottom: despread correlation peaks
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2;
    const corrMax = Math.max(...trace.correlation.map(Math.abs), 1e-9);
    ctx.beginPath();
    for (let i = 0; i < trace.correlation.length; i++) {
      const x = (i / (trace.correlation.length - 1)) * W;
      const y = H - 30 - (trace.correlation[i] / corrMax) * (halfH * 0.65) - halfH * 0.0;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // clock-driven correlation-window sweep (freezes when paused)
    const sweepX = ((clock.t * 0.25) % 1) * W;
    ctx.fillStyle = "rgba(255,231,176,0.18)";
    ctx.fillRect(sweepX - 14, 0, 28, H);
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText(`raw SNR = ${rawSnrDb.toFixed(0)} dB · processing gain = ${processingGainDb(N).toFixed(1)} dB (N=${N})`, 14, 20);
    ctx.fillText(`top: received signal (buried in noise) · bottom: despread correlation (clean ± peaks)`, 14, halfH + 4);
    ctx.fillStyle = "#ff9e5e";
    ctx.fillText(`despread BER ${(result.despreadBer * 100).toFixed(2)}%  vs  control BER ${(result.controlBer * 100).toFixed(1)}% (chance)`, 14, H - 8);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const snrControl = slider({
    label: "raw SNR (dB)",
    min: -25,
    max: 0,
    step: 1,
    value: -15,
    format: (v) => `${v.toFixed(0)} dB`,
    testid: "spreading-snr",
    onInput: (v) => {
      rawSnrDb = v;
      recompute();
      draw();
    },
  });
  root.append(sceneBox(canvas, [snrControl], "spreading-despread"));
  registerScene(
    "spreading-despread",
    () => ({
      rawSnrDb,
      despreadBer: result.despreadBer,
      controlBer: result.controlBer,
      processingGainDb: result.processingGainDb,
      despreadPeakSnrDb: result.despreadPeakSnrDb,
    }),
    {
      setSnr: (v) => {
        rawSnrDb = Number(v);
        recompute();
        draw();
        return rawSnrDb;
      },
    },
  );
  return () => cleanups.forEach((fn) => fn());
}
