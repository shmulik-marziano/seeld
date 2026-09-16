import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, MessageSquare, Mail, Phone, CheckCircle,
  MoreVertical, Clock, Send, User, Smartphone,
} from "lucide-react";

const MOCK_MESSAGES = [
  { id: 1, client: "יוסי כהן", channel: "WhatsApp", direction: "נכנס", subject: "שאלה על פוליסת חיים", preview: "היי שמוליק, רציתי לשאול על הפוליסה שדיברנו עליה...", status: "נענה", date: "2026-03-24 15:30" },
  { id: 2, client: "מיכל לוי", channel: "מייל", direction: "יוצא", subject: "סיכום פגישה + המלצות", preview: "מיכל שלום, מצורף סיכום הפגישה שלנו מהיום...", status: "נשלח", date: "2026-03-24 14:00" },
  { id: 3, client: "דוד ישראלי", channel: "SMS", direction: "יוצא", subject: "תזכורת פגישה", preview: "היי דוד, תזכורת לפגישה שלנו מחר ב-10:00", status: "נמסר", date: "2026-03-24 12:00" },
  { id: 4, client: "שרה אברהם", channel: "טלפון", direction: "נכנס", subject: "בירור תביעה", preview: "שיחה נכנסת — 8 דקות — סיכום: שאלה על סטטוס תביעה", status: "נענה", date: "2026-03-24 10:15" },
  { id: 5, client: "אבי מזרחי", channel: "WhatsApp", direction: "נכנס", subject: "בקשה לאישור ביטוח", preview: "שלום, אני צריך אישור ביטוח רכב לחברת הליסינג", status: "ממתין", date: "2026-03-24 09:00" },
  { id: 6, client: "רחל גולן", channel: "מייל", direction: "נכנס", subject: "חידוש ביטוח דירה", preview: "שמוליק, קיבלתי הודעה על חידוש. מה את ממליצה?", status: "ממתין", date: "2026-03-23 18:30" },
];

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  "WhatsApp": Smartphone,
  "מייל": Mail,
  "SMS": MessageSquare,
  "טלפון": Phone,
};

const CHANNEL_COLORS: Record<string, string> = {
  "WhatsApp": "#25D366",
  "מייל": "#4F46E5",
  "SMS": "#0EA5E9",
  "טלפון": "#2F6B4E",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "נענה": { bg: "#E8EDE5", text: "#2F6B4E" },
  "נשלח": { bg: "#E8EDE5", text: "#476356" },
  "נמסר": { bg: "#E8EDE5", text: "#476356" },
  "ממתין": { bg: "#F5EEE0", text: "#8A6230" },
};

export default function BridgePage() {
  const tool = getToolBySlug("bridge")!;
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const filtered = MOCK_MESSAGES.filter((m) => {
    const matchSearch = m.client.includes(search) || m.subject.includes(search);
    const matchChannel = channelFilter === "all" || m.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const stats = [
    { label: "הודעות היום", value: "24", change: "+8", icon: MessageSquare, color: tool.color },
    { label: "ממתינות למענה", value: "5", change: "+2", icon: Clock, color: "#CBA064" },
    { label: "שיחות נכנסות", value: "7", change: "+3", icon: Phone, color: "#2F6B4E" },
    { label: "נשלחו", value: "12", change: "+4", icon: Send, color: "#4f46e5" },
  ];

  return (
    <ToolPage slug="bridge">
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
              placeholder="חיפוש הודעה לפי לקוח או נושא..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="all">כל הערוצים</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="מייל">מייל</option>
            <option value="SMS">SMS</option>
            <option value="טלפון">טלפון</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            הודעה חדשה
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין הודעות להצגה</p>
            <p className="text-sm text-[#476356]">שלח הודעה חדשה או שנה את המסננים</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E1E8E1]">
            {filtered.map((m) => {
              const ChannelIcon = CHANNEL_ICONS[m.channel] || MessageSquare;
              const channelColor = CHANNEL_COLORS[m.channel] || "#819B7D";
              const statusColor = STATUS_COLORS[m.status] || STATUS_COLORS["ממתין"];
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F3F5F1]/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: channelColor + "15" }}>
                    <ChannelIcon className="w-5 h-5" style={{ color: channelColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-[#003D30]">{m.client}</span>
                      <span className="text-xs text-[#476356]">{m.direction === "נכנס" ? "←" : "→"}</span>
                      <span className="text-xs text-[#476356]">{m.channel}</span>
                    </div>
                    <p className="text-sm text-[#24483C] font-medium mb-0.5">{m.subject}</p>
                    <p className="text-xs text-[#476356] truncate">{m.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-[#476356]">{m.date}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                      {m.status}
                    </span>
                  </div>
                  <button className="p-1.5 hover:bg-[#E8EDE5] rounded-lg transition-colors flex-shrink-0">
                    <MoreVertical className="w-4 h-4 text-[#476356]" />
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
