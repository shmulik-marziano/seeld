import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import { productTypeLabels, type ProductType } from "@/types/fund";
import { LeafCanopy } from "@/components/brand/Elements";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { CircleArt } from "@/components/brand/CircleArt";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_MINT, PASTEL_SAGE, PASTEL_SAND, RUST_TEXT, SAGE_ON_GREEN, SAND_TEXT } from "@/lib/brand";

/*
  מידע ולמידה — the knowledge hub. Three layers, deliberately:
  1. Live market figures, computed from the same authority data the comparison
     tool uses, so nothing here is hand-maintained and nothing goes stale.
  2. A plain-language glossary of the terms people meet in their statements.
  3. The latest guides from the blog.
  Brand system 2026-09 (STYLESEED.md): ivory canvas, one vector element in the
  opening margin, white bands, deep green closing band.
*/

const CATEGORIES: ProductType[] = ["hishtalmut", "gemel", "pensia", "gemel_invest"];

interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  published_at: string | null;
}

/** The median is a fairer "what a saver actually got" than the average, which a
 *  handful of niche tracks can drag around. */
function median(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

const GLOSSARY: { term: string; body: string }[] = [
  {
    term: "דמי ניהול מצבירה",
    body: "אחוז שנגבה בכל שנה מכל הכסף שצברתם, לא רק מההפקדות החדשות. זה הרכיב שמצטבר לסכום הגדול ביותר לאורך שנים, ולכן הפער בין 0.5% ל-0.8% משמעותי הרבה יותר משהוא נשמע.",
  },
  {
    term: "דמי ניהול מהפקדה",
    body: "אחוז שנגבה מכל סכום שנכנס לחיסכון. רלוונטי בעיקר בקרנות פנסיה, שבהן נגבים שני סוגי דמי הניהול במקביל.",
  },
  {
    term: "תשואה מתחילת השנה",
    body: "השינוי בערך החיסכון מהראשון בינואר ועד סוף חודש הדיווח האחרון. זו לא תשואה שנתית, ואי אפשר להשוות אותה ישירות לממוצע רב-שנתי.",
  },
  {
    term: "תשואה ממוצעת ל-3 או 5 שנים",
    body: "ממוצע שנתי על פני התקופה. זה המדד השימושי להשוואה בין קופות, כי הוא מחליק שנה טובה או רעה אחת. קופה חדשה פשוט לא תציג נתון כזה, ואין בכך פגם.",
  },
  {
    term: "מסלול השקעה",
    body: "התמהיל שבו מושקע הכסף: כללי, מנייתי, אגרות חוב, עוקב מדד ועוד. המסלול קובע את רמת הסיכון והתנודתיות הרבה יותר מזהות החברה המנהלת.",
  },
  {
    term: "חשיפה למניות",
    body: "איזה חלק מהתיק מושקע במניות. חשיפה גבוהה נוטה להניב יותר לאורך זמן, ובדרך גם לרדת חזק יותר בשנים שליליות. הגיל והמרחק מהפרישה הם השיקול המרכזי כאן.",
  },
  {
    term: "ניוד",
    body: "העברת החיסכון הצבור מגוף אחד לאחר בלי לשלם מס ובלי לפגוע בוותק. בקרן פנסיה חשוב לבדוק לפני הניוד מה קורה לכיסויים הביטוחיים ולרצף הזכויות.",
  },
  {
    term: "קרן השתלמות",
    body: "אפיק החיסכון היחיד בישראל שנזיל אחרי שש שנים ופטור ממס רווחי הון עד לתקרה. מי שיש לו קרן השתלמות פעילה ולא מפקיד עד התקרה מוותר על הטבה שקשה להשיג במקום אחר.",
  },
  {
    term: "קופת גמל להשקעה",
    body: "חיסכון נזיל בכל עת, עם תקרת הפקדה שנתית. אם מושכים אותו כקצבה אחרי גיל 60, רווחי ההשקעה פטורים ממס.",
  },
  {
    term: "מקדם המרה",
    body: "המספר שבו מחלקים את הצבירה בפנסיה כדי לקבל את הקצבה החודשית. ככל שהוא נמוך יותר, הקצבה גבוהה יותר. הוא מושפע מהגיל, ממין החוסך ומתנאי המסלול.",
  },
];

const TOOLS: { to: string; title: string; body: string; icon: BrandIconName }[] = [
  { to: "/calculators", title: "מחשבונים", body: "משכנתא, פנסיה, חיסכון ומס. בלי רישום ובלי עלות.", icon: "calculator" },
  { to: "/fund-finder", title: "השוואת קופות", body: "חיפוש חופשי בכל הקופות בישראל, עם תשואות ודמי ניהול.", icon: "search" },
  { to: "/investment-tracks", title: "מסלולי השקעה", body: "השוואה בין מסלולים: מנייתי, כללי, סולידי ועוקבי מדד.", icon: "route" },
  { to: "/return-tables", title: "טבלאות תשואה", body: "התשואות המלאות לפי גוף מנהל ולפי מסלול.", icon: "chart" },
  { to: "/rights-extraction", title: "מיצוי זכויות", body: "בדיקה אם נשארו לכם כספים אבודים או זכויות שלא מומשו.", icon: "folder" },
  { to: "/insurances", title: "מדריך הביטוחים", body: "מה כולל כל סוג ביטוח, ומתי הוא באמת נחוץ.", icon: "shield" },
];

const SectionHead = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-8 sm:mb-10">
    <h2 className="dna-display leading-tight" style={{ fontSize: "clamp(28px, 3.2vw, 32px)" }}>
      {title}
    </h2>
    {lede && (
      <p className="mt-4 text-[17px] leading-[1.7] max-w-2xl" style={{ color: MUTED }}>{lede}</p>
    )}
  </div>
);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
};

export default function Learn() {
  const { data: funds, isLoading: fundsLoading, isError: fundsError } = useCmaFunds();
  const { data: syncStatus } = useCmaSyncStatus();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [guideQuery, setGuideQuery] = useState("");
  const [guideCategory, setGuideCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    siteSupabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setPosts(data as PostRow[]);
        setPostsLoading(false);
      }, () => setPostsLoading(false));
  }, []);

  const period = syncStatus?.latestPeriod ? formatPeriod(syncStatus.latestPeriod) : null;

  const marketRows = CATEGORIES.map((c) => {
    const pool = (funds ?? []).filter((f) => f.productType === c);
    const ytd = median(pool.map((f) => f.returns.year1).filter((v): v is number => v !== null));
    const y3 = median(pool.map((f) => f.returns.year3).filter((v): v is number => v !== null));
    const fee = median(
      pool.map((f) => f.fees.savingsFeePercent).filter((v): v is number => v !== null && v !== undefined)
    );
    return { category: c, count: pool.length, ytd, y3, fee };
  }).filter((r) => r.count > 0);

  // A leading plus reads as "gain", so it belongs on returns only. A fee of
  // "+0.54%" would be nonsense.
  const ret = (v: number | null) => (v === null ? "אין נתון" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`);
  const cost = (v: number | null) => (v === null ? "אין נתון" : `${v.toFixed(2)}%`);

  const normalized = query.trim().toLowerCase();
  const glossary = normalized
    ? GLOSSARY.filter((g) => g.term.toLowerCase().includes(normalized) || g.body.toLowerCase().includes(normalized))
    : GLOSSARY;

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <Header />

      <main>
        {/* HERO — the hub opening: one vector element in the margin, no illustration */}
        <section className="dna-page overflow-hidden">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -110, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <div className="relative z-10 max-w-brand mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">
            <nav className="flex items-center gap-2 text-[14px] mb-8 sm:mb-12" style={{ color: MUTED }} aria-label="ניווט משני">
              <Link to="/" className="hover:underline underline-offset-4">דף הבית</Link>
              <BrandIcon name="arrow-left" size={14} />
              <span className="font-bold" style={{ color: GREEN }} aria-current="page">מידע ולמידה</span>
            </nav>

            <div className="relative">
              <LeafCanopy className="hidden lg:block absolute -top-8 left-0 w-56 opacity-90" />
              <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(32px, 4.4vw, 52px)" }}>
                להבין לפני שמחליטים.
              </h1>
              <p className="text-[17px] sm:text-[18px] max-w-2xl leading-[1.7] mb-6" style={{ color: MUTED }}>
                תוכן מקצועי שיעזור לכם לקבל החלטות בטוחות יותר. המספרים כאן מחושבים מנתוני רשות שוק ההון
                ומתעדכנים מדי חודש עם פרסום הדוחות הרשמיים.
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="link-rule text-[15px]"
              >
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </div>
          </div>
        </section>

        {/* MARKET SNAPSHOT — white band */}
        <section className="border-t bg-white" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead
                title="מה קורה בשוק החיסכון"
                lede="החציון של כל קטגוריה, כלומר הקופה שנמצאת בדיוק באמצע. זה מדד הוגן יותר מממוצע, שכמה מסלולים חריגים יכולים להטות."
              />
            </ScrollReveal>

            {period && (
              <p className="mb-6 text-[15px]" style={{ color: MUTED }}>
                נכון לתקופת דיווח{" "}
                <span dir="ltr" className="tabular-nums whitespace-nowrap font-bold" style={{ color: GREEN }}>{period}</span>
              </p>
            )}

            {fundsLoading ? (
              <p className="py-10 text-[16px]" style={{ color: MUTED }} role="status">
                טוענים את נתוני השוק.
              </p>
            ) : fundsError || marketRows.length === 0 ? (
              <div className="dna-callout max-w-2xl text-[16px]">
                נתוני השוק אינם זמינים כרגע. אפשר לעבור ישירות לטבלאות התשואה או לנסות שוב מאוחר יותר.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="dna-data">
                  <thead>
                    <tr>
                      <th scope="col">קטגוריה</th>
                      <th scope="col">קופות</th>
                      <th scope="col">תשואה חציונית מתחילת השנה</th>
                      <th scope="col">חציון ממוצע 3 שנים</th>
                      <th scope="col">דמי ניהול חציוניים</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketRows.map((r) => (
                      <tr key={r.category}>
                        <td>{productTypeLabels[r.category]}</td>
                        <td className="num"><span dir="ltr">{r.count}</span></td>
                        <td className="num">
                          <span dir="ltr" style={{ color: (r.ytd ?? 0) < 0 ? RUST_TEXT : BODY }}>{ret(r.ytd)}</span>
                        </td>
                        <td className="num">
                          <span dir="ltr" style={{ color: (r.y3 ?? 0) < 0 ? RUST_TEXT : BODY }}>{ret(r.y3)}</span>
                        </td>
                        <td className="num">
                          <span dir="ltr" style={{ color: SAND_TEXT }}>{cost(r.fee)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-4 text-[14px] leading-[1.6] max-w-2xl" style={{ color: MUTED }}>
              תשואות עבר אינן מעידות על תשואות עתידיות. הנתונים מתפרסמים על ידי רשות שוק ההון,
              ביטוח וחיסכון במשרד האוצר.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/fund-finder" className="btn-primary sm:min-w-[220px]">להשוואת קופות מלאה</Link>
              <Link to="/return-tables" className="btn-secondary sm:min-w-[200px]">טבלאות תשואה</Link>
            </div>
          </div>
        </section>

        {/* GLOSSARY — searchable */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead
                title="המונחים שפוגשים בדוח"
                lede="עשרה מונחים שחוזרים כמעט בכל דוח שנתי, בלי שפה משפטית."
              />
            </ScrollReveal>

            <div className="max-w-md mb-8">
              <label htmlFor="glossary-search" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                חיפוש מונח
              </label>
              <input
                id="glossary-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field"
                autoComplete="off"
              />
            </div>

            {glossary.length === 0 ? (
              <div className="py-10">
                <p className="text-[17px] font-bold" style={{ color: GREEN }}>לא נמצאו תוצאות</p>
                <p className="mt-2 text-[16px]" style={{ color: BODY }}>נסו מילה אחרת, או שאלו את היועץ הדיגיטלי.</p>
                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <button type="button" onClick={() => setQuery("")} className="btn-secondary">ניקוי החיפוש</button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="link-rule text-[15px]"
                  >
                    <BrandIcon name="message" size={18} />
                    שאלו את היועץ הדיגיטלי
                  </button>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {glossary.map((g) => (
                  <div key={g.term} className="border-t pt-4" style={{ borderColor: LINE }}>
                    <dt className="text-[20px] font-bold mb-2" style={{ color: GREEN }}>{g.term}</dt>
                    <dd className="text-[16px] leading-[1.75]" style={{ color: BODY }}>{g.body}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>

        {/* LATEST GUIDES — white band */}
        {(postsLoading || posts.length > 0) && (
          <section className="border-t bg-white" style={{ borderColor: LINE }}>
            <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
              <ScrollReveal>
                <SectionHead title="מדריכים אחרונים" />
              </ScrollReveal>

              {postsLoading ? (
                <p className="text-[16px]" style={{ color: MUTED }} role="status">טוענים את המדריכים האחרונים.</p>
              ) : (
                <>
                  {/* Search and category chips (mock), then list cards with the abstract thumbnail */}
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2" role="group" aria-label="סינון לפי נושא">
                      {[null, ...new Set(posts.map((p) => p.category).filter(Boolean) as string[])].map((c) => {
                        const active = guideCategory === c;
                        return (
                          <button
                            key={c ?? "all"}
                            type="button"
                            onClick={() => setGuideCategory(c)}
                            aria-pressed={active}
                            className={`inline-flex min-h-[44px] items-center rounded-full px-4 text-[15px] font-bold transition-colors ${active ? "text-[#FAF7EF]" : "bg-white hover:bg-[#EEF2EC]"}`}
                            style={active ? { background: GREEN } : { color: GREEN, boxShadow: `inset 0 0 0 1px ${LINE}` }}
                          >
                            {c ?? "הכל"}
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative sm:w-72">
                      <label htmlFor="guide-search" className="sr-only">חיפוש נושא</label>
                      <input
                        id="guide-search"
                        type="search"
                        value={guideQuery}
                        onChange={(e) => setGuideQuery(e.target.value)}
                        placeholder="חיפוש נושא"
                        className="field pe-11"
                        autoComplete="off"
                      />
                      <BrandIcon name="search" size={20} className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-4" style={{ color: MUTED }} />
                    </div>
                  </div>

                  {(() => {
                    const q = guideQuery.trim().toLowerCase();
                    const shown = posts.filter((p) =>
                      (!guideCategory || p.category === guideCategory) &&
                      (!q || p.title.toLowerCase().includes(q) || (p.excerpt ?? "").toLowerCase().includes(q)),
                    );
                    if (shown.length === 0) {
                      return <p className="text-[16px]" style={{ color: MUTED }}>לא נמצאו מדריכים לחיפוש הזה.</p>;
                    }
                    return (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {shown.map((p, i) => (
                          <Link
                            key={p.id}
                            to={`/blog/${p.slug}`}
                            className="group flex items-center gap-4 rounded-2xl bg-white border p-4 dna-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                            style={{ borderColor: LINE }}
                          >
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[17px] leading-snug" style={{ color: GREEN }}>{p.title}</h3>
                              {p.excerpt && (
                                <p className="mt-1.5 text-[14px] leading-[1.6] line-clamp-2" style={{ color: MUTED }}>{p.excerpt}</p>
                              )}
                            </div>
                            <CircleArt variant={i} className="w-24 shrink-0 sm:w-28" />
                            <BrandIcon name="arrow-left" size={18} className="shrink-0 transition-transform group-hover:-translate-x-1" style={{ color: GREEN }} />
                          </Link>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="mt-8">
                    <Link to="/blog" className="link-rule text-[15px]">
                      לכל המדריכים בבלוג
                      <BrandIcon name="arrow-left" size={18} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* TOOLS */}
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="max-w-brand mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <ScrollReveal>
              <SectionHead title="כלים לבדיקה עצמית" />
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {TOOLS.map((t, ti) => (
                <Link key={t.to} to={t.to} className="group block dna-concept dna-hover h-full">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: [PASTEL_SAGE, PASTEL_SAND, PASTEL_MINT][ti % 3] }}>
                        <BrandIcon name={t.icon} size={22} style={{ color: GREEN }} />
                      </span>
                      <h3 className="text-[18px]" style={{ color: GREEN }}>{t.title}</h3>
                    </div>
                    <BrandIcon name="arrow-left" size={18} className="shrink-0 mt-1 transition-transform group-hover:-translate-x-1" style={{ color: GREEN }} />
                  </div>
                  <p className="text-[15px] leading-[1.7]" style={{ color: BODY }}>{t.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — deep green band */}
        <section className="dna-navy-band">
          <div className="relative max-w-brand mx-auto px-5 sm:px-8 py-16 sm:py-24">
            <h2 className="leading-tight mb-3" style={{ color: IVORY, fontSize: "clamp(26px, 3.2vw, 36px)" }}>
              רוצים לדעת איפה אתם עומדים?
            </h2>
            <p className="text-[17px] leading-[1.7] mb-9 max-w-xl" style={{ color: SAGE_ON_GREEN }}>
              בדיקת תיק 360 מסכמת את הביטוחים, הפנסיה והחיסכון שלכם בתמונה אחת. ללא עלות וללא התחייבות.
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
}
