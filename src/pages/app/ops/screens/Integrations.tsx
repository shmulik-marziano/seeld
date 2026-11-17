import { Link } from "react-router-dom";
import { OPS_PATH, ADAPTER_LABEL, HEALTH_LABEL, HEALTH_TONE, SYSTEM_LABEL, formatAge, formatPct } from "../contracts";
import { useOpsQuery } from "../OpsData";
import { Pill, QueryView, QueueBar, ScreenHead, Section, Sparkline, ageFrom, fmtDateTime, num } from "../parts";

export default function Integrations() {
  const q = useOpsQuery((d) => d.getIntegrationHealth(), [], 60_000);
  return (
    <>
      <ScreenHead title="בריאות מערכות" question="האם Salesforce ו-Surense מקבלים עדכונים, ומה תקוע בדרך?" asOf={q.data?.asOf} />
      <QueryView q={q} tone="sage">
        {(h) => (
          <div className="ops-stack">
            <div className="ops-cols">
              {h.systems.map((s, i) => (
                <Section key={s.system} title={SYSTEM_LABEL[s.system]} tone={i === 0 ? "sky" : "butter"} note={s.system === "salesforce" ? "תור מהיר: לידים ומשימות" : "תור איטי: תיקים ונתוני מוסדיים"}>
                  <div className="ops-pillrow">
                    <Pill tone={HEALTH_TONE[s.state]}>{HEALTH_LABEL[s.state]}</Pill>
                    <Pill tone={s.adapter === "ready" ? "ok" : "muted"}>מתאם: {ADAPTER_LABEL[s.adapter]}</Pill>
                  </div>
                  <dl className="ops-dl">
                    <div><dt>הצלחה אחרונה</dt><dd>{s.lastSuccessAt ? `לפני ${ageFrom(s.lastSuccessAt)}` : "אין"} <span className="ops-note">{fmtDateTime(s.lastSuccessAt)}</span></dd></div>
                    <div><dt>כשל אחרון</dt><dd>{s.lastFailureAt ? `לפני ${ageFrom(s.lastFailureAt)}` : "אין"}</dd></div>
                    <div><dt>שיעור כשלים בשעה האחרונה</dt><dd>{s.failureRate1h === null ? "אין ניסיונות" : formatPct(s.failureRate1h)}</dd></div>
                    <div><dt>ההודעה הוותיקה ביותר</dt><dd>{s.queue.pending === 0 ? "התור ריק" : `ממתינה ${formatAge(Math.round(s.queue.oldestPendingSec / 60))}`}</dd></div>
                  </dl>
                  <h4 className="ops-h4">תור יעד</h4>
                  <QueueBar pending={s.queue.pending} inFlight={s.queue.inFlight} retrying={s.queue.retrying} deadLetter={s.queue.deadLetter} />
                  <h4 className="ops-h4">הושלמו בשעה, 24 שעות</h4>
                  <Sparkline values={s.queue.throughput24h} label={`${SYSTEM_LABEL[s.system]}: הושלמו בשעה, בין ${Math.min(...s.queue.throughput24h)} ל-${Math.max(...s.queue.throughput24h)}`} />
                  <h4 className="ops-h4">סוגי כשל ב-24 שעות</h4>
                  <ul className="ops-bullets">{s.failures24h.map((f) => <li key={f.kind}>{f.label}: <b>{num(f.count)}</b></li>)}</ul>
                  <p className="ops-note">מדיניות: עד {s.policy.maxAttempts} ניסיונות, קבוצות של {s.policy.batchSize}, יקיצה כל {s.policy.drainIntervalSec} שניות. ערכי הדגמה.</p>
                  {s.deadLetter > 0 && <Link className="ops-link" to={OPS_PATH.deadLetters}>{s.deadLetter} הודעות שנכשלו, לטיפול</Link>}
                </Section>
              ))}
            </div>
            <Section title="צינורות ועובדים" tone="lavender">
              <div className="ops-table-wrap">
                <table className="ops-table">
                  <thead><tr><th scope="col">רכיב</th><th scope="col">מצב</th><th scope="col">ריצה אחרונה</th><th scope="col">הערה</th></tr></thead>
                  <tbody>
                    {h.pipelines.map((p) => (
                      <tr key={p.id}>
                        <td data-label="רכיב"><b>{p.label}</b></td>
                        <td data-label="מצב"><Pill tone={HEALTH_TONE[p.state]}>{HEALTH_LABEL[p.state]}</Pill></td>
                        <td data-label="ריצה אחרונה">{p.lastRunAt ? `לפני ${ageFrom(p.lastRunAt)}` : "לא רץ"}</td>
                        <td data-label="הערה">{p.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}
      </QueryView>
    </>
  );
}
