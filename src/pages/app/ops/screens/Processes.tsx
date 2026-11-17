import { useState } from "react";
import { PROCESS_LABEL, PROCESS_TYPES, SLA_LABEL, SLA_TONE, SYNC_LABEL, SYNC_TONE, formatAge, minutesBetween, slaState } from "../contracts";
import type { ProcessQuery, ProcessType, SlaState } from "../contracts";
import { useAgents, useOpsQuery } from "../OpsData";
import { Pager, Pill, QueryView, ScreenHead, Select, ageFrom, fmtDateTime } from "../parts";

export default function Processes() {
  const [f, setF] = useState<ProcessQuery>({ page: 1, pageSize: 15, process: "all", sla: "all", agentId: null });
  const { agents, label } = useAgents();
  const set = (p: Partial<ProcessQuery>) => setF((x) => ({ ...x, ...p, page: 1 }));
  const q = useOpsQuery((d) => d.getProcesses(f), [JSON.stringify(f)], 120_000);
  return (
    <>
      <ScreenHead title="מעקב תהליכים" question="איזה תהליך נמצא באיזה שלב, כמה זמן הוא שם, ומי אחראי על הצעד הבא?" asOf={q.data?.asOf} />
      <div className="ops-toolbar">
        <Select<ProcessType | "all"> label="תהליך" value={f.process ?? "all"} onChange={(v) => set({ process: v })} options={[{ value: "all", label: "כל התהליכים" }, ...PROCESS_TYPES.map((t) => ({ value: t, label: PROCESS_LABEL[t] }))]} />
        <Select<SlaState | "all"> label="מצב זמן" value={f.sla ?? "all"} onChange={(v) => set({ sla: v })} options={[{ value: "all", label: "הכול" }, { value: "breached", label: SLA_LABEL.breached }, { value: "at_risk", label: SLA_LABEL.at_risk }, { value: "ok", label: SLA_LABEL.ok }]} />
        <Select label="סוכן אחראי" value={f.agentId ?? "all"} onChange={(v) => set({ agentId: v === "all" ? null : v })} options={[{ value: "all", label: "כולם" }, ...agents.map((a) => ({ value: a.id, label: a.label }))]} />
      </div>
      <QueryView q={q} tone="lavender" empty={(p) => (p.total === 0 ? { title: "אין תהליכים בסינון הזה", text: "אפשר לנקות סינון כדי לראות את כל התהליכים הפתוחים." } : null)}>
        {(p) => (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <caption className="sr-only">תהליכים פתוחים לפי זמן בשלב</caption>
                <thead><tr><th scope="col">תהליך</th><th scope="col">לקוח</th><th scope="col">שלב</th><th scope="col">זמן בשלב</th><th scope="col">אחראי</th><th scope="col">הצעד הבא</th><th scope="col">סנכרון</th></tr></thead>
                <tbody>
                  {p.items.map((x) => {
                    const age = minutesBetween(x.stageEnteredAt, new Date());
                    const st = slaState(age, x.stageTargetMin);
                    return (
                      <tr key={x.id}>
                        <td data-label="תהליך"><b>{PROCESS_LABEL[x.process]}</b><span className="ops-sub" dir="ltr">{x.id}</span></td>
                        <td data-label="לקוח" dir="ltr">{x.customerRef}</td>
                        <td data-label="שלב">
                          <span className="ops-steps" role="img" aria-label={`שלב ${x.stageIndex} מתוך ${x.stageCount}: ${x.stage}`}>
                            {Array.from({ length: x.stageCount }, (_, i) => <i key={i} data-on={i < x.stageIndex || undefined} />)}
                          </span>
                          <span className="ops-sub">{x.stage}</span>
                        </td>
                        <td data-label="זמן בשלב"><Pill tone={SLA_TONE[st]}>{SLA_LABEL[st]}</Pill><span className="ops-sub">{formatAge(age)} מתוך {formatAge(x.stageTargetMin)}</span></td>
                        <td data-label="אחראי">{label(x.ownerAgentId)}</td>
                        <td data-label="הצעד הבא">{x.nextAction}{x.nextActionDueAt && <span className="ops-sub">עד {fmtDateTime(x.nextActionDueAt)}</span>}</td>
                        <td data-label="סנכרון"><Pill tone={SYNC_TONE[x.syncStatus]}>{SYNC_LABEL[x.syncStatus]}</Pill><span className="ops-sub">התחיל לפני {ageFrom(x.startedAt)}</span></td>
                      </tr>
                    );
                  })}
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
