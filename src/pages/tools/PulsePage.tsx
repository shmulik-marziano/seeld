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
  "בתהליך": { bg: "#dbeafe", text: "#1e40af" },
  "הושלם": { bg: "#dcfce7", text: "#166534" },
  "חסום": { bg: "#fee2e2", text: "#991b1b" },
};

export default function PulsePage() {
  const tool = getToolBySlug("pulse")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_TRACKING.filter((t) => t.client.includes(search) || t.recommendation.includes(search));

  const stats = [
    { label: "תהליכים פעילים", value: "28", change: "+4", icon: Activity, color: tool.color },
    { label: "הושלמו החודש", value: "15", change: "+6", icon: CheckCircle, color: "#059669" },
    { label: "חסומים", value: "4", change: "+1", icon: AlertTriangle, color: "#e11d48" },
    { label: "תזכורות להיום", value: "6", change: "-", icon: Calendar, color: "#f59e0b" },
  ];

  return (
    <ToolPage slug="pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] p-5">
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

      <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש תהליך לפי לקוח או המלצה..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#171717] text-white rounded-full text-sm font-medium hover:bg-[#171717]/90 transition-colors">
            <Plus className="w-4 h-4" />
            מעקב חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Activity className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין תהליכים להצגה</p>
            <p className="text-sm text-gray-400">הוסף מעקב על תהליך ביצוע</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
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
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{t.client}</td>
                    <td className="px-4 py-3 text-gray-700">{t.recommendation}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.milestone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${t.progress}%`,
                              backgroundColor: t.progress === 100 ? "#059669" : t.status === "חסום" ? "#e11d48" : "#3b82f6",
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{t.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.blocker ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t.blocker}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{t.dueDate}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {t.status}
                      </span>
                    </td>
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
