import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { useCmaFunds, useCmaSyncStatus, formatPeriod } from "@/hooks/useCmaFunds";
import { productTypeLabels, type ProductType } from "@/types/fund";
import { LiveTag } from "@/components/brand/Live";
import {
  BODY, DISPLAY, GOLD_TEXT, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, TURQ_TEXT,
} from "@/lib/brand";

/*
  מידע ולמידה — the knowledge hub. Three layers, deliberately:
  1. Live market figures, computed from the same authority data the comparison
     tool uses, so nothing here is hand-maintained and nothing goes stale.
  2. A plain-language glossary of the terms people meet in their statements.
  3. The latest guides from the blog.
  SEELD DNA v3 (STYLESEED.md): white canvas, pastel circles, hairline rules.
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

export default function Learn() {
  const { data: funds } = useCmaFunds();
  const { data: syncStatus } = useCmaSyncStatus();
  const [posts, setPosts] = useState<PostRow[]>([]);

  useEffect(() => {
    siteSupabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setPosts(data as PostRow[]);
      });
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
  const ret = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`);
  const cost = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main className="dna-page">
        <div className="dna-circles" aria-hidden="true">
          <div className="dna-circ" style={{ width: 280, height: 280, top: -120, left: -110, backgroundColor: PASTEL_BLUE, opacity: 0.5 }} />
          <div className="dna-circ hidden md:block" style={{ width: 220, height: 220, top: 420, right: -110, backgroundColor: PASTEL_MINT, opacity: 0.45 }} />
        </div>

        <div className="relative z-10">
          {/* Hero */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
            <nav className="flex items-center gap-2 text-[13px] mb-8" style={{ color: MUTED }}>
              <Link to="/" className="hover:text-[#1D2D3D] transition-colors">דף הבית</Link>
              <span aria-hidden="true">←</span>
              <span className="font-medium text-[#1D2D3D]">מידע ולמידה</span>
            </nav>

            <h1 className="dna-display leading-[1.15] mb-5 max-w-3xl" style={{ fontSize: "clamp(2rem, 5vw, 3.1rem)" }}>
              מידע ולמידה
            </h1>
            <p className="text-base sm:text-[17px] max-w-2xl leading-[1.9]" style={{ color: MUTED }}>
              המספרים שמאחורי החיסכון שלכם, בשפה פשוטה. המידע כאן מחושב מנתוני רשות שוק ההון
              ומתעדכן מדי חודש עם פרסום הדוחות הרשמיים, כך שמה שאתם רואים הוא המצב העדכני ולא
              תמונה משנה שעברה.
            </p>
          </section>

          {/* Live market snapshot */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <h2 className="text-[26px] sm:text-[32px] leading-tight mb-3" style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY }}>
                מה קורה בשוק החיסכון
              </h2>
              <p className="text-[15px] leading-[1.85] max-w-2xl mb-6" style={{ color: BODY }}>
                החציון של כל קטגוריה, כלומר הקופה שנמצאת בדיוק באמצע. זה מדד הוגן יותר מממוצע,
                שכמה מסלולים חריגים יכולים להטות.
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-7">
                <LiveTag dot={Boolean(period)}>{period ? "LIVE DATA" : "LOCAL DATA"}</LiveTag>
                {period && (
                  <span className="text-[13px]" style={{ color: MUTED }}>
                    נכון לתקופת דיווח{" "}
                    <span className="tabular-nums" style={{ fontFamily: MONO, color: NAVY }}>{period}</span>
                  </span>
                )}
              </div>

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
                        <td className="num"><span dir="ltr" style={{ fontFamily: MONO }}>{r.count}</span></td>
                        <td className="num">
                          <span dir="ltr" style={{ fontFamily: MONO, color: (r.ytd ?? 0) < 0 ? "#a04a5c" : TURQ_TEXT }}>
                            {ret(r.ytd)}
                          </span>
                        </td>
                        <td className="num">
                          <span dir="ltr" style={{ fontFamily: MONO, color: (r.y3 ?? 0) < 0 ? "#a04a5c" : TURQ_TEXT }}>
                            {ret(r.y3)}
                          </span>
                        </td>
                        <td className="num">
                          <span dir="ltr" style={{ fontFamily: MONO, color: GOLD_TEXT }}>{cost(r.fee)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-[13px]" style={{ color: MUTED }}>
                תשואות עבר אינן מעידות על תשואות עתידיות. הנתונים מתפרסמים על ידי רשות שוק ההון,
                ביטוח וחיסכון במשרד האוצר.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/fund-finder"
                  className="inline-flex items-center px-6 py-3.5 rounded-lg text-[15px] font-medium text-white min-h-[48px]"
                  style={{ backgroundColor: NAVY }}
                >
                  להשוואת קופות מלאה
                </Link>
                <Link
                  to="/return-tables"
                  className="inline-flex items-center px-6 py-3.5 rounded-lg border text-[15px] font-medium min-h-[48px]"
                  style={{ borderColor: LINE, color: NAVY }}
                >
                  טבלאות תשואה
                </Link>
              </div>
            </div>
          </section>

          {/* Glossary */}
          <section className="border-t dna-warm-band" style={{ borderColor: LINE }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <h2 className="text-[26px] sm:text-[32px] leading-tight mb-3" style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY }}>
                המונחים שפוגשים בדוח
              </h2>
              <p className="text-[15px] leading-[1.85] max-w-2xl mb-8" style={{ color: BODY }}>
                עשרה מונחים שחוזרים כמעט בכל דוח שנתי, בלי שפה משפטית.
              </p>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
                {GLOSSARY.map((g) => (
                  <div key={g.term} className="border-t pt-4" style={{ borderColor: LINE }}>
                    <dt className="text-[17px] mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                      {g.term}
                    </dt>
                    <dd className="text-[14.5px] leading-[1.85]" style={{ color: BODY }}>{g.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {/* Latest guides */}
          {posts.length > 0 && (
            <section className="border-t" style={{ borderColor: LINE }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                <h2 className="text-[26px] sm:text-[32px] leading-tight mb-8" style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY }}>
                  מדריכים אחרונים
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {posts.map((p) => (
                    <Link key={p.id} to={`/blog/${p.slug}`} className="dna-concept dna-hover flex flex-col">
                      {p.category && (
                        <span className="text-[11px] tracking-[0.14em] mb-2" style={{ fontFamily: MONO, color: GOLD_TEXT }}>
                          {p.category}
                        </span>
                      )}
                      <h3 className="text-[18px] leading-snug mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="text-[14px] leading-[1.8] line-clamp-3" style={{ color: BODY }}>{p.excerpt}</p>
                      )}
                    </Link>
                  ))}
                </div>

                <Link
                  to="/blog"
                  className="inline-flex items-center mt-8 text-[15px] font-medium hover:opacity-80 transition-opacity"
                  style={{ color: NAVY }}
                >
                  לכל המדריכים בבלוג
                  <span className="inline-block ms-2" aria-hidden="true">←</span>
                </Link>
              </div>
            </section>
          )}

          {/* Tools */}
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <h2 className="text-[26px] sm:text-[32px] leading-tight mb-8" style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY }}>
                כלים לבדיקה עצמית
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { to: "/calculators", title: "מחשבונים", body: "משכנתא, פנסיה, חיסכון ומס. בלי רישום ובלי עלות." },
                  { to: "/fund-finder", title: "השוואת קופות", body: "חיפוש חופשי בכל הקופות בישראל, עם תשואות ודמי ניהול." },
                  { to: "/investment-tracks", title: "מסלולי השקעה", body: "השוואה בין מסלולים: מנייתי, כללי, סולידי ועוקבי מדד." },
                  { to: "/return-tables", title: "טבלאות תשואה", body: "התשואות המלאות לפי גוף מנהל ולפי מסלול." },
                  { to: "/rights-extraction", title: "מיצוי זכויות", body: "בדיקה אם נשארו לכם כספים אבודים או זכויות שלא מומשו." },
                  { to: "/insurances", title: "מדריך הביטוחים", body: "מה כולל כל סוג ביטוח, ומתי הוא באמת נחוץ." },
                ].map((t) => (
                  <Link key={t.to} to={t.to} className="dna-concept dna-hover">
                    <h3 className="text-[18px] mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>{t.title}</h3>
                    <p className="text-[14px] leading-[1.8]" style={{ color: BODY }}>{t.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <section className="dna-navy-band" style={{ backgroundColor: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2
            className="text-white leading-tight mb-3"
            style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
          >
            רוצים לדעת איפה אתם עומדים.
          </h2>
          <p className="text-base leading-[1.85] mb-8 max-w-xl" style={{ color: "rgba(255,255,255,.65)" }}>
            בדיקת תיק מלאה, דוח תוך 48 שעות, בלי עלות ובלי התחייבות.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-9 py-4 rounded-lg bg-white text-[#1D2D3D] text-base font-medium tracking-wide hover:bg-[#E7EDF1] transition-colors min-h-[52px]"
          >
            לבדיקת תיק ללא עלות
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
