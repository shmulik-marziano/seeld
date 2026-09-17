import { Fragment, useState, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useInvestmentTracks } from "@/hooks/useInvestmentTracks";
import { productTypeLabels, specializationLabels, companyLabels } from "@/types/fund";
import type { Fund, ProductType, Specialization, ManagingCompany } from "@/types/fund";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BalancedStones } from "@/components/brand/Elements";
import {
  BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, RUST_TEXT, SAGE_ON_GREEN, SAND_TEXT, TEXT_2, TINT_SAGE,
} from "@/lib/brand";

// Investment tracks (SEELD brand system 2026-09): a tool page. The checker
// and the table stay central; figures are static Rubik tabular numbers; the
// asset mix is a single-hue bar list with a labelled row per asset class.

// ── Helpers ──
const NONE = "אין נתון";
const missing = (v: number | null | undefined) => v === null || v === undefined || Number.isNaN(v);
const fmt = (n: number | null | undefined) => (missing(n) ? NONE : `${(n as number).toFixed(2)}%`);
// An unpublished fee is not a zero fee (see ManagementFees in types/fund.ts).
const feeText = (v: number | null | undefined) => (missing(v) ? "לא פורסם" : `${v}%`);
const fmtAssets = (m: number | null | undefined) =>
  missing(m) ? NONE : (m as number) >= 1000 ? `${((m as number) / 1000).toFixed(1)} מיליארד` : `${(m as number).toLocaleString("he-IL")} מיליון`;
const n0 = (v: number | null | undefined) => (missing(v) ? 0 : (v as number));

const TH: CSSProperties = { fontSize: 14 };
const PAGE = 60;

type SortKey = "name" | "year1" | "year3" | "year5" | "fees" | "assets";
type SortDir = "asc" | "desc";

// Asset allocation rows. The checker folds mutual funds into "אחר"; the
// expanded table row lists them separately (both as before).
const allocationRows = (dd: Fund["deepDrill"], splitMutual: boolean) => {
  const rows = [
    { name: "מניות", value: n0(dd.stocksAndOptions) },
    { name: 'אג״ח ממשלתי', value: n0(dd.govBondsTradable) + n0(dd.designatedBonds) },
    { name: 'אג״ח קונצרני', value: n0(dd.corpBondsTradable) + n0(dd.corpBondsNonTradable) },
    { name: "מזומן", value: n0(dd.cashEquivalents) + n0(dd.deposits) },
    ...(splitMutual
      ? [{ name: "קרנות נאמנות", value: n0(dd.mutualFunds) }, { name: "אחר", value: n0(dd.otherAssets) }]
      : [{ name: "אחר", value: n0(dd.mutualFunds) + n0(dd.otherAssets) }]),
  ];
  return rows.filter((d) => d.value > 0);
};

const AllocationBars = ({ rows }: { rows: { name: string; value: number }[] }) => {
  if (rows.length === 0) {
    return <p className="text-[15px]" style={{ color: MUTED }}>הרכב הנכסים לא פורסם.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex items-baseline justify-between gap-4 text-[15px]">
            <span style={{ color: BODY }}>{r.name}</span>
            <span dir="ltr" className="tabular-nums font-bold whitespace-nowrap" style={{ color: GREEN }}>
              {r.value.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-[4px]" style={{ backgroundColor: TINT_SAGE }}>
            <div className="h-full rounded-[4px]" style={{ width: `${Math.min(100, r.value)}%`, backgroundColor: GREEN }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
    {children}
  </label>
);

const SelectField = ({ id, value, onChange, disabled, children }: {
  id: string; value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode;
}) => (
  <div className="relative">
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="field appearance-none cursor-pointer pe-11 disabled:cursor-not-allowed"
    >
      {children}
    </select>
    <BrandIcon name="chevron-down" size={18} className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-4" style={{ color: MUTED }} />
  </div>
);

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

  const getRiskLevel = (fund: Fund) => {
    const stock = fund.stockExposure;
    if (missing(stock)) return { level: NONE, color: MUTED, tip: "נתוני החשיפה למניות של המסלול לא פורסמו, ולכן אי אפשר לקבוע את רמת הסיכון מהנתונים שכאן." };
    if (stock >= 80) return { level: "גבוהה", color: RUST_TEXT, tip: "המסלול מתאים למשקיעים אגרסיביים עם אופק של 10+ שנים. כדאי לוודא שרמת הסיכון מתאימה לגיל ולתוכניות שלכם." };
    if (stock >= 40) return { level: "בינונית", color: SAND_TEXT, tip: "מסלול מאוזן שמתאים לרוב האנשים. פיזור טוב בין מניות לאג״ח. מומלץ לבדוק את דמי הניהול מול חברות מתחרות." };
    if (stock >= 10) return { level: "נמוכה-בינונית", color: TEXT_2, tip: "מסלול סולידי יחסית. מתאים למי שקרוב לפרישה או רוצה יציבות. כדאי לבדוק שהתשואה מספיקה לצרכים שלכם." };
    return { level: "נמוכה", color: GREEN, tip: "מסלול שמרני מאוד. מתאים לטווח קצר או לפרישה קרובה. שווה לבדוק אם יש מסלולים עם תשואה טובה יותר באותה רמת סיכון." };
  };

  return (
    <section aria-labelledby="checker-title">
      <div className="mb-8">
        <h2 id="checker-title" className="dna-display leading-tight" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
          בדקו את המסלול שלכם
        </h2>
        <p className="mt-3 text-[16px] leading-[1.7] max-w-xl" style={{ color: MUTED }}>
          בחרו חברה, סוג מוצר ומסלול, ותראו לאן הכסף שלכם הולך: פיזור נכסים, חשיפות ורמת סיכון.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5 mb-8 max-w-4xl">
        <div>
          <Label htmlFor="track-company">חברה</Label>
          <SelectField
            id="track-company"
            value={selectedCompany}
            onChange={(v) => { setSelectedCompany(v as ManagingCompany); setSelectedProduct(""); setSelectedFundId(""); }}
          >
            <option value="">בחרו חברה</option>
            {[...new Set(trackData.map(f => f.company))].map(c => (
              <option key={c} value={c}>{companyLabels[c]}</option>
            ))}
          </SelectField>
        </div>
        <div>
          <Label htmlFor="track-product">סוג מוצר</Label>
          <SelectField
            id="track-product"
            value={selectedProduct}
            onChange={(v) => { setSelectedProduct(v as ProductType); setSelectedFundId(""); }}
            disabled={!selectedCompany}
          >
            <option value="">בחרו מוצר</option>
            {availableProducts.map(p => (
              <option key={p} value={p}>{productTypeLabels[p]}</option>
            ))}
          </SelectField>
        </div>
        <div>
          <Label htmlFor="track-fund">מסלול</Label>
          <SelectField
            id="track-fund"
            value={selectedFundId}
            onChange={setSelectedFundId}
            disabled={!selectedProduct}
          >
            <option value="">בחרו מסלול</option>
            {availableFunds.map(f => (
              <option key={f.id} value={f.id}>{specializationLabels[f.specialization]} · {f.name}</option>
            ))}
          </SelectField>
        </div>
      </div>

      {selectedFund ? (() => {
        const rows = allocationRows(selectedFund.deepDrill, false);
        const risk = getRiskLevel(selectedFund);
        return (
          <div className="dna-concept !p-6 sm:!p-8" role="status">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 border-b pb-5 mb-6" style={{ borderColor: LINE }}>
              <div className="min-w-0">
                <h3 className="text-[20px] leading-snug" style={{ color: GREEN }}>{selectedFund.name}</h3>
                <p className="text-[15px] mt-1" style={{ color: MUTED }}>
                  קופה <span dir="ltr" className="tabular-nums whitespace-nowrap">{selectedFund.fundNumber}</span>
                  {" · "}
                  {companyLabels[selectedFund.company]}
                </p>
              </div>
              <dl className="flex gap-10 shrink-0">
                <div>
                  <dt className="text-[14px] mb-1" style={{ color: MUTED }}>תשואה 12 חודשים</dt>
                  <dd className="tabular-nums text-[26px] font-bold leading-tight" dir="ltr" style={{ color: selectedFund.returns.year1 < 0 ? RUST_TEXT : GREEN }}>
                    {fmt(selectedFund.returns.year1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[14px] mb-1" style={{ color: MUTED }}>רמת סיכון</dt>
                  <dd className="text-[22px] font-bold leading-tight" style={{ color: risk.color }}>{risk.level}</dd>
                </div>
              </dl>
            </div>

            <div className="grid md:grid-cols-[1.2fr_1fr] gap-8">
              <div>
                <h4 className="text-[16px] mb-3" style={{ color: GREEN }}>הרכב נכסים</h4>
                <AllocationBars rows={rows} />
              </div>
              <dl className="space-y-2 text-[15px] md:border-s md:ps-8" style={{ borderColor: LINE }}>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: MUTED }}>חשיפה למניות</dt>
                  <dd dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>
                    {missing(selectedFund.stockExposure) ? NONE : `${selectedFund.stockExposure}%`}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: MUTED }}>חשיפה לחו״ל</dt>
                  <dd dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>
                    {missing(selectedFund.deepDrill.foreignExposure) ? NONE : `${selectedFund.deepDrill.foreignExposure}%`}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: MUTED }}>דמי ניהול מצבירה</dt>
                  <dd dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>{feeText(selectedFund.fees.savingsFeePercent)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt style={{ color: MUTED }}>היקף נכסים</dt>
                  <dd className="tabular-nums font-bold" style={{ color: GREEN }}>{fmtAssets(selectedFund.totalAssets)}</dd>
                </div>
              </dl>
            </div>

            <div className="dna-callout mt-7 text-[15px]">
              <p className="font-bold mb-1" style={{ color: GREEN }}>מה זה אומר</p>
              <p>{risk.tip}</p>
            </div>
            <div className="mt-5">
              <Link to="/#portfolio-review" className="link-rule text-[15px]">
                רוצים בדיקה מקצועית של התיק? בדיקת תיק 360
                <BrandIcon name="arrow-left" size={16} />
              </Link>
            </div>
          </div>
        );
      })() : (
        <div className="dna-callout max-w-2xl text-[15px]">
          בחרו חברה, מוצר ומסלול כדי לראות את פיזור הנכסים ורמת הסיכון של הכסף שלכם.
        </div>
      )}
    </section>
  );
}

const sortValue = (f: Fund, key: SortKey): number | null => {
  switch (key) {
    case "year1": return f.returns.year1;
    case "year3": return f.returns.year3;
    case "year5": return f.returns.year5;
    case "fees": return f.fees.savingsFeePercent;
    case "assets": return f.totalAssets;
    default: return null;
  }
};

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

  // Filter + sort (a missing value always sorts last)
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
      if (sortKey === "name") {
        return sortDir === "asc" ? a.name.localeCompare(b.name, "he") : b.name.localeCompare(a.name, "he");
      }
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (missing(va) && missing(vb)) return 0;
      if (missing(va)) return 1;
      if (missing(vb)) return -1;
      return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [trackData, productFilter, specFilter, companyFilter, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Stats
  const avgReturn = filtered.length > 0 ? filtered.reduce((s, f) => s + f.returns.year1, 0) / filtered.length : null;
  const bestFund = filtered.length > 0 ? filtered.reduce((b, f) => f.returns.year1 > b.returns.year1 ? f : b) : null;
  const uniqueCompanies = new Set(filtered.map(f => f.company)).size;

  // Active product types for tabs
  const productTypes = [...new Set(trackData.map(f => f.productType))];
  const specializations = [...new Set(filtered.map(f => f.specialization))];
  const companies = [...new Set(trackData.map(f => f.company))];

  const hasActiveFilters = productFilter !== "all" || specFilter !== "all" || companyFilter !== "all";
  const clearAll = () => { setProductFilter("all"); setSpecFilter("all"); setCompanyFilter("all"); setSearch(""); };

  const returnStyle = (v: number | null | undefined): CSSProperties =>
    missing(v) ? { color: MUTED } : (v as number) < 0 ? { color: RUST_TEXT } : {};

  const heroStats = [
    { value: new Set(trackData.map(f => f.company)).size, label: "חברות מנהלות" },
    { value: trackData.length, label: "מסלולים במאגר" },
    { value: productTypes.length, label: "סוגי מוצרים" },
  ];

  const dataStatus = tracksLoading
    ? "טוען נתונים עדכניים מהמאגר. בינתיים מוצגים נתונים מקומיים."
    : isLive
      ? "הנתונים נטענו מהמאגר העדכני."
      : "המאגר העדכני לא זמין כרגע. מוצגים נתונים מקומיים מהעדכון האחרון שנשמר.";

  const sortButton = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-80">
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" style={{ opacity: sortKey === key ? 1 : 0.45 }} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
  const ariaSort = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none") as "ascending" | "descending" | "none";

  const tabClass = (active: boolean) =>
    `shrink-0 min-h-[44px] pt-1 pb-4 text-[15px] sm:text-[16px] font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${active ? "text-[#003D30] border-[#003D30]" : "text-[#476356] border-transparent hover:text-[#003D30]"}`;

  // The table shows PAGE rows at a time (571 rows at once made the phone page
  // sixty screens long). The count resets whenever the filters change.
  const filterKey = [productFilter, specFilter, companyFilter, search, sortKey, sortDir].join("|");
  const [visibleFor, setVisibleFor] = useState<{ key: string; n: number }>({ key: "", n: PAGE });
  const visible = visibleFor.key === filterKey ? visibleFor.n : PAGE;
  const shown = filtered.slice(0, visible);
  const showMore = () => setVisibleFor({ key: filterKey, n: visible + PAGE });

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* Hero: ivory, two pastel bubbles in the margins only */}
        <div className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -150, left: -130, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
            <div
              className="dna-circ hidden md:block"
              style={{ width: 180, height: 180, top: 40, right: -100, backgroundColor: PASTEL_SAND, opacity: 0.7 }}
            />
          </div>

          <section className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-8 sm:pb-10">
            <nav className="flex items-center gap-2 text-[14px] mb-8" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">מסלולי השקעה</span>
            </nav>

            <div className="flex items-start justify-between gap-8">
              <div>
                <h1 className="dna-display leading-[1.15] mb-4 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                  מסלולי השקעה
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  השוואת תשואות, דמי ניהול וחשיפות של מסלולי ההשקעה בישראל:
                  קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון.
                </p>
                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px]" style={{ color: MUTED }}>
                  <div className="flex gap-2">
                    <dt>מקור הנתונים:</dt>
                    <dd className="font-bold" style={{ color: GREEN }}>גמלנט, רשות שוק ההון, משרד האוצר</dd>
                  </div>
                </dl>
                <p className="mt-2 text-[14px]" style={{ color: MUTED }} role="status">{dataStatus}</p>
              </div>
              <BalancedStones className="hidden lg:block w-40 shrink-0" />
            </div>

            {/* Stat band: green figures over hairlines */}
            <dl className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-y-8 border-t border-b py-8 sm:py-10" style={{ borderColor: LINE }}>
              {heroStats.map((stat) => (
                <div key={stat.label} className="text-center px-4">
                  <dd
                    className="tabular-nums mb-1.5"
                    dir="ltr"
                    style={{ fontWeight: 700, color: GREEN, fontSize: "clamp(1.9rem, 3.5vw, 2.8rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
                  >
                    {stat.value}
                  </dd>
                  <dt className="text-[15px]" style={{ color: MUTED }}>{stat.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Tool body: checker + full table + educational content */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20">
            <PersonalTrackChecker trackData={trackData} />

            {/* All tracks: filters + table */}
            <section aria-labelledby="all-tracks-title">
              <div className="mb-8 border-t pt-10" style={{ borderColor: LINE }}>
                <h2 id="all-tracks-title" className="dna-display leading-tight" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
                  כל המסלולים
                </h2>
              </div>

              {/* Search + filter toggle */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-6 max-w-3xl">
                <div className="relative flex-1">
                  <Label htmlFor="tracks-search">חיפוש</Label>
                  <div className="relative">
                    <input
                      id="tracks-search"
                      type="search"
                      placeholder="שם מסלול, חברה או מספר קופה"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="field pe-12"
                      autoComplete="off"
                    />
                    <BrandIcon name="search" size={20} className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-4" style={{ color: MUTED }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  aria-controls="tracks-filters"
                  className="inline-flex items-center gap-2 text-[15px] font-bold min-h-[48px] shrink-0"
                  style={{ color: showFilters || hasActiveFilters ? GREEN : MUTED }}
                >
                  <BrandIcon name="settings" size={18} />
                  סינון מתקדם
                  {hasActiveFilters && (
                    <span className="tabular-nums rounded-[6px] px-1.5 py-0.5 text-[14px]" dir="ltr" style={{ backgroundColor: GREEN, color: IVORY }}>
                      {[productFilter, specFilter, companyFilter].filter(v => v !== "all").length}
                    </span>
                  )}
                </button>
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div id="tracks-filters" className="dna-concept mb-8 max-w-3xl">
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <Label htmlFor="filter-spec">קטגוריה</Label>
                      <SelectField id="filter-spec" value={specFilter} onChange={(v) => setSpecFilter(v as Specialization | "all")}>
                        <option value="all">כל הקטגוריות</option>
                        {specializations.map(s => (
                          <option key={s} value={s}>{specializationLabels[s]}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div>
                      <Label htmlFor="filter-company">חברה</Label>
                      <SelectField id="filter-company" value={companyFilter} onChange={(v) => setCompanyFilter(v as ManagingCompany | "all")}>
                        <option value="all">כל החברות</option>
                        {companies.map(c => (
                          <option key={c} value={c}>{companyLabels[c]}</option>
                        ))}
                      </SelectField>
                    </div>
                  </div>
                  <button type="button" onClick={clearAll} className="link-rule mt-5 text-[15px]">
                    ניקוי כל הסינונים
                  </button>
                </div>
              )}

              {/* Product type: underline tabs */}
              <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide border-b mb-5" style={{ borderColor: LINE }} role="tablist" aria-label="סוג מוצר">
                <button
                  type="button"
                  role="tab"
                  aria-selected={productFilter === "all"}
                  onClick={() => { setProductFilter("all"); setSpecFilter("all"); }}
                  className={tabClass(productFilter === "all")}
                >
                  הכל{" "}
                  <span className="text-[14px] tabular-nums font-normal" dir="ltr">({trackData.length})</span>
                </button>
                {productTypes.map(pt => (
                  <button
                    key={pt}
                    type="button"
                    role="tab"
                    aria-selected={productFilter === pt}
                    onClick={() => { setProductFilter(pt); setSpecFilter("all"); }}
                    className={tabClass(productFilter === pt)}
                  >
                    {productTypeLabels[pt]}{" "}
                    <span className="text-[14px] tabular-nums font-normal" dir="ltr">
                      ({trackData.filter(f => f.productType === pt).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Results summary */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4 text-[15px]" style={{ color: MUTED }} role="status">
                <span>
                  <span className="tabular-nums font-bold" dir="ltr" style={{ color: GREEN }}>{filtered.length}</span> מסלולים
                  {" · "}
                  <span className="tabular-nums font-bold" dir="ltr" style={{ color: GREEN }}>{uniqueCompanies}</span> חברות
                  {avgReturn !== null && (
                    <>
                      {" · "}
                      ממוצע 12 חודשים:{" "}
                      <span className="tabular-nums font-bold" dir="ltr" style={{ color: GREEN }}>{fmt(avgReturn)}</span>
                    </>
                  )}
                </span>
                {bestFund && (
                  <span className="hidden sm:inline truncate">
                    מוביל: {bestFund.name}{" "}
                    <span className="tabular-nums font-bold" dir="ltr" style={{ color: GREEN }}>({fmt(bestFund.returns.year1)})</span>
                  </span>
                )}
              </div>

              {/* Table: green header, zebra rows, LTR tabular numbers */}
              {filtered.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-[10px]">
                    <table className="dna-data min-w-[900px]" style={{ fontSize: 15 }}>
                      <caption className="sr-only">כל מסלולי ההשקעה לפי הסינון הנוכחי</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="min-w-[220px]" style={TH} aria-sort={ariaSort("name")}>{sortButton("name", "שם מסלול")}</th>
                          <th scope="col" style={TH}>חברה</th>
                          <th scope="col" style={TH}>קטגוריה</th>
                          <th scope="col" style={TH} aria-sort={ariaSort("year1")}>{sortButton("year1", "12 חודשים")}</th>
                          <th scope="col" style={TH} aria-sort={ariaSort("year3")}>{sortButton("year3", "3 שנים")}</th>
                          <th scope="col" style={TH} aria-sort={ariaSort("year5")}>{sortButton("year5", "5 שנים")}</th>
                          <th scope="col" style={TH} aria-sort={ariaSort("fees")}>{sortButton("fees", "דמי ניהול מצבירה")}</th>
                          <th scope="col" className="w-14" style={TH}><span className="sr-only">פירוט</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((fund) => {
                          const isExpanded = expandedId === fund.id;
                          const detailId = `track-detail-${fund.id}`;
                          return (
                            <Fragment key={fund.id}>
                              <tr
                                onClick={() => setExpandedId(isExpanded ? null : fund.id)}
                                className="cursor-pointer"
                                style={isExpanded ? { backgroundColor: PASTEL_SAGE } : undefined}
                              >
                                <td>
                                  <div>{fund.name}</div>
                                  <div className="text-[14px] font-normal" style={{ color: MUTED }}>
                                    קופה <span dir="ltr" className="tabular-nums">{fund.fundNumber}</span>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap">{companyLabels[fund.company]}</td>
                                <td className="whitespace-nowrap">{specializationLabels[fund.specialization]}</td>
                                <td className="num font-bold" style={returnStyle(fund.returns.year1)}>{fmt(fund.returns.year1)}</td>
                                <td className="num" style={returnStyle(fund.returns.year3)}>{fmt(fund.returns.year3)}</td>
                                <td className="num" style={returnStyle(fund.returns.year5)}>{fmt(fund.returns.year5)}</td>
                                <td className="num" style={missing(fund.fees.savingsFeePercent) ? { color: MUTED } : undefined}>{feeText(fund.fees.savingsFeePercent)}</td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : fund.id); }}
                                    aria-expanded={isExpanded}
                                    aria-controls={detailId}
                                    className="grid h-11 w-11 place-items-center rounded-[8px] transition-colors hover:bg-[#E8EDE5]"
                                    style={{ color: GREEN }}
                                  >
                                    <BrandIcon
                                      name="chevron-down"
                                      size={18}
                                      label={isExpanded ? `סגירת הפירוט של ${fund.name}` : `פירוט של ${fund.name}`}
                                      className="transition-transform duration-150"
                                      style={{ transform: isExpanded ? "rotate(180deg)" : undefined }}
                                    />
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr id={detailId}>
                                  <td colSpan={8} className="!px-5 !py-6" style={{ backgroundColor: TINT_SAGE }}>
                                    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-5">
                                      {[
                                        { label: "תשואת חודש", value: fmt(fund.returns.month), ltr: true },
                                        { label: "חשיפת מניות", value: missing(fund.stockExposure) ? NONE : `${fund.stockExposure}%`, ltr: true },
                                        { label: "דמי ניהול מהפקדה", value: feeText(fund.fees.depositFeePercent), ltr: true },
                                        { label: "היקף נכסים", value: fmtAssets(fund.totalAssets), ltr: false },
                                        { label: "מדד שארפ", value: missing(fund.deepDrill.sharpeRatio) ? NONE : (fund.deepDrill.sharpeRatio as number).toFixed(2), ltr: true },
                                      ].map((cell) => (
                                        <div key={cell.label} className="border-t pt-2.5" style={{ borderColor: LINE }}>
                                          <dt className="text-[14px] mb-1 font-normal" style={{ color: MUTED }}>{cell.label}</dt>
                                          <dd
                                            className="text-[18px] font-bold tabular-nums"
                                            dir={cell.ltr ? "ltr" : undefined}
                                            style={{ color: cell.value === NONE || cell.value === "לא פורסם" ? MUTED : GREEN, textAlign: cell.ltr ? "right" : undefined }}
                                          >
                                            {cell.value}
                                          </dd>
                                        </div>
                                      ))}
                                    </dl>

                                    {/* Asset allocation: one hue, a labelled row per asset class */}
                                    <div className="dna-concept mt-6 !p-5 sm:!p-6">
                                      <h4 className="text-[16px] mb-4" style={{ color: GREEN }}>הרכב נכסים וחשיפות</h4>
                                      <div className="grid md:grid-cols-[1.2fr_1fr] gap-8">
                                        <AllocationBars rows={allocationRows(fund.deepDrill, true)} />
                                        <dl className="space-y-2 text-[15px] md:border-s md:ps-8" style={{ borderColor: LINE }}>
                                          <div className="flex justify-between gap-4">
                                            <dt style={{ color: MUTED }}>חשיפה לחו״ל</dt>
                                            <dd dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>
                                              {missing(fund.deepDrill.foreignExposure) ? NONE : `${fund.deepDrill.foreignExposure}%`}
                                            </dd>
                                          </div>
                                          <div className="flex justify-between gap-4">
                                            <dt style={{ color: MUTED }}>חשיפת מט״ח</dt>
                                            <dd dir="ltr" className="tabular-nums font-bold" style={{ color: GREEN }}>
                                              {missing(fund.deepDrill.currencyExposure) ? NONE : `${fund.deepDrill.currencyExposure}%`}
                                            </dd>
                                          </div>
                                        </dl>
                                      </div>
                                    </div>

                                    <div className="mt-5">
                                      <Link to="/#portfolio-review" className="link-rule text-[15px]">
                                        איך המסלול הזה משתלב בתיק שלכם? בדיקת תיק 360
                                        <BrandIcon name="arrow-left" size={16} />
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
                  </div>
                  <p className="mt-2 text-[14px] lg:hidden" style={{ color: MUTED }}>
                    אפשר לגלול את הטבלה לצדדים כדי לראות את כל העמודות.
                  </p>
                  {filtered.length > shown.length && (
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <button type="button" onClick={showMore} className="btn-secondary">
                        הצגת עוד {Math.min(PAGE, filtered.length - shown.length)} מסלולים
                      </button>
                      <span className="text-[15px] tabular-nums" style={{ color: MUTED }}>
                        מוצגים {shown.length} מתוך {filtered.length}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="dna-concept max-w-xl" role="status">
                  {tracksLoading ? (
                    <p className="text-[16px]" style={{ color: BODY }}>טוען את נתוני המסלולים...</p>
                  ) : (
                    <>
                      <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>
                        לא נמצאו מסלולים שמתאימים לסינון הנוכחי. נסו לנקות חלק מהסינונים או לחפש בשם אחר.
                      </p>
                      <button type="button" onClick={clearAll} className="btn-secondary mt-5">
                        ניקוי כל הסינונים
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* Educational content */}
            <section className="grid md:grid-cols-2 gap-x-16 gap-y-12 border-t pt-12" style={{ borderColor: LINE }}>
              <div>
                <h2 className="dna-display leading-tight mb-5" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
                  מה זה מסלול השקעה?
                </h2>
                <div className="space-y-4 leading-[1.7] text-[16px]" style={{ color: BODY }}>
                  <p>
                    מסלול השקעה קובע איך הכסף שלכם מושקע: כמה הולך למניות, כמה לאגרות חוב, וכמה למזומן. כל קרן פנסיה, קרן השתלמות וקופת גמל מציעה מגוון מסלולים שנבדלים ברמת הסיכון ובפוטנציאל התשואה.
                  </p>
                  <p>
                    מסלול כללי מפזר את הכסף בין מניות, אגרות חוב ונכסים נוספים, ומתאים לרוב האנשים. מסלול מניות חושף יותר כסף לשוק המניות: פוטנציאל תשואה גבוה אבל גם סיכון גבוה. מסלול אגרות חוב שמרני יותר ומתאים למי שקרוב לפרישה.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="dna-display leading-tight mb-5" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>
                  איך לבחור מסלול השקעה?
                </h2>
                <div className="space-y-4 leading-[1.7] text-[16px]" style={{ color: BODY }}>
                  <p>
                    הבחירה תלויה בשלושה דברים: גיל, אופק זמן, ורמת סיבולת לסיכון. ככלל אצבע, ככל שאתם צעירים יותר, כדאי לבחור מסלול אגרסיבי יותר כי יש לכם זמן להתאושש מירידות. ככל שמתקרבים לפרישה, עדיף מסלול שמרני יותר.
                  </p>
                  <p>
                    חשוב גם להסתכל על דמי הניהול, שאוכלים חלק מהתשואה. ותמיד כדאי להשוות בין חברות, כי אותו סוג מסלול יכול לתת תוצאות שונות מחברה לחברה.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="dna-callout max-w-3xl text-[15px]">
              <p className="font-bold mb-1" style={{ color: GREEN }}>הבהרה חשובה</p>
              <p>
                הנתונים המוצגים הם למטרות מידע בלבד ואינם מהווים המלצה לרכישה, מכירה או פדיון של מוצר פיננסי.
                תשואות עבר אינן מבטיחות תשואות עתידיות. המקור: גמלנט, רשות שוק ההון, משרד האוצר.
                לקבלת החלטות השקעה יש לפנות לסוכן מורשה.
              </p>
            </div>
          </div>
        </section>

        {/* Closing: deep green band, the central path */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3vw, 34px)" }}>
              רוצים לדעת איך המסלול שלכם מתנהג?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              בבדיקת תיק 360 נבדוק מסלולים, דמי ניהול וחשיפות מול התיק הקיים שלכם, ונמליץ מה לשפר.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">
                בדיקת תיק 360
              </Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">
                תיאום פגישה
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InvestmentTracks;
