import { Link } from "react-router-dom";
import { PortfolioReviewForm } from "@/components/PortfolioReviewForm";
import { stories } from "@/data/stories";
import { SdBand, SdContact, SdIcon, SdPic, SdStory, SdSubnav } from "@/components/sd/primitives";
import { topicFor } from "@/components/sd/topics";
import { Arrow, PubHero, PubPage } from "@/components/sd/pubParts";

/**
 * אפיון צרכים, kit design: hero with the one action, the emotional moment, what the review includes,
 * what to prepare, three questions and the closing navy block that carries the lead form.
 */

const PATH = "/portfolio-review";

const INCLUDED = [
  { title: "מיפוי המוצרים הקיימים", body: "סוקרים את כל הביטוחים והחסכונות שברשותכם, ממקורות רשמיים: המסלקה הפנסיונית והר הביטוח.", icon: "checklist" },
  { title: "אפיון צרכים ואפיון התא המשפחתי", body: "מתארים את המצב הנוכחי של התא המשפחתי כולו, מול הגיל, ההכנסה והמטרות, ומזהים פערים, כפילויות ודמי ניהול שכדאי לבדוק.", icon: "search" },
  { title: "מסמך החלטות והמשך טיפול", body: "משקפים את האופציות בתמונת המוצרים הפיננסיים, כולל גידור הסיכונים בביטוח, ומייצרים תוכנית המשך שאפשר לעקוב אחריה באזור האישי.", icon: "handshake" },
];

const PREPARE = [
  { title: "מסמכים קיימים", body: "פוליסות, דוחות שנתיים ותלושי שכר אחרונים. אם אין, נשלוף בעצמנו עם ייפוי כוח." },
  { title: "שאלות שחשוב לכם לשאול", body: "נושאים שמטרידים אתכם או החלטות שמתלבטים בהן." },
  { title: "מטרות להמשך", body: "מה חשוב לכם להשיג: הגנה על המשפחה, חיסכון, פרישה." },
];

const FAQ = [
  { q: "איך האפיון מתנהל?", a: "השלב הראשון הוא שיחת היכרות שאינה מחייבת. לפני כל החלטה נציג לכם בבהירות את תנאי ההתקשרות." },
  { q: "כמה זמן זה לוקח?", a: "שליפת הנתונים אורכת כשבוע. הפגישה עצמה כשעה, במשרד, בזום או בטלפון. תוך ימים ספורים מקבלים את מסמך ההחלטות." },
  { q: "מה קורה אחרי האפיון?", a: "אתם מחליטים בקצב שלכם. אם בוחרים לפעול, אנחנו מטפלים בטפסים, בניודים ובחברות, ומעדכנים בכל שלב." },
];

const PortfolioReview = () => {
  const topic = topicFor(PATH);
  const [p1, p2] = topic.palette;
  const story = stories[PATH];
  const sections = [
    ...(story ? [{ id: "moment", label: "מה עומד מולכם" }] : []),
    { id: "included", label: "מה כולל האפיון" },
    { id: "prepare", label: "מה מכינים" },
    { id: "questions", label: "שאלות" },
    { id: "review-form", label: "להתחיל" },
  ];

  return (
    <PubPage tint={p1}>
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "אפיון צרכים" }]}
        eyebrow="אפיון צרכים"
        title="תמונה מסודרת של הביטוחים והחסכונות שלכם"
        lead="מה יש, מה חסר, מה כפול ומה עולה יותר מדי. הצוות עושה את האפיון ומסביר אותו בשפה פשוטה. שיחת היכרות בלי התחייבות מצידכם."
        art={topic.art}
        actions={
          <>
            <a href="#review-form" className="sd-btn">להתחיל באפיון<Arrow /></a>
            <Link to="/contact" className="sd-link">תיאום פגישה<Arrow /></Link>
          </>
        }
      />

      <SdSubnav sections={sections} />

      {story && (
        <SdBand tone={p1} id="moment">
          <SdStory story={story} art={topic.art2} />
        </SdBand>
      )}

      <SdBand tone="cream" id="included">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <span className="sd-eyebrow">האפיון</span>
            <h2 className="sd-h2">מה כולל אפיון הצרכים?</h2>
          </div>
          <ol className="sd-pub-steps3">
            {INCLUDED.map((item, i) => (
              <li key={item.title} className="sd-point sd-reveal">
                <em>{String(i + 1).padStart(2, "0")}</em>
                <SdIcon name={item.icon} size={52} />
                <h3 className="sd-h3 mt-4">{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </SdBand>

      <SdBand tone={p2} id="prepare">
        <div className="sd-wrap sd-pub-split is-wide-copy">
          <div>
            <span className="sd-eyebrow">לקראת הפגישה</span>
            <h2 className="sd-h2 mt-4">מה מכינים לפגישה?</h2>
            <div className="sd-pub-prep mt-8">
              <ul>
                {PREPARE.map((p) => (
                  <li key={p.title}>
                    <div>
                      <b>{p.title}</b>
                      <span>{p.body}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="sd-small mt-5">אין לכם את כל זה? לא נורא. מתחילים ממה שיש, ואת השאר שולפים יחד.</p>
          </div>
          <div className="sd-pub-art" aria-hidden="true">
            <SdPic name="06-home-mortgage" sizes="(min-width:1024px) 440px, 90vw" />
          </div>
        </div>
      </SdBand>

      <SdBand tone="white" id="questions">
        <div className="sd-wrap-narrow">
          <div className="sd-band-head"><h2 className="sd-h2">שלוש שאלות שכולם שואלים</h2></div>
          <div className="sd-faq">
            {FAQ.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>{f.q}</summary>
                <div>{f.a}</div>
              </details>
            ))}
          </div>
          <div className="mt-6">
            <Link to="/faq" className="sd-link">לכל השאלות הנפוצות<Arrow /></Link>
          </div>
        </div>
      </SdBand>

      <SdContact
        id="review-form"
        title="נתחיל?"
        text="השאירו שם וטלפון. נחזור אליכם ביום העסקים הבא לתיאום, ומשם ממשיכים יחד. תמיד תדעו מה השלב הבא."
        art="01-hero"
      >
        <PortfolioReviewForm idPrefix="review" source="עמוד אפיון צרכים" />
      </SdContact>
    </PubPage>
  );
};

export default PortfolioReview;
