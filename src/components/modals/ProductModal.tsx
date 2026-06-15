import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Product, ProductCategory, getMonthlyAmountLabel } from '@/types';
import { companies, moneyProductTypes, insuranceProductTypes } from '@/data/health-funds';
import { investmentTracks, riskLevels } from '@/data/investment-tracks';

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string;
  product?: Product;
}

export function ProductModal({ open, onClose, customerId, product }: Props) {
  const { addProduct, updateProduct } = useApp();
  const isEdit = !!product;

  const [form, setForm] = useState<Partial<Product>>({});

  useEffect(() => {
    if (open) {
      setForm(product ? { ...product } : { category: 'כסף', isActive: true, phase: 'פעיל', manuallyCompleted: false });
    }
  }, [open, product]);

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const isInsurance = form.category === 'ביטוח';
  const productTypes = isInsurance ? insuranceProductTypes : moneyProductTypes;
  const monthlyLabel = getMonthlyAmountLabel(form.category as ProductCategory || 'כסף');

  const handleSave = async () => {
    if (!form.company) { toast.error('יש לבחור חברה'); return; }
    if (!form.productType) { toast.error('יש לבחור סוג מוצר'); return; }
    if (form.investmentTrack === 'אחר' && !form.investmentTrackCustom?.trim()) {
      toast.error('יש למלא שם מסלול חופשי'); return;
    }

    const saveForm = { ...form };
    if (isInsurance) {
      saveForm.monthlyDeposit = undefined;
    } else {
      saveForm.monthlyPremium = undefined;
    }
    // Clear custom track if not "אחר"
    if (saveForm.investmentTrack !== 'אחר') {
      saveForm.investmentTrackCustom = undefined;
    }

    try {
      if (isEdit) {
        await updateProduct(product!.id, { ...saveForm, manuallyCompleted: true });
        toast.success('מוצר עודכן');
      } else {
        await addProduct({ ...saveForm, customerId, manuallyCompleted: true });
        toast.success('מוצר נוצר');
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת מוצר' : 'מוצר חדש'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">קטגוריה *</Label>
              <Select value={form.category || 'כסף'} onValueChange={v => { set('category', v as ProductCategory); set('productType', ''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="כסף">כסף</SelectItem>
                  <SelectItem value="ביטוח">ביטוח</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">חברה *</Label>
              <Select value={form.company || ''} onValueChange={v => set('company', v)}>
                <SelectTrigger><SelectValue placeholder="בחר חברה" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">סוג מוצר *</Label>
              <Select value={form.productType || ''} onValueChange={v => set('productType', v)}>
                <SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger>
                <SelectContent>
                  {productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">תיאור משנה</Label>
              <Input value={form.subDescription || ''} onChange={e => set('subDescription', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">מספר פוליסה</Label>
              <Input value={form.policyNumber || ''} onChange={e => set('policyNumber', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">מספר מוצר</Label>
              <Input value={form.productNumber || ''} onChange={e => set('productNumber', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><Label>פעיל</Label><Switch checked={form.isActive ?? true} onCheckedChange={v => set('isActive', v)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">{monthlyLabel}</Label>
              {isInsurance ? (
                <Input type="number" inputMode="decimal" value={form.monthlyPremium ?? ''} onChange={e => set('monthlyPremium', e.target.value ? Number(e.target.value) : undefined)} />
              ) : (
                <Input type="number" inputMode="decimal" value={form.monthlyDeposit ?? ''} onChange={e => set('monthlyDeposit', e.target.value ? Number(e.target.value) : undefined)} />
              )}
            </div>
            <div>
              <Label className="text-xs mb-1 block">צבירה</Label>
              <Input type="number" inputMode="decimal" value={form.accumulation ?? ''} onChange={e => set('accumulation', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>

          {/* Investment track & risk level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">מסלול השקעה</Label>
              <Select value={form.investmentTrack || 'none'} onValueChange={v => set('investmentTrack', v === 'none' ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="בחר מסלול" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {investmentTracks.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">סיכון מועדף</Label>
              <Select value={form.preferredRiskLevel || 'none'} onValueChange={v => set('preferredRiskLevel', v === 'none' ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="בחר רמת סיכון" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {riskLevels.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.investmentTrack === 'אחר' && (
            <div>
              <Label className="text-xs mb-1 block">שם מסלול חופשי *</Label>
              <Input value={form.investmentTrackCustom || ''} onChange={e => set('investmentTrackCustom', e.target.value)} placeholder="הזן שם מסלול" />
            </div>
          )}

          {/* Management fees - only for money products */}
          {!isInsurance && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">דמ״נ מהפקדה (%)</Label>
                <Input type="number" inputMode="decimal" step="0.01" value={form.managementFeeDeposit ?? ''} onChange={e => set('managementFeeDeposit', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">דמ״נ מצבירה (%)</Label>
                <Input type="number" inputMode="decimal" step="0.01" value={form.managementFeeAccumulation ?? ''} onChange={e => set('managementFeeAccumulation', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
          )}

          {/* Returns - only for money products */}
          {!isInsurance && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">תשואה שנתית (%)</Label>
                <Input type="number" inputMode="decimal" step="0.1" value={form.returnYear ?? ''} onChange={e => set('returnYear', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">תשואה 3 שנים (%)</Label>
                <Input type="number" inputMode="decimal" step="0.1" value={form.return3Years ?? ''} onChange={e => set('return3Years', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs mb-1 block">הערות</Label>
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button onClick={handleSave}>{isEdit ? 'שמור שינויים' : 'צור מוצר'}</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
