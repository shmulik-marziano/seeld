// "סקירת התשובות": every visible answer grouped by section with edit-jump links, follow-up modules explained, open problems listed.
import { useMemo } from "react";
import type { Answers, Questionnaire } from "../types";
import type { Flow } from "../logic";
import { validateAll } from "../logic";
import { buildView } from "../format";
import { HEALTH_PRIVACY_NOTE } from "../copy";

export function ReviewScreen({ def, answers, flow, onEdit, onBack, onContinue, sensitive }: {
  def: Questionnaire; answers: Answers; flow: Flow; onEdit: (key: string) => void; onBack: () => void; onContinue: () => void; sensitive: boolean;
}) {
  const view = useMemo(() => buildView(def, answers, { includeUnanswered: true }), [def, answers]);
  const { errors } = useMemo(() => validateAll(def, answers), [def, answers]);
  const problems = Object.entries(errors);
  const sc = flow.screening;
  const labelOf = (k: string) => flow.steps.find((s) => s.key === k)?.q.label ?? k;
  return (
    <>
      <section className="sd-q-card sd-q-review" aria-labelledby="q-review-h">
        <h2 id="q-review-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus()}>סקירת התשובות</h2>
        <p className="sd-q-p">כך נראות התשובות שלך. אפשר ללחוץ על 'עריכה' ליד כל שאלה.</p>

        {sc && (
          <div className="sd-q-screen-result" role="status">
            {sc.status === "all_clear" && <p><b>הסינון הסתיים: אין שאלות המשך.</b> ענית 'לא' בכל התחומים.</p>}
            {sc.status === "follow_up" && (
              <>
                <p><b>נפתחו שאלות המשך בתחומים שסימנת:</b></p>
                <ul>
                  {sc.modules.filter((m) => m.open).map((m) => (
                    <li key={m.sectionId}>
                      {m.title.replace(/^בירור בריאותי · /, "")}
                      <small> · נפתח כי ענית 'כן' על: <button type="button" className="sd-q-linkbtn" onClick={() => onEdit(m.reasons[0].key)}>שינוי התשובה</button></small>
                    </li>
                  ))}
                </ul>
                <p className="sd-q-fine">אם תשנו תשובה ל'לא', שאלות ההמשך של התחום יוסרו. מה שהוקלד נשמר עד הסיום, למקרה שתחזרו.</p>
              </>
            )}
            {sc.status === "incomplete" && <p>חלק מהשאלות בסינון עדיין לא נענו.</p>}
          </div>
        )}

        {problems.length > 0 && (
          <div className="sd-q-problems" role="alert">
            <p><b>{problems.length === 1 ? "יש שאלה אחת שכדאי להשלים" : `יש ${problems.length} שאלות שכדאי להשלים`}</b></p>
            <ul>{problems.slice(0, 8).map(([k, v]) => <li key={k}><button type="button" className="sd-q-linkbtn" onClick={() => onEdit(k)}>{labelOf(k)}</button><small> · {v.message}</small></li>)}</ul>
          </div>
        )}

        {view.map((s) => (
          <div key={s.id} className="sd-q-rv-sec">
            <h3>{s.title}</h3>
            <dl>
              {s.rows.map((r) => (
                <div key={r.key} className="sd-q-rv-row">
                  <dt>{r.label}</dt>
                  <dd className={r.text === "(לא נענה)" ? "is-empty" : ""}>{r.text}</dd>
                  <button type="button" className="sd-q-linkbtn" onClick={() => onEdit(r.key)} aria-label={`עריכה: ${r.label}`}>עריכה</button>
                </div>
              ))}
            </dl>
          </div>
        ))}
        {sensitive && <p className="sd-q-note">{HEALTH_PRIVACY_NOTE}</p>}
      </section>
      <div className="sd-q-bar" role="toolbar" aria-label="המשך">
        <button type="button" className="sd-q-btn is-quiet" onClick={onBack}>חזרה לשאלות</button>
        <button type="button" className="sd-q-btn" onClick={onContinue} disabled={problems.length > 0} title={problems.length ? "צריך להשלים את השאלות שסומנו" : undefined}>להצהרה ולחתימה</button>
      </div>
    </>
  );
}
