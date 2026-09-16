import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Shield, CheckCircle, Clock, AlertTriangle,
  MoreVertical, FileText, DollarSign, Calendar,
} from "lucide-react";

const MOCK_CLAIMS = [
  { id: "CL-401", client: "יוסי כהן", type: "אובדן כושר עבודה", company: "מגדל", amount: "₪12,500/חודש", status: "אושר", submittedAt: "2026-02-15", date: "2026-03-24" },
  { id: "CL-402", client: "מיכל לוי", type: "תאונה אישית", company: "הראל", amount: "₪35,000", status: "בבדיקה", submittedAt: "2026-03-10", date: "2026-03-23" },
  { id: "CL-403", client: "דוד ישראלי", type: "נזק לרכב", company: "כלל", amount: "₪18,200", status: "חסר מסמכים", submittedAt: "2026-03-18", date: "2026-03-22" },
  { id: "CL-404", client: "שרה אברהם", type: "מחלה קשה", company: "פניקס", amount: "₪250,000", status: "אושר", submittedAt: "2026-01-20", date: "2026-03-21" },
  { id: "CL-405", client: "אבי מזרחי", type: "סיעודי", company: "מנורה", amount: "₪8,000/חודש", status: "בבדיקה", submittedAt: "2026-03-05", date: "2026-03-20" },
  { id: "CL-406", client: "רחל גולן", type: "נזק לדירה", company: "הראל", amount: "₪42,000", status: "נדחה", submittedAt: "2026-02-28", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "אושר": { bg: "#E8EDE5", text: "#2F6B4E" },
  "בבדיקה": { bg: "#E8EDE5", text: "#476356" },
  "חסר מסמכים": { bg: "#F5EEE0", text: "#8A6230" },
  "נדחה": { bg: "#F3E2D8", text: "#9A4520" },
};

export default function ShieldPage() {
  const tool = getToolBySlug("shield")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_CLAIMS.filter((c) => c.client.includes(search) || c.type.includes(search) || c.id.includes(search));

  const stats = [
    { label: "תביעות פעילות", value: "18", change: "+3", icon: Shield, color: tool.color },
    { label: "אושרו", value: "12", change: "+2", icon: CheckCircle, color: "#2F6B4E" },
    { label: "סכום מצטבר", value: "₪1.2M", change: "+15%", icon: DollarSign, color: "#CBA064" },
    { label: "חסרות מסמכים", value: "4", change: "+1", icon: AlertTriangle, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="shield">
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
              placeholder="חיפוש תביעה לפי לקוח, סוג או מזהה..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            תביעה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין תביעות להצגה</p>
            <p className="text-sm text-[#476356]">פתח תביעה חדשה</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">מזהה</th>
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">סוג תביעה</th>
                <th className="text-center px-4 py-3 font-medium">חברה</th>
                <th className="text-center px-4 py-3 font-medium">סכום</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">הוגש</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const statusColor = STATUS_COLORS[c.status] || STATUS_COLORS["בבדיקה"];
                return (
                  <tr key={c.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#476356]">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-[#003D30]">{c.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{c.type}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">{c.company}</td>
                    <td className="px-4 py-3 text-center font-medium text-[#003D30]">{c.amount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{c.submittedAt}</td>
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
