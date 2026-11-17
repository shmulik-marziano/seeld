import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { GENERAL_INSURANCE, LIFE_HEALTH, type ProductLink } from "@/data/productDirectory";
import { stories } from "@/data/stories";
import { SdBand, SdPic, SdStory, SdSubnav } from "@/components/sd/primitives";
import { PASTELS, TOPICS, topicFor, type ArtName } from "@/components/sd/topics";
import { Arrow, PubCta, PubHero, PubPage } from "@/components/sd/pubParts";

// Insurance hub (kit design): hero, emotional moment, then one illustrated card per insurance line
// (all 16 keep their link), grouped as life and health, and general insurance.

const PATH = "/insurances";

/**
 * One illustration per card, spread over the topic's own pictures so the same plate does not repeat
 * six times (and never twice in a row): the least used candidate wins.
 */
const CARD_ART: Record<string, ArtName> = (() => {
  const used = new Map<ArtName, number>();
  const out: Record<string, ArtName> = {};
  let prev: ArtName | null = null;
  for (const item of [...LIFE_HEALTH, ...GENERAL_INSURANCE]) {
    const t = TOPICS[item.href];
    const cands = t ? [t.art, t.art2, t.art3, t.art4].filter((a): a is ArtName => !!a) : ["01-hero" as ArtName];
    let best = cands[0];
    let bestScore = Infinity;
    cands.forEach((a, i) => {
      const score = (used.get(a) ?? 0) * 10 + (a === prev ? 25 : 0) + i;
      if (score < bestScore) { best = a; bestScore = score; }
    });
    used.set(best, (used.get(best) ?? 0) + 1);
    out[item.href] = best;
    prev = best;
  }
  return out;
})();

function Cards({ items }: { items: ProductLink[] }) {
  return (
    <div className="sd-pub-cards sd-pub-cards-compact">
      {items.map((item) => {
        const t = TOPICS[item.href];
        return (
          <Link
            key={item.href}
            to={item.href}
            className="sd-pub-card"
            style={{ ["--card-tint" as string]: PASTELS[t?.palette[0] ?? "sage"].bg }}
          >
            <div className="sd-pub-card-art" aria-hidden="true">
              <SdPic name={CARD_ART[item.href] ?? "01-hero"} sizes="(min-width:480px) 190px, 96px" />
            </div>
            <div className="sd-pub-card-body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="sd-pub-card-go">לעמוד התחום<BrandIcon name="arrow-left" size={16} /></span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function Insurances() {
  const topic = topicFor(PATH);
  const [p1, p2] = topic.palette;
  const story = stories[PATH];
  const sections = [
    ...(story ? [{ id: "moment", label: "מה עומד מולכם" }] : []),
    { id: "life", label: "חיים ובריאות" },
    { id: "general", label: "ביטוח כללי" },
  ];

  return (
    <PubPage tint={p1}>
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "כל הביטוחים" }]}
        eyebrow="כל תחומי הביטוח"
        title="כל הביטוחים במקום אחד"
        lead="שישה עשר תחומי ביטוח, מול חברות הביטוח בישראל. בוחרים תחום, ואנחנו מסדרים את התמונה המלאה: מה יש, מה חסר ומה כפול."
        art={topic.art}
        actions={
          <>
            <a href="#insurance-index" className="sd-btn">לרשימת התחומים<Arrow /></a>
            <Link to="/portfolio-review" className="sd-link">בדיקת תיק 360<Arrow /></Link>
          </>
        }
      />

      <SdSubnav sections={sections} />

      {story && (
        <SdBand tone={p1} id="moment">
          <SdStory story={story} art={topic.art2} />
        </SdBand>
      )}

      <div id="insurance-index" className="scroll-mt-28">
        <SdBand tone="cream" id="life">
          <div className="sd-wrap">
            <div className="sd-pub-hubhead">
              <h2 className="sd-h2">ביטוחי חיים ובריאות</h2>
              <p>ההגנה על המשפחה, על ההכנסה ועל הבית.</p>
            </div>
            <Cards items={LIFE_HEALTH} />
          </div>
        </SdBand>

        <SdBand tone={p2} id="general">
          <div className="sd-wrap">
            <div className="sd-pub-hubhead">
              <h2 className="sd-h2">ביטוח כללי</h2>
              <p>רכב, דירה, עסק, נסיעות ושאר הכיסויים.</p>
            </div>
            <Cards items={GENERAL_INSURANCE} />
          </div>
        </SdBand>
      </div>

      <PubCta
        title="לא חייבים לבחור לבד"
        text="נבדוק מה יש לכם, מה כפול ומה חסר, ונחזור אליכם עם תמונה מסודרת. שיחה ראשונה ללא עלות וללא התחייבות."
        art="11-claims-service"
        primary={{ label: "בדיקת תיק 360", to: "/portfolio-review" }}
        secondary={{ label: "תיאום פגישה", to: "/contact" }}
      />
    </PubPage>
  );
}
