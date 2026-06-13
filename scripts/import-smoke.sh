#!/usr/bin/env bash
# E4 / AC17: every sim core imports cleanly in bare Node — no DOM, no WebGL, no bundler.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
npx tsc src/sim/*.ts src/content/*.ts --outDir "$OUT" --module esnext --target es2022 --skipLibCheck --noEmit false
# bare ESM needs explicit extensions on relative imports
find "$OUT" -name '*.js' -exec sed -i -E 's|(from "\.{1,2}/[^"]+)";|\1.js";|g' {} +
echo '{ "type": "module" }' > "$OUT/package.json"
node - <<EOF
const mods = [
  "spectrum", "fourier", "thermal", "resonance", "modulation", "shannon",
  "spreading", "vision", "hearing", "attenuation", "scenario", "room", "fft",
];
for (const m of mods) {
  const mod = await import("$OUT/sim/" + m + ".js");
  if (!mod || Object.keys(mod).length === 0) throw new Error("empty module: " + m);
}
const content = ["graph", "questions", "panels"];
for (const m of content) {
  const mod = await import("$OUT/content/" + m + ".js");
  if (!mod || Object.keys(mod).length === 0) throw new Error("empty module: " + m);
}
console.log("import-smoke: all sim cores + content modules import cleanly in bare Node");
EOF
