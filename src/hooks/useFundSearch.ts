import { useState, useMemo, useCallback } from 'react';
import type { Fund, ProductType, ManagingCompany, Specialization } from '@/types/fund';
import { allFunds as staticFunds } from '@/data/cmaFundsData';

export type SearchMode = 'top' | 'browse' | 'direct';
export type ReturnPeriod = 'year1' | 'year2' | 'year3' | 'year5';

interface UseFundSearchState {
  // מצב חיפוש
  mode: SearchMode;
  productType: ProductType;

  // מצב 1: איתור קופות אטרקטיביות
  returnPeriod: ReturnPeriod;
  topCount: 3 | 5 | 8;
  selectedCompanies: ManagingCompany[];
  selectedSpecializations: Specialization[];
  stockRange: [number, number];

  // מצב 2: חיפוש לפי חברה/התמחות
  browseBy: 'company' | 'specialization';
  browseValue: string;

  // מצב 3: חיפוש ישיר
  directQuery: string;

  // תוצאות
  results: Fund[];
  selectedFunds: Fund[]; // עד 8 קופות להשוואה
}

const initialState: UseFundSearchState = {
  mode: 'top',
  productType: 'hishtalmut',
  returnPeriod: 'year1',
  topCount: 5,
  selectedCompanies: [],
  selectedSpecializations: [],
  stockRange: [0, 100],
  browseBy: 'company',
  browseValue: '',
  directQuery: '',
  results: [],
  selectedFunds: [],
};

// Helper functions that work on any fund array
const getFundsByProduct = (funds: Fund[], type: ProductType) =>
  funds.filter((f) => f.productType === type);

const getCompaniesForProduct = (funds: Fund[], type: ProductType): ManagingCompany[] =>
  [...new Set(getFundsByProduct(funds, type).map((f) => f.company))];

const getSpecializationsForProduct = (funds: Fund[], type: ProductType): Specialization[] =>
  [...new Set(getFundsByProduct(funds, type).map((f) => f.specialization))];

const searchFundsIn = (funds: Fund[], query: string, productType?: ProductType) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = productType ? getFundsByProduct(funds, productType) : funds;
  return pool.filter((f) => f.name.toLowerCase().includes(q) || f.fundNumber.includes(q));
};

const getTopFundsIn = (
  funds: Fund[],
  productType: ProductType,
  returnPeriod: 'year1' | 'year2' | 'year3' | 'year5',
  count: number,
  companies?: ManagingCompany[],
  specializations?: Specialization[],
  stockRange?: [number, number]
): Fund[] => {
  let pool = getFundsByProduct(funds, productType);
  if (companies && companies.length > 0) pool = pool.filter((f) => companies.includes(f.company));
  if (specializations && specializations.length > 0) pool = pool.filter((f) => specializations.includes(f.specialization));
  if (stockRange) pool = pool.filter((f) => f.stockExposure >= stockRange[0] && f.stockExposure <= stockRange[1]);
  return pool.sort((a, b) => b.returns[returnPeriod] - a.returns[returnPeriod]).slice(0, count);
};

/**
 * @param liveFunds - optional live fund data from Supabase; falls back to static data
 */
export function useFundSearch(liveFunds?: Fund[]) {
  const allFunds = liveFunds && liveFunds.length > 0 ? liveFunds : staticFunds;
  const [state, setState] = useState<UseFundSearchState>(initialState);

  // חברות זמינות לפי סוג מוצר נבחר
  const availableCompanies = useMemo(
    () => getCompaniesForProduct(allFunds, state.productType),
    [allFunds, state.productType]
  );

  // התמחויות זמינות לפי סוג מוצר נבחר
  const availableSpecializations = useMemo(
    () => getSpecializationsForProduct(allFunds, state.productType),
    [allFunds, state.productType]
  );

  // רשימת קרנות זמינות לפי חברה (למצב browse)
  const availableFundsForBrowse = useMemo(() => {
    const pool = getFundsByProduct(allFunds, state.productType);
    if (state.browseBy === 'company' && state.browseValue) {
      return pool.filter((f) => f.company === state.browseValue);
    }
    if (state.browseBy === 'specialization' && state.browseValue) {
      return pool.filter((f) => f.specialization === state.browseValue);
    }
    return [];
  }, [allFunds, state.productType, state.browseBy, state.browseValue]);

  // autocomplete לחיפוש ישיר
  const autocompleteResults = useMemo(() => {
    if (state.directQuery.length < 2) return [];
    return searchFundsIn(allFunds, state.directQuery, state.productType).slice(0, 10);
  }, [allFunds, state.directQuery, state.productType]);

  // פעולות
  const setProductType = useCallback((productType: ProductType) => {
    setState((s) => ({
      ...s,
      productType,
      selectedCompanies: [],
      selectedSpecializations: [],
      browseValue: '',
      directQuery: '',
      results: [],
    }));
  }, []);

  const setMode = useCallback((mode: SearchMode) => {
    setState((s) => ({ ...s, mode, results: [] }));
  }, []);

  const setReturnPeriod = useCallback((returnPeriod: ReturnPeriod) => {
    setState((s) => ({ ...s, returnPeriod }));
  }, []);

  const setTopCount = useCallback((topCount: 3 | 5 | 8) => {
    setState((s) => ({ ...s, topCount }));
  }, []);

  const toggleCompany = useCallback((company: ManagingCompany) => {
    setState((s) => ({
      ...s,
      selectedCompanies: s.selectedCompanies.includes(company)
        ? s.selectedCompanies.filter((c) => c !== company)
        : [...s.selectedCompanies, company],
    }));
  }, []);

  const toggleSpecialization = useCallback((spec: Specialization) => {
    setState((s) => ({
      ...s,
      selectedSpecializations: s.selectedSpecializations.includes(spec)
        ? s.selectedSpecializations.filter((sp) => sp !== spec)
        : [...s.selectedSpecializations, spec],
    }));
  }, []);

  const setStockRange = useCallback((stockRange: [number, number]) => {
    setState((s) => ({ ...s, stockRange }));
  }, []);

  const setBrowseBy = useCallback((browseBy: 'company' | 'specialization') => {
    setState((s) => ({ ...s, browseBy, browseValue: '' }));
  }, []);

  const setBrowseValue = useCallback((browseValue: string) => {
    setState((s) => ({ ...s, browseValue }));
  }, []);

  const setDirectQuery = useCallback((directQuery: string) => {
    setState((s) => ({ ...s, directQuery }));
  }, []);

  // ביצוע חיפוש — מצב 1: אטרקטיביות
  const searchTop = useCallback(() => {
    const results = getTopFundsIn(
      allFunds,
      state.productType,
      state.returnPeriod,
      state.topCount,
      state.selectedCompanies.length > 0 ? state.selectedCompanies : undefined,
      state.selectedSpecializations.length > 0 ? state.selectedSpecializations : undefined,
      state.stockRange[0] === 0 && state.stockRange[1] === 100
        ? undefined
        : state.stockRange
    );
    setState((s) => ({ ...s, results, selectedFunds: results }));
  }, [allFunds, state.productType, state.returnPeriod, state.topCount, state.selectedCompanies, state.selectedSpecializations, state.stockRange]);

  // ביצוע חיפוש — מצב 2: חברה/התמחות
  const searchBrowse = useCallback(() => {
    setState((s) => ({ ...s, results: availableFundsForBrowse, selectedFunds: [...s.selectedFunds, ...availableFundsForBrowse].slice(0, 8) }));
  }, [availableFundsForBrowse]);

  // הוספת קופה בודדת להשוואה
  const addFund = useCallback((fund: Fund) => {
    setState((s) => {
      if (s.selectedFunds.length >= 8) return s;
      if (s.selectedFunds.some((f) => f.id === fund.id)) return s;
      return { ...s, selectedFunds: [...s.selectedFunds, fund] };
    });
  }, []);

  // הסרת קופה מההשוואה
  const removeFund = useCallback((fundId: string) => {
    setState((s) => ({
      ...s,
      selectedFunds: s.selectedFunds.filter((f) => f.id !== fundId),
    }));
  }, []);

  // ביצוע חיפוש — מצב 3: ישיר
  const searchDirect = useCallback(() => {
    const results = searchFundsIn(allFunds, state.directQuery, state.productType);
    setState((s) => ({ ...s, results }));
  }, [allFunds, state.directQuery, state.productType]);

  // איפוס
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    availableCompanies,
    availableSpecializations,
    availableFundsForBrowse,
    autocompleteResults,
    setProductType,
    setMode,
    setReturnPeriod,
    setTopCount,
    toggleCompany,
    toggleSpecialization,
    setStockRange,
    setBrowseBy,
    setBrowseValue,
    setDirectQuery,
    searchTop,
    searchBrowse,
    searchDirect,
    addFund,
    removeFund,
    reset,
  };
}
