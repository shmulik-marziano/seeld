import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Building2, Users, FileText, CheckCircle,
  MoreVertical, Calendar, Briefcase, DollarSign,
} from "lucide-react";

const MOCK_EMPLOYERS = [
  { id: 1, name: "טק סולושנס בע״מ", contact: "דני אלון", phone: "03-9876543", employees: 45, activeProducts: 3, agreement: "שירות מלא", renewal: "2026-12-01", status: "פעיל" },
  { id: 2, name: "מזון ישראלי בע״מ", contact: "יעל שרון", phone: "04-1234567", employees: 120, activeProducts: 5, agreement: "שירות מלא", renewal: "2026-08-15", status: "פעיל" },
  { id: 3, name: "בוני הצפון", contact: "משה כהן", phone: "04-5551234", employees: 28, activeProducts: 2, agreement: "פנסיה בלבד", renewal: "2026-06-30", status: "פעיל" },
  { id: 4, name: "רשת אופנה פלוס", contact: "רונית לוי", phone: "02-7778899", employees: 85, activeProducts: 4, agreement: "שירות מלא", renewal: "2026-03-31", status: "לחידוש" },
  { id: 5, name: "סטארט-אפ AI", contact: "אורן גל", phone: "03-3334455", employees: 15, activeProducts: 2, agreement: "פנסיה + ביטוח", renewal: "2027-01-01", status: "פעיל" },
  { id: 6, name: "קליניקת שלום", contact: "ד״ר שלום", phone: "09-6667788", employees: 8, activeProducts: 1, agreement: "פנסיה בלבד", renewal: "2026-11-01", status: "פעיל" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "פעיל": { bg: "#dcfce7", text: "#166534" },
  "לחידוש": { bg: "#fef3c7", text: "#92400e" },
  "לא פעיל": { bg: "#fee2e2", text: "#991b1b" },
};

export default function LinkPage() {
  const tool = getToolBySlug("link")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_EMPLOYERS.filter((e) => e.name.includes(search) || e.contact.includes(search));

  const totalEmployees = MOCK_EMPLOYERS.reduce((sum, e) => sum + e.employees, 0);

  const stats = [
    { label: "מעסיקים פעילים", value: "6", change: "+1", icon: Building2, color: tool.color },
    { label: "סה״כ עובדים", value: totalEmployees.toString(), change: "+12", icon: Users, color: "#059669" },
    { label: "הסכמים לחידוש", value: "1", change: "-", icon: Calendar, color: "#f59e0b" },
    { label: "הכנסה חודשית", value: "₪18,500", change: "+5%", icon: DollarSign, color: "#0891b2" },
  ];

  return (
    <ToolPage slug="link">
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

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש מעסיק לפי שם או איש קשר..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d3d]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0a3d3d] text-white rounded-full text-sm font-medium hover:bg-[#0a3d3d]/90 transition-colors">
            <Plus className="w-4 h-4" />
            מעסיק חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#0a3d3d]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">אין מעסיקים להצגה</p>
            <p className="text-sm text-gray-400">הוסף מעסיק חדש</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-right px-4 py-3 font-medium">שם מעסיק</th>
                <th className="text-right px-4 py-3 font-medium">איש קשר</th>
                <th className="text-center px-4 py-3 font-medium">טלפון</th>
                <th className="text-center px-4 py-3 font-medium">עובדים</th>
                <th className="text-center px-4 py-3 font-medium">מוצרים</th>
                <th className="text-right px-4 py-3 font-medium">הסכם</th>
                <th className="text-center px-4 py-3 font-medium">חידוש</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const statusColor = STATUS_COLORS[e.status] || STATUS_COLORS["פעיל"];
                return (
                  <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{e.name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.contact}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{e.phone}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">{e.employees}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{e.activeProducts}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{e.agreement}</td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{e.renewal}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {e.status}
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
