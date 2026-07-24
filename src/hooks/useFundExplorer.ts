import { useMemo, useState, useCallback } from 'react';
import type { Fund, ProductType, ManagingCompany, Specialization } from '@/types/fund';
import { companyLabels, specializationLabels } from '@/types/fund';
import { allFunds as staticFunds } from '@/data/cmaFundsData';

/**
 * useFundExplorer — the fund comparison search, reworked around one idea:
 * results update as you type, and the list is never empty.
 *
 * The previous screener (useFundSearch) asked the visitor to pick one of three
 * modes, fill in filters and press a button before anything appeared. Here the
 * whole state is a live query: filters narrow, sorting reorders, and with an
 * empty query you still get the whole product category ranked by return.
 */

export type SortKey = 'ytd' | 'year3' | 'year5' | 'fee' | 'assets' | 'name';
export type SortDir = 'asc' | 'desc';

export const MAX_COMPARE = 8;

/** Number formatting that keeps missing data honest instead of showing 0%. */
export const isMissing = (v: number | null | undefined) => v === null || v === undefined;

interface ExplorerState {
  query: string;
  productType: ProductType;
  companies: ManagingCompany[];
  specializations: Specialization[];
  stockRange: [number, number];
  sortKey: SortKey;
  sortDir: SortDir;
  selectedIds: string[];
}

const initialState: ExplorerState = {
  query: '',
  productType: 'hishtalmut',
  companies: [],
  specializations: [],
  stockRange: [0, 100],
  sortKey: 'ytd',
  sortDir: 'desc',
  selectedIds: [],
};

/** Sort keys map onto the Fund shape; nulls always sink, in both directions. */
function valueFor(fund: Fund, key: SortKey): number | string | null {
  switch (key) {
    case 'ytd': return fund.returns.year1 ?? null;
    case 'year3': return fund.returns.year3 ?? null;
    case 'year5': return fund.returns.year5 ?? null;
    case 'fee': return fund.fees.savingsFeePercent ?? null;
    case 'assets': return fund.totalAssets ?? null;
    case 'name': return fund.name;
  }
}

function compareFunds(a: Fund, b: Fund, key: SortKey, dir: SortDir): number {
  const av = valueFor(a, key);
  const bv = valueFor(b, key);

  // Funds with no figure for this column sink to the bottom either way — a
  // missing 5-year return is not the same as a 0% five-year return.
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;

  if (typeof av === 'string' || typeof bv === 'string') {
    const cmp = String(av).localeCompare(String(bv), 'he');
    return dir === 'asc' ? cmp : -cmp;
  }
  return dir === 'asc' ? av - bv : bv - av;
}

export function useFundExplorer(liveFunds?: Fund[]) {
  const allFunds = liveFunds && liveFunds.length > 0 ? liveFunds : staticFunds;
  const [state, setState] = useState<ExplorerState>(initialState);

  const poolForProduct = useMemo(
    () => allFunds.filter((f) => f.productType === state.productType),
    [allFunds, state.productType]
  );

  /** Companies and specializations actually present in this product category,
   *  with a count, so the filter list never offers a dead end. */
  const availableCompanies = useMemo(() => {
    const counts = new Map<ManagingCompany, number>();
    for (const f of poolForProduct) counts.set(f.company, (counts.get(f.company) ?? 0) + 1);
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count, label: companyLabels[value] ?? value }))
      .sort((a, b) => b.count - a.count);
  }, [poolForProduct]);

  const availableSpecializations = useMemo(() => {
    const counts = new Map<Specialization, number>();
    for (const f of poolForProduct) counts.set(f.specialization, (counts.get(f.specialization) ?? 0) + 1);
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count, label: specializationLabels[value] ?? value }))
      .sort((a, b) => b.count - a.count);
  }, [poolForProduct]);

  /** The live result list — recomputed on every keystroke, no submit step. */
  const results = useMemo(() => {
    const q = state.query.trim().toLowerCase();
    let out = poolForProduct;

    if (q) {
      out = out.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.fundNumber.includes(q) ||
          (companyLabels[f.company] ?? '').toLowerCase().includes(q)
      );
    }
    if (state.companies.length) out = out.filter((f) => state.companies.includes(f.company));
    if (state.specializations.length) out = out.filter((f) => state.specializations.includes(f.specialization));

    const [lo, hi] = state.stockRange;
    if (lo !== 0 || hi !== 100) {
      out = out.filter((f) => f.stockExposure !== null && f.stockExposure >= lo && f.stockExposure <= hi);
    }

    return [...out].sort((a, b) => compareFunds(a, b, state.sortKey, state.sortDir));
  }, [poolForProduct, state.query, state.companies, state.specializations, state.stockRange, state.sortKey, state.sortDir]);

  const selectedFunds = useMemo(
    () => state.selectedIds.map((id) => allFunds.find((f) => f.id === id)).filter((f): f is Fund => Boolean(f)),
    [allFunds, state.selectedIds]
  );

  const activeFilterCount =
    state.companies.length +
    state.specializations.length +
    (state.stockRange[0] !== 0 || state.stockRange[1] !== 100 ? 1 : 0);

  // ── actions ──────────────────────────────────────────────────────────

  const setQuery = useCallback((query: string) => setState((s) => ({ ...s, query })), []);

  const setProductType = useCallback((productType: ProductType) => {
    // Filters are per-category — a company that manages study funds may not
    // manage pension funds, so carrying them over would silently empty the list.
    setState((s) => ({ ...s, productType, companies: [], specializations: [], stockRange: [0, 100] }));
  }, []);

  const toggleCompany = useCallback((company: ManagingCompany) => {
    setState((s) => ({
      ...s,
      companies: s.companies.includes(company)
        ? s.companies.filter((c) => c !== company)
        : [...s.companies, company],
    }));
  }, []);

  const toggleSpecialization = useCallback((spec: Specialization) => {
    setState((s) => ({
      ...s,
      specializations: s.specializations.includes(spec)
        ? s.specializations.filter((x) => x !== spec)
        : [...s.specializations, spec],
    }));
  }, []);

  const setStockRange = useCallback((stockRange: [number, number]) => setState((s) => ({ ...s, stockRange })), []);

  /** Clicking a column header sorts by it; clicking the active one flips it. */
  const sortBy = useCallback((key: SortKey) => {
    setState((s) =>
      s.sortKey === key
        ? { ...s, sortDir: s.sortDir === 'desc' ? 'asc' : 'desc' }
        : { ...s, sortKey: key, sortDir: key === 'name' || key === 'fee' ? 'asc' : 'desc' }
    );
  }, []);

  const toggleFund = useCallback((fundId: string) => {
    setState((s) => {
      if (s.selectedIds.includes(fundId)) {
        return { ...s, selectedIds: s.selectedIds.filter((id) => id !== fundId) };
      }
      if (s.selectedIds.length >= MAX_COMPARE) return s;
      return { ...s, selectedIds: [...s.selectedIds, fundId] };
    });
  }, []);

  const removeFund = useCallback((fundId: string) => {
    setState((s) => ({ ...s, selectedIds: s.selectedIds.filter((id) => id !== fundId) }));
  }, []);

  const clearSelection = useCallback(() => setState((s) => ({ ...s, selectedIds: [] })), []);

  const clearFilters = useCallback(
    () => setState((s) => ({ ...s, query: '', companies: [], specializations: [], stockRange: [0, 100] })),
    []
  );

  /** Put the current top of the list straight into the comparison. */
  const compareTop = useCallback(
    (count: number) => setState((s) => ({ ...s, selectedIds: results.slice(0, count).map((f) => f.id) })),
    [results]
  );

  return {
    ...state,
    results,
    selectedFunds,
    poolSize: poolForProduct.length,
    availableCompanies,
    availableSpecializations,
    activeFilterCount,
    isFull: state.selectedIds.length >= MAX_COMPARE,
    setQuery,
    setProductType,
    toggleCompany,
    toggleSpecialization,
    setStockRange,
    sortBy,
    toggleFund,
    removeFund,
    clearSelection,
    clearFilters,
    compareTop,
  };
}
