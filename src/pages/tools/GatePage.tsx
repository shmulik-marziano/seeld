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
  "אושר": { bg: "#E8EDE5", text: "#2F6B4E" },
  "אושר עם תנאים": { bg: "#F5EEE0", text: "#8A6230" },
  "בבדיקה": { bg: "#E8EDE5", text: "#476356" },
  "בהמתנה": { bg: "#DDE6DA", text: "#476356" },
  "נדחה": { bg: "#F3E2D8", text: "#9A4520" },
};

export default function GatePage() {
  const tool = getToolBySlug("gate")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_UNDERWRITING.filter((u) => u.client.includes(search) || u.product.includes(search));

  const stats = [
    { label: "תהליכי חיתום", value: "42", change: "+8", icon: ShieldCheck, color: tool.color },
    { label: "אושרו", value: "31", change: "+5", icon: CheckCircle, color: "#2F6B4E" },
    { label: "עם תנאים", value: "7", change: "+2", icon: AlertTriangle, color: "#CBA064" },
    { label: "ממתינים להשלמה", value: "4", change: "-1", icon: Clock, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="gate">
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
              placeholder="חיפוש תהליך חיתום..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            חיתום חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין תהליכי חיתום</p>
            <p className="text-sm text-[#476356]">התחל תהליך חיתום חדש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
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
                  <tr key={u.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{u.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{u.product}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${u.questionnaire === "הושלם" ? "text-[#2F6B4E]" : u.questionnaire === "בתהליך" ? "text-[#476356]" : "text-[#8A6230]"}`}>
                        {u.questionnaire}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{u.conditions}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: approvalColor.bg, color: approvalColor.text }}>
                        {u.approval}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356]">{u.date}</td>
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
