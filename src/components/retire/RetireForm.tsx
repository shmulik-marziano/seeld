import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import { CONTACTS } from "@/lib/contacts";
import {
  AGES, CHECKLIST_HREF, CHECKLIST_PDF_URL, CONCERNS, NEXT_STEPS, SITUATIONS,
  type AgeKey, type ConcernKey, type SituationKey,
} from "@/data/retirementPlanning";
import "./retire.css";

// Lead form of the retirement-planning section. Same path as the site's pension forms: a row in
// pension_analysis_leads (extra answers go into additional_notes) and the send-lead-notification
// edge function with type "pension" and focusArea "retirement". No table or function is changed.

const MOBILE_RE = /^05\d-?\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isConcern = (v: string | null): v is ConcernKey => !!v && CONCERNS.some((c) => c.key === v);
const isSituation = (v: string | null): v is SituationKey => !!v && SITUATIONS.some((s) => s.key === v);

type Errors = Partial<Record<"name" | "phone" | "email" | "consent", string>>;

function Choice<T extends string>({
  legend, name, options, value, onChange, hint,
}: { legend: string; name: string; options: { key: T; label: string }[]; value: T | ""; onChange: (v: T) => void; hint?: string }) {
  return (
    <fieldset className="sd-rp-choice">
      <legend>{legend}{hint && <small>{hint}</small>}</legend>
      <div className="sd-rp-pills">
        {options.map((o) => (
          <label key={o.key} className={value === o.key ? "is-on" : ""}>
            <input type="radio" name={name} value={o.key} checked={value === o.key} onChange={() => onChange(o.key)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** What replaces the form after it is sent: what happens next, and the lead-magnet download. */
export function RetireThanks({ onReset }: { onReset?: () => void }) {
  return (
    <div className="sd-rp-thanks" role="status" aria-live="polite">
      <h3>קיבלנו את הפרטים. תודה.</h3>
      <p className="sd-rp-thanks-lead">מה קורה עכשיו:</p>
      <ol>
        {NEXT_STEPS.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <div className="sd-rp-magnet">
        <b>רשימת ההכנה לתכנון פרישה</b>
        <p>מה כדאי לאסוף, מה אנחנו שולפים עבורכם ומה אפשר לבדוק בעצמכם. אפשר להדפיס או לשמור כקובץ PDF.</p>
        {CHECKLIST_PDF_URL
          ? <a className="sd-btn" href={CHECKLIST_HREF} download>הורדת הרשימה</a>
          : <Link className="sd-btn" to={CHECKLIST_HREF} target="_blank" rel="noopener">פתיחת הרשימה להדפסה</Link>}
      </div>
      {onReset && <button type="button" className="sd-rp-reset" onClick={onReset}>שליחת פרטים נוספים</button>}
    </div>
  );
}

export default function RetireForm({ idPrefix = "rp", source = "עמוד תכנון פרישה" }: { idPrefix?: string; source?: string }) {
  const [params] = useSearchParams();
  const { search, hash } = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<AgeKey | "">("");
  const [situation, setSituation] = useState<SituationKey | "">("");
  const [concern, setConcern] = useState<ConcernKey | "">("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Presets from the entry cards (?concern=tax&situation=parents): values only, no personal data in URLs.
  useEffect(() => {
    const c = params.get("concern");
    const s = params.get("situation");
    if (isConcern(c)) setConcern(c);
    if (isSituation(s)) setSituation(s);
    if ((isConcern(c) || isSituation(s)) && hash === "#form") {
      requestAnimationFrame(() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const id = (s: string) => `${idPrefix}-${s}`;
  const labels = useMemo(() => ({
    age: AGES.find((a) => a.key === age)?.label,
    situation: SITUATIONS.find((s) => s.key === situation)?.label,
    concern: CONCERNS.find((c) => c.key === concern)?.label,
  }), [age, situation, concern]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const errs: Errors = {};
    if (!name.trim()) errs.name = "נא למלא שם מלא.";
    if (!MOBILE_RE.test(phone.replace(/\s/g, ""))) errs.phone = "נא למלא מספר נייד ישראלי תקין, למשל 052-1234567.";
    if (!EMAIL_RE.test(email.trim())) errs.email = "נא למלא כתובת מייל תקינה.";
    if (!consent) errs.consent = "כדי שנוכל ליצור קשר צריך לאשר את ההסכמה.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const supabase = await loadSiteSupabase();
      const notes = [
        `מקור: ${source}`,
        `טווח גיל: ${labels.age ?? "לא צוין"}`,
        `מצב: ${labels.situation ?? "לא צוין"}`,
        `מה מטריד: ${labels.concern ?? "לא צוין"}`,
        "הסכמה ליצירת קשר ולדיוור: כן",
      ].join("\n");
      const { error } = await supabase.from("pension_analysis_leads").insert({
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        primary_goals: labels.concern ? ["retirement", labels.concern] : ["retirement"],
        additional_notes: notes,
      });
      if (error) throw error;
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: "pension",
            leadData: {
              fullName: name.trim(), phone: phone.trim(), email: email.trim(), focusArea: "retirement",
              extra: { source, ageRange: labels.age ?? "", situation: labels.situation ?? "", concern: labels.concern ?? "" },
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
    return <RetireThanks onReset={() => { setSent(false); setName(""); setPhone(""); setEmail(""); setConsent(false); }} />;
  }

  return (
    <form onSubmit={submit} noValidate className="sd-rp-form" aria-label="טופס שיחת היכרות לתכנון פרישה">
      <h3 className="sd-rp-form-title">שיחת היכרות ראשונה, בלי התחייבות</h3>
      <p className="sd-rp-form-sub">כמה פרטים, ומישהו מהצוות חוזר אליכם לתיאום.</p>

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

      <Choice<AgeKey> legend="טווח גיל" name={id("age")} options={AGES} value={age} onChange={setAge} />
      <Choice<SituationKey> legend="מה המצב" name={id("situation")} options={SITUATIONS} value={situation} onChange={setSituation} />
      <Choice<ConcernKey> legend="מה מטריד אתכם" name={id("concern")} options={CONCERNS} value={concern} onChange={setConcern} />

      <div className="sd-rp-consent">
        <label>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={errors.consent ? "true" : undefined} aria-describedby={errors.consent ? id("consent-err") : undefined} />
          <span>
            אני מאשר/ת שיצרו איתי קשר, ושישלחו אליי עדכונים ותכנים בנושא תכנון פרישה. אפשר להסיר את ההסכמה בכל עת.
            פרטים על השימוש במידע ב<Link to="/privacy" target="_blank" rel="noopener">מדיניות הפרטיות</Link>.
          </span>
        </label>
        {errors.consent && <p id={id("consent-err")} className="sd-rp-err">{errors.consent}</p>}
      </div>

      <button type="submit" className="sd-btn sd-rp-submit" disabled={submitting}>
        {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {submitting ? "שולחים" : "לתיאום שיחת היכרות"}
      </button>
      <p className="sd-rp-after">אחרי השליחה תוכלו להוריד את רשימת ההכנה לתכנון פרישה. השיחה הראשונה אינה מחייבת.</p>
    </form>
  );
}
