// Runner state reducer. Pure; navigation targets are resolved by the hook (it knows the flow) and passed in as actions.
import type { Answers, AnswerValue, RunnerMode } from "./types";

export type Phase = "consent" | "questions" | "review" | "sign" | "done";
export interface SaveState { status: "idle" | "saving" | "saved" | "disabled" | "error"; at: string | null }
export interface RunnerState {
  questionnaireKey: string;
  mode: RunnerMode;
  phase: Phase;
  consented: boolean;
  answers: Answers;
  currentKey: string | null;
  /** keys the user already left or tried to continue from: inline errors show for these only (not while typing) */
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  save: SaveState;
  /** keys visited, for Back */
  history: string[];
  /** true after a restore from the draft store */
  resumed: boolean;
}
export type RunnerAction =
  | { type: "hydrate"; answers: Answers; currentKey: string | null; consented: boolean }
  | { type: "consent" }
  | { type: "start"; firstKey: string | null }
  | { type: "answer"; key: string; value: AnswerValue }
  | { type: "touch"; key: string; error?: string | null }
  | { type: "setErrors"; errors: Record<string, string> }
  | { type: "goto"; key: string; push?: boolean }
  | { type: "back" }
  | { type: "review" }
  | { type: "sign" }
  | { type: "done" }
  | { type: "save"; state: SaveState }
  | { type: "clear"; needsConsent: boolean; firstKey: string | null };

export function initialState(questionnaireKey: string, mode: RunnerMode, needsConsent: boolean): RunnerState {
  return {
    questionnaireKey, mode, phase: needsConsent ? "consent" : "questions", consented: !needsConsent, answers: {}, currentKey: null,
    touched: {}, errors: {}, save: { status: "idle", at: null }, history: [], resumed: false,
  };
}

export function reducer(s: RunnerState, a: RunnerAction): RunnerState {
  switch (a.type) {
    case "hydrate":
      return { ...s, answers: a.answers, currentKey: a.currentKey, consented: a.consented || s.consented, phase: s.phase === "consent" && a.consented ? "questions" : s.phase, resumed: true };
    case "consent":
      return { ...s, consented: true, phase: "questions" };
    case "start":
      return { ...s, phase: "questions", currentKey: s.currentKey ?? a.firstKey };
    case "answer": {
      const errors = { ...s.errors };
      delete errors[a.key]; // clear while typing; shown again on blur/continue
      return { ...s, answers: { ...s.answers, [a.key]: a.value }, errors, save: s.save.status === "saved" ? { ...s.save, status: "idle" } : s.save };
    }
    case "touch": {
      const errors = { ...s.errors };
      if (a.error) errors[a.key] = a.error; else delete errors[a.key];
      return { ...s, touched: { ...s.touched, [a.key]: true }, errors };
    }
    case "setErrors":
      return { ...s, errors: a.errors };
    case "goto":
      return { ...s, phase: "questions", currentKey: a.key, history: a.push === false || s.currentKey === null || s.currentKey === a.key ? s.history : [...s.history, s.currentKey] };
    case "back": {
      if (s.phase === "sign") return { ...s, phase: "review" };
      if (s.phase === "review") return { ...s, phase: "questions" };
      const prev = s.history[s.history.length - 1];
      return prev ? { ...s, currentKey: prev, history: s.history.slice(0, -1) } : s;
    }
    case "review":
      return { ...s, phase: "review" };
    case "sign":
      return { ...s, phase: "sign" };
    case "done":
      return { ...s, phase: "done" };
    case "save":
      return { ...s, save: a.state };
    case "clear":
      return { ...initialState(s.questionnaireKey, s.mode, a.needsConsent), currentKey: a.firstKey };
    default:
      return s;
  }
}
