// Shared pieces of the client forms pages: the adapter choice, the progress rail, the error card and the "noindex" hook.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SdSpot } from "@/components/sd/SdSpot";
import { createHttpFormsApi, createMockFormsApi, type ErrorKind, type FormsApi } from "@/forms/api";
import { CARD_STATUS_LABEL, cardStatus, FORMS_CARDS, type CardKey, type SubmissionSummary } from "@/forms/catalog";

/** one adapter per tab: the HTTP adapter, or the in-memory mock when VITE_FORMS_ADAPTER is "mock" (development) */
let shared: FormsApi | null = null;
export function createFormsApi(): FormsApi {
  if (shared) return shared;
  shared = import.meta.env.VITE_FORMS_ADAPTER === "mock" ? createMockFormsApi({ delayMs: 200 }) : createHttpFormsApi();
  return shared;
}
/** tests */
export function setFormsApi(api: FormsApi | null) { shared = api; }

export function useNoIndex(title: string) {
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m);
    const prev = document.title;
    document.title = title;
    return () => { document.head.removeChild(m); document.title = prev; };
  }, [title]);
}

export function Rail({ current, submissions }: { current: CardKey; submissions: readonly SubmissionSummary[] }) {
  return (
    <ol className="sd-forms-rail" aria-label="התקדמות בשאלונים">
      {FORMS_CARDS.map((c) => {
        const st = cardStatus(c, submissions);
        return (
          <li key={c.key} className={`${c.key === current ? "is-cur" : ""} is-${st}`} aria-current={c.key === current ? "step" : undefined}>
            <i aria-hidden="true" />
            <span>{c.title}{st !== "unknown" && st !== "not-started" ? ` · ${CARD_STATUS_LABEL[st]}` : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

export const ERROR_COPY: Record<ErrorKind, { title: string; text: string }> = {
  inactive: { title: "הטופס לא זמין כרגע", text: "אפשר לנסות שוב מאוחר יותר, או לדבר איתנו ונמלא יחד." },
  unavailable: { title: "משהו אצלנו לא עובד כרגע", text: "לא אבד כלום. כדאי לנסות שוב בעוד כמה דקות." },
  generic: { title: "משהו לא הסתדר", text: "אפשר לנסות שוב. אם זה חוזר, נשמח לעזור בטלפון." },
  expired: { title: "הזמן עבר", text: "השאלונים נשמרו אצלנו. כדי להמשיך, ממלאים שוב את פרטי הזיהוי." },
  locked: { title: "יותר מדי ניסיונות", text: "נחכה קצת. אפשר לנסות שוב בעוד כמה דקות." },
  completed: { title: "השאלון הזה כבר נשלח", text: "מה שנשלח אלינו נשמר. אפשר להמשיך לשאלון הבא." },
};

export function ErrorCard({ kind, onRetry, onRestart }: { kind: ErrorKind; onRetry: () => void; onRestart?: () => void }) {
  const c = ERROR_COPY[kind];
  return (
    <section className="sd-q-card" aria-labelledby="forms-err-h">
      <SdSpot name="shield-navy" size={72} className="sd-q-spot" />
      <h2 id="forms-err-h" className="sd-q-qtitle" tabIndex={-1} ref={(el) => el?.focus()}>{c.title}</h2>
      <p className="sd-q-p">{c.text}</p>
      <div className="sd-forms-done-actions">
        {kind === "expired" && onRestart ? <button type="button" className="sd-q-btn" onClick={onRestart}>למילוי פרטי הזיהוי</button> : <button type="button" className="sd-q-btn" onClick={onRetry}>ניסיון נוסף</button>}
        <Link to="/forms" className="sd-q-btn is-quiet">לכל השאלונים</Link>
      </div>
    </section>
  );
}
