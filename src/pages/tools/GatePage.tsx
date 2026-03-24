import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, ShieldCheck, CheckCircle, Clock, AlertTriangle,
  MoreVertical, FileText, Heart, ClipboardList,
} from "lucide-react";

const MOCK_UNDERWRITING = [
  { id: 1, client: "יוסי כהן", product: "ביטוח חיים — מגדל", questionnaire: "הושלם", conditions: "ללא", approval: "אושר", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", product: "אובדן כושר — הראל", questionnaire: "הושלם", conditions: "החרגת גב", approval: "אושר עם תנאים", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", product: "ביטוח בריאות — כלל", questionnaire: "בתהליך", conditions: "ממתין", approval: "בבדיקה", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", product: "ביטוח חיים — פניקס", questionnaire: "הושלם", conditions: "ללא", approval: "אושר", date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", product: "סיעודי — מנורה", questionnaire: "דורש השלמה", conditions: "ממתין", approval: "בהמתנה", date: "2026-03-20" },
  { id: 6, client: "רחל גולן", product: "מחלות קשות — הראל", questionnaire: "הושלם", conditions: "תקופת המתנה", approval: "אושר עם תנאים", date: "2026-03-19" },
];

const APPROVAL_COLORS: Record<string, { bg: string; text: string }> = {
  "אושר": { bg: "#dcfce7", text: "#166534" },
  "אושר עם תנאים": { bg: "#fef3c7", text: "#92400e" },
  "בבדיקה": { bg: "#dbeafe", text: "#1e40af" },
  "בהמתנה": { bg: "#f3e8ff", text: "#7c3aed" },
  "נדחה": { bg: "#fee2e2", text: "#991b1b" },
};

export default function GatePage() {
  const tool = getToolBySlug("gate")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_UNDERWRITING.filter((u) => u.client.includes(search) || u.product.includes(search));

  const stats = [
    { label: "תהליכי חיתום", value: "42", change: "+8", icon: ShieldCheck, color: tool.color },
    { label: "אושרו", value: "31", change: "+5", icon: CheckCircle, color: "#059669" },
    { label: "עם תנאים", value: "7", change: "+2", icon: AlertTriangle, color: "#f59e0b" },
    { label: "ממתינים להשלמה", value: "4", change: "-1", icon: Clock, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="gate">
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
              placeholder="חיפוש תהליך חיתום..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d3d]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a3d3d] text-white rounded-full text-sm font-medium hover:bg-[#0a3d3d]/90 transition-colors">
            <Plus className="w-4 h-4" />
            חיתום חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין תהליכי חיתום</p>
            <p className="text-sm text-gray-400">התחל תהליך חיתום חדש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">מוצר</th>
                <th className="text-center px-4 py-3 font-medium">שאלון בריאות</th>
                <th className="text-center px-4 py-3 font-medium">תנאים מיוחדים</th>
                <th className="text-center px-4 py-3 font-medium">אישור</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const approvalColor = APPROVAL_COLORS[u.approval] || APPROVAL_COLORS["בהמתנה"];
                return (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{u.client}</td>
                    <td className="px-4 py-3 text-gray-700">{u.product}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${u.questionnaire === "הושלם" ? "text-green-600" : u.questionnaire === "בתהליך" ? "text-blue-600" : "text-orange-500"}`}>
                        {u.questionnaire}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs">{u.conditions}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: approvalColor.bg, color: approvalColor.text }}>
                        {u.approval}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{u.date}</td>
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
