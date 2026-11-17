import { PROCESS_LABEL, VISIBILITY_LABEL, formatAge, can } from "../contracts";
import type { VisibilityMode } from "../contracts";
import { CaEmpty } from "@/components/sd/client";
import { useOps, useOpsQuery } from "../OpsData";
import { Pill, QueryView, ScreenHead, Section } from "../parts";

const SEV_LABEL = { critical: "קריטי", warning: "אזהרה", info: "מידע" } as const;
const CH_LABEL = { in_app: "בתוך המערכת", email: "דוא״ל", sms: "הודעת SMS" } as const;
const SRC_LABEL = { default: "ברירת מחדל", env: "משתנה סביבה", database: "מסד נתונים" } as const;

export default function Settings() {
  const { role } = useOps();
  if (!can(role, "ops.settings.view")) {
    return (
      <>
        <ScreenHead title="הגדרות מערכת" question="כללי שיוך, מצב חשיפה, נמעני התראות ודגלי יכולות." />
        <CaEmpty compact tone="rose" title="המסך זמין למנהל על בלבד" text="אין לתפקיד הנוכחי הרשאה להגדרות המערכת. שאר המסכים פתוחים לצפייה." />
      </>
    );
  }
  return <SettingsBody />;
}

function SettingsBody() {
  const q = useOpsQuery((d) => d.getSettings(), []);
  return (
    <>
      <ScreenHead title="הגדרות מערכת" question="איך המערכת משייכת, מי רואה מה, למי נשלחות התראות, ואילו יכולות דולקות?" asOf={q.data?.asOf} />
      <p className="ops-callout" role="note">הטפסים לקריאה בלבד בשלב זה. שינוי הגדרות ייפתח עם אימות דו-שלבי (TOTP) וכתיבה ליומן הפעולות.</p>
      <QueryView q={q} tone="sage">
        {(s) => (
          <div className="ops-stack">
            <Section title="מצב חשיפה" tone="sky" note="מי רואה אילו לקוחות">
              <fieldset className="ops-fieldset" disabled>
                <legend className="sr-only">מצב חשיפה</legend>
                {(Object.keys(VISIBILITY_LABEL) as VisibilityMode[]).map((m) => (
                  <label key={m} className="ops-radio"><input type="radio" name="vis" checked={s.visibilityMode === m} readOnly />{VISIBILITY_LABEL[m]}</label>
                ))}
              </fieldset>
            </Section>

            <Section title="כללי שיוך" tone="butter" note="נבדקים לפי הסדר, הראשון שמתאים קובע">
              <ol className="ops-rules">
                {s.assignmentRules.map((r) => (
                  <li key={r.id}>
                    <span className="ops-rule-n" aria-hidden="true">{r.order}</span>
                    <span className="ops-rule-body"><b>{r.name}</b><span>אם: {r.condition}</span><span>אז: {r.action}</span></span>
                    <Pill tone={r.enabled ? "ok" : "muted"}>{r.enabled ? "פעיל" : "כבוי"}</Pill>
                  </li>
                ))}
              </ol>
            </Section>

            <div className="ops-cols">
              <Section title="נמעני התראות" tone="rose">
                <ul className="ops-rules">
                  {s.alertRecipients.map((r) => (
                    <li key={r.id}>
                      <span className="ops-rule-body"><b>{r.audience}</b><span>{CH_LABEL[r.channel]}</span><span>רמות: {r.severities.map((x) => SEV_LABEL[x]).join(", ")}</span></span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="דגלי יכולות" tone="lavender">
                <ul className="ops-rules">
                  {s.flags.map((fl) => (
                    <li key={fl.name}>
                      <span className="ops-rule-body"><b dir="ltr">{fl.name}</b><span>{fl.description}</span><span className="ops-note">מקור: {SRC_LABEL[fl.source]}</span></span>
                      <Pill tone={fl.enabled ? "ok" : "muted"}>{fl.enabled ? "דלוק" : "כבוי"}</Pill>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>

            <Section title="יעדי זמן לפי שלב (SLA)" tone="sage">
              <div className="ops-table-wrap">
                <table className="ops-table">
                  <thead><tr><th scope="col">תהליך</th><th scope="col">שלב</th><th scope="col">יעד</th></tr></thead>
                  <tbody>
                    {s.slaTargets.map((t) => (
                      <tr key={`${t.process}-${t.stage}`}><td data-label="תהליך">{PROCESS_LABEL[t.process]}</td><td data-label="שלב">{t.stage}</td><td data-label="יעד">{formatAge(t.targetMin)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="ops-note">רענון אוטומטי: מבט-על כל {s.polling.overviewSec} שניות, רשימות כל {s.polling.listsSec} שניות.</p>
            </Section>
          </div>
        )}
      </QueryView>
    </>
  );
}
