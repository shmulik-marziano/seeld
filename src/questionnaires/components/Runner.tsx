// The questionnaire runner: one question per screen, auto-advance on single choice, inline validation on blur/continue,
// per-screen autosave indicator, review -> sign -> done. Lazy-loaded by the routes; never imported by public pages.
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Answers, AnswerValue, Question, Questionnaire, RunnerMode } from "../types";
import { isUnknown } from "../types";
import { computeFlow, computeProgress, isAnswered, validateQuestion } from "../logic";
import { initialState, reducer } from "../reducer";
import { buildSubmitPayload, defaultStore, disabledSubmitAdapter, newSessionId } from "../adapters";
import type { QuestionnaireStore, SubmitAdapter, SubmitSigner } from "../adapters";
import { HEALTH_PRIVACY_NOTE, NOT_SENT_NOTICE, sectionCopy, whyWeAsk } from "../copy";
import { ageFromBirth } from "../validators";
import { BmiNote, SimpleInput } from "./fields";
import { ReviewScreen } from "./Review";
import { DoneStep, SignStep } from "./Completion";
import type { SignedResult } from "./Completion";
import { SdSpot } from "@/components/sd/SdSpot";
import "../questionnaires.css";

export interface RunnerProps {
  def: Questionnaire;
  mode: RunnerMode;
  store?: QuestionnaireStore;
  submit?: SubmitAdapter;
  requestToken?: string | null;
  initialAnswers?: Answers;
  initialKey?: string | null;
  /** where the exit link leads */
  exitTo?: string;
  exitLabel?: string;
  /** the action offered on the thank-you screen (the client flow: "ממשיכים לשאלון הבא") */
  next?: { label: string; to: string; note?: string };
  /** called once the final submit answered (saved, duplicate or error); the client flow moves on from here */
  onSubmitted?: (result: "saved" | "error") => void;
}

const AUTO_ADVANCE_MS = 260;
const MODE_LABEL: Record<RunnerMode, string> = { agent: "מילוי עם הלקוח", "client-link": "מילוי עצמאי", meeting: "תיעוד מהיר" };

export function Runner({ def, mode, store = defaultStore, submit = disabledSubmitAdapter, requestToken = null, initialAnswers, initialKey = null, exitTo = "/app/questionnaires", exitLabel = "לכל השאלונים", next, onSubmitted }: RunnerProps) {
  const sensitive = def.key === "health";
  const needsConsent = !!def.intro;
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(def.key, mode, needsConsent));
  const sessionId = useRef(newSessionId());
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [signed, setSigned] = useState<SignedResult | null>(null);
  const [confirmAllClear, setConfirmAllClear] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answersRef = useRef<Answers>({});
  answersRef.current = state.answers;

  const flow = useMemo(() => computeFlow(def, state.answers), [def, state.answers]);
  const steps = flow.steps;
  const resolvedKey = useMemo(() => {
    if (state.currentKey && flow.visible.has(state.currentKey)) return state.currentKey;
    return steps[0]?.key ?? null;
  }, [state.currentKey, flow.visible, steps]);
  const index = steps.findIndex((s) => s.key === resolvedKey);
  const step = index >= 0 ? steps[index] : null;
  const progress = useMemo(() => computeProgress(flow, state.answers, resolvedKey), [flow, state.answers, resolvedKey]);

  // ---- hydrate from the draft store (never for health: no prefill of health data)
  useEffect(() => {
    if (initialAnswers) dispatch({ type: "hydrate", answers: initialAnswers, currentKey: initialKey, consented: !needsConsent });
    else if (!sensitive) {
      const snap = store.load(def.key);
      if (snap && snap.version === def.version) dispatch({ type: "hydrate", answers: snap.answers, currentKey: snap.currentKey, consented: snap.consented });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.key]);
  // ---- persist (memory + sessionStorage only)
  useEffect(() => {
    if (state.phase === "done") return;
    if (Object.keys(state.answers).length === 0 && !state.consented) return;
    store.save(def.key, { answers: state.answers, currentKey: resolvedKey, consented: state.consented, updatedAt: new Date().toISOString(), version: def.version });
  }, [state.answers, resolvedKey, state.consented, state.phase, def, store]);
  // ---- health: wipe the session copy when leaving the page or the screen
  useEffect(() => {
    if (!sensitive) return;
    const wipe = () => store.clear(def.key);
    window.addEventListener("pagehide", wipe);
    return () => { window.removeEventListener("pagehide", wipe); wipe(); };
  }, [sensitive, store, def.key]);
  // ---- focus the heading on every screen change
  useEffect(() => { headingRef.current?.focus({ preventScroll: false }); }, [resolvedKey, state.phase]);

  const saveStep = useCallback(async (stepKey: string | null, isSubmit = false, signer?: SubmitSigner) => {
    if (!submit.enabled) { dispatch({ type: "save", state: { status: "disabled", at: new Date().toISOString() } }); if (isSubmit) onSubmitted?.("saved"); return; }
    dispatch({ type: "save", state: { status: "saving", at: null } });
    let outcome: "saved" | "error" = "saved";
    try {
      const payload = buildSubmitPayload({ def, answers: answersRef.current, mode, sessionId: sessionId.current, requestToken, stepKey, submit: isSubmit });
      const r = await (isSubmit ? submit.submit(payload, signer) : submit.saveStep(payload));
      outcome = r.status === "error" ? "error" : "saved";
      dispatch({ type: "save", state: { status: outcome, at: r.savedAt ?? new Date().toISOString() } });
    } catch { outcome = "error"; dispatch({ type: "save", state: { status: "error", at: null } }); }
    if (isSubmit) onSubmitted?.(outcome);
  }, [def, mode, requestToken, submit, onSubmitted]);

  // ---- navigation
  const go = (key: string | null, d: "fwd" | "back" = "fwd") => { setDir(d); if (key) dispatch({ type: "goto", key }); else { dispatch({ type: "review" }); } };
  const nextKeyAfter = (answers: Answers, fromKey: string, skipRestOfScreening = false): string | null => {
    const f = computeFlow(def, answers);
    let i = f.steps.findIndex((s) => s.key === fromKey);
    if (i < 0) i = index;
    for (let j = i + 1; j < f.steps.length; j++) {
      if (skipRestOfScreening && f.steps[j].phase === "screening") continue;
      return f.steps[j].key;
    }
    return null;
  };
  const validateCurrent = (q: Question, answers: Answers) => validateQuestion(q, answers[q.key], { answers });

  const advance = (answersOverride?: Answers, skipScreening = false) => {
    if (!step) return;
    const answers = answersOverride ?? answersRef.current;
    const r = validateCurrent(step.q, answers);
    if (!r.ok) { dispatch({ type: "touch", key: step.key, error: r.message }); return; }
    let a = answers;
    if (r.value !== undefined && r.value !== answers[step.key] && !isUnknown(answers[step.key])) { a = { ...answers, [step.key]: r.value as AnswerValue }; dispatch({ type: "answer", key: step.key, value: r.value as AnswerValue }); answersRef.current = a; }
    dispatch({ type: "touch", key: step.key, error: null });
    void saveStep(step.key);
    const nk = nextKeyAfter(a, step.key, skipScreening);
    if (nk) go(nk, "fwd"); else { setDir("fwd"); dispatch({ type: "review" }); }
  };
  const back = () => { setDir("back"); dispatch({ type: "back" }); };

  const clientRef = useRef<{ name: string; id: string } | null>(null);
  if (clientRef.current === null && def.key === "direct-debit") {
    const snap = store.load("personal") ?? store.load("personal-extended");
    const a = snap?.answers ?? {};
    const name = [a.first_name, a.last_name].filter((x) => typeof x === "string" && x).join(" ");
    clientRef.current = { name, id: typeof a.identity_document === "string" ? a.identity_document : "" };
  }
  const setAnswer = (key: string, value: AnswerValue) => {
    answersRef.current = { ...answersRef.current, [key]: value };
    dispatch({ type: "answer", key, value });
    // direct debit: the holder defaults to the client (prefilled from the personal questionnaire draft, if any); "someone else" clears it
    if (key === "dd_holder_is_client") {
      const mine = value === "אני בעל/ת החשבון";
      for (const [k, v] of [["dd_holder_name", mine ? clientRef.current?.name ?? "" : ""], ["dd_holder_id", mine ? clientRef.current?.id ?? "" : ""]] as const) {
        if (!mine || v) { answersRef.current = { ...answersRef.current, [k]: v }; dispatch({ type: "answer", key: k, value: v }); }
      }
    }
  };
  const autoAdvance = useRef<number | null>(null);
  useEffect(() => () => { if (autoAdvance.current) window.clearTimeout(autoAdvance.current); }, []);
  const onPickAdvance = () => {
    if (autoAdvance.current) window.clearTimeout(autoAdvance.current);
    autoAdvance.current = window.setTimeout(() => advance(), AUTO_ADVANCE_MS);
  };

  // ---- health fast paths
  const gatesNow = steps.filter((s) => s.phase === "screening");
  const answeredGates = gatesNow.filter((s) => isAnswered(state.answers[s.key]));
  /** Marks gates 'לא', then repeats for gates that only became visible because of those answers (e.g. smoking_past after smoking = לא). */
  const fillGatesNo = (answers: Answers, override: boolean): Answers => {
    const a: Answers = { ...answers };
    for (let i = 0; i < 6; i++) {
      const gates = computeFlow(def, a).steps.filter((x) => x.phase === "screening");
      const todo = gates.filter((g) => (override && i === 0) || !isAnswered(a[g.key]));
      if (!todo.length) break;
      for (const g of todo) a[g.key] = "לא";
    }
    return a;
  };
  const applyAnswers = (next: Answers) => {
    for (const k of Object.keys(next)) if (next[k] !== answersRef.current[k]) dispatch({ type: "answer", key: k, value: next[k] });
    answersRef.current = next;
  };
  const afterGates = (next: Answers) => {
    const f = computeFlow(def, next);
    const lastGate = [...f.steps].reverse().find((x) => x.phase === "screening");
    const nk = lastGate ? nextKeyAfter(next, lastGate.key, false) : null;
    setDir("fwd");
    if (nk) go(nk, "fwd"); else dispatch({ type: "review" });
  };
  const markAllClear = () => {
    const next = fillGatesNo(state.answers, true);
    applyAnswers(next);
    setConfirmAllClear(false);
    void saveStep(gatesNow[gatesNow.length - 1]?.key ?? null);
    afterGates(next);
  };
  const skipRest = () => {
    if (!step) return;
    const r = validateCurrent(step.q, state.answers);
    if (!r.ok) { dispatch({ type: "touch", key: step.key, error: r.message }); return; }
    const next = fillGatesNo(state.answers, false);
    applyAnswers(next);
    void saveStep(step.key);
    afterGates(next);
  };

  const clearAll = () => {
    store.clear(def.key);
    answersRef.current = {};
    setSigned(null);
    dispatch({ type: "clear", needsConsent, firstKey: null });
  };

  // ---------------------------------------------------------------- render pieces
  const chrome = (children: React.ReactNode, extra?: React.ReactNode) => (
    <div className="sd-q" dir="rtl" data-phase={state.phase}>
      <header className="sd-q-top">
        <div className="sd-q-top-row">
          <Link to={exitTo} className="sd-q-exit">{exitLabel}</Link>
          <span className="sd-q-modechip">{MODE_LABEL[mode]}</span>
        </div>
        <h1 className="sd-q-title">{def.title}</h1>
        {extra}
      </header>
      <main className="sd-q-main" id="q-main">{children}</main>
    </div>
  );

  if (state.phase === "consent" && def.intro) {
    return chrome(
      <section className="sd-q-card sd-q-intro" aria-labelledby="q-intro-h">
        <SdSpot name="shield-blue" size={84} className="sd-q-spot" />
        <h2 id="q-intro-h" ref={headingRef} tabIndex={-1} className="sd-q-qtitle">{def.intro.title}</h2>
        {def.intro.body.map((p) => <p key={p} className="sd-q-p">{p}</p>)}
        <p className="sd-q-note" role="note">{HEALTH_PRIVACY_NOTE}</p>
        <label className="sd-q-choice is-check" style={{ marginTop: 16 }}>
          <input type="checkbox" id="q-consent" onChange={(e) => { if (e.target.checked) { dispatch({ type: "consent" }); } }} />
          <span>{def.intro.consentLabel}</span>
        </label>
        <p className="sd-q-fine">אפשר לצאת בכל שלב. כלום לא נשמר אחרי היציאה.</p>
      </section>,
    );
  }

  if (state.phase === "review") {
    return chrome(
      <ReviewScreen def={def} answers={state.answers} flow={flow} onEdit={(k) => { setDir("back"); dispatch({ type: "goto", key: k }); }} onBack={back}
        onContinue={() => { setDir("fwd"); dispatch({ type: "sign" }); }} sensitive={sensitive} />,
    );
  }
  if (state.phase === "sign") {
    return chrome(
      <SignStep def={def} answers={state.answers} sensitive={sensitive} onBack={back}
        onSigned={(res) => {
          setSigned(res);
          void saveStep(null, true, { name: res.signerName, kind: res.signature.kind, png: res.signature.png, hash: res.hash, signedAt: res.signedAt });
          store.clear(def.key);
          dispatch({ type: "done" });
        }} />,
    );
  }
  if (state.phase === "done" && signed) {
    return chrome(<DoneStep def={def} answers={state.answers} signed={signed} sensitive={sensitive} onClear={clearAll} exitTo={exitTo} exitLabel={exitLabel} submitEnabled={submit.enabled} next={next} saveState={state.save.status} />);
  }
  if (!step) {
    return chrome(<section className="sd-q-card"><p className="sd-q-p">אין שאלות להצגה.</p></section>);
  }

  const q = step.q;
  const err = state.errors[q.key];
  const touched = state.touched[q.key];
  const showErr = !!err && touched;
  const labelId = `q-${q.key}-label`;
  const inputId = `q-${q.key}`;
  const descId = `${inputId}-desc`;
  const errId = `${inputId}-err`;
  const sectionSteps = steps.filter((s) => s.sectionId === step.sectionId);
  const posInSection = sectionSteps.findIndex((s) => s.key === step.key);
  const remainingInSection = sectionSteps.length - posInSection - 1;
  const why = whyWeAsk(q, def.key);
  const isGate = step.phase === "screening";
  const choiceAuto = (q.type === "choice" && (q.options?.length ?? 0) <= 6) || q.meta.widget === "healthfund";
  const unknownNow = isUnknown(state.answers[q.key]);
  const answeredNow = isAnswered(state.answers[q.key]);
  const age = typeof state.answers.birth === "string" ? ageFromBirth(state.answers.birth) : null;
  const lastStep = index === steps.length - 1;
  const inScreeningFirst = isGate && gatesNow[0]?.key === step.key;
  const warn = answeredNow && !showErr ? validateCurrent(q, state.answers).warning : undefined;
  const warnMsg = warn;
  const entryErrors = q.type === "repeat" && touched ? validateCurrent(q, state.answers).entryErrors : undefined;
  const sc = sectionCopy(step.sectionTitle);
  const sectionsNav = progress.sections;
  const curSecIdx = sectionsNav.findIndex((s) => s.current);

  const progressEl = (
    <div className="sd-q-progress" role="group" aria-label="התקדמות בשאלון">
      <ol className="sd-q-segs" aria-hidden="true">
        {sectionsNav.slice(0, 40).map((s, i) => (
          <li key={s.id} className={`${i < curSecIdx ? "is-done" : ""} ${i === curSecIdx ? "is-cur" : ""}`}><i style={{ width: `${s.total ? Math.round((s.answered / s.total) * 100) : 0}%` }} /></li>
        ))}
      </ol>
      <p className="sd-q-progress-text">
        <span>{step.sectionTitle.replace(/^הצטרפות · |^בירור בריאותי · /, "")}</span>
        <span>ענית על {progress.answered} מתוך {progress.total}</span>
      </p>
    </div>
  );

  const saveText = state.save.status === "saving" ? "שומרים…" : state.save.status === "saved" ? "נשמר" : state.save.status === "disabled" ? "נשמר במכשיר הזה" : state.save.status === "error" ? "השמירה נכשלה, ננסה שוב" : "";

  return (
    <div className="sd-q" dir="rtl" data-phase="questions">
      <header className="sd-q-top">
        <div className="sd-q-top-row">
          <Link to={exitTo} className="sd-q-exit">{exitLabel}</Link>
          <span className="sd-q-modechip">{MODE_LABEL[mode]}</span>
          <span className={`sd-q-save is-${state.save.status}`} aria-live="polite">{saveText}</span>
        </div>
        <h1 className="sd-q-title">{def.title}</h1>
        {progressEl}
        {def.status === "draft-for-approval" && <p className="sd-q-note" role="note">שאלון בטיוטה, ממתין לאישור.</p>}
        {state.resumed && <p className="sd-q-note" role="status">ממשיכים מאיפה שעצרת.</p>}
      </header>
      <main className="sd-q-main" id="q-main">
        <section key={q.key} className={`sd-q-card sd-q-step sd-q-in-${dir}`} aria-labelledby={labelId}>
          {sc && posInSection === 0 && <p className="sd-q-sectioncopy">{sc}</p>}
          <h2 id={labelId} ref={headingRef} tabIndex={-1} className="sd-q-qtitle">
            {q.label}
            {!q.required && <span className="sd-q-opt"> (לא חובה)</span>}
          </h2>
          {q.hint && <p id={descId} className="sd-q-hint">{q.hint}</p>}
          {why && <details className="sd-q-why"><summary>למה אנחנו שואלים</summary><p>{why}</p></details>}
          {inScreeningFirst && !confirmAllClear && (
            <div className="sd-q-fast">
              <p>אין לכם אף אחת מהבעיות האלה? אפשר לדלג על כל השאלות בבת אחת.</p>
              <button type="button" className="sd-q-btn is-quiet" onClick={() => setConfirmAllClear(true)}>הכול תקין, אין לי אף אחת מהבעיות האלה</button>
            </div>
          )}
          {confirmAllClear && (
            <div className="sd-q-confirm" role="alertdialog" aria-labelledby="q-confirm-h">
              <h3 id="q-confirm-h">לסמן 'לא' בכל התחומים?</h3>
              <p>נסמן 'לא' בכל התחומים האלה, ולא יהיו שאלות המשך:</p>
              <ul className="sd-q-confirm-list">{[...new Set(gatesNow.map((g) => gateShort(g.q)))].map((t) => <li key={t}>{t}</li>)}</ul>
              <div className="sd-q-confirm-actions">
                <button type="button" className="sd-q-btn" onClick={markAllClear}>כן, הכול תקין</button>
                <button type="button" className="sd-q-btn is-quiet" onClick={() => setConfirmAllClear(false)}>חזרה, אענה אחת אחת</button>
              </div>
            </div>
          )}
          <div className="sd-q-input-area" onKeyDown={(e) => { if (e.key === "Enter" && !(e.target as HTMLElement).matches("textarea,button,[role=combobox],a,summary")) { e.preventDefault(); advance(); } }}>
            <SimpleInput q={q} value={state.answers[q.key]} answers={state.answers} inputId={inputId} invalid={showErr} entryErrors={entryErrors}
              describedBy={[q.hint ? descId : "", showErr ? errId : ""].filter(Boolean).join(" ") || undefined}
              onChange={(v) => setAnswer(q.key, v)}
              onBlur={() => { const r = validateCurrent(q, answersRef.current); dispatch({ type: "touch", key: q.key, error: r.ok ? null : r.message }); }}
              onPickAdvance={choiceAuto ? onPickAdvance : undefined} />
            {(q.key === "weight" || q.key === "height") && <BmiNote answers={state.answers} age={age} />}
            {isGate && <p className="sd-q-assist">לא בטוח/ה? סמנו כן ונעזור לפרט.</p>}
            {showErr && <p id={errId} className="sd-q-error" role="alert">{err}</p>}
            {warnMsg && <p className="sd-q-warn" role="status">{warnMsg}</p>}
          </div>
          {isGate && answeredGates.length >= 1 && answeredGates.length < gatesNow.length && (
            <button type="button" className="sd-q-skiprest" onClick={skipRest}>דלג על השאר: אין לי נוספות</button>
          )}
          <SdSpot name={isGate ? "heart-pink" : "olive-sapling"} size={60} className="sd-q-spot-corner" />
        </section>
        <p className="sd-q-remaining" aria-live="polite">{remainingInSection > 0 ? `עוד ${remainingInSection} שאלות בחלק הזה` : "זו השאלה האחרונה בחלק הזה"}</p>
        {mode !== "meeting" && (sensitive ? <p className="sd-q-fine">{HEALTH_PRIVACY_NOTE}</p> : !submit.enabled ? <p className="sd-q-fine">{NOT_SENT_NOTICE}</p> : null)}
        <button type="button" className="sd-q-linkbtn sd-q-clear" onClick={clearAll}>ניקוי כל התשובות מהדפדפן</button>
      </main>
      <div className="sd-q-bar" role="toolbar" aria-label="ניווט בשאלון">
        <button type="button" className="sd-q-btn is-quiet" onClick={back} disabled={state.history.length === 0}>חזרה</button>
        <button type="button" className="sd-q-btn" onClick={() => advance()}>
          {lastStep ? "לסקירת התשובות" : unknownNow || !answeredNow && !q.required ? "דילוג להמשך" : "המשך"}
        </button>
      </div>
    </div>
  );
}

function gateShort(q: Question): string {
  return q.section.replace(/^בירור בריאותי · /, "") || q.label;
}
