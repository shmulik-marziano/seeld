// The client area (/my, docs/product/CLIENT-AREA-SPEC.md). Lazy-loaded, off by default: with CLIENT_AREA_ENABLED false
// it only redirects home. Its own app frame (no site header or footer): a top bar, the screen, a bottom tab bar on phones.
// The adapter is the client-area HTTP adapter; the in-memory mock is used when VITE_CLIENT_AREA_ADAPTER is "mock"
// (development), when a test injects one, and for the staff preview (/my?preview=1 on a browser signed in to the staff
// side: fictional data, no SMS, a banner says so). noindex (RouteSeo + this page's own tag).
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { CaError, CaLoading } from "@/components/sd/client";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { useSdFont } from "@/components/sd/primitives";
import { CLIENT_AREA_ENABLED, MY_ROUTE } from "@/lib/client-area/config";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { type ClientApi, CLIENT_ERROR_KINDS, type ClientErrorKind, createHttpClientApi, createMockClientApi, errorKindOf, type MeRes, type PortfolioRes, type RequestTopic } from "@/lib/client-area/api";
import { createMemorySessionStore } from "@/lib/client-area/session";
import { Area, type AreaCtx, type Loaded } from "./context";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Savings } from "./screens/Portfolio";
import { Insurance } from "./screens/Insurance";
import { Requests, RequestSheet } from "./screens/Requests";
import { Documents } from "./screens/Documents";
import { HarbCard } from "./screens/HarbCard";
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

/** ?preview=1 and a staff session on this browser (any Supabase auth token in storage). Fictional data only. */
function staffPreview(): boolean {
  if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("preview") !== "1") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return true;
    }
  } catch { /* storage blocked */ }
  return false;
}

export default function MyArea({ api }: { api?: ClientApi }) {
  if (!CLIENT_AREA_ENABLED) return <Navigate to="/" replace />;
  return <MyShell api={api} />;
}

type Phase = { kind: "checking" } | { kind: "out" } | { kind: "in"; me: MeRes } | { kind: "error"; code: ClientErrorKind };

const TABS: { to: string; label: string; icon: BrandIconName; requests?: boolean }[] = [
  { to: "home", label: C.common.nav.home, icon: "home" },
  { to: "savings", label: C.common.nav.savings, icon: "chart" },
  { to: "insurance", label: C.common.nav.insurance, icon: "shield" },
  { to: "requests", label: C.common.nav.requests, icon: "message", requests: true },
  { to: "documents", label: C.common.nav.documents, icon: "document" },
];

export function MyShell({ api: injected }: { api?: ClientApi }) {
  useNoIndex();
  useSdFont();
  const navigate = useNavigate();
  const [preview] = useState(() => !injected && staffPreview());
  const api = useMemo<ClientApi>(() => {
    if (injected) return injected;
    if (preview) {
      const store = createMemorySessionStore();
      store.write("preview-session", new Date(Date.now() + 3600_000).toISOString());
      return createMockClientApi({ delayMs: 150, store, harbEnabled: false });
    }
    if (import.meta.env.VITE_CLIENT_AREA_ADAPTER !== "mock") return createHttpClientApi();
    const code = devFail();
    return createMockClientApi({ delayMs: 250, ...(code ? { fail: { code } } : {}) });
  }, [injected, preview]);
  const [phase, setPhase] = useState<Phase>(() => (api.hasSession() ? { kind: "checking" } : { kind: "out" }));
  const [tick, setTick] = useState(0);
  const [portfolio, setPortfolio] = useState<Loaded<PortfolioRes>>({ state: "loading" });
  const [pfTick, setPfTick] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [requestsEnabled, setRequestsEnabled] = useState<boolean | null>(null);
  const [requestsTick, setRequestsTick] = useState(0);
  const [sheet, setSheet] = useState<{ topic: RequestTopic | null } | null>(null);

  const loadMe = useCallback(() => {
    setPhase({ kind: "checking" });
    api.me().then((me) => setPhase({ kind: "in", me }), (e) => {
      const kind = errorKindOf(e);
      setPhase(kind === "unauthenticated" ? { kind: "out" } : { kind: "error", code: kind });
    });
  }, [api]);
  useEffect(() => { if (api.hasSession()) loadMe(); }, [api, loadMe, tick]);

  const authLost = useCallback(() => { void api.logout(); setPhase({ kind: "error", code: "unauthenticated" }); }, [api]);
  const signedIn = phase.kind === "in";

  // the portfolio once per sign-in (home, savings and insurance read the same answer), and whether requests are open
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    setPortfolio({ state: "loading" });
    api.portfolio().then((data) => { if (live) setPortfolio({ state: "ok", data }); }, (e) => {
      if (!live) return;
      if (errorKindOf(e) === "unauthenticated") authLost();
      else setPortfolio({ state: "error", text: errorKindOf(e) === "unavailable" ? C.errors.unavailable : C.errors.generic });
    });
    return () => { live = false; };
  }, [api, signedIn, pfTick, authLost]);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    api.requests().then((r) => { if (live) setRequestsEnabled(r.enabled); }, () => { if (live) setRequestsEnabled(false); });
    return () => { live = false; };
  }, [api, signedIn]);

  const signOut = useCallback(async () => {
    await api.logout();
    setPhase({ kind: "out" });
    setPortfolio({ state: "loading" });
    navigate(MY_ROUTE, { replace: true });
  }, [api, navigate]);

  if (phase.kind !== "in") {
    let body: JSX.Element;
    if (phase.kind === "checking") body = <CaLoading label={C.common.loading} tone="sage" />;
    else if (phase.kind === "error") {
      const contact = <div className="sd-ca-actions"><ContactIcons dept="general" tone="dark" /></div>;
      body = phase.code === "inactive" ? <CaError title={C.errors.inactive} headingLevel={2}>{contact}</CaError>
        : phase.code === "unauthenticated" ? <CaError title={C.errors.sessionEnded} headingLevel={2} onRetry={() => setPhase({ kind: "out" })} actionLabel={C.errors.toLogin} />
        : phase.code === "unavailable" ? <CaError title={C.errors.unavailable} text={C.errors.unavailableText} headingLevel={2} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />
        : <CaError title={C.errors.generic} headingLevel={2} onRetry={() => setTick((t) => t + 1)} actionLabel={C.errors.retry} />;
    } else {
      body = (
        <Routes>
          <Route index element={<Login api={api} onSignedIn={() => { loadMe(); navigate(`${MY_ROUTE}/home`, { replace: true }); }} onError={(e) => setPhase({ kind: "error", code: errorKindOf(e) })} />} />
          <Route path="*" element={<Navigate to={MY_ROUTE} replace />} />
        </Routes>
      );
    }
    return (
      <div className="sd ma ma-out" dir="rtl">
        <div className="ma-out-top">
          <div className="ma-brand is-light"><span className="ma-mark">S</span><span>SEELD</span></div>
          <h1 className="ma-out-h1">{C.common.eyebrow}</h1>
          <p className="ma-out-lead">{C.login.tagline}</p>
        </div>
        <div className="ma-out-card sd-q sd-poa-q sd-my-q">{body}</div>
      </div>
    );
  }

  const ctx: AreaCtx = {
    api, me: phase.me, portfolio, reloadPortfolio: () => setPfTick((t) => t + 1),
    hidden, toggleHidden: () => setHidden((h) => !h),
    requestsEnabled, requestsTick, openRequest: (topic) => setSheet({ topic }), onAuthLost: authLost,
  };
  const tabs = TABS.filter((t) => !t.requests || requestsEnabled);
  const initial = phase.me.client.first_name.trim().charAt(0);

  return (
    <Area.Provider value={ctx}>
      <div className="sd ma" dir="rtl">
        <div className="ma-frame">
          {preview && <p className="ma-preview" role="note">{C.common.preview}</p>}
          <header className="ma-top">
            <div className="ma-brand"><span className="ma-mark">S</span><span className="ma-brand-txt"><b>SEELD</b><small>{C.common.brandSub}</small></span></div>
            <div className="ma-top-end">
              <button type="button" className="ma-linkbtn" onClick={() => void signOut()}>{C.common.logout}</button>
              {initial && <span className="ma-avatar" aria-hidden="true">{initial}</span>}
            </div>
          </header>
          <main className="ma-main sd-q sd-poa-q sd-my-q">
            <Routes>
              <Route index element={<Navigate to={`${MY_ROUTE}/home`} replace />} />
              <Route path="home" element={<Home />} />
              <Route path="savings" element={<Savings />} />
              <Route path="insurance" element={<Insurance />} />
              <Route path="requests" element={requestsEnabled === false ? <Navigate to={`${MY_ROUTE}/home`} replace /> : <Requests />} />
              <Route path="documents" element={<><Documents api={api} onAuthLost={authLost} /><HarbCard api={api} onAuthLost={authLost} /></>} />
              <Route path="portfolio" element={<Navigate to={`${MY_ROUTE}/savings`} replace />} />
              <Route path="*" element={<Navigate to={`${MY_ROUTE}/home`} replace />} />
            </Routes>
          </main>
          <nav className="ma-tabs" aria-label={C.common.navLabel} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((t) => (
              <NavLink key={t.to} to={`${MY_ROUTE}/${t.to}`}><BrandIcon name={t.icon} size={22} />{t.label}</NavLink>
            ))}
          </nav>
        </div>
        {sheet && (
          <RequestSheet
            topic={sheet.topic}
            onClose={() => setSheet(null)}
            onSent={() => setRequestsTick((t) => t + 1)}
            onShowList={() => { setSheet(null); navigate(`${MY_ROUTE}/requests`); }}
          />
        )}
      </div>
    </Area.Provider>
  );
}
