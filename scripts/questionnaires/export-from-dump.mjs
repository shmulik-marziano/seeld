// One-off exporter: turns a READ-ONLY dump of insform.questions (definition table only, no customer data)
// into the static questionnaire definitions under src/data/questionnaires/*.json.
//   node scripts/questionnaires/export-from-dump.mjs <bank.json>
// <bank.json> = JSON array of question rows as selected from insform.questions (+ so_enr / so_health template sort orders).
// The output files are the source of truth for the app; this script is kept for reproducibility and review.
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) throw new Error("usage: export-from-dump.mjs <bank.json>");
const bank = JSON.parse(fs.readFileSync(input, "utf8"));
const byKey = new Map(bank.map((r) => [r.key, r]));
const OUT = path.resolve("src/data/questionnaires");
fs.mkdirSync(OUT, { recursive: true });

const YES = "כן";
const NO = "לא";
const UNK = "לא יודע/ת";
const DRAFT = "seeld-draft";

// Declaration wording: synthesised from insurer forms in the bank (see docs/product/QUESTIONNAIRES.md section on wording sources).
const GENERIC_DECLARATION = {
  title: "הצהרה",
  paragraphs: [
    "אני מאשר/ת שהפרטים שמסרתי בשאלון נכונים ומלאים למיטב ידיעתי, ושנתתי אותם מרצוני החופשי.",
    "ידוע לי שהפרטים משמשים את הצוות לטיפול בבקשה שלי, ושהם נמסרים לחברות הביטוח או החיסכון רק לצורך הטיפול הזה.",
  ],
  checkbox: "קראתי את ההצהרה ואני מאשר/ת אותה",
};
const HEALTH_DECLARATION = {
  title: "הצהרת בריאות והסכמה",
  paragraphs: [
    "אני מצהיר/ה שכל התשובות שמסרתי בשאלון הבריאותי נכונות ומלאות, שנתתי אותן מרצוני החופשי, ושלא העלמתי דבר העשוי להשפיע על ההחלטה אם להציע לי ביטוח ובאילו תנאים.",
    "ידוע לי שהשאלון הוא חלק בלתי נפרד מההצעה לביטוח, ושתשובות שאינן נכונות או מלאות, או העלמת פרט מהותי, עלולות להשפיע על תנאי הביטוח, על תוקפו ועל תגמולי הביטוח.",
    "אני מסכים/ה שהמידע הבריאותי שמסרתי ישמש את הצוות להכנת הצעה לביטוח ויועבר לחברות הביטוח הרלוונטיות לצורך זה בלבד.",
    "הסכמה זו אינה ויתור על סודיות רפואית מול רופאים, קופות חולים או מוסדות רפואיים. אם חברת ביטוח תדרוש כתב ויתור כזה, הוא ייחתם בנפרד על הטופס שלה.",
  ],
  checkbox: "קראתי את ההצהרה ואני מאשר/ת אותה ואת ההסכמה",
};

const num = (v) => (v === null || v === undefined ? null : Number(v));
const clean = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : s);

function unitOf(label, min, max) {
  if (/בשקלים|₪/.test(label)) return "₪";
  if (/באחוזים|אחוז/.test(label)) return "%";
  if (/בסנטימטרים/.test(label)) return "ס״מ";
  if (/בקילוגרמים/.test(label)) return "ק״ג";
  return null;
}
function numberKind(q) {
  const min = num(q.min_val);
  if (min !== null && min >= 1900) return "year";
  if (/₪/.test(unitOf(q.label) ?? "")) return "amount";
  if (unitOf(q.label) === "%") return "percent";
  if (q.key === "height") return "height";
  if (q.key === "weight") return "weight";
  return q.integer_only ? "integer" : "decimal";
}
const WIDGETS = { address_city: "city", address_street: "street", health_hmo: "healthfund" };
const FUTURE_OK = /start_date|first_collection|expires|collection/;

function normSub(f) {
  const out = { ...f };
  delete out.uiRefs; // bank-internal pointer, not part of the runtime contract
  out.label = clean(out.label);
  return out;
}

function norm(r, sectionId, extraMeta = {}) {
  const q = {
    key: r.key,
    label: clean(r.label),
    section: r.section,
    type: r.type,
    required: !!r.required,
    allow_unknown: !!r.allow_unknown,
    format: r.format ?? null,
    hint: r.hint ? clean(r.hint) : null,
    options: r.options ?? null,
    when: r.when ?? null,
    fields: r.fields ? r.fields.map(normSub) : null,
    min_val: num(r.min_val),
    max_val: num(r.max_val),
    integer_only: !!r.integer_only,
    max_length: r.max_length ?? null,
    origin: r.origin ?? "qlio",
    confidence: r.confidence ?? null,
    version: r.version ?? 1,
    meta: { sectionId, bankId: r.id ?? null, ...extraMeta },
  };
  if (q.type === "number") {
    q.meta.numberKind = numberKind(q);
    const u = unitOf(q.label);
    if (u) q.meta.unit = u;
  }
  if (q.type === "date") {
    q.meta.allowFuture = FUTURE_OK.test(q.key);
    if (q.key === "birth") q.meta.dateRole = "birth";
  }
  if (q.type === "repeat") {
    q.meta.minEntries = 1;
  }
  if (WIDGETS[q.key]) q.meta.widget = WIDGETS[q.key];
  return q;
}

function draftQ(partial, sectionId, section) {
  const q = {
    key: partial.key,
    label: partial.label,
    section,
    type: partial.type,
    required: partial.required ?? true,
    allow_unknown: partial.allow_unknown ?? false,
    format: partial.format ?? null,
    hint: partial.hint ?? null,
    options: partial.options ?? null,
    when: partial.when ?? null,
    fields: partial.fields ?? null,
    min_val: partial.min_val ?? null,
    max_val: partial.max_val ?? null,
    integer_only: partial.integer_only ?? false,
    max_length: partial.max_length ?? (partial.type === "long" ? 500 : 300),
    origin: DRAFT,
    confidence: "draft",
    version: 1,
    meta: { sectionId, draft: true, todo: partial.todo, ...(partial.meta ?? {}) },
  };
  return q;
}

/** Owner-approved product question (not in the bank): origin "seeld", not a draft. */
function productQ(partial, sectionId, section) {
  const q = draftQ(partial, sectionId, section);
  q.origin = "seeld";
  q.confidence = "product";
  q.meta = { sectionId, ...(partial.meta ?? {}), ...(partial.note ? { note: partial.note } : {}) };
  return q;
}

const order = (r, tpl) => r[tpl] ?? 1e6 + (r.id ?? 0);
const rowsOf = (section, tpl = "so_enr") =>
  bank.filter((r) => r.section === section).sort((a, b) => order(a, tpl) - order(b, tpl));

// ---------- direct debit ----------
function buildQuestionnaire({ key, version = 1, title, description, status = "live", group = "core", sections, intro, consent, notes, screening, declaration }) {
  const out = { key, version, title, description, status, group, intro: intro ?? null, consent: consent ?? null, notes: notes ?? [], declaration: declaration ?? GENERIC_DECLARATION, ...(screening ? { screening } : {}), sections: [] };
  const seen = new Set();
  sections.forEach((s, i) => {
    const sectionId = `s${i + 1}`;
    const qs = [];
    for (const spec of s.items) {
      let q;
      if (spec.draft) q = draftQ(spec.draft, sectionId, s.title);
      else if (spec.product) q = productQ(spec.product, sectionId, s.title);
      else {
        const r = byKey.get(spec.key);
        if (!r) throw new Error(`missing in bank: ${spec.key}`);
        q = norm(r, sectionId, spec.meta ?? {});
        if (spec.when !== undefined) q.when = spec.when;
        if (spec.required !== undefined) q.required = spec.required;
        if (spec.label) q.label = spec.label;
        if (spec.options) q.options = spec.options;
        if (spec.meta?.maxEntries) q.meta.maxEntries = spec.meta.maxEntries;
      }
      if (seen.has(q.key)) throw new Error(`dupe ${q.key} in ${key}`);
      seen.add(q.key);
      qs.push(q);
    }
    out.sections.push({ id: sectionId, title: s.title, intro: s.intro ?? null, spot: s.spot ?? null, module: !!s.module, questions: qs });
  });
  return out;
}

const items = (section, tpl = "so_enr", skip = []) => rowsOf(section, tpl).filter((r) => !skip.includes(r.key)).map((r) => ({ key: r.key }));

function write(def) {
  fs.writeFileSync(path.join(OUT, `${def.key}.json`), JSON.stringify(def, null, 1) + "\n");
  const n = def.sections.reduce((a, s) => a + s.questions.length, 0);
  console.log(def.key, def.sections.length, "sections", n, "questions");
}

// ---- direct-debit
const BANK_WHEN = { id: "payment_choice", value: "חשבון בנק" };
const DD_AUTH_TEXT =
  "אני מורה ומאשר/ת לחייב את חשבון הבנק שפרטיו מופיעים לעיל, בסכומי התשלום עבור המוצר שיוסכם, ביום החיוב שבחרתי. ההרשאה היא כללית או כוללת הגבלות (תקרת סכום חיוב ומועד פקיעת תוקף), בהתאם למה שסימנתי בשאלות הקודמות. חיוב שאינו עומד בהגבלות שקבעתי יוחזר על ידי הבנק. אני מצהיר/ה שאני בעל/ת החשבון או מורשה לחתום עליו.";
const DD_DECLARATION = {
  title: "הצהרה",
  paragraphs: [
    "אני מאשר/ת שפרטי החשבון והתשלום שמסרתי נכונים ומלאים למיטב ידיעתי, ושנתתי אותם מרצוני החופשי.",
    "ידוע לי שאוכל לבקש לשנות או לבטל את ההרשאה לחיוב בפנייה לבנק או לחברה.",
  ],
  checkbox: "קראתי את ההצהרה ואני מאשר/ת אותה",
};
const ddBank = [
  { product: { key: "dd_bank", label: "באיזה בנק מתנהל החשבון?", type: "text", format: "bank-pick", when: BANK_WHEN, meta: { widget: "bank" }, hint: "בוחרים את שם הבנק מהרשימה. קוד הבנק יתמלא לבד.", note: "שדה שטוח שמקביל ל-bank_account.bank_number/bank_name בבנק (הטופס מונחה שלבים)." } },
  { product: { key: "dd_branch", label: "מספר הסניף", type: "text", format: "branch-code", when: BANK_WHEN, meta: { widget: "branch" }, hint: "3 ספרות. שם הסניף והיישוב יופיעו לבד כשהמספר נמצא ברשימה.", note: "מקביל ל-bank_account.branch." } },
  { product: { key: "dd_account", label: "מספר החשבון", type: "text", format: "bank-account", when: BANK_WHEN, hint: "ספרות בלבד, 4 עד 9. אפשר להדביק.", note: "מקביל ל-bank_account.account." } },
  { product: { key: "dd_holder_is_client", label: "מי בעל החשבון?", type: "choice", options: ["אני בעל/ת החשבון", "בעל החשבון הוא אדם אחר"], when: BANK_WHEN, note: "ברירת המחדל: הלקוח. מקביל ל-bank_account.holder/co_holder." } },
  { product: { key: "dd_holder_name", label: "שם בעל החשבון, כפי שמופיע בבנק", type: "text", format: "full-name", when: BANK_WHEN, hint: "שם פרטי ושם משפחה.", note: "מקביל ל-bank_account.holder; נדרשים שם פרטי ושם משפחה." } },
  { product: { key: "dd_holder_id", label: "מספר תעודת הזהות של בעל החשבון", type: "text", format: "israeli-id", when: BANK_WHEN, note: "קיים בטופס הציבורי DirectDebit.tsx ואינו בבנק." } },
  { product: { key: "dd_debit_day", label: "באיזה יום בחודש נוח לך שיבוצע החיוב?", type: "choice", options: ["1 בחודש", "10 בחודש", "15 בחודש", "25 בחודש"], allow_unknown: true, when: BANK_WHEN, note: "הימים זהים לטופס הציבורי DirectDebit.tsx." } },
];

write(
  buildQuestionnaire({
    key: "direct-debit",
    title: "הוראת קבע",
    description: "פרטי חשבון הבנק ופרטי התשלום, בשלבים קצרים ועם בדיקת תקינות בכל שלב.",
    group: "core",
    notes: [
      "נשען על הפרק 'אמצעי תשלום' ו'תשלום הביטוח' בבנק השאלות. הטופס הציבורי /direct-debit לא שונה.",
      "המסירה כאן היא איסוף מידע בלבד ואינה הרשאה לחיוב (כך נוסח הבנק).",
    ],
    declaration: DD_DECLARATION,
    sections: [
      {
        title: "הצטרפות · אמצעי תשלום",
        spot: "key-brass",
        items: [
          { key: "payment_choice" },
          ...ddBank,
          { key: "payment_other" },
        ],
      },
      {
        title: "הצטרפות · תשלום הביטוח",
        spot: "scroll-ribbon",
        items: items("הצטרפות · תשלום הביטוח", "so_enr"),
      },
      {
        title: "אישור הרשאה לחיוב",
        spot: "seal-check",
        items: [
          {
            product: {
              key: "dd_authorisation",
              label: "אישור הרשאה לחיוב חשבון",
              type: "consent",
              options: ["אני מאשר/ת"],
              hint: DD_AUTH_TEXT,
              when: BANK_WHEN,
              note: "נוסח מנוסח מחדש מתוך טפסי הוראת קבע/הרשאה לחיוב של חברות בבנק (ראו docs/product/QUESTIONNAIRES.md).",
            },
          },
        ],
      },
    ],
  }),
);

// ---- personal
const personalSections = [
  { title: "הצטרפות · פרטים אישיים", spot: "passport", items: items("הצטרפות · פרטים אישיים") },
  { title: "הצטרפות · קשר וכתובת", spot: "key-brass", items: items("הצטרפות · קשר וכתובת") },
];
write(
  buildQuestionnaire({
    key: "personal",
    title: "פרטים אישיים",
    description: "שם, מסמך מזהה, פרטי קשר וכתובת. כל מה שהצוות צריך כדי להכיר אתכם.",
    sections: personalSections,
  }),
);

// ---- personal-extended
write(
  buildQuestionnaire({
    key: "personal-extended",
    title: "פרטים אישיים מורחבים",
    description: "הפרטים האישיים בתוספת משפחה, תעסוקה והכנסה, תושבות, קופת חולים ומטרות.",
    sections: [
      ...personalSections,
      {
        title: "הצטרפות · משפחה",
        spot: "family-figures",
        items: items("הצטרפות · משפחה").flatMap((it) => {
          if (it.key === "has_spouse") return [{ key: "has_spouse", when: { id: "family", value: ["נשוי/אה", "ידוע/ה בציבור"] } }];
          if (it.key === "children") {
            return [
              { product: { key: "children_count", label: "כמה ילדים יש?", type: "number", integer_only: true, min_val: 1, max_val: 20, allow_unknown: true, when: { id: "has_children", value: "כן" }, meta: { numberKind: "integer" }, note: "שאלה מוצרית (לא בבנק): מספר הילדים קובע את מספר שורות הילד." } },
              { key: "children", meta: { countFrom: "children_count", minEntries: 1 } },
            ];
          }
          return [it];
        }),
      },
      { title: "הצטרפות · תעסוקה והכנסה", spot: "briefcase", items: items("הצטרפות · תעסוקה והכנסה").map((it) => it.key === "employment" ? { key: "employment", options: ["שכיר/ה", "עצמאי/ת", "שכיר/ה ועצמאי/ת", "שכיר/ה בעל/ת שליטה", "עצמאי/ת באמצעות מעסיק", "לא עובד/ת", "גמלאי/ת", "סטודנט/ית", "חייל/ת או שירות לאומי", "קטין/ה"], meta: { note: "נוספו סטודנט/ית וחייל/ת או שירות לאומי (לא קיימים בבנק), באישור הבעלים." } } : it) },
      { title: "הצטרפות · תושבות", spot: "compass", items: items("הצטרפות · תושבות") },
      { title: "הצטרפות · קופת חולים", spot: "heart-pink", items: items("הצטרפות · קופת חולים") },
      { title: "הצטרפות · מטרות והעדפות", spot: "magnifier", items: items("הצטרפות · מטרות והעדפות") },
    ],
  }),
);

// ---- health (screening first)
const HEALTH_PREFIX = "בירור בריאותי · ";
const bodySections = [...new Set(bank.filter((r) => r.section.startsWith(HEALTH_PREFIX)).map((r) => r.section))]
  .filter((s) => !/תרופות|בדיקות ומעקב|מחלות במשפחה/.test(s))
  .sort((a, b) => Math.min(...rowsOf(a, "so_health").map((r) => order(r, "so_health"))) - Math.min(...rowsOf(b, "so_health").map((r) => order(r, "so_health"))));

const familySection = HEALTH_PREFIX + "מחלות במשפחה הביולוגית (הורים, אחים ואחיות)";
const healthSections = [
  {
    title: "מידע גופני",
    spot: "heart-pink",
    items: [
      { key: "height", meta: { numberKind: "height" } },
      { key: "weight", meta: { numberKind: "weight" } },
    ],
  },
  {
    title: "אורח חיים",
    spot: "olive-sapling",
    module: true,
    items: [
      ...["smoking", "smoking_past", "smoking_quit_year", "source_smoking_1", "smoking_product"].map((key) => ({ key })),
      { key: "smoking_medical_advice", when: { id: "smoking", value: YES }, meta: { note: "בבנק ללא תנאי; הוגבל לשואלים שמעשנים כדי שלא יפתח מודול במענה 'לא'." } },
      ...[ "smoking_advice_reason", "alcohol_use", "source_alcohol_use_1", "source_alcohol_use_2", "alcohol_over_two_ever", "alcohol_over_three_five_years", "substance_use", "source_substance_use_1", "source_substance_use_2", "source_substance_use_3"].map((key) => ({ key })),
    ],
  },
  {
    title: "מידע בריאותי משותף",
    spot: "seal-check",
    module: true,
    intro: "כמה שאלות כלליות. אם משהו לא רלוונטי, פשוט עונים 'לא'.",
    items: [
      { key: "conditions" },
      { key: "conditions_detail", required: false, label: "יש עוד משהו שחשוב שהצוות יידע? אפשר לפרט בקצרה, או לדלג." },
      { key: "medication" },
      // structured repeat replaces the free text medication_detail
      { key: "medical_regular_prescription_records", when: { id: "medication", value: YES }, label: "פירוט התרופות והטיפולים הקבועים" },
      { key: "tests" },
      { key: "medical_pending_investigation_records", when: { id: "tests", value: YES }, label: "פירוט הבירורים הרפואיים שטרם הושלמו" },
      { key: "hospital" },
      { key: "source_hospital_1" },
      { key: "source_hospital_2" },
      { key: "source_hospital_3" },
      { key: "limitations" },
      { key: "limitations_detail" },
      { key: "source_limitations_1" },
      { key: "source_limitations_2" },
    ],
  },
  ...bodySections.map((s) => ({ title: s, spot: null, module: true, items: items(s, "so_health") })),
  { title: familySection, spot: "family-figures", module: true, items: items(familySection, "so_health") },
];
const healthDef = buildQuestionnaire({
  key: "health",
  title: "בירור בריאותי",
  description: "שאלון בריאות בגישת סינון: שאלה אחת לכל תחום, ופירוט רק כשיש מה לספר. איסוף מידע בלבד.",
  intro: {
    title: "לפני שמתחילים",
    body: [
      "השאלון אוסף מידע בריאותי כדי שהצוות יוכל להתכונן לשיחה. אין בו ייעוץ רפואי או הערכה של מצבך.",
      "ההתקדמות נשמרת רק בדפדפן הזה, ונמחקת כשסוגרים או לוחצים על 'ניקוי'. בשלב זה התשובות לא נשלחות ולא נשמרות בשרת.",
      "אפשר לדלג על כל שאלה שלא נוח לענות עליה ולהשלים אותה בשיחה עם הצוות.",
    ],
    consentLabel: "קראתי והבנתי, ואני מסכימ/ה להתחיל למלא",
  },
  declaration: HEALTH_DECLARATION,
  sections: healthSections,
  notes: [
    "מידע בריאותי: לא ממלאים מראש, לא נשלחים אירועי אנליטיקה עם תשובות, והזיכרון נמחק ביציאה.",
  ],
});
// gate marking: in a module section every unconditional choice question is a screening gate;
// smoking_past (asked when smoking = לא) is a gate too, so ex-smokers can open the module.
const gates = [];
for (const s of healthDef.sections) {
  if (!s.module) continue;
  for (const q of s.questions) {
    if ((!q.when && q.type === "choice") || q.key === "smoking_past") {
      q.meta.gate = true;
      q.options = ["כן", "לא"];
      q.allow_unknown = false;
      gates.push({ key: q.key, sectionId: s.id });
    }
  }
}
healthDef.screening = {
  title: "סינון ראשוני",
  intro: "שאלה אחת לכל תחום, כן או לא. אם עונים 'לא' על הכול, אין שאלות המשך. לא בטוח/ה? סמנו כן ונעזור לפרט.",
  gates,
};
fs.writeFileSync(path.join(OUT, "health.json"), JSON.stringify(healthDef, null, 1) + "\n");
{
  const n = healthDef.sections.reduce((a, s) => a + s.questions.length, 0);
  console.log("health", healthDef.sections.length, "sections", n, "questions");
}

// ---------- extra questionnaires (owner-approved; travel stays a draft) ----------
const EXTRA = { status: "live", group: "extra" };
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "needs-assessment",
    title: "בירור צרכים",
    description: "יחס לסיכון ותמונה פיננסית כללית, כבסיס לשיחה עם הצוות. לא מחושב ציון ולא נבחר מסלול.",
    sections: [
      { title: "בירור צרכים · יחס לסיכון", spot: "scales", items: items("בירור צרכים · יחס לסיכון", "so") },
      { title: "בירור צרכים · תמונה פיננסית", spot: "coins-stacks", items: items("בירור צרכים · תמונה פיננסית", "so") },
    ],
  }),
);
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "retirement-planning",
    title: "תכנון פרישה",
    description: "מתי מתכננים לפרוש, אילו הכנסות צפויות ומה כבר נעשה.",
    sections: [{ title: "תכנון פרישה", spot: "tea-hourglass", items: items("תכנון פרישה", "so") }],
  }),
);
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "insurance-need",
    title: "צורך ביטוחי וסכומים",
    description: "למה מיועד הביטוח, לכמה זמן, ומה המצב הכלכלי והמשפחתי. פירוט נוסף רק לפי מטרת הביטוח.",
    sections: [
      {
        title: "צורך ביטוחי וסכומים",
        spot: "shield-navy",
        items: [
          ...items("צורך ביטוחי וסכומים", "so"),
          {
            product: {
              key: "need_requested_amount",
              label: "מהו סכום הכיסוי שחשבת עליו, בשקלים?",
              type: "number",
              required: false,
              allow_unknown: true,
              min_val: 0,
              meta: { numberKind: "amount", unit: "₪" },
              note: "שאלה מוצרית (לא בבנק): הבנק מחזיק את הסכום כטקסט חופשי בלבד.",
            },
          },
        ],
      },
      { title: "פרטי הצורך הביטוחי", spot: null, items: items("פרטי הצורך הביטוחי", "so") },
    ],
  }),
);
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "occupation-income",
    title: "תעסוקה והכנסה",
    description: "מעמד תעסוקתי, עיסוק, מעסיקים והכנסות.",
    sections: [
      { title: "הצטרפות · תעסוקה והכנסה", spot: "briefcase", items: items("הצטרפות · תעסוקה והכנסה") },
      { title: "תעסוקה ומקורות הכנסה", spot: null, items: items("תעסוקה ומקורות הכנסה", "so") },
    ],
  }),
);
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "hazardous-activities",
    title: "פעילות ותחביבים",
    description: "ספורט, תחביבים אתגריים, טיס ושיט. שאלה אחת לכל תחום, ופירוט רק כשיש.",
    sections: [{ title: "פעילות ותחביבים", spot: "compass", items: items("פעילות ותחביבים", "so") }],
  }),
);
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "accidents-disability",
    title: "תאונות, מגבלות ונכות",
    description: "מגבלה תפקודית או נכות מוכרת, וסיבתן. הטפסים של חברות ספציפיות לא נכללו.",
    sections: [
      {
        title: "מגבלות ונכות",
        spot: "magnifier",
        items: [
          { key: "limitations", label: "האם קיימת מגבלה תפקודית, נכות מוכרת או היעדרות ממושכת מעבודה עקב מצב רפואי?", meta: { gate: true } },
          { key: "limitations_detail" },
          { key: "source_limitations_1" },
          { key: "source_limitations_2" },
        ],
      },
    ],
  }),
);

const joinOpts = ["קרן פנסיה", "קרן השתלמות", "קופת גמל"];
function gateJoin(section, product) {
  return rowsOf(section, "so").map((r) => {
    const base = { key: r.key };
    if (!r.when) base.when = { id: "join_which", value: product };
    return base;
  });
}
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "savings-join",
    title: "הצטרפות לחיסכון פנסיוני",
    description: "קרן פנסיה, קרן השתלמות וקופת גמל: העדפות, מוטבים, דמי ניהול והפקדות. איסוף מידע בלבד.",
    sections: [
      {
        title: "בחירת מוצר",
        spot: "olive-sapling",
        items: [
          {
            product: {
              key: "join_which",
              label: "לאילו מוצרים מתכוונים להצטרף?",
              type: "multi",
              options: joinOpts,
              allow_unknown: true,
              note: "שאלה מוצרית (לא בבנק): הבנק מחזיק כל מוצר בפרק נפרד, והשאלה מציגה רק את הפרקים הרלוונטיים.",
            },
          },
        ],
      },
      { title: "הצטרפות · קרן פנסיה", spot: null, items: gateJoin("הצטרפות · קרן פנסיה", "קרן פנסיה") },
      { title: "הצטרפות · קרן השתלמות", spot: null, items: gateJoin("הצטרפות · קרן השתלמות", "קרן השתלמות") },
      { title: "הצטרפות · קופת גמל", spot: null, items: gateJoin("הצטרפות · קופת גמל", "קופת גמל") },
      {
        title: "הצטרפות · הפקדות תקופתיות",
        spot: "coins-stacks",
        items: [
          { key: "financial_frequency", when: { id: "join_which", value: ["קופת גמל", "קרן השתלמות"] }, label: "מה תדירות ההפקדות הצפויה?" },
          ...rowsOf("הצטרפות · הפקדות תקופתיות", "so").map((r) => ({ key: r.key })),
        ],
      },
    ],
  }),
);

// ---- travel: all draft
const T = (key, label, type, extra = {}) => ({ draft: { key, label, type, todo: "שאלון נסיעה: אין בבנק. כל השאלות טיוטה לאישור.", ...extra } });
write(
  buildQuestionnaire({
    ...EXTRA,
    key: "travel-trip",
    title: "ביטוח נסיעות",
    description: "יעד, תאריכים, הנוסעים והפעילויות בטיול. כל השאלות טיוטה לאישור: אין להן מקבילה בבנק.",
    sections: [
      {
        title: "הנסיעה",
        spot: "suitcase",
        items: [
          T("trip_destination", "לאן נוסעים?", "text", { hint: "מדינה או כמה מדינות" }),
          T("trip_start", "מתי יוצאים?", "date", { meta: { allowFuture: true, futureOnly: true } }),
          T("trip_end", "מתי חוזרים?", "date", { meta: { allowFuture: true, futureOnly: true, afterKey: "trip_start" } }),
          T("trip_purpose", "מה מטרת הנסיעה?", "choice", { options: ["תיור או חופשה", "עבודה", "לימודים", "אחר"] }),
        ],
      },
      {
        title: "הנוסעים",
        spot: "family-figures",
        items: [
          T("trip_travellers", "מי נוסע?", "repeat", {
            hint: "שורה לכל נוסע",
            fields: [
              { id: "first_name", type: "text", label: "שם פרטי", section: "", required: true, maxLength: 50, format: "person-name" },
              { id: "last_name", type: "text", label: "שם משפחה", section: "", required: true, maxLength: 50, format: "person-name" },
              { id: "id_number", type: "text", label: "מספר תעודת זהות", section: "", required: true, maxLength: 9, format: "israeli-id" },
              { id: "birth", type: "date", label: "תאריך לידה", section: "", required: true, maxLength: 300 },
            ],
            meta: { minEntries: 1 },
          }),
        ],
      },
      {
        title: "פעילויות בטיול",
        spot: "compass",
        items: [
          T("trip_activities_yes", "האם מתוכננות פעילויות מיוחדות, כמו ספורט אתגרי, צלילה או סקי?", "choice", { options: [YES, NO, UNK] }),
          T("trip_activities_detail", "אילו פעילויות?", "long", { when: { id: "trip_activities_yes", value: YES } }),
          T("trip_conditions", "האם יש מצב רפואי שהצוות צריך לדעת עליו לפני הנסיעה?", "choice", { options: [YES, NO, UNK], hint: "איסוף מידע בלבד. הפירוט הבריאותי נעשה בשאלון הבריאות." }),
        ],
      },
    ],
  }),
);
