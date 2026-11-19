import { CONTACTS } from "@/lib/contacts";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import { IS_V2 } from "@/integrations/supabase/config";
import { useLeadIntake } from "@/hooks/useLeadIntake";
import { FormSuccess } from "@/components/brand/FormSuccess";
import AnswerSummary from "@/components/AnswerSummary";
import { SdBand } from "@/components/sd/primitives";
import { Arrow, PubHero, PubPage } from "@/components/sd/pubParts";
import { ReportDropZone, ReportNextCards, ReportNote, ReportStepper, REPORT_DISCLAIMER } from "@/components/sd/ReportParts";

/**
 * Public explainer for the personal report. The process itself is not open yet ("בקרוב"); the lead form reuses the
 * same contact_submissions insert and notification call as pages/Contact.tsx, with a subject that says what it is for.
 */

const PHONE_RE = /^0\d{1,2}-?\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECT = "דוח אישי: בקשה לשיחה על הדוח";

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

const Report = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const intake = useLeadIntake();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next: Errors = {};
    if (!form.name.trim()) next.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(form.phone.replace(/\s/g, ""))) next.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (form.email && !EMAIL_RE.test(form.email)) next.email = "כתובת האימייל אינה תקינה.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    if (IS_V2) {
      const result = await intake.submit({
        kind: "report",
        name: form.name,
        phone: form.phone,
        email: form.email,
        topic: SUBJECT,
        consent: true,
        sourcePage: "/report",
      });
      setSubmitting(false);
      if (result.ok) {
        setSent(true);
        setForm({ name: "", phone: "", email: "" });
      } else {
        toast.error(result.message);
      }
      return;
    }
    const email = form.email.trim() || `${form.phone.trim()}@lead.seeld.co.il`;
    try {
      const supabase = await loadSiteSupabase();
      const { error } = await supabase.from("contact_submissions").insert([{
        user_id: null,
        name: form.name.trim(),
        email,
        subject: SUBJECT,
        message: `טלפון: ${form.phone}\n\nבקשה לעדכון כשהפקת הדוח האישי תיפתח.`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: { type: "contact", leadData: { fullName: form.name.trim(), phone: form.phone.trim(), email, insuranceType: SUBJECT } },
        });
      } catch { /* notification failure is non-blocking */ }
      setSent(true);
      setForm({ name: "", phone: "", email: "" });
    } catch {
      toast.error(`השליחה לא עברה. נסו שוב, או חייגו ${CONTACTS.general.phone}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (id: "name" | "phone" | "email", label: string, opts: { req?: boolean; type?: string; ltr?: boolean; auto?: string }) => (
    <div>
      <label htmlFor={`rp-${id}`} className="block text-[14px] font-bold mb-1.5" style={{ color: "#203957" }}>
        {label}{opts.req && <span aria-hidden="true" style={{ color: "#BD582D" }}> *</span>}
      </label>
      <input
        id={`rp-${id}`}
        type={opts.type ?? "text"}
        autoComplete={opts.auto}
        value={form[id]}
        onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
        className="field"
        dir={opts.ltr ? "ltr" : undefined}
        style={opts.ltr ? { textAlign: "right" } : undefined}
        aria-invalid={errors[id] ? "true" : undefined}
        aria-describedby={errors[id] ? `rp-${id}-err` : undefined}
      />
      {errors[id] && <p id={`rp-${id}-err`} className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{errors[id]}</p>}
    </div>
  );

  return (
    <PubPage tint="lavender">
      <PubHero
        crumbs={[{ label: "דף הבית", to: "/" }, { label: "הפקת דוח אישי" }]}
        eyebrow="הפקת דוח אישי"
        title="דוח אישי מהמסלקה ומהר הביטוח"
        lead="מעלים את הקבצים שהורדתם, ואנחנו מארגנים את המידע בדוח אחד מסודר בעיצוב שילד. אם תרצו, אפשר להמשיך להצטרפות לסוכנות."
        art="10-financial-planning"
        extra={<div className="mt-5"><AnswerSummary /></div>}
      />

      <SdBand tone="cream" id="steps">
        <div className="sd-wrap space-y-6">
          <div className="sd-band-head">
            <h2 className="sd-h2">חמישה שלבים, ואתם מחליטים עד איפה להמשיך</h2>
            <p className="sd-lead">שני השלבים הראשונים הם הדוח. השלבים האחרים הם בחירה, ואפשר לעצור אחרי הדוח.</p>
          </div>
          <ReportNote>הפקת הדוח מתבצעת במכשיר שלכם: הקבצים לא נשלחים לשום מקום. {REPORT_DISCLAIMER}</ReportNote>
          <ReportStepper active={0} />
          <ReportDropZone />
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/report/start" className="sd-btn sd-btn-main">הפקת הדוח מהקבצים שלי</Link>
            <span className="sd-text">קובץ מסלקה, קובץ הר הביטוח, או שניהם. הדוח מוכן לצפייה ולשמירה כ-PDF.</span>
          </div>
        </div>
      </SdBand>

      <SdBand tone="sky" id="next">
        <div className="sd-wrap space-y-6">
          <div className="sd-band-head">
            <h2 className="sd-h2">מה קורה אחרי הדוח</h2>
            <p className="sd-lead">הצטרפות, מינוי סוכן והזמנת מידע הם צעדים נפרדים. כל אחד דורש אישור שלכם.</p>
          </div>
          <ReportNextCards publicPage />
        </div>
      </SdBand>

      <SdBand tone="white" id="contact-form">
        <div className="sd-wrap sd-pub-formgrid">
          <div className="sd-pub-formcard">
            <h2 className="sd-h2" style={{ fontSize: "clamp(26px, 2.6vw, 34px)", marginBottom: 12 }}>רוצים שנעבור על הדוח איתכם?</h2>
            <p className="sd-text" style={{ marginBottom: 20 }}>שם וטלפון מספיקים. הצוות חוזר אליכם לשיחת היכרות על הדוח, או עונה על כל שאלה בדרך.</p>
            {sent ? (
              <FormSuccess next="קיבלנו. הצוות יחזור אליכם בהקדם." onReset={() => setSent(false)} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {field("name", "שם מלא", { req: true, auto: "name" })}
                <div className="grid sm:grid-cols-2 gap-4">
                  {field("phone", "טלפון", { req: true, type: "tel", ltr: true, auto: "tel" })}
                  {field("email", "אימייל (לא חובה)", { type: "email", ltr: true, auto: "email" })}
                </div>
                {IS_V2 && intake.guard}
                <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <>שלחו לי עדכון <Arrow /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </SdBand>
    </PubPage>
  );
};

export default Report;
