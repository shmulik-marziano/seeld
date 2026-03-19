import { Search, SlidersHorizontal, Building2, Target, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SearchMode, ReturnPeriod } from '@/hooks/useFundSearch';
import type { ProductType, ManagingCompany, Specialization } from '@/types/fund';
import { productTypeLabels, companyLabels, specializationLabels } from '@/types/fund';

interface FundSearchPanelProps {
  mode: SearchMode;
  productType: ProductType;
  returnPeriod: ReturnPeriod;
  topCount: 3 | 5 | 8;
  selectedCompanies: ManagingCompany[];
  selectedSpecializations: Specialization[];
  stockRange: [number, number];
  browseBy: 'company' | 'specialization';
  browseValue: string;
  directQuery: string;
  availableCompanies: ManagingCompany[];
  availableSpecializations: Specialization[];
  autocompleteResults: { id: string; name: string; fundNumber: string; company: ManagingCompany }[];
  onSetMode: (mode: SearchMode) => void;
  onSetProductType: (type: ProductType) => void;
  onSetReturnPeriod: (period: ReturnPeriod) => void;
  onSetTopCount: (count: 3 | 5 | 8) => void;
  onToggleCompany: (company: ManagingCompany) => void;
  onToggleSpecialization: (spec: Specialization) => void;
  onSetStockRange: (range: [number, number]) => void;
  onSetBrowseBy: (by: 'company' | 'specialization') => void;
  onSetBrowseValue: (value: string) => void;
  onSetDirectQuery: (query: string) => void;
  onSearchTop: () => void;
  onSearchBrowse: () => void;
  onSearchDirect: () => void;
  onAddFund: (fund: any) => void;
  onReset: () => void;
}

const returnPeriodLabels: Record<ReturnPeriod, string> = {
  year1: '12 חודשים',
  year2: '24 חודשים',
  year3: '36 חודשים',
  year5: '60 חודשים',
};

export default function FundSearchPanel(props: FundSearchPanelProps) {
  const {
    mode, productType, returnPeriod, topCount,
    selectedCompanies, selectedSpecializations, stockRange,
    browseBy, browseValue, directQuery,
    availableCompanies, availableSpecializations, autocompleteResults,
    onSetMode, onSetProductType, onSetReturnPeriod, onSetTopCount,
    onToggleCompany, onToggleSpecialization, onSetStockRange,
    onSetBrowseBy, onSetBrowseValue, onSetDirectQuery,
    onSearchTop, onSearchBrowse, onSearchDirect, onAddFund, onReset,
  } = props;

  return (
    <div className="space-y-6">
      {/* סוג מוצר — משותף לכל המצבים */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">סוג מוצר</Label>
        <Select value={productType} onValueChange={(v) => onSetProductType(v as ProductType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(productTypeLabels) as ProductType[]).map((key) => (
              <SelectItem key={key} value={key}>
                {productTypeLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* טאבים לבחירת מצב חיפוש */}
      <Tabs value={mode} onValueChange={(v) => onSetMode(v as SearchMode)}>
        <TabsList className="w-full grid grid-cols-3 h-auto">
          <TabsTrigger value="top" className="text-xs gap-1 py-2">
            <Target className="w-3.5 h-3.5" />
            אטרקטיביות
          </TabsTrigger>
          <TabsTrigger value="browse" className="text-xs gap-1 py-2">
            <Building2 className="w-3.5 h-3.5" />
            חברה / התמחות
          </TabsTrigger>
          <TabsTrigger value="direct" className="text-xs gap-1 py-2">
            <Search className="w-3.5 h-3.5" />
            חיפוש ישיר
          </TabsTrigger>
        </TabsList>

        {/* ===== מצב 1: איתור אטרקטיביות ===== */}
        <TabsContent value="top" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm">תשואה מקסימלית</Label>
            <Select value={returnPeriod} onValueChange={(v) => onSetReturnPeriod(v as ReturnPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(returnPeriodLabels) as ReturnPeriod[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {returnPeriodLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">קופות להצגה</Label>
            <Select value={String(topCount)} onValueChange={(v) => onSetTopCount(Number(v) as 3 | 5 | 8)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 הטובות ביותר</SelectItem>
                <SelectItem value="5">5 הטובות ביותר</SelectItem>
                <SelectItem value="8">8 הטובות ביותר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* סינון חברות */}
          <div className="space-y-2">
            <Label className="text-sm">סינון חברות</Label>
            <ScrollArea className="h-32 rounded-lg border p-2">
              <div className="space-y-1.5">
                {availableCompanies.map((company) => (
                  <label key={company} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox
                      checked={selectedCompanies.includes(company)}
                      onCheckedChange={() => onToggleCompany(company)}
                    />
                    {companyLabels[company]}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* סינון התמחויות */}
          <div className="space-y-2">
            <Label className="text-sm">סינון התמחויות</Label>
            <ScrollArea className="h-28 rounded-lg border p-2">
              <div className="space-y-1.5">
                {availableSpecializations.map((spec) => (
                  <label key={spec} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox
                      checked={selectedSpecializations.includes(spec)}
                      onCheckedChange={() => onToggleSpecialization(spec)}
                    />
                    {specializationLabels[spec]}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* טווח מניות */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                טווח מניות
              </Label>
              <span className="text-xs text-muted-foreground font-mono">
                {stockRange[0]}% — {stockRange[1]}%
              </span>
            </div>
            <Slider
              value={stockRange}
              onValueChange={(v) => onSetStockRange(v as [number, number])}
              min={0}
              max={100}
              step={5}
              minStepsBetweenThumbs={1}
            />
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onSearchTop} className="flex-1">
              <Search className="w-4 h-4 ml-1" />
              הצג
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </TabsContent>

        {/* ===== מצב 2: חברה / התמחות ===== */}
        <TabsContent value="browse" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm">חיפוש לפי</Label>
            <Select value={browseBy} onValueChange={(v) => onSetBrowseBy(v as 'company' | 'specialization')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">חברה</SelectItem>
                <SelectItem value="specialization">התמחות</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">
              {browseBy === 'company' ? 'בחר חברה' : 'בחר התמחות'}
            </Label>
            <Select value={browseValue} onValueChange={onSetBrowseValue}>
              <SelectTrigger>
                <SelectValue placeholder="בחר..." />
              </SelectTrigger>
              <SelectContent>
                {browseBy === 'company'
                  ? availableCompanies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {companyLabels[c]}
                      </SelectItem>
                    ))
                  : availableSpecializations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {specializationLabels[s]}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onSearchBrowse} className="w-full" disabled={!browseValue}>
            <Search className="w-4 h-4 ml-1" />
            הוסף
          </Button>
        </TabsContent>

        {/* ===== מצב 3: חיפוש ישיר ===== */}
        <TabsContent value="direct" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm">שם קופה או מספר</Label>
            <div className="relative">
              <Input
                value={directQuery}
                onChange={(e) => onSetDirectQuery(e.target.value)}
                placeholder='לדוגמה: "אלטשולר" או "512"'
                onKeyDown={(e) => e.key === 'Enter' && onSearchDirect()}
              />
              {autocompleteResults.length > 0 && directQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {autocompleteResults.map((fund) => (
                    <button
                      key={fund.id}
                      className="w-full text-right px-3 py-2 hover:bg-muted text-sm border-b last:border-0"
                      onClick={() => {
                        onAddFund(fund);
                        onSetDirectQuery('');
                      }}
                    >
                      <span className="font-medium">{fund.name}</span>
                      <span className="text-muted-foreground mr-2">({fund.fundNumber})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button onClick={onSearchDirect} className="w-full">
            <Search className="w-4 h-4 ml-1" />
            הצג
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
