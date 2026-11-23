import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { stories } from "@/data/stories";
import { SdBand, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PubArticleCard, PubClose, PubHead, PubHero } from "@/components/sd/pub";
import { KnowledgeBar } from "@/components/sd/knowledge";
import { ROUTE_BY_PATH, labelFromTitle } from "@/data/seo/routes";
import { TAX_CATALOG, categoryFor, pathOf } from "@/data/knowledge";
import { KNOWLEDGE_REG_LINE } from "@/data/knowledge/regLine";
import { RP_CONTACT } from "@/data/retirementPlanning";
import "@/components/sd/sd.css";
import "@/components/sd/pub.css";
import "@/components/retire/retire.css";

// /learn/pension-tax: landing page of the tax series. Chapter cards come from TAX_CATALOG (titles and
// descriptions from the registry); the numbers page is linked on its own.

const arrow = <BrandIcon name="arrow-left" size={18} />;
const NUMBERS = "numbers";

export default function PensionTaxHub() {
  useSdFont();
  const cat = categoryFor("pension-tax");
  const story = stories["/learn/pension-tax"];
  const numbersPath = pathOf("tax", NUMBERS);

  const chapters = TAX_CATALOG.filter((e) => e.slug !== NUMBERS).map((entry) => {
    const path = pathOf("tax", entry.slug);
    const reg = ROUTE_BY_PATH[path];
    return { entry, path, title: reg ? labelFromTitle(reg.title) : entry.slug, excerpt: reg?.description };
  });

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(cat.tone)}>
      <Header />
      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "מדריכים", to: "/learn/guides" }, { label: cat.title }]}
          eyebrow="מדריכי שילד"
          title={cat.title}
          lead={cat.lede}
          art={cat.art}
          tint={cat.tone}
          actions={
            <>
              <a href="#chapters" className="sd-btn">לפרקים{arrow}</a>
              <Link to={numbersPath} className="sd-link">לוח המספרים{arrow}</Link>
            </>
          }
        />

        <KnowledgeBar
          items={[{ id: "chapters", label: "הפרקים" }, { id: "numbers", label: "לוח המספרים" }]}
          home={{ to: "/learn/guides", label: "המדריכים" }}
        />

        {story && (
          <SdBand tone="sky" id="moment">
            <SdStory story={story} art="10-financial-planning" />
          </SdBand>
        )}

        <SdBand tone="white" id="chapters">
          <div className="sd-wrap">
            <PubHead title="פרקי המיסוי" lede="כל פרק עוסק בסוג חיסכון אחד, והאחרון שבהם במשיכה ובקיבוע זכויות." />
            <ul className="sd-pub-grid sd-pub-grid-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {chapters.map((c) => (
                <li key={c.entry.slug} style={{ display: "contents" }}>
                  <PubArticleCard
                    to={c.path}
                    title={c.title}
                    kicker={cat.title}
                    excerpt={c.excerpt}
                    art={cat.art}
                    tone={cat.tone}
                    meta={<><span dir="ltr" className="tabular-nums">{c.entry.readMinutes}</span> דקות קריאה</>}
                  />
                </li>
              ))}
            </ul>
          </div>
        </SdBand>

        <SdBand tone="cream" id="numbers">
          <div className="sd-wrap">
            <PubHead
              title="לוח המספרים"
              lede="כל הסכומים והשיעורים במקום אחד, עם שנת המס שאליה הם מתייחסים. הלוח מתעדכן בכל ינואר."
            />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link to={numbersPath} className="sd-btn">ללוח המספרים{arrow}</Link>
              <Link to="/learn/guides" className="sd-link">לכל המדריכים{arrow}</Link>
              <Link to="/faq" className="sd-link">שאלות נפוצות{arrow}</Link>
            </div>
          </div>
        </SdBand>

        <PubClose
          title="רוצים לבדוק מה מתאים למצב שלכם?"
          text="בשיחה קצרה נעבור על התמונה שלכם ונסביר את האפשרויות, בקצב שלכם."
          art="33-welcome-table"
          primary={{ text: "שיחת היכרות ראשונה, בלי התחייבות מצידכם", to: RP_CONTACT }}
          secondary={null}
        />
        <div className="sd-rp-reg">
          <div className="sd-wrap"><p>{KNOWLEDGE_REG_LINE}</p></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
