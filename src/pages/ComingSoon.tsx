import { Link } from "react-router-dom";
import { PubPage, Arrow } from "@/components/sd/pubParts";
import { SdPic } from "@/components/sd/primitives";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { CONTACTS, DEPT_LABEL, type ContactDept } from "@/lib/contacts";
import "@/components/sd/client.css";

// v2 holding screen (VITE_SEELD_BACKEND=v2) for what is rebuilt in phase 2: the personal area, the client
// portal, the agents app and the site admin ("area"), and the two digital forms that collect national id or
// bank details, which stay off on the new backend (ADR-42) ("form"). No Supabase call of any kind happens here.

const DEPTS: ContactDept[] = ["insurance", "general"];

const COPY = {
  area: {
    title: "האזור הזה מתחדש, ויחזור בקרוב.",
    lede: "אנחנו בונים מחדש את האזור האישי ואת כלי העבודה שלנו. בינתיים הצוות זמין לכל שאלה, בטלפון, בוואטסאפ או במייל.",
  },
  form: {
    title: "הטופס הדיגיטלי יחזור בקרוב.",
    lede: "את הטופס הזה אנחנו משלימים כרגע יחד איתכם, בשיחה. דברו עם הצוות בטלפון, בוואטסאפ או במייל, ונסדר הכול יחד.",
  },
} as const;

const ComingSoon = ({ variant = "area" }: { variant?: keyof typeof COPY }) => (
  <PubPage tint="butter">
    <section className="sd-hero">
      <div className="sd-wrap sd-hero-grid">
        <div className="sd-hero-copy">
          <span className="sd-eyebrow">בקרוב</span>
          <h1 className="sd-h1 mt-5">{COPY[variant].title}</h1>
          <p className="sd-pub-lede">{COPY[variant].lede}</p>
          <div className="sd-pub-depts">
            {DEPTS.map((d) => (
              <section key={d} className="sd-pub-dept" aria-label={DEPT_LABEL[d]}>
                <h2>{DEPT_LABEL[d]}</h2>
                <ContactIcons dept={d} tone="dark" />
                <p className="sd-pub-dept-plain">
                  <span dir="ltr" className="tabular-nums whitespace-nowrap">{CONTACTS[d].phone}</span>
                </p>
              </section>
            ))}
          </div>
          <div className="sd-pub-actions">
            <Link to="/" className="sd-btn">לדף הבית<Arrow /></Link>
            <Link to="/contact" className="sd-link">להשאיר פרטים<Arrow /></Link>
          </div>
        </div>
        <div className="sd-stage" aria-hidden="true">
          <SdPic name="01-hero" sizes="(min-width:1024px) 520px, 90vw" priority />
        </div>
      </div>
    </section>
  </PubPage>
);

export default ComingSoon;
