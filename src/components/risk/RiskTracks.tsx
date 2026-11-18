// "מסלולים מתאימים": tracks of the returns board that fall in the characterised level, per product.
// Same data path as /return-tables (useCmaBoard: /api/board, with its own fallback), classified in the
// browser by the spec rules (src/lib/riskProfile.ts). Ordered by assets, never by return.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { cleanFundName } from "@/lib/utils";
import { fmtNum, fmtPct, fmtPlainPct, periodLabel, PRODUCTS, trackLabel, useCmaBoard, type BoardFund } from "@/hooks/useCmaBoard";
import { countByProduct, tracksFor, type RiskLevel } from "@/lib/riskProfile";
import { RISK_COPY, RISK_LEVEL_COPY } from "@/data/riskProfile";

const LIMIT = 6;

type Col = { key: keyof BoardFund; label: string; kind: "return" | "pct" | "num"; title: string };
const BASE_COLS: Col[] = [
  { key: "stock_pct", label: "מניות", kind: "pct", title: "חשיפה למניות מסך הנכסים" },
  { key: "ret_12m", label: "12 חודשים", kind: "return", title: "תשואה מצטברת ב־12 החודשים האחרונים" },
  { key: "ret_5y", label: "5 שנים", kind: "return", title: "תשואה מצטברת ב־60 החודשים האחרונים" },
  { key: "std_dev", label: "סטיית תקן", kind: "num", title: "סטיית תקן חודשית של התשואות" },
  { key: "mgmt_fee", label: "דמי ניהול", kind: "pct", title: "דמי ניהול שנתיים ממוצעים מהצבירה" },
];
const FOREIGN_COL: Col = { key: "foreign_pct", label: "חו״ל", kind: "pct", title: "חשיפה לנכסים בחו״ל מסך הנכסים" };

// The source files spell S&P as "S1;P" (a broken entity). Display only; the data is untouched.
const fundName = (name: string) => cleanFundName(name).replace(/\bS1;P ?(500)?/gi, (_m, n) => (n ? "S&P 500" : "S&P"));

const fmt = (kind: Col["kind"], v: unknown) => {
  const n = typeof v === "number" ? v : null;
  return kind === "return" ? fmtPct(n) : kind === "pct" ? fmtPlainPct(n, 1) : fmtNum(n);
};

function Value({ kind, value }: { kind: Col["kind"]; value: unknown }) {
  const text = fmt(kind, value);
  if (text === null) return <span className="sd-rk-na" aria-label="אין נתון">—</span>;
  const neg = kind === "return" && typeof value === "number" && value < 0;
  return <span dir="ltr" className={`sd-rk-num ${kind === "return" ? (neg ? "is-neg" : "is-pos") : ""}`}>{text}</span>;
}

export default function RiskTracks({ level }: { level: RiskLevel }) {
  const { data: board, isLoading, isError } = useCmaBoard();
  const counts = useMemo(() => (board ? countByProduct(board, level) : {}), [board, level]);
  const ageCounts = useMemo(() => (board ? countByProduct(board, "age") : {}), [board]);
  const available = useMemo(() => PRODUCTS.filter((p) => (counts[p.key] ?? 0) > 0), [counts]);
  const [product, setProduct] = useState<string>("pensia");
  useEffect(() => {
    if (available.length && !available.some((p) => p.key === product)) setProduct(available[0].key);
  }, [available, product]);

  const meta = PRODUCTS.find((p) => p.key === product) ?? PRODUCTS[0];
  const { rows, total } = useMemo(() => (board ? tracksFor(board, level, product, LIMIT) : { rows: [], total: 0 }), [board, level, product]);
  const period = useMemo(() => (rows.length ? Math.max(...rows.map((r) => r.report_period)) : null), [rows]);
  const cols = level === "high" ? [BASE_COLS[0], FOREIGN_COL, ...BASE_COLS.slice(1)] : BASE_COLS;
  const levelCopy = RISK_LEVEL_COPY[level];
  const ageCount = ageCounts[product] ?? 0;

  return (
    <section className="sd-rk-tracks" aria-labelledby="rk-tracks-h">
      <h3 id="rk-tracks-h" className="sd-rk-tracks-h">מסלולים מתאימים</h3>
      <p className="sd-rk-tracks-lede">
        מסלולים מלוח התשואות שהחשיפה שלהם מתאימה ל{levelCopy.title}. הם מוצגים לפי גודל הנכסים המנוהלים ולא לפי תשואה, והרשימה אינה המלצה על מסלול או על גוף.
      </p>

      {isLoading && <p className="sd-rk-loading" role="status">טוענים את נתוני המסלולים…</p>}
      {isError && !board && (
        <p className="sd-rk-empty" role="status">
          נתוני המסלולים לא נטענו כרגע. אפשר לראות את כל המסלולים <Link to="/return-tables" className="sd-link">בלוח התשואות</Link>.
        </p>
      )}

      {board && (
        <>
          <div className="sd-rk-chips" role="group" aria-label="בחירת מוצר">
            {(available.length ? available : PRODUCTS).map((p) => (
              <button key={p.key} type="button" aria-pressed={p.key === product} className={p.key === product ? "is-on" : ""} onClick={() => setProduct(p.key)}>
                {p.label}
                <small dir="ltr" className="sd-rk-num">{counts[p.key] ?? 0}</small>
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="sd-rk-empty">אין כרגע בלוח מסלולים ברמה הזו ב{meta.label}.</p>
          ) : (
            <>
              <p className="sd-rk-asof">
                {meta.label}: {rows.length < total ? `${rows.length} המסלולים הגדולים מתוך ${total} ברמה הזו` : `${total} מסלולים ברמה הזו`}
                {period ? <> · נתונים נכון ל{periodLabel(period)}</> : null}
              </p>

              {/* wide screens: a table */}
              <div className="sd-rk-tablewrap">
                <table className="sd-rk-table">
                  <caption className="sr-only">מסלולים ב{levelCopy.title}, {meta.label}, לפי גודל הנכסים</caption>
                  <thead>
                    <tr>
                      <th scope="col">מסלול</th>
                      {cols.map((c) => <th key={c.key} scope="col" className="num" title={c.title}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((f) => (
                      <tr key={`${f.fund_id}:${f.source}`}>
                        <th scope="row">
                          <b>{fundName(f.fund_name)}</b>
                          <small>{f.company} · {trackLabel(f.track)}</small>
                        </th>
                        {cols.map((c) => <td key={c.key} className="num"><Value kind={c.kind} value={f[c.key]} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phones: one card per track */}
              <ul className="sd-rk-cards">
                {rows.map((f) => (
                  <li key={`${f.fund_id}:${f.source}`}>
                    <b>{fundName(f.fund_name)}</b>
                    <small>{f.company} · {trackLabel(f.track)}</small>
                    <dl>
                      {cols.map((c) => (
                        <div key={c.key}><dt>{c.label}</dt><dd><Value kind={c.kind} value={f[c.key]} /></dd></div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="sd-rk-more">
            <Link to={`/return-tables/${meta.slug}`} className="sd-link">
              {meta.label} בלוח התשואות המלא<BrandIcon name="arrow-left" size={18} />
            </Link>
          </p>
        </>
      )}

      <aside className="sd-rk-agenote" aria-labelledby="rk-age-h">
        <h4 id="rk-age-h">מסלולי ברירת המחדל התלויים בגיל</h4>
        <p>{RISK_COPY.ageNote}</p>
        {board && ageCount > 0 && (
          <p className="sd-rk-agecount">בלוח יש <span dir="ltr" className="sd-rk-num">{ageCount}</span> מסלולים כאלה ב{meta.label}, והם לא נכללים ברשימה שלמעלה.</p>
        )}
      </aside>
    </section>
  );
}
