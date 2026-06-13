import { buildScenario, cosmicDoseRate, doseMultiple } from "../../sim/scenario";
import { onTick } from "../clock";
import { el, makeCanvas, renderPanel, renderQuestionBanners, sceneBox } from "../ui";
import { registerScene } from "../hook";

export const id = "scenario";
export const title = "Your Room vs an Airplane";
export const subtitle =
  "Climb and the atmospheric shield thins: cosmic-ray dose rises (~10× at 10 km) while the metal fuselage attenuates external cellular RF. Then the four-part answer to why it all just works.";

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("scenario"));
  root.append(renderPanel("scenario-altitude"));

  let current = buildScenario("room");

  const canvas = makeCanvas(900, 360);
  const draw = () => {
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = canvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    // dose vs altitude curve
    ctx.strokeStyle = "#62d0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const maxH = 12000;
    const maxMult = doseMultiple(maxH);
    for (let i = 0; i <= 600; i++) {
      const h = (maxH * i) / 600;
      const m = doseMultiple(h);
      const px = (i / 600) * W;
      const py = H - 40 - (m / maxMult) * (H * 0.7);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    // operating point
    const px = (current.altitudeM / maxH) * W;
    const m = doseMultiple(current.altitudeM);
    const py = H - 40 - (m / maxMult) * (H * 0.7);
    ctx.fillStyle = "#ff9e5e";
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#93a1bf";
    ctx.font = "13px system-ui";
    ctx.fillText(`${current.label} · altitude ${current.altitudeM} m`, 14, 22);
    ctx.fillStyle = "#ff9e5e";
    ctx.fillText(`cosmic-ray dose ${current.cosmicIndicator.toFixed(1)}× ground (${(cosmicDoseRate(current.altitudeM)).toFixed(3)} µSv/h)`, 14, 42);
    ctx.fillStyle = "#62d0ff";
    ctx.fillText(`external cellular signal ${(current.cellularIndicator * 100).toFixed(0)}% (fuselage attenuation)`, 14, 62);
  };
  draw();
  cleanups.push(onTick(() => draw()));

  const controls: HTMLElement[] = [];
  for (const sid of ["room", "airplane", "street"]) {
    const btn = el("button", { class: sid === current.id ? "active" : "secondary", "data-testid": `scenario-${sid}` }, sid) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      current = buildScenario(sid);
      draw();
      for (const b of controls) (b as HTMLButtonElement).className = "secondary";
      btn.className = "active";
    });
    controls.push(btn);
  }
  root.append(sceneBox(canvas, controls, "scenario-altitude-scene"));
  registerScene(
    "scenario-altitude-scene",
    () => ({
      scenario: current.id,
      altitudeM: current.altitudeM,
      cosmicIndicator: current.cosmicIndicator,
      cellularIndicator: current.cellularIndicator,
    }),
    {
      setScenario: (s) => {
        current = buildScenario(String(s));
        draw();
        return current.id;
      },
    },
  );

  root.append(renderPanel("scenario-synthesis"));
  return () => cleanups.forEach((fn) => fn());
}
