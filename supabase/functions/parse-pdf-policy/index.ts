import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ParsedCustomer {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  idType?: string;
  idNumber?: string;
  mobilePhone?: string;
  otherPhone?: string;
  email?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  gender?: string;
  birthDate?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  occupation?: string;
  employmentStatus?: string;
  healthFund?: string;
  height?: number;
  weight?: number;
  isSmoker?: boolean;
  source?: string;
}

interface ParsedProduct {
  category: 'כסף' | 'ביטוח';
  company?: string;
  productType?: string;
  subDescription?: string;
  policyNumber?: string;
  monthlyPremium?: number;
  monthlyDeposit?: number;
  accumulation?: number;
  track?: string;
  managementFeeDeposit?: number;
  managementFeeAccumulation?: number;
  phase?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY is not configured');

    const { fileName, fileBase64 } = await req.json();

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'No file data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `אתה מומחה לניתוח קבצי PDF של פוליסות ביטוח ומוצרים פנסיוניים ישראליים.

משימתך: חלץ מהקובץ את כל המידע הרלוונטי ללקוח ולמוצרים הביטוחיים/פנסיוניים שלו.

החזר אובייקט JSON אחד בפורמט הבא (ללא markdown, ללא הסברים):
{
  "customer": {
    "firstName": "שם פרטי או null",
    "lastName": "שם משפחה או null",
    "fullName": "שם מלא או null",
    "idNumber": "מספר ת.ז. (9 ספרות) או null",
    "mobilePhone": "טלפון נייד או null",
    "email": "אימייל או null",
    "birthDate": "YYYY-MM-DD או null",
    "gender": "זכר/נקבה או null",
    "city": "עיר או null",
    "street": "רחוב או null",
    "houseNumber": "מספר בית או null",
    "zipCode": "מיקוד או null",
    "maritalStatus": "מצב משפחתי או null",
    "occupation": "עיסוק או null",
    "healthFund": "קופת חולים או null"
  },
  "products": [
    {
      "category": "כסף או ביטוח",
      "company": "שם חברה",
      "productType": "סוג מוצר מפורט",
      "subDescription": "שם תוכנית/כיסוי",
      "policyNumber": "מספר פוליסה",
      "monthlyPremium": 0,
      "monthlyDeposit": 0,
      "accumulation": 0,
      "track": "מסלול השקעה",
      "managementFeeDeposit": 0,
      "managementFeeAccumulation": 0,
      "phase": "פעיל/לא פעיל",
      "notes": "כיסויים, סכומים, תאריכי תחילה/סיום"
    }
  ]
}

כללים חשובים:
- category "כסף": פנסיה, גמל, השתלמות, ביטוח מנהלים, חיסכון. השתמש ב-monthlyDeposit (לא monthlyPremium)
- category "ביטוח": ביטוח חיים, בריאות, סיעודי, אכ"ע, מחלות קשות. השתמש ב-monthlyPremium (לא monthlyDeposit)
- התעלם מביטוח רכב, דירה, מבנה, תכולה
- מספרים כמספרים (לא מחרוזות)
- אם פרמיה שנתית - חלק ב-12
- אם לא נמצא מידע מסוים - החזר null
- חלץ כל מוצר ייחודי שנמצא בקובץ
- אם הקובץ לא מכיל מידע רלוונטי - החזר customer ריק ומערך products ריק`;

    // Send PDF as base64 to Gemini with inline_data
    const userText = `${systemPrompt}\n\nנתח את קובץ ה-PDF הבא (${fileName || 'policy.pdf'}) וחלץ את כל פרטי הלקוח והמוצרים הביטוחיים/פנסיוניים. החזר JSON בלבד.`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: userText },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: fileBase64,
                },
              },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'שירות ה-AI עמוס, נסה שוב בעוד דקה' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI parsing failed: ' + errText);
    }

    const aiData = await aiResponse.json();
    let content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    console.log('AI raw response (first 500):', content.substring(0, 500));

    // Clean markdown wrappers
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let parsed: { customer: ParsedCustomer; products: ParsedProduct[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content.substring(0, 500));
      throw new Error('AI החזיר תגובה לא תקינה');
    }

    // Normalize
    if (!parsed.customer) parsed.customer = {};
    if (!Array.isArray(parsed.products)) parsed.products = [];

    // Clean nulls from customer
    const customer: ParsedCustomer = {};
    for (const [key, val] of Object.entries(parsed.customer)) {
      if (val !== null && val !== undefined && val !== '' && val !== 'null') {
        (customer as any)[key] = val;
      }
    }
    customer.source = 'PDF פוליסה';

    // Filter out car/home insurance and clean products
    const excludedKeywords = ['רכב', 'דירה', 'מבנה', 'תכולה'];
    const products: ParsedProduct[] = parsed.products
      .filter((p: any) => {
        const combined = `${p.productType || ''} ${p.subDescription || ''} ${p.notes || ''}`.toLowerCase();
        return !excludedKeywords.some(k => combined.includes(k));
      })
      .map((p: any) => ({
        category: p.category || 'ביטוח',
        company: p.company || undefined,
        productType: p.productType || undefined,
        subDescription: p.subDescription || undefined,
        policyNumber: p.policyNumber?.toString() || undefined,
        monthlyPremium: p.category === 'ביטוח' && typeof p.monthlyPremium === 'number' ? p.monthlyPremium : undefined,
        monthlyDeposit: p.category === 'כסף' && typeof p.monthlyDeposit === 'number' ? p.monthlyDeposit : undefined,
        accumulation: typeof p.accumulation === 'number' ? p.accumulation : undefined,
        track: p.track || undefined,
        managementFeeDeposit: typeof p.managementFeeDeposit === 'number' ? p.managementFeeDeposit : undefined,
        managementFeeAccumulation: typeof p.managementFeeAccumulation === 'number' ? p.managementFeeAccumulation : undefined,
        phase: p.phase || 'פעיל',
        notes: p.notes || undefined,
      }));

    const result = {
      fileType: 'pdf_policy',
      customers: [{ customer, products }],
    };

    console.log(`PDF parsed: ${products.length} products extracted`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Parse PDF error:', err);
    return new Response(JSON.stringify({ error: err.message || 'שגיאה בפיענוח ה-PDF' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
