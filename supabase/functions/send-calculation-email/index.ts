import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalculationEmailRequest {
  to: string;
  calculatorType: string;
  title: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  tips?: string[];
}

const calculatorTypeLabels: Record<string, string> = {
  mortgage: "משכנתא",
  pension: "פנסיה",
  savings: "חיסכון",
  goal: "יעד פיננסי",
  compare: "השוואת מסלולים",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatResultsToHtml = (calculatorType: string, resultData: Record<string, unknown>): string => {
  const rows: string[] = [];
  
  switch (calculatorType) {
    case "mortgage":
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">החזר חודשי</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${formatCurrency(resultData.monthlyPayment as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">סה"כ תשלום</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatCurrency(resultData.totalPayment as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">סה"כ ריבית</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626;">${formatCurrency(resultData.totalInterest as number)}</td></tr>`);
      break;
    case "pension":
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">פנסיה חודשית צפויה</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${formatCurrency(resultData.monthlyPension as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">סה"כ חיסכון בפרישה</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatCurrency(resultData.totalSavings as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">רווחי השקעה</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">${formatCurrency(resultData.totalReturns as number)}</td></tr>`);
      break;
    case "savings":
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">סה"כ חיסכון</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${formatCurrency(resultData.totalSavings as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">סה"כ הפקדות</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatCurrency(resultData.totalDeposits as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">רווחי ריבית</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #16a34a;">${formatCurrency(resultData.totalInterest as number)}</td></tr>`);
      break;
    case "goal":
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">צריך להפקיד בחודש</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${formatCurrency(resultData.monthlyNeeded as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">צבירה נדרשת</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatCurrency(resultData.totalNeeded as number)}</td></tr>`);
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">פער לגישור</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #f59e0b;">${formatCurrency(resultData.gap as number)}</td></tr>`);
      break;
    case "compare":
      rows.push(`<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">הפרש בין מניות לאג"ח</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #2563eb;">${formatCurrency((resultData.maxProfit as number) - (resultData.minProfit as number))}</td></tr>`);
      break;
  }
  
  return rows.join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body = await req.json();
    const { to, calculatorType, title, inputData, resultData, tips } = body as CalculationEmailRequest;

    // Input validation
    if (!to || typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!calculatorType || typeof calculatorType !== "string" || calculatorType.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid calculator type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resultData || typeof resultData !== "object") {
      return new Response(JSON.stringify({ error: "Missing result data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize function to prevent HTML injection
    const sanitize = (str: string) => str.replace(/[<>&"']/g, (c) => {
      const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
      return map[c] || c;
    });

    const typeLabel = calculatorTypeLabels[calculatorType] || sanitize(calculatorType);
    const resultsHtml = formatResultsToHtml(calculatorType, resultData);
    const safeTitle = title ? sanitize(String(title).slice(0, 200)) : new Date().toLocaleDateString("he-IL");
    
    const tipsHtml = tips && Array.isArray(tips) && tips.length > 0
      ? `<div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #0369a1; font-size: 14px;">💡 טיפים</h3>
          <ul style="margin: 0; padding-right: 20px; color: #334155;">
            ${tips.slice(0, 10).map(tip => `<li style="margin-bottom: 5px;">${sanitize(String(tip).slice(0, 500))}</li>`).join("")}
          </ul>
        </div>`
      : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px;">SeelD - תוצאות חישוב</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">מחשבון ${typeLabel}: ${safeTitle}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                ${resultsHtml}
              </tbody>
            </table>
            
            ${tipsHtml}
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                נשלח מ-SeelD | המחשבון הפיננסי שלך
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SeelD <noreply@seeld-ins.co.il>",
        to: [to],
        subject: `תוצאות חישוב ${typeLabel} - SeelD`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send email");
    }

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
