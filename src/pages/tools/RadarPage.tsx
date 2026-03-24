import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Radar, CheckCircle, AlertTriangle, Eye,
  MoreVertical, Shield, BarChart3, Clock, FileText,
} from "lucide-react";

const MOCK_COMPLIANCE = [
  { id: 1, category: "הסכמת לקוח", item: "חתימה על טופס 17 — יוסי כהן", regulation: "חוזר רגולציה 2024-01", dueDate: "2026-03-28", status: "תקין", risk: "נמוך" },
  { id: 2, category: "תיעוד פגישות", item: "פגישת ייעוץ — מיכל לוי", regulation: "חובת תיעוד", dueDate: "2026-03-25", status: "חסר", risk: "גבוה" },
  { id: 3, category: "גילוי נאות", item: "מכתב גילוי — דוד ישראלי", regulation: "חוזר גילוי 2023-05", dueDate: "2026-03-30", status: "תקין", risk: "נמוך" },
  { id: 4, category: "הכשרה", item: "השתלמות שנתית — שמוליק", regulation: "חובת הכשרה 12 שעות", dueDate: "2026-06-30", status: "בתהליך", risk: "בינוני" },
  { id: 5, category: "דו״ח שנתי", item: "דו״ח ציות רבעון 1", regulation: "דיווח רגולטורי", dueDate: "2026-04-15", status: "בהכנה", risk: "בינוני" },
  { id: 6, category: "ביטוח מקצועי", item: "חידוש ביטוח אחריות מקצועית", regulation: "חובת ביטוח", dueDate: "2026-05-01", status: "תקין", risk: "נמוך" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "תקין": { bg: "#dcfce7", text: "#166534" },
  "חסר": { bg: "#fee2e2", text: "#991b1b" },
  "בתהליך": { bg: "#dbeafe", text: "#1e40af" },
  "בהכנה": { bg: "#fef3c7", text: "#92400e" },
};

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  "נמוך": { bg: "#dcfce7", text: "#166534" },
  "בינוני": { bg: "#fef3c7", text: "#92400e" },
  "גבוה": { bg: "#fee2e2", text: "#991b1b" },
};

export default function RadarPage() {
  const tool = getToolBySlug("radar")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_COMPLIANCE.filter((c) => c.item.includes(search) || c.category.includes(search));

  const stats = [
    { label: "פריטי בקרה", value: "42", change: "+3", icon: Radar, color: tool.color },
    { label: "תקינים", value: "35", change: "+2", icon: CheckCircle, color: "#059669" },
    { label: "דורשים טיפול", value: "4", change: "+1", icon: AlertTriangle, color: "#f59e0b" },
    { label: "סיכון גבוה", value: "1", change: "-", icon: Shield, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="radar">
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
              placeholder="חיפוש פריט בקרה..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d3d]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a3d3d] text-white rounded-full text-sm font-medium hover:bg-[#0a3d3d]/90 transition-colors">
            <Plus className="w-4 h-4" />
            פריט בקרה חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Radar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין פריטי בקרה</p>
            <p className="text-sm text-gray-400">הוסף פריט בקרה חדש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">קטגוריה</th>
                <th className="text-right px-4 py-3 font-medium">פריט</th>
                <th className="text-right px-4 py-3 font-medium">רגולציה</th>
                <th className="text-center px-4 py-3 font-medium">יעד</th>
                <th className="text-center px-4 py-3 font-medium">סיכון</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const statusColor = STATUS_COLORS[c.status] || STATUS_COLORS["בתהליך"];
                const riskColor = RISK_COLORS[c.risk] || RISK_COLORS["בינוני"];
                return (
                  <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.category}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">{c.item}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.regulation}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{c.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: riskColor.bg, color: riskColor.text }}>
                        {c.risk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {c.status}
                      </span>
                    </td>
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
