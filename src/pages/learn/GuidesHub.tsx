import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { stories } from "@/data/stories";
import { SdBand, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubArticleCard, PubHead, PubHero } from "@/components/sd/pub";
import { ROUTE_BY_PATH, labelFromTitle } from "@/data/seo/routes";
import { GUIDE_CATALOG, GUIDE_CATEGORIES, TAX_BASE, categoryFor, pathOf } from "@/data/knowledge";
import type { GuideCategoryKey } from "@/data/knowledge/types";
import { KNOWLEDGE_REG_LINE } from "@/data/knowledge/regLine";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";
import "@/components/retire/retire.css";

// /learn/guides: every guide of the collection as a card (titles and descriptions come from the registry).
// The category chips only hide cards with the hidden attribute: every card stays in the DOM, so the
// prerender and crawlers see all of them.

const arrow = <BrandIcon name="arrow-left" size={18} />;

export default function GuidesHub() {
  useSdFont();
  const topic = PUB_TOPICS.learn;
  const [p1, p2, p3] = topic.palette;
  const story = stories["/learn/guides"];
  const [active, setActive] = useState<GuideCategoryKey | null>(null);

  const cards = GUIDE_CATALOG.map((entry) => {
    const path = pathOf("guides", entry.slug);
    const reg = ROUTE_BY_PATH[path];
    return {
      entry,
      path,
      title: reg ? labelFromTitle(reg.title) : entry.slug,
      excerpt: reg?.description,
      cat: categoryFor(entry.category),
    };
  });

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "ידע וכלים", to: "/learn" }, { label: "מדריכים" }]}
          eyebrow="ידע וכלים"
          title="מדריכי שילד"
          lead="מדריכים קצרים בעברית פשוטה על פנסיה, פרישה והכסף של המשפחה. כל מדריך עונה על שאלה אחת מהחיים, עם דוגמה להמחשה ורשימת מקורות."
          art={topic.art}
          tint={p1}
          actions={
            <>
              <a href="#all-guides" className="sd-btn">לכל המדריכים{arrow}</a>
              <Link to={TAX_BASE} className="sd-link">מיסוי החיסכון הפנסיוני{arrow}</Link>
            </>
          }
        />

        {story && (
          <SdBand tone={p2} id="moment">
            <SdStory story={story} art={topic.art2} />
          </SdBand>
        )}

        <SdBand tone="white" id="all-guides">
          <div className="sd-wrap">
            <PubHead title="כל המדריכים" lede="בחרו נושא כדי לצמצם את הרשימה, או עברו על כולם." />
            <div className="sd-chips mb-8" role="group" aria-label="סינון לפי נושא">
              <button type="button" className="sd-chip" aria-pressed={active === null} onClick={() => setActive(null)}>הכל</button>
              {GUIDE_CATEGORIES.map((c) => (
                <button key={c.key} type="button" className="sd-chip" aria-pressed={active === c.key} onClick={() => setActive(c.key)}>
                  {c.title}
                </button>
              ))}
            </div>
            <ul className="sd-pub-grid sd-pub-grid-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {cards.map((c) => (
                <li
                  key={c.entry.slug}
                  data-category={c.entry.category}
                  className={active !== null && active !== c.entry.category ? "hidden" : undefined}
                  hidden={active !== null && active !== c.entry.category}
                  style={active !== null && active !== c.entry.category ? undefined : { display: "contents" }}
                >
                  <PubArticleCard
                    to={c.path}
                    title={c.title}
                    kicker={c.cat.title}
                    excerpt={c.excerpt}
                    art={c.cat.art}
                    tone={c.cat.tone}
                    meta={<><span dir="ltr" className="tabular-nums">{c.entry.readMinutes}</span> דקות קריאה</>}
                  />
                </li>
              ))}
            </ul>
          </div>
        </SdBand>

        <SdBand tone={p3} id="tax">
          <div className="sd-wrap">
            <PubHead
              title="מיסוי החיסכון הפנסיוני"
              lede="סדרת פרקים נפרדת על המס בהפקדה, בצבירה ובמשיכה, עם לוח מספרים אחד שמתעדכן בכל ינואר."
            />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link to={TAX_BASE} className="sd-btn">לפרקי המיסוי{arrow}</Link>
              <Link to="/faq" className="sd-link">שאלות נפוצות{arrow}</Link>
              <Link to="/learn" className="sd-link">חזרה לידע וכלים{arrow}</Link>
            </div>
          </div>
        </SdBand>

        <div className="sd-rp-reg">
          <div className="sd-wrap"><p>{KNOWLEDGE_REG_LINE}</p></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
