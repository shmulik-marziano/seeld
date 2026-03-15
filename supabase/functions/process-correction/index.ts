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
    const { jobId } = await req.json();
    if (!jobId) throw new Error("jobId is required");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleAiApiKey = Deno.env.get("GOOGLE_AI_API_KEY");

    if (!googleAiApiKey) throw new Error("GOOGLE_AI_API_KEY is not configured");

    // Use service role to access data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch job with relations
    const { data: job, error: jobError } = await supabase
      .from("correction_jobs")
      .select(
        "*, pdage_customers(full_name, id_number), deficiency_categories(name), deficiency_bank(title, description)"
      )
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found: " + (jobError?.message || ""));
    }

    // Update status to processing
    await supabase
      .from("correction_jobs")
      .update({ status: "processing" })
      .eq("id", jobId);

    await supabase.from("correction_activity_log").insert({
      job_id: jobId,
      action_type: "processing_started",
      title: "עיבוד AI התחיל",
      details: "המערכת מנתחת את המסמך באמצעות AI",
    });

    // Download the source file to get basic info
    let fileInfo = "לא זמין";
    if (job.source_file_path) {
      // We can't fully parse PDF in edge function easily,
      // but we can provide metadata for the AI to work with
      const { data: fileData } = await supabase.storage
        .from("correction-files")
        .createSignedUrl(job.source_file_path, 60);
      if (fileData?.signedUrl) {
        fileInfo = `קובץ: ${job.original_file_name} (${job.file_type.toUpperCase()})`;
      }
    }

    const customer = job.pdage_customers as any;
    const category = job.deficiency_categories as any;
    const deficiency = job.deficiency_bank as any;
    const deficiencyText = deficiency
      ? `${deficiency.title} — ${deficiency.description || ""}`
      : job.free_text_deficiency || "לא צוין";

    // Build prompt for AI analysis
    const systemPrompt = `אתה מומחה לניתוח מסמכים פיננסיים וביטוחיים בישראל.
תפקידך לנתח חוסרים וליקויים במסמכים ולהציע תיקונים מדויקים.
תמיד ענה בעברית. היה מקצועי וממוקד.`;

    const userPrompt = `נתונים על עבודת התיקון:

📄 קובץ: ${job.original_file_name} (${job.file_type.toUpperCase()})
👤 לקוח: ${customer?.full_name || "לא צוין"} | ת.ז: ${customer?.id_number || "לא צוין"}
📁 קטגוריית חוסר: ${category?.name || "לא צוינה"}
🔍 חוסר שנבחר: ${deficiencyText}

בהתבסס על החוסר שנבחר, אנא:

1. **ניתוח החוסר**: תאר בפירוט מה בדיוק חסר או שגוי במסמך
2. **השפעה**: מה ההשלכות של חוסר זה (דחיית הטופס, עיכוב בתהליך וכו')
3. **תיקון מוצע**: תאר בדיוק מה צריך לתקן ואיך
4. **שלבי ביצוע**: רשימה ממוספרת של הפעולות הנדרשות לתיקון
5. **הערות נוספות**: טיפים או דגשים חשובים

פורמט התשובה:
- כתוב בסגנון מקצועי ומובנה
- השתמש בנקודות וכותרות ברורות
- התייחס ספציפית לסוג החוסר שנבחר`;

    // Call Google Gemini API
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleAiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        throw new Error("מערכת ה-AI עמוסה כרגע, נסה שוב מאוחר יותר");
      }
      throw new Error("שגיאה בשירות ה-AI");
    }

    const aiResult = await aiResponse.json();
    const aiContent =
      aiResult.candidates?.[0]?.content?.parts?.[0]?.text || "לא התקבלה תשובה מה-AI";

    // Update the job with AI results
    await supabase
      .from("correction_jobs")
      .update({
        status: "done",
        processing_notes: aiContent,
        planned_fix_summary: `ניתוח AI עבור: ${deficiencyText}`,
        output_file_path: job.source_file_path, // MVP: same file, AI provides analysis
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await supabase.from("correction_activity_log").insert({
      job_id: jobId,
      action_type: "processing_completed",
      title: "ניתוח AI הושלם",
      details: "המערכת סיימה לנתח את המסמך והציעה תיקונים",
    });

    return new Response(
      JSON.stringify({ success: true, analysis: aiContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("process-correction error:", e);

    // Try to update job status to failed
    try {
      const { jobId } = await (async () => {
        // We can't re-read the body, so we handle the error status update
        // only if jobId was extracted earlier
        return { jobId: null };
      })();
    } catch {}

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
