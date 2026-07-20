import { useState } from 'react';
import { ChevronDown, ChevronUp, X, TrendingUp, TrendingDown, Building2, Percent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Fund } from '@/types/fund';
import { companyLabels, specializationLabels } from '@/types/fund';

interface FundCardProps {
  fund: Fund;
  rank?: number;
  onRemove?: (id: string) => void;
  showMonthly?: boolean;
  showDeepDrill?: boolean;
}

const pct = (v: number | null) => (v === null ? '—' : `${v.toFixed(2)}%`);

// Assets arrive in millions ILS — show billions past 1,000M
const formatAssets = (millions: number) =>
  millions >= 1000
    ? `${(millions / 1000).toLocaleString('he-IL', { maximumFractionDigits: 1 })} מיליארד ₪`
    : `${millions.toLocaleString('he-IL')} מיליון ₪`;

const ReturnBadge = ({ value, label }: { value: number | null; label: string }) => {
  if (value === null) {
    return (
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-muted-foreground">—</p>
      </div>
    );
  }
  const positive = value >= 0;
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {value.toFixed(2)}%
      </p>
    </div>
  );
};

export default function FundCard({ fund, rank, onRemove, showMonthly = false, showDeepDrill = false }: FundCardProps) {
  const [localShowMonthly, setLocalShowMonthly] = useState(showMonthly);
  const [localShowDeep, setLocalShowDeep] = useState(showDeepDrill);

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md min-w-[280px]">
      {rank && (
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          {rank}
        </div>
      )}
      {onRemove && (
        <button
          onClick={() => onRemove(fund.id)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <CardContent className="p-4 pt-5 space-y-3">
        {/* כותרת */}
        <div className="text-center pt-1">
          <h3 className="font-bold text-sm leading-tight">{fund.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {fund.fundNumber}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Building2 className="w-3 h-3" />
              {companyLabels[fund.company]}
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px] mt-1">
            {specializationLabels[fund.specialization]}
          </Badge>
        </div>

        <Separator />

        {/* תשואות מצטברות */}
        <div className="grid grid-cols-2 gap-2">
          <ReturnBadge value={fund.returns.month} label="חודש אחרון" />
          <ReturnBadge value={fund.returns.year1} label="מתחילת השנה" />
          <ReturnBadge value={fund.returns.year3} label="ממוצע 3 שנים" />
          <ReturnBadge value={fund.returns.year5} label="ממוצע 5 שנים" />
        </div>

        {/* חשיפה למניות */}
        <div className="flex items-center justify-center gap-1 text-xs bg-muted rounded-lg py-1.5 px-2">
          <Percent className="w-3 h-3" />
          <span>חשיפה למניות:</span>
          <span className="font-bold">{fund.stockExposure === null ? '—' : `${fund.stockExposure}%`}</span>
        </div>

        {/* דמי ניהול */}
        <div className="text-center text-xs space-y-0.5">
          <p className="text-muted-foreground">דמי ניהול</p>
          <div className="flex justify-center gap-3">
            <span>הפקדה: <strong>{fund.fees.depositFeePercent}%</strong></span>
            <span>צבירה: <strong>{fund.fees.savingsFeePercent}%</strong></span>
          </div>
        </div>

        {/* תשואות חודשיות (מתקפל) */}
        <button
          onClick={() => setLocalShowMonthly(!localShowMonthly)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <span>תשואות חודשיות</span>
          {localShowMonthly ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {localShowMonthly && (
          <div className="space-y-1 text-xs">
            {fund.monthlyReturns.map((mr) => (
              <div key={mr.month} className="flex justify-between px-1">
                <span className="text-muted-foreground">{mr.month}</span>
                <span className={mr.value >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {mr.value >= 0 ? '+' : ''}{mr.value.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* חקירה לעומק (מתקפל) */}
        <button
          onClick={() => setLocalShowDeep(!localShowDeep)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <span>חקירה לעומק</span>
          {localShowDeep ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {localShowDeep && (
          <div className="space-y-1 text-xs">
            <Row label="הוצאות ישירות" value={pct(fund.deepDrill.directExpenses)} />
            <Row label="עלות שנתית צפויה" value={pct(fund.deepDrill.expectedAnnualCost)} />
            <Row label={'חשיפה לחו"ל'} value={pct(fund.deepDrill.foreignExposure)} />
            <Row label='חשיפה למט"ח' value={pct(fund.deepDrill.currencyExposure)} />
            <Separator className="my-1" />
            <Row label={'אג"ח מיועדות'} value={pct(fund.deepDrill.designatedBonds)} />
            <Row label={'אג"ח ממשלתי סחיר'} value={pct(fund.deepDrill.govBondsTradable)} />
            <Row label={'אג"ח קונצרני סחיר'} value={pct(fund.deepDrill.corpBondsTradable)} />
            <Row label={'אג"ח קונצרני לא סחיר'} value={pct(fund.deepDrill.corpBondsNonTradable)} />
            <Row label="מניות/אופציות" value={pct(fund.deepDrill.stocksAndOptions)} />
            <Row label="פיקדונות" value={pct(fund.deepDrill.deposits)} />
            <Row label="קרנות נאמנות" value={pct(fund.deepDrill.mutualFunds)} />
            <Row label={'מזומנים ושו"מ'} value={pct(fund.deepDrill.cashEquivalents)} />
            <Row label="נכסים אחרים" value={pct(fund.deepDrill.otherAssets)} />
            <Separator className="my-1" />
            <Row label="סטיית תקן 36 חוד." value={fund.deepDrill.stdDev36 !== null ? fund.deepDrill.stdDev36.toFixed(2) : '—'} />
            <Row label="סטיית תקן 60 חוד." value={fund.deepDrill.stdDev60 !== null ? fund.deepDrill.stdDev60.toFixed(2) : '—'} />
            <Row label="מדד שארפ" value={fund.deepDrill.sharpeRatio !== null ? fund.deepDrill.sharpeRatio.toFixed(2) : '—'} />
            {fund.deepDrill.actuarialSurplus !== null && (
              <Row label="עודף/גירעון אקטוארי" value={pct(fund.deepDrill.actuarialSurplus)} />
            )}
          </div>
        )}

        {/* נכסים בניהול */}
        {fund.totalAssets > 0 && (
          <div className="text-center text-[10px] text-muted-foreground pt-1">
            נכסים בניהול: {formatAssets(fund.totalAssets)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
