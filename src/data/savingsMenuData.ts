export interface SavingsMenuItem {
  name: string;
  href: string;
}

export interface SavingsCategory {
  id: string;
  label: string;
  icon: string;
  items: SavingsMenuItem[];
}

export const savingsMenuData: SavingsCategory[] = [
  {
    id: "pension",
    label: "פנסיה, גמל והשתלמות",
    icon: "piggy-bank",
    items: [
      { name: "קרנות פנסיה", href: "/savings/pension-funds" },
      { name: "קופות גמל", href: "/savings/gemel-funds" },
      { name: "קופת גמל להשקעה", href: "/savings/gemel-investment" },
      { name: "קופת גמל חיסכון לכל ילד", href: "/savings/child-savings" },
      { name: "קרנות השתלמות", href: "/savings/training-funds" },
    ],
  },
  {
    id: "investment",
    label: "חיסכון והשקעה",
    icon: "wallet",
    items: [
      { name: "חיסכון והשקעה", href: "/savings/investment" },
      { name: "ביטוח חיים פנסיוני", href: "/savings/pension-life-insurance" },
      { name: "קופות מרכזיות למעסיק", href: "/savings/employer-funds" },
    ],
  },
  {
    id: "retirement",
    label: "תכנון ופרישה",
    icon: "briefcase",
    items: [
      { name: "לפני פרישה", href: "/savings/pre-retirement" },
      { name: "אחרי פרישה", href: "/savings/post-retirement" },
      { name: "המרכז לתכנון כלכלי מתקדם", href: "/savings/financial-planning" },
    ],
  },
];
