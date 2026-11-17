import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdPic, SdIcon, useSdFont } from "@/components/sd/primitives";
import "@/components/sd/sd.css";
import "@/components/sd/home.css";

/**
 * Home hero in the kit design: serif headline, one warm sentence, two actions, and a composition
 * of three kit illustrations. Followed by the trust strip. Only used by pages/Index.tsx.
 */

const trust = [
  { icon: "search", t: "השוואה בין החברות", s: "בכל חברות הביטוח בשוק" },
  { icon: "handshake", t: "פגישה ראשונה ללא עלות", s: "ואינה מחייבת" },
  { icon: "shield", t: "צוות סוכנים מקצועי", s: "ליווי מההצעה ועד התביעה" },
  { icon: "phone", t: "מענה אישי", s: "רעננה וירושלים" },
];

const HeroSection = () => {
  useSdFont();
  const arrow = <BrandIcon name="arrow-left" size={18} />;
  return (
    <>
      <section className="sd-hero sd-home-hero">
        <div className="sd-wrap sd-hero-grid">
          <div className="sd-hero-copy">
            <span className="sd-eyebrow">סוכנות ביטוח ופיננסים עצמאית</span>
            <h1 className="sd-h1 mt-5">הכסף, הנכסים והביטוח שלכם, בתמונה ברורה.</h1>
            <p className="sd-lead mt-6">
              אנחנו עוברים איתכם על מה שיש היום, משווים בין כל החברות בשוק, ומסדרים את התיק בשקט ובלי לחץ.
            </p>
            <div className="sd-home-ctas">
              <a href="#contact-form" className="sd-btn">קבלו הצעה{arrow}</a>
              <a href="#portfolio-review" className="sd-home-btn-ghost">בדיקת תיק 360{arrow}</a>
            </div>
            <p className="sd-home-fine">השיחה הראשונה ללא עלות וללא התחייבות.</p>
          </div>

          <div className="sd-home-stage" aria-hidden="true">
            <div className="sd-home-stage-main">
              <SdPic name="01-hero" sizes="(min-width:1024px) 560px, 90vw" priority />
            </div>
            <div className="sd-home-mini sd-home-mini-a">
              <SdPic name="02-family-protection" sizes="200px" />
              <span>המשפחה</span>
            </div>
            <div className="sd-home-mini sd-home-mini-b">
              <SdPic name="04-investments-growth" sizes="170px" />
              <span>העתיד</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sd-trust" aria-label="למה לבחור בנו">
        <div className="sd-wrap">
          <ul>
            {trust.map((x) => (
              <li key={x.t}>
                <SdIcon name={x.icon} />
                <div><b>{x.t}</b><span>{x.s}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
