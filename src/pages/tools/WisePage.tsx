import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Lightbulb, CheckCircle, Clock, Send,
  MoreVertical, FileText, Users, TrendingUp,
} from "lucide-react";

const MOCK_RECOMMENDATIONS = [
  { id: 1, client: "יוסי כהן", title: "העברת קרן פנסיה למגדל", type: "פנסיה", reason: "דמי ניהול גבוהים - חיסכון של ₪840/שנה", priority: "גבוהה", status: "אושרה", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", title: "תוספת כיסוי אובדן כושר", type: "ביטוח", reason: "פער בכיסוי — אין הגנה מפני אובדן כושר עבודה", priority: "גבוהה", status: "ממתינה", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", title: "ביטול כפילות ביטוח חיים", type: "ביטוח", reason: "כפילות בין שתי פוליסות — חיסכון ₪320/חודש", priority: "בינונית", status: "בהכנה", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", title: "הגדלת הפקדות פנסיה", type: "פנסיה", reason: "ניצול חסר של הטבת מס — הפסד של ₪4,200/שנה", priority: "גבוהה", status: "נשלחה", date: "2026-03-22" },
  { id: 5, client: "אבי מזרחי", title: "מעבר לביטוח בריאות משופר", type: "ביטוח", reason: "כיסוי לא מספק — חסרה רפואה משלימה", priority: "בינונית", status: "אושרה", date: "2026-03-21" },
  { id: 6, client: "רחל גולן", title: "פתיחת קרן השתלמות", type: "חיסכון", reason: "לא מנצלת הטבת מס — חיסכון פוטנציאלי ₪6,500/שנה", priority: "גבוהה", status: "בהכנה", date: "2026-03-20" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "אושרה": { bg: "#dcfce7", text: "#166534" },
  "ממתינה": { bg: "#fef3c7", text: "#92400e" },
  "בהכנה": { bg: "#e0f2fe", text: "#0369a1" },
  "נשלחה": { bg: "#f3e8ff", text: "#7c3aed" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  "גבוהה": { bg: "#fee2e2", text: "#991b1b" },
  "בינונית": { bg: "#fef3c7", text: "#92400e" },
  "נמוכה": { bg: "#dcfce7", text: "#166534" },
};

export default function WisePage() {
  const tool = getToolBySlug("wise")!;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_RECOMMENDATIONS.filter((r) => {
    const matchSearch = r.client.includes(search) || r.title.includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: "המלצות פעילות", value: "34", change: "+6", icon: Lightbulb, color: tool.color },
    { label: "אושרו החודש", value: "18", change: "+4", icon: CheckCircle, color: "#059669" },
    { label: "חיסכון מצטבר", value: "₪128K", change: "+15%", icon: TrendingUp, color: "#0891b2" },
    { label: "ממתינות ללקוח", value: "8", change: "-2", icon: Clock, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="wise">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] p-5">
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

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש המלצה לפי לקוח או נושא..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d3d]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="בהכנה">בהכנה</option>
            <option value="ממתינה">ממתינה</option>
            <option value="נשלחה">נשלחה</option>
            <option value="אושרה">אושרה</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a3d3d] text-white rounded-full text-sm font-medium hover:bg-[#0a3d3d]/90 transition-colors">
            <Plus className="w-4 h-4" />
            המלצה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין המלצות להצגה</p>
            <p className="text-sm text-gray-400">צור המלצה חדשה או שנה את מסנני החיפוש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">המלצה</th>
                <th className="text-right px-4 py-3 font-medium">נימוק</th>
                <th className="text-center px-4 py-3 font-medium">עדיפות</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const statusColor = STATUS_COLORS[r.status] || STATUS_COLORS["בהכנה"];
                const priorityColor = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS["בינונית"];
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.client}</td>
                    <td className="px-4 py-3 text-gray-700">{r.title}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[250px] truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: priorityColor.bg, color: priorityColor.text }}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{r.date}</td>
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
