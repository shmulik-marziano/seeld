import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Presentation, CheckCircle, Clock, Eye,
  MoreVertical, ThumbsUp, ThumbsDown, Send, Users,
} from "lucide-react";

const MOCK_PRESENTATIONS = [
  { id: 1, client: "יוסי כהן", title: "סקירת תיק ביטוח ופנסיה 2026", recommendations: 4, approved: 3, rejected: 0, pending: 1, status: "הוצג", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", title: "תכנית שדרוג כיסויים", recommendations: 2, approved: 2, rejected: 0, pending: 0, status: "אושר", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", title: "ניתוח תיק מקיף — 12 מוצרים", recommendations: 6, approved: 1, rejected: 2, pending: 3, status: "הוצג", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", title: "סקירת פנסיה שנתית", recommendations: 3, approved: 0, rejected: 0, pending: 3, status: "טרם הוצג", date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", title: "המלצות חיסכון מס", recommendations: 2, approved: 2, rejected: 0, pending: 0, status: "אושר", date: "2026-03-20" },
  { id: 6, client: "רחל גולן", title: "תכנית ביטוח משפחתית", recommendations: 5, approved: 0, rejected: 0, pending: 5, status: "מוכן", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "הוצג": { bg: "#dbeafe", text: "#1e40af" },
  "אושר": { bg: "#dcfce7", text: "#166534" },
  "טרם הוצג": { bg: "#f3e8ff", text: "#7c3aed" },
  "מוכן": { bg: "#fef3c7", text: "#92400e" },
};

export default function StagePage() {
  const tool = getToolBySlug("stage")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_PRESENTATIONS.filter((p) => p.client.includes(search) || p.title.includes(search));

  const stats = [
    { label: "מצגות החודש", value: "24", change: "+5", icon: Presentation, color: tool.color },
    { label: "אושרו", value: "18", change: "+3", icon: ThumbsUp, color: "#059669" },
    { label: "שיעור אישור", value: "75%", change: "+8%", icon: CheckCircle, color: "#f59e0b" },
    { label: "ממתינים להצגה", value: "6", change: "-", icon: Clock, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="stage">
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
              placeholder="חיפוש מצגת לפי לקוח..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a4b]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a4b] text-white rounded-full text-sm font-medium hover:bg-[#1a1a4b]/90 transition-colors">
            <Plus className="w-4 h-4" />
            מצגת חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#1a1a4b]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Presentation className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין מצגות להצגה</p>
            <p className="text-sm text-gray-400">צור מצגת חדשה ללקוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">כותרת</th>
                <th className="text-center px-4 py-3 font-medium">המלצות</th>
                <th className="text-center px-4 py-3 font-medium">אושרו</th>
                <th className="text-center px-4 py-3 font-medium">נדחו</th>
                <th className="text-center px-4 py-3 font-medium">ממתינות</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS["מוכן"];
                return (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.client}</td>
                    <td className="px-4 py-3 text-gray-700">{p.title}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.recommendations}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.approved > 0 ? "text-green-600 font-medium" : "text-gray-400"}>{p.approved}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.rejected > 0 ? "text-red-500 font-medium" : "text-gray-400"}>{p.rejected}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.pending > 0 ? "text-orange-500 font-medium" : "text-gray-400"}>{p.pending}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{p.date}</td>
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
