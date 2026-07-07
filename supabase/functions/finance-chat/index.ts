import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Token discipline: the model never needs more than a short, focused answer,
// and it never needs more than the recent turns to give one.
const MODEL = "gemini-2.0-flash"; // no thinking tokens — cheapest capable tier
const MAX_OUTPUT_TOKENS = 500;
const HISTORY_WINDOW = 12; // last N turns sent to the model
const MAX_CONTENT_CHARS = 2000;

const systemPrompt = `אתה הסוכן החכם של SEELD — בית פיננסים וביטוח ישראלי (מבית עמיתים הון, בפיקוח רשות שוק ההון).
אתה עוזר ללקוחות ומתעניינים בנושאי:
- ביטוח בריאות, חיים, רכב ודירה
- פנסיה, קרנות השתלמות וקופות גמל
- חיסכון, השקעות ותכנון פיננסי
- מיצוי זכויות והחזרי מס

הנחיות:
- ענה בעברית תקנית, ידידותית וברורה
- תשובות קצרות וממוקדות: 2-3 משפטים, בלי הקדמות
- בלי אימוג'ים ובלי סימנים מקושטים — טקסט נקי בלבד
- אל תיתן המלצה אישית על מוצר ספציפי; הסבר עקרונות, ולשאלות אישיות הפנה לפגישה עם יועץ: "הפגישה הראשונה על חשבוננו"
- אם אינך בטוח — אמור זאת במפורש, אל תמציא נתונים או תשואות
- אפשר להפנות לכלים באתר: מחשבונים (/calculators), השוואת קופות (/fund-finder), טבלאות תשואות (/return-tables), צור קשר (/contact)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (!msg || typeof msg.role !== "string" || typeof msg.content !== "string" || msg.content.length > 5000) {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Window + clamp history server-side so long conversations cannot inflate cost
    const windowed = messages.slice(-HISTORY_WINDOW).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.length > MAX_CONTENT_CHARS ? m.content.slice(0, MAX_CONTENT_CHARS) : m.content,
    }));

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    if (!GOOGLE_AI_API_KEY) {
      console.error("GOOGLE_AI_API_KEY is not configured");
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    console.log("Gemini request:", windowed.length, "of", messages.length, "messages");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...windowed,
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.4,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד מספר שניות" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "שגיאה בשירות הבינה המלאכותית" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("finance-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
