import { Fragment, useEffect, useState, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useInvestmentTracks } from "@/hooks/useInvestmentTracks";
import { formatPeriod } from "@/hooks/useCmaFunds";
import { IS_V2 } from "@/integrations/supabase/config";

// v2 refreshes the tracks automatically from the CMA's data.gov.il feed (ADR-36); legacy came from gemelnet.
const TRACKS_SOURCE = IS_V2 ? "רשות שוק ההון, ביטוח וחיסכון (data.gov.il)" : "גמלנט, רשות שוק ההון, משרד האוצר";
import { productTypeLabels, specializationLabels, companyLabels } from "@/types/fund";
import type { Fund, ProductType, Specialization, ManagingCompany } from "@/types/fund";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdBand, SdCrumbs, SdPic, tintStyle, useSdFont } from "@/components/sd/primitives";
import { topicFor } from "@/components/sd/topics";
import "@/components/sd/sd.css";
import "@/components/sd/SavingsPageSd.css";
import {
  BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, RUST_TEXT, SAND_TEXT, TEXT_2, TINT_SAGE,
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
// Periods a new track has not lived through come as 0 in the source; that is "no data", not a 0.00% return.
const ret = (v: number | null | undefined) => (v === 0 ? null : v);
const n0 = (v: number | null | undefined) => (missing(v) ? 0 : (v as number));

const sortLabel: Record<SortKey, string> = { name: "שם", year1: "תשואת 12 חודשים", year3: "תשואת 3 שנים", year5: "תשואת 5 שנים", fees: "דמי ניהול", assets: "היקף נכסים" };
const TH: CSSProperties = { fontSize: 14 };
const PAGE = 60;
const PAGE_COMPACT = 15;

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
                רוצים בדיקה מקצועית של התיק? אפיון צרכים
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
    case "year1": return ret(f.returns.year1) ?? null;
    case "year3": return ret(f.returns.year3) ?? null;
    case "year5": return ret(f.returns.year5) ?? null;
    case "fees": return f.fees.savingsFeePercent;
    case "assets": return f.totalAssets;
    default: return null;
  }
};

// Expanded detail of a track: shared by the table row (desktop) and the card (phone).
const TrackDetail = ({ fund }: { fund: Fund }) => (
  <>
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
        איך המסלול הזה משתלב בתיק שלכם? אפיון צרכים
        <BrandIcon name="arrow-left" size={16} />
      </Link>
    </div>
  </>
);

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

  // v2: every live row carries its data.gov.il report period (source_period -> lastUpdate "YYYY-MM").
  const asOf = IS_V2 && isLive
    ? trackData.reduce((m, f) => (/^\d{4}-\d{2}$/.test(f.lastUpdate) && f.lastUpdate > m ? f.lastUpdate : m), "")
    : "";
  const dataStatus = tracksLoading
    ? "טוען נתונים עדכניים מהמאגר. בינתיים מוצגים נתונים מקומיים."
    : isLive
      ? (asOf ? `הנתונים נטענו מהמאגר העדכני, נכון ל${formatPeriod(Number(asOf.replace("-", "")))}.` : "הנתונים נטענו מהמאגר העדכני.")
      : "המאגר העדכני לא זמין כרגע. מוצגים נתונים מקומיים מהעדכון האחרון שנשמר.";

  const sortButton = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-80">
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" style={{ opacity: sortKey === key ? 1 : 0.45 }} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
  const ariaSort = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none") as "ascending" | "descending" | "none";

  const tabClass = (active: boolean) =>
    `shrink-0 min-h-[44px] pt-1 pb-4 text-[15px] sm:text-[16px] font-bold border-b-2 -mb-px transition-colors whitespace-nowrap ${active ? "text-[#203957] border-[#203957]" : "text-[#55677C] border-transparent hover:text-[#203957]"}`;

  // The table shows PAGE rows at a time (571 rows at once made the phone page
  // sixty screens long). The count resets whenever the filters change.
  const filterKey = [productFilter, specFilter, companyFilter, search, sortKey, sortDir].join("|");
  // On phone and tablet (card list) the page is smaller still: 15 cards, then "show more". Set after mount so the
  // prerendered HTML and the first client render stay identical.
  const [pageSize, setPageSize] = useState(PAGE);
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setPageSize(PAGE_COMPACT);
  }, []);
  const [visibleFor, setVisibleFor] = useState<{ key: string; n: number }>({ key: "", n: pageSize });
  const visible = visibleFor.key === filterKey ? visibleFor.n : pageSize;
  const shown = filtered.slice(0, visible);
  const showMore = () => setVisibleFor({ key: filterKey, n: visible + pageSize });

  const topic = topicFor("/investment-tracks");
  const [p1] = topic.palette;
  useSdFont();

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        {/* HERO (kit) */}
        <section className="sd-hero">
          <div className="sd-wrap sd-hero-grid">
            <div className="sd-hero-copy">
              <SdCrumbs items={[{ label: "דף הבית", to: "/" }, { label: "מסלולי השקעה" }]} />
              <span className="sd-eyebrow">השוואת מסלולים</span>
              <h1 className="sd-h1 mt-5">מסלולי השקעה</h1>
              <p className="sd-text mt-6" style={{ color: "var(--muted)" }}>
                השוואת תשואות, דמי ניהול וחשיפות של מסלולי ההשקעה בישראל:
                קרנות השתלמות, קופות גמל, קרנות פנסיה ופוליסות חיסכון.
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[15px]" style={{ color: "var(--muted)" }}>
                <div className="flex gap-2">
                  <dt>מקור הנתונים:</dt>
                  <dd className="font-bold" style={{ color: "var(--ink)" }}>{TRACKS_SOURCE}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[14px]" style={{ color: "var(--muted)" }} role="status">{dataStatus}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <a href="#checker-title" className="sd-btn">בדקו את המסלול שלכם<BrandIcon name="arrow-left" size={18} /></a>
                <a href="#all-tracks-title" className="sd-link">לכל המסלולים<BrandIcon name="arrow-left" size={18} /></a>
                <Link to="/contact" className="sd-link">רוצים עזרה בבחירה? תיאום שיחה<BrandIcon name="arrow-left" size={18} /></Link>
              </div>
            </div>
            <div className="sd-stage" aria-hidden="true">
              <SdPic name={topic.art} sizes="(min-width:1024px) 520px, 90vw" priority />
            </div>
          </div>
          <div className="sd-wrap">
            <dl className="sd-sav-stats">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dd dir="ltr" className="tabular-nums">{stat.value}</dd>
                  <dt>{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Tool body: checker + full table + educational content */}
        <SdBand tone="butter" id="checker">
          <div className="sd-wrap">
            <PersonalTrackChecker trackData={trackData} />
          </div>
        </SdBand>

        <SdBand tone="white" id="all-tracks">
          <div className="sd-wrap">
            {/* All tracks: filters + table */}
            <section aria-labelledby="all-tracks-title">
              <div className="mb-8">
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
              <div className="sd-fade-x flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide border-b mb-5" style={{ borderColor: LINE }} role="tablist" aria-label="סוג מוצר">
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
                <span>
                  ממוין לפי {sortLabel[sortKey]}. המיון אינו המלצה.
                </span>
              </div>

              {/* Table: green header, zebra rows, LTR tabular numbers */}
              {filtered.length > 0 ? (
                <>
                  <ul className="lg:hidden space-y-3" aria-label="מסלולי ההשקעה">
                    {shown.map((fund) => {
                      const isExpanded = expandedId === fund.id;
                      const detailId = `track-card-detail-${fund.id}`;
                      const figs = [
                        { l: "12 חודשים", v: ret(fund.returns.year1), strong: true },
                        { l: "3 שנים", v: ret(fund.returns.year3), strong: false },
                        { l: "5 שנים", v: ret(fund.returns.year5), strong: false },
                      ];
                      return (
                        <li key={fund.id} className="sd-trk-card">
                          <h3 className="text-[17px] leading-[1.4]" style={{ color: GREEN }}>{fund.name}</h3>
                          <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
                            {companyLabels[fund.company]} · {specializationLabels[fund.specialization]} · קופה <span dir="ltr" className="tabular-nums">{fund.fundNumber}</span>
                          </p>
                          <dl className="sd-trk-figs">
                            {figs.map((c) => (
                              <div key={c.l}>
                                <dt>{c.l}</dt>
                                <dd dir="ltr" className={`tabular-nums ${c.strong ? "text-[20px] font-bold" : "text-[16px] font-bold"}`} style={missing(c.v) ? { color: MUTED, fontWeight: 400, fontSize: 14 } : returnStyle(c.v)}>{fmt(c.v)}</dd>
                              </div>
                            ))}
                            <div>
                              <dt>דמי ניהול מצבירה</dt>
                              <dd dir="ltr" className="tabular-nums text-[16px] font-bold" style={missing(fund.fees.savingsFeePercent) ? { color: MUTED, fontWeight: 400, fontSize: 14 } : undefined}>{feeText(fund.fees.savingsFeePercent)}</dd>
                            </div>
                          </dl>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : fund.id)}
                            aria-expanded={isExpanded}
                            aria-controls={detailId}
                            className="mt-2 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-bold"
                            style={{ color: GREEN }}
                          >
                            {isExpanded ? "סגירת הפירוט" : "פירוט"}
                            <BrandIcon name="chevron-down" size={18} className="transition-transform duration-150" style={{ transform: isExpanded ? "rotate(180deg)" : undefined }} />
                          </button>
                          {isExpanded && (
                            <div id={detailId} className="mb-3 mt-1 rounded-[12px] p-4" style={{ backgroundColor: TINT_SAGE }}>
                              <TrackDetail fund={fund} />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="hidden lg:block overflow-x-auto rounded-[10px]">
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
                                <td className="num font-bold" style={returnStyle(ret(fund.returns.year1))}>{fmt(ret(fund.returns.year1))}</td>
                                <td className="num" style={returnStyle(ret(fund.returns.year3))}>{fmt(ret(fund.returns.year3))}</td>
                                <td className="num" style={returnStyle(ret(fund.returns.year5))}>{fmt(ret(fund.returns.year5))}</td>
                                <td className="num" style={missing(fund.fees.savingsFeePercent) ? { color: MUTED } : undefined}>{feeText(fund.fees.savingsFeePercent)}</td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : fund.id); }}
                                    aria-expanded={isExpanded}
                                    aria-controls={detailId}
                                    className="grid h-11 w-11 place-items-center rounded-[8px] transition-colors hover:bg-[#DFE9DC]"
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
                                    <TrackDetail fund={fund} />
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length > shown.length && (
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <button type="button" onClick={showMore} className="btn-secondary">
                        הצגת עוד {Math.min(pageSize, filtered.length - shown.length)} מסלולים
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
          </div>
        </SdBand>

        <SdBand tone="sage" id="learn">
          <div className="sd-wrap">
            {/* Educational content */}
            <section className="grid md:grid-cols-2 gap-x-16 gap-y-12">
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
        </SdBand>

        {/* Disclaimer */}
        <SdBand tone="cream" id="disclaimer" className="!py-10 sm:!py-14">
          <div className="sd-wrap">
            <div className="dna-callout max-w-3xl text-[15px]">
              <p className="font-bold mb-1" style={{ color: GREEN }}>הבהרה חשובה</p>
              <p>
                הנתונים המוצגים הם למטרות מידע בלבד ואינם מהווים המלצה לרכישה, מכירה או פדיון של מוצר פיננסי.
                תשואות עבר אינן מבטיחות תשואות עתידיות. המקור: {TRACKS_SOURCE}.
                לקבלת החלטות השקעה יש לפנות לסוכן מורשה.
              </p>
            </div>
          </div>
        </SdBand>

        {/* Closing: navy block, the central path */}
        <section className="sd-contact">
          <div className="sd-wrap sd-sav-close">
            <div>
              <h2 className="sd-h2">רוצים לדעת איך המסלול שלכם מתנהג?</h2>
              <p className="sd-text mt-4">
                באפיון צרכים נבדוק מסלולים, דמי ניהול וחשיפות מול התיק הקיים שלכם, ונמליץ מה לשפר.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link to="/#portfolio-review" className="sd-btn sd-btn-light">אפיון צרכים<BrandIcon name="arrow-left" size={18} /></Link>
                <Link to="/contact" className="sd-sav-close-link">תיאום פגישה<BrandIcon name="arrow-left" size={18} /></Link>
              </div>
            </div>
            <div className="sd-contact-art" aria-hidden="true"><SdPic name={topic.art2} sizes="360px" /></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InvestmentTracks;
