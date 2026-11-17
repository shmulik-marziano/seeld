import { useState } from "react";
import { SYSTEM_LABEL, can } from "../contracts";
import type { DeadLetterQuery, SystemId } from "../contracts";
import { useOps, useOpsQuery } from "../OpsData";
import { DisabledAction, Pager, Pill, QueryView, ScreenHead, Select, ageFrom, fmtDateTime } from "../parts";

const STEP_UP = "הפעולה תיפתח בשלב הבא ותדרוש אימות דו-שלבי (TOTP) וכתיבה ליומן הפעולות. בשלב זה המסך לקריאה בלבד.";

export default function DeadLetters() {
  const { role } = useOps();
  const canAct = can(role, "ops.deadletter.act");
  const [f, setF] = useState<DeadLetterQuery>({ page: 1, pageSize: 12, destination: "all", reasonCode: "all" });
  const set = (p: Partial<DeadLetterQuery>) => setF((x) => ({ ...x, ...p, page: 1 }));
  const q = useOpsQuery((d) => d.getDeadLetters(f), [JSON.stringify(f)], 60_000);
  return (
    <>
      <ScreenHead title="הודעות שנכשלו" question="אילו עדכונים לא הגיעו למערכות אחרי כל הניסיונות, למה, אילו לקוחות מושהים בגללן?" asOf={q.data?.asOf} />
      {!canAct && <p className="ops-callout" role="note">צפייה בלבד. ניסיון חוזר ומחיקה זמינים למנהל על בלבד.</p>}
      <div className="ops-toolbar">
        <Select<SystemId | "all"> label="יעד" value={f.destination ?? "all"} onChange={(v) => set({ destination: v })} options={[{ value: "all", label: "הכול" }, { value: "salesforce", label: SYSTEM_LABEL.salesforce }, { value: "surense", label: SYSTEM_LABEL.surense }]} />
        <Select label="סיבה" value={f.reasonCode ?? "all"} onChange={(v) => set({ reasonCode: v })} options={[{ value: "all", label: "הכול" }, { value: "record_locked", label: "רשומה נעולה" }, { value: "validation_failed", label: "שדה לא תקין" }, { value: "auth_expired", label: "הרשאה פגה" }, { value: "unknown_field", label: "שדה לא קיים" }, { value: "duplicate_conflict", label: "התנגשות" }]} />
      </div>
      <QueryView q={q} tone="rose" empty={(p) => (p.total === 0 ? { title: "אין הודעות שנכשלו", text: "כל העדכונים הגיעו ליעד. כשהודעה תיכשל שלוש פעמים היא תופיע כאן." } : null)}>
        {(p) => (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <caption className="sr-only">הודעות שנכשלו, החדשה ראשונה</caption>
                <thead>
                  <tr>
                    <th scope="col">מזהה</th><th scope="col">יעד</th><th scope="col">לקוח</th><th scope="col">אירוע</th><th scope="col">סיבה</th><th scope="col">ניסיונות</th><th scope="col">נכשלה</th><th scope="col">השפעה</th>
                    {canAct && <th scope="col">פעולות</th>}
                  </tr>
                </thead>
                <tbody>
                  {p.items.map((d) => (
                    <tr key={d.id}>
                      <td data-label="מזהה" dir="ltr">{d.id}</td>
                      <td data-label="יעד">{SYSTEM_LABEL[d.destination]}</td>
                      <td data-label="לקוח" dir="ltr">{d.customerRef}</td>
                      <td data-label="אירוע" dir="ltr">{d.eventType}</td>
                      <td data-label="סיבה"><b>{d.reasonText}</b><span className="ops-sub" dir="ltr">{d.reasonCode}</span></td>
                      <td data-label="ניסיונות">{d.attempts}</td>
                      <td data-label="נכשלה">לפני {ageFrom(d.deadAt)}<span className="ops-sub">{fmtDateTime(d.deadAt)}</span></td>
                      <td data-label="השפעה">{d.customerHalted ? <Pill tone="bad">לקוח מושהה, {d.haltedBehind} ממתינות</Pill> : <Pill tone="muted">ללא השהיה</Pill>}</td>
                      {canAct && (
                        <td data-label="פעולות">
                          <span className="ops-actions">
                            <DisabledAction id={`retry-${d.id}`} reason={STEP_UP}>ניסיון חוזר</DisabledAction>
                            <DisabledAction id={`discard-${d.id}`} reason={STEP_UP}>השלכה</DisabledAction>
                          </span>
                        </td>
                      )}
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
