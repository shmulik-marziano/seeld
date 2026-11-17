import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { articles } from "@/data/articles";
import { stories } from "@/data/stories";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdPic, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubArticleCard, PubClose, PubHead, PubHero, artForText } from "@/components/sd/pub";
import "@/components/sd/sd.css";

// Savings and finance overview in the kit design: hero with illustration, story band,
// numbered areas, guides as illustrated cards, planning text, closing block.

const openChat = () => window.dispatchEvent(new Event("seeld:open-chat"));
const arrow = <BrandIcon name="arrow-left" size={18} />;

const Growth = () => {
  useSdFont();
  const topic = PUB_TOPICS.growth;
  const [p1, p2, p3] = topic.palette;
  const story = stories["/growth"];

  const savingsArticles = articles.filter(article =>
    article.category.includes("חיסכון") ||
    article.category.includes("השקעות") ||
    article.category.includes("תקציב")
  );

  const pillars: { title: string; description: string; href?: string }[] = [
    { title: "חיסכון חכם", description: "אסטרטגיות חיסכון מותאמות אישית לכל שלב בחיים", href: "/savings" },
    { title: "השקעות", description: "בחירת מסלולים ומעקב תשואות", href: "/savings/investment" },
    { title: "תכנון מס", description: "ניצול מרבי של הטבות מס וחיסכון בתשלומים" },
    { title: "יעדים פיננסיים", description: "הגדרת יעדים ובחינה מחדש אחת לשנה", href: "/savings/financial-planning" },
  ];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "חיסכון ופיננסים" }]}
          eyebrow="חיסכון, פנסיה והשקעות"
          title="חיסכון ופיננסים"
          lead="מדריכים בנושאי חיסכון, פנסיה, קרנות השתלמות והשקעות, במקום אחד."
          art={topic.art}
          tint={p1}
          actions={
            <>
              <Link to="/contact" className="sd-btn">תיאום פגישה{arrow}</Link>
              <Link to="/#portfolio-review" className="sd-link">בדיקת תיק 360{arrow}</Link>
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

        <SdBand tone="cream" id="areas">
          <div className="sd-wrap">
            <PubHead title="תחומי ההתמחות שלנו" />
            <div className="sd-pub-pillars">
              {pillars.map((pillar, i) => (
                <div key={pillar.title} className="sd-pub-pillar sd-reveal">
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <div>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                    {pillar.href && <Link to={pillar.href} className="sd-link mt-3">לפרטים{arrow}</Link>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SdBand>

        <SdBand tone={p2} id="guides">
          <div className="sd-wrap">
            <PubHead title="מאמרים ומדריכים" lede="כל מה שצריך לדעת על חיסכון, השקעות ותכנון פיננסי" />
            <div className="sd-pub-grid sd-pub-grid-3">
              {savingsArticles.map((article) => {
                const a = artForText(article.category, article.title);
                return (
                  <PubArticleCard
                    key={article.id}
                    to={`/article/${article.id}`}
                    title={article.title}
                    kicker={article.category}
                    meta={<>{article.date} · {article.readTime}</>}
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

        <SdBand tone={p3} id="planning">
          <div className="sd-wrap sd-pub-split">
            <div className="sd-pub-copy">
              <h2 className="sd-h2" style={{ marginBottom: 24 }}>תכנון פיננסי נכון</h2>
              <p className="sd-text">
                תכנון פיננסי נכון הוא הבסיס לביטחון כלכלי. בין אם אתם רק מתחילים את הקריירה,
                מתכננים רכישת דירה או מתקרבים לגיל הפרישה, ייעוץ מקצועי יכול לעשות את ההבדל.
              </p>
              <p className="sd-text">
                הצוות של שילד בונה איתכם תוכנית פיננסית מותאמת: ניצול הטבות המס הזמינות
                ובחירת אפיקי החיסכון וההשקעה שמתאימים לכם.
              </p>
            </div>
            <div className="sd-story-art sd-reveal" aria-hidden="true">
              <SdPic name="10-financial-planning" sizes="(min-width:1024px) 440px, 90vw" />
            </div>
          </div>
        </SdBand>

        <PubClose
          title="מוכנים לתכנן את העתיד?"
          text="הפגישה הראשונה ללא עלות וללא התחייבות. אפשר גם להתחיל בבדיקת תיק 360 מלאה."
          art="05-retirement"
        />
      </main>

      <Footer />
    </div>
  );
};

export default Growth;
