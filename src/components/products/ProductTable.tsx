import { useState } from 'react';
import { Product, getMonthlyAmountLabel, getMonthlyAmount } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title: string;
  emoji: string;
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCreateRec: (product: Product) => void;
}

function CopyCell({ value, format }: { value?: string | number; format?: 'currency' | 'percent' }) {
  const [copied, setCopied] = useState(false);
  if (value === undefined || value === null || value === '') return <span className="text-muted-foreground/30">—</span>;

  let display = String(value);
  if (format === 'currency') display = `₪${Number(value).toLocaleString()}`;
  if (format === 'percent') display = `${value}%`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    toast.success('הועתק ללוח');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-1 hover:bg-accent/10 rounded px-1.5 py-0.5 transition-all cursor-pointer text-right active:scale-95"
      title="לחץ להעתקה"
    >
      <span className="text-sm font-medium">{display}</span>
      {copied ? (
        <Check className="h-3 w-3 text-success opacity-100" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
}

// Money products: pension, provident, hishtalmut
function MoneyProductTable({ products, onEdit, onDelete, onCreateRec }: Omit<Props, 'title' | 'emoji'>) {
  return (
    <table className="w-full text-sm" dir="rtl">
      <thead>
        <tr className="border-b border-border/50">
          {['חשבון/פוליסה', 'יצרן', 'מוצר', 'סטטוס', 'דמ״נ הפקדה', 'דמ״נ צבירה', 'צבירה', 'הפקדה חודשית', 'תשואה שנתית', 'מסלול השקעה', 'סיכון', 'הערות', ''].map(h => (
            <th key={h} className="text-right px-3 py-2.5 font-medium text-muted-foreground text-[11px] whitespace-nowrap tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {products.map(p => {
          const trackDisplay = p.investmentTrack === 'אחר' ? p.investmentTrackCustom : p.investmentTrack;
          return (
            <tr key={p.id} className={`border-b border-border/30 last:border-b-0 hover:bg-primary/3 transition-colors ${!p.manuallyCompleted ? 'bg-warning/5' : ''}`}>
              <td className="px-3 py-2.5"><CopyCell value={p.policyNumber || p.productNumber} /></td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  <CopyCell value={p.company} />
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-col">
                  <CopyCell value={p.productType} />
                  {p.subDescription && <span className="text-[10px] text-muted-foreground/70 pr-1">{p.subDescription}</span>}
                </div>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  {p.isActive ? (
                    <span className="text-[10px] font-medium text-success bg-success/8 px-2 py-0.5 rounded-full border border-success/15">פעיל</span>
                  ) : (
                    <span className="text-[10px] font-medium text-destructive bg-destructive/8 px-2 py-0.5 rounded-full border border-destructive/15">לא פעיל</span>
                  )}
                  {!p.manuallyCompleted && (
                    <span className="text-[10px] font-medium text-warning bg-warning/8 px-2 py-0.5 rounded-full border border-warning/15">השלמה</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5"><CopyCell value={p.managementFeeDeposit} format="percent" /></td>
              <td className="px-3 py-2.5"><CopyCell value={p.managementFeeAccumulation} format="percent" /></td>
              <td className="px-3 py-2.5"><CopyCell value={p.accumulation} format="currency" /></td>
              <td className="px-3 py-2.5"><CopyCell value={p.monthlyDeposit} format="currency" /></td>
              <td className="px-3 py-2.5"><CopyCell value={p.returnYear} format="percent" /></td>
              <td className="px-3 py-2.5"><CopyCell value={trackDisplay} /></td>
              <td className="px-3 py-2.5">
                {p.preferredRiskLevel ? (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    p.preferredRiskLevel === 'גבוה' ? 'text-destructive bg-destructive/8 border-destructive/15' :
                    p.preferredRiskLevel === 'בינוני' ? 'text-warning bg-warning/8 border-warning/15' :
                    'text-success bg-success/8 border-success/15'
                  }`}>{p.preferredRiskLevel}</span>
                ) : <span className="text-muted-foreground/30">—</span>}
              </td>
              <td className="px-3 py-2.5 max-w-[100px]">
                <span className="text-[11px] text-muted-foreground truncate block">{p.notes || ''}</span>
              </td>
              <td className="px-2 py-2.5">
                <ActionButtons product={p} onEdit={onEdit} onDelete={onDelete} onCreateRec={onCreateRec} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Insurance products: health, life, etc.
function InsuranceProductTable({ products, onEdit, onDelete, onCreateRec }: Omit<Props, 'title' | 'emoji'>) {
  return (
    <table className="w-full text-sm" dir="rtl">
      <thead>
        <tr className="border-b border-border/50">
          {['חשבון/פוליסה', 'יצרן', 'סוג מוצר', 'סטטוס', 'פרמיה חודשית', 'סיווג', 'מוצר', 'הערות', ''].map(h => (
            <th key={h} className="text-right px-3 py-2.5 font-medium text-muted-foreground text-[11px] whitespace-nowrap tracking-wide">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {products.map(p => (
          <tr key={p.id} className={`border-b border-border/30 last:border-b-0 hover:bg-primary/3 transition-colors ${!p.manuallyCompleted ? 'bg-warning/5' : ''}`}>
            <td className="px-3 py-2.5"><CopyCell value={p.policyNumber || p.productNumber} /></td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
                <CopyCell value={p.company} />
              </div>
            </td>
            <td className="px-3 py-2.5"><CopyCell value={p.productType} /></td>
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1">
                {p.isActive ? (
                  <span className="text-[10px] font-medium text-success bg-success/8 px-2 py-0.5 rounded-full border border-success/15">פעיל</span>
                ) : (
                  <span className="text-[10px] font-medium text-destructive bg-destructive/8 px-2 py-0.5 rounded-full border border-destructive/15">לא פעיל</span>
                )}
                {!p.manuallyCompleted && (
                  <span className="text-[10px] font-medium text-warning bg-warning/8 px-2 py-0.5 rounded-full border border-warning/15">השלמה</span>
                )}
              </div>
            </td>
            <td className="px-3 py-2.5"><CopyCell value={p.monthlyPremium} format="currency" /></td>
            <td className="px-3 py-2.5">
              <span className="text-[11px] text-muted-foreground">{p.subDescription || p.track || '—'}</span>
            </td>
            <td className="px-3 py-2.5">
              <span className="text-[11px]">{p.company} - {p.productType}</span>
            </td>
            <td className="px-3 py-2.5 max-w-[100px]">
              <span className="text-[11px] text-muted-foreground truncate block">{p.notes || ''}</span>
            </td>
            <td className="px-2 py-2.5">
              <ActionButtons product={p} onEdit={onEdit} onDelete={onDelete} onCreateRec={onCreateRec} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ActionButtons({ product, onEdit, onDelete, onCreateRec }: { product: Product; onEdit: (p: Product) => void; onDelete: (p: Product) => void; onCreateRec: (p: Product) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary" onClick={() => onCreateRec(product)} title="צור המלצה">
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted" onClick={() => onEdit(product)} title="עריכה">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(product)} title="מחיקה">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ProductTable({ title, emoji, products, onEdit, onDelete, onCreateRec }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const isInsurance = products.length > 0 && products[0].category === 'ביטוח';

  if (products.length === 0) return null;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-l from-muted/40 to-transparent hover:from-muted/60 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{emoji}</span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-bold">{products.length}</Badge>
          {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          {isInsurance ? (
            <InsuranceProductTable products={products} onEdit={onEdit} onDelete={onDelete} onCreateRec={onCreateRec} />
          ) : (
            <MoneyProductTable products={products} onEdit={onEdit} onDelete={onDelete} onCreateRec={onCreateRec} />
          )}
        </div>
      )}
    </div>
  );
}
