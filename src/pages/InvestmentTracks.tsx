import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DoodleIcon from "@/components/DoodleIcon";
import { ChevronLeft, Search, ArrowUpDown, TrendingUp, TrendingDown, Filter, BarChart3, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { allFunds } from "@/data/cmaFundsData";
import { productTypeLabels, specializationLabels, companyLabels } from "@/types/fund";
import type { Fund, ProductType, Specialization, ManagingCompany } from "@/types/fund";

// ── Helpers ──
const fmt = (n: number) => n.toFixed(2) + "%";
const fmtAssets = (m: number) => m >= 1000 ? (m / 1000).toFixed(1) + " מיליארד" : m.toLocaleString("he-IL") + " מ'";

type SortKey = "name" | "year1" | "year3" | "year5" | "fees" | "assets";
type SortDir = "asc" | "desc";

const InvestmentTracks = () => {
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
    let list = allFunds;
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
  const productTypes = [...new Set(allFunds.map(f => f.productType))];
  const specializations = [...new Set(filtered.map(f => f.specialization))];
  const companies = [...new Set(allFunds.map(f => f.company))];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="bg-[#f8f9fc] relative overflow-hidden">
        <div className="absolute top-[10%] left-[4%] w-[90px] h-[90px] rounded-full bg-[#5ec6c6]" />
        <div className="absolute bottom-[15%] right-[6%] w-[65px] h-[65px] rounded-full bg-[#f4a261]" />
        <div className="absolute top-[45%] left-[18%] w-[35px] h-[35px] rounded-full bg-[#90be6d]" />
        <div className="absolute top-[20%] right-[12%] w-[28px] h-[28px] rounded-full bg-[#6c63ff]" />
        <div className="absolute top-16 right-[15%] hidden lg:block">
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            <path d="M10 80 C 50 10, 110 10, 150 60" stroke="#0a3d3d" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.12" />
            <polygon points="150,60 142,54 146,66" fill="#0a3d3d" opacity="0.12" />
          </svg>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0a3d3d] mb-4 leading-tight">
            מסלולי <span className="text-[#5ec6c6]">השקעה</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl leading-relaxed mb-8">
            השוואת תשואות, דמי ניהול וחשיפות של כל מסלולי ההשקעה בישראל — קרנות השתלמות, קופות גמל, פנסיה ופוליסות חיסכון.
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#0a3d3d]">{allFunds.length}</p>
              <p className="text-xs text-gray-400 mt-1">מסלולים במאגר</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#5ec6c6]">{new Set(allFunds.map(f => f.company)).size}</p>
              <p className="text-xs text-gray-400 mt-1">חברות</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#90be6d]">{productTypes.length}</p>
              <p className="text-xs text-gray-400 mt-1">סוגי מוצרים</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-3xl font-extrabold text-[#f4a261]">2026</p>
              <p className="text-xs text-gray-400 mt-1">נתונים עדכניים</p>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0a3d3d] transition-colors">דף הבית</Link>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#0a3d3d] font-medium">מסלולי השקעה</span>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
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
                <span className="w-5 h-5 rounded-full bg-[#5ec6c6] text-white text-[10px] flex items-center justify-center">
                  {[productFilter, specFilter, companyFilter].filter(v => v !== "all").length}
                </span>
              )}
            </Button>
          </div>

          {/* Product type tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => { setProductFilter("all"); setSpecFilter("all"); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${productFilter === "all" ? "bg-[#0a3d3d] text-white" : "bg-[#f8f9fc] text-gray-500 hover:bg-gray-100"}`}
            >
              הכל ({allFunds.length})
            </button>
            {productTypes.map(pt => (
              <button
                key={pt}
                onClick={() => { setProductFilter(pt); setSpecFilter("all"); }}
                className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all ${productFilter === pt ? "bg-[#0a3d3d] text-white" : "bg-[#f8f9fc] text-gray-500 hover:bg-gray-100"}`}
              >
                {productTypeLabels[pt]} ({allFunds.filter(f => f.productType === pt).length})
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="bg-[#f8f9fc] rounded-2xl p-5 space-y-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0a3d3d]">סינון מתקדם</h3>
                <button onClick={() => { setProductFilter("all"); setSpecFilter("all"); setCompanyFilter("all"); setSearch(""); }} className="text-xs text-[#5ec6c6] font-semibold">
                  נקה הכל
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">קטגוריה</label>
                  <select
                    value={specFilter}
                    onChange={e => setSpecFilter(e.target.value as Specialization | "all")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#0a3d3d]"
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
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white text-[#0a3d3d]"
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
          <span className="text-gray-500">{filtered.length} מסלולים | {uniqueCompanies} חברות | ממוצע תשואה 12 חודשים: <strong className="text-[#0a3d3d]">{fmt(avgReturn)}</strong></span>
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
                  <th className="text-right px-4 py-3 font-bold text-[#0a3d3d] min-w-[200px]">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                      שם מסלול
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#0a3d3d]">חברה</th>
                  <th className="text-center px-3 py-3 font-bold text-[#0a3d3d]">קטגוריה</th>
                  <th className="text-center px-3 py-3 font-bold text-[#0a3d3d]">
                    <button onClick={() => toggleSort("year1")} className="flex items-center gap-1 mx-auto">
                      12 חודשים
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#0a3d3d] hidden sm:table-cell">
                    <button onClick={() => toggleSort("year3")} className="flex items-center gap-1 mx-auto">
                      3 שנים
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#0a3d3d] hidden md:table-cell">
                    <button onClick={() => toggleSort("year5")} className="flex items-center gap-1 mx-auto">
                      5 שנים
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-3 font-bold text-[#0a3d3d] hidden lg:table-cell">
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
                  const returnColor = (v: number) => v > avgReturn ? "text-[#90be6d]" : v < 0 ? "text-[#e76f51]" : "text-[#0a3d3d]";
                  return (
                    <>
                      <tr
                        key={fund.id}
                        onClick={() => setExpandedId(isExpanded ? null : fund.id)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-[#f8f9fc]" : "hover:bg-[#fafbfd]"} ${i === 0 && sortKey === "year1" ? "bg-[#90be6d]/5" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#0a3d3d] text-sm">{fund.name}</div>
                          <div className="text-xs text-gray-400">קופה {fund.fundNumber}</div>
                        </td>
                        <td className="text-center px-3 py-3 text-xs text-gray-600">{companyLabels[fund.company]}</td>
                        <td className="text-center px-3 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8f9fc] border border-gray-100 text-[#0a3d3d]">
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
                                <p className="text-lg font-bold text-[#0a3d3d]">{fmt(fund.returns.month)}</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">חשיפת מניות</p>
                                <p className="text-lg font-bold text-[#0a3d3d]">{fund.stockExposure}%</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">דמ"נ מהפקדה</p>
                                <p className="text-lg font-bold text-[#0a3d3d]">{fund.fees.depositFeePercent}%</p>
                              </div>
                              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                <p className="text-xs text-gray-400 mb-1">היקף נכסים</p>
                                <p className="text-lg font-bold text-[#0a3d3d]">{fmtAssets(fund.totalAssets)}</p>
                              </div>
                              {fund.deepDrill.sharpeRatio && (
                                <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                  <p className="text-xs text-gray-400 mb-1">מדד שארפ</p>
                                  <p className="text-lg font-bold text-[#5ec6c6]">{fund.deepDrill.sharpeRatio.toFixed(2)}</p>
                                </div>
                              )}
                            </div>

                            {/* Asset allocation bar */}
                            <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100">
                              <h4 className="text-sm font-bold text-[#0a3d3d] mb-3">הרכב נכסים</h4>
                              <div className="flex h-6 rounded-full overflow-hidden">
                                {fund.deepDrill.stocksAndOptions > 0 && (
                                  <div style={{ width: `${fund.deepDrill.stocksAndOptions}%`, background: "#5ec6c6" }} title={`מניות ${fund.deepDrill.stocksAndOptions}%`} />
                                )}
                                {fund.deepDrill.govBondsTradable > 0 && (
                                  <div style={{ width: `${fund.deepDrill.govBondsTradable}%`, background: "#90be6d" }} title={`אג"ח ממשלתי ${fund.deepDrill.govBondsTradable}%`} />
                                )}
                                {fund.deepDrill.corpBondsTradable > 0 && (
                                  <div style={{ width: `${fund.deepDrill.corpBondsTradable}%`, background: "#f4a261" }} title={`אג"ח קונצרני ${fund.deepDrill.corpBondsTradable}%`} />
                                )}
                                {fund.deepDrill.corpBondsNonTradable > 0 && (
                                  <div style={{ width: `${fund.deepDrill.corpBondsNonTradable}%`, background: "#e76f51" }} title={`אג"ח לא סחיר ${fund.deepDrill.corpBondsNonTradable}%`} />
                                )}
                                {fund.deepDrill.cashEquivalents > 0 && (
                                  <div style={{ width: `${fund.deepDrill.cashEquivalents}%`, background: "#94a3b8" }} title={`מזומן ${fund.deepDrill.cashEquivalents}%`} />
                                )}
                                {fund.deepDrill.otherAssets > 0 && (
                                  <div style={{ width: `${fund.deepDrill.otherAssets}%`, background: "#6c63ff" }} title={`אחר ${fund.deepDrill.otherAssets}%`} />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                {fund.deepDrill.stocksAndOptions > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#5ec6c6]" />מניות {fund.deepDrill.stocksAndOptions}%</span>}
                                {fund.deepDrill.govBondsTradable > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#90be6d]" />אג"ח ממשלתי {fund.deepDrill.govBondsTradable}%</span>}
                                {fund.deepDrill.corpBondsTradable > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#f4a261]" />אג"ח קונצרני {fund.deepDrill.corpBondsTradable}%</span>}
                                {fund.deepDrill.cashEquivalents > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#94a3b8]" />מזומן {fund.deepDrill.cashEquivalents}%</span>}
                                {fund.deepDrill.foreignExposure > 0 && <span>| חשיפה לחו"ל: {fund.deepDrill.foreignExposure}%</span>}
                              </div>
                            </div>

                            <div className="mt-3 text-center">
                              <Link to="/contact" className="text-sm text-[#5ec6c6] font-semibold hover:underline">
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">מה זה מסלול השקעה?</h2>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0a3d3d] mb-6">איך לבחור מסלול השקעה?</h2>
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
            <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-[#5ec6c6] opacity-10" />
            <div className="absolute bottom-4 left-10 w-14 h-14 rounded-full bg-[#f4a261] opacity-10" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d] mb-3 relative z-10">
              רוצים לדעת איך המסלול שלכם מתנהג?
            </h2>
            <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-xl mx-auto relative z-10">
              ניתוח תיק חינם — נבדוק מסלולים, דמי ניהול וחשיפות ונמליץ מה לשפר
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-3.5 bg-[#5ec6c6] text-white font-semibold rounded-full hover:bg-[#4db5b5] transition-colors relative z-10"
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
