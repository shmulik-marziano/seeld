import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FINANCE as savingsCategories } from "@/data/productDirectory";
import { SdBand, SdCrumbs, SdIcon, SdPic, SdSubnav, tintStyle, useSdFont } from "@/components/sd/primitives";
import { topicFor } from "@/components/sd/topics";
import "@/components/sd/sd.css";
import "@/components/sd/SavingsPageSd.css";

// Savings hub in the kit design: hero with illustration, trust strip, the full index of the 11 products
// (every product keeps its link) and the navy closing on the central path (360 review / meeting).

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const trust = [
  { icon: "search", t: "השוואה בין הגופים", s: "דמי ניהול ומסלולי השקעה" },
  { icon: "handshake", t: "פגישה ראשונה ללא עלות", s: "ואינה מחייבת" },
  { icon: "shield", t: "צוות מקצועי", s: "ליווי לאורך הדרך" },
  { icon: "phone", t: "מענה אישי", s: "רעננה וירושלים" },
];

const Savings = () => {
  const topic = topicFor("/savings");
  const [p1, p2] = topic.palette;
  useSdFont();
  const arrow = <BrandIcon name="arrow-left" size={18} />;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        {/* HERO */}
        <section className="sd-hero">
          <div className="sd-wrap sd-hero-grid">
            <div className="sd-hero-copy">
              <SdCrumbs items={[{ label: "דף הבית", to: "/" }, { label: "חיסכון ופנסיה" }]} />
              <span className="sd-eyebrow">חיסכון ופנסיה</span>
              <h1 className="sd-h1 mt-5">חיסכון ופנסיה</h1>
              <p className="sd-text mt-6" style={{ color: "var(--muted)" }}>
                <span dir="ltr" className="tabular-nums whitespace-nowrap">11</span> מוצרי חיסכון ופנסיה, מקרן הפנסיה הראשונה ועד תכנון הפרישה.
                בוחרים נושא, ואנחנו מסדרים את דמי הניהול, המסלולים וההפקדות בתמונה אחת.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#savings-index" className="sd-btn">לרשימת מוצרי החיסכון{arrow}</a>
                <Link to="/#portfolio-review" className="sd-link">בדיקת תיק 360{arrow}</Link>
              </div>
              <button type="button" className="sd-sav-chat" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>

            <div className="sd-stage" aria-hidden="true">
              <SdPic name={topic.art} sizes="(min-width:1024px) 520px, 90vw" priority />
            </div>
          </div>
        </section>

        {/* TRUST */}
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

        <SdSubnav sections={[{ id: "savings-index", label: "כל המוצרים" }, { id: "savings-contact", label: "יצירת קשר" }]} />

        {/* INDEX: every product keeps its link */}
        <SdBand tone={p2} id="savings-index">
          <div className="sd-wrap">
            <div className="sd-band-head">
              <h2 className="sd-h2">כל מוצרי החיסכון והפנסיה</h2>
              <p className="sd-lead">לכל מוצר עמוד משלו: איך הוא עובד, מתי כדאי לבדוק, שאלות נפוצות וטופס לניתוח.</p>
            </div>
            <ul className="sd-sav-index">
              {savingsCategories.map((item, i) => (
                <li key={item.href}>
                  <Link to={item.href} className="sd-sav-card">
                    <em>{String(i + 1).padStart(2, "0")}</em>
                    <div>
                      <h3 className="sd-h3">{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <BrandIcon name="arrow-left" size={18} className="sd-sav-go" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
              <p className="sd-text" style={{ fontSize: 17 }}>לא יודעים מה מזה יש לכם?</p>
              <button type="button" className="sd-link" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </SdBand>

        {/* CLOSING */}
        <section id="savings-contact" className="sd-contact scroll-mt-20">
          <div className="sd-wrap sd-sav-close">
            <div>
              <h2 className="sd-h2">רוצים ניתוח פנסיוני?</h2>
              <p className="sd-text mt-4">
                נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם, ונחזור אליכם עם תמונה מסודרת. ללא עלות וללא התחייבות.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link to="/#portfolio-review" className="sd-btn sd-btn-light">בדיקת תיק 360{arrow}</Link>
                <Link to="/contact" className="sd-sav-close-link">תיאום פגישה{arrow}</Link>
              </div>
            </div>
            <div className="sd-contact-art" aria-hidden="true"><SdPic name={topic.art2} sizes="360px" /></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Savings;
