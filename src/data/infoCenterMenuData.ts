export interface InfoCenterMenuItem {
  name: string;
  href: string;
}

export interface InfoCenterCategory {
  id: string;
  label: string;
  icon: string;
  items: InfoCenterMenuItem[];
}

export const infoCenterMenuData: InfoCenterCategory[] = [
  {
    id: "rights",
    label: "מיצוי זכויות",
    icon: "file-check",
    items: [
      { name: "בדיקת זכויות ביטוחיות", href: "/rights-extraction" },
      { name: "זכויות פנסיוניות", href: "/rights-extraction" },
      { name: "זכויות בריאות", href: "/rights-extraction" },
    ],
  },
  {
    id: "calculators",
    label: "מחשבונים",
    icon: "calculator",
    items: [
      { name: "מחשבון פנסיה", href: "/calculators" },
      { name: "מחשבון חיסכון", href: "/calculators" },
      { name: "מחשבון משכנתא", href: "/calculators" },
      { name: "מחשבון יעדים", href: "/calculators" },
      { name: "מחשבון השוואה", href: "/calculators" },
    ],
  },
  {
    id: "returns",
    label: "לוחות תשואה",
    icon: "trending-up",
    items: [
      { name: "תשואות קרנות פנסיה", href: "/return-tables" },
      { name: "תשואות קופות גמל", href: "/return-tables" },
      { name: "תשואות קרנות השתלמות", href: "/return-tables" },
    ],
  },
];
