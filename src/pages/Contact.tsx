import { CONTACTS, GENERAL_MAILBOX, type ContactDept } from "@/lib/contacts";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import { useAuth } from "@/hooks/useAuth";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { FormSuccess } from "@/components/brand/FormSuccess";
import { stories } from "@/data/stories";
import { SdBand, SdPic, SdStory } from "@/components/sd/primitives";
import { topicFor } from "@/components/sd/topics";
import { Arrow, PubHero, PubPage } from "@/components/sd/pubParts";

// Contact (kit design): hero with the direct ways to reach us, the form (logic unchanged),
// the emotional moment, short answers, and the two offices.

const PATH = "/contact";

const PHONE_RE = /^0\d{1,2}-?\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subjects = [
  { value: "portfolio-360", label: "בדיקת תיק 360" },
  { value: "meeting", label: "תיאום פגישה" },
  { value: "pension", label: "תכנון פנסיוני" },
  { value: "health-insurance", label: "ביטוח בריאות" },
  { value: "life-insurance", label: "ביטוח חיים" },
  { value: "car-insurance", label: "ביטוח רכב" },
  { value: "home-insurance", label: "ביטוח דירה" },
  { value: "savings", label: "חיסכון והשקעות" },
  { value: "other", label: "אחר" },
];

type Errors = Partial<Record<"name" | "email" | "phone" | "subject", string>>;

const FieldLabel = ({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} className="sd-pub-label">
    {children}
    {required && <span aria-hidden="true" style={{ color: "#BD582D" }}> *</span>}
  </label>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? <p id={id} className="sd-pub-err">{children}</p> : null;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();

  const validate = () => {
    const next: Errors = {};
    if (!formData.name.trim()) next.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(formData.phone.replace(/\s/g, ""))) next.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (formData.email && !EMAIL_RE.test(formData.email)) next.email = "כתובת האימייל אינה תקינה.";
    if (!formData.subject) next.subject = "נא לבחור נושא.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);

    const subjectLabel = subjects.find((s) => s.value === formData.subject)?.label ?? formData.subject;
    const email = formData.email.trim() || `${formData.phone.trim()}@lead.seeld.co.il`;

    try {
      const supabase = await loadSiteSupabase();
      const { error } = await supabase.from("contact_submissions").insert([{
        user_id: user?.id || null,
        name: formData.name.trim(),
        email,
        subject: subjectLabel,
        message: `טלפון: ${formData.phone}\n\n${formData.message}`,
      }]);

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: formData.name.trim(),
              phone: formData.phone.trim(),
              email,
              insuranceType: subjectLabel,
            },
          },
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      setSent(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setErrors({});
    } catch {
      toast.error(`השליחה לא עברה. נסו שוב, או חייגו ${CONTACTS.general.phone}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  const topic = topicFor(PATH);
  const [p1, p2, p3] = topic.palette;
  const story = stories[PATH];

  const depts: { d: ContactDept; title: string; note: string }[] = [
    { d: "insurance", title: "ביטוח", note: "פוליסות, הצעות והשוואות" },
    { d: "general", title: "פיננסים, ניהול ושאר הפניות", note: "פנסיה, חיסכון, השקעות וכל נושא אחר" },
  ];
  const quick = (
    <div className="sd-pub-depts">
      {depts.map(({ d, title, note }) => (
        <section key={d} className="sd-pub-dept" aria-label={title}>
          <h2>{title}</h2>
          <p className="sd-pub-dept-note">{note}</p>
          <ContactIcons dept={d} tone="dark" />
          <p className="sd-pub-dept-plain">
            <span dir="ltr" className="tabular-nums whitespace-nowrap">{CONTACTS[d].phone}</span>
            <span dir="ltr">{CONTACTS[d].email}</span>
          </p>
        </section>
      ))}
      <p className="sd-pub-dept-fine">
        ימים א׳ עד ה׳ <span dir="ltr" className="tabular-nums whitespace-nowrap">9:00-18:00</span>. תיבת דואר כללית: <a href={`mailto:${GENERAL_MAILBOX}`} dir="ltr">{GENERAL_MAILBOX}</a>
      </p>
    </div>
  );

  const faqs = [
    { q: "האם שיחת ההיכרות מחייבת?", a: "שיחת ההיכרות הראשונית אינה מחייבת. היא נועדה להכיר אתכם ולהבין מה חשוב לכם." },
    { q: "מה זה בדיקת תיק 360?", a: "בדיקה של כל מה שיש לכם: ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים ודמי ניהול גבוהים, ומסכמים הכול בתמונה אחת." },
    { q: "עם אילו חברות ביטוח אתם עובדים?", a: "עם חברות הביטוח ובתי ההשקעות בישראל. משווים עבורכם את האפשרויות בשוק." },
  ];

  return (
    <PubPage tint={p1}>
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "צור קשר" }]}
        eyebrow="צור קשר"
        title="נדבר על התיק שלכם"
        lead="השאירו פרטים ואחד מהצוות יחזור אליכם לתיאום שיחה ראשונה: בדיקת תיק 360, פגישה במשרד, בזום או בטלפון. שיחת היכרות בלי התחייבות מצידכם."
        art={topic.art}
        extra={quick}
      />

      {/* FORM */}
      <SdBand tone="white" id="contact-form">
        <div className="sd-wrap sd-pub-formgrid">
          <div className="sd-pub-formcard">
            <h2 className="sd-h2" style={{ fontSize: "clamp(26px, 2.6vw, 34px)", marginBottom: 22 }}>השאירו פרטים ונחזור אליכם</h2>
            {sent ? (
              <FormSuccess onReset={() => setSent(false)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <FieldLabel htmlFor="name" required>שם מלא</FieldLabel>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="field"
                    autoComplete="name"
                    aria-invalid={errors.name ? "true" : undefined}
                    aria-describedby={errors.name ? "name-err" : undefined}
                  />
                  <FieldError id="name-err">{errors.name}</FieldError>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="phone" required>טלפון</FieldLabel>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="field"
                      autoComplete="tel"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                      aria-invalid={errors.phone ? "true" : undefined}
                      aria-describedby={errors.phone ? "phone-err" : undefined}
                    />
                    <FieldError id="phone-err">{errors.phone}</FieldError>
                  </div>
                  <div>
                    <FieldLabel htmlFor="email">אימייל <span className="font-normal" style={{ color: "var(--muted)" }}>(לא חובה)</span></FieldLabel>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="field"
                      autoComplete="email"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                      aria-invalid={errors.email ? "true" : undefined}
                      aria-describedby={errors.email ? "email-err" : undefined}
                    />
                    <FieldError id="email-err">{errors.email}</FieldError>
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="subject" required>נושא הפנייה</FieldLabel>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="field appearance-none cursor-pointer"
                    aria-invalid={errors.subject ? "true" : undefined}
                    aria-describedby={errors.subject ? "subject-err" : undefined}
                  >
                    <option value="">בחרו נושא</option>
                    {subjects.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <FieldError id="subject-err">{errors.subject}</FieldError>
                </div>
                <div>
                  <FieldLabel htmlFor="message">במה נוכל לעזור?</FieldLabel>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="field resize-none"
                  />
                </div>
                <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button type="submit" disabled={submitting} className="sd-btn sd-pub-submit" style={{ minWidth: 190 }}>
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו פנייה"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="sd-link sd-pub-linkbtn"
                  >
                    <BrandIcon name="message" size={18} />
                    שאלו את היועץ הדיגיטלי
                  </button>
                </div>
                <p className="sd-small">
                  הפרטים משמשים ליצירת קשר בלבד. אנחנו לא מעבירים אותם לגורם שלישי.
                </p>
              </form>
            )}
          </div>

          <div>
            <span className="sd-eyebrow">לפני שכותבים</span>
            <h2 className="sd-h2 mt-4" style={{ fontSize: "clamp(26px, 2.6vw, 34px)" }}>שלוש תשובות קצרות</h2>
            <div className="sd-faq mt-6">
              {faqs.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <div>{f.a}</div>
                </details>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/faq" className="sd-link">לכל השאלות הנפוצות<Arrow /></Link>
            </div>
            <div className="sd-pub-art mt-10 hidden lg:block" aria-hidden="true" style={{ maxWidth: 360, ["--band-deep" as string]: "var(--tint-deep)" }}>
              <SdPic name="10-financial-planning" sizes="360px" />
            </div>
          </div>
        </div>
      </SdBand>

      {story && (
        <SdBand tone={p2} id="moment">
          <SdStory story={story} art={topic.art2} flip />
        </SdBand>
      )}

      {/* OFFICES */}
      <SdBand tone={p3} id="offices">
        <div className="sd-wrap">
          <div className="sd-band-head">
            <span className="sd-eyebrow">המשרדים</span>
            <h2 className="sd-h2">פוגשים אותנו ברעננה ובירושלים</h2>
            <p className="sd-lead">אפשר גם בזום או בטלפון. תאמו מראש ונתאים את המקום והשעה.</p>
          </div>
          <div className="sd-pub-offices">
            <div className="sd-pub-office">
              <em>משרד</em>
              <h3>רעננה</h3>
              <p>המלאכה 10, רעננה</p>
              <p className="sd-pub-hours"><span>בתיאום מראש</span></p>
            </div>
            <div className="sd-pub-office">
              <em>משרד</em>
              <h3>ירושלים</h3>
              <p>הסדנא 4, ירושלים</p>
              <p className="sd-pub-hours"><span>בתיאום מראש</span></p>
            </div>
          </div>
        </div>
      </SdBand>
    </PubPage>
  );
};

export default Contact;
