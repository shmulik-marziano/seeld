// Report viewer: mode switch (insurance / financial / unified), print, and (dev only) tier + deposits toggles.
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildReport } from "@/reports/builders";
import { ReportShell } from "@/reports/components/ReportShell";
import { demoReportData } from "@/reports/parsers";
import { ENTITLEMENTS, type LockReason, type ReportMode, type Tier } from "@/reports/types";
import { getUploadedReport } from "./store";
import { InfoOrderPanel } from "./InfoOrderPanel";
import { useReportsBase } from "./base";

const MODES: { id: ReportMode; label: string }[] = [
  { id: "insurance", label: "ביטוח" },
  { id: "financial", label: "פיננסי" },
  { id: "unified", label: "מאוחד" },
];
const TIERS: { id: Tier; label: string }[] = [
  { id: "visitor", label: "מבקר (מצומצם)" },
  { id: "client", label: "לקוח עם אישור צפייה" },
  { id: "agent", label: "תצוגת סוכן" },
];

export default function Viewer() {
  const [sp, setSp] = useSearchParams();
  const mode = (["insurance", "financial", "unified"].includes(sp.get("mode") ?? "") ? sp.get("mode") : "unified") as ReportMode;
  const demo = sp.get("demo") !== "single" ? "family" : "single";
  const DEV = import.meta.env.DEV;
  const tier = (DEV && TIERS.some((t) => t.id === sp.get("tier")) ? sp.get("tier") : "visitor") as Tier;
  const [lock, setLock] = useState<{ id: string; reason: LockReason } | null>(null);
  const base = useReportsBase();

  const uploaded = sp.get("src") === "upload" ? getUploadedReport() : null;
  const data = uploaded ?? demoReportData(demo === "family");
  const isDemo = !uploaded;

  useEffect(() => {
    document.body.classList.add("rp-viewer-open");
    return () => document.body.classList.remove("rp-viewer-open");
  }, []);

  const report = useMemo(() => buildReport(mode, data, ENTITLEMENTS[tier]), [mode, data, tier]);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); n.set(k, v); setSp(n, { replace: true }); };

  return (
    <div className="sd rpx-viewer" dir="rtl">
      <div className="rpx-toolbar rp-noprint" data-rp-chrome>
        <div className="rpx-toolbar-main">
          <Link to={base} className="rpx-back">חזרה להפקת דוח</Link>
          <div role="tablist" aria-label="סוג הדוח" className="rpx-seg">
            {MODES.map((m) => (
              <button key={m.id} role="tab" type="button" aria-selected={mode === m.id} className={mode === m.id ? "is-on" : ""} onClick={() => set("mode", m.id)}>{m.label}</button>
            ))}
          </div>
          <button type="button" className="rpx-btn" onClick={() => window.print()}>הדפסה או שמירה כ-PDF</button>
          {!isDemo && (
            <button type="button" className="rpx-btn rpx-btn-main" onClick={() => setLock({ id: "full-report", reason: "needs_client_authorisation" })}>
              מעבר על הדוח עם הצוות
            </button>
          )}
        </div>
        {isDemo && <p className="rpx-demo" role="note">דוח לדוגמה: כל הנתונים בדויים ונועדו להדגמת העיצוב בלבד.</p>}
        {DEV && (
          <div className="rpx-dev" aria-label="כלי פיתוח">
            <span className="rpx-dev-tag">dev</span>
            <label>הרשאה
              <select value={tier} onChange={(e) => set("tier", e.target.value)}>{TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            </label>
            <label className="rpx-check"><input type="checkbox" checked={ENTITLEMENTS[tier].viewDeposits} onChange={(e) => set("tier", e.target.checked ? "client" : "visitor")} />הפקדות פתוחות</label>
            {isDemo && <label>דוגמה
              <select value={demo} onChange={(e) => set("demo", e.target.value)}><option value="family">משפחה</option><option value="single">לקוח בודד</option></select>
            </label>}
          </div>
        )}
      </div>
      <ReportShell report={report} onLockedClick={(id, reason) => setLock({ id, reason })} />
      <InfoOrderPanel open={lock !== null} blockId={lock?.id ?? null} reason={lock?.reason ?? null} onClose={() => setLock(null)} />
    </div>
  );
}
