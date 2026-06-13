// Testability hook (the live-scene-graph lesson): e2e asserts against facts computed
// from the running scenes, plus the global sim clock — never against static markup alone.

import { clock, setPaused } from "./clock";

type FactFn = () => Record<string, unknown>;
type ActionFn = (...args: unknown[]) => unknown;
const sceneFacts = new Map<string, FactFn>();
const sceneActions = new Map<string, Record<string, ActionFn>>();

export function registerScene(id: string, facts: FactFn, actions?: Record<string, ActionFn>): void {
  sceneFacts.set(id, facts);
  if (actions) sceneActions.set(id, actions);
}

export function unregisterScene(id: string): void {
  sceneFacts.delete(id);
  sceneActions.delete(id);
}

export interface LabHook {
  version: number;
  clock: { readonly t: number; readonly paused: boolean };
  setPaused: (p: boolean) => void;
  facts: (sceneId: string) => Record<string, unknown> | undefined;
  action: (sceneId: string, name: string, ...args: unknown[]) => unknown;
  scenes: () => string[];
}

export function installHook(): void {
  const hook: LabHook = {
    version: 1,
    clock: {
      get t() {
        return clock.t;
      },
      get paused() {
        return clock.paused;
      },
    },
    setPaused,
    facts: (sceneId: string) => sceneFacts.get(sceneId)?.(),
    action: (sceneId: string, name: string, ...args: unknown[]) => sceneActions.get(sceneId)?.[name]?.(...args),
    scenes: () => [...sceneFacts.keys()],
  };
  (window as unknown as { __LAB__: LabHook }).__LAB__ = hook;
}
