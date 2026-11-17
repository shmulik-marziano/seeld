import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnswerSummary from "@/components/AnswerSummary";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { SdArtLayer, SdBand, SdIcon, SdPic, SdProcess, SdSubnav, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubHead, PubHero } from "@/components/sd/pub";
import { useFaqJsonLd } from "@/hooks/useFaqJsonLd";
import RetireForm from "@/components/retire/RetireForm";
import { Arrow, RpEntryCards, RpFaqList, RpRegLine } from "@/components/retire/parts";
import {
  AUDIENCES, CASE, CORE_MESSAGE, DIFFERENTIATORS, FAQS, FINDINGS, FINDINGS_INTRO, HERO_FOR, HERO_LEAD, INTRO,
  RP_CASE, RP_CONTACT, RP_FAQ, RP_HOW, RP_TOPIC, RP_CASE_LABEL, STEPS, STEPS_CLOSING, THEMES,
} from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";

// Landing page of the retirement-planning section: the core message, what we do, the five steps,
// the recurring findings, the family-unit / needs / intergenerational / risk-hedging themes, a FAQ teaser and the form.

const SECTIONS = [
  { id: "audience", label: "למי זה מיועד" },
  { id: "what", label: "מה אנחנו עושים" },
  { id: "themes", label: "איך מסתכלים על התמונה" },
  { id: "process", label: "חמישה שלבים" },
  { id: "entry", label: "מאיפה מתחילים" },
  { id: "findings", label: "מה בודקים" },
  { id: "faq", label: "שאלות נפוצות" },
  { id: "form", label: "שיחת היכרות" },
];

const TEASER = FAQS.slice(0, 4);

export default function RetirementPlanning() {
  useSdFont();
  useFaqJsonLd(TEASER);
  const t = RP_TOPIC;
  const [p1, p2, p3] = t.palette;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "חיסכון ופנסיה", to: "/savings" }, { label: "תכנון פרישה" }]}
          eyebrow="תכנון פרישה"
          title={CORE_MESSAGE}
          lead={HERO_LEAD}
          art={t.art}
          tint={p1}
          actions={
            <>
              <a href="#form" className="sd-btn">שיחת היכרות ראשונה, בלי התחייבות<Arrow /></a>
              <Link to={RP_HOW} className="sd-link">איך זה עובד<Arrow /></Link>
            </>
          }
        >
          <div className="sd-brief sd-rp-summary">
            <b>בקצרה</b>
            <AnswerSummary className="" />
          </div>
        </PubHero>

        <SdSubnav sections={SECTIONS} />

        {/* audience */}
        <SdBand tone="cream" id="audience" art="26-pre-retirement-path">
          <div className="sd-wrap">
            <PubHead title={HERO_FOR.title} lede={HERO_FOR.text} />
            <div className="sd-rp-aud">
              {AUDIENCES.map((a) => (
                <div key={a.title} className="sd-reveal">
                  <small>{a.tag}</small>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
            <p className="sd-rp-intro">{INTRO}</p>
          </div>
        </SdBand>

        {/* what we do: the three differentiators */}
        <SdBand tone={p2} id="what" art="31-team-desks">
          <div className="sd-wrap">
            <PubHead title="מה אנחנו עושים" lede="שלוש עובדות על הדרך שבה אנחנו עובדים." />
            <ul className="sd-rp-diff">
              {DIFFERENTIATORS.map((d) => (
                <li key={d.n} className="sd-reveal">
                  <em>{d.n}</em>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </SdBand>

        {/* themes: needs, family unit, wealth and the next generation, risk hedging */}
        <SdBand tone="lavender" id="themes" art="02-family-protection">
          <div className="sd-wrap sd-rp-themes">
            <PubHead title="איך מסתכלים על התמונה" lede="ארבע נקודות מבט שמלוות כל תהליך, מהאפיון הראשוני ועד הביצוע." />
            <div className="sd-checks">
              {THEMES.map((th) => (
                <div key={th.title} className="sd-check sd-reveal">
                  <SdIcon name={th.icon} size={52} />
                  <div>
                    <h3>{th.title}</h3>
                    <p>{th.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SdBand>

        {/* process: the five steps */}
        <SdBand tone={p3} id="process" art="10-financial-planning">
          <SdProcess art={t.art2} steps={STEPS} title="התהליך בחמישה שלבים" />
          <div className="sd-wrap">
            <p className="sd-rp-quote">{STEPS_CLOSING}</p>
            <div className="mt-6"><Link to={RP_HOW} className="sd-link">לפירוט כל שלב<Arrow /></Link></div>
          </div>
        </SdBand>

        {/* entry cards */}
        <SdBand tone="white" id="entry" art={false}>
          <div className="sd-wrap">
            <PubHead title="מאיפה אתם מגיעים" lede="בחרו את המצב הקרוב אליכם, והטופס ייפתח עם הנושא כבר מסומן." />
            <RpEntryCards />
          </div>
        </SdBand>

        {/* findings */}
        <SdBand tone="rose" id="findings" art="30-rights-found-key">
          <div className="sd-wrap">
            <PubHead title="שבעה דברים שאנחנו בודקים בכל תיק פרישה" />
            <p className="sd-rp-lede" style={{ marginTop: -20, marginBottom: 28 }}>{FINDINGS_INTRO}</p>
            <ol className="sd-rp-findings">
              {FINDINGS.map((f) => (
                <li key={f.n} className="sd-rp-finding sd-reveal">
                  <em>{f.n}</em>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="sd-rp-teaser">
              <div>
                <small>{RP_CASE_LABEL}</small>
                <h3>{CASE.title}</h3>
                <p>מיפוי מלא של תיק אחד, ומה שנמצא בו. מקרה אחד, ולא תוצאה אופיינית.</p>
              </div>
              <Link to={RP_CASE} className="sd-btn">לסיפור המלא<Arrow /></Link>
            </div>
          </div>
        </SdBand>

        {/* faq teaser */}
        <SdBand tone="cream" id="faq" art="11-claims-service">
          <div className="sd-wrap-narrow">
            <div className="sd-band-head"><h2 className="sd-h2">שאלות שמגיעות אלינו</h2></div>
            <RpFaqList items={TEASER} />
            <div className="mt-8"><Link to={RP_FAQ} className="sd-link">לכל השאלות והתשובות<Arrow /></Link></div>
          </div>
        </SdBand>

        {/* form */}
        <section id="form" className="sd-contact scroll-mt-20">
          <SdArtLayer name={t.art5} className="sd-band-art sd-contact-layer" />
          <div className="sd-wrap sd-contact-grid">
            <div>
              <h2 className="sd-h2">נתחיל משיחת היכרות</h2>
              <p className="sd-text mt-4">
                משאירים כמה פרטים, ומישהו מהצוות חוזר אליכם לתיאום. בפגישה הראשונה מציגים בכתב את מודל התגמול לפני שמתחילים, ושומעים מה מעסיק אתכם.
              </p>
              <div className="sd-reach mt-6"><ContactIcons tone="light" /></div>
              <div className="sd-contact-art" aria-hidden="true"><SdPic name={t.art5} sizes="360px" /></div>
              <p className="mt-6"><Link to={RP_CONTACT} className="sd-link-light">לעמוד שיחת ההיכרות<Arrow /></Link></p>
            </div>
            <div className="sd-form"><RetireForm idPrefix="rp-main" source="עמוד תכנון פרישה" /></div>
          </div>
        </section>
        <RpRegLine />
      </main>
      <Footer />
    </div>
  );
}
