import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Filter, Phone, Mail, Calendar, ArrowUpDown,
  MoreVertical, UserPlus, Globe, MessageSquare, ChevronDown,
} from "lucide-react";

const MOCK_LEADS = [
  { id: 1, name: "יוסי כהן", phone: "050-1234567", email: "yossi@email.com", source: "אתר", type: "פנסיה", score: 92, status: "חדש", date: "2026-03-24" },
  { id: 2, name: "מיכל לוי", phone: "052-9876543", email: "michal@email.com", source: "WhatsApp", type: "ביטוח חיים", score: 85, status: "נוצר קשר", date: "2026-03-23" },
  { id: 3, name: "דוד ישראלי", phone: "054-5551234", email: "david@email.com", source: "טלפון", type: "בריאות", score: 78, status: "בטיפול", date: "2026-03-22" },
  { id: 4, name: "שרה אברהם", phone: "053-7778899", email: "sara@email.com", source: "הפניה", type: "רכב", score: 95, status: "חדש", date: "2026-03-22" },
  { id: 5, name: "אבי מזרחי", phone: "050-3334455", email: "avi@email.com", source: "אתר", type: "משכנתא", score: 62, status: "ממתין", date: "2026-03-21" },
  { id: 6, name: "רחל גולן", phone: "058-6667788", email: "rachel@email.com", source: "פייסבוק", type: "חיסכון", score: 88, status: "חדש", date: "2026-03-20" },
  { id: 7, name: "נועם ברק", phone: "052-1112233", email: "noam@email.com", source: "Google", type: "פנסיה", score: 71, status: "נוצר קשר", date: "2026-03-19" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "חדש": { bg: "#e0f2fe", text: "#0369a1" },
  "נוצר קשר": { bg: "#fef3c7", text: "#92400e" },
  "בטיפול": { bg: "#dbeafe", text: "#1e40af" },
  "ממתין": { bg: "#f3e8ff", text: "#7c3aed" },
};

const SOURCE_ICONS: Record<string, React.ElementType> = {
  "אתר": Globe,
  "WhatsApp": MessageSquare,
  "טלפון": Phone,
  "הפניה": UserPlus,
  "פייסבוק": Globe,
  "Google": Globe,
};

export default function CatchPage() {
  const tool = getToolBySlug("catch")!;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_LEADS.filter((l) => {
    const matchSearch = l.name.includes(search) || l.phone.includes(search) || l.email.includes(search);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = [
    { label: "לידים חדשים היום", value: "12", change: "+3", icon: UserPlus, color: tool.color },
    { label: "ממוצע ניקוד", value: "82", change: "+5%", icon: ArrowUpDown, color: "#059669" },
    { label: "שיעור המרה", value: "34%", change: "+2%", icon: Phone, color: "#f59e0b" },
    { label: "לידים פעילים", value: "47", change: "-", icon: Filter, color: "#e11d48" },
  ];

  return (
    <ToolPage slug="catch">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] p-5">
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

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש ליד לפי שם, טלפון או אימייל..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d3d]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="חדש">חדש</option>
            <option value="נוצר קשר">נוצר קשר</option>
            <option value="בטיפול">בטיפול</option>
            <option value="ממתין">ממתין</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a3d3d] text-white rounded-full text-sm font-medium hover:bg-[#0a3d3d]/90 transition-colors">
            <Plus className="w-4 h-4" />
            ליד חדש
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין לידים להצגה</p>
            <p className="text-sm text-gray-400">נסה לשנות את מסנני החיפוש או להוסיף ליד חדש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">שם</th>
                <th className="text-right px-4 py-3 font-medium">טלפון</th>
                <th className="text-right px-4 py-3 font-medium">מקור</th>
                <th className="text-right px-4 py-3 font-medium">סוג</th>
                <th className="text-center px-4 py-3 font-medium">ניקוד</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">תאריך</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const SourceIcon = SOURCE_ICONS[lead.source] || Globe;
                const statusColor = STATUS_COLORS[lead.status] || STATUS_COLORS["חדש"];
                return (
                  <tr key={lead.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <SourceIcon className="w-3.5 h-3.5" />
                        {lead.source}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-8 h-8 leading-8 rounded-full text-xs font-bold ${lead.score >= 85 ? "bg-green-100 text-green-700" : lead.score >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{lead.date}</td>
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
