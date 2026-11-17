/* Shared link data for the site chrome (Header + Footer). Destinations only; no copy that names people. */
export type ChromeLink = { href: string; label: string; icon?: string };

/* Kit pencil icon for a menu row: public/art/icons/<name>.svg (decorative). */
export const iconSrc = (name: string) => `/art/icons/${name}.svg`;

export const INSURANCE_GROUPS: { title: string; links: ChromeLink[] }[] = [
  {
    title: "חיים ובריאות",
    links: [
      { href: "/insurance/life", icon: "family", label: "ביטוח חיים" },
      { href: "/insurance/mortgage", icon: "key", label: "ביטוח משכנתא" },
      { href: "/insurance/health", icon: "heart", label: "ביטוח בריאות" },
      { href: "/insurance/critical-illness", icon: "shield", label: "מחלות קשות" },
      { href: "/insurance/accidents", icon: "claim", label: "תאונות אישיות" },
      { href: "/insurance/partners", icon: "handshake", label: "ביטוח שותפים" },
    ],
  },
  {
    title: "ביטוח כללי",
    links: [
      { href: "/insurance/vehicle", icon: "car", label: "ביטוח רכב" },
      { href: "/insurance/home", icon: "home", label: "ביטוח דירה" },
      { href: "/insurance/business", icon: "briefcase", label: "ביטוח עסק" },
      { href: "/insurance/travel", icon: "plane", label: "ביטוח נסיעות" },
      { href: "/insurance/disability", icon: "umbrella", label: "אובדן כושר עבודה" },
      { href: "/insurance/nursing", icon: "support", label: "ביטוח סיעודי" },
    ],
  },
];

export const SAVINGS_LINKS: ChromeLink[] = [
  { href: "/savings/investment", icon: "growth", label: "פוליסות השקעה" },
  { href: "/savings/gemel-funds", icon: "coins", label: "קופות גמל" },
  { href: "/savings/training-funds", icon: "bank", label: "קרנות השתלמות" },
  { href: "/savings/pension-funds", icon: "hourglass", label: "קרנות פנסיה" },
  { href: "/savings/gemel-investment", icon: "chart", label: "גמל להשקעה" },
  { href: "/savings/child-savings", icon: "wallet", label: "חיסכון לילד" },
  { href: "/savings/pre-retirement", icon: "retirement", label: "לקראת פרישה" },
  { href: "/savings/financial-planning", icon: "compass", label: "תכנון פיננסי" },
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
