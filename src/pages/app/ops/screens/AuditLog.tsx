import { useState } from "react";
import { auditCategoriesFor } from "../contracts";
import type { AuditCategory, AuditEntry, AuditQuery } from "../contracts";
import { useOps, useOpsQuery } from "../OpsData";
import { Field, Pager, Pill, QueryView, ScreenHead, Select, fmtDateTime } from "../parts";

const KIND_LABEL: Record<AuditEntry["actorKind"], string> = { user: "משתמש", api_client: "לקוח API", system: "מערכת" };

export default function AuditLog() {
  const { role } = useOps();
  const cats = auditCategoriesFor(role);
  const [f, setF] = useState<AuditQuery>({ page: 1, pageSize: 20, category: "all", actorKind: "all", search: "" });
  const set = (p: Partial<AuditQuery>) => setF((x) => ({ ...x, ...p, page: 1 }));
  const q = useOpsQuery((d) => d.getAuditLog(f, role), [JSON.stringify(f), role], 120_000);
  return (
    <>
      <ScreenHead title="יומן פעולות" question="מי עשה מה ומתי: שינויים בלקוחות, בתהליכים ובמערכת?" asOf={q.data?.asOf} />
      <p className="ops-callout" role="note">היומן הוא לצפייה בלבד ואי אפשר לשנות או למחוק בו.{cats.includes("security") ? "" : " אירועי אבטחה נראים למנהל על בלבד."}</p>
      <div className="ops-toolbar">
        <Field label="חיפוש פעולה או מזהה"><input className="ops-input" type="search" value={f.search ?? ""} onChange={(e) => set({ search: e.target.value })} /></Field>
        {cats.length > 1 && <Select<AuditCategory | "all"> label="קטגוריה" value={f.category ?? "all"} onChange={(v) => set({ category: v })} options={[{ value: "all", label: "הכול" }, { value: "business", label: "תפעול" }, { value: "security", label: "אבטחה" }]} />}
        <Select<AuditEntry["actorKind"] | "all"> label="מבצע" value={f.actorKind ?? "all"} onChange={(v) => set({ actorKind: v })} options={[{ value: "all", label: "הכול" }, { value: "user", label: KIND_LABEL.user }, { value: "system", label: KIND_LABEL.system }, { value: "api_client", label: KIND_LABEL.api_client }]} />
      </div>
      <QueryView q={q} tone="lavender" empty={(p) => (p.total === 0 ? { title: "אין רשומות בסינון הזה", text: "אפשר לנקות את החיפוש או לשנות את המבצע." } : null)}>
        {(p) => (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <caption className="sr-only">יומן פעולות, החדש ראשון</caption>
                <thead><tr><th scope="col">מתי</th><th scope="col">מבצע</th><th scope="col">פעולה</th><th scope="col">משאב</th><th scope="col">קטגוריה</th><th scope="col">מזהה בקשה</th><th scope="col">פרטים</th></tr></thead>
                <tbody>
                  {p.items.map((a) => (
                    <tr key={a.id}>
                      <td data-label="מתי">{fmtDateTime(a.at)}</td>
                      <td data-label="מבצע">{a.actorLabel}<span className="ops-sub">{KIND_LABEL[a.actorKind]}</span></td>
                      <td data-label="פעולה"><b>{a.actionLabel}</b><span className="ops-sub" dir="ltr">{a.action}</span></td>
                      <td data-label="משאב" dir="ltr">{a.resourceId ?? "-"}</td>
                      <td data-label="קטגוריה"><Pill tone={a.category === "security" ? "warn" : "info"}>{a.category === "security" ? "אבטחה" : "תפעול"}</Pill></td>
                      <td data-label="מזהה בקשה" dir="ltr">{a.requestId ?? "-"}</td>
                      <td data-label="פרטים" dir="ltr">{Object.keys(a.meta).length ? Object.entries(a.meta).map(([k, v]) => `${k}=${String(v)}`).join(", ") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={p} onPage={(n) => setF((x) => ({ ...x, page: n }))} />
          </>
        )}
      </QueryView>
    </>
  );
}
