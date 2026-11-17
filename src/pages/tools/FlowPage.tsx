import { useState } from "react";
import ToolPage from "./ToolPage";
import {
  Search, Plus, CheckSquare, CheckCircle, Clock, Calendar,
  MoreVertical, User, AlertTriangle, Flag, Circle,
} from "lucide-react";

const MOCK_TASKS = [
  { id: 1, title: "להתקשר ליוסי כהן — אישור המלצות", assignee: "דנה לוי", client: "יוסי כהן", priority: "גבוהה", dueDate: "2026-03-25", status: "פתוח", category: "טלפון" },
  { id: 2, title: "לשלוח סיכום פגישה למיכל לוי", assignee: "דנה לוי", client: "מיכל לוי", priority: "רגילה", dueDate: "2026-03-25", status: "פתוח", category: "מייל" },
  { id: 3, title: "להגיש טופס העברה — דוד ישראלי", assignee: "נועה ברק", client: "דוד ישראלי", priority: "דחופה", dueDate: "2026-03-25", status: "בתהליך", category: "טופס" },
  { id: 4, title: "לבדוק סטטוס חיתום — שרה אברהם", assignee: "דנה לוי", client: "שרה אברהם", priority: "רגילה", dueDate: "2026-03-26", status: "פתוח", category: "בדיקה" },
  { id: 5, title: "לתאם פגישה עם אבי מזרחי", assignee: "דנה לוי", client: "אבי מזרחי", priority: "רגילה", dueDate: "2026-03-27", status: "הושלם", category: "פגישה" },
  { id: 6, title: "לעדכן מוטבים — רחל גולן", assignee: "נועה ברק", client: "רחל גולן", priority: "גבוהה", dueDate: "2026-03-26", status: "בתהליך", category: "טופס" },
  { id: 7, title: "חידוש ביטוח רכב — רשת אופנה פלוס", assignee: "דנה לוי", client: "רשת אופנה פלוס", priority: "דחופה", dueDate: "2026-03-25", status: "פתוח", category: "חידוש" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "פתוח": { bg: "#DFE9DC", text: "#55677C" },
  "בתהליך": { bg: "#F5EEE0", text: "#7C5C22" },
  "הושלם": { bg: "#DFE9DC", text: "#2F6B4E" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  "דחופה": { bg: "#F3E2D8", text: "#9A4520" },
  "גבוהה": { bg: "#F5EEE0", text: "#7C5C22" },
  "רגילה": { bg: "#EEF2EC", text: "#55677C" },
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  "פתוח": Circle,
  "בתהליך": Clock,
  "הושלם": CheckCircle,
};

export default function FlowPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_TASKS.filter((t) => {
    const matchSearch = t.title.includes(search) || t.client.includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const todayTasks = MOCK_TASKS.filter((t) => t.dueDate === "2026-03-25");
  const openTasks = MOCK_TASKS.filter((t) => t.status !== "הושלם");

  const stats = [
    { label: "משימות להיום", value: todayTasks.length.toString(), change: "-", icon: Calendar, color: "#203957" },
    { label: "פתוחות", value: openTasks.length.toString(), change: "+2", icon: CheckSquare, color: "#7C5C22" },
    { label: "הושלמו השבוע", value: "14", change: "+5", icon: CheckCircle, color: "#2F6B4E" },
    { label: "דחופות", value: MOCK_TASKS.filter((t) => t.priority === "דחופה" && t.status !== "הושלם").length.toString(), change: "+1", icon: AlertTriangle, color: "#9A4520" },
  ];

  return (
    <ToolPage slug="flow">
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
              placeholder="חיפוש משימה לפי תיאור או לקוח..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#D9DEE4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#203957]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-[#F3F5F1] border border-[#D9DEE4] rounded-xl text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="פתוח">פתוח</option>
            <option value="בתהליך">בתהליך</option>
            <option value="הושלם">הושלם</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#203957] text-white rounded-full text-sm font-medium hover:bg-[#203957]/90 transition-colors">
            <Plus className="w-4 h-4" />
            משימה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#203957]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#DFE9DC] mx-auto mb-4 flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#55677C] font-medium mb-1">אין משימות להצגה</p>
            <p className="text-sm text-[#55677C]">צור משימה חדשה או שנה את המסננים</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E6DE]">
            {filtered.map((t) => {
              const statusColor = STATUS_COLORS[t.status] || STATUS_COLORS["פתוח"];
              const priorityColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS["רגילה"];
              const StatusIcon = STATUS_ICONS[t.status] || Circle;
              const isOverdue = t.dueDate <= "2026-03-25" && t.status !== "הושלם";
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F3F5F1]/50 transition-colors">
                  <button className="flex-shrink-0">
                    <StatusIcon
                      className={`w-5 h-5 ${t.status === "הושלם" ? "text-[#2F6B4E]" : "text-[#8FA396]"}`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === "הושלם" ? "text-[#55677C] line-through" : "text-[#203957]"}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#55677C] flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {t.assignee}
                      </span>
                      <span className="text-xs text-[#55677C]">{t.category}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: priorityColor.bg, color: priorityColor.text }}>
                    {t.priority}
                  </span>
                  <span className={`text-xs flex-shrink-0 ${isOverdue ? "text-[#9A4520] font-medium" : "text-[#55677C]"}`}>
                    {t.dueDate}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                    {t.status}
                  </span>
                  <button className="p-1.5 hover:bg-[#DFE9DC] rounded-lg transition-colors flex-shrink-0">
                    <MoreVertical className="w-4 h-4 text-[#55677C]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
