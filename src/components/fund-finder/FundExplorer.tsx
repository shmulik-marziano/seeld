import { useState } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, Check } from 'lucide-react';
import type { Fund, ProductType } from '@/types/fund';
import { productTypeLabels, companyLabels, specializationLabels } from '@/types/fund';
import { useFundExplorer, MAX_COMPARE, type SortKey } from '@/hooks/useFundExplorer';
import { BODY, DISPLAY, GOLD_TEXT, LINE, MONO, MUTED, NAVY, TURQ_TEXT } from '@/lib/brand';

/*
  FundExplorer — the search surface for comparing funds (SEELD DNA v3).
  One input, results that update as you type, a sortable table, and a tray
  that collects what you picked. Filters are secondary and folded away until
  asked for, so the first screen is a ranked list rather than a blank form.
*/

const PRODUCT_ORDER: ProductType[] = ['hishtalmut', 'gemel', 'pensia', 'gemel_invest', 'polisa'];

const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${v.toFixed(2)}%`);

// Assets arrive in millions ILS; past a billion the millions read as noise.
const formatAssets = (millions: number | null) => {
  if (millions === null || millions === undefined) return '—';
  return millions >= 1000
    ? `${(millions / 1000).toLocaleString('he-IL', { maximumFractionDigits: 1 })} מיליארד`
    : `${Math.round(millions).toLocaleString('he-IL')} מיליון`;
};

/** Returns read better with a sign and a colour that survives contrast checks. */
const ReturnCell = ({ value }: { value: number | null | undefined }) => {
  if (value === null || value === undefined) {
    return <span style={{ color: MUTED }}>—</span>;
  }
  return (
    <span dir="ltr" style={{ fontFamily: MONO, color: value < 0 ? '#a04a5c' : TURQ_TEXT }}>
      {value > 0 ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  );
};

const COLUMNS: { key: SortKey; label: string; numeric: boolean; hideOn?: string }[] = [
  { key: 'name', label: 'קופה', numeric: false },
  { key: 'ytd', label: 'מתחילת השנה', numeric: true },
  { key: 'year3', label: 'ממוצע 3 שנים', numeric: true, hideOn: 'hidden lg:table-cell' },
  { key: 'year5', label: 'ממוצע 5 שנים', numeric: true, hideOn: 'hidden xl:table-cell' },
  { key: 'fee', label: 'דמי ניהול', numeric: true },
  { key: 'assets', label: 'נכסים (₪)', numeric: true, hideOn: 'hidden lg:table-cell' },
];

interface Props {
  funds: Fund[] | undefined;
  loading?: boolean;
  /** Rendered under the tray — the comparison view owned by the page. */
  children?: (selected: Fund[], remove: (id: string) => void, clear: () => void) => React.ReactNode;
}

export default function FundExplorer({ funds, loading, children }: Props) {
  const x = useFundExplorer(funds);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selectedSet = new Set(x.selectedIds);

  return (
    <div className="space-y-6">
      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div>
        <label htmlFor="fund-search" className="sr-only">חיפוש קופה לפי שם, מספר או חברה</label>
        <div className="relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 start-4 w-5 h-5 pointer-events-none"
            style={{ color: MUTED }}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <input
            id="fund-search"
            type="search"
            value={x.query}
            onChange={(e) => x.setQuery(e.target.value)}
            placeholder="חיפוש לפי שם קופה, מספר קופה או חברה מנהלת"
            className="w-full ps-12 pe-12 py-4 rounded-xl bg-white border text-[16px] text-[#1D2D3D] placeholder:text-[#5a6a78] focus:outline-none focus:border-[#1D2D3D] transition-colors"
            style={{ borderColor: LINE }}
          />
          {x.query && (
            <button
              type="button"
              onClick={() => x.setQuery('')}
              aria-label="ניקוי החיפוש"
              className="absolute top-1/2 -translate-y-1/2 end-4 w-8 h-8 grid place-items-center rounded-lg hover:bg-[#E7EDF1] transition-colors"
            >
              <X className="w-4 h-4" style={{ color: MUTED }} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── Product category tabs ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="סוג מוצר">
        {PRODUCT_ORDER.map((p) => {
          const active = x.productType === p;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => x.setProductType(p)}
              className="px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors min-h-[44px] border"
              style={
                active
                  ? { backgroundColor: NAVY, color: '#fff', borderColor: NAVY }
                  : { backgroundColor: '#fff', color: BODY, borderColor: LINE }
              }
            >
              {productTypeLabels[p]}
            </button>
          );
        })}
      </div>

      {/* ── Result count + filter toggle ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-b py-3" style={{ borderColor: LINE }}>
        <span className="text-[14px]" style={{ color: BODY }}>
          <span className="tabular-nums font-medium" dir="ltr" style={{ fontFamily: MONO, color: NAVY }}>
            {x.results.length.toLocaleString('en-US')}
          </span>{' '}
          {x.results.length === 1 ? 'קופה' : 'קופות'}
          {x.results.length !== x.poolSize && (
            <span style={{ color: MUTED }}>
              {' '}מתוך{' '}
              <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>
                {x.poolSize.toLocaleString('en-US')}
              </span>
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center gap-2 text-[14px] hover:text-[#1D2D3D] transition-colors min-h-[44px]"
          style={{ color: filtersOpen || x.activeFilterCount ? NAVY : MUTED }}
        >
          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          סינון מתקדם
          {x.activeFilterCount > 0 && (
            <span
              className="tabular-nums px-1.5 py-0.5 rounded text-[11px] text-white"
              dir="ltr"
              style={{ fontFamily: MONO, backgroundColor: NAVY }}
            >
              {x.activeFilterCount}
            </span>
          )}
        </button>

        {(x.activeFilterCount > 0 || x.query) && (
          <button
            type="button"
            onClick={x.clearFilters}
            className="text-[13px] underline underline-offset-4 hover:text-[#1D2D3D] transition-colors"
            style={{ color: MUTED }}
          >
            ניקוי הכל
          </button>
        )}

        <div className="ms-auto flex items-center gap-2">
          <span className="text-[13px]" style={{ color: MUTED }}>השוואה מהירה:</span>
          {[3, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => x.compareTop(n)}
              disabled={x.results.length === 0}
              className="px-3 py-1.5 rounded-lg border text-[13px] font-medium hover:bg-[#F4F8F7] transition-colors disabled:opacity-40 disabled:pointer-events-none"
              style={{ borderColor: LINE, color: NAVY }}
            >
              <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>{n}</span> המובילות
            </button>
          ))}
        </div>
      </div>

      {/* ── Advanced filters ───────────────────────────────────────── */}
      {filtersOpen && (
        <div className="rounded-xl border p-5 space-y-6" style={{ borderColor: LINE }}>
          <fieldset>
            <legend className="text-[13px] font-medium mb-3" style={{ color: NAVY }}>חברה מנהלת</legend>
            <div className="flex flex-wrap gap-2">
              {x.availableCompanies.map((c) => {
                const on = x.companies.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => x.toggleCompany(c.value)}
                    className="px-3 py-2 rounded-lg border text-[13px] transition-colors min-h-[40px]"
                    style={on ? { backgroundColor: NAVY, color: '#fff', borderColor: NAVY } : { borderColor: LINE, color: BODY }}
                  >
                    {c.label}{' '}
                    <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO, opacity: 0.65 }}>{c.count}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[13px] font-medium mb-3" style={{ color: NAVY }}>מסלול השקעה</legend>
            <div className="flex flex-wrap gap-2">
              {x.availableSpecializations.map((s) => {
                const on = x.specializations.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => x.toggleSpecialization(s.value)}
                    className="px-3 py-2 rounded-lg border text-[13px] transition-colors min-h-[40px]"
                    style={on ? { backgroundColor: NAVY, color: '#fff', borderColor: NAVY } : { borderColor: LINE, color: BODY }}
                  >
                    {s.label}{' '}
                    <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO, opacity: 0.65 }}>{s.count}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[13px] font-medium mb-3" style={{ color: NAVY }}>
              חשיפה למניות{' '}
              <span className="tabular-nums font-normal" dir="ltr" style={{ fontFamily: MONO, color: MUTED }}>
                {x.stockRange[0]}%–{x.stockRange[1]}%
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {([[0, 100, 'הכל'], [0, 25, 'סולידי'], [25, 60, 'מעורב'], [60, 100, 'מוטה מניות']] as const).map(
                ([lo, hi, label]) => {
                  const on = x.stockRange[0] === lo && x.stockRange[1] === hi;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => x.setStockRange([lo, hi])}
                      className="px-3 py-2 rounded-lg border text-[13px] transition-colors min-h-[40px]"
                      style={on ? { backgroundColor: NAVY, color: '#fff', borderColor: NAVY } : { borderColor: LINE, color: BODY }}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>
        </div>
      )}

      {/* ── Compare tray ───────────────────────────────────────────── */}
      {x.selectedFunds.length > 0 && (
        <div className="rounded-xl p-4 sm:p-5" style={{ backgroundColor: NAVY }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-3">
            <span className="text-[13px] text-white">
              <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>
                {x.selectedFunds.length}/{MAX_COMPARE}
              </span>{' '}
              קופות בהשוואה
            </span>
            <button
              type="button"
              onClick={x.clearSelection}
              className="text-[13px] underline underline-offset-4 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,.7)' }}
            >
              ניקוי ההשוואה
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {x.selectedFunds.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => x.removeFund(f.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-[13px] text-white hover:bg-white/20 transition-colors"
              >
                <span className="max-w-[220px] truncate">{f.name}</span>
                <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="sr-only">הסרה מההשוואה</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The page supplies the comparison view for whatever is in the tray. */}
      {children?.(x.selectedFunds, x.removeFund, x.clearSelection)}

      {/* ── Results ────────────────────────────────────────────────── */}
      {loading && x.results.length === 0 ? (
        <p className="py-10 text-center text-[15px]" style={{ color: MUTED }}>טוען את מאגר הקופות...</p>
      ) : x.results.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="text-xl mb-2" style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}>
            לא נמצאו קופות שמתאימות לחיפוש
          </h3>
          <p className="text-[15px] mb-5" style={{ color: BODY }}>
            אפשר לנסות שם חלקי, מספר קופה, או לנקות את הסינון.
          </p>
          <button
            type="button"
            onClick={x.clearFilters}
            className="px-5 py-3 rounded-lg text-[14px] font-medium text-white min-h-[44px]"
            style={{ backgroundColor: NAVY }}
          >
            ניקוי הסינון
          </button>
        </div>
      ) : (
        <>
          {/* Desktop: sortable table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="dna-data">
              <thead>
                <tr>
                  <th scope="col" className="w-10">
                    <span className="sr-only">בחירה להשוואה</span>
                  </th>
                  {COLUMNS.map((c) => {
                    const active = x.sortKey === c.key;
                    return (
                      <th key={c.key} scope="col" className={c.hideOn ?? ''} aria-sort={active ? (x.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          onClick={() => x.sortBy(c.key)}
                          className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        >
                          {c.label}
                          <ArrowUpDown
                            className="w-3 h-3"
                            style={{ opacity: active ? 1 : 0.4 }}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {x.results.slice(0, 100).map((f) => {
                  const on = selectedSet.has(f.id);
                  const disabled = !on && x.isFull;
                  return (
                    <tr
                      key={f.id}
                      onClick={() => !disabled && x.toggleFund(f.id)}
                      className={disabled ? '' : 'cursor-pointer hover:bg-[#F4F8F7]'}
                      style={on ? { backgroundColor: '#F4F8F7' } : undefined}
                    >
                      <td>
                        <span
                          aria-hidden="true"
                          className="w-5 h-5 grid place-items-center rounded border"
                          style={on ? { backgroundColor: NAVY, borderColor: NAVY } : { borderColor: '#c7d2da' }}
                        >
                          {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                        </span>
                      </td>
                      <td>
                        <span className="block">{f.name}</span>
                        <span className="block text-[12px] font-normal" style={{ color: MUTED }}>
                          {companyLabels[f.company] ?? ''} · {specializationLabels[f.specialization] ?? ''}
                          {' · '}
                          <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>{f.fundNumber}</span>
                        </span>
                      </td>
                      <td className="num"><ReturnCell value={f.returns.year1} /></td>
                      <td className="num hidden lg:table-cell"><ReturnCell value={f.returns.year3} /></td>
                      <td className="num hidden xl:table-cell"><ReturnCell value={f.returns.year5} /></td>
                      <td className="num">
                        <span dir="ltr" style={{ fontFamily: MONO, color: GOLD_TEXT }}>
                          {pct(f.fees.savingsFeePercent)}
                        </span>
                      </td>
                      <td className="num hidden lg:table-cell">
                        <span dir="ltr" style={{ fontFamily: MONO }}>{formatAssets(f.totalAssets)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards, because a seven-column table at 390px is unreadable */}
          <div className="sm:hidden divide-y" style={{ borderColor: LINE }}>
            {x.results.slice(0, 60).map((f) => {
              const on = selectedSet.has(f.id);
              const disabled = !on && x.isFull;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => !disabled && x.toggleFund(f.id)}
                  disabled={disabled}
                  aria-pressed={on}
                  className="w-full text-start py-4 flex gap-3 disabled:opacity-45"
                  style={on ? { backgroundColor: '#F4F8F7' } : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 w-5 h-5 shrink-0 grid place-items-center rounded border"
                    style={on ? { backgroundColor: NAVY, borderColor: NAVY } : { borderColor: '#c7d2da' }}
                  >
                    {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium" style={{ color: NAVY }}>{f.name}</span>
                    <span className="block text-[12px] mt-0.5" style={{ color: MUTED }}>
                      {companyLabels[f.company] ?? ''} · {specializationLabels[f.specialization] ?? ''}
                    </span>
                    <span className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[13px]">
                      <span style={{ color: MUTED }}>
                        מתחילת השנה <ReturnCell value={f.returns.year1} />
                      </span>
                      <span style={{ color: MUTED }}>
                        דמי ניהול{' '}
                        <span dir="ltr" style={{ fontFamily: MONO, color: GOLD_TEXT }}>
                          {pct(f.fees.savingsFeePercent)}
                        </span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {x.results.length > 100 && (
            <p className="text-[13px] pt-2" style={{ color: MUTED }}>
              מוצגות{' '}
              <span className="tabular-nums" dir="ltr" style={{ fontFamily: MONO }}>100</span>{' '}
              הקופות הראשונות לפי הסידור הנוכחי. אפשר לצמצם עם חיפוש או סינון.
            </p>
          )}
        </>
      )}
    </div>
  );
}
