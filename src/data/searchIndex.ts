import { articles } from "@/data/articles";

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  category: string;
}

const staticPages: SearchItem[] = [
  // Main pages
  { title: "דף הבית", description: "עמוד הבית של SeelD", href: "/", category: "דפים" },
  { title: "אודות", description: "הסיפור שלנו", href: "/about", category: "דפים" },
  { title: "הצוות", description: "הכירו את הצוות שלנו", href: "/authors", category: "דפים" },
  { title: "יצירת קשר", description: "צרו קשר איתנו", href: "/contact", category: "דפים" },
  { title: "שאלות נפוצות", description: "תשובות לשאלות נפוצות", href: "/faq", category: "דפים" },
  { title: "מדיניות פרטיות", description: "מדיניות הפרטיות שלנו", href: "/privacy", category: "דפים" },
  { title: "תנאי שימוש", description: "תנאי השימוש באתר", href: "/terms", category: "דפים" },

  // Services
  { title: "שאלון הצטרפות", description: "פתיחת תיק לקוח דיגיטלי", href: "/onboarding", category: "שירותים" },
  { title: 'טופס הוראת קבע', description: 'מילוי טופס הו"ק דיגיטלי', href: "/direct-debit", category: "שירותים" },
  { title: "מיצוי זכויות", description: "בדקו את הזכויות שלכם", href: "/rights-extraction", category: "שירותים" },
  { title: "מחשבונים פיננסיים", description: "כלים לחישוב משכנתא, פנסיה, חיסכון", href: "/calculators", category: "שירותים" },
  { title: "טבלאות תשואה", description: "לוחות תשואה עדכניים", href: "/return-tables", category: "שירותים" },

  // Insurance
  { title: "ביטוח בריאות", description: "כיסוי רפואי מקיף", href: "/insurance/health", category: "ביטוחים" },
  { title: "ביטוח חיים", description: "הגנה כלכלית למשפחה", href: "/insurance/life", category: "ביטוחים" },
  { title: "ביטוח משכנתא", description: "הגנה על המשכנתא שלכם", href: "/insurance/mortgage", category: "ביטוחים" },
  { title: "מחלות קשות", description: "כיסוי למחלות קשות", href: "/insurance/critical-illness", category: "ביטוחים" },
  { title: "אובדן כושר עבודה", description: "הגנה על ההכנסה שלכם", href: "/insurance/disability", category: "ביטוחים" },
  { title: "תאונות אישיות", description: "כיסוי לתאונות", href: "/insurance/accidents", category: "ביטוחים" },
  { title: "ביטוח רכב", description: "ביטוח מקיף וצד ג׳", href: "/insurance/vehicle", category: "ביטוחים" },
  { title: "ביטוח דירה", description: "הגנה על הנכס שלכם", href: "/insurance/home", category: "ביטוחים" },
  { title: "ביטוח שוכר", description: "ביטוח תכולה לשוכרים", href: "/insurance/renters", category: "ביטוחים" },
  { title: "ביטוח עסק", description: "הגנה על העסק שלכם", href: "/insurance/business", category: "ביטוחים" },
  { title: "ביטוח נסיעות לחו״ל", description: "כיסוי בנסיעות לחו״ל", href: "/insurance/travel", category: "ביטוחים" },
  { title: "ביטוח שיניים", description: "כיסוי טיפולי שיניים", href: "/insurance/dental", category: "ביטוחים" },
  { title: "ביטוח סיעודי", description: "כיסוי סיעודי מקיף", href: "/insurance/nursing", category: "ביטוחים" },
  { title: "ביטוח עובדים זרים", description: "ביטוח לעובדים זרים", href: "/insurance/foreign-workers", category: "ביטוחים" },
  { title: "סיכוני שותפים", description: "ביטוח לשותפים עסקיים", href: "/insurance/partners", category: "ביטוחים" },

  // Savings
  { title: "קרנות פנסיה", description: "תכנון פנסיוני חכם", href: "/savings/pension-funds", category: "חיסכון ופנסיה" },
  { title: "קופות גמל", description: "חיסכון לטווח ארוך", href: "/savings/gemel-funds", category: "חיסכון ופנסיה" },
  { title: "גמל להשקעה", description: "קופת גמל להשקעה", href: "/savings/gemel-investment", category: "חיסכון ופנסיה" },
  { title: "חיסכון לכל ילד", description: "חיסכון לילדים", href: "/savings/child-savings", category: "חיסכון ופנסיה" },
  { title: "קרנות השתלמות", description: "חיסכון פטור ממס", href: "/savings/training-funds", category: "חיסכון ופנסיה" },
  { title: "חיסכון והשקעה", description: "אפשרויות השקעה", href: "/savings/investment", category: "חיסכון ופנסיה" },
  { title: "ביטוח חיים פנסיוני", description: "ביטוח חיים עם חיסכון", href: "/savings/pension-life-insurance", category: "חיסכון ופנסיה" },
  { title: "קופות מרכזיות למעסיק", description: "פתרונות למעסיקים", href: "/savings/employer-funds", category: "חיסכון ופנסיה" },
  { title: "לפני פרישה", description: "הכנה לפרישה מעבודה", href: "/savings/pre-retirement", category: "חיסכון ופנסיה" },
  { title: "אחרי פרישה", description: "ניהול כספים לאחר פרישה", href: "/savings/post-retirement", category: "חיסכון ופנסיה" },
  { title: "תכנון כלכלי מתקדם", description: "תכנון פיננסי מקיף", href: "/savings/financial-planning", category: "חיסכון ופנסיה" },
];

// Build full search index including articles
export const getSearchIndex = (): SearchItem[] => {
  const articleItems: SearchItem[] = articles.map((article) => ({
    title: article.title,
    description: article.subtitle,
    href: `/article/${article.id}`,
    category: "מאמרים",
  }));

  return [...staticPages, ...articleItems];
};

export const searchSite = (query: string): SearchItem[] => {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const index = getSearchIndex();
  return index.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );
};
