import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { FormSuccess } from "@/components/brand/FormSuccess";
import { GREEN, MUTED } from "@/lib/brand";

/**
 * The 360 review lead form: name, phone, a subject. One component for the home
 * page and the service page, so the copy, the validation and the success state
 * stay identical wherever the central path is offered.
 */

export const LEAD_SUBJECTS = [
  "בדיקת תיק 360",
  "פנסיה וחיסכון",
  "פוליסות השקעה, גמל והשתלמות",
  "ניוד פנסיה",
  "ביטוח חיים",
  "ביטוח משכנתא",
  "ביטוח בריאות",
  "ביטוח רכב",
  "ביטוח דירה",
  "ביטוח עסקי",
  "ביטוח נסיעות",
  "אחר",
];

const PHONE_RE = /^0\d{1,2}-?\d{7}$/;

const FieldLabel = ({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
    {children}
    {required && <span aria-hidden="true" style={{ color: "#BD582D" }}> *</span>}
  </label>
);

const FieldError = ({ id, children }: { id: string; children?: string }) =>
  children ? <p id={id} className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{children}</p> : null;

interface Props {
  className?: string;
  /** Distinct ids when two forms share a page */
  idPrefix?: string;
  /** Where the lead came from; goes into the message for the agency */
  source?: string;
}

export const PortfolioReviewForm = ({ className = "", idPrefix = "lead", source = "בדיקת תיק 360" }: Props) => {
  const [form, setForm] = useState({ name: "", phone: "", subject: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "נא למלא שם מלא.";
    if (!PHONE_RE.test(form.phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר טלפון ישראלי תקין.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const email = `${form.phone.trim()}@lead.seeld.co.il`;
      const { error } = await supabase.from("contact_submissions").insert([{
        name: form.name.trim(),
        email,
        subject: form.subject || "בדיקת תיק 360",
        message: `[${source}] טלפון: ${form.phone}\nנושא: ${form.subject || "לא צוין"}`,
      }]);
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "contact",
            leadData: {
              fullName: form.name.trim(),
              phone: form.phone.trim(),
              email,
              insuranceType: form.subject || "בדיקת תיק 360",
            },
          },
        });
      } catch { /* notification failure is non-blocking */ }
      setSent(true);
      setForm({ name: "", phone: "", subject: "" });
    } catch {
      toast.error("השליחה לא עברה. נסו שוב, או חייגו 052-309-7444.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return <FormSuccess className={className} next="נחזור אליכם ביום העסקים הבא לתיאום הבדיקה." onReset={() => setSent(false)} />;
  }

  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <form onSubmit={submit} noValidate className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor={id("name")} required>שם מלא</FieldLabel>
          <input
            id={id("name")}
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="field"
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? id("name-err") : undefined}
          />
          <FieldError id={id("name-err")}>{errors.name}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor={id("phone")} required>טלפון</FieldLabel>
          <input
            id={id("phone")}
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="field"
            dir="ltr"
            style={{ textAlign: "right" }}
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? id("phone-err") : undefined}
          />
          <FieldError id={id("phone-err")}>{errors.phone}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor={id("subject")}>במה נתחיל?</FieldLabel>
          <select
            id={id("subject")}
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            className="field appearance-none cursor-pointer"
          >
            <option value="">בדיקת תיק 360 (ברירת מחדל)</option>
            {LEAD_SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Phone: the button spans the form like the fields above it */}
      <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-5">
        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto sm:min-w-[200px]">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "שלחו ונתחיל בבדיקה"}
        </button>
        <span className="text-[15px]" style={{ color: MUTED }}>
          או חייגו{" "}
          <a
            href="tel:0523097444"
            className="font-bold border-b border-[#003D30]/30 hover:border-[#003D30] transition-colors tabular-nums whitespace-nowrap"
            style={{ color: GREEN }}
            dir="ltr"
          >
            052-309-7444
          </a>
        </span>
      </div>
      <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
        הפרטים משמשים ליצירת קשר בלבד. אנחנו לא מעבירים אותם לגורם שלישי.
      </p>
    </form>
  );
};

export default PortfolioReviewForm;
