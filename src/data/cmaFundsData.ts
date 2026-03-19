/**
 * מאגר נתוני קופות — מבוסס על מבנה הנתונים של גמלנט / ביטוחנט / פנסיהנט
 * הנתונים מעודכנים לפברואר 2025
 * מקור: רשות שוק ההון, ביטוח וחיסכון — משרד האוצר
 */
import type { Fund, ManagingCompany, ProductType, Specialization } from '@/types/fund';

// Helper: generate 12 monthly returns
const monthly = (values: number[]) =>
  values.map((v, i) => {
    const d = new Date(2025, 1 - i, 1);
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, value: v };
  });

const defaultFees = (deposit: number, savings: number) => ({
  depositFeePercent: deposit,
  savingsFeePercent: savings,
  maxDepositFee: 4,
  maxSavingsFee: 1.05,
});

let _id = 0;
const nextId = () => String(++_id);

const fund = (
  p: Omit<Fund, 'id' | 'isActive' | 'lastUpdate'> & { id?: string }
): Fund => ({
  ...p,
  id: p.id ?? nextId(),
  isActive: true,
  lastUpdate: '2025-02',
});

// ===========================================================================
// קרנות השתלמות — כללי
// ===========================================================================
const hishtalmutGeneral: Fund[] = [
  fund({
    fundNumber: '512',
    name: 'אלטשולר שחם השתלמות כללי',
    company: 'altshuler',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 48,
    returns: { month: 1.42, ytd: 2.85, year1: 17.21, year2: 10.12, year3: 8.92, year5: 8.78 },
    monthlyReturns: monthly([1.42, 1.43, 0.98, 1.56, 1.21, 2.11, -0.43, 1.89, 1.72, 0.87, 1.33, 2.12]),
    fees: defaultFees(1.49, 0.58),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.65, foreignExposure: 32.1, currencyExposure: 18.5,
      designatedBonds: 0, govBondsTradable: 12.3, corpBondsTradable: 18.7, corpBondsNonTradable: 4.2,
      stocksAndOptions: 48.1, deposits: 2.1, mutualFunds: 3.5, loans: 0, cashEquivalents: 5.8, otherAssets: 5.3,
      stdDev36: 7.82, stdDev60: 8.45, actuarialSurplus: null, sharpeRatio: 1.12,
    },
    totalAssets: 52340,
  }),
  fund({
    fundNumber: '1078',
    name: 'כלל השתלמות כללי',
    company: 'clal',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 45,
    returns: { month: 1.23, ytd: 2.51, year1: 16.77, year2: 9.85, year3: 8.41, year5: 8.33 },
    monthlyReturns: monthly([1.23, 1.28, 0.91, 1.48, 1.15, 1.98, -0.38, 1.76, 1.65, 0.82, 1.21, 1.98]),
    fees: defaultFees(2.0, 0.62),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.70, foreignExposure: 28.5, currencyExposure: 16.2,
      designatedBonds: 0, govBondsTradable: 14.1, corpBondsTradable: 19.2, corpBondsNonTradable: 5.1,
      stocksAndOptions: 45.3, deposits: 2.8, mutualFunds: 2.9, loans: 0, cashEquivalents: 6.1, otherAssets: 4.5,
      stdDev36: 7.45, stdDev60: 8.12, actuarialSurplus: null, sharpeRatio: 1.05,
    },
    totalAssets: 48120,
  }),
  fund({
    fundNumber: '753',
    name: 'הפניקס השתלמות כללי',
    company: 'fenix',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 47,
    returns: { month: 1.37, ytd: 2.72, year1: 15.75, year2: 9.65, year3: 8.65, year5: 8.50 },
    monthlyReturns: monthly([1.37, 1.35, 0.95, 1.52, 1.18, 2.05, -0.41, 1.82, 1.68, 0.84, 1.28, 2.05]),
    fees: defaultFees(1.75, 0.55),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.61, foreignExposure: 30.2, currencyExposure: 17.8,
      designatedBonds: 0, govBondsTradable: 13.2, corpBondsTradable: 17.9, corpBondsNonTradable: 4.8,
      stocksAndOptions: 47.2, deposits: 2.5, mutualFunds: 3.2, loans: 0, cashEquivalents: 5.5, otherAssets: 5.7,
      stdDev36: 7.65, stdDev60: 8.31, actuarialSurplus: null, sharpeRatio: 1.08,
    },
    totalAssets: 41560,
  }),
  fund({
    fundNumber: '891',
    name: 'מנורה מבטחים השתלמות כללי',
    company: 'menora',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 44,
    returns: { month: 1.16, ytd: 2.38, year1: 16.31, year2: 9.52, year3: 8.16, year5: 8.02 },
    monthlyReturns: monthly([1.16, 1.22, 0.88, 1.42, 1.11, 1.92, -0.35, 1.71, 1.58, 0.79, 1.18, 1.92]),
    fees: defaultFees(1.85, 0.60),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.67, foreignExposure: 27.8, currencyExposure: 15.9,
      designatedBonds: 0, govBondsTradable: 14.5, corpBondsTradable: 19.8, corpBondsNonTradable: 5.3,
      stocksAndOptions: 44.1, deposits: 3.1, mutualFunds: 2.7, loans: 0, cashEquivalents: 6.3, otherAssets: 4.2,
      stdDev36: 7.32, stdDev60: 7.98, actuarialSurplus: null, sharpeRatio: 1.02,
    },
    totalAssets: 38920,
  }),
  fund({
    fundNumber: '624',
    name: 'מגדל השתלמות כללי',
    company: 'migdal',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 43,
    returns: { month: 1.28, ytd: 2.58, year1: 15.92, year2: 9.41, year3: 8.23, year5: 8.09 },
    monthlyReturns: monthly([1.28, 1.30, 0.93, 1.50, 1.16, 2.01, -0.39, 1.78, 1.63, 0.81, 1.25, 2.01]),
    fees: defaultFees(1.90, 0.58),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.65, foreignExposure: 26.5, currencyExposure: 15.1,
      designatedBonds: 0, govBondsTradable: 15.2, corpBondsTradable: 20.1, corpBondsNonTradable: 5.5,
      stocksAndOptions: 43.2, deposits: 3.3, mutualFunds: 2.5, loans: 0, cashEquivalents: 6.5, otherAssets: 3.7,
      stdDev36: 7.21, stdDev60: 7.85, actuarialSurplus: null, sharpeRatio: 1.00,
    },
    totalAssets: 36780,
  }),
  fund({
    fundNumber: '445',
    name: 'הראל השתלמות כללי',
    company: 'harel',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 42,
    returns: { month: 1.19, ytd: 2.42, year1: 15.48, year2: 9.28, year3: 7.97, year5: 7.88 },
    monthlyReturns: monthly([1.19, 1.23, 0.89, 1.44, 1.12, 1.95, -0.36, 1.73, 1.60, 0.80, 1.19, 1.95]),
    fees: defaultFees(1.95, 0.61),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.69, foreignExposure: 25.8, currencyExposure: 14.7,
      designatedBonds: 0, govBondsTradable: 15.8, corpBondsTradable: 20.5, corpBondsNonTradable: 5.7,
      stocksAndOptions: 42.1, deposits: 3.5, mutualFunds: 2.3, loans: 0, cashEquivalents: 6.8, otherAssets: 3.3,
      stdDev36: 7.08, stdDev60: 7.72, actuarialSurplus: null, sharpeRatio: 0.98,
    },
    totalAssets: 34560,
  }),
  fund({
    fundNumber: '998',
    name: 'מיטב השתלמות כללי',
    company: 'meitav',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 46,
    returns: { month: 1.31, ytd: 2.65, year1: 16.45, year2: 9.72, year3: 8.55, year5: 8.42 },
    monthlyReturns: monthly([1.31, 1.34, 0.96, 1.53, 1.19, 2.08, -0.42, 1.85, 1.70, 0.85, 1.30, 2.08]),
    fees: defaultFees(1.55, 0.52),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.58, foreignExposure: 31.5, currencyExposure: 18.1,
      designatedBonds: 0, govBondsTradable: 12.8, corpBondsTradable: 18.2, corpBondsNonTradable: 4.5,
      stocksAndOptions: 46.5, deposits: 2.3, mutualFunds: 3.4, loans: 0, cashEquivalents: 5.9, otherAssets: 6.4,
      stdDev36: 7.72, stdDev60: 8.38, actuarialSurplus: null, sharpeRatio: 1.10,
    },
    totalAssets: 29870,
  }),
  fund({
    fundNumber: '1102',
    name: 'פסגות השתלמות כללי',
    company: 'psagot',
    productType: 'hishtalmut',
    specialization: 'general',
    stockExposure: 44,
    returns: { month: 1.25, ytd: 2.53, year1: 15.89, year2: 9.38, year3: 8.12, year5: 7.95 },
    monthlyReturns: monthly([1.25, 1.28, 0.92, 1.49, 1.15, 1.99, -0.37, 1.77, 1.64, 0.81, 1.24, 1.99]),
    fees: defaultFees(1.80, 0.56),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.63, foreignExposure: 29.2, currencyExposure: 16.8,
      designatedBonds: 0, govBondsTradable: 13.8, corpBondsTradable: 19.5, corpBondsNonTradable: 5.0,
      stocksAndOptions: 44.5, deposits: 2.9, mutualFunds: 3.0, loans: 0, cashEquivalents: 6.0, otherAssets: 5.3,
      stdDev36: 7.38, stdDev60: 8.05, actuarialSurplus: null, sharpeRatio: 1.03,
    },
    totalAssets: 27340,
  }),
];

// ===========================================================================
// קרנות השתלמות — מניות
// ===========================================================================
const hishtalmutStocks: Fund[] = [
  fund({
    fundNumber: '513',
    name: 'אלטשולר שחם השתלמות מניות',
    company: 'altshuler',
    productType: 'hishtalmut',
    specialization: 'stocks',
    stockExposure: 98,
    returns: { month: 1.91, ytd: 3.85, year1: 23.12, year2: 13.45, year3: 11.52, year5: 10.55 },
    monthlyReturns: monthly([1.91, 1.94, 1.35, 2.12, 1.65, 2.88, -0.92, 2.45, 2.28, 1.15, 1.82, 2.88]),
    fees: defaultFees(1.49, 0.58),
    deepDrill: {
      directExpenses: 0.09, expectedAnnualCost: 0.67, foreignExposure: 45.2, currencyExposure: 32.5,
      designatedBonds: 0, govBondsTradable: 0, corpBondsTradable: 0, corpBondsNonTradable: 0,
      stocksAndOptions: 98.2, deposits: 0, mutualFunds: 0, loans: 0, cashEquivalents: 1.8, otherAssets: 0,
      stdDev36: 14.52, stdDev60: 15.21, actuarialSurplus: null, sharpeRatio: 0.85,
    },
    totalAssets: 18920,
  }),
  fund({
    fundNumber: '1079',
    name: 'כלל השתלמות מניות',
    company: 'clal',
    productType: 'hishtalmut',
    specialization: 'stocks',
    stockExposure: 97,
    returns: { month: 1.85, ytd: 3.72, year1: 22.45, year2: 13.12, year3: 11.15, year5: 10.30 },
    monthlyReturns: monthly([1.85, 1.87, 1.30, 2.05, 1.60, 2.78, -0.88, 2.38, 2.21, 1.11, 1.75, 2.78]),
    fees: defaultFees(2.0, 0.62),
    deepDrill: {
      directExpenses: 0.10, expectedAnnualCost: 0.72, foreignExposure: 42.8, currencyExposure: 30.1,
      designatedBonds: 0, govBondsTradable: 0, corpBondsTradable: 0, corpBondsNonTradable: 0,
      stocksAndOptions: 97.1, deposits: 0, mutualFunds: 0.5, loans: 0, cashEquivalents: 2.4, otherAssets: 0,
      stdDev36: 14.21, stdDev60: 14.92, actuarialSurplus: null, sharpeRatio: 0.82,
    },
    totalAssets: 15670,
  }),
  fund({
    fundNumber: '754',
    name: 'הפניקס השתלמות מניות',
    company: 'fenix',
    productType: 'hishtalmut',
    specialization: 'stocks',
    stockExposure: 98,
    returns: { month: 1.91, ytd: 3.82, year1: 23.12, year2: 13.52, year3: 11.45, year5: 10.54 },
    monthlyReturns: monthly([1.91, 1.91, 1.33, 2.10, 1.63, 2.85, -0.90, 2.42, 2.25, 1.13, 1.80, 2.85]),
    fees: defaultFees(1.75, 0.55),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.63, foreignExposure: 44.5, currencyExposure: 31.8,
      designatedBonds: 0, govBondsTradable: 0, corpBondsTradable: 0, corpBondsNonTradable: 0,
      stocksAndOptions: 98.5, deposits: 0, mutualFunds: 0, loans: 0, cashEquivalents: 1.5, otherAssets: 0,
      stdDev36: 14.45, stdDev60: 15.12, actuarialSurplus: null, sharpeRatio: 0.84,
    },
    totalAssets: 14230,
  }),
  fund({
    fundNumber: '892',
    name: 'מנורה מבטחים השתלמות מניות',
    company: 'menora',
    productType: 'hishtalmut',
    specialization: 'stocks',
    stockExposure: 96,
    returns: { month: 1.72, ytd: 3.48, year1: 21.89, year2: 12.85, year3: 10.92, year5: 9.90 },
    monthlyReturns: monthly([1.72, 1.76, 1.22, 1.95, 1.52, 2.65, -0.82, 2.28, 2.12, 1.06, 1.68, 2.65]),
    fees: defaultFees(1.85, 0.60),
    deepDrill: {
      directExpenses: 0.09, expectedAnnualCost: 0.69, foreignExposure: 40.2, currencyExposure: 28.5,
      designatedBonds: 0, govBondsTradable: 0.5, corpBondsTradable: 0.5, corpBondsNonTradable: 0,
      stocksAndOptions: 96.2, deposits: 0, mutualFunds: 0.8, loans: 0, cashEquivalents: 2.0, otherAssets: 0,
      stdDev36: 13.85, stdDev60: 14.55, actuarialSurplus: null, sharpeRatio: 0.80,
    },
    totalAssets: 12890,
  }),
  fund({
    fundNumber: '625',
    name: 'מגדל השתלמות מניות',
    company: 'migdal',
    productType: 'hishtalmut',
    specialization: 'stocks',
    stockExposure: 97,
    returns: { month: 1.78, ytd: 3.58, year1: 22.67, year2: 13.25, year3: 11.28, year5: 10.15 },
    monthlyReturns: monthly([1.78, 1.80, 1.25, 2.00, 1.56, 2.72, -0.85, 2.33, 2.17, 1.09, 1.72, 2.72]),
    fees: defaultFees(1.90, 0.58),
    deepDrill: {
      directExpenses: 0.09, expectedAnnualCost: 0.67, foreignExposure: 41.5, currencyExposure: 29.2,
      designatedBonds: 0, govBondsTradable: 0, corpBondsTradable: 0.3, corpBondsNonTradable: 0,
      stocksAndOptions: 97.5, deposits: 0, mutualFunds: 0.2, loans: 0, cashEquivalents: 2.0, otherAssets: 0,
      stdDev36: 14.02, stdDev60: 14.72, actuarialSurplus: null, sharpeRatio: 0.83,
    },
    totalAssets: 11560,
  }),
  fund({
    fundNumber: '446',
    name: 'הראל השתלמות מניות',
    company: 'harel',
    productType: 'hishtalmut',
    specialization: 'stocks',
    stockExposure: 96,
    returns: { month: 1.65, ytd: 3.35, year1: 21.34, year2: 12.58, year3: 10.68, year5: 9.69 },
    monthlyReturns: monthly([1.65, 1.70, 1.18, 1.90, 1.48, 2.58, -0.78, 2.22, 2.06, 1.03, 1.64, 2.58]),
    fees: defaultFees(1.95, 0.61),
    deepDrill: {
      directExpenses: 0.10, expectedAnnualCost: 0.71, foreignExposure: 39.5, currencyExposure: 27.8,
      designatedBonds: 0, govBondsTradable: 0.8, corpBondsTradable: 0.5, corpBondsNonTradable: 0,
      stocksAndOptions: 96.5, deposits: 0, mutualFunds: 0.5, loans: 0, cashEquivalents: 1.7, otherAssets: 0,
      stdDev36: 13.68, stdDev60: 14.38, actuarialSurplus: null, sharpeRatio: 0.78,
    },
    totalAssets: 10230,
  }),
];

// ===========================================================================
// קופות גמל — כללי
// ===========================================================================
const gemelGeneral: Fund[] = [
  fund({
    fundNumber: '2001',
    name: 'אלטשולר שחם גמל כללי',
    company: 'altshuler',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 45,
    returns: { month: 1.35, ytd: 2.72, year1: 16.89, year2: 9.95, year3: 8.78, year5: 8.62 },
    monthlyReturns: monthly([1.35, 1.37, 0.96, 1.52, 1.18, 2.05, -0.41, 1.82, 1.68, 0.85, 1.30, 2.05]),
    fees: defaultFees(1.49, 0.58),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.65, foreignExposure: 30.5, currencyExposure: 17.8,
      designatedBonds: 0, govBondsTradable: 13.5, corpBondsTradable: 18.5, corpBondsNonTradable: 4.5,
      stocksAndOptions: 45.2, deposits: 2.5, mutualFunds: 3.2, loans: 0, cashEquivalents: 6.1, otherAssets: 6.5,
      stdDev36: 7.55, stdDev60: 8.22, actuarialSurplus: null, sharpeRatio: 1.08,
    },
    totalAssets: 42150,
  }),
  fund({
    fundNumber: '2002',
    name: 'כלל גמל כללי',
    company: 'clal',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 43,
    returns: { month: 1.18, ytd: 2.41, year1: 15.23, year2: 9.12, year3: 7.69, year5: 7.69 },
    monthlyReturns: monthly([1.18, 1.23, 0.86, 1.42, 1.10, 1.88, -0.35, 1.68, 1.55, 0.78, 1.18, 1.88]),
    fees: defaultFees(2.0, 0.62),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.70, foreignExposure: 26.8, currencyExposure: 15.2,
      designatedBonds: 0, govBondsTradable: 15.2, corpBondsTradable: 20.1, corpBondsNonTradable: 5.5,
      stocksAndOptions: 43.1, deposits: 3.2, mutualFunds: 2.5, loans: 0, cashEquivalents: 6.5, otherAssets: 3.9,
      stdDev36: 7.12, stdDev60: 7.78, actuarialSurplus: null, sharpeRatio: 0.98,
    },
    totalAssets: 38560,
  }),
  fund({
    fundNumber: '2003',
    name: 'הפניקס גמל כללי',
    company: 'fenix',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 44,
    returns: { month: 1.25, ytd: 2.55, year1: 15.67, year2: 9.35, year3: 7.82, year5: 7.89 },
    monthlyReturns: monthly([1.25, 1.30, 0.91, 1.48, 1.15, 1.98, -0.38, 1.75, 1.62, 0.81, 1.24, 1.98]),
    fees: defaultFees(1.75, 0.55),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.61, foreignExposure: 28.5, currencyExposure: 16.5,
      designatedBonds: 0, govBondsTradable: 14.5, corpBondsTradable: 19.2, corpBondsNonTradable: 5.0,
      stocksAndOptions: 44.5, deposits: 2.8, mutualFunds: 3.0, loans: 0, cashEquivalents: 5.8, otherAssets: 5.2,
      stdDev36: 7.35, stdDev60: 8.01, actuarialSurplus: null, sharpeRatio: 1.02,
    },
    totalAssets: 35210,
  }),
  fund({
    fundNumber: '2004',
    name: 'מנורה מבטחים גמל כללי',
    company: 'menora',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 42,
    returns: { month: 1.12, ytd: 2.28, year1: 14.89, year2: 8.92, year3: 7.53, year5: 7.48 },
    monthlyReturns: monthly([1.12, 1.16, 0.82, 1.35, 1.05, 1.82, -0.32, 1.62, 1.50, 0.75, 1.14, 1.82]),
    fees: defaultFees(1.85, 0.60),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.67, foreignExposure: 25.5, currencyExposure: 14.8,
      designatedBonds: 0, govBondsTradable: 16.2, corpBondsTradable: 20.8, corpBondsNonTradable: 5.8,
      stocksAndOptions: 42.2, deposits: 3.5, mutualFunds: 2.2, loans: 0, cashEquivalents: 6.8, otherAssets: 2.5,
      stdDev36: 6.95, stdDev60: 7.62, actuarialSurplus: null, sharpeRatio: 0.95,
    },
    totalAssets: 32780,
  }),
  fund({
    fundNumber: '2005',
    name: 'מגדל גמל כללי',
    company: 'migdal',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 42,
    returns: { month: 1.21, ytd: 2.45, year1: 15.45, year2: 9.22, year3: 7.76, year5: 7.76 },
    monthlyReturns: monthly([1.21, 1.24, 0.88, 1.45, 1.12, 1.95, -0.37, 1.72, 1.59, 0.79, 1.21, 1.95]),
    fees: defaultFees(1.90, 0.58),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.65, foreignExposure: 26.2, currencyExposure: 15.0,
      designatedBonds: 0, govBondsTradable: 15.8, corpBondsTradable: 20.5, corpBondsNonTradable: 5.6,
      stocksAndOptions: 42.5, deposits: 3.3, mutualFunds: 2.4, loans: 0, cashEquivalents: 6.5, otherAssets: 3.4,
      stdDev36: 7.05, stdDev60: 7.72, actuarialSurplus: null, sharpeRatio: 0.97,
    },
    totalAssets: 30450,
  }),
  fund({
    fundNumber: '2006',
    name: 'הראל גמל כללי',
    company: 'harel',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 41,
    returns: { month: 1.09, ytd: 2.22, year1: 14.56, year2: 8.78, year3: 7.38, year5: 7.30 },
    monthlyReturns: monthly([1.09, 1.13, 0.80, 1.32, 1.02, 1.78, -0.30, 1.58, 1.47, 0.73, 1.11, 1.78]),
    fees: defaultFees(1.95, 0.61),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.69, foreignExposure: 24.5, currencyExposure: 14.2,
      designatedBonds: 0, govBondsTradable: 16.8, corpBondsTradable: 21.2, corpBondsNonTradable: 6.0,
      stocksAndOptions: 41.2, deposits: 3.8, mutualFunds: 2.0, loans: 0, cashEquivalents: 7.0, otherAssets: 2.0,
      stdDev36: 6.82, stdDev60: 7.48, actuarialSurplus: null, sharpeRatio: 0.92,
    },
    totalAssets: 28920,
  }),
  fund({
    fundNumber: '2007',
    name: 'מיטב גמל כללי',
    company: 'meitav',
    productType: 'gemel',
    specialization: 'general',
    stockExposure: 44,
    returns: { month: 1.28, ytd: 2.58, year1: 16.12, year2: 9.58, year3: 8.42, year5: 8.28 },
    monthlyReturns: monthly([1.28, 1.30, 0.93, 1.50, 1.16, 2.02, -0.39, 1.79, 1.65, 0.83, 1.27, 2.02]),
    fees: defaultFees(1.55, 0.52),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.58, foreignExposure: 29.8, currencyExposure: 17.2,
      designatedBonds: 0, govBondsTradable: 13.8, corpBondsTradable: 18.8, corpBondsNonTradable: 4.8,
      stocksAndOptions: 44.8, deposits: 2.5, mutualFunds: 3.2, loans: 0, cashEquivalents: 5.8, otherAssets: 6.3,
      stdDev36: 7.42, stdDev60: 8.08, actuarialSurplus: null, sharpeRatio: 1.06,
    },
    totalAssets: 26340,
  }),
];

// ===========================================================================
// קופות גמל להשקעה — כללי
// ===========================================================================
const gemelInvestGeneral: Fund[] = [
  fund({
    fundNumber: '3001',
    name: 'אלטשולר שחם גמל להשקעה כללי',
    company: 'altshuler',
    productType: 'gemel_invest',
    specialization: 'general',
    stockExposure: 50,
    returns: { month: 1.48, ytd: 2.98, year1: 18.12, year2: 10.65, year3: 9.35, year5: 9.12 },
    monthlyReturns: monthly([1.48, 1.50, 1.05, 1.65, 1.28, 2.22, -0.48, 1.98, 1.82, 0.92, 1.42, 2.22]),
    fees: defaultFees(0, 0.72),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.80, foreignExposure: 35.2, currencyExposure: 20.5,
      designatedBonds: 0, govBondsTradable: 10.5, corpBondsTradable: 16.8, corpBondsNonTradable: 4.0,
      stocksAndOptions: 50.2, deposits: 2.0, mutualFunds: 4.5, loans: 0, cashEquivalents: 5.5, otherAssets: 6.5,
      stdDev36: 8.25, stdDev60: 8.92, actuarialSurplus: null, sharpeRatio: 1.15,
    },
    totalAssets: 22560,
  }),
  fund({
    fundNumber: '3002',
    name: 'כלל גמל להשקעה כללי',
    company: 'clal',
    productType: 'gemel_invest',
    specialization: 'general',
    stockExposure: 47,
    returns: { month: 1.32, ytd: 2.68, year1: 16.78, year2: 9.88, year3: 8.65, year5: 8.48 },
    monthlyReturns: monthly([1.32, 1.36, 0.95, 1.55, 1.20, 2.08, -0.42, 1.85, 1.72, 0.86, 1.32, 2.08]),
    fees: defaultFees(0, 0.78),
    deepDrill: {
      directExpenses: 0.09, expectedAnnualCost: 0.87, foreignExposure: 30.8, currencyExposure: 17.5,
      designatedBonds: 0, govBondsTradable: 12.5, corpBondsTradable: 18.2, corpBondsNonTradable: 4.8,
      stocksAndOptions: 47.5, deposits: 2.8, mutualFunds: 3.2, loans: 0, cashEquivalents: 6.2, otherAssets: 4.8,
      stdDev36: 7.85, stdDev60: 8.52, actuarialSurplus: null, sharpeRatio: 1.05,
    },
    totalAssets: 19870,
  }),
  fund({
    fundNumber: '3003',
    name: 'הפניקס גמל להשקעה כללי',
    company: 'fenix',
    productType: 'gemel_invest',
    specialization: 'general',
    stockExposure: 48,
    returns: { month: 1.38, ytd: 2.78, year1: 17.25, year2: 10.15, year3: 8.92, year5: 8.72 },
    monthlyReturns: monthly([1.38, 1.40, 0.98, 1.58, 1.22, 2.12, -0.44, 1.90, 1.75, 0.88, 1.35, 2.12]),
    fees: defaultFees(0, 0.68),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.75, foreignExposure: 33.2, currencyExposure: 19.2,
      designatedBonds: 0, govBondsTradable: 11.8, corpBondsTradable: 17.5, corpBondsNonTradable: 4.2,
      stocksAndOptions: 48.8, deposits: 2.2, mutualFunds: 3.8, loans: 0, cashEquivalents: 5.8, otherAssets: 5.9,
      stdDev36: 8.05, stdDev60: 8.72, actuarialSurplus: null, sharpeRatio: 1.10,
    },
    totalAssets: 18340,
  }),
];

// ===========================================================================
// קרנות פנסיה — כללי
// ===========================================================================
const pensiaGeneral: Fund[] = [
  fund({
    fundNumber: '4001',
    name: 'מנורה מבטחים פנסיה מקיפה כללי',
    company: 'menora',
    productType: 'pensia',
    specialization: 'general',
    stockExposure: 38,
    returns: { month: 1.08, ytd: 2.18, year1: 14.12, year2: 8.42, year3: 7.13, year5: 7.06 },
    monthlyReturns: monthly([1.08, 1.10, 0.78, 1.28, 0.99, 1.72, -0.28, 1.52, 1.42, 0.71, 1.08, 1.72]),
    fees: defaultFees(1.85, 0.50),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.56, foreignExposure: 22.5, currencyExposure: 12.8,
      designatedBonds: 30.0, govBondsTradable: 8.5, corpBondsTradable: 12.2, corpBondsNonTradable: 3.8,
      stocksAndOptions: 38.2, deposits: 1.5, mutualFunds: 1.2, loans: 0, cashEquivalents: 3.2, otherAssets: 1.4,
      stdDev36: 5.82, stdDev60: 6.35, actuarialSurplus: 2.1, sharpeRatio: 1.12,
    },
    totalAssets: 85420,
  }),
  fund({
    fundNumber: '4002',
    name: 'הפניקס פנסיה מקיפה כללי',
    company: 'fenix',
    productType: 'pensia',
    specialization: 'general',
    stockExposure: 40,
    returns: { month: 1.15, ytd: 2.32, year1: 14.78, year2: 8.72, year3: 7.38, year5: 7.30 },
    monthlyReturns: monthly([1.15, 1.17, 0.82, 1.35, 1.05, 1.82, -0.32, 1.62, 1.50, 0.75, 1.15, 1.82]),
    fees: defaultFees(1.75, 0.45),
    deepDrill: {
      directExpenses: 0.05, expectedAnnualCost: 0.50, foreignExposure: 24.5, currencyExposure: 14.2,
      designatedBonds: 28.0, govBondsTradable: 9.2, corpBondsTradable: 12.8, corpBondsNonTradable: 3.5,
      stocksAndOptions: 40.5, deposits: 1.2, mutualFunds: 1.5, loans: 0, cashEquivalents: 2.8, otherAssets: 0.5,
      stdDev36: 6.12, stdDev60: 6.65, actuarialSurplus: 1.8, sharpeRatio: 1.08,
    },
    totalAssets: 72350,
  }),
  fund({
    fundNumber: '4003',
    name: 'מגדל מקפת פנסיה כללי',
    company: 'migdal',
    productType: 'pensia',
    specialization: 'general',
    stockExposure: 39,
    returns: { month: 1.11, ytd: 2.25, year1: 14.45, year2: 8.55, year3: 7.24, year5: 7.15 },
    monthlyReturns: monthly([1.11, 1.13, 0.80, 1.31, 1.02, 1.77, -0.30, 1.57, 1.46, 0.73, 1.11, 1.77]),
    fees: defaultFees(1.90, 0.48),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.54, foreignExposure: 23.2, currencyExposure: 13.5,
      designatedBonds: 29.5, govBondsTradable: 8.8, corpBondsTradable: 12.5, corpBondsNonTradable: 3.6,
      stocksAndOptions: 39.2, deposits: 1.3, mutualFunds: 1.3, loans: 0, cashEquivalents: 3.0, otherAssets: 0.8,
      stdDev36: 5.95, stdDev60: 6.48, actuarialSurplus: 2.3, sharpeRatio: 1.10,
    },
    totalAssets: 68120,
  }),
  fund({
    fundNumber: '4004',
    name: 'הראל פנסיה מקיפה כללי',
    company: 'harel',
    productType: 'pensia',
    specialization: 'general',
    stockExposure: 37,
    returns: { month: 1.05, ytd: 2.12, year1: 13.89, year2: 8.28, year3: 6.92, year5: 6.87 },
    monthlyReturns: monthly([1.05, 1.07, 0.76, 1.25, 0.97, 1.68, -0.26, 1.48, 1.38, 0.69, 1.05, 1.68]),
    fees: defaultFees(1.95, 0.52),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.59, foreignExposure: 21.8, currencyExposure: 12.2,
      designatedBonds: 31.0, govBondsTradable: 8.2, corpBondsTradable: 11.8, corpBondsNonTradable: 4.0,
      stocksAndOptions: 37.5, deposits: 1.8, mutualFunds: 1.0, loans: 0, cashEquivalents: 3.5, otherAssets: 1.2,
      stdDev36: 5.65, stdDev60: 6.18, actuarialSurplus: 2.5, sharpeRatio: 1.05,
    },
    totalAssets: 62580,
  }),
  fund({
    fundNumber: '4005',
    name: 'כלל פנסיה מקיפה כללי',
    company: 'clal',
    productType: 'pensia',
    specialization: 'general',
    stockExposure: 36,
    returns: { month: 1.02, ytd: 2.08, year1: 13.56, year2: 8.12, year3: 6.78, year5: 6.78 },
    monthlyReturns: monthly([1.02, 1.06, 0.74, 1.22, 0.95, 1.65, -0.25, 1.45, 1.35, 0.68, 1.03, 1.65]),
    fees: defaultFees(2.0, 0.55),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.62, foreignExposure: 20.5, currencyExposure: 11.8,
      designatedBonds: 32.0, govBondsTradable: 8.0, corpBondsTradable: 11.5, corpBondsNonTradable: 4.2,
      stocksAndOptions: 36.5, deposits: 2.0, mutualFunds: 0.8, loans: 0, cashEquivalents: 3.8, otherAssets: 1.2,
      stdDev36: 5.52, stdDev60: 6.05, actuarialSurplus: 1.5, sharpeRatio: 1.02,
    },
    totalAssets: 58340,
  }),
  fund({
    fundNumber: '4006',
    name: 'אלטשולר שחם פנסיה מקיפה כללי',
    company: 'altshuler',
    productType: 'pensia',
    specialization: 'general',
    stockExposure: 42,
    returns: { month: 1.22, ytd: 2.48, year1: 15.35, year2: 9.05, year3: 7.68, year5: 7.52 },
    monthlyReturns: monthly([1.22, 1.26, 0.88, 1.42, 1.10, 1.92, -0.35, 1.70, 1.58, 0.79, 1.22, 1.92]),
    fees: defaultFees(1.49, 0.42),
    deepDrill: {
      directExpenses: 0.05, expectedAnnualCost: 0.47, foreignExposure: 28.5, currencyExposure: 16.2,
      designatedBonds: 26.0, govBondsTradable: 9.8, corpBondsTradable: 13.2, corpBondsNonTradable: 3.2,
      stocksAndOptions: 42.5, deposits: 1.0, mutualFunds: 1.8, loans: 0, cashEquivalents: 2.5, otherAssets: 0,
      stdDev36: 6.45, stdDev60: 7.02, actuarialSurplus: 1.2, sharpeRatio: 1.18,
    },
    totalAssets: 45670,
  }),
];

// ===========================================================================
// קרנות פנסיה — מניות
// ===========================================================================
const pensiaStocks: Fund[] = [
  fund({
    fundNumber: '4101',
    name: 'אלטשולר שחם פנסיה מניות',
    company: 'altshuler',
    productType: 'pensia',
    specialization: 'stocks',
    stockExposure: 75,
    returns: { month: 1.72, ytd: 3.48, year1: 21.45, year2: 12.55, year3: 10.82, year5: 9.95 },
    monthlyReturns: monthly([1.72, 1.76, 1.22, 1.95, 1.52, 2.65, -0.72, 2.28, 2.12, 1.06, 1.68, 2.65]),
    fees: defaultFees(1.49, 0.42),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.49, foreignExposure: 38.5, currencyExposure: 25.8,
      designatedBonds: 15.0, govBondsTradable: 2.5, corpBondsTradable: 3.2, corpBondsNonTradable: 0.8,
      stocksAndOptions: 75.2, deposits: 0.5, mutualFunds: 1.0, loans: 0, cashEquivalents: 1.8, otherAssets: 0,
      stdDev36: 11.25, stdDev60: 12.02, actuarialSurplus: 0.8, sharpeRatio: 0.92,
    },
    totalAssets: 12340,
  }),
  fund({
    fundNumber: '4102',
    name: 'הפניקס פנסיה מניות',
    company: 'fenix',
    productType: 'pensia',
    specialization: 'stocks',
    stockExposure: 72,
    returns: { month: 1.65, ytd: 3.32, year1: 20.78, year2: 12.15, year3: 10.42, year5: 9.58 },
    monthlyReturns: monthly([1.65, 1.68, 1.17, 1.88, 1.46, 2.55, -0.68, 2.18, 2.04, 1.02, 1.62, 2.55]),
    fees: defaultFees(1.75, 0.45),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.51, foreignExposure: 36.8, currencyExposure: 24.5,
      designatedBonds: 16.0, govBondsTradable: 3.0, corpBondsTradable: 3.8, corpBondsNonTradable: 1.0,
      stocksAndOptions: 72.5, deposits: 0.8, mutualFunds: 1.2, loans: 0, cashEquivalents: 1.7, otherAssets: 0,
      stdDev36: 10.82, stdDev60: 11.58, actuarialSurplus: 1.0, sharpeRatio: 0.88,
    },
    totalAssets: 10560,
  }),
];

// ===========================================================================
// פוליסות חיסכון — כללי
// ===========================================================================
const polisaGeneral: Fund[] = [
  fund({
    fundNumber: '5001',
    name: 'הפניקס פוליסת חיסכון כללי',
    company: 'fenix',
    productType: 'polisa',
    specialization: 'general',
    stockExposure: 35,
    returns: { month: 0.95, ytd: 1.92, year1: 12.34, year2: 7.42, year3: 6.31, year5: 6.35 },
    monthlyReturns: monthly([0.95, 0.97, 0.68, 1.12, 0.87, 1.52, -0.22, 1.35, 1.25, 0.63, 0.95, 1.52]),
    fees: defaultFees(0, 0.95),
    deepDrill: {
      directExpenses: 0.05, expectedAnnualCost: 1.00, foreignExposure: 20.5, currencyExposure: 11.2,
      designatedBonds: 0, govBondsTradable: 18.5, corpBondsTradable: 22.8, corpBondsNonTradable: 6.5,
      stocksAndOptions: 35.2, deposits: 4.0, mutualFunds: 2.8, loans: 0, cashEquivalents: 6.5, otherAssets: 3.7,
      stdDev36: 5.42, stdDev60: 5.95, actuarialSurplus: null, sharpeRatio: 0.98,
    },
    totalAssets: 15680,
  }),
  fund({
    fundNumber: '5002',
    name: 'מנורה מבטחים פוליסת חיסכון כללי',
    company: 'menora',
    productType: 'polisa',
    specialization: 'general',
    stockExposure: 33,
    returns: { month: 0.89, ytd: 1.82, year1: 11.89, year2: 7.15, year3: 6.05, year5: 6.13 },
    monthlyReturns: monthly([0.89, 0.93, 0.65, 1.08, 0.84, 1.45, -0.20, 1.28, 1.20, 0.60, 0.91, 1.45]),
    fees: defaultFees(0, 0.98),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 1.04, foreignExposure: 18.8, currencyExposure: 10.5,
      designatedBonds: 0, govBondsTradable: 19.5, corpBondsTradable: 23.5, corpBondsNonTradable: 7.0,
      stocksAndOptions: 33.5, deposits: 4.5, mutualFunds: 2.5, loans: 0, cashEquivalents: 7.0, otherAssets: 2.5,
      stdDev36: 5.12, stdDev60: 5.65, actuarialSurplus: null, sharpeRatio: 0.92,
    },
    totalAssets: 13450,
  }),
  fund({
    fundNumber: '5003',
    name: 'כלל פוליסת חיסכון כללי',
    company: 'clal',
    productType: 'polisa',
    specialization: 'general',
    stockExposure: 34,
    returns: { month: 0.92, ytd: 1.88, year1: 12.12, year2: 7.28, year3: 6.18, year5: 6.24 },
    monthlyReturns: monthly([0.92, 0.95, 0.67, 1.10, 0.85, 1.48, -0.21, 1.32, 1.22, 0.61, 0.93, 1.48]),
    fees: defaultFees(0, 0.92),
    deepDrill: {
      directExpenses: 0.05, expectedAnnualCost: 0.97, foreignExposure: 19.5, currencyExposure: 10.8,
      designatedBonds: 0, govBondsTradable: 19.0, corpBondsTradable: 23.2, corpBondsNonTradable: 6.8,
      stocksAndOptions: 34.2, deposits: 4.2, mutualFunds: 2.6, loans: 0, cashEquivalents: 6.8, otherAssets: 3.2,
      stdDev36: 5.25, stdDev60: 5.78, actuarialSurplus: null, sharpeRatio: 0.95,
    },
    totalAssets: 12890,
  }),
  fund({
    fundNumber: '5004',
    name: 'מגדל פוליסת חיסכון כללי',
    company: 'migdal',
    productType: 'polisa',
    specialization: 'general',
    stockExposure: 32,
    returns: { month: 0.87, ytd: 1.78, year1: 11.67, year2: 7.02, year3: 5.92, year5: 6.02 },
    monthlyReturns: monthly([0.87, 0.91, 0.64, 1.05, 0.82, 1.42, -0.19, 1.25, 1.17, 0.58, 0.89, 1.42]),
    fees: defaultFees(0, 1.00),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 1.06, foreignExposure: 17.5, currencyExposure: 9.8,
      designatedBonds: 0, govBondsTradable: 20.2, corpBondsTradable: 24.0, corpBondsNonTradable: 7.2,
      stocksAndOptions: 32.5, deposits: 4.8, mutualFunds: 2.2, loans: 0, cashEquivalents: 7.2, otherAssets: 1.9,
      stdDev36: 4.98, stdDev60: 5.52, actuarialSurplus: null, sharpeRatio: 0.90,
    },
    totalAssets: 11230,
  }),
  fund({
    fundNumber: '5005',
    name: 'הראל פוליסת חיסכון כללי',
    company: 'harel',
    productType: 'polisa',
    specialization: 'general',
    stockExposure: 31,
    returns: { month: 0.84, ytd: 1.72, year1: 11.23, year2: 6.82, year3: 5.78, year5: 5.87 },
    monthlyReturns: monthly([0.84, 0.88, 0.62, 1.02, 0.79, 1.38, -0.18, 1.22, 1.14, 0.57, 0.86, 1.38]),
    fees: defaultFees(0, 1.02),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 1.09, foreignExposure: 16.8, currencyExposure: 9.2,
      designatedBonds: 0, govBondsTradable: 20.8, corpBondsTradable: 24.5, corpBondsNonTradable: 7.5,
      stocksAndOptions: 31.2, deposits: 5.0, mutualFunds: 2.0, loans: 0, cashEquivalents: 7.5, otherAssets: 1.5,
      stdDev36: 4.82, stdDev60: 5.35, actuarialSurplus: null, sharpeRatio: 0.88,
    },
    totalAssets: 9870,
  }),
];

// ===========================================================================
// קרנות השתלמות — אג"ח
// ===========================================================================
const hishtalmutBonds: Fund[] = [
  fund({
    fundNumber: '514',
    name: 'אלטשולר שחם השתלמות אג"ח',
    company: 'altshuler',
    productType: 'hishtalmut',
    specialization: 'bonds',
    stockExposure: 0,
    returns: { month: 0.52, ytd: 1.08, year1: 6.45, year2: 4.12, year3: 3.85, year5: 3.72 },
    monthlyReturns: monthly([0.52, 0.55, 0.38, 0.62, 0.48, 0.85, 0.12, 0.72, 0.68, 0.35, 0.55, 0.85]),
    fees: defaultFees(0.50, 0.35),
    deepDrill: {
      directExpenses: 0.04, expectedAnnualCost: 0.39, foreignExposure: 8.5, currencyExposure: 2.5,
      designatedBonds: 0, govBondsTradable: 35.2, corpBondsTradable: 42.5, corpBondsNonTradable: 8.8,
      stocksAndOptions: 0, deposits: 5.0, mutualFunds: 1.5, loans: 0, cashEquivalents: 5.2, otherAssets: 1.8,
      stdDev36: 2.85, stdDev60: 3.12, actuarialSurplus: null, sharpeRatio: 1.35,
    },
    totalAssets: 8920,
  }),
  fund({
    fundNumber: '1080',
    name: 'כלל השתלמות אג"ח',
    company: 'clal',
    productType: 'hishtalmut',
    specialization: 'bonds',
    stockExposure: 0,
    returns: { month: 0.48, ytd: 1.02, year1: 6.12, year2: 3.92, year3: 3.65, year5: 3.52 },
    monthlyReturns: monthly([0.48, 0.52, 0.35, 0.58, 0.45, 0.80, 0.10, 0.68, 0.64, 0.32, 0.52, 0.80]),
    fees: defaultFees(0.60, 0.38),
    deepDrill: {
      directExpenses: 0.05, expectedAnnualCost: 0.43, foreignExposure: 6.8, currencyExposure: 2.0,
      designatedBonds: 0, govBondsTradable: 38.5, corpBondsTradable: 40.2, corpBondsNonTradable: 9.5,
      stocksAndOptions: 0, deposits: 4.5, mutualFunds: 1.2, loans: 0, cashEquivalents: 4.8, otherAssets: 1.3,
      stdDev36: 2.72, stdDev60: 2.98, actuarialSurplus: null, sharpeRatio: 1.28,
    },
    totalAssets: 7560,
  }),
];

// ===========================================================================
// קרנות השתלמות — הלכתי
// ===========================================================================
const hishtalmutHalacha: Fund[] = [
  fund({
    fundNumber: '520',
    name: 'אלטשולר שחם השתלמות הלכתי',
    company: 'altshuler',
    productType: 'hishtalmut',
    specialization: 'halacha',
    stockExposure: 42,
    returns: { month: 1.05, ytd: 2.15, year1: 13.85, year2: 8.15, year3: 6.98, year5: 6.82 },
    monthlyReturns: monthly([1.05, 1.10, 0.78, 1.28, 0.99, 1.72, -0.30, 1.52, 1.42, 0.71, 1.08, 1.72]),
    fees: defaultFees(1.49, 0.58),
    deepDrill: {
      directExpenses: 0.07, expectedAnnualCost: 0.65, foreignExposure: 18.5, currencyExposure: 10.2,
      designatedBonds: 0, govBondsTradable: 18.2, corpBondsTradable: 22.5, corpBondsNonTradable: 6.8,
      stocksAndOptions: 42.5, deposits: 3.0, mutualFunds: 1.5, loans: 0, cashEquivalents: 4.5, otherAssets: 1.0,
      stdDev36: 6.82, stdDev60: 7.42, actuarialSurplus: null, sharpeRatio: 0.95,
    },
    totalAssets: 5670,
  }),
  fund({
    fundNumber: '760',
    name: 'הפניקס השתלמות הלכתי',
    company: 'fenix',
    productType: 'hishtalmut',
    specialization: 'halacha',
    stockExposure: 40,
    returns: { month: 0.98, ytd: 2.02, year1: 13.12, year2: 7.85, year3: 6.72, year5: 6.58 },
    monthlyReturns: monthly([0.98, 1.04, 0.74, 1.22, 0.95, 1.65, -0.27, 1.45, 1.35, 0.68, 1.02, 1.65]),
    fees: defaultFees(1.75, 0.55),
    deepDrill: {
      directExpenses: 0.06, expectedAnnualCost: 0.61, foreignExposure: 16.8, currencyExposure: 9.5,
      designatedBonds: 0, govBondsTradable: 19.5, corpBondsTradable: 23.2, corpBondsNonTradable: 7.2,
      stocksAndOptions: 40.2, deposits: 3.5, mutualFunds: 1.2, loans: 0, cashEquivalents: 4.0, otherAssets: 1.2,
      stdDev36: 6.55, stdDev60: 7.15, actuarialSurplus: null, sharpeRatio: 0.92,
    },
    totalAssets: 4890,
  }),
];

// ===========================================================================
// קופות גמל — מניות
// ===========================================================================
const gemelStocks: Fund[] = [
  fund({
    fundNumber: '2101',
    name: 'אלטשולר שחם גמל מניות',
    company: 'altshuler',
    productType: 'gemel',
    specialization: 'stocks',
    stockExposure: 97,
    returns: { month: 1.88, ytd: 3.78, year1: 22.85, year2: 13.32, year3: 11.35, year5: 10.42 },
    monthlyReturns: monthly([1.88, 1.90, 1.32, 2.08, 1.62, 2.82, -0.90, 2.42, 2.25, 1.12, 1.78, 2.82]),
    fees: defaultFees(1.49, 0.58),
    deepDrill: {
      directExpenses: 0.09, expectedAnnualCost: 0.67, foreignExposure: 44.5, currencyExposure: 31.8,
      designatedBonds: 0, govBondsTradable: 0, corpBondsTradable: 0.2, corpBondsNonTradable: 0,
      stocksAndOptions: 97.5, deposits: 0, mutualFunds: 0.3, loans: 0, cashEquivalents: 2.0, otherAssets: 0,
      stdDev36: 14.32, stdDev60: 15.05, actuarialSurplus: null, sharpeRatio: 0.84,
    },
    totalAssets: 16780,
  }),
  fund({
    fundNumber: '2102',
    name: 'מיטב גמל מניות',
    company: 'meitav',
    productType: 'gemel',
    specialization: 'stocks',
    stockExposure: 96,
    returns: { month: 1.82, ytd: 3.68, year1: 22.35, year2: 13.05, year3: 11.08, year5: 10.18 },
    monthlyReturns: monthly([1.82, 1.85, 1.28, 2.02, 1.58, 2.75, -0.87, 2.35, 2.18, 1.09, 1.72, 2.75]),
    fees: defaultFees(1.55, 0.52),
    deepDrill: {
      directExpenses: 0.08, expectedAnnualCost: 0.60, foreignExposure: 42.8, currencyExposure: 30.5,
      designatedBonds: 0, govBondsTradable: 0.5, corpBondsTradable: 0.5, corpBondsNonTradable: 0,
      stocksAndOptions: 96.2, deposits: 0, mutualFunds: 0.5, loans: 0, cashEquivalents: 2.3, otherAssets: 0,
      stdDev36: 14.05, stdDev60: 14.78, actuarialSurplus: null, sharpeRatio: 0.82,
    },
    totalAssets: 14320,
  }),
];

// ===========================================================================
// חיסכון לכל ילד
// ===========================================================================
const childSavings: Fund[] = [
  fund({
    fundNumber: '6001',
    name: 'מנורה מבטחים חיסכון לכל ילד כללי',
    company: 'menora',
    productType: 'child_savings',
    specialization: 'general',
    stockExposure: 50,
    returns: { month: 1.25, ytd: 2.52, year1: 15.85, year2: 9.42, year3: 8.15, year5: 7.98 },
    monthlyReturns: monthly([1.25, 1.27, 0.89, 1.45, 1.13, 1.95, -0.38, 1.73, 1.60, 0.80, 1.22, 1.95]),
    fees: defaultFees(0, 0.00),
    deepDrill: {
      directExpenses: 0.05, expectedAnnualCost: 0.05, foreignExposure: 28.5, currencyExposure: 16.2,
      designatedBonds: 0, govBondsTradable: 12.8, corpBondsTradable: 15.5, corpBondsNonTradable: 4.2,
      stocksAndOptions: 50.2, deposits: 2.5, mutualFunds: 3.5, loans: 0, cashEquivalents: 5.8, otherAssets: 5.5,
      stdDev36: 7.82, stdDev60: 8.45, actuarialSurplus: null, sharpeRatio: 1.05,
    },
    totalAssets: 18920,
  }),
  fund({
    fundNumber: '6002',
    name: 'הפניקס חיסכון לכל ילד כללי',
    company: 'fenix',
    productType: 'child_savings',
    specialization: 'general',
    stockExposure: 50,
    returns: { month: 1.28, ytd: 2.58, year1: 16.12, year2: 9.55, year3: 8.28, year5: 8.12 },
    monthlyReturns: monthly([1.28, 1.30, 0.91, 1.48, 1.15, 1.98, -0.40, 1.77, 1.64, 0.82, 1.25, 1.98]),
    fees: defaultFees(0, 0.00),
    deepDrill: {
      directExpenses: 0.04, expectedAnnualCost: 0.04, foreignExposure: 30.2, currencyExposure: 17.5,
      designatedBonds: 0, govBondsTradable: 12.2, corpBondsTradable: 15.0, corpBondsNonTradable: 4.0,
      stocksAndOptions: 50.5, deposits: 2.2, mutualFunds: 3.8, loans: 0, cashEquivalents: 5.5, otherAssets: 6.8,
      stdDev36: 7.92, stdDev60: 8.55, actuarialSurplus: null, sharpeRatio: 1.08,
    },
    totalAssets: 16780,
  }),
];

// ===========================================================================
// Export: all funds + helpers
// ===========================================================================
export const allFunds: Fund[] = [
  ...hishtalmutGeneral,
  ...hishtalmutStocks,
  ...hishtalmutBonds,
  ...hishtalmutHalacha,
  ...gemelGeneral,
  ...gemelStocks,
  ...gemelInvestGeneral,
  ...pensiaGeneral,
  ...pensiaStocks,
  ...polisaGeneral,
  ...childSavings,
];

export const cmaLastUpdate = 'פברואר 2025';

// קבלת קרנות לפי סוג מוצר
export const getFundsByProduct = (type: ProductType) =>
  allFunds.filter((f) => f.productType === type);

// קבלת קרנות לפי חברה
export const getFundsByCompany = (company: ManagingCompany) =>
  allFunds.filter((f) => f.company === company);

// קבלת קרנות לפי התמחות
export const getFundsBySpecialization = (spec: Specialization) =>
  allFunds.filter((f) => f.specialization === spec);

// חיפוש לפי שם או מספר קופה
export const searchFunds = (query: string, productType?: ProductType) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  let pool = productType ? getFundsByProduct(productType) : allFunds;
  return pool.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.fundNumber.includes(q)
  );
};

// מציאת הקופות הטובות ביותר
export const getTopFunds = (
  productType: ProductType,
  returnPeriod: 'year1' | 'year2' | 'year3' | 'year5',
  count: number,
  companies?: ManagingCompany[],
  specializations?: Specialization[],
  stockRange?: [number, number]
): Fund[] => {
  let pool = getFundsByProduct(productType);

  if (companies && companies.length > 0) {
    pool = pool.filter((f) => companies.includes(f.company));
  }
  if (specializations && specializations.length > 0) {
    pool = pool.filter((f) => specializations.includes(f.specialization));
  }
  if (stockRange) {
    pool = pool.filter(
      (f) => f.stockExposure >= stockRange[0] && f.stockExposure <= stockRange[1]
    );
  }

  return pool
    .sort((a, b) => b.returns[returnPeriod] - a.returns[returnPeriod])
    .slice(0, count);
};

// חישוב עלות שנתית צפויה
export const calculateAnnualCost = (
  fund: Fund,
  balance: number,
  annualDeposit: number
): number => {
  const depositCost = annualDeposit * (fund.fees.depositFeePercent / 100);
  const savingsCost = balance * (fund.fees.savingsFeePercent / 100);
  const directCost = balance * (fund.deepDrill.directExpenses / 100);
  return depositCost + savingsCost + directCost;
};

// חישוב ממוצע משוקלל
export const calculateWeightedAverage = (
  funds: { fund: Fund; balance: number }[]
): { year1: number; year2: number; year3: number; year5: number; totalBalance: number } => {
  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  if (totalBalance === 0) return { year1: 0, year2: 0, year3: 0, year5: 0, totalBalance: 0 };

  const calc = (key: 'year1' | 'year2' | 'year3' | 'year5') =>
    funds.reduce((sum, f) => sum + f.fund.returns[key] * (f.balance / totalBalance), 0);

  return {
    year1: calc('year1'),
    year2: calc('year2'),
    year3: calc('year3'),
    year5: calc('year5'),
    totalBalance,
  };
};

// קבלת חברות ייחודיות לפי סוג מוצר
export const getCompaniesForProduct = (type: ProductType): ManagingCompany[] => {
  const funds = getFundsByProduct(type);
  return [...new Set(funds.map((f) => f.company))];
};

// קבלת התמחויות ייחודיות לפי סוג מוצר
export const getSpecializationsForProduct = (type: ProductType): Specialization[] => {
  const funds = getFundsByProduct(type);
  return [...new Set(funds.map((f) => f.specialization))];
};
