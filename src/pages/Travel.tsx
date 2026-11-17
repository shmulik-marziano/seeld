import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { articles } from "@/data/articles";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdCrumbs, SdIcon, SdPic, tintStyle, useSdFont } from "@/components/sd/primitives";
import { topicFor } from "@/components/sd/topics";
import "@/components/sd/sd.css";

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));

const Travel = () => {
  useSdFont();
  const topic = topicFor("/travel");
  const [p1, p2, p3] = topic.palette;
  const carHomeInsuranceArticles = articles.filter(article =>
    article.category.includes("ביטוח רכב") ||
    article.category.includes("ביטוח דירה")
  );

  const features: { title: string; description: string; href?: string; icon: string }[] = [
    { title: "ביטוח רכב", description: "חובה, מקיף וצד ג׳, בהשוואה בין כל החברות", href: "/insurance/vehicle", icon: "shield" },
    { title: "ביטוח דירה", description: "מבנה ותכולה, בלי הפתעות מאוחרות", href: "/insurance/home", icon: "lock" },
    { title: "בלי פגישה", description: "משאירים פרטים בטופס, ואנחנו חוזרים אליכם עם הצעות להשוואה", icon: "phone" },
    { title: "השוואת מחירים", description: "השוואה בין כל חברות הביטוח בשוק, עם המלצה מנומקת", icon: "search" },
  ];
  const arrow = <BrandIcon name="arrow-left" size={18} />;

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />
      <main>
        <section className="sd-hero">
          <div className="sd-wrap sd-hero-grid">
            <div className="sd-hero-copy">
              <SdCrumbs items={[{ label: "דף הבית", to: "/" }, { label: "ביטוח בקליק" }]} />
              <span className="sd-eyebrow">רכב ודירה</span>
              <h1 className="sd-h1 mt-5">ביטוח בקליק</h1>
              <p className="sd-text mt-6" style={{ color: "var(--muted)" }}>
                ביטוח רכב וביטוח דירה: הצעות מחיר בהשוואה בין כל החברות, בלי פגישה.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link to="/insurance/vehicle" className="sd-btn">להצעה לביטוח רכב{arrow}</Link>
                <Link to="/#portfolio-review" className="sd-link">בדיקת תיק 360{arrow}</Link>
              </div>
              <button type="button" className="sd-link mt-6" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
            <div className="sd-stage" aria-hidden="true">
              <SdPic name={topic.art} sizes="(min-width:1024px) 520px, 90vw" priority />
            </div>
          </div>
        </section>

        <SdBand tone={p2}>
          <div className="sd-wrap">
            <div className="sd-band-head"><h2 className="sd-h2">למה לבחור בשילד?</h2></div>
            <div className="sd-points" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
              {features.map((feature) => (
                <div key={feature.title} className="sd-point sd-reveal">
                  <SdIcon name={feature.icon} size={48} />
                  <h3 className="sd-h3">{feature.title}</h3>
                  <p>{feature.description}</p>
                  {feature.href && (
                    <Link to={feature.href} className="sd-link mt-4">לפרטי הביטוח{arrow}</Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SdBand>

        <SdBand tone="white">
          <div className="sd-wrap">
            <div className="sd-band-head">
              <h2 className="sd-h2">מאמרים ומדריכים</h2>
              <p className="sd-lead">כל מה שצריך לדעת על ביטוח רכב וביטוח דירה</p>
            </div>
            <div className="sd-points">
              {carHomeInsuranceArticles.map((article, i) => (
                <Link key={article.id} to={`/article/${article.id}`} className="sd-point sd-reveal">
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <small style={{ color: "var(--muted)" }}>{article.category}</small>
                  <h3 className="sd-h3">{article.title}</h3>
                  <p className="line-clamp-3">{article.subtitle}</p>
                  <span className="sd-link mt-3">קראו עוד{arrow}</span>
                </Link>
              ))}
            </div>
          </div>
        </SdBand>

        <SdBand tone={p3}>
          <div className="sd-wrap-narrow">
            <div className="sd-band-head"><h2 className="sd-h2">איך זה עובד</h2></div>
            <div className="space-y-5">
              <p className="sd-text">
                ביטוח רכב ודירה לא מחייב פגישה. משאירים פרטים בטופס של הביטוח המתאים,
                ואנחנו חוזרים אליכם עם הצעות מחיר להשוואה.
              </p>
              <p className="sd-text">
                ההשוואה מול כל חברות הביטוח בשוק, ללא עלות וללא התחייבות.
                נחזור אליכם עם המלצה מנומקת, לא עם רשימת מחירים.
              </p>
            </div>
          </div>
        </SdBand>

        <section className="sd-contact" style={{ padding: "72px 0" }}>
          <div className="sd-wrap">
            <h2 className="sd-h2">מוכנים להתחיל?</h2>
            <p className="sd-text mt-4" style={{ maxWidth: 560 }}>
              הצעת מחיר ללא עלות וללא התחייבות, בהשוואה בין כל החברות. אפשר גם לבדוק את כל התיק בבת אחת.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/#portfolio-review" className="sd-btn sd-btn-light">בדיקת תיק 360{arrow}</Link>
              <Link to="/contact" className="sd-btn sd-btn-light">תיאום פגישה{arrow}</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Travel;
