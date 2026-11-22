// POA wizard page (/report/start/order, docs/product/POA-WIZARD-SPEC.md §2). Lazy-loaded, off by default:
// with POA_ENABLED false it only redirects to /report/start. The adapter is the poa-intake HTTP adapter; the in-memory
// mock is used only when VITE_POA_ADAPTER is "mock" (development) or when a test injects one.
// Personal details stay in component state: no storage, no analytics. noindex (RouteSeo + this page's own tag).
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { PubPage } from "@/components/sd/pubParts";
import { POA_ENABLED, poaEntryOf, type PoaEntry, type PoaKind } from "@/lib/poa/config";
import { POA_COPY as C, poaStep } from "@/lib/poa/copy";
import { createHttpPoaApi, createMockPoaApi, errorKindOf, ERROR_KINDS, type ErrorKind, type PoaApi } from "@/lib/poa/api";
import { backOf, initialState, progress, reduce, shouldWarn, steps, type PoaEvent } from "@/lib/poa/machine";
import { Welcome } from "./screens/Welcome";
import { Questions } from "./screens/Questions";
import { Review } from "./screens/Review";
import { Maslaka } from "./screens/Maslaka";
import { Harbit } from "./screens/Harbit";
import { Policies } from "./screens/Policies";
import { Done } from "./screens/Done";
import { ErrorScreen } from "./screens/ErrorScreen";
import type { Dir } from "./parts";
import { useTurnstileToken } from "./useTurnstileToken";
import "@/questionnaires/questionnaires.css";
import "@/components/risk/risk.css";
import "./poa.css";

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

/** Dev builds only: ?poa_mock_fail=<kind> makes the mock fail every call, to see the error screens. */
function devFail(): ErrorKind | undefined {
  if (!import.meta.env.DEV || typeof window === "undefined") return undefined;
  const v = new URLSearchParams(window.location.search).get("poa_mock_fail");
  return (ERROR_KINDS as readonly string[]).includes(v ?? "") ? (v as ErrorKind) : undefined;
}

export default function PoaFlow({ api }: { api?: PoaApi }) {
  if (!POA_ENABLED) return <Navigate to="/report/start" replace />;
  return <PoaWizard api={api} />;
}

export function PoaWizard({ api: injected, entry: injectedEntry }: { api?: PoaApi; entry?: PoaEntry }) {
  useNoIndex();
  // The entry context is read once from `?from=` (spec ס0); it changes the first line of ס0 only.
  const entry = useMemo<PoaEntry>(
    () => injectedEntry ?? poaEntryOf(typeof window === "undefined" ? "" : window.location.search),
    [injectedEntry],
  );
  const api = useMemo<PoaApi>(() => {
    if (injected) return injected;
    if (import.meta.env.VITE_POA_ADAPTER !== "mock") return createHttpPoaApi();
    const code = devFail();
    return createMockPoaApi({ delayMs: 250, ...(code ? { fail: { code } } : {}) });
  }, [injected]);
  const turnstile = useTurnstileToken();
  const [state, dispatchRaw] = useReducer(reduce, undefined, initialState);
  const [dir, setDir] = useState<Dir>("fwd");
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<Partial<Record<PoaKind, { pdf: Blob; sha: string }>>>({});
  const [now, setNow] = useState(() => new Date());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);

  const dispatch = (e: PoaEvent, d: Dir = "fwd") => { interacted.current = true; setDir(d); dispatchRaw(e); };
  const fail = (e: unknown) => dispatch({ type: "FAIL", code: errorKindOf(e) });

  // Focus the heading of every new screen (never on the first paint).
  useEffect(() => {
    if (!interacted.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const card = cardRef.current;
    if (card) {
      const top = card.getBoundingClientRect().top;
      if (top < 64 || top > window.innerHeight * 0.4) card.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [state.screen, state.q]);

  // Session clock: the 2-minute warning and the expiry screen lean on expires_at from the server.
  useEffect(() => {
    if (!state.session) return;
    const t = window.setInterval(() => { const n = new Date(); setNow(n); dispatchRaw({ type: "TICK", now: n }); }, 5_000);
    return () => window.clearInterval(t);
  }, [state.session]);

  // Fetch the document the server shows for this module; its hash goes back with the approval (spec §3).
  const screen = state.screen;
  useEffect(() => {
    if (screen !== "maslaka" && screen !== "harbit" && screen !== "policies") return;
    if (previews[screen]) return;
    let live = true;
    api.preview(screen).then(
      (r) => { if (live) setPreviews((p) => ({ ...p, [screen]: { pdf: r.pdf, sha: r.preview_sha256 } })); },
      (e) => { if (live) fail(e); },
    );
    return () => { live = false; };
  }, [screen, api]); // eslint-disable-line react-hooks/exhaustive-deps

  // A restart (expiry, editing after start) forgets the previews of the old session.
  useEffect(() => { if (!state.session) setPreviews({}); }, [state.session]);

  const run = async (fn: () => Promise<PoaEvent>) => {
    setBusy(true);
    try { dispatch(await fn()); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const consent = (kind: PoaKind, extra: Record<string, string> = {}) => run(async () => {
    const p = previews[kind];
    const res = await api.consent(kind, { preview_sha256: p?.sha ?? "", ...extra });
    return { type: "CONSENTED", res };
  });
  const confirm = () => {
    if (state.started) return dispatch({ type: "FORWARD" });
    const d = state.details;
    return run(async () => {
      try {
        const turnstile_token = await turnstile.waitForToken();
        return {
          type: "STARTED",
          res: await api.start({
            first_name: d.first, last_name: d.last, national_id: d.id, phone: d.phone, email: d.email || null,
            street: d.street, city: d.city, terms_privacy_approved: true, marketing_approved: d.marketing, turnstile_token,
          }),
        };
      } finally {
        turnstile.reset(); // a Turnstile token works once, also when the call failed
      }
    });
  };

  const prog = progress(state);
  const back = backOf(state) ? () => dispatch({ type: "BACK" }, "back") : undefined;
  const base = { headingRef, dir, prog, busy };
  const warn = shouldWarn(state, now);
  const list = steps(state);

  let body: JSX.Element;
  switch (state.screen) {
    case "s0": body = <Welcome {...base} entry={entry} onStart={() => dispatch({ type: "START" })} />; break;
    case "q": body = <Questions {...base} q={state.q} details={state.details} onAnswer={(patch) => dispatch({ type: "ANSWER", patch })} onBack={back!} />; break;
    case "s2a": body = (
      <Review {...base} details={state.details} started={state.started}
        turnstile={turnstile.widget} onConfirm={confirm} onEdit={() => dispatch({ type: "EDIT" }, "back")} onBack={back} />
    ); break;
    case "maslaka": body = <Maslaka {...base} pdf={previews.maslaka?.pdf ?? null} onSubmit={() => consent("maslaka")} onBack={back} />; break;
    case "harbit": body = <Harbit {...base} pdf={previews.harbit?.pdf ?? null} onSubmit={() => consent("harbit", { birth_date: state.details.birth, issue_date: state.details.issue })} onBack={back} />; break;
    case "policies": body = <Policies {...base} pdf={previews.policies?.pdf ?? null} onSubmit={(png) => consent("policies", { signature_png: png })} onBack={back} />; break;
    case "s7": body = <Done {...base} done={state.done} preDone={state.preDone} api={api} />; break;
    default: body = (
      <ErrorScreen kind={state.error ?? "generic"} headingRef={headingRef}
        onRetry={() => dispatch({ type: "RETRY" })} onRestart={() => dispatch({ type: "RESTART" }, "back")} />
    );
  }

  return (
    <PubPage tint="sky">
      <div className="sd-poa-page">
        <div className="sd-rk-wrap sd-poa-wrap">
          <h1 className="sd-poa-h1">{C.s0.eyebrow}</h1>
          <div className="sd-q sd-poa-q" ref={cardRef}>
            {prog && (
              <div className="sd-q-progress" role="group" aria-label={C.common.progressLabel}>
                <ol className="sd-q-segs" aria-hidden="true">
                  {list.map((s, i) => (
                    <li key={s} className={`${i < prog.n - 1 ? "is-done" : ""} ${i === prog.n - 1 ? "is-cur" : ""}`}>
                      <i style={{ width: i < prog.n - 1 ? "100%" : "0%" }} />
                    </li>
                  ))}
                </ol>
                <p className="sd-q-progress-text"><span>{poaStep(prog.n, prog.m)}</span></p>
              </div>
            )}
            {warn && (
              <div className="sd-poa-warn" role="alert">
                <p>{C.s8.warn}</p>
                <button type="button" className="sd-q-btn is-quiet" onClick={() => dispatchRaw({ type: "DISMISS_WARN" })}>{C.s8.warnAction}</button>
              </div>
            )}
            <div key={state.screen === "q" ? `q${state.q}` : state.screen}>{body}</div>
          </div>
        </div>
      </div>
    </PubPage>
  );
}
