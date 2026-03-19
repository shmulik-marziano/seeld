import { useState, useMemo } from 'react';
import { Calculator, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Fund } from '@/types/fund';
import { calculateAnnualCost, calculateWeightedAverage } from '@/data/cmaFundsData';
import { companyLabels } from '@/types/fund';

interface FundCostCalculatorProps {
  funds: Fund[];
}

export default function FundCostCalculator({ funds }: FundCostCalculatorProps) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [deposits, setDeposits] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const costResults = useMemo(() => {
    if (!showResults) return [];
    return funds.map((fund) => {
      const balance = balances[fund.id] || 0;
      const deposit = deposits[fund.id] || 0;
      const annualCost = calculateAnnualCost(fund, balance, deposit);
      return { fund, balance, deposit, annualCost };
    });
  }, [funds, balances, deposits, showResults]);

  const weightedResult = useMemo(() => {
    if (!showResults) return null;
    const entries = funds
      .filter((f) => (balances[f.id] || 0) > 0)
      .map((f) => ({ fund: f, balance: balances[f.id] || 0 }));
    if (entries.length === 0) return null;
    return calculateWeightedAverage(entries);
  }, [funds, balances, showResults]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(v);

  if (funds.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          חישוב עלויות וממוצע משוקלל
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* טבלת הזנת נתונים */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2 pr-1 font-medium">קופה</th>
                <th className="text-center py-2 font-medium">יתרה (₪)</th>
                <th className="text-center py-2 font-medium">הפקדה שנתית (₪)</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((fund) => (
                <tr key={fund.id} className="border-b last:border-0">
                  <td className="py-2 pr-1">
                    <div>
                      <p className="font-medium text-xs">{fund.name}</p>
                      <p className="text-[10px] text-muted-foreground">{companyLabels[fund.company]}</p>
                    </div>
                  </td>
                  <td className="py-2 px-1">
                    <Input
                      type="number"
                      value={balances[fund.id] || ''}
                      onChange={(e) =>
                        setBalances((prev) => ({ ...prev, [fund.id]: Number(e.target.value) }))
                      }
                      placeholder="0"
                      className="text-center h-8 text-xs"
                      dir="ltr"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <Input
                      type="number"
                      value={deposits[fund.id] || ''}
                      onChange={(e) =>
                        setDeposits((prev) => ({ ...prev, [fund.id]: Number(e.target.value) }))
                      }
                      placeholder="0"
                      className="text-center h-8 text-xs"
                      dir="ltr"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* כפתורי חישוב */}
        <div className="flex gap-2">
          <Button onClick={() => setShowResults(true)} className="flex-1 text-sm">
            <Calculator className="w-4 h-4 ml-1" />
            חשב עלות שנתית
          </Button>
          <Button onClick={() => setShowResults(true)} variant="secondary" className="flex-1 text-sm">
            <Wallet className="w-4 h-4 ml-1" />
            חשב ממוצע משוקלל
          </Button>
        </div>

        {/* תוצאות עלות */}
        {showResults && costResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">עלות שנתית צפויה</h4>
              {costResults.map(({ fund, balance, annualCost }) => (
                <div key={fund.id} className="flex justify-between items-center text-xs bg-muted rounded-lg px-3 py-2">
                  <span className="truncate max-w-[160px]">{fund.name}</span>
                  <div className="text-left">
                    <span className="font-bold text-destructive">{formatCurrency(annualCost)}</span>
                    {balance > 0 && (
                      <span className="text-muted-foreground mr-1">
                        ({((annualCost / balance) * 100).toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* תוצאות ממוצע משוקלל */}
        {showResults && weightedResult && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">ממוצע משוקלל</h4>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  סה"כ יתרה: {formatCurrency(weightedResult.totalBalance)}
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">שנה</p>
                    <p className="text-lg font-bold text-primary">{weightedResult.year1.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">3 שנים</p>
                    <p className="text-lg font-bold text-primary">{weightedResult.year3.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">24 חוד.</p>
                    <p className="text-lg font-bold text-primary">{weightedResult.year2.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">5 שנים</p>
                    <p className="text-lg font-bold text-primary">{weightedResult.year5.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
