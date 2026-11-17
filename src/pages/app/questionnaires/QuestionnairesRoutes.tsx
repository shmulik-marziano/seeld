// Mounted (lazy) at /app/questionnaires/* inside the agent portal guard (src/App.tsx). Not imported by any public page.
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { CaLoading } from "@/components/sd/client";
import { useSdFont } from "@/components/sd/primitives";
import { isQuestionnaireKey, loadQuestionnaire } from "@/questionnaires/registry";
import type { Questionnaire, RunnerMode } from "@/questionnaires/types";
import { defaultStore } from "@/questionnaires/adapters";
import { requestsAdapter } from "@/questionnaires/mocks";

const Hub = lazy(() => import("@/questionnaires/components/Hub"));
const Meeting = lazy(() => import("@/questionnaires/components/Meeting"));
const RunnerLazy = lazy(() => import("@/questionnaires/components/Runner").then((m) => ({ default: m.Runner })));
const ViewerLazy = lazy(() => import("@/questionnaires/components/ResponseViewer").then((m) => ({ default: m.ResponseViewer })));

function useDef(key: string | undefined) {
  const [def, setDef] = useState<Questionnaire | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setDef(null); setFailed(false);
    if (!isQuestionnaireKey(key)) return;
    loadQuestionnaire(key).then(setDef).catch(() => setFailed(true));
  }, [key]);
  return { def, failed };
}

function RunnerPage() {
  const { key } = useParams();
  const [sp] = useSearchParams();
  const { def, failed } = useDef(key);
  if (!isQuestionnaireKey(key)) return <Navigate to={"/app/questionnaires"} replace />;
  if (failed) return <p className="p-6" dir="rtl">השאלון לא נטען. אפשר לרענן את הדף.</p>;
  if (!def) return <CaLoading label="טוען שאלון" tone="sky" />;
  const m = sp.get("mode");
  const mode: RunnerMode = m === "meeting" || m === "client-link" ? m : "agent";
  return <RunnerLazy key={def.key} def={def} mode={mode} />;
}

function ResultsPage() {
  const { key } = useParams();
  const { def } = useDef(key);
  if (!isQuestionnaireKey(key) || key === "health") return <Navigate to={"/app/questionnaires"} replace />;
  if (!def) return <CaLoading label="טוען" tone="sky" />;
  const snap = defaultStore.load(def.key);
  return (
    <div className="sd-q sd-q-hub" dir="rtl">
      <main className="sd-q-main" style={{ maxWidth: 860 }}>
        <p><Link className="sd-q-exit" to={"/app/questionnaires"}>לכל השאלונים</Link></p>
        <p className="sd-q-note">מוצגות התשובות שנשמרו בדפדפן הזה (טיוטה). כשיהיה חיבור לשרת יוצגו כאן שאלונים שהושלמו.</p>
        <ViewerLazy def={def} answers={snap?.answers ?? {}} />
      </main>
    </div>
  );
}

export default function QuestionnairesRoutes() {
  useSdFont();
  void requestsAdapter;
  return (
    <Suspense fallback={<CaLoading label="טוען" tone="sky" />}>
      <Routes>
        <Route index element={<Hub />} />
        <Route path="meeting" element={<Meeting />} />
        <Route path=":key/results" element={<ResultsPage />} />
        <Route path=":key" element={<RunnerPage />} />
      </Routes>
    </Suspense>
  );
}
