import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, fields } = await req.json();
    if (!jobId || !fields) throw new Error("jobId and fields are required");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job context
    const { data: job } = await supabase
      .from("correction_jobs")
      .select("*, deficiency_categories(name), deficiency_bank(title, description)")
      .eq("id", jobId)
      .single();

    const deficiency = job?.deficiency_bank as any;
    const category = job?.deficiency_categories as any;

    const systemPrompt = `אתה מומחה לבדיקת תקינות מסמכים ביטוחיים ופיננסיים בישראל.
תפקידך לבדוק שכל השדות מלאים ותקינים ושהחוסר שזוהה תוקן.
החזר תשובה אך ורק בפורמט JSON הבא, ללא טקסט נוסף:
{"score": <מספר 0-100>, "warnings": ["אזהרה 1", "אזהרה 2"]}

כללי ציון:
- 100: הכל מלא ותקין, החוסר תוקן
- 80-99: תקין עם הערות קטנות
- 50-79: חסרים שדות חשובים או החוסר לא תוקן במלואו
- 0-49: חסרים שדות קריטיים, המסמך לא מוכן`;

    const userPrompt = `בדוק את השדות הבאים של מסמך מתוקן:

שדות:
${JSON.stringify(fields, null, 2)}

חוסר שזוהה:
קטגוריה: ${category?.name || "לא צוינה"}
חוסר: ${deficiency?.title || job?.free_text_deficiency || "לא צוין"}
${deficiency?.description ? `תיאור: ${deficiency.description}` : ""}

בדוק:
1. האם כל השדות הרלוונטיים מלאים?
2. האם תעודת הזהות תקינה (9 ספרות)?
3. האם החוסר שזוהה תוקן בשדות?
4. האם יש שדות עם ערכים חשודים?
5. האם התאריכים הגיוניים?

החזר JSON בלבד.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) throw new Error("מערכת ה-AI עמוסה, נסה שוב מאוחר יותר");
      if (aiResponse.status === 402) throw new Error("נדרש חידוש מנוי AI");
      throw new Error("שגיאה בשירות ה-AI");
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let parsed: { score: number; warnings: string[] };
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || content);
    } catch {
      parsed = { score: 50, warnings: ["לא ניתן היה לנתח את התוצאה, בדוק ידנית"] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("validate-correction error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
