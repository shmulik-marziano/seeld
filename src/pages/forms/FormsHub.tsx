// /forms: "שאלונים ומסמכים", the one place a client is sent to fill the questionnaires (owner request 2026-11-23).
// Six cards in the owner's order; each shows its length and, when a session is held in this tab, the client's status.
// Public and prerendered (the cards are static copy); the flow itself runs under /forms/:card (noindex).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PubCta, PubHero, PubPage } from "@/components/sd/pubParts";
import { SdSpot } from "@/components/sd/SdSpot";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ROUTE_BY_PATH } from "@/data/seo/routes";
import { CARD_STATUS_LABEL, cardPath, cardStatus, FORMS_CARDS, type CardStatus, type SubmissionSummary } from "@/forms/catalog";
import { FORMS_FLOW_ENABLED, FORMS_ROUTE } from "@/forms/config";
import { createFormsApi } from "./shared";
import "@/questionnaires/questionnaires.css";
import "./forms.css";

export default function FormsHub() {
  const entry = ROUTE_BY_PATH[FORMS_ROUTE];
  usePageSeo(entry?.title, entry?.description);
  const api = useMemo(() => (FORMS_FLOW_ENABLED ? createFormsApi() : null), []);
  const [subs, setSubs] = useState<SubmissionSummary[] | null>(null);

  // a session held in this tab: show where the client stands (never blocks the page)
  useEffect(() => {
    if (!api || !api.hasSession()) return;
    let live = true;
    api.state().then(
      (s) => { if (live) setSubs(s.submissions.map((x) => ({ card: x.card, questionnaire: x.questionnaire, status: x.status, completion: x.completion }))); },
      () => { if (live) setSubs(null); },
    );
    return () => { live = false; };
  }, [api]);

  return (
    <PubPage tint="sage">
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "שאלונים ומסמכים" }]}
        eyebrow="שאלונים ומסמכים"
        title="כל מה שאנחנו צריכים מכם, במקום אחד"
        lead="ממלאים פעם אחת כמה פרטי זיהוי, ואחר כך את השאלונים בזה אחר זה. אפשר לעצור באמצע ולהמשיך מאותו מקום, והצוות מקבל הכול מסודר."
        art="32-process-steps"
      />
      <section className="sd-wrap" style={{ paddingBlock: "clamp(24px, 4vw, 56px)" }} aria-labelledby="forms-list-h">
        <h2 id="forms-list-h" className="sr-only">השאלונים</h2>
        <ol className="sd-forms-grid">
          {FORMS_CARDS.map((c, i) => {
            const st: CardStatus = subs ? cardStatus(c, subs) : c.kind === "poa" ? "unknown" : "not-started";
            const soon = c.kind !== "poa" && !FORMS_FLOW_ENABLED;
            const cta = st === "submitted" ? "לצפייה ולהשלמה" : st === "in-progress" ? "המשך מילוי" : "מתחילים";
            return (
              <li key={c.key} className="sd-forms-card">
                <span className="sd-forms-num" aria-hidden="true">{i + 1}</span>
                <SdSpot name={c.spot} size={88} className="sd-forms-spot" />
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <p className="sd-forms-meta">
                  <span>כ־{c.minutes} דקות</span>
                  {c.sensitive && <span>מידע בריאותי</span>}
                  {st !== "unknown" && !soon && <span className={`sd-forms-status is-${st}`}>{CARD_STATUS_LABEL[st]}</span>}
                </p>
                {soon
                  ? <span className="sd-forms-soon">בקרוב</span>
                  : <Link to={cardPath(c)} className="sd-q-btn">{cta}<BrandIcon name="arrow-left" size={18} /></Link>}
              </li>
            );
          })}
        </ol>
        <p className="sd-forms-note">
          הפרטים נשמרים אצלנו מוצפנים ומשמשים את הצוות לטיפול בבקשה בלבד. בשאלון הבריאות התשובות עצמן נשארות בדפדפן, ואלינו מגיעה רק התוצאה של הסינון, אלא אם נאמר אחרת.
        </p>
      </section>
      <PubCta
        title="לא בטוחים מאיפה להתחיל?"
        text="מתחילים מהזמנת המידעים: עם ייפוי הכוח, רוב התמונה מגיעה אלינו מהגופים עצמם, ואת השאר משלימים בשאלונים."
        art="33-welcome-table"
        primary={{ label: "להזמנת המידעים", to: cardPath(FORMS_CARDS[0]) }}
        secondary={{ label: "שיחת היכרות ראשונה", to: "/contact" }}
      />
    </PubPage>
  );
}
