import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { faqCategories } from "@/data/faq";
import { stories } from "@/data/stories";
import { SdBand, SdPic, SdStory, SdSubnav } from "@/components/sd/primitives";
import { topicFor, type ArtName } from "@/components/sd/topics";
import { Arrow, PubCta, PubHero, PubPage } from "@/components/sd/pubParts";

// FAQ (kit design). Every category is rendered in full as native <details>, so all questions and
// answers are in the DOM (the FAQPage JSON-LD in structuredData.ts is built from the same data).

const PATH = "/faq";
const CAT_ART: Record<string, ArtName> = {
  insurance: "03-health-insurance",
  pension: "05-retirement",
  savings: "04-investments-growth",
  general: "02-family-protection",
};
const CAT_TONES = ["cream", "sage", "white", "butter"] as const;

export default function FAQ() {
  const topic = topicFor(PATH);
  const [p1] = topic.palette;
  const story = stories[PATH];
  const sections = [
    ...(story ? [{ id: "moment", label: "מה עומד מולכם" }] : []),
    ...faqCategories.map((c) => ({ id: `cat-${c.id}`, label: c.title })),
  ];

  return (
    <PubPage tint={p1}>
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "שאלות נפוצות" }]}
        eyebrow="שאלות נפוצות"
        title="שאלות שכולם שואלים, ותשובות שפחות שומעים"
        lead="ביטוח, פנסיה וחיסכון בשפה פשוטה. מצאו את השאלה שלכם, ואם היא לא כאן, אנחנו בקשר."
        art={topic.art}
        actions={
          <>
            <button type="button" onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))} className="sd-btn">
              <BrandIcon name="message" size={20} />
              שאלו את היועץ הדיגיטלי
            </button>
            <Link to="/contact" className="sd-link">דברו עם הצוות<Arrow /></Link>
          </>
        }
      />

      <SdSubnav sections={sections} />

      {story && (
        <SdBand tone={p1} id="moment">
          <SdStory story={story} art={topic.art2} />
        </SdBand>
      )}

      {faqCategories.map((cat, ci) => (
        <SdBand key={cat.id} tone={CAT_TONES[ci % CAT_TONES.length]} id={`cat-${cat.id}`}>
          <div className="sd-wrap sd-pub-faqgrid">
            <div className="sd-pub-faqhead">
              <span className="sd-eyebrow">{String(ci + 1).padStart(2, "0")}</span>
              <h2 className="sd-h2 mt-3">{cat.title}</h2>
              <div className="sd-pub-minart" aria-hidden="true">
                <SdPic name={CAT_ART[cat.id] ?? "01-hero"} sizes="260px" />
              </div>
            </div>
            <div className="sd-faq">
              {cat.questions.map((item, i) => (
                <details key={item.q} open={ci === 0 && i === 0}>
                  <summary>{item.q}</summary>
                  <div>{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </SdBand>
      ))}

      <PubCta
        title="לא מצאתם תשובה?"
        text="שאלה על התיק שלכם היא לא שאלה נפוצה. בשביל זה יש צוות שמקשיב, בודק וחוזר אליכם."
        art="12-childrens-savings"
        primary={{ label: "תיאום פגישה", to: "/contact" }}
        secondary={{ label: "בדיקת תיק 360", to: "/portfolio-review" }}
      />
    </PubPage>
  );
}
