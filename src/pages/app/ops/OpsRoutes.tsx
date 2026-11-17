// Ops Console shell + routes, mounted (lazy) at /app/ops/* inside the agent portal guard (src/App.tsx).
// Role gate: manager and super_admin only (access.ts). Production builds resolve to no access until real roles exist.
import { lazy, Suspense } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { CaLoading } from "@/components/sd/client";
import { tintStyle, useSdFont } from "@/components/sd/primitives";
import { OPS_HOME, useOpsRole } from "./access";
import { ROLE_LABEL, can } from "./contracts";
import type { OpsDataSource, OpsRole } from "./contracts";
import { OpsProvider, useOps } from "./OpsData";
import "./ops.css";

const Overview = lazy(() => import("./screens/Overview"));
const Funnel = lazy(() => import("./screens/Funnel"));
const WorkQueue = lazy(() => import("./screens/WorkQueue"));
const Processes = lazy(() => import("./screens/Processes"));
const Inquiries = lazy(() => import("./screens/Inquiries"));
const Integrations = lazy(() => import("./screens/Integrations"));
const DeadLetters = lazy(() => import("./screens/DeadLetters"));
const AuditLog = lazy(() => import("./screens/AuditLog"));
const Settings = lazy(() => import("./screens/Settings"));

interface NavItem { to: string; label: string; end?: boolean; superOnly?: boolean }
export const OPS_NAV: NavItem[] = [
  { to: "/app/ops", label: "מבט-על", end: true },
  { to: "/app/ops/funnel", label: "משפך תהליכים" },
  { to: "/app/ops/queue", label: "תור עבודה" },
  { to: "/app/ops/processes", label: "מעקב תהליכים" },
  { to: "/app/ops/inquiries", label: "פניות ובקשות" },
  { to: "/app/ops/integrations", label: "בריאות מערכות" },
  { to: "/app/ops/dead-letters", label: "הודעות שנכשלו" },
  { to: "/app/ops/audit", label: "יומן פעולות" },
  { to: "/app/ops/settings", label: "הגדרות מערכת", superOnly: true },
];

function Shell() {
  const { role, ds, refresh, autoRefresh, setAutoRefresh } = useOps();
  const items = OPS_NAV.filter((n) => !n.superOnly || can(role, "ops.settings.view"));
  return (
    <div className="ops">
      <header className="ops-top">
        <div className="ops-top-title">
          <span className="sd-eyebrow">מרכז תפעול</span>
          <h1 className="ops-h1">חדר הבקרה של האתר</h1>
        </div>
        <div className="ops-top-side">
          <span className="ops-role" title="התפקיד הנוכחי">{ROLE_LABEL[role]}</span>
          <label className="ops-auto"><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />רענון אוטומטי</label>
          <button type="button" className="btn-secondary ops-btn-sm" onClick={refresh}>רענון עכשיו</button>
        </div>
      </header>
      {ds.kind === "mock" && <p className="ops-mock" role="note">נתוני הדגמה. המסכים עדיין לא מחוברים למערכות החיות.</p>}
      <nav className="ops-tabs" aria-label="מסכי מרכז התפעול">
        {items.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className="ops-tab">{n.label}</NavLink>)}
      </nav>
      <div className="ops-body" id="ops-main" tabIndex={-1}>
        <Suspense fallback={<CaLoading label="טוען מסך" tone="sky" />}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="funnel" element={<Funnel />} />
            <Route path="queue" element={<WorkQueue />} />
            <Route path="processes" element={<Processes />} />
            <Route path="inquiries" element={<Inquiries />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="dead-letters" element={<DeadLetters />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to={OPS_HOME} replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

/** `ds` and `forceRole` exist for tests and the dev screenshot harness only. */
export default function OpsRoutes({ ds, forceRole }: { ds?: OpsDataSource; forceRole?: OpsRole }) {
  useSdFont();
  const state = useOpsRole();
  const role = forceRole && !import.meta.env.PROD ? forceRole : state.role;
  if (!role || !can(role, "ops.view")) return <Navigate to="/app/dashboard" replace />;
  return (
    <div className="sd ops-sd" dir="rtl" style={tintStyle("sky")}>
      <OpsProvider role={role} ds={ds}>
        <Shell />
      </OpsProvider>
    </div>
  );
}
