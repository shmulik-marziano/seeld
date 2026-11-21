import { FileText, Calculator, Shield, PiggyBank } from "lucide-react";

/** Suggestion chips per page. Shared by the chat panel, the nudge and the home stage (no chat code pulled in). */
export const pageSuggestions: Record<string, { icon: typeof Shield; text: string }[]> = {
  "/": [
    { icon: FileText, text: "מה כולל אפיון צרכים?" },
    { icon: Calculator, text: "איך בודקים אם אני משלם יותר מדי?" },
    { icon: Shield, text: "מה כולל ביטוח בריאות פרטי?" },
    { icon: PiggyBank, text: "איך בוחרים קרן פנסיה?" },
  ],
  "/insurances": [
    { icon: Shield, text: "איזה ביטוח מתאים לי?" },
    { icon: FileText, text: "מה ההבדל בין ביטוח פרטי לקופת חולים?" },
    { icon: Calculator, text: "ממה מורכב מחיר של ביטוח בריאות?" },
  ],
  "/savings": [
    { icon: PiggyBank, text: "קרן השתלמות או גמל להשקעה?" },
    { icon: Calculator, text: "כמה כדאי להפקיד לפנסיה?" },
    { icon: FileText, text: "מה זה דמי ניהול ולמה זה חשוב?" },
  ],
  "/calculators": [
    { icon: Calculator, text: "איזה מחשבון מתאים לשאלה שלי?" },
    { icon: PiggyBank, text: "איך קוראים את תוצאות מחשבון הפנסיה?" },
  ],
};

export const defaultSuggestions = [
  { icon: FileText, text: "איך מתחיל תהליך הייעוץ?" },
  { icon: Shield, text: "מה כולל הייעוץ ומה זה עולה?" },
  { icon: Calculator, text: "מה בודקים באפיון צרכים?" },
  { icon: PiggyBank, text: "רוצה לקבוע פגישה" },
];

export const suggestionsFor = (pathname: string) => pageSuggestions[pathname] || defaultSuggestions;
