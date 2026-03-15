import { FundReturn } from "@/data/fundReturns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FundReturnTableProps {
  funds: FundReturn[];
  title: string;
}

const FundReturnTable = ({ funds, title }: FundReturnTableProps) => {
  const formatPercent = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center gap-1 justify-center font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {value.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="bg-muted px-6 py-4">
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם הקרן</TableHead>
              <TableHead className="text-center">חברה</TableHead>
              <TableHead className="text-center">חודש</TableHead>
              <TableHead className="text-center">שנה</TableHead>
              <TableHead className="text-center">3 שנים</TableHead>
              <TableHead className="text-center">5 שנים</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funds.map((fund, index) => (
              <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-right">{fund.name}</TableCell>
                <TableCell className="text-center text-muted-foreground">{fund.company}</TableCell>
                <TableCell>{formatPercent(fund.monthReturn)}</TableCell>
                <TableCell>{formatPercent(fund.yearReturn)}</TableCell>
                <TableCell>{formatPercent(fund.threeYearReturn)}</TableCell>
                <TableCell>{formatPercent(fund.fiveYearReturn)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FundReturnTable;
