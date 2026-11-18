// The risk-level questionnaire: a start card, one question per screen, the result. Same interaction
// patterns as the questionnaire engine (src/questionnaires): its card, choice, progress and button
// styles, auto-advance after a tap, Enter to continue, back, and the heading focused on every screen.
// Native radio inputs give arrow-key movement inside the group. Answers live in component state only:
// nothing is stored, sent or measured.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdSpot } from "@/components/sd/SdSpot";
import { QUESTION_IDS, RISK_LEVELS, scoreRisk, type RiskAnswers, type RiskLevel, type RiskResult } from "@/lib/riskProfile";
import { RISK_COPY, RISK_LEVEL_COPY, RISK_QUESTIONS } from "@/data/riskProfile";
import "@/questionnaires/questionnaires.css";
import "./risk.css";

// The tracks block needs the returns-board data layer (and supabase-js as its fallback); load it only on the result.
const RiskTracks = lazy(() => import("./RiskTracks"));

const AUTO_ADVANCE_MS = 260;
const TOTAL = RISK_QUESTIONS.length;

type Phase = "start" | "question" | "result";

export default function RiskQuiz({ onResult }: { onResult?: (r: RiskResult | null) => void }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<RiskAnswers>({});
  const [error, setError] = useState(false);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef<RiskAnswers>({});
  const interacted = useRef(false);
  const pointerPick = useRef(false);
  const timer = useRef<number | null>(null);
  answersRef.current = answers;

  const result = phase === "result" ? scoreRisk(answers) : null;

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  // Focus the heading of every new screen (never on the first paint of the page).
  useEffect(() => {
    if (!interacted.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const card = cardRef.current;
    if (card) {
      const top = card.getBoundingClientRect().top;
      if (top < 64 || top > window.innerHeight * 0.4) card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase, index]);
  useEffect(() => { onResult?.(result); }, [result?.level, result?.guardrail]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = RISK_QUESTIONS[index];
  const current = q ? answers[q.id] : undefined;

  const go = (next: () => void, d: "fwd" | "back" = "fwd") => {
    interacted.current = true;
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
    setDir(d);
    setError(false);
    next();
  };
  const start = () => go(() => { setPhase("question"); setIndex(0); });
  const advance = () => {
    if (!q) return;
    if (answersRef.current[q.id] === undefined) { setError(true); return; }
    go(() => {
      if (index < TOTAL - 1) setIndex(index + 1);
      else setPhase("result");
    });
  };
  const back = () => go(() => {
    if (phase === "result") { setPhase("question"); setIndex(TOTAL - 1); }
    else if (index > 0) setIndex(index - 1);
    else setPhase("start");
  }, "back");
  const restart = () => go(() => { setAnswers({}); setIndex(0); setPhase("start"); }, "back");

  const pick = (score: number) => {
    if (!q) return;
    const next = { ...answersRef.current, [q.id]: score };
    answersRef.current = next;
    setAnswers(next);
    setError(false);
    if (pointerPick.current) {
      pointerPick.current = false;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => advance(), AUTO_ADVANCE_MS);
    }
  };

  // ───────── start
  if (phase === "start") {
    return (
      <div className="sd-q sd-rk-q" ref={cardRef}>
        <section className="sd-q-card sd-rk-card" aria-labelledby="rk-start-h">
          <p className="sd-q-eyebrow">ארבע שאלות · בערך דקה</p>
          <h2 id="rk-start-h" ref={headingRef} tabIndex={-1} className="sd-q-qtitle">ארבע שאלות על האופי שלכם כמשקיעים</h2>
          <ul className="sd-rk-points">
            <li>שאלות על תחושה ועל תגובה כשהכסף זז, בלי גיל, בלי טווח השקעה ובלי פרטים אישיים.</li>
            <li>החישוב נעשה במכשיר שלכם. התשובות לא נשלחות ולא נשמרות.</li>
            <li>בסוף: רמת סיכון נמוכה, בינונית או גבוהה, מדיניות ההשקעה של משפחת המסלולים, ומסלולים מלוח התשואות ברמה הזו.</li>
          </ul>
          <div className="sd-rk-actions">
            <button type="button" className="sd-q-btn" onClick={start}>מתחילים<BrandIcon name="arrow-left" size={18} /></button>
          </div>
          <SdSpot name="scales" size={64} className="sd-q-spot-corner" />
        </section>
      </div>
    );
  }

  // ───────── result
  if (phase === "result" && result) {
    const copy = RISK_LEVEL_COPY[result.level];
    return (
      <div className="sd-q sd-rk-q" ref={cardRef}>
        <section className="sd-q-card sd-rk-card sd-rk-result" data-level={result.level} aria-labelledby="rk-result-h">
          <p className="sd-rk-result-intro">{RISK_COPY.resultIntro}</p>
          <h2 id="rk-result-h" ref={headingRef} tabIndex={-1} className="sd-q-qtitle sd-rk-level">{copy.title}</h2>
          <LevelScale level={result.level} />
          {result.guardrail && <p className="sd-rk-guard" role="note">{RISK_COPY.guardrail}</p>}
          <p className="sd-rk-profile">{copy.profile}</p>

          <div className="sd-rk-policy">
            <h3>מדיניות ההשקעה של משפחת המסלולים</h3>
            <p>{copy.policy}</p>
            <p className="sd-rk-mix"><b>תמהיל אופייני:</b> {copy.assetMix}</p>
          </div>

          <div className="sd-rk-actions">
            <a href="#form" className="sd-q-btn">לבחון את האפיון בשיחת היכרות<BrandIcon name="arrow-left" size={18} /></a>
            <button type="button" className="sd-q-btn is-quiet" onClick={back}>חזרה לשאלה האחרונה</button>
            <button type="button" className="sd-q-linkbtn" onClick={restart}>לענות מחדש</button>
          </div>
        </section>

        <Suspense fallback={<p className="sd-rk-loading" role="status">טוענים את נתוני המסלולים…</p>}>
          <RiskTracks level={result.level} />
        </Suspense>
      </div>
    );
  }

  // ───────── question
  const labelId = `rk-${q.id}-label`;
  const helpId = `rk-${q.id}-help`;
  const errId = `rk-${q.id}-err`;
  const n = index + 1;
  return (
    <div className="sd-q sd-rk-q" ref={cardRef}>
      <div className="sd-q-progress" role="group" aria-label="התקדמות בשאלון">
        <ol className="sd-q-segs" aria-hidden="true">
          {QUESTION_IDS.map((id, i) => (
            <li key={id} className={`${i < index ? "is-done" : ""} ${i === index ? "is-cur" : ""}`}>
              <i style={{ width: i < index || answers[id] !== undefined ? "100%" : "0%" }} />
            </li>
          ))}
        </ol>
        <p className="sd-q-progress-text"><span>שאלה {n} מתוך {TOTAL}</span><span>{n === TOTAL ? "השאלה האחרונה" : `עוד ${TOTAL - n} אחריה`}</span></p>
      </div>
      <section key={q.id} className={`sd-q-card sd-q-step sd-rk-card sd-q-in-${dir}`} aria-labelledby={labelId}>
        <h2 id={labelId} ref={headingRef} tabIndex={-1} className="sd-q-qtitle">
          <span className="sr-only">שאלה {n} מתוך {TOTAL}: </span>{q.text}
        </h2>
        <p id={helpId} className="sd-q-hint">{q.help}</p>
        <div
          className="sd-q-input-area"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).matches("input[type=radio]")) { e.preventDefault(); advance(); }
          }}
        >
          <div role="radiogroup" aria-labelledby={labelId} aria-describedby={[helpId, error ? errId : ""].filter(Boolean).join(" ")}
            aria-required="true" aria-invalid={error || undefined} className="sd-q-choices sd-rk-choices">
            {q.options.map((o) => {
              const on = current === o.score;
              const id = `rk-${q.id}-${o.score}`;
              return (
                <label key={o.score} htmlFor={id} className={`sd-q-choice is-check sd-rk-choice ${on ? "is-on" : ""}`}
                  onPointerDown={() => { pointerPick.current = true; }}>
                  <input id={id} type="radio" name={`rk-${q.id}`} value={o.score} checked={on}
                    onChange={() => pick(o.score)}
                    onClick={() => { if (on && pointerPick.current) pick(o.score); }}
                    onKeyDown={() => { pointerPick.current = false; }} />
                  <span>{o.label}</span>
                </label>
              );
            })}
          </div>
          {error && <p id={errId} className="sd-q-error" role="alert">צריך לבחור תשובה אחת כדי להמשיך.</p>}
        </div>
        <SdSpot name={index % 2 ? "olive-sapling" : "scales"} size={56} className="sd-q-spot-corner" />
      </section>
      <div className="sd-rk-bar" role="toolbar" aria-label="ניווט בשאלון">
        <button type="button" className="sd-q-btn is-quiet" onClick={back}>חזרה</button>
        <button type="button" className="sd-q-btn" onClick={advance}>{n === TOTAL ? "לתוצאה" : "המשך"}</button>
      </div>
      <p className="sd-q-fine sd-rk-fine">אפשר לעבור בין התשובות בחיצים ולהמשיך במקש אנטר. התשובות נשארות במכשיר הזה בלבד.</p>
    </div>
  );
}

/** Three-step scale; the heading above already says the level, so this is decorative. */
function LevelScale({ level }: { level: RiskLevel }) {
  return (
    <ol className="sd-rk-scale" aria-hidden="true">
      {RISK_LEVELS.map((l) => (
        <li key={l} className={l === level ? "is-on" : ""} data-level={l}>
          <i />
          <span>{RISK_LEVEL_COPY[l].short}</span>
        </li>
      ))}
    </ol>
  );
}
