import { useState } from "react";
import { RANGE_LABEL, formatPct, overallConversion } from "../contracts";
import type { OpsFilters, RangeKey } from "../contracts";
import { useAgents, useOpsQuery } from "../OpsData";
import { FunnelBars, QueryView, ScreenHead, Section, Segmented, Select, num } from "../parts";
import type { Pastel } from "@/components/sd/topics";

const TONES: Pastel[] = ["sky", "sage", "butter", "lavender", "rose", "sage"];

export default function Funnel() {
  const [filters, setFilters] = useState<OpsFilters>({ range: "today", agentId: null });
  const { agents } = useAgents();
  const q = useOpsQuery((d) => d.getFunnels(filters), [filters.range, filters.agentId], 120_000);
  return (
    <>
      <ScreenHead title="משפך תהליכים" question="איפה אנשים נעצרים: מליד ועד הצטרפות, שאלון, דוח, כתב מינוי והזמנת מידע?" asOf={q.data?.asOf}>
        <div className="ops-filters">
          <Segmented<RangeKey> label="טווח זמן" value={filters.range} onChange={(range) => setFilters((f) => ({ ...f, range }))} options={(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => ({ value: k, label: RANGE_LABEL[k] }))} />
          <Select label="סוכן" value={filters.agentId ?? "all"} onChange={(v) => setFilters((f) => ({ ...f, agentId: v === "all" ? null : v }))} options={[{ value: "all", label: "כל הסוכנים" }, ...agents.map((a) => ({ value: a.id, label: a.label }))]} />
        </div>
      </ScreenHead>
      <QueryView q={q} empty={(d) => (d.funnels.every((f) => (f.steps[0]?.count ?? 0) === 0) ? { title: "אין נתונים בטווח הזה", text: "לא נכנסו פעולות במשפך בטווח ובסינון שנבחרו. אפשר להרחיב את הטווח." } : null)}>
        {(d) => (
          <div className="ops-stack">
            <nav className="ops-jump" aria-label="קפיצה למשפך">
              {d.funnels.map((f) => <a key={f.id} href={`#fn-${f.id}`}>{f.title}</a>)}
            </nav>
            {d.funnels.map((f, i) => (
              <div key={f.id} id={`fn-${f.id}`} className="ops-anchor">
                <Section title={f.title} tone={TONES[i % TONES.length]} note={`${num(f.steps[0]?.count ?? 0)} נכנסו, ${formatPct(overallConversion(f.steps))} הגיעו לסוף`}>
                  <p className="ops-question">{f.question}</p>
                  <FunnelBars steps={f.steps} id={`f-${f.id}`} />
                </Section>
              </div>
            ))}
            <p className="ops-note">נתוני הדגמה. הספירה היא ישויות שהגיעו לכל שלב בטווח; הנשירה הגדולה מסומנת לפי היחס לשלב הקודם.</p>
          </div>
        )}
      </QueryView>
    </>
  );
}
