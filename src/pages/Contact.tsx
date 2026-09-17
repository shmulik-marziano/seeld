import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { useAuth } from "@/hooks/useAuth";
import { Illustration } from "@/components/brand/Illustration";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE } from "@/lib/brand";

// Contact: the form is the page's action. The clarity illustration sits beside
// the explanation (kit map 05). No closing band, no duplicate calls to action.

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
  <label htmlFor={htmlFor} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
    {children}
    {required && <span aria-hidden="true" style={{ color: "#BD582D" }}> *</span>}
  </label>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? <p id={id} className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{children}</p> : null;

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

      toast.success("הפנייה התקבלה. נחזור אליכם לתיאום שיחה.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setErrors({});
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
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

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO — one idea: leave details, we call back */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">צור קשר</span>
            </nav>

            <div className="grid gap-10 lg:gap-16 lg:grid-cols-[1.15fr_0.85fr] items-center">
              <div>
                <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                  נדבר על התיק שלכם
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  השאירו פרטים ויועץ מהצוות יחזור אליכם לתיאום שיחה ראשונה: בדיקת תיק 360, פגישה במשרד, בזום או בטלפון.
                  ללא עלות וללא התחייבות.
                </p>
              </div>
              <Illustration
                name="05-clarity-decisions"
                priority
                sizes="(min-width: 1024px) 420px, 80vw"
                className="brand-hero-art max-w-sm mx-auto lg:max-w-none"
              />
            </div>
          </div>
        </section>

        {/* FORM + DETAILS */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-24 items-start">
              {/* The one action: the form */}
              <ScrollReveal>
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
                      <FieldLabel htmlFor="email">אימייל <span className="font-normal" style={{ color: MUTED }}>(לא חובה)</span></FieldLabel>
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
                  <div className="pt-2 flex flex-wrap items-center gap-5">
                    <button type="submit" disabled={submitting} className="btn-primary min-w-[180px]">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו פנייה"}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                      className="link-rule text-[15px]"
                    >
                      <BrandIcon name="message" size={18} />
                      שאלו את היועץ הדיגיטלי
                    </button>
                  </div>
                  <p className="text-[14px]" style={{ color: MUTED }}>
                    הפרטים משמשים ליצירת קשר בלבד. אנחנו לא מעבירים אותם לגורם שלישי.
                  </p>
                </form>
              </ScrollReveal>

              {/* Side column: details rows + mini FAQ */}
              <ScrollReveal delay={100}>
                <div>
                  <div className="border-t" style={{ borderColor: LINE }}>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[14px]" style={{ color: MUTED }}>טלפון</span>
                        <a
                          href="tel:0523097444"
                          className="inline-flex min-h-[44px] items-center text-[16px] font-bold tabular-nums whitespace-nowrap border-b border-transparent hover:border-[#003D30]/40 transition-colors"
                          style={{ color: GREEN }}
                          dir="ltr"
                        >
                          052-309-7444
                        </a>
                      </div>
                      <p className="text-[14px] mt-1 text-left" style={{ color: MUTED }}>
                        ימים א׳ עד ה׳, <span dir="ltr" className="tabular-nums whitespace-nowrap">9:00-18:00</span>
                      </p>
                    </div>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[14px]" style={{ color: MUTED }}>WhatsApp</span>
                        <a
                          href="https://wa.me/972523097444"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center text-[16px] font-bold border-b border-transparent hover:border-[#003D30]/40 transition-colors"
                          style={{ color: GREEN }}
                        >
                          שלחו הודעה
                        </a>
                      </div>
                    </div>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-[14px]" style={{ color: MUTED }}>אימייל</span>
                        <a
                          href="mailto:info@seeld.co.il"
                          className="inline-flex min-h-[44px] items-center text-[16px] font-bold border-b border-transparent hover:border-[#003D30]/40 transition-colors"
                          style={{ color: GREEN }}
                          dir="ltr"
                        >
                          info@seeld.co.il
                        </a>
                      </div>
                    </div>
                    <div className="py-[15px] border-b" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between gap-6">
                        <span className="text-[14px] shrink-0" style={{ color: MUTED }}>משרדים</span>
                        <div className="text-left">
                          <p className="text-[16px]" style={{ color: GREEN }}>המלאכה 10, רעננה</p>
                          <p className="text-[16px]" style={{ color: GREEN }}>הסדנא 4, ירושלים</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Before you write — three short answers */}
                  <div className="mt-10">
                    <h2 className="text-[20px] mb-4" style={{ color: GREEN }}>
                      לפני שאתם כותבים
                    </h2>
                    <div className="border-t" style={{ borderColor: LINE }}>
                      {[
                        {
                          q: "האם הייעוץ כרוך בתשלום?",
                          a: "פגישת הייעוץ הראשונית ללא עלות וללא התחייבות.",
                        },
                        {
                          q: "מה זה בדיקת תיק 360?",
                          a: "בדיקה של כל מה שיש לכם: ביטוחים, פנסיה, חיסכון. מוצאים חסרים, כפלים ודמי ניהול גבוהים, ומסכמים הכול בתמונה אחת.",
                        },
                        {
                          q: "עם אילו חברות ביטוח אתם עובדים?",
                          a: "עם חברות הביטוח ובתי ההשקעות בישראל. משווים עבורכם את האפשרויות בשוק.",
                        },
                      ].map((item) => (
                        <div key={item.q} className="py-5 border-b" style={{ borderColor: LINE }}>
                          <h3 className="text-[16px] mb-1.5" style={{ color: GREEN }}>{item.q}</h3>
                          <p className="text-[15px] leading-[1.7]" style={{ color: BODY }}>{item.a}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5">
                      <Link to="/faq" className="link-rule text-[15px]">
                        לכל השאלות הנפוצות
                        <BrandIcon name="arrow-left" size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
