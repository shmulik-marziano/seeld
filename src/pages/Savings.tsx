import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FINANCE as savingsCategories } from "@/data/productDirectory";
import { stories } from "@/data/stories";
import { SdBand, SdCrumbs, SdIcon, SdPic, SdStory, SdSubnav, tintStyle, useSdFont } from "@/components/sd/primitives";
import { topicFor, type ArtName } from "@/components/sd/topics";
import "@/components/sd/sd.css";
import "@/components/sd/SavingsPageSd.css";

// Savings hub in the kit design: hero with illustration, trust strip, the full index of the 11 products
// (every product keeps its link) and the navy closing on the central path (360 review / meeting).

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const trust = [
  { icon: "search", t: "השוואה בין הגופים", s: "דמי ניהול ומסלולי השקעה" },
  { icon: "handshake", t: "שיחת היכרות", s: "בלי התחייבות מצידכם" },
  { icon: "shield", t: "צוות מקצועי", s: "ליווי לאורך הדרך" },
  { icon: "phone", t: "מענה אישי", s: "רעננה וירושלים" },
];

// The 11 products in three groups, each with its own illustration and colour band.
const GROUPS: { id: string; label: string; title: string; lede: string; art: ArtName; hrefs: string[] }[] = [
  {
    id: "g-pension", label: "פנסיה", title: "פנסיה וביטוח מנהלים", lede: "החיסכון שמלווה אתכם לאורך שנות העבודה.", art: "02-family-protection",
    hrefs: ["/savings/pension-funds", "/savings/pension-life-insurance", "/savings/employer-funds"],
  },
  {
    id: "g-flex", label: "חיסכון גמיש", title: "חיסכון גמיש", lede: "מקום נוסף לכסף, לפי היעד והזמן שלכם.", art: "12-childrens-savings",
    hrefs: ["/savings/gemel-funds", "/savings/training-funds", "/savings/gemel-investment", "/savings/investment", "/savings/child-savings"],
  },
  {
    id: "g-plan", label: "תכנון ופרישה", title: "תכנון ופרישה", lede: "לסדר את התמונה לפני הפרישה ואחריה.", art: "10-financial-planning",
    hrefs: ["/savings/financial-planning", "/savings/retirement-planning", "/savings/pre-retirement", "/savings/post-retirement"],
  },
];

const Savings = () => {
  const topic = topicFor("/savings");
  const [p1, p2, p3] = topic.palette;
  const story = stories["/savings"];
  const groupTones = [p2, "cream", p3] as const;
  let n = 0;
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
                <span dir="ltr" className="tabular-nums whitespace-nowrap">12</span> מוצרי חיסכון ופנסיה, מקרן הפנסיה הראשונה ועד תכנון הפרישה.
                בוחרים נושא, ואנחנו מסדרים את דמי הניהול, המסלולים וההפקדות בתמונה אחת.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#savings-index" className="sd-btn">לרשימת מוצרי החיסכון{arrow}</a>
                <Link to="/#portfolio-review" className="sd-link">אפיון צרכים{arrow}</Link>
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

        <SdSubnav
          sections={[
            ...(story ? [{ id: "moment", label: "מה עומד מולכם" }] : []),
            ...GROUPS.map((g) => ({ id: g.id, label: g.label })),
            { id: "savings-contact", label: "יצירת קשר" },
          ]}
        />

        {story && (
          <SdBand tone={p1} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        {/* INDEX: every product keeps its link, in three groups */}
        <div id="savings-index" className="scroll-mt-28">
          {GROUPS.map((g, gi) => (
            <SdBand key={g.id} tone={groupTones[gi]} id={g.id}>
              <div className="sd-wrap">
                <div className="sd-sav-group-head">
                  <div className="sd-band-head">
                    <h2 className="sd-h2">{g.title}</h2>
                    <p className="sd-lead">{g.lede}</p>
                  </div>
                  <div className="sd-sav-group-art" aria-hidden="true"><SdPic name={g.art} sizes="200px" /></div>
                </div>
                <ul className="sd-sav-index">
                  {g.hrefs.map((href) => {
                    const item = savingsCategories.find((c) => c.href === href);
                    if (!item) return null;
                    n += 1;
                    return (
                      <li key={item.href}>
                        <Link to={item.href} className="sd-sav-card">
                          <em>{String(n).padStart(2, "0")}</em>
                          <div>
                            <h3 className="sd-h3">{item.title}</h3>
                            <p>{item.description}</p>
                          </div>
                          <BrandIcon name="arrow-left" size={18} className="sd-sav-go" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {gi === GROUPS.length - 1 && (
                  <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <p className="sd-text" style={{ fontSize: 17 }}>לא יודעים מה מזה יש לכם?</p>
                    <button type="button" className="sd-link" onClick={openChat}>
                      <BrandIcon name="message" size={18} />
                      שאלו את היועץ הדיגיטלי
                    </button>
                  </div>
                )}
                {gi === GROUPS.length - 1 && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <p className="sd-text" style={{ fontSize: 17 }}>איזו רמת סיכון מתאימה לאופי שלכם כמשקיעים?</p>
                    <Link to="/savings/risk-profile" className="sd-link">לאפיון רמת סיכון בארבע שאלות{arrow}</Link>
                  </div>
                )}
              </div>
            </SdBand>
          ))}
        </div>

        {/* CLOSING */}
        <section id="savings-contact" className="sd-contact scroll-mt-20">
          <div className="sd-wrap sd-sav-close">
            <div>
              <h2 className="sd-h2">רוצים ניתוח פנסיוני?</h2>
              <p className="sd-text mt-4">
                נבדוק את הפנסיה, החיסכון ודמי הניהול שלכם, ונחזור אליכם עם תמונה מסודרת. שיחת היכרות בלי התחייבות מצידכם.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link to="/#portfolio-review" className="sd-btn sd-btn-light">אפיון צרכים{arrow}</Link>
                <Link to="/contact" className="sd-sav-close-link">תיאום פגישה{arrow}</Link>
              </div>
            </div>
            <div className="sd-contact-art" aria-hidden="true"><SdPic name="11-claims-service" sizes="360px" /></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Savings;
