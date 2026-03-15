import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const fieldTools = [
  {
    type: "function" as const,
    function: {
      name: "update_correction_fields",
      description:
        "Update one or more correction fields in the current document. Use this when the user asks to change, set, or update any field value. You can update multiple fields at once.",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            description: "List of field updates to apply",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                  enum: [
                    "customerName",
                    "idNumber",
                    "policyNumber",
                    "company",
                    "productType",
                    "startDate",
                    "endDate",
                    "coverageAmount",
                    "monthlyPremium",
                    "beneficiaries",
                    "additionalNotes",
                  ],
                  description: "The field key to update",
                },
                value: {
                  type: "string",
                  description: "The new value for the field",
                },
              },
              required: ["field", "value"],
              additionalProperties: false,
            },
          },
        },
        required: ["updates"],
        additionalProperties: false,
      },
    },
  },
];

const fieldLabels: Record<string, string> = {
  customerName: "שם לקוח",
  idNumber: "תעודת זהות",
  policyNumber: "מספר פוליסה",
  company: "חברת ביטוח",
  productType: "סוג מוצר",
  startDate: "תאריך התחלה",
  endDate: "תאריך סיום",
  coverageAmount: "סכום כיסוי",
  monthlyPremium: "פרמיה חודשית",
  beneficiaries: "מוטבים",
  additionalNotes: "הערות נוספות",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, messages: userMessages } = await req.json();
    if (!userMessages?.length) {
      throw new Error("messages are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const aiHeaders = {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    };
    const aiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";

    let systemPrompt: string;
    const useTools = !!jobId;

    if (jobId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: job, error: jobError } = await supabase
        .from("correction_jobs")
        .select(
          "*, pdage_customers(full_name, id_number), deficiency_categories(name), deficiency_bank(title, description)"
        )
        .eq("id", jobId)
        .single();

      if (jobError || !job) throw new Error("Job not found");

      const customer = job.pdage_customers as any;
      const category = job.deficiency_categories as any;
      const deficiency = job.deficiency_bank as any;
      const deficiencyText = deficiency
        ? `${deficiency.title} — ${deficiency.description || ""}`
        : job.free_text_deficiency || "לא צוין";

      // Include current field values for context
      const currentFields = (job.correction_fields as Record<string, string>) || {};
      const fieldsContext = Object.entries(currentFields)
        .filter(([_, v]) => v)
        .map(([k, v]) => `  - ${fieldLabels[k] || k}: ${v}`)
        .join("\n");

      systemPrompt = `אתה עוזר AI מומחה לעריכת מסמכים פיננסיים וביטוחיים בישראל. שמך "pDage AI".

**הקשר העבודה הנוכחית:**
- קובץ: ${job.original_file_name} (${job.file_type.toUpperCase()})
- לקוח: ${customer?.full_name || "לא צוין"} | ת.ז: ${customer?.id_number || "לא צוין"}
- קטגוריית חוסר: ${category?.name || "לא צוינה"}
- חוסר שנבחר: ${deficiencyText}
- סטטוס: ${job.status}
${job.planned_fix_summary ? `- תיקון מתוכנן: ${job.planned_fix_summary}` : ""}

**ערכי השדות הנוכחיים:**
${fieldsContext || "  (אין שדות מלאים עדיין)"}

**ההנחיות שלך:**
1. עזור למשתמש להבין מה בדיוק צריך לתקן במסמך
2. הצע פתרונות מדויקים וברורים
3. תן הוראות שלב-אחרי-שלב לתיקון
4. **חשוב:** כשהמשתמש מבקש לשנות/לעדכן ערך של שדה — השתמש בכלי update_correction_fields כדי לבצע את השינוי ישירות
5. ענה תמיד בעברית, בסגנון מקצועי אך ידידותי
6. השתמש בפורמט markdown לתשובות מובנות
7. אם אתה לא בטוח — אמור את זה. אל תמציא מידע רגולטורי.

**דוגמאות לשימוש בכלי:**
- "שנה את מספר הפוליסה ל-12345" → קרא ל-update_correction_fields עם policyNumber=12345
- "עדכן את שם הלקוח לישראל ישראלי ואת החברה למגדל" → קרא ל-update_correction_fields עם שני עדכונים
- "הכנס תאריך התחלה 01/01/2024" → קרא ל-update_correction_fields עם startDate=01/01/2024`;
    } else {
      systemPrompt = `אתה "pDage AI" — עוזר AI מומחה לסוכני ביטוח ופיננסים בישראל.

**מי אתה:**
אתה חלק ממערכת pDage — כלי חכם לזיהוי ותיקון ליקויים (חוסרים) במסמכים ביטוחיים ופיננסיים.

**היכולות שלך:**
1. **שאלות מקצועיות** — ענה על שאלות בנושאי ביטוח, פנסיה, גמל, השקעות, רגולציה ותקנות בישראל
2. **ניווט במערכת** — עזור לסוכן להבין איך להשתמש ב-pDage
3. **הסברים רגולטוריים** — הסבר דרישות רגולטוריות, חוזרי רשות שוק ההון, ותקנות ביטוח
4. **טיפים מקצועיים** — ייעוץ על תהליכי עבודה ו-best practices

**כללי התנהלות:**
- ענה תמיד בעברית, בסגנון מקצועי אך ידידותי וחם
- השתמש בפורמט markdown
- אם אתה לא בטוח — אמור את זה
- תשובות קצרות ותכליתיות

**פורמט הפניות למערכת:**
כשאתה מפנה לפעולה, כתוב: [טקסט](navigation:path)
לדוגמה: [העלה מסמך חדש](navigation:/pdage/upload)`;
    }

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...userMessages,
    ];

    if (useTools) {
      // Step 1: Non-streaming call with tools to detect field updates
      const toolResponse = await fetch(aiUrl, {
        method: "POST",
        headers: aiHeaders,
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          tools: fieldTools,
          tool_choice: "auto",
          stream: false,
        }),
      });

      if (!toolResponse.ok) {
        return handleAiError(toolResponse);
      }

      const toolData = await toolResponse.json();
      const choice = toolData.choices?.[0];
      const msg = choice?.message;

      if (msg?.tool_calls?.length) {
        // Tool was called — extract field updates
        const toolCall = msg.tool_calls[0];
        let updates: { field: string; value: string }[] = [];
        try {
          const args = JSON.parse(toolCall.function.arguments);
          updates = args.updates || [];
        } catch {
          updates = [];
        }

        // Build confirmation messages for second call
        const updateSummary = updates
          .map((u: any) => `${fieldLabels[u.field] || u.field}: "${u.value}"`)
          .join(", ");

        const confirmMessages = [
          ...allMessages,
          msg,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: `השדות עודכנו בהצלחה: ${updateSummary}`,
          },
        ];

        // Step 2: Streaming call for the confirmation text
        const streamResponse = await fetch(aiUrl, {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: confirmMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          return handleAiError(streamResponse);
        }

        // Create a combined stream: field_updates event + text stream
        const encoder = new TextEncoder();
        const fieldUpdateEvent = `data: ${JSON.stringify({ field_updates: updates })}\n\n`;

        const combinedStream = new ReadableStream({
          async start(controller) {
            // Send field updates event first
            controller.enqueue(encoder.encode(fieldUpdateEvent));

            // Then pipe the AI stream
            const reader = streamResponse.body!.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(combinedStream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // No tool call — AI responded with text only
      // Stream the content as if it were streamed (re-request with streaming)
      if (msg?.content) {
        const streamResponse = await fetch(aiUrl, {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: allMessages,
            stream: true,
          }),
        });

        if (!streamResponse.ok) {
          return handleAiError(streamResponse);
        }

        return new Response(streamResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    // General mode (no jobId) — simple streaming
    const response = await fetch(aiUrl, {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      return handleAiError(response);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("pdage-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "שגיאה לא ידועה",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleAiError(response: Response) {
  if (response.status === 429) {
    return new Response(
      JSON.stringify({
        error: "המערכת עמוסה כרגע, נסה שוב בעוד מספר שניות",
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  if (response.status === 402) {
    return new Response(
      JSON.stringify({ error: "נדרש חידוש מנוי AI" }),
      {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  const t = await response.text();
  console.error("AI gateway error:", response.status, t);
  throw new Error("שגיאה בשירות ה-AI");
}
