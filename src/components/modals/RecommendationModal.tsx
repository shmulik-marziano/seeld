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
import { Product, Recommendation } from '@/types';
import { investmentTracks, riskLevels, actionTypesNew } from '@/data/investment-tracks';

interface Props {
  open: boolean;
  onClose: () => void;
  customerId: string;
  recommendation?: Recommendation;
  linkedProductId?: string;
  products: Product[];
}

export function RecommendationModal({ open, onClose, customerId, recommendation, linkedProductId, products }: Props) {
  const { addRecommendation, updateRecommendation } = useApp();
  const isEdit = !!recommendation;

  const [form, setForm] = useState<Partial<Recommendation>>({});

  useEffect(() => {
    if (open) {
      if (recommendation) {
        setForm({ ...recommendation });
      } else {
        setForm({
          actionType: 'הצטרפות בלבד',
          decisionStatus: 'טיוטה',
          linkedProductId: linkedProductId || undefined,
          requiresQuote: false,
        });
      }
    }
  }, [open, recommendation, linkedProductId]);

  const set = (key: keyof Recommendation, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.title?.trim()) { toast.error('כותרת חובה'); return; }
    if (!form.rationale?.trim()) { toast.error('נימוק חובה'); return; }
    if ((form as any).recommendedInvestmentTrack === 'אחר' && !(form as any).recommendedInvestmentTrackCustom?.trim()) {
      toast.error('יש למלא שם מסלול חופשי'); return;
    }

    const saveForm = { ...form };
    if ((saveForm as any).recommendedInvestmentTrack !== 'אחר') {
      (saveForm as any).recommendedInvestmentTrackCustom = undefined;
    }

    try {
      if (isEdit) {
        await updateRecommendation(recommendation!.id, saveForm);
        toast.success('המלצה עודכנה');
      } else {
        await addRecommendation({ ...saveForm, customerId } as any);
        toast.success('המלצה נוצרה');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'שגיאה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת המלצה' : 'המלצה חדשה'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs mb-1 block">מוצר מקושר (אופציונלי)</Label>
            <Select value={form.linkedProductId || 'none'} onValueChange={v => set('linkedProductId', v === 'none' ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="ללא מוצר מקושר" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא מוצר מקושר</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.company} - {p.productType} {p.subDescription ? `(${p.subDescription})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">כותרת *</Label>
            <Input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="לדוגמה: שדרוג קרן פנסיה" />
          </div>

          <div>
            <Label className="text-xs mb-1 block">מצב קיים בקצרה</Label>
            <Textarea value={form.currentState || ''} onChange={e => set('currentState', e.target.value)} rows={2} placeholder="תיאור המצב הנוכחי" />
          </div>

          <div>
            <Label className="text-xs mb-1 block">סוג פעולה *</Label>
            <Select value={form.actionType || 'הצטרפות בלבד'} onValueChange={v => set('actionType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {actionTypesNew.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1 block">המלצת סוכן *</Label>
            <Textarea value={form.rationale || ''} onChange={e => set('rationale', e.target.value)} rows={3} placeholder="טקסט חופשי - המלצת הסוכן" />
          </div>

          <div>
            <Label className="text-xs mb-1 block">מבוסס על</Label>
            <Input value={form.basedOn || ''} onChange={e => set('basedOn', e.target.value)} placeholder="השוואת דמי ניהול, ניתוח כיסויים..." />
          </div>

          <div>
            <Label className="text-xs mb-1 block">מה משתפר</Label>
            <Textarea value={form.improvement || ''} onChange={e => set('improvement', e.target.value)} rows={2} placeholder="התוצאה הצפויה" />
          </div>

          {/* Investment track & risk level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1 block">מסלול השקעה מומלץ</Label>
              <Select value={(form as any).recommendedInvestmentTrack || 'none'} onValueChange={v => set('recommendedInvestmentTrack' as any, v === 'none' ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="בחר מסלול" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {investmentTracks.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">סיכון מועדף מומלץ</Label>
              <Select value={(form as any).recommendedRiskLevel || 'none'} onValueChange={v => set('recommendedRiskLevel' as any, v === 'none' ? undefined : v)}>
                <SelectTrigger><SelectValue placeholder="בחר רמת סיכון" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {riskLevels.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(form as any).recommendedInvestmentTrack === 'אחר' && (
            <div>
              <Label className="text-xs mb-1 block">שם מסלול חופשי *</Label>
              <Input value={(form as any).recommendedInvestmentTrackCustom || ''} onChange={e => set('recommendedInvestmentTrackCustom' as any, e.target.value)} placeholder="הזן שם מסלול" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={form.requiresQuote || false} onCheckedChange={v => set('requiresQuote', v)} />
            <Label>נדרשת הצעת מחיר</Label>
          </div>

          <div>
            <Label className="text-xs mb-1 block">צעד הבא</Label>
            <Input value={form.nextStep || ''} onChange={e => set('nextStep', e.target.value)} />
          </div>

          {isEdit && (
            <>
              <div>
                <Label className="text-xs mb-1 block">הערת ביצוע</Label>
                <Textarea value={form.executionNote || ''} onChange={e => set('executionNote', e.target.value)} rows={2} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">חוסרים לביצוע</Label>
                <Input value={form.missingForExecution || ''} onChange={e => set('missingForExecution', e.target.value)} placeholder="בנק, מספר חשבון..." />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button onClick={handleSave}>{isEdit ? 'שמור שינויים' : 'צור המלצה'}</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
