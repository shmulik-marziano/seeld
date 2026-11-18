// Soft lead capture at the end of the risk-level page. Same path and pattern as the retirement section's
// form (RetireForm): a row in pension_analysis_leads (the context goes into additional_notes) and the
// send-lead-notification edge function. No table, function or endpoint is added. Only the level is sent,
// and only when the visitor leaves it ticked; the answers themselves never leave the browser.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import { CONTACTS } from "@/lib/contacts";
import type { RiskLevel } from "@/lib/riskProfile";
import { RISK_LEVEL_COPY } from "@/data/riskProfile";
import "@/components/retire/retire.css";

const MOBILE_RE = /^05\d-?\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCE = "עמוד אפיון רמת סיכון למשקיע";

type Errors = Partial<Record<"name" | "phone" | "email" | "consent", string>>;

export default function RiskLeadForm({ level, idPrefix = "rk" }: { level: RiskLevel | null; idPrefix?: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [attach, setAttach] = useState(true);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const id = (s: string) => `${idPrefix}-${s}`;
  const levelTitle = level ? RISK_LEVEL_COPY[level].title : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const errs: Errors = {};
    if (!name.trim()) errs.name = "נא למלא שם מלא.";
    if (!MOBILE_RE.test(phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר נייד ישראלי תקין, למשל 052-1234567.";
    if (!EMAIL_RE.test(email.trim())) errs.email = "נא למלא כתובת מייל תקינה.";
    if (!consent) errs.consent = "כדי שנוכל ליצור קשר צריך לאשר את ההסכמה.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = (["name", "phone", "email", "consent"] as const).find((k) => errs[k]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }

    setSubmitting(true);
    const shared = attach && levelTitle ? levelTitle : "לא צורף";
    try {
      const supabase = await loadSiteSupabase();
      const notes = [
        `מקור: ${SOURCE}`,
        `אפיון רמת סיכון: ${shared}`,
        "הסכמה ליצירת קשר ולדיוור: כן",
      ].join("\n");
      const { error } = await supabase.from("pension_analysis_leads").insert({
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        primary_goals: attach && levelTitle ? ["risk-profile", levelTitle] : ["risk-profile"],
        additional_notes: notes,
      });
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "pension",
            leadData: {
              fullName: name.trim(), phone: phone.trim(), email: email.trim(), focusArea: "investment",
              extra: { source: SOURCE, riskLevel: shared },
            },
          },
        });
      } catch { /* notification failure is non-blocking: the lead is saved */ }
      setSent(true);
    } catch {
      toast.error(`השליחה לא עברה. נסו שוב, או התקשרו ${CONTACTS.general.phone}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="sd-rp-thanks" role="status" aria-live="polite">
        <h3>קיבלנו את הפרטים. תודה.</h3>
        <p className="sd-rp-thanks-lead">מישהו מהצוות יחזור אליכם לתיאום שיחת היכרות. בשיחה נבחן את האפיון מול התמונה המלאה של החיסכון שלכם.</p>
        <button type="button" className="sd-rp-reset" onClick={() => { setSent(false); setName(""); setPhone(""); setEmail(""); setConsent(false); }}>שליחת פרטים נוספים</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="sd-rp-form" aria-label="טופס שיחת היכרות אחרי אפיון רמת הסיכון">
      <h3 className="sd-rp-form-title">לקבל את האפיון ולתאם שיחת היכרות</h3>
      <p className="sd-rp-form-sub">כמה פרטים, ומישהו מהצוות חוזר אליכם לתיאום. השיחה הראשונה אינה מחייבת.</p>

      <div className="sd-rp-grid">
        <div>
          <label htmlFor={id("name")} className="sd-rp-label">שם מלא <span aria-hidden="true">*</span></label>
          <input id={id("name")} className="field" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? "true" : undefined} aria-describedby={errors.name ? id("name-err") : undefined} />
          {errors.name && <p id={id("name-err")} className="sd-rp-err">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor={id("phone")} className="sd-rp-label">נייד <span aria-hidden="true">*</span></label>
          <input id={id("phone")} className="field" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: "right" }}
            value={phone} onChange={(e) => setPhone(e.target.value)}
            aria-invalid={errors.phone ? "true" : undefined} aria-describedby={errors.phone ? id("phone-err") : undefined} />
          {errors.phone && <p id={id("phone-err")} className="sd-rp-err">{errors.phone}</p>}
        </div>
        <div className="sd-rp-wide">
          <label htmlFor={id("email")} className="sd-rp-label">מייל <span aria-hidden="true">*</span></label>
          <input id={id("email")} className="field" type="email" inputMode="email" autoComplete="email" dir="ltr" style={{ textAlign: "right" }}
            value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? "true" : undefined} aria-describedby={errors.email ? id("email-err") : undefined} />
          {errors.email && <p id={id("email-err")} className="sd-rp-err">{errors.email}</p>}
        </div>
      </div>

      {levelTitle ? (
        <div className="sd-rp-consent sd-rk-attach">
          <label>
            <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
            <span>לצרף לפנייה את תוצאת האפיון: <b>{levelTitle}</b>. התשובות עצמן לא נשלחות.</span>
          </label>
        </div>
      ) : (
        <p className="sd-rk-noresult">עוד לא מילאתם את השאלון? אפשר להשאיר פרטים גם בלעדיו, או <a href="#quiz">לענות קודם על ארבע השאלות</a>.</p>
      )}

      <div className="sd-rp-consent">
        <label>
          <input id={id("consent")} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={errors.consent ? "true" : undefined} aria-describedby={errors.consent ? id("consent-err") : undefined} />
          <span>
            אני מאשר/ת שיצרו איתי קשר, ושישלחו אליי עדכונים ותכנים בנושא חיסכון והשקעות. אפשר להסיר את ההסכמה בכל עת.
            פרטים על השימוש במידע ב<Link to="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</Link>.
          </span>
        </label>
        {errors.consent && <p id={id("consent-err")} className="sd-rp-err">{errors.consent}</p>}
      </div>

      <button type="submit" className="sd-btn sd-rp-submit" disabled={submitting}>
        {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {submitting ? "שולחים" : "לתיאום שיחת היכרות"}
      </button>
    </form>
  );
}
