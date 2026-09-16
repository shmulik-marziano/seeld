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
  "ממצאים": { bg: "#F5EEE0", text: "#8A6230" },
  "הושלם": { bg: "#E8EDE5", text: "#2F6B4E" },
  "תקין": { bg: "#E8EDE5", text: "#476356" },
  "בניתוח": { bg: "#DDE6DA", text: "#476356" },
};

export default function XRayPage() {
  const tool = getToolBySlug("x-ray")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_ANALYSES.filter((a) => a.client.includes(search));

  const stats = [
    { label: "תיקים שנותחו", value: "156", change: "+12", icon: BarChart3, color: tool.color },
    { label: "פערים שזוהו", value: "89", change: "+23", icon: AlertTriangle, color: "#CBA064" },
    { label: "חיסכון פוטנציאלי", value: "₪45K", change: "+8%", icon: DollarSign, color: "#2F6B4E" },
    { label: "כפילויות", value: "14", change: "-3", icon: TrendingDown, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="x-ray">
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
              placeholder="חיפוש לקוח לניתוח..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            ניתוח חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין ניתוחים להצגה</p>
            <p className="text-sm text-[#476356]">הפעל ניתוח חדש על תיק לקוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
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
                  <tr key={a.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{a.client}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">{a.products}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={a.gaps > 0 ? "text-[#8A6230] font-medium" : "text-[#476356]"}>{a.gaps}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={a.duplicates > 0 ? "text-[#9A4520] font-medium" : "text-[#476356]"}>{a.duplicates}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={a.highFees > 0 ? "text-[#9A4520] font-medium" : "text-[#476356]"}>{a.highFees}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-[#2F6B4E]">{a.savings}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356]">{a.date}</td>
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
