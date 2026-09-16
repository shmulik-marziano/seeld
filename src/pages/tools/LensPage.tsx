import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Upload, FileText, CheckCircle, AlertTriangle,
  Clock, Eye, MoreVertical, Download, Trash2,
} from "lucide-react";

const MOCK_DOCS = [
  { id: 1, name: "דו״ח שנתי - מגדל פנסיה", client: "יוסי כהן", type: "דו״ח שנתי", pages: 12, fields: 48, status: "הושלם", accuracy: 98, date: "2026-03-24" },
  { id: 2, name: "פוליסת חיים - הראל", client: "מיכל לוי", type: "פוליסה", pages: 8, fields: 35, status: "הושלם", accuracy: 95, date: "2026-03-23" },
  { id: 3, name: "הצעת ביטוח בריאות", client: "דוד ישראלי", type: "הצעה", pages: 4, fields: 22, status: "בעיבוד", accuracy: 0, date: "2026-03-23" },
  { id: 4, name: "תלוש שכר - ינואר 2026", client: "שרה אברהם", type: "תלוש שכר", pages: 2, fields: 18, status: "הושלם", accuracy: 99, date: "2026-03-22" },
  { id: 5, name: "אישור ניהול חשבון", client: "אבי מזרחי", type: "אישור", pages: 1, fields: 8, status: "דורש בדיקה", accuracy: 72, date: "2026-03-21" },
  { id: 6, name: "דו״ח מסלקה פנסיונית", client: "רחל גולן", type: "דו״ח מסלקה", pages: 15, fields: 62, status: "הושלם", accuracy: 96, date: "2026-03-20" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  "הושלם": { bg: "#E8EDE5", text: "#2F6B4E", icon: CheckCircle },
  "בעיבוד": { bg: "#E8EDE5", text: "#476356", icon: Clock },
  "דורש בדיקה": { bg: "#F5EEE0", text: "#8A6230", icon: AlertTriangle },
};

export default function LensPage() {
  const tool = getToolBySlug("lens")!;
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = MOCK_DOCS.filter((d) => {
    const matchSearch = d.name.includes(search) || d.client.includes(search);
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = [
    { label: "מסמכים סרוקים היום", value: "18", change: "+7", icon: FileText, color: tool.color },
    { label: "שדות שחולצו", value: "342", change: "+86", icon: CheckCircle, color: "#2F6B4E" },
    { label: "דיוק ממוצע", value: "96%", change: "+1%", icon: Eye, color: "#CBA064" },
    { label: "ממתינים לבדיקה", value: "3", change: "-", icon: AlertTriangle, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="lens">
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

      {/* Upload area */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-[#819B7D]/30 p-8 mb-4 text-center hover:border-[#819B7D]/50 transition-colors cursor-pointer">
        <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: tool.color }} />
        <p className="font-medium text-[#24483C] mb-1">גרור מסמכים לכאן או לחץ להעלאה</p>
        <p className="text-sm text-[#476356]">PDF, תמונות, Word — עד 20MB לקובץ</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#476356]" />
            <input
              type="text"
              placeholder="חיפוש מסמך לפי שם או לקוח..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">כל הסוגים</option>
            <option value="דו״ח שנתי">דו״ח שנתי</option>
            <option value="פוליסה">פוליסה</option>
            <option value="הצעה">הצעה</option>
            <option value="תלוש שכר">תלוש שכר</option>
            <option value="אישור">אישור</option>
            <option value="דו״ח מסלקה">דו״ח מסלקה</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            העלאת מסמך
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין מסמכים להצגה</p>
            <p className="text-sm text-[#476356]">העלה מסמך חדש או שנה את מסנני החיפוש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">מסמך</th>
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-right px-4 py-3 font-medium">סוג</th>
                <th className="text-center px-4 py-3 font-medium">עמודים</th>
                <th className="text-center px-4 py-3 font-medium">שדות</th>
                <th className="text-center px-4 py-3 font-medium">דיוק</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const statusInfo = STATUS_COLORS[doc.status] || STATUS_COLORS["הושלם"];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={doc.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#476356]" />
                        <span className="font-medium text-[#003D30]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#476356]">{doc.client}</td>
                    <td className="px-4 py-3 text-[#476356]">{doc.type}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">{doc.pages}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">{doc.fields}</td>
                    <td className="px-4 py-3 text-center">
                      {doc.accuracy > 0 ? (
                        <span className={`text-xs font-bold ${doc.accuracy >= 90 ? "text-[#2F6B4E]" : doc.accuracy >= 75 ? "text-[#8A6230]" : "text-[#9A4520]"}`}>
                          {doc.accuracy}%
                        </span>
                      ) : (
                        <span className="text-xs text-[#476356]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusInfo.bg, color: statusInfo.text }}>
                        <StatusIcon className="w-3 h-3" />
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356]">{doc.date}</td>
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
