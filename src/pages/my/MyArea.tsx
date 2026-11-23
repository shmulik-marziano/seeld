// The client area (/my, docs/product/CLIENT-AREA-SPEC.md). Lazy-loaded, off by default: with CLIENT_AREA_ENABLED false
// it only redirects home. The adapter is the client-area HTTP adapter; the in-memory mock is used only when
// VITE_CLIENT_AREA_ADAPTER is "mock" (development) or when a test injects one. noindex (RouteSeo + this page's own tag).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { PubPage } from "@/components/sd/pubParts";
import { CaError, CaLoading } from "@/components/sd/client";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { CLIENT_AREA_ENABLED, MY_ROUTE } from "@/lib/client-area/config";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { type ClientApi, CLIENT_ERROR_KINDS, type ClientErrorKind, createHttpClientApi, createMockClientApi, errorKindOf, type MeRes } from "@/lib/client-area/api";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Portfolio } from "./screens/Portfolio";
import { Documents } from "./screens/Documents";
import "@/questionnaires/questionnaires.css";
import "@/components/risk/risk.css";
import "@/pages/report-order/poa.css";
import "./my.css";

function useNoIndex() {
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m);
    const prev = document.title;
    document.title = C.common.pageTitle;
    return () => { document.head.removeChild(m); document.title = prev; };
  }, []);
}

/** Dev builds only: ?my_mock_fail=<kind> makes the mock fail every call, to see the error screens. */
function devFail(): ClientErrorKind | undefined {
  if (!import.meta.env.DEV || typeof window === "undefined") return undefined;
  const v = new URLSearchParams(window.location.search).get("my_mock_fail");
  return (CLIENT_ERROR_KINDS as readonly string[]).includes(v ?? "") ? (v as ClientErrorKind) : undefined;
}

export default function MyArea({ api }: { api?: ClientApi }) {
  if (!CLIENT_AREA_ENABLED) return <Navigate to="/" replace />;
  return <MyShell api={api} />;
}

type Phase = { kind: "checking" } | { kind: "out" } | { kind: "in"; me: MeRes } | { kind: "error"; code: ClientErrorKind };

export function MyShell({ api: injected }: { api?: ClientApi }) {
  useNoIndex();
  const navigate = useNavigate();
  const api = useMemo<ClientApi>(() => {
    if (injected) return injected;
    if (import.meta.env.VITE_CLIENT_AREA_ADAPTER !== "mock") return createHttpClientApi();
    const code = devFail();
    return createMockClientApi({ delayMs: 250, ...(code ? { fail: { code } } : {}) });
  }, [injected]);
  const [phase, setPhase] = useState<Phase>(() => (api.hasSession() ? { kind: "checking" } : { kind: "out" }));
  const [tick, setTick] = useState(0);

  const loadMe = useCallback(() => {
    setPhase({ kind: "checking" });
    api.me().then((me) => setPhase({ kind: "in", me }), (e) => {
      const kind = errorKindOf(e);
      setPhase(kind === "unauthenticated" ? { kind: "out" } : { kind: "error", code: kind });
    });
  }, [api]);
  useEffect(() => { if (api.hasSession()) loadMe(); }, [api, loadMe, tick]);

  const signOut = useCallback(async () => {
    await api.logout();
    setPhase({ kind: "out" });
    navigate(MY_ROUTE, { replace: true });
  }, [api, navigate]);
  const authLost = useCallback(() => { void api.logout(); setPhase({ kind: "error", code: "unauthenticated" }); }, [api]);

  const signedIn = phase.kind === "in";
  let body: JSX.Element;
  if (phase.kind === "checking") body = <CaLoading label={C.common.loading} tone="sage" />;
  else if (phase.kind === "error") {
    const contact = <div className="sd-ca-actions"><ContactIcons dept="general" tone="dark" /></div>;
    body = phase.code === "inactive" ? <CaError title={C.errors.inactive} headingLevel={2}>{contact}</CaError>
      : phase.code === "unauthenticated" ? <CaError title={C.errors.sessionEnded} headingLevel={2} onRetry={() => setPhase({ kind: "out" })} actionLabel={C.errors.toLogin} />
      : phase.code === "unavailable" ? <CaError title={C.errors.unavailable} text={C.errors.unavailableText} headingLevel={2} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />
      : <CaError title={C.errors.generic} headingLevel={2} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />;
  } else if (phase.kind === "out") {
    body = (
      <Routes>
        <Route index element={<Login api={api} onSignedIn={() => { loadMe(); navigate(`${MY_ROUTE}/home`, { replace: true }); }} onError={(e) => setPhase({ kind: "error", code: errorKindOf(e) })} />} />
        <Route path="*" element={<Navigate to={MY_ROUTE} replace />} />
      </Routes>
    );
  } else {
    body = (
      <Routes>
        <Route index element={<Navigate to={`${MY_ROUTE}/home`} replace />} />
        <Route path="home" element={<Home me={phase.me} />} />
        <Route path="portfolio" element={<Portfolio api={api} onAuthLost={authLost} />} />
        <Route path="documents" element={<Documents api={api} onAuthLost={authLost} />} />
        <Route path="*" element={<Navigate to={`${MY_ROUTE}/home`} replace />} />
      </Routes>
    );
  }

  return (
    <PubPage tint="sage">
      <div className="sd-poa-page sd-my-page">
        <div className="sd-rk-wrap sd-poa-wrap sd-my-wrap">
          <div className="sd-my-top">
            <h1 className="sd-poa-h1">{C.common.eyebrow}</h1>
            {signedIn && <button type="button" className="sd-q-linkbtn sd-my-logout" onClick={() => void signOut()}>{C.common.logout}</button>}
          </div>
          {signedIn && (
            <nav className="sd-my-nav" aria-label={C.common.navLabel}>
              <NavLink to={`${MY_ROUTE}/home`}>{C.common.nav.home}</NavLink>
              <NavLink to={`${MY_ROUTE}/portfolio`}>{C.common.nav.portfolio}</NavLink>
              <NavLink to={`${MY_ROUTE}/documents`}>{C.common.nav.documents}</NavLink>
            </nav>
          )}
          <div className="sd-q sd-poa-q sd-my-q">{body}</div>
        </div>
      </div>
    </PubPage>
  );
}
