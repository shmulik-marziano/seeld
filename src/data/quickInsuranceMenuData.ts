export interface QuickInsuranceMenuItem {
  name: string;
  href: string;
}

export interface QuickInsuranceCategory {
  id: string;
  label: string;
  icon: string;
  items: QuickInsuranceMenuItem[];
}

export const quickInsuranceMenuData: QuickInsuranceCategory[] = [
  {
    id: "property",
    label: "רכוש ועסק",
    icon: "briefcase",
    items: [
      { name: "ביטוח רכב", href: "/insurance/vehicle" },
      { name: "ביטוח דירה", href: "/insurance/home" },
      { name: "ביטוח תכולה לשוכרים", href: "/insurance/renters" },
      { name: "ביטוח עסק", href: "/insurance/business" },
      { name: "ביטוח משכנתא", href: "/insurance/mortgage" },
    ],
  },
  {
    id: "health",
    label: "בריאות וחיים",
    icon: "heart",
    items: [
      { name: "ביטוח בריאות", href: "/insurance/health" },
      { name: "ביטוח חיים", href: "/insurance/life" },
      { name: "ביטוח נסיעות לחו״ל", href: "/insurance/travel" },
      { name: "ביטוח מחלות קשות", href: "/insurance/critical-illness" },
      { name: "ביטוח שיניים", href: "/insurance/dental" },
      { name: "ביטוח אובדן כושר עבודה", href: "/insurance/disability" },
      { name: "ביטוח עובדים זרים ותיירים", href: "/insurance/foreign-workers" },
      { name: "ביטוח תאונות אישיות", href: "/insurance/accidents" },
    ],
  },
  {
    id: "nursing",
    label: "סיעוד",
    icon: "stethoscope",
    items: [
      { name: "ביטוח סיעודי", href: "/insurance/nursing" },
    ],
  },
];
