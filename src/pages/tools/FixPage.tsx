import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Wrench, CheckCircle, Clock, AlertTriangle,
  MoreVertical, FileText, RotateCcw, XCircle,
} from "lucide-react";

const MOCK_DEFICIENCIES = [
  { id: 1, client: "יוסי כהן", document: "הצעה לביטוח חיים", company: "מגדל", deficiency: "חסר חתימה בעמוד 3", severity: "קלה", status: "תוקן", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", document: "בקשה להצטרפות", company: "הראל", deficiency: "תעודת זהות לא קריאה", severity: "בינונית", status: "בטיפול", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", document: "טופס העברת קרן", company: "כלל", deficiency: "שדה תאריך לידה חסר", severity: "קלה", status: "תוקן", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", document: "שאלון בריאות", company: "פניקס", deficiency: "שאלון לא מלא — סעיפים 7-12", severity: "קריטית", status: "ממתין ללקוח", date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", document: "ייפוי כוח", company: "מנורה", deficiency: "תוקף ייפוי כוח פג", severity: "קריטית", status: "בטיפול", date: "2026-03-20" },
  { id: 6, client: "רחל גולן", document: "הצעה לביטוח בריאות", company: "הראל", deficiency: "אי-התאמה בכתובת", severity: "קלה", status: "תוקן", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "תוקן": { bg: "#dcfce7", text: "#166534" },
  "בטיפול": { bg: "#dbeafe", text: "#1e40af" },
  "ממתין ללקוח": { bg: "#fef3c7", text: "#92400e" },
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  "קלה": { bg: "#dcfce7", text: "#166534" },
  "בינונית": { bg: "#fef3c7", text: "#92400e" },
  "קריטית": { bg: "#fee2e2", text: "#991b1b" },
};

export default function FixPage() {
  const tool = getToolBySlug("fix")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_DEFICIENCIES.filter((d) => d.client.includes(search) || d.deficiency.includes(search));

  const stats = [
    { label: "ליקויים שזוהו", value: "48", change: "+6", icon: Wrench, color: tool.color },
    { label: "תוקנו", value: "38", change: "+8", icon: CheckCircle, color: "#059669" },
    { label: "בטיפול", value: "7", change: "-2", icon: RotateCcw, color: "#f59e0b" },
    { label: "קריטיים", value: "3", change: "+1", icon: AlertTriangle, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="fix">
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
              placeholder="חיפוש ליקוי לפי לקוח או תיאור..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d3d]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a3d3d] text-white rounded-full text-sm font-medium hover:bg-[#0a3d3d]/90 transition-colors">
            <Plus className="w-4 h-4" />
            דיווח ליקוי
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין ליקויים להצגה</p>
            <p className="text-sm text-gray-400">מצוין! אין ליקויים פתוחים</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">מסמך</th>
                <th className="text-center px-4 py-3 font-medium">חברה</th>
                <th className="text-right px-4 py-3 font-medium">ליקוי</th>
                <th className="text-center px-4 py-3 font-medium">חומרה</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const statusColor = STATUS_COLORS[d.status] || STATUS_COLORS["בטיפול"];
                const severityColor = SEVERITY_COLORS[d.severity] || SEVERITY_COLORS["בינונית"];
                return (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.client}</td>
                    <td className="px-4 py-3 text-gray-700">{d.document}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{d.company}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{d.deficiency}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: severityColor.bg, color: severityColor.text }}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{d.date}</td>
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
