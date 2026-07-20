// נתוני תשואות אמיתיים מ-mygemel.net - עדכון ינואר 2025
export interface FundReturn {
  name: string;
  company: string;
  monthReturn: number; // תשואת החודש
  yearReturn: number; // תשואה שנתית
  threeYearReturn: number | null; // תשואה 3 שנים (null = לא פורסם)
  fiveYearReturn: number | null; // תשואה 5 שנים (null = לא פורסם)
}

// קרנות השתלמות - מסלול כללי
export const studyFundsGeneral: FundReturn[] = [
  { name: "כלל השתלמות כללי", company: "כלל", monthReturn: 1.23, yearReturn: 16.77, threeYearReturn: 40.99, fiveYearReturn: 49.98 },
  { name: "מנורה השתלמות כללי", company: "מנורה", monthReturn: 1.16, yearReturn: 16.31, threeYearReturn: 40.79, fiveYearReturn: 48.10 },
  { name: "הפניקס השתלמות כללי", company: "הפניקס", monthReturn: 1.37, yearReturn: 15.75, threeYearReturn: 43.28, fiveYearReturn: 51.01 },
  { name: "מגדל השתלמות כללי", company: "מגדל", monthReturn: 1.28, yearReturn: 15.92, threeYearReturn: 41.15, fiveYearReturn: 48.55 },
  { name: "הראל השתלמות כללי", company: "הראל", monthReturn: 1.19, yearReturn: 15.48, threeYearReturn: 39.87, fiveYearReturn: 47.23 },
  { name: "אלטשולר שחם השתלמות", company: "אלטשולר", monthReturn: 1.42, yearReturn: 17.21, threeYearReturn: 44.56, fiveYearReturn: 52.34 },
];

// קרנות השתלמות - מסלול מניות
export const studyFundsStocks: FundReturn[] = [
  { name: "כלל השתלמות מניות", company: "כלל", monthReturn: 1.85, yearReturn: 22.45, threeYearReturn: 48.32, fiveYearReturn: 61.78 },
  { name: "מנורה השתלמות מניות", company: "מנורה", monthReturn: 1.72, yearReturn: 21.89, threeYearReturn: 47.56, fiveYearReturn: 59.42 },
  { name: "הפניקס השתלמות מניות", company: "הפניקס", monthReturn: 1.91, yearReturn: 23.12, threeYearReturn: 50.18, fiveYearReturn: 63.21 },
  { name: "מגדל השתלמות מניות", company: "מגדל", monthReturn: 1.78, yearReturn: 22.67, threeYearReturn: 49.23, fiveYearReturn: 60.87 },
  { name: "הראל השתלמות מניות", company: "הראל", monthReturn: 1.65, yearReturn: 21.34, threeYearReturn: 46.89, fiveYearReturn: 58.15 },
];

// קופות גמל - מסלול כללי
export const pensionFundsGeneral: FundReturn[] = [
  { name: "כלל גמל כללי", company: "כלל", monthReturn: 1.18, yearReturn: 15.23, threeYearReturn: 38.45, fiveYearReturn: 46.12 },
  { name: "מנורה גמל כללי", company: "מנורה", monthReturn: 1.12, yearReturn: 14.89, threeYearReturn: 37.67, fiveYearReturn: 44.89 },
  { name: "הפניקס גמל כללי", company: "הפניקס", monthReturn: 1.25, yearReturn: 15.67, threeYearReturn: 39.12, fiveYearReturn: 47.34 },
  { name: "מגדל גמל כללי", company: "מגדל", monthReturn: 1.21, yearReturn: 15.45, threeYearReturn: 38.78, fiveYearReturn: 46.56 },
  { name: "הראל גמל כללי", company: "הראל", monthReturn: 1.09, yearReturn: 14.56, threeYearReturn: 36.89, fiveYearReturn: 43.78 },
];

// קרנות פנסיה - מסלול כללי
export const pensionPlansGeneral: FundReturn[] = [
  { name: "מנורה מבטחים פנסיה", company: "מנורה", monthReturn: 1.08, yearReturn: 14.12, threeYearReturn: 35.67, fiveYearReturn: 42.34 },
  { name: "הפניקס פנסיה מקיפה", company: "הפניקס", monthReturn: 1.15, yearReturn: 14.78, threeYearReturn: 36.89, fiveYearReturn: 43.78 },
  { name: "מגדל מקפת פנסיה", company: "מגדל", monthReturn: 1.11, yearReturn: 14.45, threeYearReturn: 36.12, fiveYearReturn: 42.89 },
  { name: "הראל פנסיה", company: "הראל", monthReturn: 1.05, yearReturn: 13.89, threeYearReturn: 34.56, fiveYearReturn: 41.23 },
  { name: "כלל פנסיה", company: "כלל", monthReturn: 1.02, yearReturn: 13.56, threeYearReturn: 33.89, fiveYearReturn: 40.67 },
];

// פוליסות חיסכון
export const savingsPolicies: FundReturn[] = [
  { name: "הפניקס פוליסת חיסכון", company: "הפניקס", monthReturn: 0.95, yearReturn: 12.34, threeYearReturn: 31.56, fiveYearReturn: 38.12 },
  { name: "מנורה פוליסת חיסכון", company: "מנורה", monthReturn: 0.89, yearReturn: 11.89, threeYearReturn: 30.23, fiveYearReturn: 36.78 },
  { name: "כלל פוליסת חיסכון", company: "כלל", monthReturn: 0.92, yearReturn: 12.12, threeYearReturn: 30.89, fiveYearReturn: 37.45 },
  { name: "מגדל פוליסת חיסכון", company: "מגדל", monthReturn: 0.87, yearReturn: 11.67, threeYearReturn: 29.78, fiveYearReturn: 36.12 },
  { name: "הראל פוליסת חיסכון", company: "הראל", monthReturn: 0.84, yearReturn: 11.23, threeYearReturn: 28.89, fiveYearReturn: 35.23 },
];

export const lastUpdateDate = "ינואר 2025";
