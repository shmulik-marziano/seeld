import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Headphones, CheckCircle, Clock, AlertTriangle,
  MoreVertical, MessageSquare, User, Tag,
} from "lucide-react";

const MOCK_TICKETS = [
  { id: "T-1024", client: "יוסי כהן", subject: "שינוי מוטבים — פנסיה מגדל", category: "שינוי מוטבים", priority: "רגילה", status: "פתוח", assignee: "שמוליק", date: "2026-03-24" },
  { id: "T-1023", client: "מיכל לוי", subject: "הנפקת אישור ביטוח לבנק", category: "אישורים", priority: "דחוף", status: "בטיפול", assignee: "שמוליק", date: "2026-03-23" },
  { id: "T-1022", client: "דוד ישראלי", subject: "עדכון כתובת בכל הפוליסות", category: "עדכון פרטים", priority: "רגילה", status: "הושלם", assignee: "מירב", date: "2026-03-22" },
  { id: "T-1021", client: "שרה אברהם", subject: "בירור חיוב כפול בביטוח רכב", category: "בירור חיוב", priority: "גבוהה", status: "בטיפול", assignee: "שמוליק", date: "2026-03-21" },
  { id: "T-1020", client: "אבי מזרחי", subject: "בקשה לקבלת דו״ח שנתי", category: "אישורים", priority: "רגילה", status: "הושלם", assignee: "מירב", date: "2026-03-20" },
  { id: "T-1019", client: "רחל גולן", subject: "שינוי אמצעי תשלום", category: "עדכון פרטים", priority: "רגילה", status: "פתוח", assignee: "שמוליק", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "פתוח": { bg: "#e0f2fe", text: "#0369a1" },
  "בטיפול": { bg: "#fef3c7", text: "#92400e" },
  "הושלם": { bg: "#dcfce7", text: "#166534" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  "דחוף": { bg: "#fee2e2", text: "#991b1b" },
  "גבוהה": { bg: "#fef3c7", text: "#92400e" },
  "רגילה": { bg: "#f1f5f9", text: "#475569" },
};

export default function DeskPage() {
  const tool = getToolBySlug("desk")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_TICKETS.filter((t) => t.client.includes(search) || t.subject.includes(search) || t.id.includes(search));

  const stats = [
    { label: "פניות פתוחות", value: "14", change: "+3", icon: Headphones, color: tool.color },
    { label: "טופלו היום", value: "6", change: "+2", icon: CheckCircle, color: "#059669" },
    { label: "זמן טיפול ממוצע", value: "2.4 שע׳", change: "-0.3", icon: Clock, color: "#f59e0b" },
    { label: "דחופים", value: "2", change: "+1", icon: AlertTriangle, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="desk">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] p-5">
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

      <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש פניה לפי לקוח, נושא או מזהה..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#171717] text-white rounded-full text-sm font-medium hover:bg-[#171717]/90 transition-colors">
            <Plus className="w-4 h-4" />
            פניה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Headphones className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין פניות להצגה</p>
            <p className="text-sm text-gray-400">פתח פניית שירות חדשה</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">מזהה</th>
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">נושא</th>
                <th className="text-center px-4 py-3 font-medium">קטגוריה</th>
                <th className="text-center px-4 py-3 font-medium">עדיפות</th>
                <th className="text-center px-4 py-3 font-medium">מטפל</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const statusColor = STATUS_COLORS[t.status] || STATUS_COLORS["פתוח"];
                const priorityColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS["רגילה"];
                return (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.client}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{t.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: priorityColor.bg, color: priorityColor.text }}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="text-xs">{t.assignee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{t.date}</td>
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
