import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Activity, CheckCircle, Clock, AlertTriangle,
  MoreVertical, ArrowRight, Flag, Calendar,
} from "lucide-react";

const MOCK_TRACKING = [
  { id: 1, client: "יוסי כהן", recommendation: "העברת קרן פנסיה", milestone: "טופס נשלח", nextStep: "אישור חברה", progress: 75, blocker: null, dueDate: "2026-03-28", status: "בתהליך" },
  { id: 2, client: "מיכל לוי", recommendation: "תוספת כיסוי אובדן כושר", milestone: "חיתום הושלם", nextStep: "חתימה ושיגור", progress: 60, blocker: null, dueDate: "2026-03-30", status: "בתהליך" },
  { id: 3, client: "דוד ישראלי", recommendation: "ביטול כפילות", milestone: "ממתין לאישור לקוח", nextStep: "חתימה על ביטול", progress: 30, blocker: "לקוח לא זמין", dueDate: "2026-03-25", status: "חסום" },
  { id: 4, client: "שרה אברהם", recommendation: "הגדלת הפקדות", milestone: "הושלם", nextStep: null, progress: 100, blocker: null, dueDate: "2026-03-20", status: "הושלם" },
  { id: 5, client: "אבי מזרחי", recommendation: "מעבר ביטוח בריאות", milestone: "טופס ממולא", nextStep: "שיגור לחברה", progress: 50, blocker: null, dueDate: "2026-03-27", status: "בתהליך" },
  { id: 6, client: "רחל גולן", recommendation: "פתיחת קרן השתלמות", milestone: "פגישה תואמה", nextStep: "חתימה על טופסי הצטרפות", progress: 20, blocker: null, dueDate: "2026-04-01", status: "בתהליך" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "בתהליך": { bg: "#E8EDE5", text: "#476356" },
  "הושלם": { bg: "#E8EDE5", text: "#2F6B4E" },
  "חסום": { bg: "#F3E2D8", text: "#9A4520" },
};

export default function PulsePage() {
  const tool = getToolBySlug("pulse")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_TRACKING.filter((t) => t.client.includes(search) || t.recommendation.includes(search));

  const stats = [
    { label: "תהליכים פעילים", value: "28", change: "+4", icon: Activity, color: tool.color },
    { label: "הושלמו החודש", value: "15", change: "+6", icon: CheckCircle, color: "#2F6B4E" },
    { label: "חסומים", value: "4", change: "+1", icon: AlertTriangle, color: "#BD582D" },
    { label: "תזכורות להיום", value: "6", change: "-", icon: Calendar, color: "#CBA064" },
  ];

  return (
    <ToolPage slug="pulse">
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
              placeholder="חיפוש תהליך לפי לקוח או המלצה..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            מעקב חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <Activity className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין תהליכים להצגה</p>
            <p className="text-sm text-[#476356]">הוסף מעקב על תהליך ביצוע</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">המלצה</th>
                <th className="text-right px-4 py-3 font-medium">אבן דרך נוכחית</th>
                <th className="text-center px-4 py-3 font-medium">התקדמות</th>
                <th className="text-right px-4 py-3 font-medium">חסימה</th>
                <th className="text-center px-4 py-3 font-medium">יעד</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const statusColor = STATUS_COLORS[t.status] || STATUS_COLORS["בתהליך"];
                return (
                  <tr key={t.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{t.client}</td>
                    <td className="px-4 py-3 text-[#24483C]">{t.recommendation}</td>
                    <td className="px-4 py-3 text-[#476356] text-xs">{t.milestone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-[#CCD6CC] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${t.progress}%`,
                              backgroundColor: t.progress === 100 ? "#2F6B4E" : t.status === "חסום" ? "#BD582D" : "#3b82f6",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#476356]">{t.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.blocker ? (
                        <span className="text-[#9A4520] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t.blocker}
                        </span>
                      ) : (
                        <span className="text-[#476356]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{t.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {t.status}
                      </span>
                    </td>
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
