// /forms/:card: one client session, the questionnaires of the card one after another (docs/product/CLIENT-FORMS.md).
// identity (once per session, Turnstile) -> Runner per definition with the server adapter (every step saved, resume from the
// server's draft) -> documents (the personal card) -> closing screen with the next card. The risk card runs the risk quiz and
// stores its result. Off by default: with FORMS_FLOW_ENABLED false the page sends the visitor back to the hub. noindex.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { PubPage } from "@/components/sd/pubParts";
import { Runner } from "@/questionnaires/components/Runner";
import { loadQuestionnaire } from "@/questionnaires/registry";
import type { Answers, Questionnaire, QuestionnaireKey } from "@/questionnaires/types";
import { errorKindOf, type ErrorKind, type FormsApi, type StateRes } from "@/forms/api";
import { cardOf, cardPath, nextQuestionnaireOf, type FormsCard, type SubmissionSummary } from "@/forms/catalog";
import { FORMS_FLOW_ENABLED } from "@/forms/config";
import { createFormsSubmitAdapter } from "@/forms/submitAdapter";
import { CardDone, DocumentsStep, IdentityStep, RiskStep } from "./steps";
import { createFormsApi, ErrorCard, Rail, useNoIndex } from "./shared";
import "@/questionnaires/questionnaires.css";
import "@/components/risk/risk.css";
import "@/pages/report-order/poa.css";
import "./forms.css";

export default function FormsFlow({ api }: { api?: FormsApi }) {
  const { card: key } = useParams<{ card: string }>();
  const card = cardOf(key);
  if (!card) return <Navigate to="/forms" replace />;
  if (card.kind === "poa") return <Navigate to={cardPath(card)} replace />;
  if (!FORMS_FLOW_ENABLED && !api) return <Navigate to="/forms" replace />;
  return <Flow card={card} api={api} />;
}

type Phase =
  | { name: "loading" }
  | { name: "identity" }
  | { name: "questionnaire"; qKey: QuestionnaireKey; def: Questionnaire; answers?: Answers; stepKey: string | null; draftVersion: number; serial: number }
  | { name: "documents" }
  | { name: "risk" }
  | { name: "done" }
  | { name: "error"; kind: ErrorKind };

const summaries = (s: StateRes | null): SubmissionSummary[] => (s?.submissions ?? []).map((x) => ({ card: x.card, questionnaire: x.questionnaire, status: x.status, completion: x.completion }));

export function Flow({ card, api: injected }: { card: FormsCard; api?: FormsApi }) {
  useNoIndex(`${card.title} · שילד`);
  const api = useMemo(() => injected ?? createFormsApi(), [injected]);
  const [sp] = useSearchParams();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [state, setState] = useState<StateRes | null>(null);
  const docsDone = useRef(false);
  const serial = useRef(0);

  /** read the session and decide the screen (the one place the flow advances) */
  const decide = useCallback(async () => {
    if (!api.hasSession()) { setPhase({ name: "identity" }); return; }
    setPhase({ name: "loading" });
    try {
      const s = await api.state();
      setState(s);
      if (s.status !== "open") { setPhase({ name: "error", kind: s.status === "expired" ? "expired" : "locked" }); return; }
      const subs = summaries(s);
      if (card.kind === "risk") {
        setPhase(subs.some((x) => x.card === card.key && x.status !== "draft") ? { name: "done" } : { name: "risk" });
        return;
      }
      const qKey = nextQuestionnaireOf(card, subs);
      if (qKey) {
        const def = await loadQuestionnaire(qKey);
        const draft = s.submissions.find((x) => x.questionnaire === qKey && x.status === "draft");
        const resume = draft && draft.answers && qKey !== "health" ? { answers: draft.answers as Answers, stepKey: draft.step_key } : null;
        setPhase({ name: "questionnaire", qKey, def, answers: resume?.answers, stepKey: resume?.stepKey ?? null, draftVersion: draft?.draft_version ?? 0, serial: ++serial.current });
        return;
      }
      if (card.documents.length && !docsDone.current) { setPhase({ name: "documents" }); return; }
      setPhase({ name: "done" });
    } catch (e) {
      setPhase({ name: "error", kind: errorKindOf(e) });
    }
  }, [api, card]);

  // on mount, when the card changes, and when the thank-you screen's "next" link bumps ?step=
  const step = sp.get("step");
  useEffect(() => { void decide(); }, [decide, step]);

  const fail = (kind: ErrorKind) => setPhase({ name: "error", kind });
  const subs = summaries(state);

  let body: JSX.Element;
  switch (phase.name) {
    case "loading":
      body = <section className="sd-q-card" aria-busy="true"><p className="sd-q-p">טוענים…</p></section>;
      break;
    case "identity":
      body = <IdentityStep api={api} card={card} onStarted={() => void decide()} onFail={fail} />;
      break;
    case "questionnaire": {
      const remaining = card.questionnaires.slice(card.questionnaires.indexOf(phase.qKey) + 1).length;
      const nextTo = `/forms/${card.key}?step=${phase.serial + 1}`;
      const next = remaining > 0
        ? { label: "ממשיכים לשאלון הבא", to: nextTo, note: `עוד ${remaining === 1 ? "שאלון אחד" : `${remaining} שאלונים`} בחלק הזה. כדאי להוריד עותק חתום לעצמך.` }
        : card.documents.length ? { label: "להעלאת מסמכים", to: nextTo } : { label: "סיום החלק הזה", to: nextTo };
      const adapter = createFormsSubmitAdapter({
        api, card: card.key, questionnaire: phase.qKey, draftVersion: phase.draftVersion, sensitive: card.sensitive, healthStored: api.healthStored() === true,
        onStale: () => void decide(),
      });
      body = (
        <Runner key={`${phase.qKey}-${phase.serial}`} def={phase.def} mode="client-link" submit={adapter} initialAnswers={phase.answers} initialKey={phase.stepKey}
          exitTo="/forms" exitLabel="לכל השאלונים" next={next} />
      );
      break;
    }
    case "documents":
      body = (
        <DocumentsStep api={api} card={card} uploaded={state?.documents ?? []} onUploaded={() => void api.state().then(setState, () => undefined)}
          onDone={() => { docsDone.current = true; setPhase({ name: "done" }); }} onFail={fail} />
      );
      break;
    case "risk":
      body = <RiskStep api={api} card={card} onSubmitted={() => void api.state().then(setState, () => undefined)} onFail={fail} />;
      break;
    case "done":
      body = <CardDone card={card} submissions={subs} />;
      break;
    default:
      body = <ErrorCard kind={phase.kind} onRetry={() => void decide()} onRestart={() => { api.clear(); setState(null); setPhase({ name: "identity" }); }} />;
  }

  return (
    <PubPage tint="sage">
      <div className="sd-poa-page">
        <div className="sd-rk-wrap sd-poa-wrap">
          <h1 className="sd-poa-h1">שאלונים ומסמכים · {card.title}</h1>
          <Rail current={card.key} submissions={subs} />
          <div className="sd-q sd-poa-q" data-card={card.key}>{body}</div>
        </div>
      </div>
    </PubPage>
  );
}
