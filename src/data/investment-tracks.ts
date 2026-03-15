export const investmentTracks = [
  'כללי',
  'מניות',
  'עוקב S&P 500',
  'מדדי מניות',
  'מסלול אג"ח',
  'אג"ח ממשלות',
  'עוקב מדדי אג"ח',
  'אג"ח סחיר',
  'אג"ח סחיר עד 25% מניות',
  'עד 25% מניות',
  'משולב סחיר',
  'מניות סחיר',
  'הלכתי',
  'גילאי 50 ומטה',
  'גילאי 50–60',
  'גילאי 60 ומעלה',
  'סיכון גבוה',
  'סיכון בינוני',
  'סיכון נמוך',
  'קיימות',
  'שריעה / הלכה אסלאמית',
  'אחר',
] as const;

export type InvestmentTrack = typeof investmentTracks[number];

export const riskLevels = ['נמוך', 'בינוני', 'גבוה'] as const;
export type RiskLevel = typeof riskLevels[number];

export const actionTypesNew = ['שחלוף', 'מינוי סוכן', 'ניוד', 'שינוי מוצר', 'הצטרפות בלבד'] as const;
export type ActionTypeNew = typeof actionTypesNew[number];
