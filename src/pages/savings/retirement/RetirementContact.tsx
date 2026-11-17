import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnswerSummary from "@/components/AnswerSummary";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { SdArtLayer, SdBand, SdPic, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubHead, PubHero } from "@/components/sd/pub";
import RetireForm from "@/components/retire/RetireForm";
import { Arrow, RpEntryCards, RpPageNav, RpRegLine } from "@/components/retire/parts";
import { CHECKLIST_HREF, CHECKLIST_PDF_URL, NEXT_STEPS, RP, RP_CONTACT, RP_TOPIC } from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";

// The contact step: the intro-call form (same form as the landing page), what happens next, and the entry cards.

export default function RetirementContact() {
  useSdFont();
  const t = RP_TOPIC;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle("rose")}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "תכנון פרישה", to: RP }, { label: "שיחת היכרות" }]}
          eyebrow="הצעד הראשון"
          title="שיחת היכרות ראשונה, בלי התחייבות"
          lead="מספרים לנו בקצרה מה המצב, ומישהו מהצוות חוזר אליכם לתיאום. אין צורך להכין שום דבר מראש."
          art="33-welcome-table"
          tint="rose"
          compact
        >
          <div className="sd-brief sd-rp-summary">
            <b>בקצרה</b>
            <AnswerSummary className="" />
          </div>
        </PubHero>

        <RpPageNav />

        <section id="form" className="sd-contact scroll-mt-20">
          <SdArtLayer name={t.art} className="sd-band-art sd-contact-layer" />
          <div className="sd-wrap sd-contact-grid">
            <div>
              <h2 className="sd-h2">מה קורה אחרי שמשאירים פרטים</h2>
              <ol className="sd-rp-next mt-6">
                {NEXT_STEPS.map((s, i) => <li key={s} data-n={i + 1}>{s}</li>)}
              </ol>
              <div className="sd-reach mt-8"><ContactIcons tone="light" /></div>
              <div className="sd-contact-art" aria-hidden="true"><SdPic name={t.art4} sizes="360px" /></div>
            </div>
            <div className="sd-form"><RetireForm idPrefix="rp-contact" source="עמוד שיחת היכרות לתכנון פרישה" /></div>
          </div>
        </section>

        <SdBand tone="cream" id="entry" art={false}>
          <div className="sd-wrap">
            <PubHead title="מאיפה אתם מגיעים" lede="בחרו את המצב הקרוב אליכם, והטופס יסומן בנושא המתאים." />
            <RpEntryCards to={RP_CONTACT} />
            <p className="mt-10 sd-rp-lede">
              {CHECKLIST_PDF_URL
                ? <a className="sd-link" href={CHECKLIST_HREF} download>רשימת ההכנה לתכנון פרישה<Arrow /></a>
                : <Link className="sd-link" to={CHECKLIST_HREF} target="_blank" rel="noopener">רשימת ההכנה לתכנון פרישה, להדפסה<Arrow /></Link>}
            </p>
          </div>
        </SdBand>
        <RpRegLine />
      </main>
      <Footer />
    </div>
  );
}
