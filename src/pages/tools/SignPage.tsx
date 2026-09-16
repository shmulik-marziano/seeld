import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, PenTool, CheckCircle, Clock, Send,
  MoreVertical, FileText, AlertTriangle, Shield,
} from "lucide-react";

const MOCK_SIGNATURES = [
  { id: 1, client: "יוסי כהן", document: "ייפוי כוח — מגדל", type: "ייפוי כוח", sentTo: "yossi@email.com", status: "נחתם", signedAt: "2026-03-24 14:30", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", document: "הרשאה — הראל", type: "הרשאה", sentTo: "michal@email.com", status: "נשלח", signedAt: null, date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", document: "ייפוי כוח — כלל", type: "ייפוי כוח", sentTo: "david@email.com", status: "נחתם", signedAt: "2026-03-22 09:15", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", document: "הסכם שירות סוכן", type: "הסכם", sentTo: "sara@email.com", status: "ממתין", signedAt: null, date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", document: "ייפוי כוח — פניקס", type: "ייפוי כוח", sentTo: "avi@email.com", status: "פג תוקף", signedAt: null, date: "2026-03-15" },
  { id: 6, client: "רחל גולן", document: "הרשאת מידע — הר הביטוח", type: "הרשאה", sentTo: "rachel@email.com", status: "נחתם", signedAt: "2026-03-20 16:45", date: "2026-03-20" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "נחתם": { bg: "#E8EDE5", text: "#2F6B4E" },
  "נשלח": { bg: "#E8EDE5", text: "#476356" },
  "ממתין": { bg: "#F5EEE0", text: "#8A6230" },
  "פג תוקף": { bg: "#F3E2D8", text: "#9A4520" },
};

export default function SignPage() {
  const tool = getToolBySlug("sign")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_SIGNATURES.filter((s) => s.client.includes(search) || s.document.includes(search));

  const stats = [
    { label: "מסמכים שנחתמו", value: "89", change: "+12", icon: PenTool, color: tool.color },
    { label: "ממתינים לחתימה", value: "7", change: "-2", icon: Clock, color: "#CBA064" },
    { label: "שיעור חתימה", value: "92%", change: "+3%", icon: CheckCircle, color: "#2F6B4E" },
    { label: "פגי תוקף", value: "3", change: "+1", icon: AlertTriangle, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="sign">
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
              placeholder="חיפוש מסמך חתימה..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            חתימה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <PenTool className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין מסמכי חתימה</p>
            <p className="text-sm text-[#476356]">שלח מסמך חדש לחתימה דיגיטלית</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">מסמך</th>
                <th className="text-right px-4 py-3 font-medium">סוג</th>
                <th className="text-right px-4 py-3 font-medium">נשלח ל</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך חתימה</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const statusColor = STATUS_COLORS[s.status] || STATUS_COLORS["ממתין"];
                return (
                  <tr key={s.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{s.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{s.document}</td>
                    <td className="px-4 py-3 text-[#476356]">{s.type}</td>
                    <td className="px-4 py-3 text-[#476356] text-xs">{s.sentTo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{s.signedAt || "—"}</td>
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
