import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { articles } from "@/data/articles";
import { stories } from "@/data/stories";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdPic, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubArticleCard, PubClose, PubHead, PubHero, fullMonthDate, spreadArts } from "@/components/sd/pub";
import "@/components/sd/sd.css";

// Health, life and nursing overview in the kit design: hero with illustration, story band,
// numbered service areas, guides as illustrated cards, closing block.

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));
const arrow = <BrandIcon name="arrow-left" size={18} />;

const Wellness = () => {
  useSdFont();
  const topic = PUB_TOPICS.wellness;
  const [p1, p2, p3] = topic.palette;
  const story = stories["/wellness"];

  const healthInsuranceArticles = articles.filter(article =>
    article.category.includes("ביטוח בריאות") ||
    article.category.includes("ביטוח חיים")
  );

  const cardArts = spreadArts(healthInsuranceArticles, [topic.art, topic.art2], ["02-family-protection"]);

  const services: { title: string; description: string; href?: string }[] = [
    { title: "ביטוח בריאות פרטי", description: "כיסוי רפואי מקיף לטיפולים, ניתוחים ותרופות", href: "/insurance/health" },
    { title: "ביטוח חיים", description: "הגנה כלכלית למשפחה, לפי מה שבאמת צריך", href: "/insurance/life" },
    { title: "ביטוח סיעודי", description: "כיסוי מקיף למקרה של צורך בטיפול סיעודי", href: "/insurance/nursing" },
    { title: "ליווי מקצועי", description: "הצוות שלנו עוזר לבחור את הפוליסה המתאימה" },
  ];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "שירותים ופעולות" }]}
          eyebrow="בריאות, חיים וסיעוד"
          title="שירותים ופעולות"
          lead="ביטוח בריאות, חיים וסיעוד: המידע, הכלים וההשוואות, במקום אחד."
          art={topic.art}
          tint={p1}
          actions={
            <>
              <Link to="/contact" className="sd-btn">תיאום פגישה{arrow}</Link>
              <Link to="/#portfolio-review" className="sd-link">אפיון צרכים{arrow}</Link>
              <button type="button" className="sd-link" onClick={openChat}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </>
          }
        />

        {story && (
          <SdBand tone={p1} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        <SdBand tone="cream" id="services">
          <div className="sd-wrap">
            <PubHead title="השירותים שלנו" />
            <div className="sd-pub-pillars">
              {services.map((service, i) => (
                <div key={service.title} className="sd-pub-pillar sd-reveal">
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    {service.href && (
                      <Link to={service.href} className="sd-link mt-3">לפרטי הביטוח{arrow}</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SdBand>

        <SdBand tone={p2} id="guides">
          <div className="sd-wrap">
            <PubHead title="מאמרים ומדריכים" lede="כל מה שצריך לדעת על ביטוח בריאות וביטוח חיים" />
            <div className="sd-pub-grid sd-pub-grid-3">
              {healthInsuranceArticles.map((article, idx) => {
                const a = cardArts[idx];
                return (
                  <PubArticleCard
                    key={article.id}
                    to={`/article/${article.id}`}
                    title={article.title}
                    kicker={article.category}
                    meta={<>{fullMonthDate(article.date)} · {article.readTime}</>}
                    excerpt={article.subtitle}
                    art={a.art}
                    tone={a.tone}
                    cta="קראו עוד"
                  />
                );
              })}
            </div>
          </div>
        </SdBand>

        <SdBand tone={p3} id="why">
          <div className="sd-wrap sd-pub-split">
            <div className="sd-pub-copy">
              <h2 className="sd-h2" style={{ marginBottom: 24 }}>למה שילד?</h2>
              <p className="sd-text">
                הצוות שלנו מכיר את התיק של כל לקוח ומלווה אותו,
                מהייעוץ הראשוני ועד הטיפול בתביעות.
              </p>
              <p className="sd-text">
                ביטוח בריאות, חיים, רכב או דירה: משווים בין כמה חברות
                וחוזרים אליכם עם המלצה מנומקת.
              </p>
            </div>
            <div className="sd-story-art sd-reveal" aria-hidden="true">
              <SdPic name="02-family-protection" sizes="(min-width:1024px) 440px, 90vw" />
            </div>
          </div>
        </SdBand>

        <PubClose
          title="רוצים לשמוע עוד?"
          text="השאירו פרטים ונחזור אליכם עם השוואה מסודרת. שיחת היכרות בלי התחייבות מצידכם."
          art="01-hero"
        />
      </main>

      <Footer />
    </div>
  );
};

export default Wellness;
