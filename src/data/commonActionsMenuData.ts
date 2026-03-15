export interface CommonActionMenuItem {
  name: string;
  href: string;
}

export interface CommonActionCategory {
  id: string;
  label: string;
  icon: string;
  items: CommonActionMenuItem[];
}

export const commonActionsMenuData: CommonActionCategory[] = [
  {
    id: "join",
    label: "הצטרפות ל-SeelD",
    icon: "user-plus",
    items: [
      { name: "שאלון הצטרפות", href: "/onboarding" },
      { name: 'מילוי טופס הו"ק', href: "/direct-debit" },
      { name: "ביטוח", href: "/insurances" },
      { name: "חיסכון או השקעה", href: "/savings/investment" },
      { name: "משכנתא או הלוואה", href: "/insurance/mortgage" },
    ],
  },
  {
    id: "claims",
    label: "תביעות",
    icon: "file-text",
    items: [
      { name: "להגיש תביעה", href: "/contact" },
      { name: "לבדוק סטטוס תביעה", href: "/contact" },
      { name: "לאתר ספקי שירות", href: "/contact" },
    ],
  },
  {
    id: "actions",
    label: "ביצוע פעולות",
    icon: "settings",
    items: [
      { name: "להפקיד כספים", href: "/savings/investment" },
      { name: "למשוך כספים", href: "/savings/investment" },
      { name: "לשנות מסלול השקעה", href: "/savings/investment" },
      { name: "לצפות במסמכים", href: "/contact" },
      { name: "לעדכן אמצעי תשלום", href: "/contact" },
      { name: "לעדכן פרטים אישיים", href: "/contact" },
      { name: "לבדוק זכאות להלוואה", href: "/calculators" },
      { name: "לבדוק תיק ביטוחי", href: "/rights-extraction" },
    ],
  },
  {
    id: "contact",
    label: "יצירת קשר",
    icon: "phone",
    items: [
      { name: "שירות לקוחות ופניות הציבור", href: "/contact" },
    ],
  },
  {
    id: "milestones",
    label: "אבני דרך",
    icon: "milestone",
    items: [
      { name: "SeelD למשפחה", href: "/savings/financial-planning" },
      { name: "SeelD לצעירים", href: "/savings/child-savings" },
    ],
  },
];
