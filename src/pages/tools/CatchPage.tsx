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
  "חדש": { bg: "#E8EDE5", text: "#476356" },
  "נוצר קשר": { bg: "#F5EEE0", text: "#8A6230" },
  "בטיפול": { bg: "#E8EDE5", text: "#476356" },
  "ממתין": { bg: "#DDE6DA", text: "#476356" },
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
    { label: "ממוצע ניקוד", value: "82", change: "+5%", icon: ArrowUpDown, color: "#2F6B4E" },
    { label: "שיעור המרה", value: "34%", change: "+2%", icon: Phone, color: "#CBA064" },
    { label: "לידים פעילים", value: "47", change: "-", icon: Filter, color: "#BD582D" },
  ];

  return (
    <ToolPage slug="catch">
      {/* Stats */}
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

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#476356]" />
            <input
              type="text"
              placeholder="חיפוש ליד לפי שם, טלפון או אימייל..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="חדש">חדש</option>
            <option value="נוצר קשר">נוצר קשר</option>
            <option value="בטיפול">בטיפול</option>
            <option value="ממתין">ממתין</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            ליד חדש
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין לידים להצגה</p>
            <p className="text-sm text-[#476356]">נסה לשנות את מסנני החיפוש או להוסיף ליד חדש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
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
                  <tr key={lead.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{lead.name}</td>
                    <td className="px-4 py-3 text-[#476356]">{lead.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#476356]">
                        <SourceIcon className="w-3.5 h-3.5" />
                        {lead.source}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#476356]">{lead.type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-8 h-8 leading-8 rounded-full text-xs font-bold ${lead.score >= 85 ? "bg-[#E8EDE5] text-[#2F6B4E]" : lead.score >= 70 ? "bg-[#F5EEE0] text-[#8A6230]" : "bg-[#E8EDE5] text-[#476356]"}`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356]">{lead.date}</td>
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
