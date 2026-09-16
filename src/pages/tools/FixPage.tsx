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
  "תוקן": { bg: "#E8EDE5", text: "#2F6B4E" },
  "בטיפול": { bg: "#E8EDE5", text: "#476356" },
  "ממתין ללקוח": { bg: "#F5EEE0", text: "#8A6230" },
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  "קלה": { bg: "#E8EDE5", text: "#2F6B4E" },
  "בינונית": { bg: "#F5EEE0", text: "#8A6230" },
  "קריטית": { bg: "#F3E2D8", text: "#9A4520" },
};

export default function FixPage() {
  const tool = getToolBySlug("fix")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_DEFICIENCIES.filter((d) => d.client.includes(search) || d.deficiency.includes(search));

  const stats = [
    { label: "ליקויים שזוהו", value: "48", change: "+6", icon: Wrench, color: tool.color },
    { label: "תוקנו", value: "38", change: "+8", icon: CheckCircle, color: "#2F6B4E" },
    { label: "בטיפול", value: "7", change: "-2", icon: RotateCcw, color: "#CBA064" },
    { label: "קריטיים", value: "3", change: "+1", icon: AlertTriangle, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="fix">
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
              placeholder="חיפוש ליקוי לפי לקוח או תיאור..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            דיווח ליקוי
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין ליקויים להצגה</p>
            <p className="text-sm text-[#476356]">מצוין! אין ליקויים פתוחים</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
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
                  <tr key={d.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{d.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{d.document}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">{d.company}</td>
                    <td className="px-4 py-3 text-[#476356] max-w-[200px] truncate">{d.deficiency}</td>
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
                    <td className="px-4 py-3 text-center text-[#476356]">{d.date}</td>
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
