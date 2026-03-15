import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  result: { score: number; warnings: string[] };
}

export function ValidationResultPanel({ result }: Props) {
  const { score, warnings } = result;
  const isGood = score >= 80;
  const isMedium = score >= 50 && score < 80;

  const Icon = isGood ? CheckCircle2 : isMedium ? AlertTriangle : XCircle;
  const color = isGood ? 'text-success' : isMedium ? 'text-warning' : 'text-destructive';
  const progressColor = isGood ? '[&>div]:bg-success' : isMedium ? '[&>div]:bg-warning' : '[&>div]:bg-destructive';
  const label = isGood ? 'המסמך תקין' : isMedium ? 'נדרשים תיקונים קלים' : 'נדרשים תיקונים משמעותיים';

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className={`text-sm font-semibold ${color}`}>{label}</span>
          </div>
          <span className={`text-2xl font-bold ${color}`}>{score}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
        </div>
        <Progress value={score} className={`h-2 ${progressColor}`} />
        {warnings.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium text-muted-foreground">אזהרות:</p>
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
