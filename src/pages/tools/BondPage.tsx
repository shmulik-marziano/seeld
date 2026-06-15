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
  "מתוכנן": { bg: "#dbeafe", text: "#1e40af" },
  "דחוף": { bg: "#fee2e2", text: "#991b1b" },
  "בטיפול": { bg: "#fef3c7", text: "#92400e" },
  "הושלם": { bg: "#dcfce7", text: "#166534" },
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
    { label: "חידושים החודש", value: "8", change: "+2", icon: Calendar, color: "#059669" },
    { label: "ימי הולדת השבוע", value: "4", change: "-", icon: Cake, color: "#f59e0b" },
    { label: "דורשים תשומת לב", value: "6", change: "+3", icon: Bell, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="bond">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#1a1a4b]/[0.06] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-xs text-green-600 font-medium">{s.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#1a1a4b]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לקוח או אירוע..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a4b]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a4b] text-white rounded-full text-sm font-medium hover:bg-[#1a1a4b]/90 transition-colors">
            <Plus className="w-4 h-4" />
            אירוע חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#1a1a4b]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <HeartHandshake className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין אירועי שימור</p>
            <p className="text-sm text-gray-400">הוסף אירוע חיים או תזכורת חידוש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
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
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.client}</td>
                    <td className="px-4 py-3 text-gray-700">{r.event}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span className="text-xs">{r.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px]">{r.action}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{r.lastContact}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
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
