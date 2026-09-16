import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Presentation, CheckCircle, Clock, Eye,
  MoreVertical, ThumbsUp, ThumbsDown, Send, Users,
} from "lucide-react";

const MOCK_PRESENTATIONS = [
  { id: 1, client: "יוסי כהן", title: "סקירת תיק ביטוח ופנסיה 2026", recommendations: 4, approved: 3, rejected: 0, pending: 1, status: "הוצג", date: "2026-03-24" },
  { id: 2, client: "מיכל לוי", title: "תכנית שדרוג כיסויים", recommendations: 2, approved: 2, rejected: 0, pending: 0, status: "אושר", date: "2026-03-23" },
  { id: 3, client: "דוד ישראלי", title: "ניתוח תיק מקיף — 12 מוצרים", recommendations: 6, approved: 1, rejected: 2, pending: 3, status: "הוצג", date: "2026-03-22" },
  { id: 4, client: "שרה אברהם", title: "סקירת פנסיה שנתית", recommendations: 3, approved: 0, rejected: 0, pending: 3, status: "טרם הוצג", date: "2026-03-21" },
  { id: 5, client: "אבי מזרחי", title: "המלצות חיסכון מס", recommendations: 2, approved: 2, rejected: 0, pending: 0, status: "אושר", date: "2026-03-20" },
  { id: 6, client: "רחל גולן", title: "תכנית ביטוח משפחתית", recommendations: 5, approved: 0, rejected: 0, pending: 5, status: "מוכן", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "הוצג": { bg: "#E8EDE5", text: "#476356" },
  "אושר": { bg: "#E8EDE5", text: "#2F6B4E" },
  "טרם הוצג": { bg: "#DDE6DA", text: "#476356" },
  "מוכן": { bg: "#F5EEE0", text: "#8A6230" },
};

export default function StagePage() {
  const tool = getToolBySlug("stage")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_PRESENTATIONS.filter((p) => p.client.includes(search) || p.title.includes(search));

  const stats = [
    { label: "מצגות החודש", value: "24", change: "+5", icon: Presentation, color: tool.color },
    { label: "אושרו", value: "18", change: "+3", icon: ThumbsUp, color: "#2F6B4E" },
    { label: "שיעור אישור", value: "75%", change: "+8%", icon: CheckCircle, color: "#CBA064" },
    { label: "ממתינים להצגה", value: "6", change: "-", icon: Clock, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="stage">
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
              placeholder="חיפוש מצגת לפי לקוח..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            מצגת חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <Presentation className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין מצגות להצגה</p>
            <p className="text-sm text-[#476356]">צור מצגת חדשה ללקוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">כותרת</th>
                <th className="text-center px-4 py-3 font-medium">המלצות</th>
                <th className="text-center px-4 py-3 font-medium">אושרו</th>
                <th className="text-center px-4 py-3 font-medium">נדחו</th>
                <th className="text-center px-4 py-3 font-medium">ממתינות</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS["מוכן"];
                return (
                  <tr key={p.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{p.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{p.title}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">{p.recommendations}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.approved > 0 ? "text-[#2F6B4E] font-medium" : "text-[#476356]"}>{p.approved}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.rejected > 0 ? "text-[#9A4520] font-medium" : "text-[#476356]"}>{p.rejected}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={p.pending > 0 ? "text-[#8A6230] font-medium" : "text-[#476356]"}>{p.pending}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356]">{p.date}</td>
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
