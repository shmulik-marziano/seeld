import { Link } from "react-router-dom";
import { OPS_PATH, HEALTH_LABEL, HEALTH_TONE, PROCESS_LABEL, SYSTEM_LABEL, deltaOf, formatAge, formatPct } from "../contracts";
import type { AlertSeverity, Tone } from "../contracts";
import { useOpsQuery } from "../OpsData";
import { Pill, QueryView, QueueBar, ScreenHead, Section, Sparkline, StatTile, ageFrom, fmtDateTime, num } from "../parts";

const SEV: Record<AlertSeverity, { tone: Tone; label: string }> = {
  critical: { tone: "bad", label: "קריטי" },
  warning: { tone: "warn", label: "אזהרה" },
  info: { tone: "info", label: "מידע" },
};

const FILTERS = { range: "today", agentId: null } as const;

export default function Overview() {
  const q = useOpsQuery((d) => d.getOverview(FILTERS), [], 60_000);
  return (
    <>
      <ScreenHead title="מבט-על" question="מה קורה עכשיו: האם המשפך זורם, האם המערכות בריאות, ומה דורש יד אדם?" asOf={q.data?.asOf} />
      <QueryView q={q}>
        {(o) => (
          <div className="ops-stack">
            <section aria-labelledby="ov-today">
              <h3 className="ops-h3" id="ov-today">המשפך היום</h3>
              <div className="ops-strip">
                {o.today.map((t) => {
                  const d = deltaOf(t.value, t.previous);
                  return (
                    <StatTile
                      key={t.key}
                      label={t.label}
                      value={num(t.value)}
                      sub={d ? (d.diff === 0 ? "ללא שינוי מאתמול" : `${d.diff > 0 ? "▲ עלייה" : "▼ ירידה"} של ${Math.abs(d.diff)}${d.pct !== null ? ` (${formatPct(Math.abs(d.pct))})` : ""} מאתמול`) : "אין בסיס להשוואה"}
                    />
                  );
                })}
              </div>
            </section>

            <Section title="התראות פעילות" tone="rose" note={`${o.alerts.length} פתוחות`}>
              {o.alerts.length === 0 ? (
                <p className="ops-quiet">אין התראות פעילות. הכול בטווח.</p>
              ) : (
                <ul className="ops-alerts">
                  {o.alerts.map((a) => (
                    <li key={a.id}>
                      <Link to={a.href} className="ops-alert" data-sev={a.severity}>
                        <Pill tone={SEV[a.severity].tone}>{SEV[a.severity].label}</Pill>
                        <span className="ops-alert-body"><b>{a.title}</b><span>{a.detail}</span></span>
                        <span className="ops-alert-age">לפני {ageFrom(a.since)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <div className="ops-cols">
              <Section title="בריאות סנכרון" tone="sage">
                <div className="ops-health">
                  {o.syncTiles.map((s) => (
                    <Link key={s.system} to={OPS_PATH.integrations} className="ops-health-card">
                      <span className="ops-health-top"><b>{SYSTEM_LABEL[s.system]}</b><Pill tone={HEALTH_TONE[s.state]}>{HEALTH_LABEL[s.state]}</Pill></span>
                      <span className="ops-kv"><i>הצלחה אחרונה</i><span>לפני {ageFrom(s.lastSuccessAt ?? new Date().toISOString())}</span></span>
                      <span className="ops-kv"><i>ממתינות</i><span>{num(s.pending)}</span></span>
                      <span className="ops-kv"><i>בניסיון חוזר</i><span>{num(s.retrying)}</span></span>
                      <span className="ops-kv"><i>נכשלו</i><span>{num(s.deadLetter)}</span></span>
                    </Link>
                  ))}
                </div>
              </Section>

              <Section title="עומק התורים" tone="sky" note="הודעות בתור, לפי יעד">
                <div className="ops-queues">
                  {o.queues.map((qd) => (
                    <div key={qd.system} className="ops-queue">
                      <div className="ops-queue-head"><b>{SYSTEM_LABEL[qd.system]}</b><span className="ops-note">הוותיקה ממתינה {formatAge(Math.round(qd.oldestPendingSec / 60))}</span></div>
                      <QueueBar pending={qd.pending} inFlight={qd.inFlight} retrying={qd.retrying} deadLetter={qd.deadLetter} />
                      <Sparkline values={qd.throughput24h} label={`${SYSTEM_LABEL[qd.system]}: הודעות שהושלמו בשעה, 24 שעות אחרונות. בין ${Math.min(...qd.throughput24h)} ל-${Math.max(...qd.throughput24h)}.`} />
                      <span className="ops-note">הושלמו בשעה, 24 שעות אחרונות</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <Section title="חריגות SLA לפי תהליך" tone="butter" note="לפי זמן השהייה בשלב הנוכחי">
              <div className="ops-table-wrap">
                <table className="ops-table">
                  <thead><tr><th scope="col">תהליך</th><th scope="col">חריגה</th><th scope="col">בסיכון</th><th scope="col">יעד ממוצע לשלב</th><th scope="col"><span className="sr-only">פעולה</span></th></tr></thead>
                  <tbody>
                    {o.sla.map((s) => (
                      <tr key={s.process}>
                        <td data-label="תהליך">{PROCESS_LABEL[s.process]}</td>
                        <td data-label="חריגה">{s.breached > 0 ? <Pill tone="bad">{s.breached}</Pill> : <span className="ops-quiet">0</span>}</td>
                        <td data-label="בסיכון">{s.atRisk > 0 ? <Pill tone="warn">{s.atRisk}</Pill> : <span className="ops-quiet">0</span>}</td>
                        <td data-label="יעד ממוצע לשלב">{formatAge(s.targetMin)}</td>
                        <td data-label=""><Link className="ops-link" to={OPS_PATH.processes}>לתהליכים</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <p className="ops-note">הנתונים נטענו {fmtDateTime(o.asOf)} ומתרעננים כל דקה כשהלשונית פתוחה.</p>
          </div>
        )}
      </QueryView>
    </>
  );
}
