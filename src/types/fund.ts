// סוגי מוצרים פיננסיים - בהתאם לנכסנט / גמלנט / ביטוחנט / פנסיהנט
export type ProductType =
  | 'gemel'           // קופת גמל
  | 'gemel_invest'    // קופת גמל להשקעה
  | 'hishtalmut'      // קרן השתלמות
  | 'pensia'          // קרן פנסיה
  | 'polisa'          // פוליסת ביטוח (חיסכון)
  | 'child_savings';  // חיסכון לכל ילד

export const productTypeLabels: Record<ProductType, string> = {
  gemel: 'קופות גמל',
  gemel_invest: 'קופות גמל להשקעה',
  hishtalmut: 'קרנות השתלמות',
  pensia: 'קרנות פנסיה',
  polisa: 'פוליסות חיסכון',
  child_savings: 'חיסכון לכל ילד',
};

// התמחויות מסלולי השקעה
export type Specialization =
  | 'general'
  | 'stocks'
  | 'bonds'
  | 'bonds_tradable'
  | 'money_market'
  | 'foreign'
  | 'index_tracking'
  | 'halacha'
  | 'sustainability'
  | 'guaranteed'
  | 'combined_tradable'
  | 'stocks_tradable'
  | 'age_under_50'
  | 'age_50_60'
  | 'age_over_60'
  | 'credit_bonds'
  | 'other';

export const specializationLabels: Record<Specialization, string> = {
  general: 'כללי',
  stocks: 'מניות',
  bonds: 'אג"ח',
  bonds_tradable: 'אג"ח סחיר',
  money_market: 'כספי (שקלי)',
  foreign: 'חו"ל',
  index_tracking: 'עוקבי מדדים',
  halacha: 'הלכתי',
  sustainability: 'קיימות',
  guaranteed: 'מבטיח תשואה',
  combined_tradable: 'משולב סחיר',
  stocks_tradable: 'מניות סחיר',
  age_under_50: 'גילאי 50 ומטה',
  age_50_60: 'גילאי 50-60',
  age_over_60: 'גילאי 60 ומעלה',
  credit_bonds: 'אשראי ואג"ח',
  other: 'אחר',
};

// חברות מנהלות
export type ManagingCompany =
  | 'altshuler'
  | 'analyst'
  | 'ayalon'
  | 'clal'
  | 'fenix'
  | 'harel'
  | 'ibi'
  | 'infinity'
  | 'meitav'
  | 'menora'
  | 'migdal'
  | 'mor'
  | 'psagot'
  | 'yelin';

export const companyLabels: Record<ManagingCompany, string> = {
  altshuler: 'אלטשולר שחם',
  analyst: 'אנליסט',
  ayalon: 'איילון',
  clal: 'כלל',
  fenix: 'הפניקס',
  harel: 'הראל',
  ibi: 'אי.בי.אי',
  infinity: 'אינפיניטי',
  meitav: 'מיטב',
  menora: 'מנורה מבטחים',
  migdal: 'מגדל',
  mor: 'מור',
  psagot: 'פסגות',
  yelin: 'ילין לפידות',
};

// תשואות חודשיות
export interface MonthlyReturn {
  month: string; // '2025-01', '2025-02', etc.
  value: number; // אחוז
}

// נתוני חקירה לעומק (הרכב נכסים + סיכון)
export interface DeepDrillData {
  directExpenses: number;          // הוצאות ישירות (%)
  expectedAnnualCost: number;      // עלות שנתית צפויה (%)
  foreignExposure: number;         // חשיפה לחו"ל (%)
  currencyExposure: number;        // חשיפה למט"ח (%)
  designatedBonds: number;         // אג"ח מיועדות (%)
  govBondsTradable: number;        // אג"ח ממשלתיות סחירות (%)
  corpBondsTradable: number;       // אג"ח קונצרני סחיר + תעודות סל (%)
  corpBondsNonTradable: number;    // אג"ח קונצרניות לא סחיר (%)
  stocksAndOptions: number;        // מניות/אופציות ותעודות סל (%)
  deposits: number;                // פיקדונות (%)
  mutualFunds: number;             // קרנות נאמנות (%)
  loans: number;                   // הלוואות (%)
  cashEquivalents: number;         // מזומנים ושווי מזומנים (%)
  otherAssets: number;             // נכסים אחרים (%)
  stdDev36: number | null;         // סטיית תקן 36 חודשים
  stdDev60: number | null;         // סטיית תקן 60 חודשים
  actuarialSurplus: number | null; // עודף/גירעון אקטוארי
  sharpeRatio: number | null;      // מדד שארפ
}

// דמי ניהול
export interface ManagementFees {
  depositFeePercent: number;   // דמי ניהול מהפקדה (%)
  savingsFeePercent: number;   // דמי ניהול מצבירה (%)
  maxDepositFee: number;       // מקסימום דמי ניהול מהפקדה (%)
  maxSavingsFee: number;       // מקסימום דמי ניהול מצבירה (%)
}

// מבנה נתונים מלא לקופה/קרן
export interface Fund {
  id: string;                        // מזהה ייחודי
  fundNumber: string;                // מספר קופה
  name: string;                      // שם הקופה
  company: ManagingCompany;          // חברה מנהלת
  productType: ProductType;          // סוג מוצר
  specialization: Specialization;    // התמחות
  stockExposure: number;             // חשיפה למניות (%)

  // תשואות מצטברות
  returns: {
    month: number;      // תשואת חודש אחרון (%)
    ytd: number;        // תשואה מתחילת השנה (%)
    year1: number;      // תשואה 12 חודשים (%)
    year2: number;      // תשואה ממוצעת שנתית 24 חוד. (%)
    year3: number;      // תשואה ממוצעת שנתית 36 חוד. (%)
    year5: number;      // תשואה ממוצעת שנתית 60 חוד. (%)
  };

  // תשואות חודשיות (12 חודשים אחרונים)
  monthlyReturns: MonthlyReturn[];

  // דמי ניהול
  fees: ManagementFees;

  // נתוני חקירה לעומק
  deepDrill: DeepDrillData;

  // מטא-דאטה
  totalAssets: number;               // סה"כ נכסים (מיליוני ₪)
  lastUpdate: string;                // תאריך עדכון אחרון
  isActive: boolean;                 // האם פעילה
}

// פילטרים לחיפוש
export interface FundSearchFilters {
  productType: ProductType;
  returnPeriod: 'year1' | 'year2' | 'year3' | 'year5';
  topCount: 3 | 5 | 8;
  companies: ManagingCompany[];
  specializations: Specialization[];
  stockExposureRange: [number, number]; // [min, max] 0-100
}

// חיפוש לפי חברה/התמחות
export interface FundBrowseFilters {
  productType: ProductType;
  searchBy: 'company' | 'specialization';
  value: string;
}

// חיפוש לפי שם/מספר
export interface FundDirectSearch {
  productType: ProductType;
  query: string; // שם קופה או מספר
}

// תוצאת חישוב עלות
export interface CostCalculation {
  fundId: string;
  depositFee: number;
  savingsFee: number;
  balance: number;
  annualDeposit: number;
  directExpenses: number;
  totalAnnualCost: number;
}

// תוצאת ממוצע משוקלל
export interface WeightedAverageResult {
  funds: { fundId: string; balance: number; weight: number }[];
  weightedReturn: {
    year1: number;
    year2: number;
    year3: number;
    year5: number;
  };
  totalBalance: number;
}
