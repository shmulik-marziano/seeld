// Opens when a locked block is pressed: explains what is missing, shows the department contact icons and a small lead form.
// The payload matches save_lead (origin 'report' + locked_block). It is prepared in memory only: nothing is sent yet.
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { ContactIcons } from "@/components/sd/ContactIcons";
import type { ContactDept } from "@/lib/contacts";
import { WHY, blockDef } from "@/reports/blocks";
import { buildLeadPayload, type ReportLeadPayload } from "@/reports/lead";
import type { LockReason } from "@/reports/types";
import { REASON_LABEL } from "@/reports/components/LockedBlock";

const INSURANCE_BLOCKS = new Set(["coverage-amounts", "policy-details", "coverage-cards", "premium-summary"]);
const sessionId = () => { try { return sessionStorage.getItem("rp-sid") ?? (sessionStorage.setItem("rp-sid", Math.random().toString(36).slice(2)), sessionStorage.getItem("rp-sid") ?? "s"); } catch { return "s"; } };

export function InfoOrderPanel({ open, blockId, reason, onClose }: { open: boolean; blockId: string | null; reason: LockReason | null; onClose: () => void }) {
  const def = blockId ? blockDef(blockId) : undefined;
  const dept: ContactDept = blockId && INSURANCE_BLOCKS.has(blockId) ? "insurance" : "general";
  const [first, setFirst] = useState("");
  const [phone, setPhone] = useState("");
  const [payload, setPayload] = useState<ReportLeadPayload | null>(null);
  const valid = /^[0-9+\-\s]{7,15}$/.test(phone.trim());

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) { onClose(); setPayload(null); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="rpx-overlay" />
        <Dialog.Content className="rpx-dialog" dir="rtl" aria-describedby="rpx-d-desc">
          <Dialog.Title className="rpx-d-title">אפשר להשלים את הנתון הזה</Dialog.Title>
          <p id="rpx-d-desc" className="rpx-d-text">
            {def ? <>החלק <b>{def.title}</b> לא מוצג כרגע. </> : null}
            {reason ? WHY[reason] : ""} {reason ? <span className="rpx-chip">{REASON_LABEL[reason]}</span> : null}
          </p>
          <div className="rpx-d-box">
            <b>הזמנת מידע</b> <span className="rpx-soon">בקרוב</span>
            <p>הזמנת מידע היא בקשה שהצוות שלנו מגיש לגוף המנהל כדי להשלים נתונים שאינם בקבצים הציבוריים. התהליך עדיין לא פתוח, ואפשר להשאיר פרטים או לפנות אלינו ישירות:</p>
            <ContactIcons dept={dept} tone="dark" />
          </div>
          {!payload ? (
            <form className="rpx-form" onSubmit={(e) => { e.preventDefault(); if (!blockId || !reason || !valid) return; setPayload(buildLeadPayload({ blockId, reason, department: dept, firstName: first, phone, note: "" }, sessionId())); }}>
              <label>שם פרטי<input value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" /></label>
              <label>טלפון<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" aria-invalid={phone !== "" && !valid} /></label>
              <button type="submit" className="rpx-btn" disabled={!valid}>השארת פרטים</button>
            </form>
          ) : (
            <div className="rpx-ok" role="status">
              <b>הפנייה הוכנה.</b> בשלב זה היא נשמרת במכשיר הזה בלבד ולא נשלחת. עד שהתהליך ייפתח, אפשר ליצור קשר דרך הכפתורים למעלה.
              {import.meta.env.DEV && <details><summary>מטען הפנייה (dev)</summary><pre dir="ltr">{JSON.stringify(payload, null, 2)}</pre></details>}
            </div>
          )}
          <Dialog.Close className="rpx-close" aria-label="סגירה">סגירה</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
