import * as THREE from "three";
import { ANALYZER_BINS, LOG_F_MAX, LOG_F_MIN, analyzer, bandPower, defaultSources, perceivedBrightness, type PerceptionView, type RoomSource } from "../../sim/room";
import { onTick } from "../clock";
import { el, makeCanvas, renderPanel, renderQuestionBanners, sceneBox, toggleButton } from "../ui";
import { registerScene } from "../hook";

export const id = "room";
export const title = "The Room (everything at once)";
export const subtitle =
  "A live 3D room flooded with real sources at their real bands. Toggle each one and watch the superposed spectrum analyzer change in exactly that band — then switch the perception filter to see it as an eye, a radio, or a thermal camera.";

const VIEW_BG: Record<PerceptionView, number> = { eye: 0x0a1428, radio: 0x04140d, thermal: 0x1e0a04 };

export function mount(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  root.append(...renderQuestionBanners("room"));
  root.append(renderPanel("room-overview"));

  const sources: RoomSource[] = defaultSources();
  let view: PerceptionView = "eye";

  // ── Three.js room (load-bearing WebGL) ───────────────────────────────────
  const glCanvas = makeCanvas(900, 380);
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
  renderer.setSize(900, 380, false);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VIEW_BG.eye);
  const camera = new THREE.PerspectiveCamera(55, 900 / 380, 0.1, 100);
  camera.position.set(4.2, 3.0, 5.4);
  camera.lookAt(0, 0.6, 0);

  const ambient = new THREE.AmbientLight(0x404a66, 1.2);
  scene.add(ambient);
  const ceil = new THREE.PointLight(0xfff0d0, 12, 30);
  ceil.position.set(0, 2.6, 0);
  scene.add(ceil);

  // room shell
  const roomGeo = new THREE.BoxGeometry(6, 3.2, 6);
  const roomMat = new THREE.MeshStandardMaterial({ color: 0x223049, side: THREE.BackSide, roughness: 0.9 });
  scene.add(new THREE.Mesh(roomGeo, roomMat));

  // source markers (each tied to a RoomSource)
  const markers = new Map<string, THREE.Mesh>();
  const positions: Record<string, [number, number, number]> = {
    wifi: [-2, 2.2, -2],
    bluetooth: [2, 0.4, -1.6],
    cellular: [2.2, 1.4, 2],
    light: [0, 2.5, 0],
    body: [-1, -0.2, 1.4],
    sun: [2.7, 1.6, -2.7],
  };
  for (const s of sources) {
    const isBody = s.id === "body";
    const geo = isBody ? new THREE.CapsuleGeometry(0.35, 0.9, 6, 12) : new THREE.SphereGeometry(0.28, 20, 20);
    const mat = new THREE.MeshStandardMaterial({ color: 0x62d0ff, emissive: 0x000000, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    const p = positions[s.id] ?? [0, 0, 0];
    mesh.position.set(p[0], p[1], p[2]);
    scene.add(mesh);
    markers.set(s.id, mesh);
  }

  // ── spectrum analyzer overlay (2D canvas, driven by the room core) ────────
  const analyzerCanvas = makeCanvas(900, 200);
  let trace: number[] = analyzer(sources);

  const TOGGLE_RECOMPUTE = "ROOM_TOGGLE_RECOMPUTE";
  const recomputeAnalyzer = () => {
    // The analyzer is recomputed from the current source set on every toggle — true
    // superposition, not a canned per-source delta. M13 flips the selector below to
    // "ROOM_TOGGLE_NOOP", which no longer matches TOGGLE_RECOMPUTE so the trace stops
    // tracking the sources (the toggle becomes a no-op).
    const selector = "ROOM_TOGGLE_RECOMPUTE";
    if (selector === TOGGLE_RECOMPUTE) {
      trace = analyzer(sources);
    }
  };

  const logFofBin = (b: number) => LOG_F_MIN + ((LOG_F_MAX - LOG_F_MIN) * b) / (ANALYZER_BINS - 1);

  const drawAnalyzer = () => {
    const ctx = analyzerCanvas.getContext("2d")!;
    const { width: W, height: H } = analyzerCanvas;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, W, H);
    const maxV = Math.max(...trace, 1e-9);
    // bars
    for (let b = 0; b < ANALYZER_BINS; b++) {
      const x = (b / ANALYZER_BINS) * W;
      const h = (trace[b] / maxV) * (H - 36);
      const lf = logFofBin(b);
      // color by band
      const hue = lf < 11.5 ? 200 : lf < 14.5 ? 30 : 280;
      ctx.fillStyle = `hsl(${hue},80%,60%)`;
      ctx.fillRect(x, H - 18 - h, W / ANALYZER_BINS + 0.5, h);
    }
    // axis labels
    ctx.fillStyle = "#93a1bf";
    ctx.font = "12px system-ui";
    const tick = (lf: number, label: string) => {
      const x = ((lf - LOG_F_MIN) / (LOG_F_MAX - LOG_F_MIN)) * W;
      ctx.fillText(label, x - 14, H - 4);
    };
    tick(9, "1 GHz");
    tick(11, "0.1 THz");
    tick(13, "10 THz");
    tick(15, "PHz/vis");
    ctx.fillText("superposed power vs frequency (log) — Σ of enabled sources", 12, 16);
  };

  const applyView = () => {
    scene.background = new THREE.Color(VIEW_BG[view]);
    // dim the ambient/ceiling light in non-eye views so the perceptual contrast is strong
    ambient.intensity = view === "eye" ? 1.2 : 0.25;
    ceil.intensity = view === "eye" ? 12 : 1;
    for (const s of sources) {
      const mesh = markers.get(s.id)!;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const bright = s.enabled ? perceivedBrightness(s, view) : 0;
      // emissive intensity reflects how this receiver perceives the source
      const col = view === "thermal" ? new THREE.Color(1, 0.4, 0.15) : view === "radio" ? new THREE.Color(0.3, 1, 0.6) : new THREE.Color(0.6, 0.8, 1);
      mat.emissive = col.clone().multiplyScalar(Math.min(1.5, bright * 1.4));
      mat.color = new THREE.Color(0x2a3a55).lerp(col, 0.3 + 0.6 * bright);
      // scale a touch with brightness so the perceived blaze is visible
      const sc = 1 + 0.4 * bright;
      mesh.scale.set(sc, sc, sc);
      mesh.visible = true;
    }
  };
  applyView();

  let rot = 0;
  const renderGl = () => {
    rot += 0.0;
    camera.position.x = Math.cos(rot) * 7;
    renderer.render(scene, camera);
  };

  recomputeAnalyzer();
  drawAnalyzer();
  renderGl();

  cleanups.push(
    onTick((dt) => {
      rot += dt * 1.1;
      camera.position.x = Math.cos(rot) * 7;
      camera.position.z = Math.sin(rot) * 7;
      camera.position.y = 3.0 + Math.sin(rot * 0.7) * 0.8;
      camera.lookAt(0, 0.6, 0);
      renderer.render(scene, camera);
    }),
  );

  // ── controls: source toggles + perception view ───────────────────────────
  const controls: HTMLElement[] = [];
  for (const s of sources) {
    controls.push(
      toggleButton(
        s.label,
        s.enabled,
        (on) => {
          s.enabled = on;
          recomputeAnalyzer();
          drawAnalyzer();
          applyView();
        },
        `toggle-${s.id}`,
      ),
    );
  }
  const viewRow = el("div", { class: "controls", style: "border-top:0;padding-top:0" });
  for (const v of ["eye", "radio", "thermal"] as PerceptionView[]) {
    const btn = el("button", { class: v === view ? "active" : "secondary", "data-testid": `view-${v}` }, v) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      view = v;
      applyView();
      renderGl();
      for (const b of viewRow.querySelectorAll("button")) b.className = "secondary";
      btn.className = "active";
    });
    viewRow.append(btn);
  }

  const glBox = sceneBox(glCanvas, controls, "room-3d");
  root.append(glBox);
  glBox.append(viewRow);
  root.append(sceneBox(analyzerCanvas, [], "room-analyzer"));

  root.append(renderPanel("room-superposition"));
  root.append(renderPanel("room-perception"));

  registerScene(
    "room-analyzer",
    () => ({
      enabledCount: sources.filter((s) => s.enabled).length,
      wifiBandPower: bandPower(trace, 2.2e9, 2.7e9),
      visibleBandPower: bandPower(trace, 4e14, 7.9e14),
      totalPower: trace.reduce((a, b) => a + b, 0),
      view,
    }),
    {
      toggleSource: (idArg, on) => {
        const s = sources.find((x) => x.id === idArg);
        if (s) {
          s.enabled = Boolean(on);
          recomputeAnalyzer();
          drawAnalyzer();
          applyView();
        }
        return bandPower(trace, 2.2e9, 2.7e9);
      },
      setView: (v) => {
        view = v as PerceptionView;
        applyView();
        renderGl();
        return view;
      },
    },
  );
  registerScene("room-3d", () => ({ view, enabledCount: sources.filter((s) => s.enabled).length }));

  return () => {
    cleanups.forEach((fn) => fn());
    renderer.dispose();
  };
}
