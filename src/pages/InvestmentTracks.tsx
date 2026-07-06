import { Fragment, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Search, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { useInvestmentTracks } from "@/hooks/useInvestmentTracks";
import { productTypeLabels, specializationLabels, companyLabels } from "@/types/fund";
import type { Fund, ProductType, Specialization, ManagingCompany } from "@/types/fund";
import { LiveTag } from "@/components/brand/Live";
import { BONE, SERIF, MONO, CARD_SHADOW } from "@/lib/brand";

// ── Helpers ──
const fmt = (n: number) => n.toFixed(2) + "%";
const fmtAssets = (m: number) => m >= 1000 ? (m / 1000).toFixed(1) + " מיליארד" : m.toLocaleString("he-IL") + " מ'";

// Greyscale ramp for asset-allocation charts — data is mono, color is reserved for status
const PIE_GREYS = ["#171717", "#4d4d4d", "#6e6e6e", "#a3a3a3", "#d4d4d4", "#ebebeb"];
const PIE_STROKE = BONE; // slice separator = white (pies live inside white data cards)

const monoNum: React.CSSProperties = { fontFamily: MONO, fontVariantNumeric: "tabular-nums" };

const selectClass =
  "w-full px-0 py-3 bg-transparent border-b border-[#171717]/20 text-[#171717] text-base focus:outline-none focus:border-[#171717] transition-colors appearance-none cursor-pointer min-h-[44px] rounded-none disabled:opacity-40 disabled:cursor-not-allowed";

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
    { name: "מניות", value: fund.deepDrill.stocksAndOptions },
    { name: 'אג"ח ממשלתי', value: fund.deepDrill.govBondsTradable + fund.deepDrill.designatedBonds },
    { name: 'אג"ח קונצרני', value: fund.deepDrill.corpBondsTradable + fund.deepDrill.corpBondsNonTradable },
    { name: "מזומן", value: fund.deepDrill.cashEquivalents + fund.deepDrill.deposits },
    { name: "אחר", value: fund.deepDrill.mutualFunds + fund.deepDrill.otherAssets },
  ].filter(d => d.value > 0).map((d, i) => ({ ...d, color: PIE_GREYS[i % PIE_GREYS.length] }));

  const getRiskLevel = (fund: Fund) => {
    const stock = fund.stockExposure;
    if (stock >= 80) return { level: "גבוהה", color: "#b91c1c", tip: "המסלול מתאים למשקיעים אגרסיביים עם אופק של 10+ שנים. כדאי לוודא שרמת הסיכון מתאימה לגיל ולתוכניות שלכם." };
    if (stock >= 40) return { level: "בינונית", color: "#b45309", tip: "מסלול מאוזן שמתאים לרוב האנשים. פיזור טוב בין מניות לאג\"ח. מומלץ לבדוק את דמי הניהול מול חברות מתחרות." };
    if (stock >= 10) return { level: "נמוכה-בינונית", color: "#15803d", tip: "מסלול סולידי יחסית. מתאים למי שקרוב לפרישה או רוצה יציבות. כדאי לבדוק שהתשואה מספיקה לצרכים שלכם." };
    return { level: "נמוכה", color: "#171717", tip: "מסלול שמרני מאוד. מתאים לטווח קצר או לפרישה קרובה. שווה לבדוק אם יש מסלולים עם תשואה טובה יותר באותה רמת סיכון." };
  };

  return (
    <section>
      <div className="border-t border-[#171717]/20 pt-6 mb-10">
        <div className="text-[11px] tracking-[0.22em] font-medium mb-3 text-[#5c5c5c]">
          בדיקה אישית
        </div>
        <h2
          className="text-[#171717] leading-tight"
          style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
        >
          בדקו את המסלול שלכם
        </h2>
        <p className="mt-3 text-base text-[#4d4d4d] leading-[1.85] max-w-xl">
          בחרו חברה, סוג מוצר ומסלול, ותראו לאן הכסף שלכם הולך: פיזור נכסים, חשיפות ורמת סיכון.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-5 mb-8 max-w-4xl">
        {/* Company */}
        <div>
          <label className="text-[12px] text-[#5c5c5c] mb-1 block">חברה</label>
          <select
            value={selectedCompany}
            onChange={e => { setSelectedCompany(e.target.value as ManagingCompany); setSelectedProduct(""); setSelectedFundId(""); }}
            className={selectClass}
          >
            <option value="">בחרו חברה</option>
            {[...new Set(trackData.map(f => f.company))].map(c => (
              <option key={c} value={c}>{companyLabels[c]}</option>
            ))}
          </select>
        </div>
        {/* Product type */}
        <div>
          <label className="text-[12px] text-[#5c5c5c] mb-1 block">סוג מוצר</label>
          <select
            value={selectedProduct}
            onChange={e => { setSelectedProduct(e.target.value as ProductType); setSelectedFundId(""); }}
            className={selectClass}
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
          <label className="text-[12px] text-[#5c5c5c] mb-1 block">מסלול</label>
          <select
            value={selectedFundId}
            onChange={e => setSelectedFundId(e.target.value)}
            className={selectClass}
            disabled={!selectedProduct}
          >
            <option value="">בחרו מסלול</option>
            {availableFunds.map(f => (
              <option key={f.id} value={f.id}>{specializationLabels[f.specialization]} · {f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result — a genuine data card */}
      {selectedFund && (() => {
        const pieData = getPieData(selectedFund);
        const risk = getRiskLevel(selectedFund);
        return (
          <div className="rounded-lg bg-white p-6 sm:p-8" style={{ boxShadow: CARD_SHADOW }}>
            {/* Fund header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-[#171717]/10 pb-5 mb-6">
              <div className="min-w-0">
                <h3 className="text-lg text-[#171717]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                  {selectedFund.name}
                </h3>
                <p className="text-[12px] text-[#6e6e6e] mt-1">
                  קופה{" "}
                  <span dir="ltr" style={monoNum}>{selectedFund.fundNumber}</span>
                  {" · "}
                  {companyLabels[selectedFund.company]}
                </p>
              </div>
              <div className="flex gap-10 shrink-0">
                <div>
                  <p className="text-[12px] text-[#6e6e6e] mb-1">תשואה 12 חודשים</p>
                  <p className="text-2xl text-[#171717]" dir="ltr" style={{ ...monoNum, fontWeight: 600 }}>
                    {fmt(selectedFund.returns.year1)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] text-[#6e6e6e] mb-1">רמת סיכון</p>
                  <p className="text-2xl" style={{ fontFamily: SERIF, fontWeight: 600, color: risk.color }}>
                    {risk.level}
                  </p>
                </div>
              </div>
            </div>

            {/* Pie chart + legend */}
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-[200px] h-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} strokeWidth={2} stroke={PIE_STROKE}>
                      {pieData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full">
                {pieData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-[#171717]/10 text-[14px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-[2px]" style={{ background: d.color, boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }} />
                      <span className="text-[#171717]/60">{d.name}</span>
                    </div>
                    <span className="text-[#171717] font-medium" dir="ltr" style={monoNum}>{d.value.toFixed(1)}%</span>
                  </div>
                ))}
                <div className="pt-2.5 space-y-1.5">
                  {selectedFund.deepDrill.foreignExposure > 0 && (
                    <div className="flex justify-between text-[12px] text-[#6e6e6e]">
                      <span>חשיפה לחו"ל</span>
                      <span className="text-[#171717]" dir="ltr" style={monoNum}>{selectedFund.deepDrill.foreignExposure}%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[12px] text-[#6e6e6e]">
                    <span>דמ"נ מצבירה</span>
                    <span className="text-[#171717]" dir="ltr" style={monoNum}>{selectedFund.fees.savingsFeePercent}%</span>
                  </div>
                  <div className="flex justify-between text-[12px] text-[#6e6e6e]">
                    <span>היקף נכסים</span>
                    <span className="text-[#171717]">{fmtAssets(selectedFund.totalAssets)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-7 border-t border-[#171717]/15 pt-5">
              <p className="text-[14px] text-[#171717]/60 leading-[1.85] max-w-2xl">
                <span className="font-medium text-[#171717]">המלצה: </span>
                {risk.tip}
              </p>
              <Link
                to="/contact"
                className="group mt-3 inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
              >
                רוצים בדיקה מקצועית? דברו עם יועץ
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </Link>
            </div>
          </div>
        );
      })()}

      {!selectedFund && (
        <div className="border-t border-[#171717]/10 pt-5">
          <p className="text-[14px] text-[#5c5c5c] leading-[1.8]">
            בחרו חברה, מוצר ומסלול כדי לראות את פיזור הנכסים ורמת הסיכון של הכסף שלכם.
          </p>
        </div>
      )}
    </section>
  );
}

const InvestmentTracks = () => {
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
  }, [trackData, productFilter, specFilter, companyFilter, search, sortKey, sortDir]);

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

  const hasActiveFilters = productFilter !== "all" || specFilter !== "all" || companyFilter !== "all";

  // Return value colored by data semantics: negative red, above filtered average green
  const returnColor = (v: number) => v < 0 ? "text-[#b91c1c]" : v > avgReturn ? "text-[#15803d]" : "text-[#171717]";

  const heroStats = [
    { value: trackData.length, label: "מסלולים במאגר" },
    { value: new Set(trackData.map(f => f.company)).size, label: "חברות מנהלות" },
    { value: productTypes.length, label: "סוגי מוצרים" },
  ];

  const thClass = "px-3 py-3 text-[12px] tracking-[0.08em] font-medium text-[#5c5c5c] whitespace-nowrap";
  const sortBtnClass = "inline-flex items-center gap-1 hover:text-[#171717] transition-colors";

  return (
    <div className="min-h-screen pb-2" dir="rtl" style={{ backgroundColor: "#171717" }}>
      <Header />

      {/* Hero tile + stat band as a row of small tiles (the play) */}
      <section className="px-2 pt-2">
        <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-10 sm:pb-12 relative z-10">
          <div className="border-t border-[#171717]/20 pt-5 mb-10 sm:mb-14 flex items-baseline justify-between gap-4">
            <nav className="flex items-center gap-2 text-[12px] text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
              <span>←</span>
              <span className="text-[#171717]/70 font-medium">מסלולי השקעה</span>
            </nav>
            <span className="hidden sm:block text-[11px] tracking-[0.22em] font-medium text-[#5c5c5c]">
              השוואת מסלולים
            </span>
          </div>

          <h1
            className="text-[#171717] leading-[1.15] mb-6 max-w-3xl"
            style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            מסלולי השקעה
          </h1>
          <p className="text-base sm:text-[17px] text-[#4d4d4d] max-w-2xl leading-[1.9] mb-6">
            השוואת תשואות, דמי ניהול וחשיפות של מסלולי ההשקעה בישראל:
            קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון.
          </p>
          <div dir="ltr">
            <LiveTag dot={isLive}>{isLive ? "LIVE DATA" : "LOCAL DATA"}</LiveTag>
          </div>
        </div></div>

        {/* Stat band — paper / orange / paper tiles */}
        <div className="mt-2 grid gap-2 grid-cols-1 sm:grid-cols-3">
          {heroStats.map((stat, i) => (
            <div
              key={stat.label}
              className={`${i === 1 ? "bento-panel-orange" : "bento-panel"} flex items-center justify-center py-7 px-4`}
            >
              <div className="relative z-10 text-center">
                <div
                  className="text-[#171717] tabular-nums mb-1.5"
                  dir="ltr"
                  style={{ fontFamily: MONO, fontWeight: 600, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", letterSpacing: "-0.02em" }}
                >
                  {stat.value}
                </div>
                <div className={`text-[12px] tracking-[0.1em] ${i === 1 ? "text-[#171717]/80" : "text-[#5c5c5c]"}`}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <main>
        {/* Tool body tile — checker + full table + educational content */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20 relative z-10">
            {/* Personal track checker */}
            <ScrollReveal>
              <PersonalTrackChecker trackData={trackData} />
            </ScrollReveal>

            {/* All tracks — filters + table */}
            <section>
              <div className="border-t border-[#171717]/20 pt-6 mb-10">
                <div className="text-[11px] tracking-[0.22em] font-medium mb-3 text-[#5c5c5c]">
                  המאגר המלא
                </div>
                <h2
                  className="text-[#171717] leading-tight"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                >
                  כל המסלולים
                </h2>
              </div>

              {/* Search + filter toggle */}
              <div className="flex items-end gap-8 mb-8 max-w-3xl">
                <div className="relative flex-1">
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c5c5c] pointer-events-none" strokeWidth={1.5} />
                  <input
                    placeholder="חיפוש לפי שם מסלול, חברה או מספר קופה"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pr-7 pl-0 py-3 bg-transparent border-b border-[#171717]/20 text-[#171717] placeholder:text-[#5c5c5c] text-base focus:outline-none focus:border-[#171717] transition-colors min-h-[44px] rounded-none"
                    dir="rtl"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 pb-3 text-[14px] font-medium border-b transition-colors min-h-[44px] ${showFilters || hasActiveFilters ? "text-[#171717] border-[#171717]" : "text-[#5c5c5c] border-transparent hover:text-[#171717]"}`}
                >
                  סינון מתקדם
                  {hasActiveFilters && (
                    <span className="mr-1.5 tabular-nums" dir="ltr" style={monoNum}>
                      ({[productFilter, specFilter, companyFilter].filter(v => v !== "all").length})
                    </span>
                  )}
                </button>
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="mb-8 max-w-3xl border-t border-[#171717]/10 pt-5">
                  <div className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
                    <div>
                      <label className="text-[12px] text-[#5c5c5c] mb-1 block">קטגוריה</label>
                      <select
                        value={specFilter}
                        onChange={e => setSpecFilter(e.target.value as Specialization | "all")}
                        className={selectClass}
                      >
                        <option value="all">כל הקטגוריות</option>
                        {specializations.map(s => (
                          <option key={s} value={s}>{specializationLabels[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] text-[#5c5c5c] mb-1 block">חברה</label>
                      <select
                        value={companyFilter}
                        onChange={e => setCompanyFilter(e.target.value as ManagingCompany | "all")}
                        className={selectClass}
                      >
                        <option value="all">כל החברות</option>
                        {companies.map(c => (
                          <option key={c} value={c}>{companyLabels[c]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setProductFilter("all"); setSpecFilter("all"); setCompanyFilter("all"); setSearch(""); }}
                    className="mt-5 text-[13px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                  >
                    ניקוי כל הסינונים
                  </button>
                </div>
              )}

              {/* Product type — underline tabs */}
              <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide border-b border-[#171717]/10 mb-6">
                <button
                  type="button"
                  onClick={() => { setProductFilter("all"); setSpecFilter("all"); }}
                  className={`shrink-0 pb-4 text-sm sm:text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${productFilter === "all" ? "text-[#171717] border-[#171717]" : "text-[#5c5c5c] border-transparent hover:text-[#171717]/70"}`}
                >
                  הכל{" "}
                  <span className="text-[12px] tabular-nums" dir="ltr" style={monoNum}>({trackData.length})</span>
                </button>
                {productTypes.map(pt => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => { setProductFilter(pt); setSpecFilter("all"); }}
                    className={`shrink-0 pb-4 text-sm sm:text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${productFilter === pt ? "text-[#171717] border-[#171717]" : "text-[#5c5c5c] border-transparent hover:text-[#171717]/70"}`}
                  >
                    {productTypeLabels[pt]}{" "}
                    <span className="text-[12px] tabular-nums" dir="ltr" style={monoNum}>
                      ({trackData.filter(f => f.productType === pt).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Results summary */}
              <div className="flex items-baseline justify-between gap-4 mb-4">
                <span className="text-[13px] text-[#5c5c5c]">
                  <span className="text-[#171717] tabular-nums" dir="ltr" style={monoNum}>{filtered.length}</span> מסלולים
                  {" · "}
                  <span className="text-[#171717] tabular-nums" dir="ltr" style={monoNum}>{uniqueCompanies}</span> חברות
                  {" · "}
                  ממוצע 12 חודשים:{" "}
                  <span className="text-[#171717] tabular-nums" dir="ltr" style={monoNum}>{fmt(avgReturn)}</span>
                </span>
                {bestFund && (
                  <span className="text-[12px] text-[#5c5c5c] hidden sm:inline truncate">
                    מוביל: {bestFund.name}{" "}
                    <span className="text-[#15803d] tabular-nums" dir="ltr" style={monoNum}>({fmt(bestFund.returns.year1)})</span>
                  </span>
                )}
              </div>

              {/* Table — ruled rows on paper, no card chrome */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#171717]/15">
                      <th className={`text-right ${thClass} min-w-[200px] pr-0`}>
                        <button type="button" onClick={() => toggleSort("name")} className={sortBtnClass}>
                          שם מסלול
                          <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </th>
                      <th className={`text-center ${thClass}`}>חברה</th>
                      <th className={`text-center ${thClass}`}>קטגוריה</th>
                      <th className={`text-center ${thClass}`}>
                        <button type="button" onClick={() => toggleSort("year1")} className={`${sortBtnClass} mx-auto`}>
                          12 חודשים
                          <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </th>
                      <th className={`text-center ${thClass} hidden sm:table-cell`}>
                        <button type="button" onClick={() => toggleSort("year3")} className={`${sortBtnClass} mx-auto`}>
                          3 שנים
                          <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </th>
                      <th className={`text-center ${thClass} hidden md:table-cell`}>
                        <button type="button" onClick={() => toggleSort("year5")} className={`${sortBtnClass} mx-auto`}>
                          5 שנים
                          <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </th>
                      <th className={`text-center ${thClass} hidden lg:table-cell`}>
                        <button type="button" onClick={() => toggleSort("fees")} className={`${sortBtnClass} mx-auto`}>
                          דמ"נ צבירה
                          <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                        </button>
                      </th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((fund) => {
                      const isExpanded = expandedId === fund.id;
                      return (
                        <Fragment key={fund.id}>
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : fund.id)}
                            className={`border-b cursor-pointer transition-colors ${isExpanded ? "border-[#171717]/40 bg-[#171717]/[0.04]" : "border-[#171717]/10 hover:bg-[#171717]/[0.04]"}`}
                          >
                            <td className="pl-3 pr-0 py-3.5">
                              <div className="font-medium text-[#171717] text-[14px]">{fund.name}</div>
                              <div className="text-[12px] text-[#5c5c5c]">
                                קופה <span dir="ltr" style={monoNum}>{fund.fundNumber}</span>
                              </div>
                            </td>
                            <td className="text-center px-3 py-3.5 text-[13px] text-[#171717]/60 whitespace-nowrap">
                              {companyLabels[fund.company]}
                            </td>
                            <td className="text-center px-3 py-3.5 text-[12px] text-[#5c5c5c] whitespace-nowrap">
                              {specializationLabels[fund.specialization]}
                            </td>
                            <td className={`text-center px-3 py-3.5 font-medium tabular-nums ${returnColor(fund.returns.year1)}`} dir="ltr" style={monoNum}>
                              {fmt(fund.returns.year1)}
                            </td>
                            <td className={`text-center px-3 py-3.5 tabular-nums hidden sm:table-cell ${returnColor(fund.returns.year3)}`} dir="ltr" style={monoNum}>
                              {fmt(fund.returns.year3)}
                            </td>
                            <td className={`text-center px-3 py-3.5 tabular-nums hidden md:table-cell ${returnColor(fund.returns.year5)}`} dir="ltr" style={monoNum}>
                              {fmt(fund.returns.year5)}
                            </td>
                            <td className="text-center px-3 py-3.5 text-[13px] text-[#171717]/60 tabular-nums hidden lg:table-cell" dir="ltr" style={monoNum}>
                              {fund.fees.savingsFeePercent}%
                            </td>
                            <td className="px-2 py-3.5">
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-[#5c5c5c]" strokeWidth={1.5} />
                                : <ChevronDown className="w-4 h-4 text-[#5c5c5c]" strokeWidth={1.5} />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="px-4 py-6 bg-[#171717]/[0.04] border-b border-[#171717]/15">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-5">
                                  {[
                                    { label: "תשואת חודש", value: fmt(fund.returns.month), ltr: true },
                                    { label: "חשיפת מניות", value: `${fund.stockExposure}%`, ltr: true },
                                    { label: 'דמ"נ מהפקדה', value: `${fund.fees.depositFeePercent}%`, ltr: true },
                                    { label: "היקף נכסים", value: fmtAssets(fund.totalAssets), ltr: false },
                                    ...(fund.deepDrill.sharpeRatio
                                      ? [{ label: "מדד שארפ", value: fund.deepDrill.sharpeRatio.toFixed(2), ltr: true }]
                                      : []),
                                  ].map((cell) => (
                                    <div key={cell.label} className="border-t border-[#171717]/15 pt-2.5">
                                      <p className="text-[12px] text-[#5c5c5c] mb-1">{cell.label}</p>
                                      <p
                                        className="text-lg text-[#171717] tabular-nums"
                                        dir={cell.ltr ? "ltr" : undefined}
                                        style={cell.ltr ? { ...monoNum, fontWeight: 500 } : { fontWeight: 500 }}
                                      >
                                        {cell.value}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                {/* Asset allocation — pie chart */}
                                {(() => {
                                  const dd = fund.deepDrill;
                                  const pieData = [
                                    { name: "מניות", value: dd.stocksAndOptions },
                                    { name: 'אג"ח ממשלתי', value: dd.govBondsTradable + dd.designatedBonds },
                                    { name: 'אג"ח קונצרני', value: dd.corpBondsTradable + dd.corpBondsNonTradable },
                                    { name: "מזומן", value: dd.cashEquivalents + dd.deposits },
                                    { name: "קרנות נאמנות", value: dd.mutualFunds },
                                    { name: "אחר", value: dd.otherAssets },
                                  ].filter(d => d.value > 0).map((d, i) => ({ ...d, color: PIE_GREYS[i % PIE_GREYS.length] }));
                                  return (
                                    <div className="mt-6 rounded-lg bg-white p-5 sm:p-6" style={{ boxShadow: CARD_SHADOW }}>
                                      <h4 className="text-base text-[#171717] mb-4" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                                        הרכב נכסים וחשיפות
                                      </h4>
                                      <div className="flex flex-col sm:flex-row items-center gap-8">
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
                                                stroke={PIE_STROKE}
                                              >
                                                {pieData.map((d, idx) => (
                                                  <Cell key={idx} fill={d.color} />
                                                ))}
                                              </Pie>
                                              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                            </PieChart>
                                          </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1 w-full">
                                          {pieData.map((d, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-[#171717]/10 text-[14px]">
                                              <div className="flex items-center gap-2.5">
                                                <span className="w-3 h-3 rounded-[2px]" style={{ background: d.color, boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }} />
                                                <span className="text-[#171717]/60">{d.name}</span>
                                              </div>
                                              <span className="text-[#171717] font-medium tabular-nums" dir="ltr" style={monoNum}>
                                                {d.value.toFixed(1)}%
                                              </span>
                                            </div>
                                          ))}
                                          {dd.foreignExposure > 0 && (
                                            <div className="flex items-center justify-between pt-2 text-[12px] text-[#6e6e6e]">
                                              <span>חשיפה לחו"ל</span>
                                              <span className="text-[#171717] tabular-nums" dir="ltr" style={monoNum}>{dd.foreignExposure}%</span>
                                            </div>
                                          )}
                                          {dd.currencyExposure > 0 && (
                                            <div className="flex items-center justify-between pt-1 text-[12px] text-[#6e6e6e]">
                                              <span>חשיפת מט"ח</span>
                                              <span className="text-[#171717] tabular-nums" dir="ltr" style={monoNum}>{dd.currencyExposure}%</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}

                                <div className="mt-5">
                                  <Link
                                    to="/contact"
                                    className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                                  >
                                    איך המסלול הזה משתלב בתיק שלכם? ניתוח ללא עלות
                                    <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <div className="border-b border-[#171717]/10 py-12">
                    {tracksLoading ? (
                      <p className="text-base text-[#4d4d4d]">טוען את נתוני המסלולים...</p>
                    ) : (
                      <>
                        <p className="text-base text-[#4d4d4d] leading-[1.85] max-w-xl">
                          לא נמצאו מסלולים שמתאימים לסינון הנוכחי. נסו לנקות חלק מהסינונים או לחפש בשם אחר.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setProductFilter("all"); setSpecFilter("all"); setCompanyFilter("all"); setSearch(""); }}
                          className="mt-4 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                        >
                          ניקוי כל הסינונים
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Educational content (SEO) */}
            <section className="grid md:grid-cols-2 gap-x-16 gap-y-12">
              <ScrollReveal>
                <div className="border-t border-[#171717]/15 pt-6">
                  <h2
                    className="text-[#171717] leading-tight mb-5"
                    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.3rem, 2.4vw, 1.7rem)" }}
                  >
                    מה זה מסלול השקעה?
                  </h2>
                  <div className="space-y-4 text-[#4d4d4d] leading-[1.9] text-base">
                    <p>
                      מסלול השקעה קובע איך הכסף שלכם מושקע: כמה הולך למניות, כמה לאגרות חוב, וכמה למזומן. כל קרן פנסיה, קרן השתלמות וקופת גמל מציעה מגוון מסלולים שנבדלים ברמת הסיכון ובפוטנציאל התשואה.
                    </p>
                    <p>
                      מסלול כללי מפזר את הכסף בין מניות, אגרות חוב ונכסים נוספים, ומתאים לרוב האנשים. מסלול מניות חושף יותר כסף לשוק המניות: פוטנציאל תשואה גבוה אבל גם סיכון גבוה. מסלול אגרות חוב שמרני יותר ומתאים למי שקרוב לפרישה.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div className="border-t border-[#171717]/15 pt-6">
                  <h2
                    className="text-[#171717] leading-tight mb-5"
                    style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.3rem, 2.4vw, 1.7rem)" }}
                  >
                    איך לבחור מסלול השקעה?
                  </h2>
                  <div className="space-y-4 text-[#4d4d4d] leading-[1.9] text-base">
                    <p>
                      הבחירה תלויה בשלושה דברים: גיל, אופק זמן, ורמת סיבולת לסיכון. ככלל אצבע, ככל שאתם צעירים יותר, כדאי לבחור מסלול אגרסיבי יותר כי יש לכם זמן להתאושש מירידות. ככל שמתקרבים לפרישה, עדיף מסלול שמרני יותר.
                    </p>
                    <p>
                      חשוב גם להסתכל על דמי הניהול, שאוכלים חלק מהתשואה. ותמיד כדאי להשוות בין חברות, כי אותו סוג מסלול יכול לתת תוצאות שונות מחברה לחברה.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </section>
          </div></div>
        </section>

        {/* Disclaimer tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12 relative z-10">
            <div className="border-t border-[#171717]/10 pt-5 max-w-3xl">
              <p className="text-[13px] text-[#5c5c5c] leading-[1.85]">
                <span className="font-medium text-[#171717]/70">הבהרה חשובה: </span>
                הנתונים המוצגים הם למטרות מידע בלבד ואינם מהווים המלצה לרכישה, מכירה או פדיון של מוצר פיננסי.
                תשואות עבר אינן מבטיחות תשואות עתידיות. המקור: גמלנט, רשות שוק ההון, משרד האוצר.
                לקבלת החלטות השקעה יש לפנות לסוכן מורשה.
              </p>
            </div>
          </div></div>
        </section>

        {/* Next action — closing ink tile */}
        <section className="px-2 pt-2">
          <div className="bento-panel-ink"><div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative z-10">
            <div className="border-t border-white/20 pt-5">
              <h2
                className="text-[#fafafa] leading-tight mb-3"
                style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.5rem, 3vw, 2.3rem)" }}
              >
                רוצים לדעת איך המסלול שלכם מתנהג?
              </h2>
              <p className="text-[#fafafa]/45 text-base leading-[1.85] mb-8 max-w-xl">
                ניתוח תיק ללא עלות: נבדוק מסלולים, דמי ניהול וחשיפות, ונמליץ מה לשפר.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#fafafa] text-[#171717] text-base font-medium tracking-wide hover:bg-white transition-colors min-h-[52px]"
              >
                לניתוח תיק ללא עלות
              </Link>
            </div>
          </div></div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InvestmentTracks;
