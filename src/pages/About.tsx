import { Link } from "react-router-dom";
import { stories } from "@/data/stories";
import { SdBand, SdIcon, SdPic, SdProcess, SdStory, SdSubnav } from "@/components/sd/primitives";
import { art3Of, topicFor } from "@/components/sd/topics";
import { Arrow, PubCta, PubHero, PubPage } from "@/components/sd/pubParts";

// About: the agency is a team of agents. Kit design: hero, emotional moment, values, how we work,
// company comparison, commitments, closing invitation. No names, no single-agent wording.

const PATH = "/about";

const values = [
  { icon: "search", tone: "sage", title: "שקיפות", text: "מציגים לכם את התנאים, העמלות ודמי הניהול לפני שמחליטים, ומסבירים גם את הכתב הקטן." },
  { icon: "shield", tone: "sky", title: "מקצועיות", text: "צוות סוכנים שעוקב אחרי הרגולציה והשינויים בשוק, כדי שלא תצטרכו." },
  { icon: "handshake", tone: "butter", title: "אמינות", text: "האינטרס שלכם קודם. אם משהו לא מתאים לכם, נגיד את זה ישירות." },
  { icon: "phone", tone: "rose", title: "נגישות", text: "ביטוח ופנסיה לא חייבים להישמע מסובכים. מסבירים בשפה ברורה ועונים על שאלות." },
];

const steps = [
  { icon: "checklist", t: "ממפים את התיק", p: "אוספים יחד איתכם את כל הפוליסות, הקרנות והחסכונות לתמונה אחת, כדי שתראו מה יש." },
  { icon: "search", t: "משווים בין החברות", p: "בודקים כיסויים, תנאים ועלויות בחברות השונות בשוק, ומציגים את ההבדלים בצורה פשוטה." },
  { icon: "handshake", t: "מחליטים יחד ונשארים לצידכם", p: "ההחלטה תמיד שלכם. אחר כך אנחנו מטפלים בטפסים ובמעקב, ומעדכנים בכל שלב." },
];

const compare = [
  { k: "כיסוי", v: "מה בדיוק מכוסה, ומה מוחרג בכתב קטן שלא תמיד שמים לב אליו." },
  { k: "עלות", v: "גובה הפרמיה ודמי הניהול, ואיך הם משתנים עם השנים." },
  { k: "תנאים", v: "השתתפות עצמית, תקופות המתנה, והתנאים בחידוש הפוליסה." },
  { k: "שירות", v: "איך מטפלים בתביעה, ומי עונה לכם כשצריך." },
];

const commitments = [
  "עובדים מול כמה חברות ביטוח ובתי השקעות, ולא תלויים בחברה אחת.",
  "אפיון צרכים שלם: ביטוחים, פנסיה וחיסכון, לא רק מוצר אחד.",
  "מעקב שוטף: חידושים, שינויים במשפחה ועדכוני רגולציה.",
  "בדיקה של כפל ביטוחי, כיסויים חסרים ודמי ניהול שכדאי לבדוק.",
  "אזור אישי: הפוליסות, החיסכון והמסמכים שלכם במקום אחד.",
];

export default function About() {
  const topic = topicFor(PATH);
  const [p1, p2, p3] = topic.palette;
  const story = stories[PATH];
  const sections = [
    { id: "moment", label: "מה עומד מולכם" },
    { id: "values", label: "הערכים" },
    { id: "process", label: "איך עובדים" },
    { id: "compare", label: "השוואה בין חברות" },
    { id: "commitments", label: "מה אנחנו עושים" },
  ];

  return (
    <PubPage tint={p1}>
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "מי אנחנו" }]}
        eyebrow="מי אנחנו"
        title="הצוות שיושב איתכם על התיק"
        lead="סוכנות ביטוח, חיסכון ופנסיה הפועלת מאז 2025, עם צוות סוכנים, עצמאית ובצד שלכם. ממפים את התיק, משווים בין החברות ומלווים את הביצוע, בלי לחץ."
        art={topic.art}
        actions={
          <>
            <Link to="/contact" className="sd-btn">תיאום פגישה<Arrow /></Link>
            <Link to="/portfolio-review" className="sd-link">אפיון צרכים<Arrow /></Link>
          </>
        }
      />

      <SdSubnav sections={sections} />

      {story && (
        <SdBand tone={p1} id="moment">
          <SdStory story={story} art={topic.art2} />
        </SdBand>
      )}

      <SdBand tone="cream" id="values">
        <div className="sd-wrap sd-pub-split">
          <div>
            <span className="sd-eyebrow">הערכים שלנו</span>
            <h2 className="sd-h2 mt-4">ארבעה עקרונות שמכוונים כל שיחה</h2>
            <p className="sd-lead mt-5">לא סיסמאות על קיר. כך אנחנו מתנהלים מול כל תיק שמגיע אלינו.</p>
            <div className="sd-pub-art mt-8 hidden lg:block" aria-hidden="true" style={{ maxWidth: 380 }}>
              <SdPic name={art3Of(topic)} sizes="380px" />
            </div>
          </div>
          <ul className="sd-pub-values">
            {values.map((v) => (
              <li key={v.title} className="sd-pub-value sd-reveal">
                <span className={`sd-pub-disc t-${v.tone}`}><SdIcon name={v.icon} size={34} /></span>
                <div>
                  <h3 className="sd-h3">{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </SdBand>

      <SdBand tone={p2} id="process">
        <SdProcess art="01-hero" steps={steps} title="איך אנחנו עובדים" />
      </SdBand>

      <SdBand tone={p3} id="compare">
        <div className="sd-wrap sd-pub-split is-wide-copy">
          <div>
            <span className="sd-eyebrow">השוואה בין חברות</span>
            <h2 className="sd-h2 mt-4">אנחנו לא קשורים לחברה אחת, ולכן אפשר להשוות בין כמה אפשרויות</h2>
            <p className="sd-lead mt-5">כשמשווים, לא מסתכלים רק על המחיר. אלה הדברים שאנחנו בודקים בכל מוצר.</p>
            <div className="sd-table-wrap mt-8">
              <table className="sd-table">
                <thead>
                  <tr><th scope="col">מה בודקים</th><th scope="col">למה זה חשוב</th></tr>
                </thead>
                <tbody>
                  {compare.map((r) => (
                    <tr key={r.k}><th scope="row">{r.k}</th><td>{r.v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="sd-pub-art" aria-hidden="true">
            <SdPic name="04-investments-growth" sizes="(min-width:1024px) 440px, 90vw" />
          </div>
        </div>
      </SdBand>

      <SdBand tone="white" id="commitments">
        <div className="sd-wrap sd-pub-split">
          <div className="sd-pub-art" aria-hidden="true">
            <SdPic name="06-home-mortgage" sizes="(min-width:1024px) 480px, 90vw" />
          </div>
          <div>
            <span className="sd-eyebrow">מה אנחנו עושים</span>
            <h2 className="sd-h2 mt-4">ניהול פיננסי טוב מתחיל בהבנה של מה שיש לכם</h2>
            <ul className="sd-pub-list mt-8">
              {commitments.map((c) => <li key={c}><span>{c}</span></li>)}
            </ul>
          </div>
        </div>
      </SdBand>

      <PubCta
        title="רוצים להכיר את המצב שלכם?"
        text="שיחת היכרות בלי התחייבות מצידכם. מתחילים באפיון צרכים וממשיכים יחד, בקצב שלכם."
        art="12-childrens-savings"
        primary={{ label: "תיאום פגישה", to: "/contact" }}
        secondary={{ label: "אפיון צרכים", to: "/portfolio-review" }}
      />
    </PubPage>
  );
}
