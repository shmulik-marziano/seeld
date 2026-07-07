import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, AlertTriangle, CheckCircle, TrendingDown,
  BarChart3, MoreVertical, Eye, FileText, DollarSign,
} from "lucide-react";

const MOCK_ANALYSES = [
  { id: 1, client: "יוסי כהן", products: 8, gaps: 3, duplicates: 1, highFees: 2, savings: "₪1,240/שנה", status: "ממצאים", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", products: 5, gaps: 1, duplicates: 0, highFees: 1, savings: "₪680/שנה", status: "הושלם", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", products: 12, gaps: 5, duplicates: 2, highFees: 4, savings: "₪3,100/שנה", status: "ממצאים", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", products: 3, gaps: 0, duplicates: 0, highFees: 0, savings: "₪0", status: "תקין", date: "2026-03-22" },
  { id: 5, client: "אבי מזרחי", products: 7, gaps: 2, duplicates: 1, highFees: 3, savings: "₪2,450/שנה", status: "בניתוח", date: "2026-03-21" },
  { id: 6, client: "רחל גולן", products: 6, gaps: 1, duplicates: 0, highFees: 2, savings: "₪890/שנה", status: "הושלם", date: "2026-03-20" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "ממצאים": { bg: "#fef3c7", text: "#92400e" },
  "הושלם": { bg: "#dcfce7", text: "#166534" },
  "תקין": { bg: "#e0f2fe", text: "#0369a1" },
  "בניתוח": { bg: "#f3e8ff", text: "#7c3aed" },
};

export default function XRayPage() {
  const tool = getToolBySlug("x-ray")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_ANALYSES.filter((a) => a.client.includes(search));

  const stats = [
    { label: "תיקים שנותחו", value: "156", change: "+12", icon: BarChart3, color: tool.color },
    { label: "פערים שזוהו", value: "89", change: "+23", icon: AlertTriangle, color: "#f59e0b" },
    { label: "חיסכון פוטנציאלי", value: "₪45K", change: "+8%", icon: DollarSign, color: "#059669" },
    { label: "כפילויות", value: "14", change: "-3", icon: TrendingDown, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="x-ray">
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
              placeholder="חיפוש לקוח לניתוח..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#171717] text-white rounded-full text-sm font-medium hover:bg-[#171717]/90 transition-colors">
            <Plus className="w-4 h-4" />
            ניתוח חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין ניתוחים להצגה</p>
            <p className="text-sm text-gray-400">הפעל ניתוח חדש על תיק לקוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-center px-4 py-3 font-medium">מוצרים</th>
                <th className="text-center px-4 py-3 font-medium">פערים</th>
                <th className="text-center px-4 py-3 font-medium">כפילויות</th>
                <th className="text-center px-4 py-3 font-medium">דמי ניהול גבוהים</th>
                <th className="text-center px-4 py-3 font-medium">חיסכון פוטנציאלי</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const statusColor = STATUS_COLORS[a.status] || STATUS_COLORS["הושלם"];
                return (
                  <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{a.client}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{a.products}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={a.gaps > 0 ? "text-orange-600 font-medium" : "text-gray-400"}>{a.gaps}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={a.duplicates > 0 ? "text-red-500 font-medium" : "text-gray-400"}>{a.duplicates}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={a.highFees > 0 ? "text-red-500 font-medium" : "text-gray-400"}>{a.highFees}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">{a.savings}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{a.date}</td>
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
