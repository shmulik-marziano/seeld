import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackCard from "@/components/returns/TrackCard";
import MarketMap from "@/components/returns/MarketMap";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BrandDots, LeafCanopy } from "@/components/brand/Elements";
import {
  fmtAssets, fmtPct, periodLabel, productBySlug, PRODUCTS, trackLabel,
  useCmaBoard, useCompanyMap, type BoardFund, type BoardProduct,
} from "@/hooks/useCmaBoard";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE, PASTEL_SAND, RUST_TEXT, SAGE_ON_GREEN } from "@/lib/brand";

/**
 * לוח התשואות: an overview (market map by company) and one board per product,
 * each split into track categories with sortable tables, group averages,
 * charts and exports. All figures come from the Capital Market Authority's
 * public monthly data, refreshed automatically (sync twice a week + monthly,
 * board refresh daily).
 */

const INITIAL_TRACKS = 6;

const chip = (active: boolean) =>
  `inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold whitespace-nowrap transition-colors ${
    active ? "text-[#FAF7EF]" : "hover:bg-white"
  }`;

const ReturnTables = () => {
  const { product: slug } = useParams<{ product?: string }>();
  const product = productBySlug(slug);
  const { data: board, isLoading, isError } = useCmaBoard();
  const { data: companyMap } = useCompanyMap();

  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [view, setView] = useState<"full" | "compact">(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? "compact" : "full",
  );
  const [showAllTracks, setShowAllTracks] = useState(false);

  // A new product resets the filters and the expanded state
  useEffect(() => {
    setSearch("");
    setCompany("all");
    setShowAllTracks(false);
  }, [slug]);

  const period = useMemo(() => (board ? Math.max(...board.map((f) => f.report_period)) : null), [board]);

  const productFunds = useMemo(
    () => (board && product ? board.filter((f) => f.board_product === product.key) : []),
    [board, product],
  );

  const companies = useMemo(
    () => [...new Set(productFunds.map((f) => f.company))].sort((a, b) => a.localeCompare(b, "he")),
    [productFunds],
  );

  const filtered = useMemo(() => {
    const q = search.trim();
    return productFunds.filter(
      (f) => (company === "all" || f.company === company) && (!q || f.fund_name.includes(q) || f.company.includes(q)),
    );
  }, [productFunds, search, company]);

  // Tracks ordered by total assets, largest first (how the market reads them)
  const tracks = useMemo(() => {
    const by = new Map<string, BoardFund[]>();
    for (const f of filtered) {
      const list = by.get(f.track) ?? [];
      list.push(f);
      by.set(f.track, list);
    }
    return [...by.entries()]
      .map(([key, funds]) => ({ key, funds, assets: funds.reduce((s, f) => s + (f.total_assets ?? 0), 0) }))
      .sort((a, b) => b.assets - a.assets);
  }, [filtered]);

  const visibleTracks = showAllTracks || search || company !== "all" ? tracks : tracks.slice(0, INITIAL_TRACKS);
  const hiddenCount = tracks.length - visibleTracks.length;

  // Overview: per-product summary cards
  const productSummaries = useMemo(() => {
    if (!board) return [];
    return PRODUCTS.map((p) => {
      const funds = board.filter((f) => f.board_product === p.key);
      const general = funds.filter((f) => f.track === "general" && f.ret_12m !== null);
      const top = general.sort((a, b) => (b.ret_12m ?? -Infinity) - (a.ret_12m ?? -Infinity))[0];
      return {
        ...p,
        funds: funds.length,
        tracks: new Set(funds.map((f) => f.track)).size,
        assets: funds.reduce((s, f) => s + (f.total_assets ?? 0), 0),
        top,
      };
    }).filter((p) => p.funds > 0);
  }, [board]);

  const title = product ? `לוח התשואות: ${product.label}` : "לוח התשואות";

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* Hero */}
        <div className="dna-page">
          <div className="dna-circles" aria-hidden="true">
            <div className="dna-circ hidden md:block" style={{ width: 300, height: 300, top: -150, right: -130, backgroundColor: PASTEL_SAGE, opacity: 0.8 }} />
            <div className="dna-circ hidden md:block" style={{ width: 180, height: 180, top: 60, left: -100, backgroundColor: PASTEL_SAND, opacity: 0.7 }} />
          </div>

          <section className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-6 sm:pb-8">
            <nav className="flex items-center gap-2 text-[14px] mb-8" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              {product ? (
                <>
                  <Link to="/return-tables" className="hover:underline underline-offset-4">לוח התשואות</Link>
                  <BrandIcon name="arrow-left" size={14} />
                  <span className="font-bold" style={{ color: GREEN }} aria-current="page">{product.label}</span>
                </>
              ) : (
                <span className="font-bold" style={{ color: GREEN }} aria-current="page">לוח התשואות</span>
              )}
            </nav>

            <div className="flex items-start justify-between gap-8">
              <div className="min-w-0">
                <BrandDots className="mb-4" />
                <h1 className="dna-display leading-[1.15] mb-4 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                  {title}
                </h1>
                <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7]" style={{ color: MUTED }}>
                  {product
                    ? `כל ${product.label} בישראל לפי מסלול השקעה: תשואות, סיכון, חשיפות ודמי ניהול, מהדיווח הרשמי האחרון.`
                    : "השוואת תשואות ודמי ניהול לפי חברה, מוצר ומסלול השקעה, מנתוני רשות שוק ההון. בחרו מוצר, או התחילו ממפת השוק."}
                </p>

                <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[15px]" style={{ color: MUTED }}>
                  <div className="flex gap-2">
                    <dt>נכון ל:</dt>
                    <dd className="font-bold" style={{ color: GREEN }}>{period ? periodLabel(period) : "טוען"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>מקור:</dt>
                    <dd className="font-bold" style={{ color: GREEN }}>רשות שוק ההון, ביטוח וחיסכון (data.gov.il)</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>עדכון:</dt>
                    <dd className="font-bold" style={{ color: GREEN }}>אוטומטי, עם פרסום הדיווח החודשי</dd>
                  </div>
                  {product && (
                    <div className="flex gap-2">
                      <dt>מיון:</dt>
                      <dd className="font-bold" style={{ color: GREEN }}>תשואת 12 החודשים האחרונים</dd>
                    </div>
                  )}
                </dl>
              </div>
              <LeafCanopy className="hidden lg:block w-44 shrink-0" />
            </div>

            {/* Product navigation */}
            <nav className="mt-8 -mx-5 px-5 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto scrollbar-hide pb-1" aria-label="מוצרים">
              <Link to="/return-tables" className={chip(!product)} style={!product ? { background: GREEN } : { color: GREEN, boxShadow: `inset 0 0 0 1.5px ${LINE}` }} aria-current={!product ? "page" : undefined}>
                מפת השוק
              </Link>
              {PRODUCTS.map((p) => {
                const active = product?.key === p.key;
                return (
                  <Link key={p.key} to={`/return-tables/${p.slug}`} className={chip(active)} style={active ? { background: GREEN } : { color: GREEN, boxShadow: `inset 0 0 0 1.5px ${LINE}` }} aria-current={active ? "page" : undefined}>
                    {p.short}
                  </Link>
                );
              })}
            </nav>
          </section>
        </div>

        {/* Body */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-14">
            {isLoading && (
              <div className="dna-concept max-w-xl" role="status" aria-live="polite">
                <p className="text-[16px]" style={{ color: BODY }}>טוען את הדיווח האחרון של רשות שוק ההון.</p>
              </div>
            )}

            {isError && !board && (
              <div className="dna-concept max-w-xl" role="alert">
                <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>
                  המאגר לא זמין כרגע. נסו לרענן בעוד רגע, או חפשו קופה ספציפית בכלי איתור הקופות.
                </p>
                <Link to="/fund-finder" className="link-rule mt-4 text-[15px]">
                  לאיתור קופות
                  <BrandIcon name="arrow-left" size={16} />
                </Link>
              </div>
            )}

            {board && !product && (
              <div className="space-y-12">
                <div>
                  <BrandDots className="mb-4" />
                  <h2 className="dna-display leading-tight mb-2" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>מפת השוק לפי חברה</h2>
                  <p className="text-[16px] mb-6 max-w-2xl" style={{ color: MUTED }}>
                    סך הנכסים המנוהלים לכל חברה, לפי מוצר, וגיוסים נטו ב־12 החודשים האחרונים.
                  </p>
                  {companyMap && companyMap.length > 0 ? (
                    <MarketMap rows={companyMap} />
                  ) : (
                    <p className="text-[15px]" style={{ color: MUTED }} role="status">טוען את מפת השוק.</p>
                  )}
                </div>

                <div>
                  <BrandDots className="mb-4" />
                  <h2 className="dna-display leading-tight mb-6" style={{ fontSize: "clamp(24px, 3vw, 30px)" }}>לפי מוצר</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {productSummaries.map((p) => (
                      <Link key={p.key} to={`/return-tables/${p.slug}`} className="group dna-concept dna-hover block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-[19px]" style={{ color: GREEN }}>{p.label}</h3>
                          <BrandIcon name="arrow-left" size={18} className="mt-1 shrink-0 transition-transform group-hover:-translate-x-1" style={{ color: GREEN }} />
                        </div>
                        <p className="mt-1 text-[14px]" style={{ color: MUTED }}>
                          {p.funds} קופות · {p.tracks} מסלולים · {fmtAssets(p.assets)}
                        </p>
                        {p.top && (
                          <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: BODY }}>
                            המובילה במסלול הכללי ב־12 חודשים:{" "}
                            <span className="font-bold" style={{ color: GREEN }}>{p.top.fund_name}</span>{" "}
                            <span dir="ltr" className="tabular-nums font-bold" style={{ color: (p.top.ret_12m ?? 0) < 0 ? RUST_TEXT : GREEN }}>{fmtPct(p.top.ret_12m)}</span>
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {board && product && (
              <div>
                {/* Filters */}
                <div className="no-print flex flex-wrap items-end gap-x-5 gap-y-3 mb-6">
                  <div className="w-full sm:w-72">
                    <label htmlFor="board-search" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>חיפוש קופה</label>
                    <input
                      id="board-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="שם קופה או חברה"
                      className="field"
                    />
                  </div>
                  <div className="w-full sm:w-56">
                    <label htmlFor="board-company" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>חברה מנהלת</label>
                    <select id="board-company" value={company} onChange={(e) => setCompany(e.target.value)} className="field appearance-none cursor-pointer">
                      <option value="all">כל החברות</option>
                      {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <fieldset className="flex items-center gap-1 rounded-[10px] p-1" style={{ boxShadow: `inset 0 0 0 1.5px ${LINE}` }}>
                    <legend className="sr-only">רוחב הטבלה</legend>
                    {(["compact", "full"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        aria-pressed={view === v}
                        className={`min-h-[44px] rounded-[8px] px-3 py-1.5 text-[14px] font-bold transition-colors ${view === v ? "text-[#FAF7EF]" : ""}`}
                        style={view === v ? { background: GREEN } : { color: GREEN }}
                      >
                        {v === "compact" ? "תצוגה מצומצמת" : "כל העמודות"}
                      </button>
                    ))}
                  </fieldset>
                  <p className="text-[14px] sm:mr-auto" style={{ color: MUTED }} role="status">
                    {filtered.length} קופות ב־{tracks.length} מסלולים
                  </p>
                </div>

                {tracks.length === 0 ? (
                  <div className="dna-concept max-w-xl" role="status">
                    <p className="text-[16px]" style={{ color: BODY }}>לא נמצאו קופות שמתאימות לסינון.</p>
                    <button type="button" onClick={() => { setSearch(""); setCompany("all"); }} className="link-rule mt-3 text-[15px]">
                      ניקוי הסינון
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {visibleTracks.map((t) => (
                      <TrackCard key={`${product.key}-${t.key}-${company}-${search}`} trackKey={t.key} productLabel={product.label} funds={t.funds} view={view} />
                    ))}
                    {hiddenCount > 0 && (
                      <div className="text-center">
                        <button type="button" onClick={() => setShowAllTracks(true)} className="btn-secondary">
                          הצגת עוד {hiddenCount} מסלולים
                          <span className="text-[14px] font-normal" style={{ color: MUTED }}>
                            ({tracks.slice(INITIAL_TRACKS).map((t) => trackLabel(t.key)).join(", ")})
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-10 sm:py-14">
            <div className="dna-callout max-w-3xl text-[15px]">
              <p className="font-bold mb-1" style={{ color: GREEN }}>הבהרה חשובה</p>
              <p>
                הנתונים מבוססים על הדיווחים הציבוריים של רשות שוק ההון, ביטוח וחיסכון (גמלנט, פנסיהנט וביטוחנט)
                כפי שפורסמו באתר data.gov.il, ומיועדים להשוואה כללית בלבד. תשואות עבר אינן מעידות על תשואות עתידיות,
                והתשואות מוצגות ברוטו, לפני ניכוי דמי ניהול. תשואות 3, 6 ו־12 חודשים מחושבות מהתשואות החודשיות שפורסמו;
                תשואות 3 ו־5 שנים הן כפי שפורסמו במקור. המידע אינו ייעוץ פנסיוני או שיווק פנסיוני מותאם אישית.
              </p>
            </div>
          </div>
        </section>

        {/* Closing: deep green band, the central path */}
        <section className="dna-navy-band no-print">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3vw, 34px)" }}>
              המספרים ברורים. מה עושים איתם?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-8 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              תשואה היא רק חלק מהתמונה. דמי ניהול, רמת סיכון והתאמה אישית משנים את התוצאה.
              בדיקת תיק 360 מסדרת את הביטוחים, הפנסיה והחיסכון בתמונה אחת.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/#portfolio-review" className="btn-on-green sm:min-w-[220px]">בדיקת תיק 360</Link>
              <Link to="/contact" className="btn-on-green-outline sm:min-w-[200px]">תיאום פגישה</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export type { BoardProduct };
export default ReturnTables;
