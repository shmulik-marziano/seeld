import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DoodleIcon from "@/components/DoodleIcon";
import { ChevronLeft, Search, ArrowUpDown, TrendingUp, TrendingDown, Filter, BarChart3, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useInvestmentTracks } from "@/hooks/useInvestmentTracks";
import { productTypeLabels, specializationLabels, companyLabels } from "@/types/fund";
import type { Fund, ProductType, Specialization, ManagingCompany } from "@/types/fund";
import { usePageMeta } from "@/hooks/usePageMeta";

// ── Helpers ──
const fmt = (n: number) => n.toFixed(2) + "%";
const fmtAssets = (m: number) => m >= 1000 ? (m / 1000).toFixed(1) + " מיליארד" : m.toLocaleString("he-IL") + " מ'";

type SortKey = "name" | "year1" | "year3" | "year5" | "fees" | "assets";
type SortDir = "asc" | "desc";

// ── Personal Track Checker ──
function PersonalTrackChecker({ trackData }: { trackData: Fund[] }) {
  const [selectedCompany, setSelectedCompany] = useState<ManagingCompany | "">("");
  const [selectedProduct, setSelectedProduct] = useState<ProductType | "">("");
  const [selectedFundId, setSelectedFundId] = useState<string>("");

  const availableProducts = selectedCompany
    ? [...new Set(trackData.filter(f => f.company === selectedCompany).map(f => f.productType))]
    : [];

  const availableFunds = selectedCompany && selectedProduct
    ? trackData.filter(f => f.company === selectedCompany && f.productType === selectedProduct)
    : [];

  const selectedFund = trackData.find(f => f.id === selectedFundId) || null;

  const getPieData = (fund: Fund) => [
    { name: "מניות", value: fund.deepDrill.stocksAndOptions, color: "#d6157e" },
    { name: 'אג"ח ממשלתי', value: fund.deepDrill.govBondsTradable + fund.deepDrill.designatedBonds, color: "#f06ba8" },
    { name: 'אג"ח קונצרני', value: fund.deepDrill.corpBondsTradable + fund.deepDrill.corpBondsNonTradable, color: "#6b6fc4" },
    { name: "מזומן", value: fund.deepDrill.cashEquivalents + fund.deepDrill.deposits, color: "#94a3b8" },
    { name: "אחר", value: fund.deepDrill.mutualFunds + fund.deepDrill.otherAssets, color: "#6c63ff" },
  ].filter(d => d.value > 0);

  const getRiskLevel = (fund: Fund) => {
    const stock = fund.stockExposure;
    if (stock >= 80) return { level: "גבוהה", color: "#3b3f99", tip: "המסלול מתאים למשקיעים אגרסיביים עם אופק של 10+ שנים. כדאי לוודא שרמת הסיכון מתאימה לגיל ולתוכניות שלכם." };
    if (stock >= 40) return { level: "בינונית", color: "#6b6fc4", tip: "מסלול מאוזן שמתאים לרוב האנשים. פיזור טוב בין מניות לאג\"ח. מומלץ לבדוק את דמי הניהול מול חברות מתחרות." };
    if (stock >= 10) return { level: "נמוכה-בינונית", color: "#f06ba8", tip: "מסלול סולידי יחסית. מתאים למי שקרוב לפרישה או רוצה יציבות. כדאי לבדוק שהתשואה מספיקה לצרכים שלכם." };
    return { level: "נמוכה", color: "#d6157e", tip: "מסלול שמרני מאוד. מתאים לטווח קצר או לפרישה קרובה. שווה לבדוק אם יש מסלולים עם תשואה טובה יותר באותה רמת סיכון." };
  };

  return (
    <section className="mb-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <DoodleIcon name="charts" size={40} />
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1a4b]">בדקו את המסלול שלכם</h2>
            <p className="text-sm text-gray-400">בחרו חברה, סוג מוצר ומסלול — ותראו לאן הכסף שלכם הולך</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Company */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">חברה</label>
            <select
              value={selectedCompany}
              onChange={e => { setSelectedCompany(e.target.value as ManagingCompany); setSelectedProduct(""); setSelectedFundId(""); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#1a1a4b]"
            >
              <option value="">בחרו חברה</option>
              {[...new Set(trackData.map(f => f.company))].map(c => (
                <option key={c} value={c}>{companyLabels[c]}</option>
              ))}
            </select>
          </div>
          {/* Product type */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">סוג מוצר</label>
            <select
              value={selectedProduct}
              onChange={e => { setSelectedProduct(e.target.value as ProductType); setSelectedFundId(""); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#1a1a4b]"
              disabled={!selectedCompany}
            >
              <option value="">בחרו מוצר</option>
              {availableProducts.map(p => (
                <option key={p} value={p}>{productTypeLabels[p]}</option>
              ))}
            </select>
          </div>
          {/* Fund */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">מסלול</label>
            <select
              value={selectedFundId}
              onChange={e => setSelectedFundId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#1a1a4b]"
              disabled={!selectedProduct}
            >
              <option value="">בחרו מסלול</option>
              {availableFunds.map(f => (
                <option key={f.id} value={f.id}>{specializationLabels[f.specialization]} — {f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        {selectedFund && (() => {
          const pieData = getPieData(selectedFund);
          const risk = getRiskLevel(selectedFund);
          return (
            <div className="bg-[#f8f9fc] rounded-2xl p-5 sm:p-6 border border-gray-100 space-y-6">
              {/* Fund header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a4b]">{selectedFund.name}</h3>
                  <p className="text-xs text-gray-400">קופה {selectedFund.fundNumber} | {companyLabels[selectedFund.company]}</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 text-center">
                    <p className="text-xs text-gray-400">תשואה 12 חודשים</p>
                    <p className="text-xl font-extrabold text-[#1a1a4b]">{fmt(selectedFund.returns.year1)}</p>
                  </div>
                  <div className="bg-white rounded-xl px-4 py-2 border border-gray-100 text-center">
                    <p className="text-xs text-gray-400">רמת סיכון</p>
                    <p className="text-xl font-extrabold" style={{ color: risk.color }}>{risk.level}</p>
                  </div>
                </div>
              </div>

              {/* Pie chart + legend */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-[200px] h-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} strokeWidth={2} stroke="#fff">
                        {pieData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5 w-full">
                  {pieData.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded" style={{ background: d.color }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-bold text-[#1a1a4b]">{d.value.toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                    {selectedFund.deepDrill.foreignExposure > 0 && (
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>חשיפה לחו"ל</span>
                        <span className="font-semibold text-[#d6157e]">{selectedFund.deepDrill.foreignExposure}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>דמ"נ מצבירה</span>
                      <span className="font-semibold text-[#1a1a4b]">{selectedFund.fees.savingsFeePercent}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>היקף נכסים</span>
                      <span className="font-semibold text-[#1a1a4b]">{fmtAssets(selectedFund.totalAssets)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl p-4 border-r-4" style={{ borderColor: risk.color, background: risk.color + "08" }}>
                <p className="text-sm text-[#1a1a4b] leading-relaxed">
                  <strong>המלצה:</strong> {risk.tip}
                </p>
                <Link to="/contact" className="inline-flex items-center gap-1 mt-2 text-sm font-bold text-[#d6157e] hover:underline">
                  רוצים בדיקה מקצועית? דברו עם סוכן →
                </Link>
              </div>
            </div>
          );
        })()}

        {!selectedFund && selectedCompany === "" && (
          <div className="text-center py-8 text-gray-300">
            <DoodleIcon name="charts" size={64} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">בחרו חברה, מוצר ומסלול כדי לראות את החשיפות</p>
          </div>
        )}
      </div>
    </section>
  );
}

const InvestmentTracks = () => {
  usePageMeta("מסלולי השקעה");
  const { funds: trackData, isLive, loading: tracksLoading } = useInvestmentTracks();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<ProductType | "all">("all");
  const [specFilter, setSpecFilter] = useState<Specialization | "all">("all");
  const [companyFilter, setCompanyFilter] = useState<ManagingCompany | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("year1");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = trackData;
    if (productFilter !== "all") list = list.filter(f => f.productType === productFilter);
    if (specFilter !== "all") list = list.filter(f => f.specialization === specFilter);
    if (companyFilter !== "all") list = list.filter(f => f.company === companyFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(f => f.name.includes(q) || companyLabels[f.company].includes(q) || f.fundNumber.includes(q));
    }
    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case "name": return sortDir === "asc" ? a.name.localeCompare(b.name, "he") : b.name.localeCompare(a.name, "he");
        case "year1": va = a.returns.year1; vb = b.returns.year1; break;
        case "year3": va = a.returns.year3; vb = b.returns.year3; break;
        case "year5": va = a.returns.year5; vb = b.returns.year5; break;
        case "fees": va = a.fees.savingsFeePercent; vb = b.fees.savingsFeePercent; break;
        case "assets": va = a.totalAssets; vb = b.totalAssets; break;
        default: va = 0; vb = 0;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [productFilter, specFilter, companyFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Stats
  const avgReturn = filtered.length > 0 ? filtered.reduce((s, f) => s + f.returns.year1, 0) / filtered.length : 0;
  const bestFund = filtered.length > 0 ? filtered.reduce((b, f) => f.returns.year1 > b.returns.year1 ? f : b) : null;
  const uniqueCompanies = new Set(filtered.map(f => f.company)).size;

  // Active product types for tabs
  const productTypes = [...new Set(trackData.map(f => f.productType))];
  const specializations = [...new Set(filtered.map(f => f.specialization))];
  const companies = [...new Set(trackData.map(f => f.company))];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#d6157e]" />
        <div className="absolute bottom-[15%] right-[6%] w-[65px] h-[65px] rounded-full bg-[#6b6fc4]" />
        <div className="absolute top-[45%] left-[18%] w-[35px] h-[35px] rounded-full bg-[#f06ba8]" />
        <div className="absolute top-[20%] right-[12%] w-[28px] h-[28px] rounded-full bg-[#6c63ff]" />
        <div className="absolute top-16 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#1a1a4b" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#1a1a4b" opacity="0.12" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1a1a4b] mb-4 leading-tight">
            מסלולי <span className="text-[#d6157e]">השקעה</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed mb-8">
            השוואת תשואות, דמי ניהול וחשיפות של כל מסלולי ההשקעה בישראל — קרנות השתלמות, קופות גמל, פנסיה ופוליסות חיסכון.
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#1a1a4b]">{trackData.length}</p>
              <p className="text-xs text-gray-400 mt-1">מסלולים במאגר</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#d6157e]">{new Set(trackData.map(f => f.company)).size}</p>
              <p className="text-xs text-gray-400 mt-1">חברות</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#f06ba8]">{productTypes.length}</p>
              <p className="text-xs text-gray-400 mt-1">סוגי מוצרים</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#6b6fc4]">2026</p>
              <p className="text-xs text-gray-400 mt-1">{isLive ? "נתונים חיים" : "נתונים מקומיים"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#1a1a4b] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#1a1a4b] font-medium">מסלולי השקעה</span>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Personal track checker */}
        <PersonalTrackChecker trackData={trackData} />

        {/* Search + Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="חיפוש לפי שם מסלול, חברה או מספר קופה..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10 rounded-xl border-gray-200 text-right"
                dir="rtl"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl gap-2 border-gray-200"
            >
              <Filter className="w-4 h-4" />
              סינון
              {(productFilter !== "all" || specFilter !== "all" || companyFilter !== "all") && (
                <span className="w-5 h-5 rounded-full bg-[#d6157e] text-white text-[10px] flex items-center justify-center">
                  {[productFilter, specFilter, companyFilter].filter(v => v !== "all").length}
                </span>
              )}
            </Button>
          </div>

          {/* Product type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setProductFilter("all"); setSpecFilter("all"); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${productFilter === "all" ? "bg-[#1a1a4b] text-white" : "bg-[#f8f9fc] text-gray-500 hover:bg-gray-100"}`}
            >
              הכל ({trackData.length})
            </button>
            {productTypes.map(pt => (
              <button
                key={pt}
                onClick={() => { setProductFilter(pt); setSpecFilter("all"); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${productFilter === pt ? "bg-[#1a1a4b] text-white" : "bg-[#f8f9fc] text-gray-500 hover:bg-gray-100"}`}
              >
                {productTypeLabels[pt]} ({trackData.filter(f => f.productType === pt).length})
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="bg-[#f8f9fc] rounded-2xl p-5 space-y-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1a1a4b]">סינון מתקדם</h3>
                <button onClick={() => { setProductFilter("all"); setSpecFilter("all"); setCompanyFilter("all"); setSearch(""); }} className="text-xs text-[#d6157e] font-semibold">
                  נקה הכל
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">קטגוריה</label>
                  <select
                    value={specFilter}
                    onChange={e => setSpecFilter(e.target.value as Specialization | "all")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#1a1a4b]"
                  >
                    <option value="all">כל הקטגוריות</option>
                    {specializations.map(s => (
                      <option key={s} value={s}>{specializationLabels[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">חברה</label>
                  <select
                    value={companyFilter}
                    onChange={e => setCompanyFilter(e.target.value as ManagingCompany | "all")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#1a1a4b]"
                  >
                    <option value="all">כל החברות</option>
                    {companies.map(c => (
                      <option key={c} value={c}>{companyLabels[c]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-500">{filtered.length} מסלולים | {uniqueCompanies} חברות | ממוצע תשואה 12 חודשים: <strong className="text-[#1a1a4b]">{fmt(avgReturn)}</strong></span>
          {bestFund && (
            <span className="text-xs text-gray-400 hidden sm:inline">מוביל: {bestFund.name} ({fmt(bestFund.returns.year1)})</span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-gray-100">
                  <th className="text-right px-4 py-3 font-bold text-[#1a1a4b] min-w-[200px]">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                      שם מסלול
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#1a1a4b]">חברה</th>
                  <th className="text-center px-3 py-3 font-bold text-[#1a1a4b]">קטגוריה</th>
                  <th className="text-center px-3 py-3 font-bold text-[#1a1a4b]">
                    <button onClick={() => toggleSort("year1")} className="flex items-center gap-1 mx-auto">
                      12 חודשים
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#1a1a4b] hidden sm:table-cell">
                    <button onClick={() => toggleSort("year3")} className="flex items-center gap-1 mx-auto">
                      3 שנים
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#1a1a4b] hidden md:table-cell">
                    <button onClick={() => toggleSort("year5")} className="flex items-center gap-1 mx-auto">
                      5 שנים
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#1a1a4b] hidden lg:table-cell">
                    <button onClick={() => toggleSort("fees")} className="flex items-center gap-1 mx-auto">
                      דמ"נ צבירה
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((fund, i) => {
                  const isExpanded = expandedId === fund.id;
                  const returnColor = (v: number) => v > avgReturn ? "text-[#f06ba8]" : v < 0 ? "text-[#3b3f99]" : "text-[#1a1a4b]";
                  return (
                    <>
                      <tr
                        key={fund.id}
                        onClick={() => setExpandedId(isExpanded ? null : fund.id)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-[#f8f9fc]" : "hover:bg-[#fafbfd]"} ${i === 0 && sortKey === "year1" ? "bg-[#f06ba8]/5" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#1a1a4b] text-sm">{fund.name}</div>
                          <div className="text-xs text-gray-400">קופה {fund.fundNumber}</div>
                        </td>
                        <td className="text-center px-3 py-3 text-xs text-gray-600">{companyLabels[fund.company]}</td>
                        <td className="text-center px-3 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8f9fc] border border-gray-100 text-[#1a1a4b]">
                            {specializationLabels[fund.specialization]}
                          </span>
                        </td>
                        <td className={`text-center px-3 py-3 font-bold ${returnColor(fund.returns.year1)}`}>
                          {fmt(fund.returns.year1)}
                        </td>
                        <td className={`text-center px-3 py-3 font-medium hidden sm:table-cell ${returnColor(fund.returns.year3)}`}>
                          {fmt(fund.returns.year3)}
                        </td>
                        <td className={`text-center px-3 py-3 font-medium hidden md:table-cell ${returnColor(fund.returns.year5)}`}>
                          {fmt(fund.returns.year5)}
                        </td>
                        <td className="text-center px-3 py-3 text-xs text-gray-500 hidden lg:table-cell">
                          {fund.fees.savingsFeePercent}%
                        </td>
                        <td className="px-2 py-3">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={fund.id + "-detail"}>
                          <td colSpan={8} className="px-4 py-5 bg-[#f8f9fc] border-b border-gray-100">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">תשואת חודש</p>
                                <p className="text-lg font-bold text-[#1a1a4b]">{fmt(fund.returns.month)}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">חשיפת מניות</p>
                                <p className="text-lg font-bold text-[#1a1a4b]">{fund.stockExposure}%</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">דמ"נ מהפקדה</p>
                                <p className="text-lg font-bold text-[#1a1a4b]">{fund.fees.depositFeePercent}%</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">היקף נכסים</p>
                                <p className="text-lg font-bold text-[#1a1a4b]">{fmtAssets(fund.totalAssets)}</p>
                              </div>
                              {fund.deepDrill.sharpeRatio && (
                                <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                  <p className="text-xs text-gray-400 mb-1">מדד שארפ</p>
                                  <p className="text-lg font-bold text-[#d6157e]">{fund.deepDrill.sharpeRatio.toFixed(2)}</p>
                                </div>
                              )}
                            </div>

                            {/* Asset allocation — pie chart */}
                            {(() => {
                              const dd = fund.deepDrill;
                              const pieData = [
                                { name: "מניות", value: dd.stocksAndOptions, color: "#d6157e" },
                                { name: 'אג"ח ממשלתי', value: dd.govBondsTradable + dd.designatedBonds, color: "#f06ba8" },
                                { name: 'אג"ח קונצרני', value: dd.corpBondsTradable + dd.corpBondsNonTradable, color: "#6b6fc4" },
                                { name: "מזומן", value: dd.cashEquivalents + dd.deposits, color: "#94a3b8" },
                                { name: "קרנות נאמנות", value: dd.mutualFunds, color: "#6c63ff" },
                                { name: "אחר", value: dd.otherAssets, color: "#3b3f99" },
                              ].filter(d => d.value > 0);
                              return (
                                <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
                                  <h4 className="text-sm font-bold text-[#1a1a4b] mb-3">הרכב נכסים — חשיפות</h4>
                                  <div className="flex flex-col sm:flex-row items-center gap-6">
                                    {/* Pie Chart */}
                                    <div className="w-[180px] h-[180px] shrink-0">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={80}
                                            strokeWidth={2}
                                            stroke="#fff"
                                          >
                                            {pieData.map((d, idx) => (
                                              <Cell key={idx} fill={d.color} />
                                            ))}
                                          </Pie>
                                          <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex-1 space-y-2">
                                      {pieData.map((d, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm border-b border-gray-50 pb-1.5">
                                          <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded" style={{ background: d.color }} />
                                            <span className="text-gray-600">{d.name}</span>
                                          </div>
                                          <span className="font-bold text-[#1a1a4b]">{d.value.toFixed(1)}%</span>
                                        </div>
                                      ))}
                                      {dd.foreignExposure > 0 && (
                                        <div className="flex items-center justify-between text-sm pt-1">
                                          <span className="text-gray-400">חשיפה לחו"ל</span>
                                          <span className="font-semibold text-[#d6157e]">{dd.foreignExposure}%</span>
                                        </div>
                                      )}
                                      {dd.currencyExposure > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-gray-400">חשיפת מט"ח</span>
                                          <span className="font-semibold text-[#6b6fc4]">{dd.currencyExposure}%</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="mt-3 text-center">
                              <Link to="/contact" className="text-sm text-[#d6157e] font-semibold hover:underline">
                                רוצה לדעת איך המסלול הזה משתלב בתיק שלך? → ניתוח חינם
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>לא נמצאו מסלולים מתאימים. נסו לשנות את הסינון.</p>
            </div>
          )}
        </div>

        {/* Educational content (SEO) */}
        <section className="mt-16 space-y-10">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a4b] mb-6">מה זה מסלול השקעה?</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-base">
              <p>
                מסלול השקעה קובע איך הכסף שלכם מושקע — כמה הולך למניות, כמה לאגרות חוב, וכמה למזומן. כל קרן פנסיה, קרן השתלמות וקופת גמל מציעה מגוון מסלולים שנבדלים ברמת הסיכון ובפוטנציאל התשואה.
              </p>
              <p>
                מסלול כללי מפזר את הכסף בין מניות, אגרות חוב ונכסים נוספים — ומתאים לרוב האנשים. מסלול מניות חושף יותר כסף לשוק המניות — פוטנציאל תשואה גבוה אבל גם סיכון גבוה. מסלול אגרות חוב שמרני יותר ומתאים למי שקרוב לפרישה.
              </p>
            </div>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a4b] mb-6">איך לבחור מסלול השקעה?</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-base">
              <p>
                הבחירה תלויה בשלושה דברים: גיל, אופק זמן, ורמת סיבולת לסיכון. ככלל אצבע — ככל שאתם צעירים יותר, כדאי לבחור מסלול אגרסיבי יותר כי יש לכם זמן להתאושש מירידות. ככל שמתקרבים לפרישה, עדיף מסלול שמרני יותר.
              </p>
              <p>
                חשוב גם להסתכל על דמי הניהול — הם אוכלים חלק מהתשואה. ותמיד כדאי להשוות בין חברות, כי אותו סוג מסלול יכול לתת תוצאות שונות מחברה לחברה.
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-12 rounded-2xl bg-[#f8f9fc] p-6 sm:p-8 border border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-500">הבהרה חשובה:</strong> הנתונים המוצגים הם למטרות מידע בלבד ואינם מהווים המלצה לרכישה, מכירה או פדיון של מוצר פיננסי. תשואות עבר אינן מבטיחות תשואות עתידיות. המקור: גמלנט — רשות שוק ההון, משרד האוצר. לקבלת החלטות השקעה יש לפנות לסוכן מורשה.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-12">
          <div className="bg-[#f8f9fc] rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-[#d6157e] opacity-10" />
            <div className="absolute bottom-4 left-10 w-14 h-14 rounded-full bg-[#6b6fc4] opacity-10" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a4b] mb-3 relative z-10">
              רוצים לדעת איך המסלול שלכם מתנהג?
            </h2>
            <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-xl mx-auto relative z-10">
              ניתוח תיק חינם — נבדוק מסלולים, דמי ניהול וחשיפות ונמליץ מה לשפר
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3.5 bg-[#d6157e] text-white font-semibold rounded-full hover:bg-[#cc1672] transition-colors relative z-10"
            >
              קבלו ניתוח תיק חינם
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InvestmentTracks;
