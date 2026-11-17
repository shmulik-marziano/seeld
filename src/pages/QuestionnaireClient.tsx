// Public client route shell /q/:token (lazy chunk). Unlisted: noindex, not in the sitemap, not prerendered (the route has no static page).
// Shows "coming soon" unless the dev mock flag is on (?qmock=1 or VITE_QUESTIONNAIRE_MOCK=1, never in production builds).
import { lazy, Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CaStatus } from "@/components/sd/client";
import { clientMockEnabled, OPEN_ERROR_TEXT } from "@/questionnaires/adapters";
import { clientSessionAdapter, clientSubmitAdapter } from "@/questionnaires/mocks";
import { isQuestionnaireKey, loadQuestionnaire } from "@/questionnaires/registry";
import type { Questionnaire } from "@/questionnaires/types";
import type { Answers } from "@/questionnaires/types";

const Runner = lazy(() => import("@/questionnaires/components/Runner").then((m) => ({ default: m.Runner })));

function useNoIndex() {
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m);
    const prev = document.title;
    document.title = "שאלון · שילד";
    return () => { document.head.removeChild(m); document.title = prev; };
  }, []);
}

export default function QuestionnaireClient() {
  useNoIndex();
  const { token = "" } = useParams();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [session, setSession] = useState<{ def: Questionnaire; answers?: Answers; stepKey: string | null } | null>(null);
  const mock = clientMockEnabled();

  if (!mock) {
    return <CaStatus tint="sky" art="01-hero" title="השאלון יפתח בקרוב" text="הכניסה לשאלון באמצעות קישור עדיין לא פעילה. הצוות שלנו ישלח אליכם הודעה כשהיא תיפתח." />;
  }
  if (session) {
    return (
      <Suspense fallback={null}>
        <Runner def={session.def} mode="client-link" requestToken={token} submit={clientSubmitAdapter(token)} initialAnswers={session.answers} initialKey={session.stepKey} exitTo="/" exitLabel="יציאה" />
      </Suspense>
    );
  }
  const open = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const r = await clientSessionAdapter.open(token, code);
    if (r.ok === false) { const f = r as import("@/questionnaires/adapters").OpenFailed; setErr(f.message + (f.attemptsLeft !== undefined ? ` (נותרו ${f.attemptsLeft} ניסיונות)` : "")); return; }
    const okRes = r as import("@/questionnaires/adapters").OpenedSession;
    if (!isQuestionnaireKey(okRes.questionnaireKey)) { setErr(OPEN_ERROR_TEXT.invalid); return; }
    const def = await loadQuestionnaire(okRes.questionnaireKey);
    setSession({ def, answers: okRes.resume?.answers, stepKey: okRes.resume?.stepKey ?? null });
  };
  return (
    <div className="sd sd-q" dir="rtl" style={{ minHeight: "100vh" }}>
      <main className="sd-q-main" style={{ paddingTop: 48 }}>
        <form className="sd-q-card" onSubmit={open}>
          <h1 className="sd-q-qtitle">כניסה לשאלון</h1>
          <p className="sd-q-p">הזינו את הקוד שקיבלתם בנפרד מהקישור.</p>
          <p className="sd-q-note" role="note">מצב הדגמה: הכניסה פועלת מול זיכרון הדפדפן בלבד.</p>
          <label htmlFor="q-code" className="sd-q-sublabel">קוד כניסה</label>
          <input id="q-code" className="sd-q-input sd-q-big" inputMode="numeric" dir="ltr" style={{ textAlign: "right" }} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
          {err && <p className="sd-q-error" role="alert">{err}</p>}
          <button type="submit" className="sd-q-btn sd-q-bigbtn" style={{ marginTop: 16 }}>כניסה</button>
        </form>
      </main>
    </div>
  );
}
