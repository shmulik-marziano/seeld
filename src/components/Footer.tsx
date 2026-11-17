import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { REGULATORY_LINE } from "@/lib/brand";
import {
  INSURANCE_GROUPS,
  KNOWLEDGE_LINKS,
  SAVINGS_LINKS,
  SERVICE_LINKS,
  SOCIAL_LINKS,
} from "@/components/sd/chromeData";
import RelatedPages from "@/components/RelatedPages";
import "@/components/sd/chrome.css";

const insuranceLinks = [
  ...INSURANCE_GROUPS.flatMap((g) => g.links),
  { href: "/insurances", label: "לכל תחומי הביטוח" },
];

const Footer = () => {
  return (
    <>
    <RelatedPages />
    <footer dir="rtl" className="sd-chrome-footer">
      {/* Faint pencil illustration, decorative only */}
      <img
        src="/art/02-family-protection-768.webp"
        alt=""
        aria-hidden="true"
        width={768}
        height={768}
        loading="lazy"
        decoding="async"
        className="sd-chrome-foot-art"
      />

      <div className="sd-chrome-foot-wrap">
        {/* Top: invitation + primary action */}
        <div className="sd-chrome-foot-top">
          <div>
            <p className="sd-chrome-foot-kicker">שילד ביטוח ופיננסים</p>
            <h2 className="sd-chrome-foot-title">נדבר על התיק שלכם?</h2>
            <p className="sd-chrome-foot-lead">שיחה ראשונה, בלי התחייבות. נשמח להכיר את התמונה המלאה.</p>
          </div>
          <div className="sd-chrome-foot-actions">
            <Link to="/contact" className="sd-chrome-foot-cta">צור קשר</Link>
            <button
              type="button"
              className="sd-chrome-foot-chat"
              onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
            >
              או שאלו את היועץ הדיגיטלי
            </button>
          </div>
        </div>

        {/* Navigation columns */}
        <div className="sd-chrome-foot-cols">
          <nav aria-label="ביטוחים" className="sd-chrome-foot-col sd-chrome-foot-col-wide">
            <h3>ביטוחים</h3>
            <ul>
              {insuranceLinks.map((l) => (
                <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="חיסכון ופנסיה" className="sd-chrome-foot-col">
            <h3>חיסכון ופנסיה</h3>
            <ul>
              {SAVINGS_LINKS.map((l) => (
                <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
              ))}
              <li><Link to="/savings">לכל תחומי הפיננסים</Link></li>
            </ul>
          </nav>

          <nav aria-label="ידע ושירותים" className="sd-chrome-foot-col">
            <h3>ידע</h3>
            <ul>
              {KNOWLEDGE_LINKS.map((l) => (
                <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
              ))}
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}><Link to={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div className="sd-chrome-foot-col">
            <h3>יצירת קשר</h3>
            <ul className="sd-chrome-foot-contact">
              <li>
                <a href="tel:0523097444" dir="ltr">
                  <Phone size={16} aria-hidden="true" />
                  052-309-7444
                </a>
              </li>
              <li>
                <a href="mailto:info@seeld.co.il" dir="ltr">
                  <Mail size={16} aria-hidden="true" />
                  info@seeld.co.il
                </a>
              </li>
              <li>
                <span>
                  <MapPin size={16} aria-hidden="true" />
                  רעננה · ירושלים
                </span>
              </li>
              <li><Link to="/personal-area" className="sd-chrome-foot-strong">לאזור האישי</Link></li>
              <li><Link to="/agents">כניסה לסוכנים</Link></li>
            </ul>
            <ul className="sd-chrome-foot-social" aria-label="רשתות חברתיות">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom line: legal, small */}
        <div className="sd-chrome-foot-base">
          <p className="sd-chrome-foot-legal">
            {REGULATORY_LINE} המידע באתר כללי בלבד ואינו מהווה ייעוץ פיננסי, ביטוחי או משפטי, ואין להסתמך עליו כתחליף
            לייעוץ מקצועי אישי. שילד פועלת בכפוף לחוק הפיקוח על שירותים פיננסיים (ביטוח) ובפיקוח רשות שוק ההון, ביטוח וחיסכון.
          </p>
          <div className="sd-chrome-foot-row">
            <p>
              &copy; {new Date().getFullYear()} שילד ביטוח ופיננסים · סוכנות ביטוח מבית עמיתים הון · מספר רישיון{" "}
              <bdi className="tabular-nums">138666</bdi>
            </p>
            <ul>
              <li><Link to="/privacy">מדיניות פרטיות</Link></li>
              <li><Link to="/terms">תנאי שימוש</Link></li>
              <li><Link to="/accessibility">נגישות</Link></li>
              <li><Link to="/cookie-policy">עוגיות</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
