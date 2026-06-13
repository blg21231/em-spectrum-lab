// Global sim clock: every physics scene advances only when this clock ticks.
// Freezing it must freeze the physics pixels (AC13's freeze/resume limb).

export interface SimClock {
  t: number;
  paused: boolean;
}

export const clock: SimClock = { t: 0, paused: false };

const subscribers = new Set<(dt: number) => void>();
let last = performance.now();
let rafId = 0;

function tick(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!clock.paused) {
    clock.t += dt;
    for (const fn of subscribers) fn(dt);
  }
  rafId = requestAnimationFrame(tick);
}

export function startClock(): void {
  if (!rafId) {
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }
}

export function onTick(fn: (dt: number) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function setPaused(p: boolean): void {
  clock.paused = p;
  last = performance.now();
}
