// Opens when a locked block (or the "go over the report with the team" button) is pressed: explains what is missing, shows the
// department contact icons and a small lead form. Only the first name, the phone and the name of the requested part are sent,
// through the same contact_submissions insert + notification call as pages/Report.tsx. The report data never leaves the device.
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { CONTACTS, type ContactDept } from "@/lib/contacts";
import { IS_V2 } from "@/integrations/supabase/config";
import { loadSiteSupabase } from "@/integrations/supabase/lazy";
import { WHY, blockDef } from "@/reports/blocks";
import { buildLeadPayload, type ReportLeadPayload } from "@/reports/lead";
import type { LockReason } from "@/reports/types";
import { REASON_LABEL } from "@/reports/components/LockedBlock";

const INSURANCE_BLOCKS = new Set(["coverage-amounts", "policy-details", "coverage-cards", "premium-summary"]);
const FULL_REPORT = "full-report";
const sessionId = () => { try { return sessionStorage.getItem("rp-sid") ?? (sessionStorage.setItem("rp-sid", Math.random().toString(36).slice(2)), sessionStorage.getItem("rp-sid") ?? "s"); } catch { return "s"; } };

/** Legacy backend: the same path as the public report page. v2 keeps the lead on the device until lead-intake is wired. */
async function sendReportLead(p: ReportLeadPayload, partTitle: string): Promise<"sent" | "kept"> {
  if (IS_V2) return "kept";
  const name = p.p_fields.first_name ?? "";
  const phone = p.p_fields.contact_phone ?? "";
  const subject = `דוח אישי: ${partTitle}`;
  const supabase = await loadSiteSupabase();
  const { error } = await supabase.from("contact_submissions").insert([{
    user_id: null,
    name,
    email: `${phone.replace(/\D/g, "")}@lead.seeld.co.il`,
    subject,
    message: `טלפון: ${phone}\nחלק מבוקש: ${p.locked_block}\nסיבה: ${p.p_fields.lock_reason ?? ""}\nמקור: דוח אישי (העיבוד במכשיר הלקוח; לא התקבלו קבצים).`,
  }]);
  if (error) throw error;
  try {
    await supabase.functions.invoke("send-lead-notification", {
      body: { type: "contact", leadData: { fullName: name, phone, email: `${phone.replace(/\D/g, "")}@lead.seeld.co.il`, insuranceType: subject } },
    });
  } catch { /* notification failure is non-blocking */ }
  return "sent";
}

export function InfoOrderPanel({ open, blockId, reason, onClose }: { open: boolean; blockId: string | null; reason: LockReason | null; onClose: () => void }) {
  const def = blockId ? blockDef(blockId) : undefined;
  const isFull = blockId === FULL_REPORT;
  const partTitle = isFull ? "הדוח המלא" : def?.title ?? "חלק בדוח";
  const dept: ContactDept = blockId && INSURANCE_BLOCKS.has(blockId) ? "insurance" : "general";
  const [first, setFirst] = useState("");
  const [phone, setPhone] = useState("");
  const [payload, setPayload] = useState<ReportLeadPayload | null>(null);
  const [outcome, setOutcome] = useState<"sending" | "sent" | "kept" | "failed" | null>(null);
  const valid = /^[0-9+\-\s]{7,15}$/.test(phone.trim());

  const submit = async () => {
    if (!blockId || !reason || !valid) return;
    const p = buildLeadPayload({ blockId, reason, department: dept, firstName: first, phone, note: "" }, sessionId());
    setPayload(p);
    setOutcome("sending");
    try { setOutcome(await sendReportLead(p, partTitle)); } catch { setOutcome("failed"); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) { onClose(); setPayload(null); setOutcome(null); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="rpx-overlay" />
        <Dialog.Content className="rpx-dialog" dir="rtl" aria-describedby="rpx-d-desc">
          <Dialog.Title className="rpx-d-title">{isFull ? "מעבר על הדוח עם הצוות" : "אפשר להשלים את הנתון הזה"}</Dialog.Title>
          <p id="rpx-d-desc" className="rpx-d-text">
            {isFull ? <>הצוות עובר איתכם על הדוח, משלים את החלקים שדורשים את אישורכם, ועונה על שאלות. </> : def ? <>החלק <b>{def.title}</b> לא מוצג כרגע. </> : null}
            {!isFull && reason ? WHY[reason] : ""} {!isFull && reason ? <span className="rpx-chip">{REASON_LABEL[reason]}</span> : null}
          </p>
          <div className="rpx-d-box">
            {isFull ? <b>איך זה עובד</b> : <><b>הזמנת מידע</b> <span className="rpx-soon">בקרוב</span></>}
            <p>{isFull
              ? "משאירים שם פרטי וטלפון. נשלחים רק הפרטים האלה ושם החלק המבוקש; קבצי הדוח והנתונים שבו נשארים במכשיר שלכם. אפשר גם לפנות ישירות:"
              : "הזמנת מידע היא בקשה שהצוות שלנו מגיש לגוף המנהל כדי להשלים נתונים שאינם בקבצים הציבוריים. התהליך עדיין לא פתוח, ואפשר להשאיר פרטים או לפנות אלינו ישירות:"}</p>
            <ContactIcons dept={dept} tone="dark" />
          </div>
          {!payload ? (
            <form className="rpx-form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
              <label>שם פרטי<input value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" /></label>
              <label>טלפון<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" aria-invalid={phone !== "" && !valid} /></label>
              <button type="submit" className="rpx-btn" disabled={!valid}>השארת פרטים</button>
            </form>
          ) : (
            <div className="rpx-ok" role="status">
              {outcome === "sending" && <>שולחים את הפרטים…</>}
              {outcome === "sent" && <><b>הפנייה נשלחה לצוות.</b> נשלחו רק השם, הטלפון ושם החלק המבוקש. קבצי הדוח נשארו במכשיר שלכם.</>}
              {outcome === "kept" && <><b>הפנייה הוכנה.</b> בשלב זה היא נשמרת במכשיר הזה בלבד ולא נשלחת. אפשר ליצור קשר דרך הכפתורים למעלה.</>}
              {outcome === "failed" && <><b>השליחה לא עברה.</b> אפשר לנסות שוב, או לחייג {CONTACTS[dept].phone}.</>}
              {import.meta.env.DEV && <details><summary>מטען הפנייה (dev)</summary><pre dir="ltr">{JSON.stringify(payload, null, 2)}</pre></details>}
            </div>
          )}
          <Dialog.Close className="rpx-close" aria-label="סגירה">סגירה</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
