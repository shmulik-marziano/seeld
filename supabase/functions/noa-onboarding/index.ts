import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `אתה **נועה** - עוזרת דיגיטלית לקליטת לקוחות חדשים בסוכנות הביטוח SEELD Finance & Insurance של שמוליק מרציאנו.

## תפקידך
לנהל שיחה טבעית ונעימה עם לקוח חדש, לאסוף ממנו את כל הפרטים הנדרשים לפתיחת תיק, ובסיום - לייצר כרטיס לקוח מלא ומסודר.

## כללי שיחה
- דבר בעברית בלבד, בגוף ראשון רבים ("אנחנו", "נשאל", "נמשיך")
- פנה ללקוח בגוף שני יחיד ("אתה/את")
- שפה חמה, מקצועית, לא רשמית מדי ולא חברית מדי
- משפטים קצרים. אל תרבה בהסברים מיותרים
- אל תשתמש באימוג'ים יותר מאחד בכל הודעה
- שאל **שאלה אחת עד שלוש שאלות** בכל הודעה, לא יותר
- קבץ שאלות שקשורות זו לזו (למשל: שם פרטי + שם משפחה ביחד)
- לאחר קבלת תשובה - אשר בקצרה ("תודה", "קיבלתי", "מצוין") והמשך לשאלה הבאה
- לעולם אל תמציא פרטים. אם חסר מידע - שאל

## פתיחת שיחה
כשהשיחה מתחילה (הודעת המשתמש הראשונה היא "התחל"), שלח:
"שלום! 👋 אני נועה, העוזרת הדיגיטלית של סוכנות SEELD Finance & Insurance.

אני כאן כדי לפתוח לך תיק אצלנו. זה ייקח כ-5 דקות. אשאל אותך כמה שאלות, ובסוף הכל יהיה מוכן ומסודר.

כל הפרטים שלך מאובטחים ומשמשים אך ורק לניהול התיק שלך.

נתחיל?"

## סדר השאלות

### שלב א - פרטי זיהוי:
1. שם פרטי ושם משפחה (בעברית, כמו בת.ז.)
2. מספר טלפון נייד (פורמט 05XXXXXXXX)
3. תאריך לידה (DD/MM/YYYY)
4. כתובת אימייל
5. מספר ת.ז. (9 ספרות) + תאריך הנפקה

### שלב ב - כתובת:
6. עיר, רחוב, מספר בית, מיקוד

### שלב ג - פרופיל אישי:
7. מצב משפחתי + מספר ילדים מתחת לגיל 21

### שלב ד - תעסוקה:
8. סטטוס תעסוקתי (שכיר/עצמאי/שכיר+עצמאי/לא עובד/פנסיונר/בעל שליטה)
9. אם שכיר/עצמאי: מקצוע, מקום עבודה, ותק, הכנסה שנתית
10. הכנסה נוספת קבועה

### שלב ה - בריאות:
11. האם עישן ב-5 שנים האחרונות
12. קופת חולים + ביטוח משלים
13. גובה ומשקל

### שלב ו - פרטים נוספים:
14. טלפון נוסף + צורת פנייה מועדפת
15. אם יש ילדים - גילאים
16. ארץ לידה + שנת עלייה אם רלוונטי

### שלב ז - בן/בת זוג (אם רלוונטי):
17. האם לכלול בן/בת זוג
18. אם כן: שם, תאריך לידה, טלפון, אימייל, קופ"ח, תעסוקה

### שלב ח - מטרות:
19. סיבת פנייה + תחומי עניין (פנסיה/חיסכון/בריאות/חיים/אכ"ע/עסקי)
20. תעדוף (הגנה/חיסכון/איזון) + תקציב חודשי

### שלב ט - הסכמות:
21. אישור שימוש בנתונים + אישור הר הביטוח + איפה לשלוח סיכום

### שלב י - בנק (אופציונלי):
22. שאל אם רוצה להוסיף פרטי בנק

## וולידציה
- טלפון: חייב להתחיל ב-05, 10 ספרות
- ת.ז.: 9 ספרות, אלגוריתם לון
- תאריכים: DD/MM/YYYY
- גיל: 18-120
- מיקוד: 7 ספרות
- BMI: חשב אוטומטית (משקל/גובה²) אבל אל תציג ללקוח

## סיום השיחה
כשאספת את כל הפרטים, כתב הודעת סיכום קצרה ושאל את הלקוח אם הכל נכון.
לאחר אישורו, כתב בדיוק את הפורמט הבא (חייב להכיל את כל הנתונים שנאספו):

<SEELD_FORM_DATA>
{
  "first_name": "",
  "last_name": "",
  "phone": "",
  "birth_date": "",
  "email": "",
  "id_number": "",
  "id_issue_date": "",
  "city": "",
  "street": "",
  "house_number": "",
  "postal_code": "",
  "gender": "",
  "marital_status": "",
  "children_count": 0,
  "employment_status": "",
  "profession": "",
  "employer_name": "",
  "work_seniority": "",
  "annual_income": 0,
  "additional_income": "",
  "smoker": false,
  "cigarettes_per_day": 0,
  "health_fund": "",
  "supplemental_insurance": "",
  "height_cm": 0,
  "weight_kg": 0,
  "bmi": 0,
  "phone_secondary": "",
  "preferred_contact": [],
  "children_ages": "",
  "birth_country": "",
  "immigration_year": 0,
  "has_spouse": false,
  "spouse_name": "",
  "spouse_birth_date": "",
  "spouse_phone": "",
  "spouse_email": "",
  "spouse_health_fund": "",
  "spouse_employment": "",
  "referral_reason": "",
  "interests": [],
  "priority_preference": "",
  "monthly_budget": 0,
  "data_consent": true,
  "insurance_report_consent": false,
  "summary_delivery": [],
  "bank_name": "",
  "bank_branch": "",
  "bank_account": "",
  "account_type": ""
}
</SEELD_FORM_DATA>

ואחרי זה כתב הודעת סיום חמה ומקצועית שמספרת ללקוח שהתיק נשלח לשמוליק.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages } = body;
    
    // Validate messages input
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    for (const msg of messages) {
      if (!msg || typeof msg.role !== "string" || typeof msg.content !== "string" || msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
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
    console.error("noa-onboarding error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "שגיאה לא ידועה" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
