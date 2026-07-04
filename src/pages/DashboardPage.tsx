import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard, Target, Users, Zap, Briefcase, PhoneCall,
  Calendar, FolderUp, BarChart3, Settings, HelpCircle,
  Search, Bell, Cake, CheckSquare, User, LogOut,
  Plus, Upload, Filter, ArrowUpDown, Columns, RefreshCw,
  MoreVertical, FilePlus, List, Package, Activity, FileText,
  Shield, Wallet, ClipboardCheck,
  Copy, Mail, MessageCircle, Phone, Edit3, Send, Database,
  CheckCircle2, ChevronUp, Lock, Globe, CreditCard,
  Key, Hash, Layers, ToggleLeft, Download, PenTool, X,
  UserPlus, Building, BarChart, FileCheck, Wrench,
  RotateCcw, Check, Eye,
} from 'lucide-react';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

import doodleShield    from '@/assets/doodle-shield.png';
import doodleTarget    from '@/assets/doodle-target.png';
import doodleCharts    from '@/assets/doodle-charts.png';
import doodleGrowth    from '@/assets/doodle-growth.png';
import doodleLightbulb from '@/assets/doodle-lightbulb.png';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  teal:   '#171717',
  orange: '#b45309',
  coral:  '#b91c1c',
  green:  '#15803d',
  yellow: '#a16207',
  purple: '#4d4d4d',
  dark:   '#262626',
  gray:   '#94a3b8',
};

type BubbleType = { label: string; icon: React.ElementType; path: string | null; e: boolean };
type SectionType = { title: string; color: string; num: string; bubbles: BubbleType[] };

// ─── Flat bubble (with section metadata) ──────────────────────────────────────
type FlatBubble = BubbleType & {
  color: string;
  sectionTitle: string;
  originalIndex: number; // index within its section
};

// ─── SECTIONS ─────────────────────────────────────────────────────────────────
const SECTIONS: SectionType[] = [
  {
    title: 'ניווט ראשי', color: C.dark, num: '1–11',
    bubbles: [
      { label: 'דשבורד',       icon: LayoutDashboard, path: '/app/dashboard',          e: true  },
      { label: 'לידים',        icon: Target,           path: '/app/leads',             e: true  },
      { label: 'לקוחות',       icon: Users,            path: '/app/customers',         e: true  },
      { label: 'תהליכים',      icon: Zap,              path: '/app/execution',         e: true  },
      { label: 'מעסיקים',      icon: Briefcase,        path: '/app/employers',         e: false },
      { label: 'אנשי קשר',     icon: PhoneCall,        path: '/app/contacts',          e: false },
      { label: 'פגישות',       icon: Calendar,         path: '/app/meetings',          e: false },
      { label: 'טעינת קבצים',  icon: FolderUp,         path: '/app/file-import',       e: true  },
      { label: 'דוחות',        icon: BarChart3,        path: '/app/activity-log',      e: true  },
      { label: 'הגדרות',       icon: Settings,         path: '/app/settings',          e: true  },
      { label: 'עזרה',         icon: HelpCircle,       path: '/app/help',              e: true  },
    ],
  },
  {
    title: 'סרגל עליון', color: C.teal, num: '12–17',
    bubbles: [
      { label: 'חיפוש',              icon: Search,      path: '/app/customers',        e: true  },
      { label: 'יצירת תזכורת',       icon: Bell,        path: '/app/follow-up',        e: true  },
      { label: 'ימי הולדת',          icon: Cake,        path: null,                    e: false },
      { label: 'המשימות שלי',        icon: CheckSquare, path: '/app/follow-up',        e: true  },
      { label: 'התראות',             icon: Bell,        path: '/app/follow-up',        e: true  },
      { label: 'שמוליק מרציאנו',     icon: User,        path: '/app/settings',         e: true  },
    ],
  },
  {
    title: 'דשבורד', color: C.green, num: '18–19',
    bubbles: [
      { label: 'פעילים בלבד',       icon: ToggleLeft, path: null, e: false },
      { label: '12 חודשים אחרונים', icon: Calendar,   path: null, e: false },
    ],
  },
  {
    title: 'מסך לידים', color: C.orange, num: '20–30',
    bubbles: [
      { label: 'דשבורד',         icon: LayoutDashboard, path: '/app/leads',     e: true  },
      { label: 'תצוגה ראשית',    icon: List,            path: '/app/leads',     e: true  },
      { label: 'context menu',   icon: MoreVertical,    path: null,            e: false },
      { label: 'הוספת תצוגה',    icon: Plus,            path: null,            e: false },
      { label: 'יצירת ליד',      icon: UserPlus,        path: '/app/leads',     e: true  },
      { label: 'ייבוא / ייצוא',  icon: Upload,          path: '/app/leads',     e: true  },
      { label: 'סנן עמודות',     icon: Filter,          path: '/app/leads',     e: true  },
      { label: 'מיון עמודות',    icon: ArrowUpDown,     path: '/app/leads',     e: true  },
      { label: 'בחירת עמודות',   icon: Columns,         path: null,            e: false },
      { label: 'חיפוש טבלה',     icon: Search,          path: '/app/leads',     e: true  },
      { label: 'רענון',          icon: RefreshCw,       path: '/app/leads',     e: true  },
    ],
  },
  {
    title: 'מסך לקוחות', color: C.teal, num: '31–41',
    bubbles: [
      { label: 'דשבורד',         icon: LayoutDashboard, path: '/app/customers',     e: true  },
      { label: 'תצוגה ראשית',    icon: List,            path: '/app/customers',     e: true  },
      { label: 'context menu',   icon: MoreVertical,    path: null,                e: false },
      { label: 'הוספת תצוגה',    icon: Plus,            path: null,                e: false },
      { label: 'יצירת לקוח',     icon: UserPlus,        path: '/app/customers/new', e: true  },
      { label: 'ייבוא / ייצוא',  icon: Upload,          path: '/app/file-import',   e: true  },
      { label: 'סנן עמודות',     icon: Filter,          path: '/app/customers',     e: true  },
      { label: 'מיון עמודות',    icon: ArrowUpDown,     path: '/app/customers',     e: true  },
      { label: 'בחירת עמודות',   icon: Columns,         path: '/app/customers',     e: true  },
      { label: 'חיפוש טבלה',     icon: Search,          path: '/app/customers',     e: true  },
      { label: 'רענון',          icon: RefreshCw,       path: '/app/customers',     e: true  },
    ],
  },
  {
    title: 'מסך תהליכים', color: C.purple, num: '42–53',
    bubbles: [
      { label: 'דשבורד',              icon: LayoutDashboard, path: '/app/execution',  e: true  },
      { label: 'תצוגה ראשית',         icon: List,            path: '/app/execution',  e: true  },
      { label: 'context menu',        icon: MoreVertical,    path: null,              e: false },
      { label: 'הוספת תצוגה',         icon: Plus,            path: null,              e: false },
      { label: 'יצירת תהליך',         icon: FilePlus,        path: '/app/recommendations/new', e: true },
      { label: 'ייבוא / ייצוא',       icon: Upload,          path: null,              e: false },
      { label: 'סנן עמודות',          icon: Filter,          path: '/app/execution',  e: true  },
      { label: 'מיון עמודות',         icon: ArrowUpDown,     path: '/app/execution',  e: true  },
      { label: 'בחירת עמודות',        icon: Columns,         path: null,              e: false },
      { label: 'חיפוש טבלה',          icon: Search,          path: '/app/execution',  e: true  },
      { label: 'רענון',               icon: RefreshCw,       path: '/app/execution',  e: true  },
      { label: '12 חודשים',           icon: Calendar,        path: null,              e: false },
    ],
  },
  {
    title: 'מסך מעסיקים', color: C.coral, num: '54–63',
    bubbles: [
      { label: 'תצוגה ראשית',    icon: List,         path: null, e: false },
      { label: 'context menu',   icon: MoreVertical, path: null, e: false },
      { label: 'הוספת תצוגה',    icon: Plus,         path: null, e: false },
      { label: 'יצירת מעסיק',    icon: Building,     path: null, e: false },
      { label: 'ייבוא / ייצוא',  icon: Upload,       path: null, e: false },
      { label: 'סנן עמודות',     icon: Filter,       path: null, e: false },
      { label: 'מיון עמודות',    icon: ArrowUpDown,  path: null, e: false },
      { label: 'בחירת עמודות',   icon: Columns,      path: null, e: false },
      { label: 'חיפוש טבלה',     icon: Search,       path: null, e: false },
      { label: 'רענון',          icon: RefreshCw,    path: null, e: false },
    ],
  },
  {
    title: 'מסך אנשי קשר', color: C.yellow, num: '64–73',
    bubbles: [
      { label: 'תצוגה ראשית',    icon: List,         path: null, e: false },
      { label: 'context menu',   icon: MoreVertical, path: null, e: false },
      { label: 'הוספת תצוגה',    icon: Plus,         path: null, e: false },
      { label: 'יצירת איש קשר',  icon: UserPlus,     path: null, e: false },
      { label: 'ייבוא / ייצוא',  icon: Upload,       path: null, e: false },
      { label: 'סנן עמודות',     icon: Filter,       path: null, e: false },
      { label: 'מיון עמודות',    icon: ArrowUpDown,  path: null, e: false },
      { label: 'בחירת עמודות',   icon: Columns,      path: null, e: false },
      { label: 'חיפוש טבלה',     icon: Search,       path: null, e: false },
      { label: 'רענון',          icon: RefreshCw,    path: null, e: false },
    ],
  },
  {
    title: 'מסך פגישות', color: C.green, num: '74–83',
    bubbles: [
      { label: 'תצוגה ראשית',    icon: List,         path: null, e: false },
      { label: 'context menu',   icon: MoreVertical, path: null, e: false },
      { label: 'הוספת תצוגה',    icon: Plus,         path: null, e: false },
      { label: 'יצירת פגישה',    icon: Calendar,     path: null, e: false },
      { label: 'ייבוא / ייצוא',  icon: Upload,       path: null, e: false },
      { label: 'סנן עמודות',     icon: Filter,       path: null, e: false },
      { label: 'מיון עמודות',    icon: ArrowUpDown,  path: null, e: false },
      { label: 'בחירת עמודות',   icon: Columns,      path: null, e: false },
      { label: 'חיפוש טבלה',     icon: Search,       path: null, e: false },
      { label: 'רענון',          icon: RefreshCw,    path: null, e: false },
    ],
  },
  {
    title: 'פאנל התראות', color: C.coral, num: '84–86',
    bubbles: [
      { label: 'סגירת כל ההתראות', icon: CheckCircle2, path: '/app/follow-up', e: true  },
      { label: 'סגירת התראה',      icon: X,            path: '/app/follow-up', e: true  },
      { label: 'סגירת הפאנל',      icon: X,            path: null,             e: false },
    ],
  },
  {
    title: 'כרטיס לקוח — כותרת', color: C.dark, num: '87–92',
    bubbles: [
      { label: 'שם הלקוח',       icon: User,           path: '/app/customers',  e: true  },
      { label: 'העתקה / Copy',   icon: Copy,           path: null,              e: false },
      { label: 'העתקת מייל',     icon: FileText,       path: null,              e: false },
      { label: 'WhatsApp',       icon: MessageCircle,  path: null,              e: false },
      { label: 'נייד / חיוג',    icon: Phone,          path: null,              e: false },
      { label: 'שליחת מייל',     icon: Mail,           path: null,              e: false },
    ],
  },
  {
    title: 'כרטיס לקוח — פעולות', color: C.teal, num: '93–97',
    bubbles: [
      { label: 'הערות',           icon: Edit3,    path: '/app/customers',          e: true  },
      { label: 'דוח שוטף',       icon: FileText, path: '/app/activity-log',       e: true  },
      { label: 'תעסוקה',         icon: Briefcase,path: '/app/customers',          e: true  },
      { label: 'לקוחות קשורים',  icon: Users,    path: '/app/customers',          e: true  },
      { label: 'אני רוצה... (+)', icon: Plus,     path: '/app/recommendations/new', e: true },
    ],
  },
  {
    title: 'תפריט "אני רוצה..."', color: C.purple, num: '97א–97ז',
    bubbles: [
      { label: 'יפויי כוח מרחוק',       icon: Shield,        path: '/app/recommendations/new', e: true  },
      { label: 'יפויי כוח בפגישה',       icon: Shield,        path: '/app/recommendations/new', e: true  },
      { label: 'להזמין מסלקה',           icon: Database,      path: '/app/file-import',          e: true  },
      { label: 'לשלוח דוח ללקוח',        icon: Send,          path: '/app/execution',            e: true  },
      { label: 'לקבוע פגישה',            icon: Calendar,      path: null,                        e: false },
      { label: 'סיכום פגישה ללקוח',      icon: ClipboardCheck,path: null,                        e: false },
      { label: 'הפקה ישירה (חדש)',        icon: Zap,           path: '/app/recommendations/new', e: true  },
    ],
  },
  {
    title: 'כרטיס לקוח — טאבים', color: C.orange, num: '98–106',
    bubbles: [
      { label: 'מוצרים',         icon: Package,    path: '/app/customers',    e: true  },
      { label: 'תהליכים',        icon: Zap,        path: '/app/execution',    e: true  },
      { label: 'פעילויות',       icon: Activity,   path: '/app/activity-log', e: true  },
      { label: 'מסמכים',         icon: FileText,   path: '/app/customers',    e: true  },
      { label: 'פגישות',         icon: Calendar,   path: null,                e: false },
      { label: 'סיכומי פגישות',  icon: FileCheck,  path: null,                e: false },
      { label: 'דוחות',          icon: BarChart3,  path: '/app/activity-log', e: true  },
      { label: 'לידים',          icon: Target,     path: '/app/leads',        e: true  },
      { label: 'אירועים',        icon: Bell,       path: '/app/follow-up',    e: true  },
    ],
  },
  {
    title: 'טאב מוצרים', color: C.green, num: '107–120',
    bubbles: [
      { label: 'הוספת מוצרים',     icon: Plus,       path: '/app/customers',    e: true  },
      { label: 'ייצוא מוצרים',     icon: Download,   path: null,                e: false },
      { label: 'תצוגה גרפית',      icon: BarChart,   path: null,                e: false },
      { label: 'טרום טיפול',       icon: ToggleLeft, path: null,                e: false },
      { label: 'פרודוקציה',        icon: ToggleLeft, path: null,                e: false },
      { label: 'מסלקה (תאריך)',    icon: Database,   path: '/app/file-import',  e: true  },
      { label: 'הר ביטוח (תאריך)', icon: BarChart3,  path: null,                e: false },
      { label: 'בקשת קבלת מידע',   icon: FileCheck,  path: null,                e: false },
      { label: 'סגירת קטגוריות',   icon: ChevronUp,  path: null,                e: false },
      { label: 'בחירת עמודות',     icon: Columns,    path: null,                e: false },
      { label: 'פנסיה',            icon: Wallet,     path: '/app/customers',    e: true  },
      { label: 'חיים',             icon: Shield,     path: '/app/customers',    e: true  },
      { label: 'בריאות',           icon: Package,    path: '/app/customers',    e: true  },
      { label: 'ביטוח רכב',        icon: Layers,     path: '/app/customers',    e: true  },
    ],
  },
  {
    title: 'טאב פעילויות', color: C.yellow, num: '121–125',
    bubbles: [
      { label: 'יצירת פעילות',   icon: Plus,      path: '/app/activity-log', e: true  },
      { label: 'סינון לפי סוג',  icon: Filter,    path: '/app/activity-log', e: true  },
      { label: 'סינון לפי מטפל', icon: Filter,    path: '/app/activity-log', e: true  },
      { label: 'סינון נוסף',     icon: Filter,    path: '/app/activity-log', e: true  },
      { label: 'איפוס',          icon: RefreshCw, path: '/app/activity-log', e: true  },
    ],
  },
  {
    title: 'הגדרות — הגדרות שלי', color: C.gray, num: '126–129',
    bubbles: [
      { label: 'הגדרות משתמש',      icon: User,    path: '/app/settings',  e: true  },
      { label: 'הגדרות בעל רישיון', icon: Key,     path: '/app/settings',  e: true  },
      { label: 'התראות',            icon: Bell,    path: '/app/follow-up', e: true  },
      { label: 'יומנים',            icon: Calendar,path: '/app/activity-log', e: true },
    ],
  },
  {
    title: 'הגדרות — סוכנויות ומשתמשים', color: C.dark, num: '130–132',
    bubbles: [
      { label: 'סוכנויות',      icon: Building, path: '/app/settings', e: true  },
      { label: 'אבטחה והרשאות', icon: Lock,     path: '/app/settings', e: true  },
      { label: 'צוותים',        icon: Users,    path: '/app/settings', e: true  },
    ],
  },
  {
    title: 'הגדרות — חשבון', color: C.teal, num: '133–134',
    bubbles: [
      { label: 'יצרנים', icon: Wrench,  path: '/app/settings', e: true  },
      { label: 'מוצרים', icon: Package, path: '/app/settings', e: true  },
    ],
  },
  {
    title: 'הגדרות — עמיתים סוכנות', color: C.purple, num: '135–149',
    bubbles: [
      { label: 'פרטי הסוכנות',    icon: Building,      path: '/app/settings',    e: true  },
      { label: 'תשלומים',         icon: CreditCard,    path: '/app/settings',    e: true  },
      { label: 'משתמשים',         icon: Users,         path: '/app/settings',    e: true  },
      { label: 'דוח ללקוח (חדש)', icon: FileText,      path: '/app/execution',   e: true  },
      { label: 'קישורים קבועים',  icon: Globe,         path: '/app/settings',    e: true  },
      { label: 'בעלי רישיון',     icon: Key,           path: '/app/settings',    e: true  },
      { label: 'מספרי סוכן',      icon: Hash,          path: '/app/settings',    e: true  },
      { label: 'חשבונות מסלקה',   icon: Database,      path: '/app/settings',    e: true  },
      { label: 'בקשות קבלת מידע', icon: FileCheck,     path: '/app/settings',    e: true  },
      { label: 'פרודוקציה',       icon: BarChart3,     path: '/app/settings',    e: true  },
      { label: 'טלפוניה',         icon: Phone,         path: '/app/settings',    e: true  },
      { label: 'WhatsApp',        icon: MessageCircle, path: '/app/settings',    e: true  },
      { label: 'API / Webhooks',  icon: Wrench,        path: '/app/settings',    e: true  },
      { label: 'שמירה',          icon: FileCheck,     path: '/app/settings',    e: true  },
      { label: 'ביטול שינויים',   icon: X,             path: '/app/settings',    e: true  },
    ],
  },
  {
    title: 'כפתורי מערכת כלליים', color: C.gray, num: '150–157',
    bubbles: [
      { label: 'סינון (סנן)',    icon: Filter,      path: '/app/customers',    e: true  },
      { label: 'מיון',           icon: ArrowUpDown, path: '/app/customers',    e: true  },
      { label: 'עמודות',         icon: Columns,     path: '/app/customers',    e: true  },
      { label: 'חיפוש בטבלה',   icon: Search,      path: '/app/customers',    e: true  },
      { label: 'רענון',          icon: RefreshCw,   path: null,                e: false },
      { label: 'ייבוא / ייצוא', icon: Upload,      path: '/app/file-import',  e: true  },
      { label: 'הוספת תצוגה',   icon: Plus,        path: null,                e: false },
      { label: 'context menu',   icon: MoreVertical,path: null,                e: false },
    ],
  },
];

// ─── Interleave sections for color mixing ─────────────────────────────────────
function buildMixedBubbles(sections: SectionType[]): FlatBubble[] {
  const bySec = sections.map(sec =>
    sec.bubbles.map((b, bi): FlatBubble => ({
      ...b, color: sec.color, sectionTitle: sec.title, originalIndex: bi,
    }))
  );
  const result: FlatBubble[] = [];
  const maxLen = Math.max(...bySec.map(a => a.length));
  for (let i = 0; i < maxLen; i++)
    for (const arr of bySec)
      if (i < arr.length) result.push(arr[i]);
  return result;
}

// ─── Persistence ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'seeld-dashboard-layout-v2';
type LayoutData = { hiddenMap: Record<string, number[]> };

function loadLayout(): LayoutData | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}
function saveLayout(d: LayoutData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── HoneycombCanvas ─────────────────────────────────────────────────────────
interface HoneycombCanvasProps {
  bubbles: FlatBubble[];
  hiddenMap: Record<string, number[]>;
  editMode: boolean;
  onToggleBubble: (secTitle: string, idx: number) => void;
  onBubbleClick: (b: FlatBubble) => void;
}

function HoneycombCanvas({ bubbles, hiddenMap, editMode, onToggleBubble, onBubbleClick }: HoneycombCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number | null>(null);
  const [cw, setCw]  = useState(320);
  const [mp, setMp]  = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setCw(el.offsetWidth);
    const ro = new ResizeObserver(e => setCw(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; setMp({ x, y }); });
  }, []);

  const onLeave = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setMp(null);
  }, []);

  const SZ   = cw < 400 ? 88 : cw < 620 ? 104 : 128;
  const GAP  = cw < 400 ? 6 : 4;
  const cols = cw < 400 ? 3 : cw < 620 ? 4 : cw < 820 ? 5 : cw < 1020 ? 6 : 7;

  const display = editMode
    ? bubbles
    : bubbles.filter(b => !(hiddenMap[b.sectionTitle] || []).includes(b.originalIndex));

  const pos = (i: number) => {
    const row = Math.floor(i / cols), col = i % cols;
    const odd = row % 2 === 1;
    const r   = col * (SZ + GAP) + (odd ? (SZ + GAP) / 2 : 0);
    const t   = row * (SZ * 0.87 + GAP);
    return { r, t, cx: cw - r - SZ / 2, cy: t + SZ / 2 };
  };

  const totalRows = Math.ceil(display.length / cols);
  const H = totalRows === 0 ? 0 : totalRows * (SZ * 0.87 + GAP) + SZ;

  const scale = (cx: number, cy: number) => {
    if (!mp || editMode) return 1;
    const d = Math.sqrt((mp.x - cx) ** 2 + (mp.y - cy) ** 2);
    return 1 + 0.38 * Math.max(0, 1 - d / (SZ * 2.6));
  };

  const delay = (i: number) => Math.abs(i - Math.floor(display.length / 2)) * 0.008;

  const FS = cw < 400 ? 9 : cw < 620 ? 10 : 11;
  const IS = Math.round(SZ * 0.26);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: H }}
      onPointerMove={onMove} onPointerLeave={onLeave}>
      {display.map((b, i) => {
        const Icon    = b.icon;
        const hidden  = (hiddenMap[b.sectionTitle] || []).includes(b.originalIndex);
        const { r, t, cx, cy } = pos(i);
        const sc      = scale(cx, cy);

        return (
          <div key={`${b.sectionTitle}-${b.originalIndex}`} className="absolute"
            style={{ right: r, top: t, width: SZ, height: SZ, zIndex: sc > 1.05 ? 10 : 1 }}>

            {/* Fisheye scale wrapper */}
            <div style={{
              width: SZ, height: SZ, transformOrigin: 'center',
              transform: `scale(${sc})`,
              transition: 'transform 110ms cubic-bezier(0.2,0,0.2,1)',
              willChange: 'transform',
            }}>
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20, delay: delay(i) }}
                whileHover={!editMode && !hidden ? {
                  boxShadow: `0 0 0 3px white, 0 0 0 6px ${b.color}cc, 0 14px 40px ${b.color}70`,
                } : {}}
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  if (hidden) { onToggleBubble(b.sectionTitle, b.originalIndex); return; }
                  if (editMode) return;
                  onBubbleClick(b);
                }}
                className="w-full h-full rounded-full flex flex-col items-center justify-center focus:outline-none relative"
                style={{
                  backgroundColor: hidden ? 'transparent'
                    : b.e ? b.color : b.color + '92',
                  boxShadow: hidden ? 'none'
                    : b.e
                      ? `0 10px 32px ${b.color}70, 0 4px 12px ${b.color}45, inset 0 1px 0 rgba(255,255,255,0.25)`
                      : `0 5px 18px ${b.color}38, inset 0 1px 0 rgba(255,255,255,0.18)`,
                  border: hidden ? `2px dashed ${b.color}70`
                    : b.e ? '2px solid rgba(255,255,255,0.22)' : '1.5px solid rgba(255,255,255,0.14)',
                  animation: editMode && !hidden
                    ? `wiggle 0.55s ease-in-out infinite ${(b.originalIndex % 8) * 0.06}s`
                    : 'none',
                }}
              >
                {hidden ? (
                  <div className="flex flex-col items-center gap-1">
                    <Plus style={{ width: IS * 0.55, height: IS * 0.55, color: b.color + 'bb' }} />
                    <span style={{
                      fontSize: FS - 1, color: b.color + 'aa', maxWidth: SZ - 20,
                      textAlign: 'center', fontWeight: 800, lineHeight: 1.25, padding: '0 4px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      fontFamily: "'Plus Jakarta Sans','Heebo',sans-serif",
                    }}>
                      {b.label}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Icon with drop-shadow for depth */}
                    <Icon
                      className="text-white"
                      style={{
                        width: IS, height: IS, marginBottom: 5,
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.22))',
                      }}
                    />
                    {/* Label — crisp, bold, shadowed */}
                    <span
                      className="text-white text-center"
                      style={{
                        fontSize: FS,
                        fontWeight: 800,
                        fontFamily: "'Plus Jakarta Sans','Heebo',sans-serif",
                        letterSpacing: '0.01em',
                        lineHeight: 1.22,
                        maxWidth: SZ - 14,
                        padding: '0 6px',
                        textShadow: '0 1px 4px rgba(0,0,0,0.28)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {b.label}
                    </span>
                    {/* Active indicator dot */}
                    {b.e && (
                      <div className="absolute bottom-2.5 w-1.5 h-1.5 rounded-full bg-white/70" />
                    )}
                    {!b.e && !editMode && (
                      <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-[5px] font-black text-white/70">◦</span>
                      </div>
                    )}
                  </>
                )}
              </motion.button>
            </div>

            {/* ✕ in edit mode */}
            <AnimatePresence>
              {editMode && !hidden && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={e => { e.stopPropagation(); onToggleBubble(b.sectionTitle, b.originalIndex); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg z-20 border-2 border-white"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, signOut } = useApp();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hiddenMap, setHiddenMap] = useState<Record<string, number[]>>(
    () => loadLayout()?.hiddenMap ?? {}
  );

  useEffect(() => { saveLayout({ hiddenMap }); }, [hiddenMap]);

  const allBubbles = useMemo(() => buildMixedBubbles(SECTIONS), []);

  // Filter bubbles by active section + deduplicate identical labels in "all" view
  const displayBubbles = useMemo(() => {
    if (activeSection) {
      return allBubbles.filter(b => b.sectionTitle === activeSection);
    }
    // Deduplicate: keep first occurrence of each label (from highest-priority section)
    const seen = new Set<string>();
    return allBubbles.filter(b => {
      if (seen.has(b.label)) return false;
      seen.add(b.label);
      return true;
    });
  }, [allBubbles, activeSection]);

  const toggleSection = (title: string) => {
    setActiveSection(prev => prev === title ? null : title);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'בוקר טוב';
    if (h < 17) return 'צהריים טובים';
    if (h < 21) return 'ערב טוב';
    return 'לילה טוב';
  };

  const handleBubbleClick = (b: FlatBubble) => {
    if (b.e && b.path) {
      navigate(b.path);
      return;
    }
    // For disabled bubbles: try navigating to the parent section page
    const sectionPageMap: Record<string, string> = {
      'מסך לידים': '/app/leads',
      'מסך לקוחות': '/app/customers',
      'מסך תהליכים': '/app/execution',
      'כרטיס לקוח — כותרת': '/app/customers',
      'כרטיס לקוח — פעולות': '/app/customers',
      'כרטיס לקוח — טאבים': '/app/customers',
      'טאב מוצרים': '/app/customers',
      'טאב פעילויות': '/app/activity-log',
      'פאנל התראות': '/app/follow-up',
      'הגדרות — הגדרות שלי': '/app/settings',
      'הגדרות — סוכנויות ומשתמשים': '/app/settings',
      'הגדרות — חשבון': '/app/settings',
      'הגדרות — עמיתים סוכנות': '/app/settings',
      'כפתורי מערכת כלליים': '/app/customers',
    };
    const fallback = sectionPageMap[b.sectionTitle];
    if (fallback) {
      navigate(fallback);
      toast(`${b.label} — ניווט ל${b.sectionTitle}`, { icon: '📂' });
    } else {
      toast(`${b.label} — בקרוב`, { icon: '🔜' });
    }
  };

  const toggleBubble = (sec: string, idx: number) => {
    setHiddenMap(prev => {
      const curr = prev[sec] || [];
      return { ...prev, [sec]: curr.includes(idx) ? curr.filter(i => i !== idx) : [...curr, idx] };
    });
  };

  const showAll  = () => { setHiddenMap({}); toast('כל הבועות מוצגות', { icon: '👁️' }); setMenuOpen(false); };
  const resetAll = () => { setHiddenMap({}); toast('הלוח אופס', { icon: '✅' }); setMenuOpen(false); };
  const signOutFn = async () => { await signOut(); navigate('/app/auth'); };

  const totalHidden = Object.values(hiddenMap).reduce((s, a) => s + a.length, 0);
  const totalBubbles = SECTIONS.reduce((s, sec) => s + sec.bubbles.length, 0);

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 relative" style={{ backgroundColor: '#fafafa' }} dir="rtl">

      {/* Wiggle keyframe */}
      <style>{`
        @keyframes wiggle {
          0%,100% { transform: rotate(0deg); }
          25%      { transform: rotate(-2.5deg); }
          75%      { transform: rotate(2.5deg); }
        }
      `}</style>

      {/* ── Background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
        <div className="absolute -top-48 -right-48 w-[560px] h-[560px] rounded-full blur-[100px] opacity-[0.08]" style={{ backgroundColor: '#171717' }} />
        <div className="absolute top-[40%] -left-52 w-[420px] h-[420px] rounded-full blur-[100px] opacity-[0.06]" style={{ backgroundColor: '#b45309' }} />
        <div className="absolute bottom-0 right-[35%] w-[360px] h-[360px] rounded-full blur-[100px] opacity-[0.05]" style={{ backgroundColor: '#171717' }} />
        <svg className="absolute top-0 right-[2%] w-[500px] h-[650px] opacity-[0.1]" viewBox="0 0 500 600" fill="none">
          <motion.path d="M450,30 C380,50 300,130 320,230 C340,330 220,380 160,450 C130,490 140,540 200,560"
            stroke="#171717" strokeWidth="2.5" strokeDasharray="10 8" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.5, delay: 0.3, ease: 'easeInOut' }} />
        </svg>
        <div className="absolute inset-0 opacity-[0.016]"
          style={{ backgroundImage: 'radial-gradient(circle, #171717 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <img src={doodleShield}    alt="" className="absolute top-[4%]  left-[1%]   w-20 opacity-[0.06] rotate-[-14deg]" />
        <img src={doodleTarget}    alt="" className="absolute top-[35%] left-[0.5%] w-16 opacity-[0.05] rotate-[10deg]"  />
        <img src={doodleCharts}    alt="" className="absolute top-[65%] right-[1%]  w-20 opacity-[0.06] rotate-[7deg]"   />
        <img src={doodleGrowth}    alt="" className="absolute top-[80%] left-[1%]   w-16 opacity-[0.05] rotate-[-8deg]"  />
        <img src={doodleLightbulb} alt="" className="absolute top-[50%] right-[1%]  w-14 opacity-[0.05] rotate-[5deg]"   />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
          style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 160, fontWeight: 900,
            color: '#171717', opacity: 0.018, letterSpacing: '0.3em' }}>SEELD</div>
      </div>

      {/* ── Page layout: legend left | main right ── */}
      <div className="relative z-10 flex min-h-screen">

        {/* ══ LEFT LEGEND (desktop only, sticky) ══ */}
        <aside className="hidden lg:flex flex-col gap-1.5 pt-6 pb-10 px-3 sticky top-0 h-screen overflow-y-auto flex-shrink-0 border-l border-gray-100/80"
          style={{ width: 178, backgroundColor: 'rgba(248,249,252,0.85)', backdropFilter: 'blur(10px)' }}>
          <p className="text-[9px] font-black tracking-[0.22em] uppercase text-gray-400 px-1 mb-2">קטגוריות</p>
          {SECTIONS.map(sec => {
            const isActive = activeSection === sec.title;
            return (
              <motion.button
                key={sec.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: SECTIONS.indexOf(sec) * 0.03 }}
                onClick={() => toggleSection(sec.title)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-full text-right transition-all duration-200"
                style={{
                  backgroundColor: isActive ? sec.color : sec.color + '18',
                  border: isActive ? `2px solid ${sec.color}` : `1.5px solid ${sec.color}45`,
                  boxShadow: isActive ? `0 4px 16px ${sec.color}50` : 'none',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isActive ? 'white' : sec.color }} />
                <span className="text-[10.5px] font-extrabold leading-tight"
                  style={{ color: isActive ? 'white' : sec.color }}>
                  {sec.title}
                </span>
                {isActive && <X className="w-3 h-3 mr-auto flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }} />}
              </motion.button>
            );
          })}

          {activeSection && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setActiveSection(null)}
              className="flex items-center justify-center gap-1.5 mt-3 px-3 py-2 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[10px] font-bold">הצג הכל</span>
            </motion.button>
          )}
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <div className="flex-1 min-w-0 px-4 sm:px-5 pt-6 pb-24 overflow-x-hidden">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <SeeIDLogo size={30} />
              <div>
                <div className="text-sm font-black text-[#171717] leading-none"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>SEELD</div>
                <div className="text-[8px] font-bold tracking-[0.2em] text-gray-400 uppercase">פלטפורמה</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              {/* Pencil menu */}
              <div className="relative">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMenuOpen(v => !v)}
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all"
                  style={{
                    backgroundColor: editMode || menuOpen ? '#171717' : 'white',
                    color: editMode || menuOpen ? '#ffffff' : '#94a3b8',
                    border: editMode ? '2px solid #171717' : '2px solid #e2e8f0',
                  }}>
                  <PenTool className="w-3.5 h-3.5" />
                </motion.button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: -10 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className="absolute left-0 top-11 z-50 w-52 rounded-2xl overflow-hidden border border-gray-100"
                        style={{ backgroundColor: 'white', boxShadow: '0 12px 40px rgba(0,0,0,0.16)' }}
                      >
                        <div className="px-4 pt-3 pb-1.5">
                          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-400">ניהול לוח</p>
                        </div>

                        <button onClick={() => { setEditMode(v => !v); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: editMode ? '#171717' : '#f1f5f9' }}>
                            <PenTool className="w-4 h-4" style={{ color: editMode ? '#ffffff' : '#64748b' }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 leading-none mb-0.5">
                              {editMode ? 'סיום עריכה' : 'עריכת לוח'}
                            </p>
                            <p className="text-[10px] text-gray-400">הסתר ושחזר בועות</p>
                          </div>
                        </button>

                        {totalHidden > 0 && (
                          <button onClick={showAll}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-right border-t border-gray-50">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <Eye className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-blue-700 leading-none mb-0.5">הצג הכל</p>
                              <p className="text-[10px] text-blue-400">{totalHidden} בועות מוסתרות</p>
                            </div>
                          </button>
                        )}

                        <button onClick={resetAll}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-right border-t border-gray-50">
                          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                            <RotateCcw className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-red-600 leading-none mb-0.5">איפוס</p>
                            <p className="text-[10px] text-red-400">חזרה לברירת מחדל</p>
                          </div>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Sign out */}
              <button onClick={signOutFn}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-gray-100 text-gray-300 hover:text-red-400 hover:border-red-100 hover:bg-red-50 transition-all">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Edit banner */}
          <AnimatePresence>
            {editMode && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-5">
                <div className="flex items-center justify-between px-5 py-3 rounded-2xl"
                  style={{ backgroundColor: '#171717', boxShadow: '0 4px 20px rgba(23,23,23,0.25)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-teal-400/20 flex items-center justify-center">
                      <PenTool className="w-3.5 h-3.5 text-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-none">מצב עריכה פעיל</p>
                      <p className="text-[10px] text-teal-300/70 mt-0.5">לחץ ✕ להסתרת בועה · לחץ + לשחזור</p>
                    </div>
                  </div>
                  <button onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs"
                    style={{ backgroundColor: '#171717', color: '#ffffff' }}>
                    <Check className="w-3.5 h-3.5" /> סיום
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <p className="text-[9px] font-black tracking-[0.26em] uppercase text-gray-400 mb-0.5"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>SEELD • פלטפורמה</p>
            <h1 className="text-3xl font-black text-[#171717] leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans','Heebo',sans-serif" }}>{getGreeting()}</h1>
            <p className="text-xs text-gray-400 mt-1">
              {activeSection
                ? <><span className="text-[#171717] font-bold">{activeSection}</span>{' · '}{displayBubbles.length} בועות</>
                : <>{totalBubbles - totalHidden} בועות פעילות
                    {totalHidden > 0 && <span className="text-orange-400"> · {totalHidden} מוסתרות</span>}
                  </>
              }
            </p>
          </motion.div>

          {/* Mobile legend — horizontal scroll */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {SECTIONS.map(sec => {
              const isActive = activeSection === sec.title;
              return (
                <motion.button
                  key={sec.title}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleSection(sec.title)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? sec.color : sec.color + 'dd',
                    boxShadow: isActive
                      ? `0 0 0 3px white, 0 0 0 5px ${sec.color}, 0 6px 20px ${sec.color}70`
                      : `0 3px 10px ${sec.color}40`,
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <span className="text-white text-[11px] font-black whitespace-nowrap"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{sec.title}</span>
                  {isActive && <X className="w-3 h-3 text-white/80 ml-1" />}
                </motion.button>
              );
            })}
          </div>

          {/* ── ONE FLAT HONEYCOMB ── */}
          <HoneycombCanvas
            key={activeSection || '__all__'}
            bubbles={displayBubbles}
            hiddenMap={hiddenMap}
            editMode={editMode}
            onToggleBubble={toggleBubble}
            onBubbleClick={handleBubbleClick}
          />
        </div>
      </div>
    </div>
  );
}
