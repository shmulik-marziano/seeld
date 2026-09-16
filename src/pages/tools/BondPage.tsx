import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, HeartHandshake, CheckCircle, Clock, Gift,
  MoreVertical, Calendar, Bell, Users, Cake,
} from "lucide-react";

const MOCK_RETENTION = [
  { id: 1, client: "יוסי כהן", event: "יום הולדת 45", type: "יום הולדת", action: "שליחת ברכה + הצעת סקירה", dueDate: "2026-04-02", status: "מתוכנן", lastContact: "2026-03-15" },
  { id: 2, client: "מיכל לוי", event: "חידוש פוליסה שנתי", type: "חידוש", action: "תזכורת חידוש + בדיקת תנאים", dueDate: "2026-03-30", status: "דחוף", lastContact: "2026-02-20" },
  { id: 3, client: "דוד ישראלי", event: "נישואים", type: "אירוע חיים", action: "עדכון מוטבים + הצעת ביטוח משפחתי", dueDate: "2026-03-28", status: "בטיפול", lastContact: "2026-03-22" },
  { id: 4, client: "שרה אברהם", event: "לידת ילד", type: "אירוע חיים", action: "פתיחת חיסכון לילד + עדכון כיסויים", dueDate: "2026-03-25", status: "דחוף", lastContact: "2026-03-10" },
  { id: 5, client: "אבי מזרחי", event: "3 שנים בלי סקירה", type: "שימור", action: "פגישת סקירה שנתית", dueDate: "2026-04-05", status: "מתוכנן", lastContact: "2023-06-15" },
  { id: 6, client: "רחל גולן", event: "חידוש ביטוח רכב", type: "חידוש", action: "בדיקת מחיר והשוואה", dueDate: "2026-04-10", status: "מתוכנן", lastContact: "2026-01-18" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "מתוכנן": { bg: "#E8EDE5", text: "#476356" },
  "דחוף": { bg: "#F3E2D8", text: "#9A4520" },
  "בטיפול": { bg: "#F5EEE0", text: "#8A6230" },
  "הושלם": { bg: "#E8EDE5", text: "#2F6B4E" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  "יום הולדת": Cake,
  "חידוש": Calendar,
  "אירוע חיים": Gift,
  "שימור": HeartHandshake,
};

export default function BondPage() {
  const tool = getToolBySlug("bond")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_RETENTION.filter((r) => r.client.includes(search) || r.event.includes(search));

  const stats = [
    { label: "אירועים קרובים", value: "23", change: "+5", icon: HeartHandshake, color: tool.color },
    { label: "חידושים החודש", value: "8", change: "+2", icon: Calendar, color: "#2F6B4E" },
    { label: "ימי הולדת השבוע", value: "4", change: "-", icon: Cake, color: "#CBA064" },
    { label: "דורשים תשומת לב", value: "6", change: "+3", icon: Bell, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="bond">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-xs text-[#2F6B4E] font-medium">{s.change}</span>
            </div>
            <p className="text-2xl font-bold text-[#003D30]">{s.value}</p>
            <p className="text-sm text-[#476356] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#476356]" />
            <input
              type="text"
              placeholder="חיפוש לקוח או אירוע..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            אירוע חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <HeartHandshake className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין אירועי שימור</p>
            <p className="text-sm text-[#476356]">הוסף אירוע חיים או תזכורת חידוש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">אירוע</th>
                <th className="text-center px-4 py-3 font-medium">סוג</th>
                <th className="text-right px-4 py-3 font-medium">פעולה נדרשת</th>
                <th className="text-center px-4 py-3 font-medium">יעד</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">קשר אחרון</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const statusColor = STATUS_COLORS[r.status] || STATUS_COLORS["מתוכנן"];
                const TypeIcon = TYPE_ICONS[r.type] || HeartHandshake;
                return (
                  <tr key={r.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{r.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{r.event}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#476356]">
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span className="text-xs">{r.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#476356] text-xs max-w-[200px]">{r.action}</td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{r.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{r.lastContact}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 hover:bg-[#E8EDE5] rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-[#476356]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </ToolPage>
  );
}
