import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import { productTypeLabels, type ProductType } from "@/types/fund";
import { BrandIcon, type BrandIconName } from "@/components/brand/BrandIcon";
import { stories } from "@/data/stories";
import { SdBand, SdStory, tintStyle, useSdFont } from "@/components/sd/primitives";
import { PUB_TOPICS, PubArticleCard, PubClose, PubHead, PubHero, spreadArts, toneAt } from "@/components/sd/pub";
import { PASTELS } from "@/components/sd/topics";
import { RUST_TEXT, SAND_TEXT } from "@/lib/brand";
import "@/components/sd/sd.css";

/*
  מידע ולמידה — the knowledge hub, in the kit design. Three layers, deliberately:
  1. Live market figures, computed from the same authority data the comparison
     tool uses, so nothing here is hand-maintained and nothing goes stale.
  2. A plain-language glossary of the terms people meet in their statements.
  3. The latest guides from the blog.
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
    body: "אחוז שנגבה בכל שנה מכל הכסף שצברתם, לא רק מההפקדות החדשות. זה הרכיב שמצטבר לאורך שנים, ולכן גם פער קטן בין שני שיעורים משמעותי יותר משהוא נשמע.",
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
    body: "אפיק חיסכון שנזיל אחרי שש שנים ופטור ממס רווחי הון, עד תקרה שנקבעת בדין. מי שיש לו קרן השתלמות פעילה כדאי שיבדוק אם הוא מנצל את ההטבה במלואה.",
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
  { to: "/calculators", title: "מחשבונים", body: "משכנתא, פנסיה, חיסכון ומס. בלי צורך ברישום.", icon: "calculator" },
  { to: "/fund-finder", title: "השוואת קופות", body: "חיפוש חופשי בכל הקופות בישראל, עם תשואות ודמי ניהול.", icon: "search" },
  { to: "/investment-tracks", title: "מסלולי השקעה", body: "השוואה בין מסלולים: מנייתי, כללי, סולידי ועוקבי מדד.", icon: "route" },
  { to: "/return-tables", title: "טבלאות תשואה", body: "התשואות המלאות לפי גוף מנהל ולפי מסלול.", icon: "chart" },
  { to: "/rights-extraction", title: "מיצוי זכויות", body: "בדיקה אם נשארו לכם כספים אבודים או זכויות שלא מומשו.", icon: "folder" },
  { to: "/insurances", title: "מדריך הביטוחים", body: "מה כולל כל סוג ביטוח, ומתי הוא באמת נחוץ.", icon: "shield" },
];

const arrow = <BrandIcon name="arrow-left" size={18} />;

export default function Learn() {
  useSdFont();
  const topic = PUB_TOPICS.learn;
  const [p1, p2, p3] = topic.palette;
  const story = stories["/learn"];

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

  const sections = [
    { id: "market", label: "מה קורה בשוק" },
    { id: "glossary", label: "המונחים" },
    { id: "guides", label: "מדריכים" },
    { id: "tools", label: "כלים" },
  ];

  return (
    <div className="sd min-h-screen" dir="rtl" style={tintStyle(p1)}>
      <Header />

      <main>
        <PubHero
          crumbs={[{ label: "דף הבית", to: "/" }, { label: "מידע ולמידה" }]}
          eyebrow="מידע ולמידה"
          title="להבין לפני שמחליטים."
          lead="תוכן מקצועי שיעזור לכם לקבל החלטות מושכלות יותר. המספרים כאן מחושבים מנתוני רשות שוק ההון ומתעדכנים מדי חודש עם פרסום הדוחות הרשמיים."
          art={topic.art}
          tint={p1}
          actions={
            <>
              <a href="#market" className="sd-btn">מה קורה בשוק{arrow}</a>
              <button type="button" className="sd-link" onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}>
                <BrandIcon name="message" size={18} />
                שאלו את היועץ הדיגיטלי
              </button>
            </>
          }
        />

        <nav className="sd-subnav" aria-label="תוכן העמוד">
          <div className="sd-wrap sd-subnav-in">
            {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.label}</a>)}
          </div>
        </nav>

        {story && (
          <SdBand tone={p1} id="moment">
            <SdStory story={story} art={topic.art2} spots={["coins-stacks", "olive-sapling"]} />
          </SdBand>
        )}

        {/* MARKET SNAPSHOT */}
        <SdBand tone="cream" id="market">
          <div className="sd-wrap">
            <PubHead
              title="מה קורה בשוק החיסכון"
              lede="החציון של כל קטגוריה, כלומר הקופה שנמצאת בדיוק באמצע. זה מדד הוגן יותר מממוצע, שכמה מסלולים חריגים יכולים להטות."
            />

            {period && (
              <p className="mb-6 text-[15px]" style={{ color: "var(--muted)" }}>
                נכון לתקופת דיווח{" "}
                <span dir="ltr" className="tabular-nums whitespace-nowrap font-bold" style={{ color: "var(--ink)" }}>{period}</span>
              </p>
            )}

            {fundsLoading ? (
              <p className="py-10 text-[16px]" style={{ color: "var(--muted)" }} role="status">
                טוענים את נתוני השוק.
              </p>
            ) : fundsError || marketRows.length === 0 ? (
              <div className="dna-callout max-w-2xl text-[16px]">
                נתוני השוק אינם זמינים כרגע. אפשר לעבור ישירות לטבלאות התשואה או לנסות שוב מאוחר יותר.
              </div>
            ) : (
              <div className="sd-pub-scroll">
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
                          <span dir="ltr" style={{ color: (r.ytd ?? 0) < 0 ? RUST_TEXT : undefined }}>{ret(r.ytd)}</span>
                        </td>
                        <td className="num">
                          <span dir="ltr" style={{ color: (r.y3 ?? 0) < 0 ? RUST_TEXT : undefined }}>{ret(r.y3)}</span>
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

            <p className="mt-4 text-[14px] leading-[1.6] max-w-2xl" style={{ color: "var(--muted)" }}>
              תשואות עבר אינן מעידות על תשואות עתידיות. הנתונים מתפרסמים על ידי רשות שוק ההון,
              ביטוח וחיסכון במשרד האוצר.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link to="/fund-finder" className="sd-btn">להשוואת קופות מלאה{arrow}</Link>
              <Link to="/return-tables" className="sd-link">טבלאות תשואה{arrow}</Link>
            </div>
          </div>
        </SdBand>

        {/* GLOSSARY — searchable */}
        <SdBand tone={p2} id="glossary">
          <div className="sd-wrap">
            <PubHead title="המונחים שפוגשים בדוח" lede="עשרה מונחים שחוזרים כמעט בכל דוח שנתי, בלי שפה משפטית." />

            <div className="max-w-md mb-8">
              <label htmlFor="glossary-search" className="block text-[14px] font-bold mb-1.5" style={{ color: "var(--ink)" }}>
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
                <p className="text-[17px] font-bold" style={{ color: "var(--ink)" }}>לא נמצאו תוצאות</p>
                <p className="mt-2 text-[16px]">נסו מילה אחרת, או שאלו את היועץ הדיגיטלי.</p>
                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <button type="button" onClick={() => setQuery("")} className="btn-secondary">ניקוי החיפוש</button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                    className="sd-link"
                  >
                    <BrandIcon name="message" size={18} />
                    שאלו את היועץ הדיגיטלי
                  </button>
                </div>
              </div>
            ) : (
              <dl className="sd-gloss">
                {glossary.map((g) => (
                  <div key={g.term} className="sd-gloss-row">
                    <dt>{g.term}</dt>
                    <dd>{g.body}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </SdBand>

        {/* LATEST GUIDES */}
        {(postsLoading || posts.length > 0) && (
          <SdBand tone="white" id="guides">
            <div className="sd-wrap">
              <PubHead title="מדריכים אחרונים" />

              {postsLoading ? (
                <p className="text-[16px]" style={{ color: "var(--muted)" }} role="status">טוענים את המדריכים האחרונים.</p>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="sd-chips" role="group" aria-label="סינון לפי נושא">
                      {[null, ...new Set(posts.map((p) => p.category).filter(Boolean) as string[])].map((c) => (
                        <button
                          key={c ?? "all"}
                          type="button"
                          onClick={() => setGuideCategory(c)}
                          aria-pressed={guideCategory === c}
                          className="sd-chip"
                        >
                          {c ?? "הכל"}
                        </button>
                      ))}
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
                      <BrandIcon name="search" size={20} className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-4" style={{ color: "var(--muted)" }} />
                    </div>
                  </div>

                  {(() => {
                    const q = guideQuery.trim().toLowerCase();
                    const shown = posts.filter((p) =>
                      (!guideCategory || p.category === guideCategory) &&
                      (!q || p.title.toLowerCase().includes(q) || (p.excerpt ?? "").toLowerCase().includes(q)),
                    );
                    if (shown.length === 0) {
                      return <p className="text-[16px]" style={{ color: "var(--muted)" }}>לא נמצאו מדריכים לחיפוש הזה.</p>;
                    }
                    return (
                      <div className="sd-pub-grid sd-pub-grid-2">
                        {(() => { const arts = spreadArts(shown, [topic.art2]); return shown.map((p, idx) => {
                          const a = arts[idx];
                          return (
                            <PubArticleCard
                              key={p.id}
                              to={`/blog/${p.slug}`}
                              title={p.title}
                              kicker={p.category ?? undefined}
                              excerpt={p.excerpt}
                              art={a.art}
                              tone={a.tone}
                            />
                          );
                        }); })()}
                      </div>
                    );
                  })()}

                  <div className="mt-8">
                    <Link to="/blog" className="sd-link">לכל המדריכים בבלוג{arrow}</Link>
                  </div>
                </>
              )}
            </div>
          </SdBand>
        )}

        {/* TOOLS */}
        <SdBand tone={p3} id="tools">
          <div className="sd-wrap">
            <PubHead title="כלים לבדיקה עצמית" />
            <div className="sd-pub-grid sd-pub-grid-2">
              {TOOLS.slice(0, 2).map((t, ti) => (
                <PubArticleCard
                  key={t.to}
                  to={t.to}
                  title={t.title}
                  kicker="כלי"
                  excerpt={t.body}
                  art={ti === 0 ? "06-home-mortgage" : "05-retirement"}
                  tone={ti === 0 ? "sky" : "lavender"}
                  cta="לכלי"
                />
              ))}
            </div>
            <div className="sd-pub-grid sd-pub-grid-4 mt-5">
              {TOOLS.slice(2).map((t, ti) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className="sd-pub-card sd-pub-card-plain sd-reveal group"
                  style={{ ["--band" as string]: PASTELS[toneAt(ti + 3)].bg, ["--band-deep" as string]: PASTELS[toneAt(ti + 3)].deep }}
                >
                  <div className="sd-pub-card-body">
                    <span className="sd-pub-card-icon"><BrandIcon name={t.icon} size={24} /></span>
                    <h3>{t.title}</h3>
                    <p className="sd-pub-excerpt">{t.body}</p>
                    <span className="sd-pub-card-cta"><span>לכלי</span>{arrow}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </SdBand>

        <PubClose
          title="רוצים לדעת איפה אתם עומדים?"
          text="בדיקת תיק 360 מסכמת את הביטוחים, הפנסיה והחיסכון שלכם בתמונה אחת. שיחת היכרות בלי התחייבות מצידכם."
          art="11-claims-service"
        />
      </main>

      <Footer />
    </div>
  );
}
