import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadNotificationRequest {
  type: 'insurance' | 'pension' | 'contact';
  leadData: {
    fullName: string;
    phone: string;
    email: string;
    insuranceType?: string;
    focusArea?: string;
    // Optional context from specific forms (e.g. retirement planning): short key/value strings.
    extra?: Record<string, string>;
  };
}

const extraLabels: Record<string, string> = {
  source: 'מקור',
  ageRange: 'טווח גיל',
  situation: 'מצב',
  concern: 'מה מטריד',
};

const insuranceTypeLabels: Record<string, string> = {
  vehicle: 'ביטוח רכב',
  home: 'ביטוח דירה',
  business: 'ביטוח עסקים',
  travel: 'ביטוח נסיעות לחו"ל',
  dental: 'ביטוח שיניים',
  disability: 'ביטוח אובדן כושר עבודה',
  foreign_workers: 'ביטוח עובדים זרים',
  nursing: 'ביטוח סיעודי',
  health: 'ביטוח בריאות',
  life: 'ביטוח חיים',
  mortgage: 'ביטוח משכנתא',
  critical_illness: 'ביטוח מחלות קשות',
  personal_accidents: 'ביטוח תאונות אישיות',
  partners_risk: 'ביטוח שותפים',
  renters: 'ביטוח שוכרים',
};

const focusAreaLabels: Record<string, string> = {
  pension: 'קרנות פנסיה',
  savings: 'חיסכון',
  investment: 'השקעות',
  retirement: 'פרישה',
  general: 'ניתוח כללי',
};

async function sendEmail(to: string[], subject: string, html: string, cc?: string[]) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "SeelD <noreply@seeld-ins.co.il>",
      to,
      ...(cc && cc.length ? { cc } : {}),
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${errorText}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, leadData }: LeadNotificationRequest = await req.json();

    // Sanitize function to prevent HTML injection
    const sanitize = (str: string) => str.replace(/[<>&"']/g, (c) => {
      const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
      return map[c] || c;
    });

    console.log('Received lead notification request:', { type });

    // Validate required fields
    if (!type || !['insurance', 'pension', 'contact'].includes(type)) {
      throw new Error("Invalid type");
    }
    if (!leadData || !leadData.fullName || !leadData.phone || !leadData.email) {
      throw new Error("Missing required fields");
    }
    if (typeof leadData.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
      throw new Error("Invalid email");
    }
    if (typeof leadData.fullName !== "string" || leadData.fullName.length > 200) {
      throw new Error("Invalid name");
    }
    if (typeof leadData.phone !== "string" || leadData.phone.length > 20) {
      throw new Error("Invalid phone");
    }

    const subject = type === 'insurance'
      ? `ליד חדש לביטוח - ${insuranceTypeLabels[leadData.insuranceType || ''] || leadData.insuranceType}`
      : type === 'pension'
        ? `ליד חדש לניתוח פנסיוני - ${focusAreaLabels[leadData.focusArea || ''] || 'כללי'}`
        : `פנייה חדשה מהאתר - ${sanitize(leadData.fullName)}`;

    // Route emails by relevance (all addresses overridable by env vars, no redeploy of code needed):
    //   insurance leads (type "insurance", a known insuranceType, or a contact subject about
    //   insurance / travel)        -> LEAD_TO_INSURANCE  (default Moshe@seeld.info)
    //   pension / financial analysis -> LEAD_TO_FINANCE   (default Shmulik@seeld.info)
    //   general contact, everything else -> LEAD_TO_GENERAL (default Shmulik@seeld.info)
    // Transition CC: while LEAD_CC_TRANSITION is not "false"/"0"/"off", the previously used
    // address is kept in CC so no lead is lost during the move to the new mailboxes.
    // Owner: set LEAD_CC_TRANSITION=false in the Supabase function secrets to switch it off.
    const insType = (leadData.insuranceType || '').trim();
    const isInsuranceLead = type === 'insurance'
      || (insType !== '' && (insType in insuranceTypeLabels || (type === 'contact' && /ביטוח|נסיעות|נסיעה/.test(insType))));

    const env = (k: string, d: string) => (Deno.env.get(k) || d).trim();
    const toInsurance = env('LEAD_TO_INSURANCE', 'Moshe@seeld.info');
    const toFinance = env('LEAD_TO_FINANCE', 'Shmulik@seeld.info');
    const toGeneral = env('LEAD_TO_GENERAL', 'Shmulik@seeld.info');
    const ccTransition = !['false', '0', 'off', 'no'].includes((Deno.env.get('LEAD_CC_TRANSITION') ?? 'true').trim().toLowerCase());

    const notificationRecipient = isInsuranceLead ? toInsurance : type === 'pension' ? toFinance : toGeneral;
    // Previously used addresses: shmulik@seeld-ins.co.il (insurance/pension), info@seeld-ins.co.il (contact).
    const previousRecipient = isInsuranceLead || type === 'pension'
      ? env('LEAD_CC_PREV_HOT', 'shmulik@seeld-ins.co.il')
      : env('LEAD_CC_PREV_CONTACT', 'info@seeld-ins.co.il');
    const notificationCc = ccTransition && previousRecipient.toLowerCase() !== notificationRecipient.toLowerCase()
      ? [previousRecipient]
      : undefined;

    // Optional extra context (sanitised, whitelisted keys, length-capped).
    const extraRows = leadData.extra && typeof leadData.extra === 'object'
      ? Object.entries(extraLabels)
          .map(([k, label]) => {
            const v = (leadData.extra as Record<string, unknown>)[k];
            return typeof v === 'string' && v.trim()
              ? `<p><strong>${label}:</strong> ${sanitize(v.trim().slice(0, 200))}</p>`
              : '';
          })
          .join('')
      : '';

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1a1a2e;">ליד חדש התקבל ב-SeelD</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">פרטי הפנייה</h2>
          <p><strong>סוג:</strong> ${type === 'insurance' ? 'ביטוח' : type === 'pension' ? 'ניתוח פנסיוני' : 'פנייה כללית'}</p>
          ${type === 'insurance' && leadData.insuranceType ? `
            <p><strong>סוג ביטוח:</strong> ${insuranceTypeLabels[leadData.insuranceType] || leadData.insuranceType}</p>
          ` : ''}
          ${type === 'pension' && leadData.focusArea ? `
            <p><strong>תחום:</strong> ${focusAreaLabels[leadData.focusArea] || leadData.focusArea}</p>
          ` : ''}
          ${extraRows}
        </div>
        
        <div style="background: #e8f4f8; padding: 20px; border-radius: 8px;">
          <h2 style="margin-top: 0;">פרטי לקוח</h2>
          <p><strong>שם:</strong> ${sanitize(leadData.fullName)}</p>
          <p><strong>טלפון:</strong> <a href="tel:${encodeURIComponent(leadData.phone)}">${sanitize(leadData.phone)}</a></p>
          <p><strong>אימייל:</strong> <a href="mailto:${encodeURIComponent(leadData.email)}">${sanitize(leadData.email)}</a></p>
        </div>
        
        <p style="margin-top: 20px; color: #666;">
          הפנייה התקבלה ב-${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        </p>
      </div>
    `;

    // Send notification email to the relevant recipient
    const emailResponse = await sendEmail(
      [notificationRecipient],
      subject,
      htmlContent,
      notificationCc
    );

    console.log("Lead notification email sent successfully:", emailResponse);

    // Also send confirmation to the lead
    const confirmationHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1a1a2e;">תודה על פנייתך ל-SeelD!</h1>
        
        <p>שלום ${leadData.fullName},</p>
        
        <p>קיבלנו את פרטייך בהצלחה. ${
          type === 'insurance'
            ? 'נציג ביטוח מומחה ייצור איתך קשר בהקדם עם הצעה מותאמת אישית.'
            : type === 'pension'
              ? 'הצוות שלנו ייצור איתך קשר בהקדם לשיחת היכרות ראשונה ולתיאום המשך. השירות הוא שיווק פנסיוני ולא ייעוץ פנסיוני.'
              : 'נחזור אליך בהקדם האפשרי.'
        }</p>
        
        <p>בינתיים, אתה מוזמן לעיין במידע נוסף באתר שלנו.</p>
        
        <p>בברכה,<br/>צוות SeelD פיננסים וביטוח</p>
      </div>
    `;

    try {
      await sendEmail(
        [leadData.email],
        "תודה על פנייתך ל-SeelD",
        confirmationHtml
      );
      console.log("Confirmation email sent to lead");
    } catch (confirmError) {
      console.error("Failed to send confirmation email:", confirmError);
      // Don't fail the whole request if confirmation fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-lead-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
