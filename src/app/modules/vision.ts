import { coneResponse, coneToRgb, gaussianSpd, lSensitivity, mSensitivity, sSensitivity } from "../../sim/vision";
import { onTick } from "../clock";
import { makeCanvas, renderPanel, renderQuestionBanners, sceneBox, slider } from "../ui";
import { registerScene } from "../hook";

export const id = "vision";
export const title = "Three Filters Make a Color";
export const subtitle =
  "The eye reduces any spectrum to just three numbers — S, M, L cone responses. Move the spectrum and watch the perceived color shift; distinct spectra can land on the same three values (metamerism).";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("vision"));
  root.append(renderPanel("vision-cones"));

  let centerNm = 550;
  const sigma = 35;

  const canvas = makeCanvas(900, 380);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const xOf = (nm: number) => ((nm - 400) / 300) * W;
    // cone curves
    const curve = (fn: (l: number) => number, col: string) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let l = 400; l <= 700; l += 2) {
        const px = xOf(l);
        const py = H - 60 - fn(l) * (H * 0.5);
        if (l === 400) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    curve((l) => sSensitivity(l), "#6ea8ff");
    curve((l) => mSensitivity(l), "#3fb68b");
    curve((l) => lSensitivity(l), "#ff7e96");
    // the SPD
    const spd = gaussianSpd(centerNm, sigma);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const { lambdaNm, power } of spd) {
      const px = xOf(lambdaNm);
      const py = H - 60 - power * (H * 0.5);
      if (lambdaNm === spd[0].lambdaNm) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    // perceived color swatch
    const resp = coneResponse(spd);
    const [r, g, b] = coneToRgb(resp);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(W - 120, 20, 100, 60);
    ctx.fillStyle = "#93a1bf";
    ctx.font = "12px system-ui";
    ctx.fillText("perceived color", W - 120, 96);
    ctx.fillText(`spectrum center ${centerNm} nm → S=${resp.S.toFixed(2)} M=${resp.M.toFixed(2)} L=${resp.L.toFixed(2)}`, 14, H - 12);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const control = slider({
    label: "spectrum center (nm)",
    min: 420,
    max: 660,
    step: 2,
    value: centerNm,
    format: (v) => `${v.toFixed(0)} nm`,
    testid: "vision-center",
    onInput: (v) => {
      centerNm = v;
      draw();
    },
  });
  root.append(sceneBox(canvas, [control], "vision-color"));
  registerScene("vision-color", () => {
    const resp = coneResponse(gaussianSpd(centerNm, sigma));
    const [r, g, b] = coneToRgb(resp);
    return { centerNm, S: resp.S, M: resp.M, L: resp.L, red: r, green: g, blue: b };
  });

  root.append(renderPanel("vision-metamerism"));
  return () => cleanups.forEach((fn) => fn());
}
