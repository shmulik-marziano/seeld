import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, customer } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const systemPrompt = `אתה יועץ ביטוח ופיננסים מומחה בישראל. אתה מנתח מוצרים קיימים של לקוחות ומייצר המלצות מקצועיות.
כתוב בעברית מקצועית אך ברורה. התמקד בעובדות ונתונים.

החזר את התשובה בפורמט JSON בלבד עם השדות הבאים:
{
  "title": "כותרת ההמלצה (קצר וממוקד)",
  "recommendationType": "אחד מ: שימור / שינוי / ביטול / הוספה / שדרוג / החלפה / איחוד",
  "actionType": "אחד מ: החלפה / שדרוג / הוספה / שמירה / ביטול / איחוד / קביעת פגישה",
  "urgency": "אחד מ: קריטי / חשוב / אפשר להמתין",
  "currentState": "תיאור המצב הנוכחי של המוצר",
  "problemGap": "הבעיה או הפער שזוהו (אם יש)",
  "rationale": "נימוק מפורט למה ההמלצה נכונה",
  "advantages": "יתרונות הפעולה המומלצת",
  "disadvantages": "חסרונות או ויתורים",
  "improvement": "מה ישתפר עבור הלקוח",
  "recommendedCompany": "חברה מומלצת (אם רלוונטי, אחרת ריק)",
  "recommendedTrack": "מסלול מומלץ (אם רלוונטי, אחרת ריק)",
  "nextStep": "הצעד הבא המומלץ"
}`;

    const productInfo = `
מוצר: ${product.company || 'לא ידוע'} - ${product.productType || product.category}
קטגוריה: ${product.category}
מספר פוליסה: ${product.policyNumber || 'לא ידוע'}
${product.category === 'ביטוח' ? `פרמיה חודשית: ${product.monthlyPremium ? `₪${product.monthlyPremium}` : 'לא ידוע'}` : `הפקדה חודשית: ${product.monthlyDeposit ? `₪${product.monthlyDeposit}` : 'לא ידוע'}`}
צבירה: ${product.accumulation ? `₪${product.accumulation.toLocaleString()}` : 'לא ידוע'}
דמי ניהול הפקדה: ${product.managementFeeDeposit ? `${product.managementFeeDeposit}%` : 'לא ידוע'}
דמי ניהול צבירה: ${product.managementFeeAccumulation ? `${product.managementFeeAccumulation}%` : 'לא ידוע'}
מסלול: ${product.track || 'לא ידוע'}
סטטוס: ${product.phase || 'פעיל'}
`;

    const customerInfo = customer ? `
לקוח: ${customer.fullName || ''}
גיל: ${customer.birthDate ? Math.floor((Date.now() - new Date(customer.birthDate).getTime()) / 31557600000) : 'לא ידוע'}
מצב משפחתי: ${customer.maritalStatus || 'לא ידוע'}
עיסוק: ${customer.occupation || 'לא ידוע'}
` : '';

    const userContent = `${systemPrompt}\n\nנתח את המוצר הבא וכתוב המלצה מקצועית:\n${productInfo}\n${customerInfo}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userContent }] }],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד דקה" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");
    
    const recommendation = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
