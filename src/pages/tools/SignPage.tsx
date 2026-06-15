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
  "נחתם": { bg: "#dcfce7", text: "#166534" },
  "נשלח": { bg: "#dbeafe", text: "#1e40af" },
  "ממתין": { bg: "#fef3c7", text: "#92400e" },
  "פג תוקף": { bg: "#fee2e2", text: "#991b1b" },
};

export default function SignPage() {
  const tool = getToolBySlug("sign")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_SIGNATURES.filter((s) => s.client.includes(search) || s.document.includes(search));

  const stats = [
    { label: "מסמכים שנחתמו", value: "89", change: "+12", icon: PenTool, color: tool.color },
    { label: "ממתינים לחתימה", value: "7", change: "-2", icon: Clock, color: "#f59e0b" },
    { label: "שיעור חתימה", value: "92%", change: "+3%", icon: CheckCircle, color: "#059669" },
    { label: "פגי תוקף", value: "3", change: "+1", icon: AlertTriangle, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="sign">
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
              placeholder="חיפוש מסמך חתימה..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a4b]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a4b] text-white rounded-full text-sm font-medium hover:bg-[#1a1a4b]/90 transition-colors">
            <Plus className="w-4 h-4" />
            חתימה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#1a1a4b]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <PenTool className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין מסמכי חתימה</p>
            <p className="text-sm text-gray-400">שלח מסמך חדש לחתימה דיגיטלית</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
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
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.client}</td>
                    <td className="px-4 py-3 text-gray-700">{s.document}</td>
                    <td className="px-4 py-3 text-gray-600">{s.type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.sentTo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{s.signedAt || "—"}</td>
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
