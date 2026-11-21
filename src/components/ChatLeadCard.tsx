import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { IS_V2 } from "@/integrations/supabase/config";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import { useLeadIntake } from "@/hooks/useLeadIntake";
import { leadErrorMessage } from "@/lib/leadIntake";
import { RING } from "@/lib/brand";

// Inline "want us to call you back?" card inside the chat. It submits through the same path as the Contact
// page: v2 -> useLeadIntake (kind "contact", consent + CONSENT_VERSION via buildLeadPayload), legacy -> the
// contact_submissions insert + send-lead-notification. The transcript is never sent.

const PHONE_RE = /^0\d{1,2}-?\d{7}$/; // same rule as the Contact page
const CHAT_TOPIC = "צ'אט";
const CHAT_SOURCE_NOTE = "מקור: צ'אט";

type Errors = Partial<Record<"name" | "phone" | "consent", string>>;

const inputCls =
  "min-h-[44px] w-full rounded-lg bg-white px-3 py-2 text-[14.5px] text-[#203957] shadow-[0_0_0_1px_#D9DEE4] focus:shadow-[0_0_0_1px_#203957] focus:outline-none";

const ChatLeadCard = ({ pathname, onDismiss, onSent }: { pathname: string; onDismiss: () => void; onSent?: () => void }) => {
  const uid = useId().replace(/:/g, "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const intake = useLeadIntake();

  if (sent) {
    return (
      <div role="status" className="rounded-xl bg-[#EEF2EC] px-4 py-3 text-[14.5px] leading-relaxed text-[#203957]" data-chat-lead="sent">
        קיבלנו. הצוות יחזור אליכם בשעות הפעילות.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const next: Errors = {};
    if (!name.trim()) next.name = "נא למלא שם.";
    if (!PHONE_RE.test(phone.replace(/\s/g, ""))) next.phone = "נא למלא מספר טלפון ישראלי תקין.";
    if (!consent) next.consent = "כדי לשלוח צריך לאשר שנחזור אליכם.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    let ok = false;
    let message = "";
    if (IS_V2) {
      const result = await intake.submit({
        kind: "contact",
        name,
        phone,
        topic: CHAT_TOPIC,
        message: CHAT_SOURCE_NOTE,
        consent: true,
        sourcePage: pathname,
      });
      ok = result.ok;
      message = result.message;
    } else {
      try {
        const supabase = await loadSiteSupabase();
        const email = `${phone.trim()}@lead.seeld.co.il`;
        const { error } = await supabase.from("contact_submissions").insert([{
          user_id: null,
          name: name.trim(),
          email,
          subject: "פנייה מהצ'אט",
          message: `טלפון: ${phone}\n\n${CHAT_SOURCE_NOTE}`,
        }]);
        if (error) throw error;
        try {
          await supabase.functions.invoke("send-lead-notification", {
            body: { type: "contact", leadData: { fullName: name.trim(), phone: phone.trim(), email, insuranceType: "פנייה מהצ'אט" } },
          });
        } catch { /* the lead is saved; the notification is best effort */ }
        ok = true;
      } catch {
        message = leadErrorMessage(503).message;
      }
    }
    setSubmitting(false);
    if (ok) {
      setSent(true);
      onSent?.();
    } else {
      setServerError(message);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${uid}-t`}
      className="space-y-3 rounded-xl bg-white p-4 text-right"
      style={{ boxShadow: RING }}
      data-chat-lead="form"
    >
      <h5 id={`${uid}-t`} className="text-[16px] font-bold text-[#203957]">רוצים שנחזור אליכם?</h5>
      <div>
        <label htmlFor={`${uid}-n`} className="mb-1 block text-[13px] font-medium text-[#2D435D]">שם</label>
        <input
          id={`${uid}-n`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className={inputCls}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? `${uid}-ne` : undefined}
        />
        {errors.name && <p id={`${uid}-ne`} className="mt-1 text-[13px] text-[#BD582D]">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor={`${uid}-p`} className="mb-1 block text-[13px] font-medium text-[#2D435D]">טלפון</label>
        <input
          id={`${uid}-p`}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          dir="ltr"
          className={`${inputCls} text-right`}
          aria-invalid={errors.phone ? "true" : undefined}
          aria-describedby={errors.phone ? `${uid}-pe` : undefined}
        />
        {errors.phone && <p id={`${uid}-pe`} className="mt-1 text-[13px] text-[#BD582D]">{errors.phone}</p>}
      </div>
      <div>
        <label className="flex items-start gap-2 text-[13px] leading-relaxed text-[#2D435D]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
            aria-invalid={errors.consent ? "true" : undefined}
            aria-describedby={errors.consent ? `${uid}-ce` : undefined}
          />
          <span>
            מאשרים שיצרו איתנו קשר בנוגע לפנייה הזו. אפשר להסיר את ההסכמה בכל עת. פרטים ב
            <Link to="/privacy" target="_blank" rel="noopener" className="underline">מדיניות הפרטיות</Link>.
          </span>
        </label>
        {errors.consent && <p id={`${uid}-ce`} className="mt-1 text-[13px] text-[#BD582D]">{errors.consent}</p>}
      </div>
      {IS_V2 && intake.guard}
      {serverError && <p role="alert" className="text-[13px] text-[#BD582D]">{serverError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] min-w-[132px] items-center justify-center rounded-lg bg-[#203957] px-4 text-[14.5px] font-bold text-white transition-colors duration-150 hover:bg-[#162B45] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "השאירו פרטים"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[44px] px-2 text-[13.5px] text-[#55677C] underline underline-offset-4 hover:text-[#203957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))]"
        >
          לא עכשיו
        </button>
      </div>
    </form>
  );
};

export default ChatLeadCard;
