import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdPic, SdIcon, useSdFont } from "@/components/sd/primitives";
import "@/components/sd/sd.css";
import "@/components/sd/home.css";
import "@/components/sd/home-entry.css";

/**
 * Home hero in the kit design: serif headline, one warm sentence and three clear entrances
 * (insurance portfolio check, financial planning, personal report), a calm always-visible
 * entrance for existing clients, and a composition of kit illustrations. Followed by the trust strip.
 * Only used by pages/Index.tsx.
 */

const doors = [
  { icon: "shield", t: "בדיקת התיק הביטוחי", s: "מיפוי הביטוחים שיש לכם היום, ושיחה על מה שחסר או כפול.", to: "/portfolio-review", tone: "sky" },
  { icon: "compass", t: "תכנון פיננסי", s: "פנסיה, חיסכון ומטרות לעתיד, בתמונה אחת ובקצב שלכם.", to: "/savings/financial-planning", tone: "butter" },
  { icon: "document", t: "הפקת דוח אישי", s: "מעלים קובץ מסלקה והר הביטוח, ומקבלים דוח מידע מסודר.", to: "/report", tone: "ink", badge: "בקרוב" },
];

const trust = [
  { icon: "search", t: "השוואה בין החברות", s: "בכל חברות הביטוח בשוק" },
  { icon: "handshake", t: "שיחת היכרות", s: "בלי התחייבות מצידכם" },
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
            <p className="sd-lead mt-5">
              שלוש דרכים להתחיל, ואתם בוחרים את הקצב. אנחנו מסדרים את המידע ומסבירים אותו בשקט ובלי לחץ.
            </p>

            <nav className="sd-home-doors" aria-label="שלוש דרכים להתחיל">
              {doors.map((d) => (
                <Link key={d.to} to={d.to} className={`sd-home-door is-${d.tone}`}>
                  <span className="sd-home-door-ic" aria-hidden="true"><SdIcon name={d.icon} size={40} /></span>
                  <span className="sd-home-door-tx">
                    <b>{d.t}{d.badge && <i className="sd-home-soon">{d.badge}</i>}</b>
                    <small>{d.s}</small>
                  </span>
                  <span className="sd-home-door-go" aria-hidden="true">{arrow}</span>
                </Link>
              ))}
            </nav>

            <div className="sd-home-client" role="group" aria-label="כניסה ללקוחות">
              <SdIcon name="lock" size={28} />
              <span>כבר לקוחות שלנו?</span>
              <Link to="/personal-area" className="sd-home-client-btn">כניסה ללקוחות{arrow}</Link>
            </div>
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
