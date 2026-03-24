import {
  Target, Scan, Database, Search, Lightbulb, Presentation,
  PenTool, ShieldCheck, FileEdit, Send, Wrench, Activity,
  HeartHandshake, Headphones, Shield, Coins, Building2,
  Radar, MessageSquare, CheckSquare, Brain, LayoutDashboard,
  Settings, Grid, type LucideIcon,
} from "lucide-react";

export interface Tool {
  slug: string;
  name: string;
  hebrewName: string;
  icon: LucideIcon;
  color: string;
  gradient: [string, string];
  phase: number;
  phaseLabel: string;
  description: string;
  shortDescription: string;
  status: "exists" | "partial" | "new" | "planned";
}

export const TOOLS: Tool[] = [
  // ── PHASE 1: ENTRY ──
  { slug: "catch", name: "Catch", hebrewName: "לידים וקליטה", icon: Target, color: "#7C3AED", gradient: ["#7C3AED", "#A78BFA"], phase: 1, phaseLabel: "כניסה", description: "תופס כל ליד מכל מקור, מנקד, ממיר ללקוח עם תיק פתוח", shortDescription: "לידים וקליטת לקוחות", status: "partial" },
  { slug: "lens", name: "Lens", hebrewName: "סורק מסמכים", icon: Scan, color: "#0891B2", gradient: ["#0891B2", "#67E8F9"], phase: 1, phaseLabel: "כניסה", description: "סורק מסמכים, מחלץ נתונים עם AI ומייבא לתיק הלקוח", shortDescription: "סריקה וייבוא מסמכים", status: "partial" },
  { slug: "reveal", name: "Reveal", hebrewName: "שליפת מסלקה", icon: Database, color: "#6366F1", gradient: ["#6366F1", "#A5B4FC"], phase: 1, phaseLabel: "כניסה", description: "שליפת נתונים מהמסלקה הפנסיונית והר הביטוח — תמונת תיק מלאה", shortDescription: "שליפת מסלקה והר הביטוח", status: "planned" },

  // ── PHASE 2: ANALYSIS ──
  { slug: "x-ray", name: "X-Ray", hebrewName: "ניתוח תיק", icon: Search, color: "#DC2626", gradient: ["#DC2626", "#FCA5A5"], phase: 2, phaseLabel: "ניתוח", description: "מנתח את תיק הלקוח, מזהה פערים, כפילויות ודמי ניהול גבוהים", shortDescription: "ניתוח תיק ואיתור פערים", status: "new" },
  { slug: "wise", name: "Wise", hebrewName: "המלצות", icon: Lightbulb, color: "#F59E0B", gradient: ["#F59E0B", "#FCD34D"], phase: 2, phaseLabel: "ניתוח", description: "מייצר המלצות מקצועיות מבוססות ניתוח, עם נימוקים ועלויות", shortDescription: "יצירת המלצות מקצועיות", status: "exists" },
  { slug: "stage", name: "Stage", hebrewName: "מצגת והחלטות", icon: Presentation, color: "#8B5CF6", gradient: ["#8B5CF6", "#C4B5FD"], phase: 2, phaseLabel: "ניתוח", description: "מציג ללקוח את ההמלצות, מקבל החלטות ועוקב אחרי סטטוסים", shortDescription: "הצגה ללקוח וקבלת החלטות", status: "exists" },

  // ── PHASE 3: EXECUTION ──
  { slug: "sign", name: "Sign", hebrewName: "חתימות והרשאות", icon: PenTool, color: "#059669", gradient: ["#059669", "#6EE7B7"], phase: 3, phaseLabel: "ביצוע", description: "יצירה ושליחה של ייפויי כוח, הרשאות וחתימות דיגיטליות", shortDescription: "חתימות דיגיטליות והרשאות", status: "new" },
  { slug: "gate", name: "Gate", hebrewName: "חיתום", icon: ShieldCheck, color: "#0D9488", gradient: ["#0D9488", "#5EEAD4"], phase: 3, phaseLabel: "ביצוע", description: "ניהול תהליך חיתום — שאלוני בריאות, תנאים מיוחדים ואישורים", shortDescription: "ניהול תהליכי חיתום", status: "new" },
  { slug: "fill", name: "Fill", hebrewName: "טפסים", icon: FileEdit, color: "#2563EB", gradient: ["#2563EB", "#93C5FD"], phase: 3, phaseLabel: "ביצוע", description: "מילוי אוטומטי של טפסים לפי נתוני הלקוח וההמלצות", shortDescription: "הפקת טפסים אוטומטית", status: "new" },
  { slug: "launch", name: "Launch", hebrewName: "שיגור", icon: Send, color: "#7C3AED", gradient: ["#7C3AED", "#C4B5FD"], phase: 3, phaseLabel: "ביצוע", description: "שליחת טפסים ומסמכים לחברות הביטוח — מייל, פורטל או RPA", shortDescription: "שיגור מסמכים לחברות", status: "new" },
  { slug: "fix", name: "Fix", hebrewName: "תיקון ליקויים", icon: Wrench, color: "#EA580C", gradient: ["#EA580C", "#FB923C"], phase: 3, phaseLabel: "ביצוע", description: "זיהוי ותיקון ליקויים במסמכים שחזרו מחברות הביטוח", shortDescription: "זיהוי ותיקון ליקויים", status: "exists" },
  { slug: "pulse", name: "Pulse", hebrewName: "מעקב ביצוע", icon: Activity, color: "#E11D48", gradient: ["#E11D48", "#FDA4AF"], phase: 3, phaseLabel: "ביצוע", description: "מעקב אחרי ביצוע ההמלצות — אבני דרך, חסימות ותזכורות", shortDescription: "מעקב ביצוע וסטטוסים", status: "partial" },

  // ── PHASE 4: MAINTENANCE ──
  { slug: "bond", name: "Bond", hebrewName: "שימור לקוחות", icon: HeartHandshake, color: "#DB2777", gradient: ["#DB2777", "#F9A8D4"], phase: 4, phaseLabel: "תחזוקה", description: "אירועי חיים, חידושים ושימור — לעולם לא לאבד לקוח", shortDescription: "שימור לקוחות ואירועי חיים", status: "new" },
  { slug: "desk", name: "Desk", hebrewName: "פניות שירות", icon: Headphones, color: "#4F46E5", gradient: ["#4F46E5", "#A5B4FC"], phase: 4, phaseLabel: "תחזוקה", description: "ניהול פניות שירות — שינוי מוטבים, הנפקת אישורים ועוד", shortDescription: "ניהול פניות שירות", status: "new" },
  { slug: "shield", name: "Shield", hebrewName: "תביעות", icon: Shield, color: "#0F766E", gradient: ["#0F766E", "#5EEAD4"], phase: 4, phaseLabel: "תחזוקה", description: "ניהול תביעות ביטוח — פתיחה, מעקב מסמכים וסטטוס מול חברות", shortDescription: "ניהול תביעות ביטוח", status: "new" },
  { slug: "coin", name: "Coin", hebrewName: "עמלות", icon: Coins, color: "#CA8A04", gradient: ["#CA8A04", "#FDE047"], phase: 4, phaseLabel: "תחזוקה", description: "מעקב עמלות — צפוי vs. התקבל, זיהוי פערים ודוחות הכנסה", shortDescription: "מעקב עמלות והכנסות", status: "new" },
  { slug: "link", name: "Link", hebrewName: "מעסיקים", icon: Building2, color: "#475569", gradient: ["#475569", "#94A3B8"], phase: 4, phaseLabel: "תחזוקה", description: "ניהול מעסיקים, הסכמי שירות ועובדים תחת כל מעסיק", shortDescription: "ניהול מעסיקים והסכמים", status: "new" },

  // ── PHASE 5: INFRASTRUCTURE ──
  { slug: "radar", name: "Radar", hebrewName: "בקרה ופיקוח", icon: Radar, color: "#16A34A", gradient: ["#16A34A", "#86EFAC"], phase: 5, phaseLabel: "תשתית", description: "KPIs, ציות רגולטורי ויומן פעילות — הכל תחת שליטה", shortDescription: "בקרה, KPIs וציות", status: "partial" },
  { slug: "bridge", name: "Bridge", hebrewName: "תקשורת", icon: MessageSquare, color: "#0EA5E9", gradient: ["#0EA5E9", "#7DD3FC"], phase: 5, phaseLabel: "תשתית", description: "תיבת דואר מאוחדת — WhatsApp, מייל, SMS וטלפון במקום אחד", shortDescription: "תקשורת רב-ערוצית", status: "new" },
  { slug: "flow", name: "Flow", hebrewName: "משימות", icon: CheckSquare, color: "#9333EA", gradient: ["#9333EA", "#C084FC"], phase: 5, phaseLabel: "תשתית", description: "ניהול משימות — היום, מחר, השבוע. סיכום יומי אוטומטי", shortDescription: "ניהול משימות ומעקב", status: "partial" },
  { slug: "brain", name: "Brain", hebrewName: "ניהול ידע", icon: Brain, color: "#6366F1", gradient: ["#6366F1", "#A5B4FC"], phase: 5, phaseLabel: "תשתית", description: "מאגר הידע של הסוכנות — תבניות, נהלים, טפסים", shortDescription: "ניהול ידע ונכסים תפעוליים", status: "partial" },
];

export const DECK = {
  slug: "deck",
  name: "Deck",
  hebrewName: "לוח פיקוד",
  icon: LayoutDashboard,
  color: "#0a3d3d",
  gradient: ["#0a3d3d", "#5ec6c6"] as [string, string],
  description: "לוח הפיקוד הראשי — משימות, התראות, KPIs, גישה מהירה",
};

export const PHASES = [
  { id: 1, label: "כניסה", englishLabel: "Entry", color: "#7C3AED" },
  { id: 2, label: "ניתוח", englishLabel: "Analysis", color: "#F59E0B" },
  { id: 3, label: "ביצוע", englishLabel: "Execution", color: "#059669" },
  { id: 4, label: "תחזוקה", englishLabel: "Maintenance", color: "#DB2777" },
  { id: 5, label: "תשתית", englishLabel: "Infrastructure", color: "#0EA5E9" },
] as const;

export function getToolsByPhase(phase: number) {
  return TOOLS.filter((t) => t.phase === phase);
}

export function getToolBySlug(slug: string) {
  return TOOLS.find((t) => t.slug === slug);
}

export const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  target: Target,
  scan: Scan,
  database: Database,
  search: Search,
  lightbulb: Lightbulb,
  presentation: Presentation,
  "pen-tool": PenTool,
  "shield-check": ShieldCheck,
  "file-edit": FileEdit,
  send: Send,
  wrench: Wrench,
  activity: Activity,
  "heart-handshake": HeartHandshake,
  headphones: Headphones,
  shield: Shield,
  coins: Coins,
  "building-2": Building2,
  radar: Radar,
  "message-square": MessageSquare,
  "check-square": CheckSquare,
  brain: Brain,
  settings: Settings,
  grid: Grid,
};
