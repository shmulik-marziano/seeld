import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Coins, TrendingUp, TrendingDown, AlertTriangle,
  MoreVertical, DollarSign, BarChart3, Calendar,
} from "lucide-react";

const MOCK_COMMISSIONS = [
  { id: 1, company: "מגדל", product: "פנסיה", client: "יוסי כהן", expected: 2400, received: 2400, gap: 0, month: "מרץ 2026", status: "תקין" },
  { id: 2, company: "הראל", product: "ביטוח חיים", client: "מיכל לוי", expected: 1800, received: 1200, gap: 600, month: "מרץ 2026", status: "פער" },
  { id: 3, company: "כלל", product: "קרן השתלמות", client: "דוד ישראלי", expected: 900, received: 900, gap: 0, month: "מרץ 2026", status: "תקין" },
  { id: 4, company: "פניקס", product: "ביטוח בריאות", client: "שרה אברהם", expected: 350, received: 0, gap: 350, month: "מרץ 2026", status: "חסר" },
  { id: 5, company: "מנורה", product: "גמל", client: "אבי מזרחי", expected: 1200, received: 1200, gap: 0, month: "מרץ 2026", status: "תקין" },
  { id: 6, company: "הראל", product: "ביטוח רכב", client: "רחל גולן", expected: 450, received: 320, gap: 130, month: "מרץ 2026", status: "פער" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "תקין": { bg: "#E8EDE5", text: "#2F6B4E" },
  "פער": { bg: "#F5EEE0", text: "#8A6230" },
  "חסר": { bg: "#F3E2D8", text: "#9A4520" },
};

export default function CoinPage() {
  const tool = getToolBySlug("coin")!;
  const [search, setSearch] = useState("");

  const filtered = MOCK_COMMISSIONS.filter((c) => c.client.includes(search) || c.company.includes(search));

  const totalExpected = MOCK_COMMISSIONS.reduce((sum, c) => sum + c.expected, 0);
  const totalReceived = MOCK_COMMISSIONS.reduce((sum, c) => sum + c.received, 0);
  const totalGap = totalExpected - totalReceived;

  const stats = [
    { label: "עמלות צפויות", value: `₪${totalExpected.toLocaleString()}`, change: "+12%", icon: Coins, color: tool.color },
    { label: "התקבלו בפועל", value: `₪${totalReceived.toLocaleString()}`, change: "+8%", icon: TrendingUp, color: "#2F6B4E" },
    { label: "פערים", value: `₪${totalGap.toLocaleString()}`, change: "-₪350", icon: TrendingDown, color: "#BD582D" },
    { label: "שיעור גבייה", value: `${Math.round((totalReceived / totalExpected) * 100)}%`, change: "+2%", icon: BarChart3, color: "#CBA064" },
  ];

  return (
    <ToolPage slug="coin">
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
              placeholder="חיפוש עמלה לפי לקוח או חברה..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            טעינת דו״ח עמלות
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <Coins className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין עמלות להצגה</p>
            <p className="text-sm text-[#476356]">טען דו״ח עמלות מחברת ביטוח</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F5F1] text-[#476356]">
                <th className="text-right px-4 py-3 font-medium">חברה</th>
                <th className="text-right px-4 py-3 font-medium">מוצר</th>
                <th className="text-right px-4 py-3 font-medium">לקוח</th>
                <th className="text-center px-4 py-3 font-medium">צפוי</th>
                <th className="text-center px-4 py-3 font-medium">התקבל</th>
                <th className="text-center px-4 py-3 font-medium">פער</th>
                <th className="text-center px-4 py-3 font-medium">חודש</th>
                <th className="text-center px-4 py-3 font-medium">סטטוס</th>
                <th className="text-center px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const statusColor = STATUS_COLORS[c.status] || STATUS_COLORS["תקין"];
                return (
                  <tr key={c.id} className="border-t border-[#E1E8E1] hover:bg-[#F3F5F1]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#003D30]">{c.company}</td>
                    <td className="px-4 py-3 text-[#24483C]">{c.product}</td>
                    <td className="px-4 py-3 text-[#476356]">{c.client}</td>
                    <td className="px-4 py-3 text-center text-[#476356]">₪{c.expected.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center font-medium text-[#2F6B4E]">₪{c.received.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={c.gap > 0 ? "text-[#9A4520] font-medium" : "text-[#476356]"}>
                        {c.gap > 0 ? `₪${c.gap.toLocaleString()}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#476356] text-xs">{c.month}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                        {c.status}
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
