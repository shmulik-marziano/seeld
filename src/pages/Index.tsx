import { CONTACTS } from "@/lib/contacts";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CompanyLogos from "@/components/CompanyLogos";
import { TIERS } from "@/data/productDirectory";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FormSuccess } from "@/components/brand/FormSuccess";
import { PortfolioReviewForm } from "@/components/PortfolioReviewForm";
import { SdBand, SdContact, SdIcon, SdPic, SdProcess, SdSubnav, DEFAULT_STEPS } from "@/components/sd/primitives";
import { PASTELS } from "@/components/sd/topics";
import { toast } from "sonner";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import "@/components/sd/sd.css";
import "@/components/sd/home.css";
import "@/components/sd/home-entry.css";

// ── Data ──

// "מה אתם מחפשים?": four doors, each with its kit illustration and the product pages behind it.
const topics = [
  {
    title: "ביטוח",
    text: "בריאות, רכב, דירה ונסיעות. כיסוי שמתאים למה שיש לכם, בלי כפילויות.",
    art: "03-health-insurance",
    tone: PASTELS.sky.bg,
    href: "/insurances",
    links: [
      { t: "ביטוח בריאות", h: "/insurance/health" },
      { t: "ביטוח רכב", h: "/insurance/vehicle" },
      { t: "ביטוח דירה", h: "/insurance/home" },
      { t: "ביטוח נסיעות", h: "/insurance/travel" },
    ],
  },
  {
    title: "חיסכון ופנסיה",
    text: "פנסיה, גמל והשתלמות. מבינים כמה חסכתם, כמה משלמים ומה אפשר לשפר.",
    art: "05-retirement",
    tone: PASTELS.butter.bg,
    href: "/savings",
    links: [
      { t: "קרנות פנסיה", h: "/savings/pension-funds" },
      { t: "קרנות השתלמות", h: "/savings/training-funds" },
      { t: "קופות גמל", h: "/savings/gemel-funds" },
      { t: "תכנון פיננסי", h: "/savings/financial-planning" },
    ],
  },
  {
    title: "משפחה",
    text: "הגנה על ההכנסה ועל הבית, וחיסכון לעתיד של הילדים.",
    art: "12-childrens-savings",
    tone: PASTELS.rose.bg,
    href: "/insurance/life",
    links: [
      { t: "ביטוח חיים", h: "/insurance/life" },
      { t: "ביטוח משכנתא", h: "/insurance/mortgage" },
      { t: "חיסכון לכל ילד", h: "/savings/child-savings" },
      { t: "אובדן כושר עבודה", h: "/insurance/disability" },
    ],
  },
  {
    title: "עסק",
    text: "רכוש, אחריות מקצועית, שותפים ועובדים. שקט לבעלי עסקים.",
    art: "08-business-insurance",
    tone: PASTELS.sage.bg,
    href: "/insurance/business",
    links: [
      { t: "ביטוח עסקי", h: "/insurance/business" },
      { t: "ביטוח שותפים", h: "/insurance/partners" },
      { t: "קופות מעסיקים", h: "/savings/employer-funds" },
      { t: "עובדים זרים", h: "/insurance/foreign-workers" },
    ],
  },
];

const TIER_ACCENT: Record<string, string> = { finance: "#C9DBC4", life: "#EBC8C0", general: "#BFD3E5" };

const knowledgeItems = [
  { title: "מחשבונים", description: "משכנתא, פנסיה, חיסכון, מס והשוואת מסלולים. חופשי, ללא רישום.", href: "/calculators" },
  { title: "איתור קרנות", description: "חיפוש והשוואה של קרנות פנסיה, גמל והשתלמות מכל בתי ההשקעות.", href: "/fund-finder" },
  { title: "טבלאות תשואות", description: "נתוני תשואה ודמי ניהול רשמיים, מעודכנים מדי חודש.", href: "/return-tables" },
  { title: "מסלולי השקעה", description: "השוואת חשיפות, רמות סיכון ותשואות בין המסלולים בשוק.", href: "/investment-tracks" },
  { title: "מידע ולמידה", description: "מדריכים, מאמרים ותשובות לשאלות שעולות בכל תיק.", href: "/learn" },
  { title: "אזור אישי", description: "הפוליסות, החיסכון, המסמכים וסיכומי הפגישות שלכם במקום אחד.", href: "/personal-area" },
];

const steps: typeof DEFAULT_STEPS = [
  { icon: "checklist", t: "ממפים את התיק", p: "מרכזים את כל המידע הקיים ממקורות רשמיים, ושומעים מה חשוב לכם." },
  { icon: "search", t: "משווים ומחליטים יחד", p: "מציגים את ההבדלים בין החברות בצורה ברורה. שיחת ההיכרות בלי התחייבות מצידכם, וההחלטה נשארת שלכם." },
  { icon: "handshake", t: "מבצעים ומלווים", p: "מקדמים את מה שסוכם: טפסים, ניודים ומול החברות. ובהמשך, מעקב אחת לשנה ובכל שינוי." },
];

const pillars = [
  { icon: "shield", t: "צוות מקצועי", p: "ביטוח, פנסיה ופיננסים במקום אחד, עם צוות שמכיר את כולם." },
  { icon: "handshake", t: "עצמאות", p: "לא כבולים לחברה אחת. מציעים מה שמתאים לכם." },
  { icon: "search", t: "השוואה בין חברות", p: "הכיסויים והמחירים של כמה חברות מוצגים זה לצד זה." },
];

const faqItems = [
  {
    question: "מה זה אפיון צרכים?",
    answer: "מיפוי של כל מה שיש לכם: ביטוחים, פנסיה, חיסכון, ושל הצרכים של התא המשפחתי. מוצאים חסרים, כפלים ודמי ניהול גבוהים, ומסכמים הכול בדוח מסודר. בלי התחייבות מצידכם.",
  },
  {
    question: "איך בוחרים ביטוח בריאות שמתאים לי?",
    answer: "בודקים מה יש לכם בקופת החולים, מה חסר, ומשווים בין התוכניות בשוק. ההמלצה מותאמת לגיל, למצב הבריאותי ולצרכים.",
  },
  {
    question: "מה ההבדל בין קרן פנסיה לביטוח מנהלים?",
    answer: "בקרן פנסיה כולם חולקים את הסיכון, וזה מוזיל עלויות. בביטוח מנהלים יש פוליסה אישית עם גמישות רבה יותר. מה עדיף? תלוי בגיל, בבריאות ובמצב התעסוקתי.",
  },
  {
    question: "כמה עולה פגישת ייעוץ פנסיוני?",
    answer: "בפגישה הראשונה תקבלו תמונה של מצב הפנסיה שלכם: הפקדות, כיסויים ודמי ניהול, ותבינו בדיוק איפה אתם עומדים.",
  },
  {
    question: "אתם עובדים עם חברת ביטוח ספציפית?",
    answer: "לא. אנחנו עובדים מול כמה חברות ביטוח, ולא מחויבים לאחת מהן. כך אפשר להשוות ולבחור את מה שמתאים לכם.",
  },
  {
    question: "כמה זמן לוקח לעבור חברה?",
    answer: "בין שבוע לחודש, תלוי בסוג המוצר. אנחנו מטפלים בהכול: טפסים, ניוד ובדיקה שלא נפגעים כיסויים קיימים.",
  },
  {
    question: "מה קורה אם יש בעיה עם חברת הביטוח?",
    answer: "הצוות שלנו מטפל. זה בדיוק בשביל זה יש סוכנות, כדי שלא תצטרכו להתמודד עם החברה לבד.",
  },
];

// The self-service report: three plain steps. Honest about its state: the process opens after the design phase.
const reportSteps = [
  { n: "1", t: "מעלים את הקבצים", p: "קובץ מסלקה וקובץ הר הביטוח, כפי שהורדתם מהאתרים הרשמיים." },
  { n: "2", t: "אנחנו מארגנים את המידע", p: "הנתונים מסודרים בדוח אחד בעיצוב שילד, לקריאה ולשמירה." },
  { n: "3", t: "ממשיכים רק אם תרצו", p: "הצטרפות לסוכנות, חתימה על מינוי סוכן והזמנת מידע ממבטחים דרך הסוכנות." },
];

// Many easy ways in, for people who arrive from a search or from an AI answer. Each is one small step.
const startWays = [
  { icon: "email", t: "שאלה קצרה", p: "שם וטלפון, ונחזור אליכם.", to: "#contact-form", tone: "sky", soon: false },
  { icon: "document", t: "הפקת דוח אישי", p: "מסלקה והר הביטוח בדוח מידע אחד.", to: "/report", tone: "lavender", soon: true },
  { icon: "shield", t: "בדיקת התיק הביטוחי", p: "מה יש לכם היום ומה כדאי לבדוק.", to: "/portfolio-review", tone: "sage", soon: false },
  { icon: "compass", t: "תכנון פיננסי", p: "פנסיה, חיסכון ומטרות, בתמונה אחת.", to: "/savings/financial-planning", tone: "butter", soon: false },
  { icon: "handshake", t: "מינוי סוכן", p: "הצטרפות לסוכנות וחתימה על טופס מינוי.", to: "/report#join", tone: "rose", soon: true },
  { icon: "search", t: "הזמנת מידע ממבטחים", p: "בקשה למידע על המוצרים שלכם דרך הסוכנות.", to: "/report#order", tone: "sky", soon: true },
];

const sections = [
  { id: "report", label: "דוח אישי" },
  { id: "topics", label: "מה אתם מחפשים" },
  { id: "products", label: "כל המוצרים" },
  { id: "process", label: "איך עובדים איתנו" },
  { id: "start", label: "דרכים להתחיל" },
  { id: "about", label: "מי אנחנו" },
  { id: "portfolio-review", label: "אפיון צרכים" },
  { id: "faq", label: "שאלות נפוצות" },
  { id: "contact-form", label: "יצירת קשר" },
];

// ── Contact form bits ──

const FieldLabel = ({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold mb-1.5" style={{ color: "#203957" }}>
    {children}
    {required && <span aria-hidden="true" style={{ color: "#BD582D" }}> *</span>}
  </label>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? <p id={id} className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{children}</p> : null;

const PHONE_RE = /^0\d{1,2}-?\d{7}$/;

const Index = () => {
  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactSubmitting) return;
    const errs: typeof contactErrors = {};
    if (!contactForm.name.trim()) errs.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(contactForm.phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (contactForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) errs.email = "כתובת האימייל אינה תקינה.";
    setContactErrors(errs);
    if (Object.keys(errs).length) return;
    setContactSubmitting(true);
    try {
      const supabase = await loadSiteSupabase();
      const { error } = await supabase.from("contact_submissions").insert([{
        name: contactForm.name.trim(),
        email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
        subject: "תיאום פגישה",
        message: `טלפון: ${contactForm.phone}\n\n${contactForm.message}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: contactForm.name.trim(),
              phone: contactForm.phone.trim(),
              email: contactForm.email.trim() || `${contactForm.phone.trim()}@lead.seeld.co.il`,
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      setContactSent(true);
      setContactForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error(`השליחה לא עברה. נסו שוב, או חייגו ${CONTACTS.general.phone}.`);
    } finally {
      setContactSubmitting(false);
    }
  };

  const arrow = <BrandIcon name="arrow-left" size={18} />;

  return (
    <div className="sd min-h-screen" dir="rtl">
      <Header />

      <main>
        <HeroSection />

        <SdSubnav sections={sections} />

        {/* 0. THE SELF-SERVICE REPORT */}
        <SdBand tone="lavender" id="report">
          <div className="sd-wrap sd-home-report">
            <div>
              <h2 className="sd-h2">דוח אישי מהמסלקה ומהר הביטוח</h2>
              <p className="sd-lead mt-4">
                מעלים את הקבצים שהורדתם, ואנחנו מארגנים את המידע בדוח אחד מסודר בעיצוב שילד. הדוח הוא דוח מידע, לא ייעוץ.
              </p>
              <ol className="sd-home-rsteps">
                {reportSteps.map((x) => (
                  <li key={x.n} className="sd-reveal">
                    <span className="sd-home-rnum" aria-hidden="true">{x.n}</span>
                    <div><h3>{x.t}</h3><p>{x.p}</p></div>
                  </li>
                ))}
              </ol>
              <div className="sd-home-ctas">
                <Link to="/report" className="sd-btn">איך זה עובד{arrow}</Link>
                <span className="sd-home-soon-note"><i className="sd-home-soon">בקרוב</i> התהליך בהכנה. אפשר להשאיר פרטים ונעדכן כשיפתח.</span>
              </div>
            </div>
            <div className="sd-home-report-art sd-reveal hidden md:block" aria-hidden="true">
              <SdPic name="10-financial-planning" sizes="(min-width:1024px) 440px, 80vw" />
            </div>
          </div>
        </SdBand>

        {/* 1. WHAT ARE YOU LOOKING FOR */}
        <SdBand tone="sage" id="topics">
          <div className="sd-wrap">
            <div className="sd-band-head">
              <h2 className="sd-h2">מה אתם מחפשים?</h2>
              <p className="sd-lead">קודם הכסף והנכסים, אחר כך ההגנה עליהם. בחרו את התחום, ונמשיך משם.</p>
            </div>
            <div className="sd-home-topics">
              {topics.map((tp) => (
                <article key={tp.title} className="sd-home-topic sd-reveal">
                  <div className="sd-home-topic-art" style={{ ["--tone" as string]: tp.tone }} aria-hidden="true">
                    <SdPic name={tp.art} sizes="(min-width:560px) 200px, 80vw" />
                  </div>
                  <div className="sd-home-topic-body">
                    <h3><Link to={tp.href}>{tp.title}</Link></h3>
                    <p>{tp.text}</p>
                    <div className="sd-home-chips">
                      {tp.links.map((l) => <Link key={l.h} to={l.h}>{l.t}</Link>)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </SdBand>

        {/* 2. THE FULL DIRECTORY + TOOLS */}
        <SdBand tone="sky" id="products">
          <div className="sd-wrap">
            <div className="sd-band-head">
              <h2 className="sd-h2">כל המוצרים במקום אחד</h2>
              <p className="sd-lead">פיננסים, ביטוחי חיים ובריאות וביטוח כללי. לכל מוצר יש עמוד שמסביר אותו בפשטות.</p>
            </div>
            <div className="sd-home-tiers">
              {TIERS.map((tier) => (
                <section
                  key={tier.key}
                  id={`home-${tier.key}`}
                  aria-labelledby={`home-${tier.key}-title`}
                  className="sd-home-tier sd-reveal scroll-mt-28"
                  style={{ ["--accent" as string]: TIER_ACCENT[tier.key] }}
                >
                  <h3 id={`home-${tier.key}-title`}>{tier.title}</h3>
                  <p>{tier.lede}</p>
                  <ul>
                    {tier.items.slice(0, tier.homeCount).map((item) => (
                      <li key={item.href}>
                        <Link to={item.href}>
                          <span>{item.title}</span>
                          <BrandIcon name="arrow-left" size={18} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link to={tier.href} className="sd-link">{tier.linkLabel}{arrow}</Link>
                </section>
              ))}
            </div>

            <div className="sd-home-tools-head">
              <h3>ידע וכלים</h3>
              <p>הכלים שהצוות שלנו עובד איתם, פתוחים גם לכם.</p>
            </div>
            <div className="sd-home-tools">
              {knowledgeItems.map((item) => (
                <Link key={item.href} to={item.href} className="sd-home-tool">
                  <b>{item.title}<BrandIcon name="arrow-left" size={16} /></b>
                  <span>{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </SdBand>

        {/* 3. HOW WE WORK */}
        <SdBand tone="butter" id="process">
          <SdProcess art="11-claims-service" steps={steps} title="איך עובדים איתנו" />
        </SdBand>

        {/* 3b. MANY WAYS IN */}
        <SdBand tone="sage" id="start">
          <div className="sd-wrap">
            <div className="sd-band-head">
              <h2 className="sd-h2">אפשר להתחיל מכל מקום</h2>
              <p className="sd-lead">בוחרים צעד אחד קטן. אף אחד מהם לא מחייב, וכולם מובילים לאותו צוות.</p>
            </div>
            <ul className="sd-home-ways">
              {startWays.map((w) => {
                const inner = (
                  <>
                    <span className="sd-home-way-ic" aria-hidden="true"><SdIcon name={w.icon} size={44} /></span>
                    <b>{w.t}{w.soon && <i className="sd-home-soon">בקרוב</i>}</b>
                    <small>{w.p}</small>
                    <span className="sd-home-way-go" aria-hidden="true">{arrow}</span>
                  </>
                );
                return (
                  <li key={w.t} className={`sd-home-way is-${w.tone}`}>
                    {w.to.startsWith("#") ? <a href={w.to}>{inner}</a> : <Link to={w.to}>{inner}</Link>}
                  </li>
                );
              })}
            </ul>
            <p className="sd-home-client-line">
              כבר לקוחות שלנו? <Link to="/personal-area" className="sd-link">כניסה לאזור האישי{arrow}</Link>
            </p>
          </div>
        </SdBand>

        {/* 4. WHO WE ARE */}
        <SdBand tone="rose" id="about">
          <div className="sd-wrap sd-home-about">
            <div>
              <h2 className="sd-h2">מי אנחנו</h2>
              <p className="sd-lead mt-5">שילד היא סוכנות ביטוח ופיננסים עצמאית. הלקוח מעל כל שיקול אחר.</p>
              <p className="sd-text">
                הצוות שלנו כולל סוכני ביטוח, יועצי פנסיה ואנשי פיננסים. אנחנו לא קשורים לחברה אחת, ולכן ההמלצה נבנית סביב מה שמתאים לכם.
              </p>
              <p className="sd-text">
                אותו צוות מכיר את התיק, את המשפחה ואת השינויים לאורך השנים. לא מוקד, לא נציג מתחלף.
              </p>
              <div className="sd-home-ctas">
                <Link to="/contact" className="sd-btn">תיאום פגישה{arrow}</Link>
                <Link to="/about" className="sd-link">הכירו את הצוות{arrow}</Link>
              </div>
            </div>
            <ul className="sd-home-pillars">
              {pillars.map((p) => (
                <li key={p.t} className="sd-home-pillar sd-reveal">
                  <SdIcon name={p.icon} size={56} />
                  <div><h3 className="sd-h3">{p.t}</h3><p>{p.p}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </SdBand>

        {/* 5. PORTFOLIO REVIEW 360 */}
        <SdBand tone="lavender" id="portfolio-review">
          <div className="sd-wrap sd-home-360">
            <div>
              <h2 className="sd-h2">אפיון צרכים</h2>
              <p className="sd-lead">
                השאירו שם וטלפון. נבחן את הביטוחים, הפנסיה והחיסכון הקיימים, ונחזור אליכם עם אפיון צרכים של התא המשפחתי ושיקוף האפשרויות בתמונת המוצרים הפיננסיים. שיחת היכרות בלי התחייבות מצידכם.
              </p>
              <div className="sd-home-360-form">
                <PortfolioReviewForm source="דף הבית" />
              </div>
            </div>
            <div className="sd-story-art sd-reveal hidden md:block" aria-hidden="true">
              <SdPic name="10-financial-planning" sizes="(min-width:1024px) 460px, 80vw" />
            </div>
          </div>
        </SdBand>

        {/* 6. FAQ */}
        <SdBand tone="cream" id="faq">
          <div className="sd-wrap-narrow">
            <div className="sd-band-head">
              <h2 className="sd-h2">שאלות שעולות בכל תיק</h2>
              <p className="sd-lead">תשובות קצרות לשאלות שכולם שואלים.</p>
            </div>
            <div className="sd-faq">
              {faqItems.slice(0, 5).map((f, i) => (
                <details key={f.question} open={i === 0}>
                  <summary>{f.question}</summary>
                  <div>{f.answer}</div>
                </details>
              ))}
            </div>
            <div className="sd-home-more">
              <Link to="/faq" className="sd-link">לכל השאלות הנפוצות{arrow}</Link>
            </div>
          </div>
        </SdBand>

        <section style={{ borderTop: "1px solid var(--line)" }}>
          <CompanyLogos variant="grid" />
        </section>

        {/* 7. CLOSING: meeting form on navy */}
        <SdContact id="contact-form" title="תמונה ברורה מתחילה בשיחה אחת" text="אפיון צרכים בשיחת היכרות, בלי התחייבות מצידכם. משאירים פרטים, ואחד מהצוות חוזר לתיאום פגישה במשרד, בזום או בטלפון." art="06-home-mortgage">
          <div className="sd-home-formhead">
            <h3>תיאום פגישה</h3>
            <p>רעננה · ירושלים</p>
          </div>
          {contactSent ? (
            <FormSuccess next="נחזור אליכם ביום העסקים הבא לתיאום הפגישה." onReset={() => setContactSent(false)} />
          ) : (
            <form className="space-y-4" onSubmit={handleContactSubmit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="contact-name" required>שם מלא</FieldLabel>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="field"
                    aria-invalid={contactErrors.name ? "true" : undefined}
                    aria-describedby={contactErrors.name ? "contact-name-err" : undefined}
                  />
                  <FieldError id="contact-name-err">{contactErrors.name}</FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="contact-phone" required>טלפון</FieldLabel>
                  <input
                    id="contact-phone"
                    type="tel"
                    autoComplete="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="field"
                    dir="ltr"
                    style={{ textAlign: "right" }}
                    aria-invalid={contactErrors.phone ? "true" : undefined}
                    aria-describedby={contactErrors.phone ? "contact-phone-err" : undefined}
                  />
                  <FieldError id="contact-phone-err">{contactErrors.phone}</FieldError>
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="contact-email">אימייל <span className="font-normal" style={{ color: "#55677C" }}>(לא חובה)</span></FieldLabel>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="field"
                  dir="ltr"
                  style={{ textAlign: "right" }}
                  aria-invalid={contactErrors.email ? "true" : undefined}
                  aria-describedby={contactErrors.email ? "contact-email-err" : undefined}
                />
                <FieldError id="contact-email-err">{contactErrors.email}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="contact-message">במה נוכל לעזור?</FieldLabel>
                <textarea
                  id="contact-message"
                  rows={3}
                  value={contactForm.message}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="field resize-none"
                />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={contactSubmitting} className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
                  {contactSubmitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו לתיאום"}
                </button>
              </div>
            </form>
          )}
          <div className="sd-home-extras">
            <button type="button" onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}>
              <BrandIcon name="message" size={18} />
              שאלה קצרה ליועץ הדיגיטלי
            </button>
            <Link to="/app/auth">סוכן ביטוח? כניסה לפורטל הסוכנים</Link>
          </div>
        </SdContact>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
