import { useState, type CSSProperties } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { Fund, ProductType } from '@/types/fund';
import { productTypeLabels, companyLabels, specializationLabels } from '@/types/fund';
import { useFundExplorer, MAX_COMPARE, type SortKey } from '@/hooks/useFundExplorer';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BODY, GREEN, IVORY, LINE, MUTED, RUST_TEXT, SAGE_ON_GREEN, SAND_TEXT, TINT_SAGE } from '@/lib/brand';

/*
  FundExplorer (SEELD brand system 2026-09): one search field, results that
  update as you type, a sortable table.dna-data and a tray that collects what
  you picked. Filters are secondary and folded away until asked for. Every
  query, filter, sort and compare action lives in useFundExplorer unchanged.
*/

const PRODUCT_ORDER: ProductType[] = ['hishtalmut', 'gemel', 'pensia', 'gemel_invest', 'polisa'];

const TH: CSSProperties = { fontSize: 14 };
const NONE = 'אין נתון';
const missing = (v: number | null | undefined) => v === null || v === undefined || Number.isNaN(v);

const pct = (v: number | null | undefined) => (missing(v) ? NONE : `${(v as number).toFixed(2)}%`);

// Assets arrive in millions ILS; past a billion the millions read as noise.
const formatAssets = (millions: number | null) => {
  if (missing(millions)) return NONE;
  const m = millions as number;
  return m >= 1000
    ? `${(m / 1000).toLocaleString('he-IL', { maximumFractionDigits: 1 })} מיליארד`
    : `${Math.round(m).toLocaleString('he-IL')} מיליון`;
};

/** Returns read better with a sign; a missing value is named, never 0. */
const ReturnCell = ({ value }: { value: number | null | undefined }) => {
  if (missing(value)) {
    return <span style={{ color: MUTED }}>{NONE}</span>;
  }
  const v = value as number;
  return (
    <span dir="ltr" className="tabular-nums font-bold whitespace-nowrap" style={{ color: v < 0 ? RUST_TEXT : GREEN }}>
      {v > 0 ? '+' : ''}
      {v.toFixed(2)}%
    </span>
  );
};

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'קופה', numeric: false },
  { key: 'ytd', label: 'מתחילת השנה', numeric: true },
  { key: 'year3', label: 'ממוצע 3 שנים', numeric: true },
  { key: 'year5', label: 'ממוצע 5 שנים', numeric: true },
  { key: 'fee', label: 'דמי ניהול', numeric: true },
  { key: 'assets', label: 'נכסים (₪)', numeric: true },
];

const chipStyle = (on: boolean): CSSProperties =>
  on
    ? { backgroundColor: GREEN, color: IVORY, borderColor: GREEN }
    : { backgroundColor: '#ffffff', color: BODY, borderColor: LINE };

const chipClass = 'inline-flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-[14px] font-bold transition-colors min-h-[44px]';

interface Props {
  funds: Fund[] | undefined;
  loading?: boolean;
  /** The live database could not be reached; the static snapshot is shown. */
  error?: boolean;
  /** Rendered under the tray: the comparison view owned by the page. */
  children?: (selected: Fund[], remove: (id: string) => void, clear: () => void) => React.ReactNode;
}

export default function FundExplorer({ funds, loading, error, children }: Props) {
  const x = useFundExplorer(funds);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selectedSet = new Set(x.selectedIds);

  return (
    <div className="space-y-6">
      {/* ── Search ─────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="fund-search" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
          חיפוש קופה
        </label>
        <div className="relative">
          <input
            id="fund-search"
            type="search"
            value={x.query}
            onChange={(e) => x.setQuery(e.target.value)}
            placeholder="שם קופה, מספר קופה או חברה מנהלת"
            className="field pe-12"
            autoComplete="off"
          />
          {x.query ? (
            <button
              type="button"
              onClick={() => x.setQuery('')}
              className="absolute top-1/2 -translate-y-1/2 end-2 grid h-10 w-10 place-items-center rounded-[10px] transition-colors hover:bg-[#E8EDE5]"
              style={{ color: MUTED }}
            >
              <BrandIcon name="close" size={18} label="ניקוי החיפוש" />
            </button>
          ) : (
            <BrandIcon
              name="search"
              size={20}
              className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-4"
              style={{ color: MUTED }}
            />
          )}
        </div>
      </div>

      {/* ── Product category ───────────────────────────────────────── */}
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
              className={chipClass}
              style={chipStyle(active)}
            >
              {productTypeLabels[p]}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="dna-callout text-[15px]" role="status">
          המאגר העדכני לא זמין כרגע. מוצגים נתונים מקומיים מהעדכון האחרון שנשמר.
        </p>
      )}

      {/* ── Result count + filter toggle ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-b py-3" style={{ borderColor: LINE }}>
        <span className="text-[15px]" style={{ color: BODY }}>
          <span className="tabular-nums font-bold" dir="ltr" style={{ color: GREEN }}>
            {x.results.length.toLocaleString('en-US')}
          </span>{' '}
          {x.results.length === 1 ? 'קופה' : 'קופות'}
          {x.results.length !== x.poolSize && (
            <span style={{ color: MUTED }}>
              {' '}מתוך{' '}
              <span className="tabular-nums" dir="ltr">{x.poolSize.toLocaleString('en-US')}</span>
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center gap-2 text-[15px] font-bold transition-colors min-h-[44px]"
          style={{ color: filtersOpen || x.activeFilterCount ? GREEN : MUTED }}
        >
          <BrandIcon name="settings" size={18} />
          סינון מתקדם
          {x.activeFilterCount > 0 && (
            <span
              className="tabular-nums rounded-[6px] px-1.5 py-0.5 text-[13px]"
              dir="ltr"
              style={{ backgroundColor: GREEN, color: IVORY }}
            >
              {x.activeFilterCount}
            </span>
          )}
        </button>

        {(x.activeFilterCount > 0 || x.query) && (
          <button
            type="button"
            onClick={x.clearFilters}
            className="text-[14px] underline underline-offset-4 transition-colors min-h-[44px]"
            style={{ color: MUTED }}
          >
            ניקוי הכל
          </button>
        )}

        <div className="ms-auto flex flex-wrap items-center gap-2">
          <span className="text-[14px]" style={{ color: MUTED }}>השוואה מהירה:</span>
          {[3, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => x.compareTop(n)}
              disabled={x.results.length === 0}
              className="rounded-[10px] border px-3 py-1.5 text-[14px] font-bold transition-colors min-h-[44px] hover:bg-[#EEF2EC] disabled:opacity-40 disabled:pointer-events-none"
              style={{ borderColor: LINE, color: GREEN }}
            >
              <span className="tabular-nums" dir="ltr">{n}</span> המובילות
            </button>
          ))}
        </div>
      </div>

      {/* ── Advanced filters ───────────────────────────────────────── */}
      {filtersOpen && (
        <div className="dna-concept space-y-6">
          <fieldset>
            <legend className="text-[14px] font-bold mb-3" style={{ color: GREEN }}>חברה מנהלת</legend>
            <div className="flex flex-wrap gap-2">
              {x.availableCompanies.map((c) => {
                const on = x.companies.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => x.toggleCompany(c.value)}
                    className={chipClass}
                    style={chipStyle(on)}
                  >
                    {c.label}
                    <span className="tabular-nums font-normal" dir="ltr" style={{ opacity: 0.75 }}>{c.count}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[14px] font-bold mb-3" style={{ color: GREEN }}>מסלול השקעה</legend>
            <div className="flex flex-wrap gap-2">
              {x.availableSpecializations.map((s) => {
                const on = x.specializations.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => x.toggleSpecialization(s.value)}
                    className={chipClass}
                    style={chipStyle(on)}
                  >
                    {s.label}
                    <span className="tabular-nums font-normal" dir="ltr" style={{ opacity: 0.75 }}>{s.count}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[14px] font-bold mb-3" style={{ color: GREEN }}>
              חשיפה למניות{' '}
              <span className="tabular-nums font-normal" dir="ltr" style={{ color: MUTED }}>
                {x.stockRange[0]}% - {x.stockRange[1]}%
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
                      className={chipClass}
                      style={chipStyle(on)}
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
        <div className="rounded-[12px] p-4 sm:p-5" style={{ backgroundColor: GREEN }}>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[15px] font-bold" style={{ color: IVORY }}>
              <span className="tabular-nums" dir="ltr">{x.selectedFunds.length}/{MAX_COMPARE}</span>{' '}
              קופות בהשוואה
            </span>
            <button
              type="button"
              onClick={x.clearSelection}
              className="text-[14px] underline underline-offset-4 transition-colors min-h-[44px]"
              style={{ color: SAGE_ON_GREEN }}
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
                className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-[14px] transition-colors min-h-[44px]"
                style={{ backgroundColor: 'rgba(250,247,239,0.12)', color: IVORY }}
              >
                <span className="max-w-[220px] truncate">{f.name}</span>
                <BrandIcon name="close" size={16} className="shrink-0" />
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
        <p className="py-10 text-center text-[16px]" style={{ color: MUTED }} role="status">
          טוען את מאגר הקופות...
        </p>
      ) : x.results.length === 0 ? (
        <div className="dna-concept py-10 text-center" role="status">
          <h3 className="text-[20px] mb-2" style={{ color: GREEN }}>
            לא נמצאו קופות שמתאימות לחיפוש
          </h3>
          <p className="text-[16px] mb-5" style={{ color: BODY }}>
            אפשר לנסות שם חלקי, מספר קופה, או לנקות את הסינון.
          </p>
          <button type="button" onClick={x.clearFilters} className="btn-primary">
            ניקוי הסינון
          </button>
        </div>
      ) : (
        <>
          {/* Desktop and tablet: sortable table */}
          <div className="hidden sm:block overflow-x-auto rounded-[10px]">
            <table className="dna-data min-w-[760px]" style={{ fontSize: 15 }}>
              <caption className="sr-only">תוצאות החיפוש. לחיצה על שורה מוסיפה את הקופה להשוואה.</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-12" style={TH}>
                    <span className="sr-only">בחירה להשוואה</span>
                  </th>
                  {COLUMNS.map((c) => {
                    const active = x.sortKey === c.key;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        style={TH}
                        aria-sort={active ? (x.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <button
                          type="button"
                          onClick={() => x.sortBy(c.key)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap transition-opacity hover:opacity-80"
                        >
                          {c.label}
                          <ArrowUpDown className="h-3.5 w-3.5" style={{ opacity: active ? 1 : 0.45 }} strokeWidth={1.75} aria-hidden="true" />
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
                      className={disabled ? '' : 'cursor-pointer hover:bg-[#EEF2EC]'}
                      style={on ? { backgroundColor: TINT_SAGE } : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          aria-label={on ? `הסרת ${f.name} מההשוואה` : `הוספת ${f.name} להשוואה`}
                          disabled={disabled}
                          onClick={(e) => { e.stopPropagation(); x.toggleFund(f.id); }}
                          className="grid h-6 w-6 place-items-center rounded-[6px] border transition-colors disabled:opacity-40"
                          style={on ? { backgroundColor: GREEN, borderColor: GREEN } : { borderColor: LINE, backgroundColor: '#ffffff' }}
                        >
                          {on && <BrandIcon name="check" size={16} style={{ color: IVORY }} />}
                        </button>
                      </td>
                      <td>
                        <span className="block">{f.name}</span>
                        <span className="block text-[14px] font-normal" style={{ color: MUTED }}>
                          {companyLabels[f.company] ?? ''} · {specializationLabels[f.specialization] ?? ''}
                          {' · '}
                          <span className="tabular-nums" dir="ltr">{f.fundNumber}</span>
                        </span>
                      </td>
                      <td className="num"><ReturnCell value={f.returns.year1} /></td>
                      <td className="num"><ReturnCell value={f.returns.year3} /></td>
                      <td className="num"><ReturnCell value={f.returns.year5} /></td>
                      <td className="num">
                        <span dir="ltr" style={{ color: missing(f.fees.savingsFeePercent) ? MUTED : SAND_TEXT }}>
                          {missing(f.fees.savingsFeePercent) ? 'לא פורסם' : pct(f.fees.savingsFeePercent)}
                        </span>
                      </td>
                      <td className="num">
                        <span dir="ltr" style={{ color: missing(f.totalAssets) ? MUTED : BODY }}>{formatAssets(f.totalAssets)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phone: stacked rows carry the same figures as the table */}
          <div className="sm:hidden border-t" style={{ borderColor: LINE }}>
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
                  className="flex w-full gap-3 border-b py-4 text-start disabled:opacity-45"
                  style={{ borderColor: LINE, backgroundColor: on ? TINT_SAGE : undefined }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[6px] border"
                    style={on ? { backgroundColor: GREEN, borderColor: GREEN } : { borderColor: LINE, backgroundColor: '#ffffff' }}
                  >
                    {on && <BrandIcon name="check" size={16} style={{ color: IVORY }} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold" style={{ color: GREEN }}>{f.name}</span>
                    <span className="mt-0.5 block text-[14px]" style={{ color: MUTED }}>
                      {companyLabels[f.company] ?? ''} · {specializationLabels[f.specialization] ?? ''}
                      {' · '}
                      <span className="tabular-nums" dir="ltr">{f.fundNumber}</span>
                    </span>
                    <span className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[14px]" style={{ color: MUTED }}>
                      <span>מתחילת השנה: <ReturnCell value={f.returns.year1} /></span>
                      <span>ממוצע 3 שנים: <ReturnCell value={f.returns.year3} /></span>
                      <span>ממוצע 5 שנים: <ReturnCell value={f.returns.year5} /></span>
                      <span>
                        דמי ניהול:{' '}
                        <span dir="ltr" className="tabular-nums font-bold" style={{ color: missing(f.fees.savingsFeePercent) ? MUTED : SAND_TEXT }}>
                          {missing(f.fees.savingsFeePercent) ? 'לא פורסם' : pct(f.fees.savingsFeePercent)}
                        </span>
                      </span>
                      <span className="col-span-2">
                        נכסים:{' '}
                        <span dir="ltr" className="tabular-nums" style={{ color: BODY }}>{formatAssets(f.totalAssets)} ₪</span>
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {x.results.length > 100 && (
            <p className="hidden sm:block pt-2 text-[14px]" style={{ color: MUTED }}>
              מוצגות <span className="tabular-nums" dir="ltr">100</span> הקופות הראשונות לפי הסידור הנוכחי. אפשר לצמצם עם חיפוש או סינון.
            </p>
          )}
          {x.results.length > 60 && (
            <p className="sm:hidden pt-2 text-[14px]" style={{ color: MUTED }}>
              מוצגות <span className="tabular-nums" dir="ltr">60</span> הקופות הראשונות לפי הסידור הנוכחי. אפשר לצמצם עם חיפוש או סינון.
            </p>
          )}
        </>
      )}
    </div>
  );
}
