import { useState } from "react";
import ToolPage from "./ToolPage";
import {
  Search, Plus, FileEdit, CheckCircle, Clock, Download,
  MoreVertical, FileText, AlertCircle, Printer,
} from "lucide-react";

const MOCK_FORMS = [
  { id: 1, client: "יוסי כהן", form: "הצעה לביטוח חיים — מגדל", fields: 42, filled: 42, status: "מוכן", company: "מגדל", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", form: "בקשה להצטרפות — הראל", fields: 38, filled: 35, status: "חסרים שדות", company: "הראל", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", form: "טופס העברת קרן — כלל", fields: 28, filled: 28, status: "מוכן", company: "כלל", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", form: "שאלון בריאות — פניקס", fields: 56, filled: 40, status: "בעיבוד", company: "פניקס", date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", form: "בקשה לשינוי מוטבים", fields: 15, filled: 15, status: "מוכן", company: "מנורה", date: "2026-03-20" },
  { id: 6, client: "רחל גולן", form: "הצעה לביטוח בריאות — הראל", fields: 45, filled: 30, status: "בעיבוד", company: "הראל", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "מוכן": { bg: "#DFE9DC", text: "#2F6B4E" },
  "חסרים שדות": { bg: "#F5EEE0", text: "#7C5C22" },
  "בעיבוד": { bg: "#DFE9DC", text: "#55677C" },
};

export default function FillPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_FORMS.filter((f) => f.client.includes(search) || f.form.includes(search));

  const stats = [
    { label: "טפסים שהופקו", value: "234", change: "+18", icon: FileEdit, color: "#203957" },
    { label: "מוכנים לשיגור", value: "12", change: "+4", icon: CheckCircle, color: "#2F6B4E" },
    { label: "שדות שמולאו", value: "8,421", change: "+342", icon: FileText, color: "#7C5C22" },
    { label: "חסרים השלמה", value: "5", change: "-1", icon: AlertCircle, color: "#9A4520" },
  ];

  return (
    <ToolPage slug="fill">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#203957]/[0.06] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <span className="text-xs text-[#2F6B4E] font-medium">{s.change}</span>
            </div>
            <p className="text-2xl font-bold text-[#203957]">{s.value}</p>
            <p className="text-sm text-[#55677C] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#203957]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55677C]" />
            <input
              type="text"
              placeholder="חיפוש טופס לפי לקוח או שם..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#D9DEE4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#203957]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#203957] text-white rounded-full text-sm font-medium hover:bg-[#203957]/90 transition-colors">
            <Plus className="w-4 h-4" />
            הפקת טופס
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#203957]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DFE9DC] mx-auto mb-4 flex items-center justify-center">
              <FileEdit className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#55677C] font-medium mb-1">אין טפסים להצגה</p>
            <p className="text-sm text-[#55677C]">הפק טופס חדש מנתוני הלקוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#55677C]">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">טופס</th>
                <th className="text-center px-4 py-3 font-medium">חברה</th>
                <th className="text-center px-4 py-3 font-medium">שדות</th>
                <th className="text-center px-4 py-3 font-medium">מולאו</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const statusColor = STATUS_COLORS[f.status] || STATUS_COLORS["בעיבוד"];
                const pct = Math.round((f.filled / f.fields) * 100);
                return (
                  <tr key={f.id} className="border-t border-[#E8E6DE] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#203957]">{f.client}</td>
                    <td className="px-4 py-3 text-[#2D435D]">{f.form}</td>
                    <td className="px-4 py-3 text-center text-[#55677C]">{f.company}</td>
                    <td className="px-4 py-3 text-center text-[#55677C]">{f.fields}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-[#D9DEE4] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#2F6B4E" : "#7C5C22" }} />
                        </div>
                        <span className="text-xs text-[#55677C]">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#55677C]">{f.date}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-[#DFE9DC] rounded-lg transition-colors" title="הורדה">
                          <Download className="w-4 h-4 text-[#55677C]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#DFE9DC] rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-[#55677C]" />
                        </button>
                      </div>
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
