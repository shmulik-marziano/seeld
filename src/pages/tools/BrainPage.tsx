import { useState } from "react";
import ToolPage from "./ToolPage";
import { getToolBySlug } from "@/config/tools";
import {
  Search, Plus, Brain, FileText, Folder, Download,
  MoreVertical, BookOpen, File, Clock, Eye, Tag,
} from "lucide-react";

const MOCK_KNOWLEDGE = [
  { id: 1, title: "תבנית מכתב גילוי נאות", category: "תבניות", type: "מסמך", tags: ["רגולציה", "גילוי"], views: 45, updated: "2026-03-20", author: "שמוליק" },
  { id: 2, title: "נוהל קליטת לקוח חדש", category: "נהלים", type: "נוהל", tags: ["קליטה", "תהליך"], views: 128, updated: "2026-03-18", author: "מירב" },
  { id: 3, title: "טופס 17 — ייפוי כוח מסלקה", category: "טפסים", type: "טופס", tags: ["מסלקה", "ייפוי כוח"], views: 89, updated: "2026-03-15", author: "שמוליק" },
  { id: 4, title: "מדריך חיתום — שאלון בריאות", category: "מדריכים", type: "מדריך", tags: ["חיתום", "בריאות"], views: 67, updated: "2026-03-12", author: "שמוליק" },
  { id: 5, title: "טבלת השוואת דמי ניהול 2026", category: "כלים", type: "טבלה", tags: ["דמי ניהול", "השוואה"], views: 234, updated: "2026-03-10", author: "מירב" },
  { id: 6, title: "נוהל טיפול בתביעה", category: "נהלים", type: "נוהל", tags: ["תביעות", "תהליך"], views: 56, updated: "2026-03-08", author: "שמוליק" },
  { id: 7, title: "תבנית סיכום פגישת ייעוץ", category: "תבניות", type: "מסמך", tags: ["פגישה", "סיכום"], views: 178, updated: "2026-03-05", author: "מירב" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "תבניות": "#476356",
  "נהלים": "#2F6B4E",
  "טפסים": "#2563eb",
  "מדריכים": "#CBA064",
  "כלים": "#BD582D",
};

export default function BrainPage() {
  const tool = getToolBySlug("brain")!;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = MOCK_KNOWLEDGE.filter((k) => {
    const matchSearch = k.title.includes(search) || k.tags.some((t) => t.includes(search));
    const matchCategory = categoryFilter === "all" || k.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const stats = [
    { label: "פריטי ידע", value: "87", change: "+4", icon: Brain, color: tool.color },
    { label: "תבניות פעילות", value: "23", change: "+2", icon: FileText, color: "#476356" },
    { label: "צפיות החודש", value: "1,240", change: "+18%", icon: Eye, color: "#2F6B4E" },
    { label: "עודכנו השבוע", value: "6", change: "+3", icon: Clock, color: "#CBA064" },
  ];

  return (
    <ToolPage slug="brain">
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
              placeholder="חיפוש במאגר הידע..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003D30]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-[#F3F5F1] border border-[#CCD6CC] rounded-xl text-sm focus:outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">כל הקטגוריות</option>
            <option value="תבניות">תבניות</option>
            <option value="נהלים">נהלים</option>
            <option value="טפסים">טפסים</option>
            <option value="מדריכים">מדריכים</option>
            <option value="כלים">כלים</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#003D30] text-white rounded-full text-sm font-medium hover:bg-[#003D30]/90 transition-colors">
            <Plus className="w-4 h-4" />
            פריט חדש
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#003D30]/[0.06] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E8EDE5] mx-auto mb-4 flex items-center justify-center">
              <Brain className="w-8 h-8 text-[#8FA396]" />
            </div>
            <p className="text-[#476356] font-medium mb-1">אין פריטים להצגה</p>
            <p className="text-sm text-[#476356]">הוסף פריט ידע חדש למאגר</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E1E8E1]">
            {filtered.map((k) => {
              const catColor = CATEGORY_COLORS[k.category] || "#819B7D";
              return (
                <div key={k.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F3F5F1]/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: catColor + "15" }}>
                    <FileText className="w-5 h-5" style={{ color: catColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#003D30]">{k.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: catColor + "15", color: catColor }}>
                        {k.category}
                      </span>
                      {k.tags.map((tag) => (
                        <span key={tag} className="text-xs text-[#476356] flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs text-[#476356]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {k.views}
                    </span>
                    <span>{k.updated}</span>
                    <span>{k.author}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="p-1.5 hover:bg-[#E8EDE5] rounded-lg transition-colors" title="הורדה">
                      <Download className="w-4 h-4 text-[#476356]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#E8EDE5] rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-[#476356]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
