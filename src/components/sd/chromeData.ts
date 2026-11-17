/* Shared link data for the site chrome (Header + Footer). Destinations only; no copy that names people. */
export type ChromeLink = { href: string; label: string };

export const INSURANCE_GROUPS: { title: string; links: ChromeLink[] }[] = [
  {
    title: "חיים ובריאות",
    links: [
      { href: "/insurance/life", label: "ביטוח חיים" },
      { href: "/insurance/mortgage", label: "ביטוח משכנתא" },
      { href: "/insurance/health", label: "ביטוח בריאות" },
      { href: "/insurance/critical-illness", label: "מחלות קשות" },
      { href: "/insurance/accidents", label: "תאונות אישיות" },
      { href: "/insurance/partners", label: "ביטוח שותפים" },
    ],
  },
  {
    title: "ביטוח כללי",
    links: [
      { href: "/insurance/vehicle", label: "ביטוח רכב" },
      { href: "/insurance/home", label: "ביטוח דירה" },
      { href: "/insurance/business", label: "ביטוח עסק" },
      { href: "/insurance/travel", label: "ביטוח נסיעות" },
      { href: "/insurance/disability", label: "אובדן כושר עבודה" },
      { href: "/insurance/nursing", label: "ביטוח סיעודי" },
    ],
  },
];

export const SAVINGS_LINKS: ChromeLink[] = [
  { href: "/savings/investment", label: "פוליסות השקעה" },
  { href: "/savings/gemel-funds", label: "קופות גמל" },
  { href: "/savings/training-funds", label: "קרנות השתלמות" },
  { href: "/savings/pension-funds", label: "קרנות פנסיה" },
  { href: "/savings/gemel-investment", label: "גמל להשקעה" },
  { href: "/savings/child-savings", label: "חיסכון לילד" },
  { href: "/savings/pre-retirement", label: "לקראת פרישה" },
  { href: "/savings/financial-planning", label: "תכנון פיננסי" },
];

export const KNOWLEDGE_LINKS: ChromeLink[] = [
  { href: "/learn", label: "ידע וכלים" },
  { href: "/blog", label: "בלוג" },
  { href: "/calculators", label: "מחשבונים" },
  { href: "/return-tables", label: "לוח התשואות" },
  { href: "/faq", label: "שאלות נפוצות" },
  { href: "/about", label: "מי אנחנו" },
];

export const SERVICE_LINKS: ChromeLink[] = [
  { href: "/portfolio-review", label: "בדיקת תיק 360" },
  { href: "/rights-extraction", label: "מיצוי זכויות" },
  { href: "/onboarding", label: "שאלון הצטרפות" },
  { href: "/direct-debit", label: "מילוי טופס הו״ק" },
];

export const SOCIAL_LINKS: ChromeLink[] = [
  { href: "https://www.linkedin.com/company/seeld-ins", label: "LinkedIn" },
  { href: "https://www.facebook.com/seeld.ins", label: "Facebook" },
  { href: "https://www.instagram.com/seeld.ins", label: "Instagram" },
  { href: "https://wa.me/972523097444", label: "WhatsApp" },
];
