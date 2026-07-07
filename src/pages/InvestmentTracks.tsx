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
import { CountUp, LiveTag } from "@/components/brand/Live";
import {
  BLUE, CORAL, DISPLAY, GOLD, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, PASTEL_PEACH, TURQ, TURQ_TEXT,
} from "@/lib/brand";

// SEELD DNA v3 (STYLESEED.md): white canvas, pastel circles, hairline separators,
// table.dna-data for the capital-markets grid, turquoise big stats.

// ── Helpers ──
const fmt = (n: number) => n.toFixed(2) + "%";
const fmtAssets = (m: number) => m >= 1000 ? (m / 1000).toFixed(1) + " מיליארד" : m.toLocaleString("he-IL") + " מ'";

// DNA palette ramp for asset-allocation charts
const PIE_COLORS = [NAVY, TURQ, BLUE, GOLD, CORAL, PASTEL_BLUE];
const PIE_STROKE = "#ffffff"; // slice separator = white (pies live on white cards)

const monoNum: React.CSSProperties = { fontFamily: MONO, fontVariantNumeric: "tabular-nums" };

// DNA v3 boxed select: white, hairline border, navy focus
const selectClass =
  "w-full px-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors appearance-none cursor-pointer min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed";

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
  ].filter(d => d.value > 0).map((d, i) => ({ ...d, color: PIE_COLORS[i % PIE_COLORS.length] }));

  const getRiskLevel = (fund: Fund) => {
    const stock = fund.stockExposure;
    if (stock >= 80) return { level: "גבוהה", color: "#a04a5c", tip: "המסלול מתאים למשקיעים אגרסיביים עם אופק של 10+ שנים. כדאי לוודא שרמת הסיכון מתאימה לגיל ולתוכניות שלכם." };
    if (stock >= 40) return { level: "בינונית", color: "#8a5a1e", tip: "מסלול מאוזן שמתאים לרוב האנשים. פיזור טוב בין מניות לאג\"ח. מומלץ לבדוק את דמי הניהול מול חברות מתחרות." };
    if (stock >= 10) return { level: "נמוכה-בינונית", color: "#356d60", tip: "מסלול סולידי יחסית. מתאים למי שקרוב לפרישה או רוצה יציבות. כדאי לבדוק שהתשואה מספיקה לצרכים שלכם." };
    return { level: "נמוכה", color: NAVY, tip: "מסלול שמרני מאוד. מתאים לטווח קצר או לפרישה קרובה. שווה לבדוק אם יש מסלולים עם תשואה טובה יותר באותה רמת סיכון." };
  };

  return (
    <section>
      <div className="mb-10">
        <h2
          className="dna-display leading-tight"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
        >
          בדקו את המסלול שלכם
        </h2>
        <p className="mt-3 text-base leading-[1.85] max-w-xl" style={{ color: MUTED }}>
          בחרו חברה, סוג מוצר ומסלול, ותראו לאן הכסף שלכם הולך: פיזור נכסים, חשיפות ורמת סיכון.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 mb-8 max-w-4xl">
        {/* Company */}
        <div>
          <label className="text-[13px] mb-1.5 block" style={{ color: MUTED }}>חברה</label>
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
          <label className="text-[13px] mb-1.5 block" style={{ color: MUTED }}>סוג מוצר</label>
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
          <label className="text-[13px] mb-1.5 block" style={{ color: MUTED }}>מסלול</label>
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
          <div className="dna-concept !p-6 sm:!p-8">
            {/* Fund header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b pb-5 mb-6" style={{ borderColor: LINE }}>
              <div className="min-w-0">
                <h3 className="text-lg" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                  {selectedFund.name}
                </h3>
                <p className="text-[12.5px] mt-1" style={{ color: MUTED }}>
                  קופה{" "}
                  <span dir="ltr" style={monoNum}>{selectedFund.fundNumber}</span>
                  {" · "}
                  {companyLabels[selectedFund.company]}
                </p>
              </div>
              <div className="flex gap-10 shrink-0">
                <div>
                  <p className="text-[12.5px] mb-1" style={{ color: MUTED }}>תשואה 12 חודשים</p>
                  <p
                    className="tabular-nums"
                    dir="ltr"
                    style={{ fontFamily: DISPLAY, fontWeight: 900, color: TURQ, fontSize: "1.65rem", lineHeight: 1.15 }}
                  >
                    {fmt(selectedFund.returns.year1)}
                  </p>
                </div>
                <div>
                  <p className="text-[12.5px] mb-1" style={{ color: MUTED }}>רמת סיכון</p>
                  <p className="text-2xl" style={{ fontFamily: DISPLAY, fontWeight: 700, color: risk.color }}>
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
                  <div key={idx} className="flex items-center justify-between py-2 border-b text-[14px]" style={{ borderColor: LINE }}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-[2px]" style={{ background: d.color, boxShadow: "0 0 0 1px rgba(29,45,61,.08)" }} />
                      <span style={{ color: "#3a4c5a" }}>{d.name}</span>
                    </div>
                    <span className="font-medium" dir="ltr" style={{ ...monoNum, color: NAVY }}>{d.value.toFixed(1)}%</span>
                  </div>
                ))}
                <div className="pt-2.5 space-y-1.5">
                  {selectedFund.deepDrill.foreignExposure > 0 && (
                    <div className="flex justify-between text-[12.5px]" style={{ color: MUTED }}>
                      <span>חשיפה לחו"ל</span>
                      <span dir="ltr" style={{ ...monoNum, color: NAVY }}>{selectedFund.deepDrill.foreignExposure}%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[12.5px]" style={{ color: MUTED }}>
                    <span>דמ"נ מצבירה</span>
                    <span dir="ltr" style={{ ...monoNum, color: NAVY }}>{selectedFund.fees.savingsFeePercent}%</span>
                  </div>
                  <div className="flex justify-between text-[12.5px]" style={{ color: MUTED }}>
                    <span>היקף נכסים</span>
                    <span style={{ color: NAVY }}>{fmtAssets(selectedFund.totalAssets)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-7 border-t pt-5" style={{ borderColor: LINE }}>
              <p className="text-[14px] leading-[1.85] max-w-2xl" style={{ color: "#3a4c5a" }}>
                <span className="font-medium" style={{ color: NAVY }}>המלצה: </span>
                {risk.tip}
              </p>
              <Link
                to="/contact"
                className="group mt-3 inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
              >
                רוצים בדיקה מקצועית? דברו עם יועץ
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </Link>
            </div>
          </div>
        );
      })()}

      {!selectedFund && (
        <div className="dna-callout max-w-2xl">
          <p className="text-[14px] leading-[1.8]">
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

  // Return value colored by data semantics: negative coral, above filtered average turquoise
  const returnStyle = (v: number): React.CSSProperties =>
    v < 0 ? { color: "#a04a5c" } : v > avgReturn ? { color: TURQ_TEXT } : {};

  const heroStats = [
    { value: new Set(trackData.map(f => f.company)).size, label: "חברות מנהלות" },
    { value: trackData.length, label: "מסלולים במאגר" },
    { value: productTypes.length, label: "סוגי מוצרים" },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main className="dna-page">
        {/* Pastel circle backdrop — decorative, never behind small text */}
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ"
            style={{ width: 280, height: 280, top: -120, left: -100, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 220, height: 220, top: 360, right: -110, backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
          <div
            className="dna-circ hidden md:block"
            style={{ width: 240, height: 240, bottom: -130, left: "34%", backgroundColor: PASTEL_PEACH, opacity: 0.55 }}
          />
        </div>

        <div className="relative z-10">
          {/* Hero */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-12">
            <nav className="flex items-center gap-2 text-[13px] mb-8" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">מסלולי השקעה</span>
            </nav>

            <h1
              className="dna-display leading-[1.15] mb-5 max-w-3xl"
              style={{ fontSize: "clamp(2rem, 5vw, 3.1rem)" }}
            >
              מסלולי השקעה
            </h1>
            <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9] mb-6" style={{ color: MUTED }}>
              השוואת תשואות, דמי ניהול וחשיפות של מסלולי ההשקעה בישראל:
              קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון.
            </p>
            <div dir="ltr">
              <LiveTag dot={isLive}>{isLive ? "LIVE DATA" : "LOCAL DATA"}</LiveTag>
            </div>

            {/* Stat band — turquoise big stats over hairlines */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-y-8 border-t border-b py-8 sm:py-10" style={{ borderColor: LINE }}>
              {heroStats.map((stat) => (
                <div key={stat.label} className="text-center px-4">
                  <div
                    className="tabular-nums mb-1.5"
                    dir="ltr"
                    style={{
                      fontFamily: DISPLAY,
                      fontWeight: 900,
                      color: TURQ,
                      fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    <CountUp to={stat.value} />
                  </div>
                  <div className="text-[13px] tracking-[0.08em]" style={{ color: MUTED }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tool body — checker + full table + educational content */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 sm:space-y-20">
              {/* Personal track checker */}
              <ScrollReveal>
                <PersonalTrackChecker trackData={trackData} />
              </ScrollReveal>

              {/* All tracks — filters + table */}
              <section>
                <div className="mb-10 border-t pt-10" style={{ borderColor: LINE }}>
                  <h2
                    className="dna-display leading-tight"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                  >
                    כל המסלולים
                  </h2>
                </div>

                {/* Search + filter toggle */}
                <div className="flex items-center gap-6 mb-8 max-w-3xl">
                  <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: MUTED }} strokeWidth={1.5} />
                    <input
                      placeholder="חיפוש לפי שם מסלול, חברה או מספר קופה"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pr-11 pl-4 py-3 bg-white border border-[#E7EDF1] rounded-lg text-[#1D2D3D] placeholder:text-[#5a6a78] text-base focus:outline-none focus:border-[#1D2D3D] transition-colors min-h-[48px]"
                      dir="rtl"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`shrink-0 text-[14px] font-medium border-b pb-0.5 transition-colors min-h-[44px] ${showFilters || hasActiveFilters ? "text-[#1D2D3D] border-[#1D2D3D]" : "text-[#5a6a78] border-transparent hover:text-[#1D2D3D]"}`}
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
                  <div className="mb-8 max-w-3xl border-t pt-5" style={{ borderColor: LINE }}>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <label className="text-[13px] mb-1.5 block" style={{ color: MUTED }}>קטגוריה</label>
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
                        <label className="text-[13px] mb-1.5 block" style={{ color: MUTED }}>חברה</label>
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
                      className="mt-5 text-[13px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
                    >
                      ניקוי כל הסינונים
                    </button>
                  </div>
                )}

                {/* Product type — underline tabs */}
                <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide border-b mb-6" style={{ borderColor: LINE }}>
                  <button
                    type="button"
                    onClick={() => { setProductFilter("all"); setSpecFilter("all"); }}
                    className={`shrink-0 pb-4 text-sm sm:text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${productFilter === "all" ? "text-[#1D2D3D] border-[#4E9D8F]" : "text-[#5a6a78] border-transparent hover:text-[#1D2D3D]"}`}
                  >
                    הכל{" "}
                    <span className="text-[12px] tabular-nums" dir="ltr" style={monoNum}>({trackData.length})</span>
                  </button>
                  {productTypes.map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => { setProductFilter(pt); setSpecFilter("all"); }}
                      className={`shrink-0 pb-4 text-sm sm:text-base font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${productFilter === pt ? "text-[#1D2D3D] border-[#4E9D8F]" : "text-[#5a6a78] border-transparent hover:text-[#1D2D3D]"}`}
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
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    <span className="tabular-nums" dir="ltr" style={{ ...monoNum, color: NAVY }}>{filtered.length}</span> מסלולים
                    {" · "}
                    <span className="tabular-nums" dir="ltr" style={{ ...monoNum, color: NAVY }}>{uniqueCompanies}</span> חברות
                    {" · "}
                    ממוצע 12 חודשים:{" "}
                    <span className="tabular-nums" dir="ltr" style={{ ...monoNum, color: NAVY }}>{fmt(avgReturn)}</span>
                  </span>
                  {bestFund && (
                    <span className="text-[12.5px] hidden sm:inline truncate" style={{ color: MUTED }}>
                      מוביל: {bestFund.name}{" "}
                      <span className="tabular-nums" dir="ltr" style={{ ...monoNum, color: TURQ_TEXT }}>({fmt(bestFund.returns.year1)})</span>
                    </span>
                  )}
                </div>

                {/* Table — the data craft: navy header, zebra rows, mono LTR numbers */}
                <div className="overflow-x-auto">
                  <table className="dna-data">
                    <thead>
                      <tr>
                        <th className="min-w-[200px]">
                          <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 text-white/85 hover:text-white transition-colors">
                            שם מסלול
                            <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </th>
                        <th>חברה</th>
                        <th>קטגוריה</th>
                        <th>
                          <button type="button" onClick={() => toggleSort("year1")} className="inline-flex items-center gap-1 text-white/85 hover:text-white transition-colors">
                            12 חודשים
                            <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </th>
                        <th className="hidden sm:table-cell">
                          <button type="button" onClick={() => toggleSort("year3")} className="inline-flex items-center gap-1 text-white/85 hover:text-white transition-colors">
                            3 שנים
                            <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </th>
                        <th className="hidden md:table-cell">
                          <button type="button" onClick={() => toggleSort("year5")} className="inline-flex items-center gap-1 text-white/85 hover:text-white transition-colors">
                            5 שנים
                            <ArrowUpDown className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </th>
                        <th className="hidden lg:table-cell">
                          <button type="button" onClick={() => toggleSort("fees")} className="inline-flex items-center gap-1 text-white/85 hover:text-white transition-colors">
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
                              className="cursor-pointer"
                              style={isExpanded ? { backgroundColor: "#E1EAF1" } : undefined}
                            >
                              <td>
                                <div>{fund.name}</div>
                                <div className="text-[12px] font-normal" style={{ color: MUTED }}>
                                  קופה <span dir="ltr" style={monoNum}>{fund.fundNumber}</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap">{companyLabels[fund.company]}</td>
                              <td className="whitespace-nowrap text-[12.5px]">{specializationLabels[fund.specialization]}</td>
                              <td className="num font-medium" style={returnStyle(fund.returns.year1)}>
                                {fmt(fund.returns.year1)}
                              </td>
                              <td className="num hidden sm:table-cell" style={returnStyle(fund.returns.year3)}>
                                {fmt(fund.returns.year3)}
                              </td>
                              <td className="num hidden md:table-cell" style={returnStyle(fund.returns.year5)}>
                                {fmt(fund.returns.year5)}
                              </td>
                              <td className="num hidden lg:table-cell">
                                {fund.fees.savingsFeePercent}%
                              </td>
                              <td>
                                {isExpanded
                                  ? <ChevronUp className="w-4 h-4" style={{ color: MUTED }} strokeWidth={1.5} />
                                  : <ChevronDown className="w-4 h-4" style={{ color: MUTED }} strokeWidth={1.5} />}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={8} className="!px-4 !py-6" style={{ backgroundColor: "#F7FAFB" }}>
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
                                      <div key={cell.label} className="border-t pt-2.5" style={{ borderColor: LINE }}>
                                        <p className="text-[12.5px] mb-1 font-normal" style={{ color: MUTED }}>{cell.label}</p>
                                        <p
                                          className="text-lg tabular-nums"
                                          dir={cell.ltr ? "ltr" : undefined}
                                          style={cell.ltr ? { ...monoNum, fontWeight: 500, color: NAVY } : { fontWeight: 500, color: NAVY }}
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
                                    ].filter(d => d.value > 0).map((d, i) => ({ ...d, color: PIE_COLORS[i % PIE_COLORS.length] }));
                                    return (
                                      <div className="dna-concept mt-6 !p-5 sm:!p-6">
                                        <h4 className="text-base mb-4" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
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
                                              <div key={idx} className="flex items-center justify-between py-1.5 border-b text-[14px]" style={{ borderColor: LINE }}>
                                                <div className="flex items-center gap-2.5">
                                                  <span className="w-3 h-3 rounded-[2px]" style={{ background: d.color, boxShadow: "0 0 0 1px rgba(29,45,61,.08)" }} />
                                                  <span className="font-normal" style={{ color: "#3a4c5a" }}>{d.name}</span>
                                                </div>
                                                <span className="font-medium tabular-nums" dir="ltr" style={{ ...monoNum, color: NAVY }}>
                                                  {d.value.toFixed(1)}%
                                                </span>
                                              </div>
                                            ))}
                                            {dd.foreignExposure > 0 && (
                                              <div className="flex items-center justify-between pt-2 text-[12.5px] font-normal" style={{ color: MUTED }}>
                                                <span>חשיפה לחו"ל</span>
                                                <span className="tabular-nums" dir="ltr" style={{ ...monoNum, color: NAVY }}>{dd.foreignExposure}%</span>
                                              </div>
                                            )}
                                            {dd.currencyExposure > 0 && (
                                              <div className="flex items-center justify-between pt-1 text-[12.5px] font-normal" style={{ color: MUTED }}>
                                                <span>חשיפת מט"ח</span>
                                                <span className="tabular-nums" dir="ltr" style={{ ...monoNum, color: NAVY }}>{dd.currencyExposure}%</span>
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
                                      className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
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
                    <div className="border-b py-12" style={{ borderColor: LINE }}>
                      {tracksLoading ? (
                        <p className="text-base" style={{ color: "#3a4c5a" }}>טוען את נתוני המסלולים...</p>
                      ) : (
                        <>
                          <p className="text-base leading-[1.85] max-w-xl" style={{ color: "#3a4c5a" }}>
                            לא נמצאו מסלולים שמתאימים לסינון הנוכחי. נסו לנקות חלק מהסינונים או לחפש בשם אחר.
                          </p>
                          <button
                            type="button"
                            onClick={() => { setProductFilter("all"); setSpecFilter("all"); setCompanyFilter("all"); setSearch(""); }}
                            className="mt-4 text-[14px] font-medium text-[#1D2D3D] border-b border-[#1D2D3D]/25 pb-0.5 hover:border-[#1D2D3D] transition-colors"
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
              <section className="grid md:grid-cols-2 gap-x-16 gap-y-12 border-t pt-12" style={{ borderColor: LINE }}>
                <ScrollReveal>
                  <div>
                    <h2
                      className="dna-display leading-tight mb-5"
                      style={{ fontSize: "clamp(1.3rem, 2.4vw, 1.7rem)" }}
                    >
                      מה זה מסלול השקעה?
                    </h2>
                    <div className="space-y-4 leading-[1.9] text-base" style={{ color: "#3a4c5a" }}>
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
                  <div>
                    <h2
                      className="dna-display leading-tight mb-5"
                      style={{ fontSize: "clamp(1.3rem, 2.4vw, 1.7rem)" }}
                    >
                      איך לבחור מסלול השקעה?
                    </h2>
                    <div className="space-y-4 leading-[1.9] text-base" style={{ color: "#3a4c5a" }}>
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
            </div>
          </section>

          {/* Disclaimer */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
              <div className="max-w-3xl">
                <div className="dna-quote gold">
                  <div className="dna-ql">הבהרה חשובה</div>
                  <div className="dna-qt">
                    הנתונים המוצגים הם למטרות מידע בלבד ואינם מהווים המלצה לרכישה, מכירה או פדיון של מוצר פיננסי.
                    תשואות עבר אינן מבטיחות תשואות עתידיות. המקור: גמלנט, רשות שוק ההון, משרד האוצר.
                    לקבלת החלטות השקעה יש לפנות לסוכן מורשה.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Closing CTA — institutional navy band */}
      <section style={{ backgroundColor: NAVY }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2
            className="text-white leading-tight mb-3"
            style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
          >
            רוצים לדעת איך המסלול שלכם מתנהג?
          </h2>
          <p className="text-base leading-[1.85] mb-8 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
            ניתוח תיק ללא עלות: נבדוק מסלולים, דמי ניהול וחשיפות, ונמליץ מה לשפר.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
          >
            לניתוח תיק ללא עלות
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestmentTracks;
