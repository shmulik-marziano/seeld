import { useState } from "react";
import ToolPage from "./ToolPage";
import {
  Search, Plus, Send, CheckCircle, Clock, AlertTriangle,
  MoreVertical, Mail, Globe, Bot, ExternalLink,
} from "lucide-react";

const MOCK_SUBMISSIONS = [
  { id: 1, client: "יוסי כהן", document: "הצעה לביטוח חיים", company: "מגדל", method: "מייל", status: "נשלח", confirmId: "MG-2026-4521", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", document: "בקשה להצטרפות", company: "הראל", method: "פורטל", status: "התקבל", confirmId: "HR-2026-1234", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", document: "טופס העברת קרן", company: "כלל", method: "מייל", status: "נשלח", confirmId: "KL-2026-7890", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", document: "שאלון בריאות", company: "פניקס", method: "RPA", status: "נכשל", confirmId: null, date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", document: "בקשה לשינוי מוטבים", company: "מנורה", method: "פורטל", status: "בתהליך", confirmId: null, date: "2026-03-20" },
  { id: 6, client: "רחל גולן", document: "הצעה לביטוח בריאות", company: "הראל", method: "מייל", status: "התקבל", confirmId: "HR-2026-5678", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "נשלח": { bg: "#DFE9DC", text: "#55677C" },
  "התקבל": { bg: "#DFE9DC", text: "#2F6B4E" },
  "בתהליך": { bg: "#F5EEE0", text: "#7C5C22" },
  "נכשל": { bg: "#F3E2D8", text: "#9A4520" },
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  "מייל": Mail,
  "פורטל": Globe,
  "RPA": Bot,
};

export default function LaunchPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_SUBMISSIONS.filter((s) => s.client.includes(search) || s.company.includes(search));

  const stats = [
    { label: "שיגורים החודש", value: "67", change: "+14", icon: Send, color: "#203957" },
    { label: "התקבלו בהצלחה", value: "58", change: "+11", icon: CheckCircle, color: "#2F6B4E" },
    { label: "ממתינים לאישור", value: "6", change: "-2", icon: Clock, color: "#7C5C22" },
    { label: "נכשלו", value: "3", change: "+1", icon: AlertTriangle, color: "#9A4520" },
  ];

  return (
    <ToolPage slug="launch">
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
              placeholder="חיפוש שיגור לפי לקוח או חברה..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#D9DEE4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#203957]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#203957] text-white rounded-full text-sm font-medium hover:bg-[#203957]/90 transition-colors">
            <Plus className="w-4 h-4" />
            שיגור חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#203957]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DFE9DC] mx-auto mb-4 flex items-center justify-center">
              <Send className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#55677C] font-medium mb-1">אין שיגורים להצגה</p>
            <p className="text-sm text-[#55677C]">שגר מסמכים לחברות הביטוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#55677C]">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">מסמך</th>
                <th className="text-center px-4 py-3 font-medium">חברה</th>
                <th className="text-center px-4 py-3 font-medium">אמצעי</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">מס׳ אישור</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const statusColor = STATUS_COLORS[s.status] || STATUS_COLORS["בתהליך"];
                const MethodIcon = METHOD_ICONS[s.method] || Mail;
                return (
                  <tr key={s.id} className="border-t border-[#E8E6DE] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#203957]">{s.client}</td>
                    <td className="px-4 py-3 text-[#2D435D]">{s.document}</td>
                    <td className="px-4 py-3 text-center text-[#55677C]">{s.company}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#55677C]">
                        <MethodIcon className="w-3.5 h-3.5" />
                        <span className="text-xs">{s.method}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-[#55677C] font-mono">{s.confirmId || "—"}</td>
                    <td className="px-4 py-3 text-center text-[#55677C]">{s.date}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1.5 hover:bg-[#DFE9DC] rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-[#55677C]" />
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
