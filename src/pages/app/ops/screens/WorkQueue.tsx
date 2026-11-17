import { useState } from "react";
import { BAND_LABEL, BAND_TONE, PROCESS_LABEL, SYNC_LABEL, SYNC_TONE, urgencyBand } from "../contracts";
import type { SyncStatus, UrgencyBand, WorkQueueQuery } from "../contracts";
import { useAgents, useOpsQuery } from "../OpsData";
import { DisabledAction, Field, Pager, Pill, QueryView, ScreenHead, Select, ageFrom, fmtDateTime } from "../parts";

const BULK_REASON = "פעולות המוניות ייפתחו אחרי שתור הפעולות המאובטח ויומן הפעולות יחוברו. בשלב זה התור לקריאה בלבד.";

export default function WorkQueue() {
  const [f, setF] = useState<WorkQueueQuery>({ page: 1, pageSize: 15, assignment: "all", syncStatus: "all", band: "all", agentId: null, search: "" });
  const { agents, label } = useAgents();
  const set = (p: Partial<WorkQueueQuery>) => setF((x) => ({ ...x, ...p, page: 1 }));
  const q = useOpsQuery((d) => d.getWorkQueue(f), [JSON.stringify(f)], 120_000);
  return (
    <>
      <ScreenHead title="תור עבודה" question="מה הכי דחוף עכשיו, אצל מי זה, ומה הפעולה האחרונה שנעשתה?" asOf={q.data?.asOf} />
      <div className="ops-toolbar">
        <Field label="חיפוש לפי מזהה או פעולה"><input className="ops-input" type="search" value={f.search ?? ""} onChange={(e) => set({ search: e.target.value })} placeholder="למשל C-4821" /></Field>
        <Select label="סוכן" value={f.agentId ?? "all"} onChange={(v) => set({ agentId: v === "all" ? null : v, assignment: "all" })} options={[{ value: "all", label: "כולם" }, ...agents.map((a) => ({ value: a.id, label: a.label }))]} />
        <Select label="שיוך" value={f.assignment ?? "all"} onChange={(v) => set({ assignment: v as "all" | "unassigned", agentId: null })} options={[{ value: "all", label: "הכול" }, { value: "unassigned", label: "לא משויך" }]} />
        <Select<UrgencyBand | "all"> label="דחיפות" value={f.band ?? "all"} onChange={(v) => set({ band: v })} options={[{ value: "all", label: "הכול" }, ...(["critical", "high", "normal", "low"] as UrgencyBand[]).map((b) => ({ value: b, label: BAND_LABEL[b] }))]} />
        <Select<SyncStatus | "all"> label="סנכרון" value={f.syncStatus ?? "all"} onChange={(v) => set({ syncStatus: v })} options={[{ value: "all", label: "הכול" }, ...(["synced", "pending", "retrying", "failed", "dead_letter", "not_applicable"] as SyncStatus[]).map((s) => ({ value: s, label: SYNC_LABEL[s] }))]} />
      </div>
      <div className="ops-bulk" role="group" aria-label="פעולות המוניות (מושבתות בשלב זה)">
        <DisabledAction id="bulk-assign" reason={BULK_REASON}>שיוך לסוכן</DisabledAction>
        <DisabledAction id="bulk-prio" reason={BULK_REASON}>שינוי עדיפות</DisabledAction>
        <DisabledAction id="bulk-done" reason={BULK_REASON}>סימון כטופל</DisabledAction>
      </div>
      <QueryView q={q} empty={(p) => (p.total === 0 ? { title: "אין פריטים שמתאימים לסינון", text: "אפשר לנקות סינון, או שאין כרגע עבודה פתוחה." } : null)}>
        {(p) => (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <caption className="sr-only">תור עבודה לפי דחיפות</caption>
                <thead>
                  <tr>
                    <th scope="col">דחיפות</th><th scope="col">לקוח או ליד</th><th scope="col">תהליך ושלב</th><th scope="col">הצעד הבא</th>
                    <th scope="col">סוכן</th><th scope="col">פעולה אחרונה</th><th scope="col">סנכרון</th><th scope="col">יעד</th>
                  </tr>
                </thead>
                <tbody>
                  {p.items.map((w) => {
                    const band = urgencyBand(w.urgency);
                    const late = new Date(w.slaDueAt) < new Date();
                    return (
                      <tr key={w.id}>
                        <td data-label="דחיפות"><Pill tone={BAND_TONE[band]}>{BAND_LABEL[band]} {w.urgency}</Pill></td>
                        <td data-label="לקוח או ליד"><b dir="ltr">{w.customerRef}</b> <span className="ops-note">{w.kind === "lead" ? "ליד" : "לקוח"}</span></td>
                        <td data-label="תהליך ושלב">{PROCESS_LABEL[w.process]}<span className="ops-sub">{w.stage}</span></td>
                        <td data-label="הצעד הבא">{w.nextStep}</td>
                        <td data-label="סוכן">{label(w.assignedAgentId)}</td>
                        <td data-label="פעולה אחרונה">{w.lastAction.label}<span className="ops-sub">לפני {ageFrom(w.lastAction.at)}</span></td>
                        <td data-label="סנכרון"><Pill tone={SYNC_TONE[w.syncStatus]}>{SYNC_LABEL[w.syncStatus]}</Pill></td>
                        <td data-label="יעד">{late ? <Pill tone="bad">באיחור {ageFrom(w.slaDueAt)}</Pill> : <span>{fmtDateTime(w.slaDueAt)}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={p} onPage={(n) => setF((x) => ({ ...x, page: n }))} />
            <details className="ops-explain">
              <summary>איך מחושבת הדחיפות</summary>
              <p>ציון 0 עד 100 שמורכב מלחץ זמן מול היעד (עד 50), עדיפות (עד 20), תקלת סנכרון (עד 15), זמן ללא פעולה (עד 10) וחוסר שיוך (5). אותה נוסחה תחושב בשרת כשהנתונים יהיו חיים.</p>
            </details>
          </>
        )}
      </QueryView>
    </>
  );
}
