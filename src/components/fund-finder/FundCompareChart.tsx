import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { Fund } from '@/types/fund';
import { companyLabels } from '@/types/fund';

interface FundCompareChartProps {
  funds: Fund[];
}

// Greyscale-led categorical palette (SEELD Mono) — chip colors only for emphasis
const COLORS = [
  '#171717', '#6e6e6e', '#b45309', '#15803d',
  '#a16207', '#a3a3a3', '#4d4d4d', '#d4d4d4',
];

export default function FundCompareChart({ funds }: FundCompareChartProps) {
  const maxReturn = useMemo(
    () => Math.max(...funds.map((f) => f.returns.year1), 1),
    [funds]
  );

  if (funds.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          השוואת תשואות מתחילת השנה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {funds.map((fund, i) => {
          const barWidth = (fund.returns.year1 / maxReturn) * 100;
          const color = COLORS[i % COLORS.length];
          return (
            <div key={fund.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium truncate max-w-[180px]">{fund.name}</span>
                <span className="font-bold" style={{ color }}>
                  {fund.returns.year1.toFixed(2)}%
                </span>
              </div>
              <div className="h-6 bg-muted rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-700 flex items-center justify-end px-2"
                  style={{
                    width: `${Math.max(8, barWidth)}%`,
                    backgroundColor: color,
                  }}
                >
                  <span className="text-[10px] font-medium text-white">
                    {companyLabels[fund.company]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* פירוט לפי תקופות */}
        {funds.length > 1 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-1.5 pr-1 font-medium text-muted-foreground">קופה</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">חודש אחרון</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">מתחילת השנה</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">ממוצע 3 שנים</th>
                  <th className="text-center py-1.5 font-medium text-muted-foreground">ממוצע 5 שנים</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund, i) => (
                  <tr key={fund.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-1.5 pr-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px] font-medium">{fund.name}</span>
                      </div>
                    </td>
                    <td className={`text-center font-medium ${fund.returns.month >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.returns.month.toFixed(2)}%
                    </td>
                    <td className={`text-center font-medium ${fund.returns.year1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.returns.year1.toFixed(2)}%
                    </td>
                    <td className={`text-center font-medium ${fund.returns.year3 === null ? 'text-muted-foreground' : fund.returns.year3 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.returns.year3 === null ? '—' : `${fund.returns.year3.toFixed(2)}%`}
                    </td>
                    <td className={`text-center font-medium ${fund.returns.year5 === null ? 'text-muted-foreground' : fund.returns.year5 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fund.returns.year5 === null ? '—' : `${fund.returns.year5.toFixed(2)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
