import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract customer info directly from Maslaqa XML without AI
function extractCustomerFromMaslakaXml(xml: string): Record<string, string | null> {
  const get = (tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
    return match ? match[1].trim() : null;
  };
  
  // Maslaqa XML uses specific Hebrew tags
  return {
    firstName: get("SHEM-PRATI") || get("ShemPrati"),
    lastName: get("SHEM-MISHPACHA") || get("ShemMishpacha"),
    idNumber: get("MISPAR-ZEHUT") || get("MisparZehut") || get("MISPAR-MEZAHE-LAKOACH"),
    mobilePhone: get("MISPAR-TELEPHONE-NAYAD") || get("TELEPHONE-NAYAD") || get("MisparTelephoneNayad"),
    email: get("KTOVT-EMAIL") || get("KtovetEmail") || get("EMAIL"),
    birthDate: null,
    gender: null,
  };
}

// Extract customer info from Har Bituach Excel text
function extractCustomerFromHarBituach(text: string): Record<string, string | null> {
  const lines = text.split("\n");
  let idNumber: string | null = null;
  
  for (const line of lines) {
    // Look for ID number pattern (9 digits)
    const idMatch = line.match(/תעודת זהות[:\s]*(\d{5,9})/);
    if (idMatch) idNumber = idMatch[1];
    
    // Also check for standalone 9-digit number after "תעודת זהות" header
    if (!idNumber) {
      const cells = line.split("\t");
      for (const cell of cells) {
        const trimmed = cell.trim();
        if (/^\d{5,9}$/.test(trimmed)) {
          idNumber = trimmed;
          break;
        }
      }
    }
  }
  
  return { firstName: null, lastName: null, idNumber, mobilePhone: null, email: null, birthDate: null, gender: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { fileContent, fileBase64, fileName, fileType, customerId, extractCustomerInfo } = await req.json();

    if (!fileContent && !fileBase64) throw new Error("Missing file data");

    // Convert file content to readable text
    let textContent = "";
    let isXml = false;

    if (fileBase64) {
      try {
        const binaryStr = atob(fileBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const workbook = XLSX.read(bytes, { type: "array" });
        console.log("XLSX sheets:", workbook.SheetNames);
        
        // Convert ALL sheets to text with full data
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          // Use sheet_to_json for better data extraction
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          textContent += `\n=== גיליון: ${sheetName} ===\n`;
          for (const row of jsonData as any[][]) {
            const nonEmpty = row.filter((cell: any) => cell !== "" && cell !== null && cell !== undefined);
            if (nonEmpty.length > 0) {
              textContent += row.map((cell: any) => String(cell ?? "")).join("\t") + "\n";
            }
          }
        }
        console.log("XLSX parsed successfully, total content length:", textContent.length);
      } catch (e) {
        console.error("XLSX parse error:", e);
        textContent = fileContent || `[Failed to parse binary file: ${fileName}]`;
      }
    } else if (fileContent) {
      textContent = fileContent;
      isXml = fileContent.trim().startsWith("<?xml") || fileContent.trim().startsWith("<Mimshak");
    }

    if (!textContent.trim()) {
      throw new Error("Could not extract text content from file");
    }

    console.log("Extracted content length:", textContent.length);
    console.log("Content preview:", textContent.substring(0, 800));
    console.log("Is XML:", isXml);

    // If extractCustomerInfo mode - extract customer details
    if (extractCustomerInfo) {
      let customerInfo: Record<string, string | null> = {};
      
      if (isXml) {
        // Direct XML parsing for Maslaqa - much more reliable than AI
        customerInfo = extractCustomerFromMaslakaXml(textContent);
        console.log("Extracted customer from XML:", JSON.stringify(customerInfo));
      } else {
        // Try to extract from Har Bituach Excel
        customerInfo = extractCustomerFromHarBituach(textContent);
        
        // If we didn't get much, use AI as fallback
        if (!customerInfo.firstName && !customerInfo.idNumber) {
          const customerPrompt = `אתה מנתח קבצי ביטוח ופיננסים ישראליים. חלץ מהנתונים את פרטי הלקוח.
שדות (null אם לא נמצא): firstName, lastName, idNumber, mobilePhone, email, birthDate (YYYY-MM-DD), gender (זכר/נקבה).
החזר JSON אחד בלבד, בלי markdown.`;

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: customerPrompt },
                { role: "user", content: `קובץ: ${fileName}\nסוג: ${fileType}\n\n${textContent.substring(0, 40000)}` },
              ],
              temperature: 0.1,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            let content = aiData.choices?.[0]?.message?.content || "{}";
            content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            try { customerInfo = JSON.parse(content); } catch { /* keep what we have */ }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, customerInfo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Standard mode - extract products and insert to DB
    if (!customerId) throw new Error("Missing customerId");

    // Build a specialized prompt based on file type
    let systemPrompt: string;
    
    const commonRules = `
חשוב מאוד:
- מספרים כמספרים (לא מחרוזות)
- מוצרי ביטוח (category=ביטוח): השתמש בשדה monthlyPremium (פרמיה חודשית). אם פרמיה שנתית - חלק ב-12
- מוצרי כסף (category=כסף): השתמש בשדה monthlyDeposit (הפקדה חודשית). אם הפקדה שנתית - חלק ב-12
- אסור לשים monthlyPremium על מוצר כסף ולהפך
- התעלם לחלוטין מביטוח רכב, ביטוח דירה, ביטוח מבנה, ביטוח תכולה - לא לכלול אותם בכלל!
- חלץ כל מוצר ייחודי (לפי מספר פוליסה ייחודי)
- לכל מוצר, חלץ את כל הנתונים הזמינים - אל תדלג על שדות
- שם מוצר ייחודי ומפורט: כלול שם חברה + סוג מוצר + שם תוכנית
- אם יש כיסויים ביטוחיים (אכ"ע, נכות, מוות) - כלול אותם ב-notes
- החזר מערך JSON בלבד, בלי markdown, בלי הסברים`;

    if (isXml) {
      systemPrompt = `אתה מומחה לניתוח קבצי מסלקה פנסיונית ישראלית בפורמט XML (Mimshak).

מבנה ה-XML:
- <Mimshak> → <GufHakovetz> → <YeshutLakoach> (פרטי הלקוח)
- תחת YeshutLakoach יש <Mutzarim> → <Mutzar> (כל מוצר)
- כל מוצר מכיל: <KodMutzar>, <ShemMutzar>, <KodYatzran>, <ShemYatzran>, <MisparPolisa>
- <NetuneiMutzar> מכיל: צבירה, דמי ניהול, תשואה, הפקדות
- <KisuyBituachi> מכיל: כיסויים ביטוחיים, פרמיות
- <PirteiTochnit> מכיל: שם תוכנית, תנאים

חלץ כל מוצר עם כל השדות הבאים:
- category: "כסף" לפנסיה/גמל/השתלמות/ביטוח מנהלים, "ביטוח" לביטוח חיים/בריאות/סיעודי/אכ"ע
- productType: סוג מדויק (פנסיה מקיפה, פנסיה כללית, קופת גמל, קרן השתלמות, ביטוח חיים, ביטוח בריאות, אובדן כושר עבודה, סיעודי)
- company: שם היצרן/חברה (ShemYatzran) - השם בעברית המלא
- policyNumber: מספר פוליסה/חשבון (MisparPolisa)
- monthlyPremium: פרמיה חודשית - רק למוצרי ביטוח (חשב מהפקדות אם צריך)
- monthlyDeposit: הפקדה חודשית - רק למוצרי כסף/פנסיוני
- accumulation: צבירה/יתרה (SachTzvira, SachNechasim, YitratZchuyot) - הערך העדכני ביותר
- managementFeeDeposit: דמי ניהול מהפקדה באחוזים (ShiurDmeiNihulHafkada)
- managementFeeAccumulation: דמי ניהול מצבירה באחוזים (ShiurDmeiNihulTzvira)
- returnYear: תשואה שנתית באחוזים
- return3Years: תשואה 3 שנים באחוזים
- track: שם מסלול השקעה (ShemMaslul)
- isActive: true/false (לפי StatusMutzar - 1=פעיל, 2=לא פעיל)
- subDescription: שם תוכנית (ShemTochnit) + פרטים נוספים
- notes: סיכום כיסויים ביטוחיים (סכום ביטוח חיים, אכ"ע, נכות), תאריך תחילה/סיום
${commonRules}`;
    } else {
      systemPrompt = `אתה מומחה לניתוח קבצי הר הביטוח (Excel/CSV) מאתר משרד האוצר הישראלי.

הקובץ מכיל גיליונות שונים - חלץ נתונים מכולם:
- "תיק ביטוחי" / "פוליסות" - רשימת כל הפוליסות: ענף, סוג מוצר, חברה, תקופת ביטוח, פרמיה, מספר פוליסה, סיווג, סטטוס
- "כיסויים ביטוחיים" - כיסויים פעילים: סוג כיסוי, שם תוכנית, חברה, סכומים, פרמיות, מספר פוליסה
- "חיסכון פנסיוני" / "חסכון" - חיסכון: שם יצרן, שם מוצר, מספר חשבון, צבירה, תשואה, דמי ניהול, הפקדות, מסלול
- "ביטוח בריאות" - פוליסות בריאות: חברה, סוג כיסוי, פרמיה, תאריכים
- "ביטוח חיים" - פוליסות חיים: חברה, סכום ביטוח, פרמיה, כיסויים נלווים

שדות לכל מוצר:
- category: "כסף" לפנסיה/גמל/השתלמות/ביטוח מנהלים, "ביטוח" לביטוח חיים/בריאות/סיעודי/אכ"ע
- productType: סוג מדויק ומפורט
- company: שם החברה המלא בעברית
- policyNumber: מספר פוליסה/חשבון
- monthlyPremium: פרמיה חודשית - רק למוצרי ביטוח (אם שנתית - חלק ב-12)
- monthlyDeposit: הפקדה חודשית - רק למוצרי כסף/פנסיוני
- accumulation: צבירה בש"ח
- managementFeeDeposit: דמי ניהול מהפקדה %
- managementFeeAccumulation: דמי ניהול מצבירה %
- returnYear: תשואה שנתית %
- return3Years: תשואה 3 שנים %
- track: מסלול השקעה
- isActive: true/false (לפי סטטוס הפוליסה - "בתוקף"/"פעיל" = true)
- subDescription: שם תוכנית + פרטים מזהים נוספים
- notes: כיסויים ביטוחיים, תקופת ביטוח, סיווג, הערות מיוחדות
${commonRules}`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `שם הקובץ: ${fileName}\nסוג: ${fileType}\n\nתוכן:\n${textContent.substring(0, 80000)}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI parsing failed: " + errText);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    console.log("AI raw response (first 1000):", content.substring(0, 1000));
    
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let products;
    try {
      products = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("AI returned invalid JSON");
    }

    if (!Array.isArray(products)) {
      products = [products];
    }

    console.log("AI extracted products:", products.length);

    // Filter out car and home insurance products
    const excludedTypes = ['ביטוח רכב', 'ביטוח דירה', 'רכב', 'דירה', 'רכב חובה', 'רכב מקיף', 'ביטוח רכב חובה', 'ביטוח רכב מקיף', 'ביטוח דירה ותכולה', 'ביטוח מבנה', 'ביטוח תכולה'];
    products = products.filter((p: any) => {
      const type = (p.productType || '').toLowerCase();
      const sub = (p.subDescription || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const combined = `${type} ${sub} ${notes}`;
      return !excludedTypes.some(ex => combined.includes(ex.toLowerCase())) &&
        !combined.includes('רכב') && !combined.includes('דירה') && !combined.includes('מבנה');
    });

    console.log("Products after filtering car/home:", products.length);

    if (products.length === 0) {
      await supabase.from("source_files")
        .update({ analysis_status: "הושלם" })
        .eq("customer_id", customerId)
        .eq("file_name", fileName)
        .eq("agent_id", user.id);

      return new Response(
        JSON.stringify({ success: true, products: [], count: 0, message: "No products found in file" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const insertData = products.map((p: any) => ({
      customer_id: customerId,
      agent_id: user.id,
      category: p.category || "כסף",
      product_type: p.productType || null,
      company: p.company || null,
      policy_number: p.policyNumber?.toString() || null,
      monthly_premium: (p.category === 'ביטוח' && typeof p.monthlyPremium === "number") ? p.monthlyPremium : null,
      monthly_deposit: (p.category === 'כסף' && typeof p.monthlyDeposit === "number") ? p.monthlyDeposit : (p.category === 'כסף' && typeof p.monthlyPremium === "number") ? p.monthlyPremium : null,
      accumulation: typeof p.accumulation === "number" ? p.accumulation : null,
      management_fee_deposit: typeof p.managementFeeDeposit === "number" ? p.managementFeeDeposit : null,
      management_fee_accumulation: typeof p.managementFeeAccumulation === "number" ? p.managementFeeAccumulation : null,
      return_year: typeof p.returnYear === "number" ? p.returnYear : null,
      return_3_years: typeof p.return3Years === "number" ? p.return3Years : null,
      track: p.track || null,
      is_active: p.isActive !== false,
      sub_description: p.subDescription || null,
      notes: p.notes || null,
      manually_completed: false,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("products")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to insert products: " + insertError.message);
    }

    await supabase.from("source_files")
      .update({ analysis_status: "הושלם" })
      .eq("customer_id", customerId)
      .eq("file_name", fileName)
      .eq("agent_id", user.id);

    await supabase.from("activity_log").insert({
      agent_id: user.id,
      customer_id: customerId,
      title: "קובץ נותח בהצלחה",
      detail: `${fileName} - נמצאו ${inserted?.length || 0} מוצרים`,
      level: "הצלחה",
    });

    return new Response(
      JSON.stringify({ success: true, products: inserted, count: inserted?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
