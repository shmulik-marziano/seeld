import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "SeelD <noreply@seeld-ins.co.il>",
      to,
      subject,
      html,
    }),
  });
  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Resend error: ${txt}`);
  }
  return response.json();
}

// Sanitize to prevent HTML injection
function sanitize(str: string): string {
  return str.replace(/[<>&"']/g, (c) => {
    const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
    return map[c] || c;
  });
}

function field(label: string, value: string | null | undefined) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:7px 14px;background:#f8f6f2;font-size:12px;color:#666;white-space:nowrap;border-bottom:1px solid #e8e4dc;width:40%;">${sanitize(label)}</td>
      <td style="padding:7px 14px;font-size:13px;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e8e4dc;">${sanitize(value)}</td>
    </tr>`;
}

function section(title: string, rows: string) {
  const filtered = rows.replace(/\n\s*\n/g, "\n").trim();
  if (!filtered) return "";
  return `
    <tr>
      <td style="padding:20px 32px 8px;">
        <h2 style="margin:0 0 10px;font-size:14px;color:#1a1a1a;border-bottom:2px solid #e8e4dc;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">${title}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e8e4dc;">
          ${filtered}
        </table>
      </td>
    </tr>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formData } = await req.json();
    const f = formData as Record<string, unknown>;

    // Detect if this is a standalone direct debit submission
    const isDirectDebit = f.type === "direct_debit" && !f.firstName;

    if (isDirectDebit) {
      const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
      const ddHtml = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a1a;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">SeelD – הוראת קבע חדשה</h1>
            <p style="margin:6px 0 0;color:#aaa;font-size:13px;">התקבל טופס הו"ק | ${now}</p>
          </td>
        </tr>
        ${section('פרטי בעל החשבון', `
          ${field('שם בעל החשבון', String(f.ddAccountOwner ?? ""))}
          ${field('מספר ת"ז', String(f.ddIdNumber ?? ""))}
        `)}
        ${section('פרטי בנק', `
          ${field('בנק', String(f.ddBankName ?? ""))}
          ${field('מספר סניף', String(f.ddBranchNumber ?? ""))}
          ${field('שם סניף', String(f.ddBranchName ?? ""))}
          ${field('מספר חשבון', String(f.ddAccountNumber ?? ""))}
          ${field('יום חיוב מועדף', f.ddDebitDay ? `${f.ddDebitDay} בחודש` : "")}
        `)}
        <tr>
          <td style="background:#f8f6f2;padding:20px 32px;text-align:center;border-top:1px solid #e8e4dc;">
            <p style="margin:0;font-size:12px;color:#999;">SeelD Finance & Insurance | שמוליק מרציאנו | סוכן ביטוח ופנסיה מוסמך</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await sendEmail(
        ["info@seeld-ins.co.il"],
        `הוראת קבע חדשה – ${f.ddAccountOwner ?? "לקוח"}`,
        ddHtml
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Original onboarding flow
    const fullName = `${f.firstName ?? ""} ${f.lastName ?? ""}`.trim();
    const address = [f.street, f.houseNumber, f.city, f.postalCode].filter(Boolean).join(", ");
    const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
    const bool = (v: unknown) => v ? "✓ כן" : "✗ לא";
    const arr = (v: unknown) => Array.isArray(v) ? (v as string[]).join(", ") : (v ? String(v) : "");

    const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a1a;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">SeelD – שאלון הצטרפות</h1>
            <p style="margin:6px 0 0;color:#aaa;font-size:13px;">פתיחת תיק לקוח חדש | ${now}</p>
          </td>
        </tr>

        ${section("פרטים אישיים", `
          ${field("שם מלא", fullName)}
          ${field("מספר זהות", String(f.idNumber ?? ""))}
          ${field("תאריך לידה", String(f.birthDate ?? ""))}
          ${field('תאריך הנפקת ת"ז', String(f.idIssueDate ?? ""))}
          ${field("ארץ לידה", String(f.birthCountry ?? ""))}
          ${field("שנת עלייה", String(f.immigrationYear ?? ""))}
          ${field("אזרחות נוספת", String(f.additionalCitizenship ?? ""))}
          ${field("מין", String(f.gender ?? ""))}
          ${field("גיל", String(f.calculatedAge ?? ""))}
          ${field("מצב משפחתי", String(f.maritalStatus ?? ""))}
          ${field("מספר ילדים", String(f.childrenCount ?? ""))}
          ${field("גילאי ילדים", String(f.childrenAges ?? ""))}
        `)}

        ${section("פרטי קשר", `
          ${field("טלפון", String(f.phone ?? ""))}
          ${field("טלפון נוסף", String(f.phoneSecondary ?? ""))}
          ${field('דוא"ל', String(f.email ?? ""))}
          ${field("כתובת", address)}
          ${field("דרך יצירת קשר מועדפת", arr(f.preferredContact))}
        `)}

        ${section("עיסוק", `
          ${field("מעמד תעסוקתי", Array.isArray(f.employmentStatus) ? (f.employmentStatus as string[]).join(", ") : String(f.employmentStatus ?? ""))}
          ${field("הכנסה שנתית", String(f.annualIncome ?? ""))}
          ${field("מקצוע", String(f.profession ?? ""))}
          ${field("שם מעסיק", String(f.employerName ?? ""))}
          ${field("ותק בעבודה", String(f.workSeniority ?? ""))}
          ${field("הכנסה נוספת", String(f.additionalIncome ?? ""))}
        `)}

        ${section("בריאות", `
          ${field("קופת חולים", String(f.healthFund ?? ""))}
          ${field("ביטוח משלים", String(f.supplementalInsurance ?? ""))}
          ${field("מעשן/ת", f.smoker !== undefined && f.smoker !== null ? bool(f.smoker) : "")}
          ${field("סיגריות ביום", String(f.cigarettesPerDay ?? ""))}
          ${field('גובה (ס"מ)', String(f.heightCm ?? ""))}
          ${field('משקל (ק"ג)', String(f.weightKg ?? ""))}
          ${field("BMI", String(f.bmi ?? ""))}
        `)}

        ${section('בן/בת זוג', `
          ${field('יש בן/בת זוג', f.hasSpouse !== undefined ? bool(f.hasSpouse) : "")}
          ${field('שם בן/בת זוג', String(f.spouseName ?? ""))}
          ${field('תאריך לידה בן/בת זוג', String(f.spouseBirthDate ?? ""))}
          ${field('טלפון בן/בת זוג', String(f.spousePhone ?? ""))}
          ${field('דוא"ל בן/בת זוג', String(f.spouseEmail ?? ""))}
          ${field('קופ"ח בן/בת זוג', String(f.spouseHealthFund ?? ""))}
          ${field('ביטוח משלים בן/בת זוג', String(f.spouseSupplemental ?? ""))}
          ${field('תעסוקת בן/בת זוג', String(f.spouseEmployment ?? ""))}
          ${field('מקצוע בן/בת זוג', String(f.spouseProfession ?? ""))}
        `)}

        ${section("פרטי בנק", `
          ${field("שם בנק", String(f.bankName ?? ""))}
          ${field("סניף", String(f.bankBranch ?? ""))}
          ${field("מספר חשבון", String(f.bankAccount ?? ""))}
          ${field("סוג חשבון", String(f.accountType ?? ""))}
          ${field("בעל החשבון", String(f.accountOwner ?? ""))}
          ${field("בעלים משותף", String(f.coOwnerName ?? ""))}
          ${field("הערות בנק", String(f.bankNotes ?? ""))}
        `)}

        ${section('פרטי הו"ק', `
          ${field('שם בעל חשבון', String(f.ddAccountOwner ?? f.accountOwner ?? ""))}
          ${field('שם בנק', String(f.ddBankName ?? ""))}
          ${field('מספר חשבון', String(f.ddAccountNumber ?? ""))}
          ${field('יום חיוב מועדף', f.ddDebitDay ? `${f.ddDebitDay} בחודש` : "")}
        `)}

        ${section("העדפות ותחומי עניין", `
          ${field("תחומי עניין", arr(f.interests))}
          ${field("עדיפות", String(f.priorityPreference ?? ""))}
          ${field("תקציב חודשי", String(f.monthlyBudget ?? ""))}
          ${field("סיבת פנייה", String(f.referralReason ?? ""))}
          ${field("אופן משלוח סיכום", arr(f.summaryDelivery))}
        `)}

        ${section("הרשאות שאושרו", `
          ${field("נספח א׳ – סליקה פנסיונית", f.consentPensionClearinghouse ? "✓ אושר" : "✗ לא אושר")}
          ${field("נספח ה׳ – הר הביטוח", f.consentInsuranceMountain ? "✓ אושר" : "✗ לא אושר")}
          ${field("נספח ב׳ – פוליסות ביטוח", f.consentPolicies ? "✓ אושר" : "✗ לא אושר")}
          ${field("הסכמה לשימוש בנתונים", f.dataConsent ? "✓ אושר" : "✗ לא אושר")}
          ${field('הסכמה לדו"ח ביטוח', f.insuranceReportConsent ? "✓ אושר" : "✗ לא אושר")}
        `)}

        <!-- Signature -->
        <tr>
          <td style="padding:16px 32px 28px;">
            <h2 style="margin:0 0 12px;font-size:14px;color:#1a1a1a;border-bottom:2px solid #e8e4dc;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">חתימה דיגיטלית</h2>
            ${f.signature
              ? `<img src="${f.signature}" alt="חתימה" style="max-height:80px;border:1px solid #e8e4dc;border-radius:8px;" />`
              : "<p style='color:#999;font-size:12px;margin:0;'>לא נמצאה חתימה</p>"
            }
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f6f2;padding:20px 32px;text-align:center;border-top:1px solid #e8e4dc;">
            <p style="margin:0;font-size:12px;color:#999;">SeelD Finance & Insurance | שמוליק מרציאנו | סוכן ביטוח ופנסיה מוסמך</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send to agent
    await sendEmail(
      ["info@seeld-ins.co.il"],
      `תיק לקוח חדש – ${fullName}`,
      html
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("send-onboarding-summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
