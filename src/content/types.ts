export type PanelTag =
  | "established"
  | "engineering-convention"
  | "model-simplification"
  | "order-of-magnitude"
  | "misconception-corrected";

export type ModuleId =
  | "spectrum"
  | "room"
  | "fourier"
  | "thermal"
  | "resonance"
  | "modulation"
  | "shannon"
  | "spreading"
  | "vision"
  | "hearing"
  | "attenuation"
  | "scenario"
  | "graph";

/** A sourced numeric datum: every number carries a formula OR a citation id. */
export interface SourcedNumber {
  label: string;
  value: string; // rendered value (with units)
  formula?: string; // a named formula with symbols defined
  source?: string; // a citation id resolved by REFERENCES
}

export interface Panel {
  id: string;
  module: ModuleId;
  tag: PanelTag;
  title: string;
  body: string;
  /** Optional structured numeric data, each entry sourced (AC16). */
  data?: SourcedNumber[];
  /** Marks one of the five named misconception panels (AC15c). */
  misconception?: string;
}

export type EdgeType = "enables" | "requires" | "contrasts" | "causes" | "corrects-misconception";

export interface GraphNode {
  id: string;
  label: string;
  module?: ModuleId;
  tag: PanelTag;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  tag: PanelTag;
  justification: string;
}

export interface Question {
  id: string;
  text: string;
  routes: ModuleId[];
  nodes: string[];
  answer: string;
}

export interface Reference {
  id: string;
  text: string;
}
