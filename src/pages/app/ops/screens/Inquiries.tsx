import { useState } from "react";
import { CHANNEL_LABEL, INQUIRY_KIND_LABEL, INQUIRY_STATUS_LABEL, SLA_LABEL, SLA_TONE, slaState } from "../contracts";
import type { Inquiry, InquiryChannel, InquiryKind, InquiryQuery, InquiryStatus, Tone } from "../contracts";
import { useAgents, useOpsQuery } from "../OpsData";
import { Pager, Pill, QueryView, ScreenHead, Select, ageFrom } from "../parts";

const STATUS_TONE: Record<InquiryStatus, Tone> = { new: "info", in_progress: "warn", waiting_customer: "muted", closed: "ok" };

function firstResponse(i: Inquiry, now: Date) {
  const target = Math.round((new Date(i.firstResponseDueAt).getTime() - new Date(i.receivedAt).getTime()) / 60_000);
  if (i.firstResponseAt) return { tone: "ok" as Tone, text: "נענתה" };
  const st = slaState(Math.round((now.getTime() - new Date(i.receivedAt).getTime()) / 60_000), target);
  return { tone: SLA_TONE[st], text: `מענה ראשון: ${SLA_LABEL[st]}` };
}

export default function Inquiries() {
  const [f, setF] = useState<InquiryQuery>({ page: 1, pageSize: 12, status: "all", channel: "all", kind: "all" });
  const { label } = useAgents();
  const set = (p: Partial<InquiryQuery>) => setF((x) => ({ ...x, ...p, page: 1 }));
  const q = useOpsQuery((d) => d.getInquiries(f), [JSON.stringify(f)], 60_000);
  return (
    <>
      <ScreenHead title="פניות ובקשות" question="אילו פניות נכנסו, מי טיפל בהן, ואילו מחכות למענה ראשון?" asOf={q.data?.asOf} />
      <div className="ops-toolbar">
        <Select<InquiryStatus | "all"> label="סטטוס" value={f.status ?? "all"} onChange={(v) => set({ status: v })} options={[{ value: "all", label: "הכול" }, ...(Object.keys(INQUIRY_STATUS_LABEL) as InquiryStatus[]).map((s) => ({ value: s, label: INQUIRY_STATUS_LABEL[s] }))]} />
        <Select<InquiryChannel | "all"> label="ערוץ" value={f.channel ?? "all"} onChange={(v) => set({ channel: v })} options={[{ value: "all", label: "הכול" }, ...(Object.keys(CHANNEL_LABEL) as InquiryChannel[]).map((s) => ({ value: s, label: CHANNEL_LABEL[s] }))]} />
        <Select<InquiryKind | "all"> label="סוג" value={f.kind ?? "all"} onChange={(v) => set({ kind: v })} options={[{ value: "all", label: "הכול" }, ...(Object.keys(INQUIRY_KIND_LABEL) as InquiryKind[]).map((s) => ({ value: s, label: INQUIRY_KIND_LABEL[s] }))]} />
      </div>
      <QueryView q={q} tone="butter" empty={(p) => (p.total === 0 ? { title: "אין פניות בסינון הזה", text: "כשתיכנס פנייה חדשה היא תופיע כאן." } : null)}>
        {(p) => (
          <>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <caption className="sr-only">פניות ובקשות, מהחדשה לישנה</caption>
                <thead><tr><th scope="col">פנייה</th><th scope="col">ערוץ</th><th scope="col">סטטוס</th><th scope="col">התקבלה</th><th scope="col">מענה ראשון</th><th scope="col">לקוח</th><th scope="col">מטפל</th></tr></thead>
                <tbody>
                  {p.items.map((i) => {
                    const fr = firstResponse(i, new Date());
                    return (
                      <tr key={i.id}>
                        <td data-label="פנייה"><b>{INQUIRY_KIND_LABEL[i.kind]}</b><span className="ops-sub" dir="ltr">{i.id}</span></td>
                        <td data-label="ערוץ">{CHANNEL_LABEL[i.channel]}</td>
                        <td data-label="סטטוס"><Pill tone={STATUS_TONE[i.status]}>{INQUIRY_STATUS_LABEL[i.status]}</Pill></td>
                        <td data-label="התקבלה">לפני {ageFrom(i.receivedAt)}</td>
                        <td data-label="מענה ראשון"><Pill tone={fr.tone}>{fr.text}</Pill></td>
                        <td data-label="לקוח" dir="ltr">{i.customerRef ?? "לא מזוהה"}</td>
                        <td data-label="מטפל">{label(i.assignedAgentId)}</td>
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
