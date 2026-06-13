import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Customer, CustomerStatus, CustomerExtendedData } from '@/types';
import { healthFunds, supplementaryByFund } from '@/data/health-funds';
import { customerBasicSchema, validateHealthFund } from '@/services/validations';

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}

const statuses: CustomerStatus[] = ['חדש', 'בקליטה', 'בהשלמת מוצרים', 'מוכן להמלצה', 'ממתין לפולו־אפ', 'מאושר לביצוע', 'בביצוע', 'הושלם'];

export function CustomerModal({ open, onClose, customer }: Props) {
  const { updateCustomer, addCustomer } = useApp();
  const isEdit = !!customer;

  const [form, setForm] = useState<Partial<Customer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(customer ? { ...customer } : { idType: 'תעודת זהות', gender: 'זכר', maritalStatus: 'רווק/ה', status: 'חדש', extendedData: {} });
      setErrors({});
    }
  }, [open, customer]);

  const set = (key: keyof Customer, value: any) => {
    const next = { ...form, [key]: value };
    if (key === 'healthFund') next.supplementaryInsurance = undefined;
    setForm(next);
  };

  const setExt = (key: keyof CustomerExtendedData, value: any) => {
    setForm(prev => ({
      ...prev,
      extendedData: { ...(prev.extendedData || {}), [key]: value === '' ? undefined : value },
    }));
  };

  const ext = form.extendedData || {};

  const handleSave = async () => {
    const result = customerBasicSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      toast.error('יש לתקן שגיאות בטופס');
      return;
    }

    const hfErrors = validateHealthFund(form.healthFund, form.supplementaryInsurance);
    if (hfErrors.length > 0) {
      toast.error(hfErrors[0]);
      return;
    }

    setErrors({});
    try {
      if (isEdit) {
        await updateCustomer(customer!.id, form);
        toast.success('לקוח עודכן');
      } else {
        await addCustomer(form);
        toast.success('לקוח נוצר');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'שגיאה');
    }
  };

  const suppOptions = form.healthFund ? supplementaryByFund[form.healthFund] || [] : [];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת לקוח' : 'לקוח חדש'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-2">
          <TabsList className="w-full flex-wrap justify-start h-auto gap-1 p-1">
            <TabsTrigger value="basic" className="text-xs">זיהוי</TabsTrigger>
            <TabsTrigger value="family" className="text-xs">משפחה</TabsTrigger>
            <TabsTrigger value="employment" className="text-xs">תעסוקה ובנקאות</TabsTrigger>
            <TabsTrigger value="health" className="text-xs">בריאות</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs">העדפות</TabsTrigger>
            <TabsTrigger value="execution" className="text-xs">ביצוע ומסמכים</TabsTrigger>
          </TabsList>

          {/* ═══ זיהוי וקשר ═══ */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="שם פרטי *" error={errors.firstName}>
                <Input value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} />
              </Field>
              <Field label="שם משפחה *" error={errors.lastName}>
                <Input value={form.lastName || ''} onChange={e => set('lastName', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="סוג מזהה">
                <Select value={form.idType || 'תעודת זהות'} onValueChange={v => set('idType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="תעודת זהות">תעודת זהות</SelectItem>
                    <SelectItem value="דרכון">דרכון</SelectItem>
                    <SelectItem value="מספר חברה">מספר חברה</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="מספר מזהה *" error={errors.idNumber}>
                <Input value={form.idNumber || ''} onChange={e => set('idNumber', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="טלפון נייד *" error={errors.mobilePhone}>
                <Input value={form.mobilePhone || ''} onChange={e => set('mobilePhone', e.target.value)} />
              </Field>
              <Field label="טלפון נוסף">
                <Input value={form.otherPhone || ''} onChange={e => set('otherPhone', e.target.value)} />
              </Field>
            </div>
            <Field label="אימייל">
              <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="תאריך לידה">
                <Input type="date" value={form.birthDate || ''} onChange={e => set('birthDate', e.target.value)} />
              </Field>
              <Field label="מין">
                <Select value={form.gender || 'זכר'} onValueChange={v => set('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="זכר">זכר</SelectItem>
                    <SelectItem value="נקבה">נקבה</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ארץ לידה"><Input value={form.birthCountry || ''} onChange={e => set('birthCountry', e.target.value)} /></Field>
              <Field label="מקור הגעה"><Input value={form.source || ''} onChange={e => set('source', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="סטטוס">
                <Select value={form.status || 'חדש'} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="פולו־אפ הבא"><Input type="date" value={form.nextFollowUp || ''} onChange={e => set('nextFollowUp', e.target.value)} /></Field>
            </div>
            {/* Address */}
            <p className="text-xs text-muted-foreground font-medium pt-2">כתובת</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="יישוב"><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></Field>
              <Field label="רחוב"><Input value={form.street || ''} onChange={e => set('street', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="בית"><Input value={form.houseNumber || ''} onChange={e => set('houseNumber', e.target.value)} /></Field>
              <Field label="דירה"><Input value={form.apartmentNumber || ''} onChange={e => set('apartmentNumber', e.target.value)} /></Field>
              <Field label="מיקוד"><Input value={form.zipCode || ''} onChange={e => set('zipCode', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="כתובת באנגלית"><Input value={ext.addressEnglish || ''} onChange={e => setExt('addressEnglish', e.target.value)} /></Field>
              <Field label="מצב מגורים"><Input value={ext.residenceStatus || ''} onChange={e => setExt('residenceStatus', e.target.value)} placeholder="שכירות / בעלות" /></Field>
            </div>
            <Field label="הערות פנימיות">
              <Textarea value={form.internalNotes || ''} onChange={e => set('internalNotes', e.target.value)} rows={3} />
            </Field>
          </TabsContent>

          {/* ═══ משפחה ═══ */}
          <TabsContent value="family" className="space-y-4 mt-4">
            <Field label="מצב משפחתי">
              <Select value={form.maritalStatus || 'רווק/ה'} onValueChange={v => set('maritalStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['רווק/ה', 'נשוי/אה', 'גרוש/ה', 'אלמן/ה'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="בן/בת זוג"><Input value={form.spouseName || ''} onChange={e => set('spouseName', e.target.value)} /></Field>
              <Field label="ת.ז בן/בת זוג"><Input value={ext.spouseIdNumber || ''} onChange={e => setExt('spouseIdNumber', e.target.value)} /></Field>
            </div>
            <Field label="ת.לידה בן/בת זוג">
              <Input type="date" value={ext.spouseBirthDate || ''} onChange={e => setExt('spouseBirthDate', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מספר ילדים"><Input type="number" value={form.numberOfChildren ?? ''} onChange={e => set('numberOfChildren', e.target.value ? Number(e.target.value) : undefined)} /></Field>
              <Field label="בני משפחה תלויים"><Input value={ext.dependentFamilyMembers || ''} onChange={e => setExt('dependentFamilyMembers', e.target.value)} /></Field>
            </div>
            <Field label="שמות ילדים"><Textarea value={ext.childrenNames || ''} onChange={e => setExt('childrenNames', e.target.value)} rows={2} placeholder="שם, שם, שם" /></Field>
            <Field label="תאריכי לידה ילדים"><Textarea value={ext.childrenBirthDates || ''} onChange={e => setExt('childrenBirthDates', e.target.value)} rows={2} /></Field>
            <Field label="מוטבים"><Textarea value={form.beneficiaries || ''} onChange={e => set('beneficiaries', e.target.value)} rows={2} placeholder="שמות מוטבים ואחוזי חלוקה" /></Field>
            <Field label="חלוקת מוטבים"><Input value={ext.beneficiaryDistribution || ''} onChange={e => setExt('beneficiaryDistribution', e.target.value)} /></Field>
            <Field label="קרבה משפחתית"><Input value={ext.familyRelation || ''} onChange={e => setExt('familyRelation', e.target.value)} /></Field>
          </TabsContent>

          {/* ═══ תעסוקה ובנקאות ═══ */}
          <TabsContent value="employment" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground font-medium">תעסוקה</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מצב תעסוקתי">
                <Select value={form.employmentStatus || ''} onValueChange={v => set('employmentStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>
                    {['שכיר', 'עצמאי', 'בעל שליטה', 'לא עובד', 'פנסיונר'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="עיסוק"><Input value={form.occupation || ''} onChange={e => set('occupation', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מקצוע"><Input value={form.profession || ''} onChange={e => set('profession', e.target.value)} /></Field>
              <Field label="תפקיד"><Input value={form.position || ''} onChange={e => set('position', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מעסיק"><Input value={ext.employer || ''} onChange={e => setExt('employer', e.target.value)} /></Field>
              <Field label="מקום עבודה"><Input value={ext.workplace || ''} onChange={e => setExt('workplace', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="הכנסה חודשית"><Input type="number" inputMode="decimal" value={form.monthlyIncome || ''} onChange={e => set('monthlyIncome', e.target.value ? Number(e.target.value) : undefined)} /></Field>
              <Field label="הכנסה שנתית"><Input type="number" inputMode="decimal" value={form.annualIncome || ''} onChange={e => set('annualIncome', e.target.value ? Number(e.target.value) : undefined)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="רמת הכנסה משפחתית"><Input value={ext.incomeLevelFamily || ''} onChange={e => setExt('incomeLevelFamily', e.target.value)} /></Field>
              <Field label="מקורות הכנסה נוספים"><Input value={ext.additionalIncomeSources || ''} onChange={e => setExt('additionalIncomeSources', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="התחייבויות חריגות"><Input value={ext.exceptionalObligations || ''} onChange={e => setExt('exceptionalObligations', e.target.value)} /></Field>
              <Field label="מצב כלכלי כללי"><Input value={ext.generalFinancialStatus || ''} onChange={e => setExt('generalFinancialStatus', e.target.value)} /></Field>
            </div>

            <p className="text-xs text-muted-foreground font-medium pt-2">בנקאות</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="בנק"><Input value={form.bank || ''} onChange={e => set('bank', e.target.value)} /></Field>
              <Field label="מספר בנק"><Input value={ext.bankNumber || ''} onChange={e => setExt('bankNumber', e.target.value)} /></Field>
              <Field label="סניף"><Input value={form.branch || ''} onChange={e => set('branch', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מספר חשבון"><Input value={form.accountNumber || ''} onChange={e => set('accountNumber', e.target.value)} /></Field>
              <Field label="סוג חשבון"><Input value={form.accountType || ''} onChange={e => set('accountType', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="בעלות חשבון"><Input value={ext.accountOwnership || ''} onChange={e => setExt('accountOwnership', e.target.value)} /></Field>
              <Field label="אמצעי תשלום"><Input value={ext.paymentMethod || ''} onChange={e => setExt('paymentMethod', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="פרטי שכר"><Input value={ext.salaryDetails || ''} onChange={e => setExt('salaryDetails', e.target.value)} /></Field>
              <Field label="מקור כספים"><Input value={ext.fundsSource || ''} onChange={e => setExt('fundsSource', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="הפקדה חודשית רצויה"><Input type="number" value={ext.desiredMonthlyDeposit || ''} onChange={e => setExt('desiredMonthlyDeposit', e.target.value ? Number(e.target.value) : undefined)} /></Field>
              <Field label="סכום חד פעמי רצוי"><Input type="number" value={ext.desiredLumpSum || ''} onChange={e => setExt('desiredLumpSum', e.target.value ? Number(e.target.value) : undefined)} /></Field>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2"><Label className="text-xs">תושב מס</Label><Switch checked={form.taxResident || false} onCheckedChange={v => set('taxResident', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">אזרח ארה״ב</Label><Switch checked={form.usCitizen || false} onCheckedChange={v => set('usCitizen', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">תושב ארה״ב</Label><Switch checked={ext.usResident || false} onCheckedChange={v => setExt('usResident', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">זיקה לארה״ב</Label><Switch checked={ext.usAffiliation || false} onCheckedChange={v => setExt('usAffiliation', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">הרשאה לחיוב</Label><Switch checked={ext.debitAuthorization || false} onCheckedChange={v => setExt('debitAuthorization', v)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מדינת מס"><Input value={ext.taxCountry || ''} onChange={e => setExt('taxCountry', e.target.value)} /></Field>
              <Field label="מס׳ משלם מס זר"><Input value={ext.foreignTaxId || ''} onChange={e => setExt('foreignTaxId', e.target.value)} /></Field>
            </div>
          </TabsContent>

          {/* ═══ בריאות ═══ */}
          <TabsContent value="health" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="קופת חולים">
                <Select value={form.healthFund || ''} onValueChange={v => set('healthFund', v)}>
                  <SelectTrigger><SelectValue placeholder="בחר קופה" /></SelectTrigger>
                  <SelectContent>
                    {healthFunds.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="ביטוח משלים">
                <Select value={form.supplementaryInsurance || ''} onValueChange={v => set('supplementaryInsurance', v)} disabled={!form.healthFund}>
                  <SelectTrigger><SelectValue placeholder={form.healthFund ? 'בחר משלים' : 'בחר קופה תחילה'} /></SelectTrigger>
                  <SelectContent>
                    {suppOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="גובה (ס״מ)"><Input type="number" inputMode="decimal" value={form.height || ''} onChange={e => set('height', e.target.value ? Number(e.target.value) : undefined)} /></Field>
              <Field label="משקל (ק״ג)"><Input type="number" inputMode="decimal" value={form.weight || ''} onChange={e => set('weight', e.target.value ? Number(e.target.value) : undefined)} /></Field>
              <Field label="BMI"><Input value={form.bmi?.toString() || '—'} disabled /></Field>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Label>מעשן</Label><Switch checked={form.isSmoker || false} onCheckedChange={v => set('isSmoker', v)} /></div>
              {form.isSmoker && <Field label="סיגריות ליום"><Input type="number" inputMode="numeric" value={form.cigarettesPerDay || ''} onChange={e => set('cigarettesPerDay', Number(e.target.value))} className="w-24" /></Field>}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Label>עישן בעבר</Label><Switch checked={form.wasSmoker || false} onCheckedChange={v => set('wasSmoker', v)} /></div>
              {form.wasSmoker && <Field label="שנת הפסקה"><Input type="number" inputMode="numeric" value={form.quitYear || ''} onChange={e => set('quitYear', Number(e.target.value))} className="w-24" /></Field>}
            </div>
            <Field label="תרופות"><Textarea value={form.medications || ''} onChange={e => set('medications', e.target.value)} rows={2} /></Field>
            <Field label="מחלות רקע"><Textarea value={form.preExistingConditions || ''} onChange={e => set('preExistingConditions', e.target.value)} rows={2} /></Field>
            <Field label="אשפוזים"><Textarea value={form.hospitalizations || ''} onChange={e => set('hospitalizations', e.target.value)} rows={2} /></Field>
            <Field label="ניתוחים"><Textarea value={form.surgeries || ''} onChange={e => set('surgeries', e.target.value)} rows={2} /></Field>
            <Field label="בדיקות מיוחדות"><Textarea value={ext.specialTests || ''} onChange={e => setExt('specialTests', e.target.value)} rows={2} /></Field>
            <Field label="נכויות"><Input value={ext.disabilities || ''} onChange={e => setExt('disabilities', e.target.value)} /></Field>
            <Field label="הגבלות רפואיות"><Input value={ext.medicalRestrictions || ''} onChange={e => setExt('medicalRestrictions', e.target.value)} /></Field>
            <Field label="טיפולים קיימים"><Input value={ext.currentTreatments || ''} onChange={e => setExt('currentTreatments', e.target.value)} /></Field>
            <Field label="תחביבים מסוכנים"><Input value={form.dangerousHobbies || ''} onChange={e => set('dangerousHobbies', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="עיסוק מסוכן"><Input value={ext.dangerousOccupation || ''} onChange={e => setExt('dangerousOccupation', e.target.value)} /></Field>
              <Field label="ספורט אתגרי"><Input value={ext.extremeSports || ''} onChange={e => setExt('extremeSports', e.target.value)} /></Field>
            </div>
            <Field label="רישיון מיוחד"><Input value={ext.specialLicense || ''} onChange={e => setExt('specialLicense', e.target.value)} placeholder="כלי טיס / צלילה / אחר" /></Field>
            <Field label="פירוט רפואי"><Textarea value={form.medicalDetails || ''} onChange={e => set('medicalDetails', e.target.value)} rows={3} /></Field>
          </TabsContent>

          {/* ═══ העדפות ═══ */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground font-medium">מטרות</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מטרות חיסכון"><Input value={ext.savingsGoals || ''} onChange={e => setExt('savingsGoals', e.target.value)} /></Field>
              <Field label="מטרות ביטוח"><Input value={ext.insuranceGoals || ''} onChange={e => setExt('insuranceGoals', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="טווח זמן לחיסכון"><Input value={ext.savingsTimeframe || ''} onChange={e => setExt('savingsTimeframe', e.target.value)} placeholder="קצר / בינוני / ארוך" /></Field>
              <Field label="רמת סיכון רצויה">
                <Select value={ext.desiredRiskLevel || ''} onValueChange={v => setExt('desiredRiskLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>
                    {['נמוך', 'בינוני', 'גבוה'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="מסלול השקעה קיים"><Input value={ext.currentInvestmentTrack || ''} onChange={e => setExt('currentInvestmentTrack', e.target.value)} /></Field>
              <Field label="מסלול השקעה רצוי"><Input value={ext.desiredInvestmentTrack || ''} onChange={e => setExt('desiredInvestmentTrack', e.target.value)} /></Field>
            </div>
            <Field label="מטרה ספציפית לכסף"><Input value={ext.specificMoneyGoal || ''} onChange={e => setExt('specificMoneyGoal', e.target.value)} /></Field>
            <Field label="עדיפות ראשונה"><Input value={ext.priorityPreference || ''} onChange={e => setExt('priorityPreference', e.target.value)} placeholder="עלות / כיסוי / פשטות / חיסכון / נזילות" /></Field>

            <p className="text-xs text-muted-foreground font-medium pt-2">העדפות</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2"><Label className="text-xs">הוזלת עלות</Label><Switch checked={ext.wantsToReduceCost || false} onCheckedChange={v => setExt('wantsToReduceCost', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">שיפור כיסוי</Label><Switch checked={ext.wantsToImproveCoverage || false} onCheckedChange={v => setExt('wantsToImproveCoverage', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">איחוד מוצרים</Label><Switch checked={ext.wantsToConsolidate || false} onCheckedChange={v => setExt('wantsToConsolidate', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">חיסכון לילדים</Label><Switch checked={ext.wantsChildSavings || false} onCheckedChange={v => setExt('wantsChildSavings', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">פתוח לשינוי מסלול</Label><Switch checked={ext.openToTrackChange || false} onCheckedChange={v => setExt('openToTrackChange', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">רק סדר ובקרה</Label><Switch checked={ext.wantsOnlyReview || false} onCheckedChange={v => setExt('wantsOnlyReview', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">רוצה לבצע</Label><Switch checked={ext.wantsExecution || false} onCheckedChange={v => setExt('wantsExecution', v)} /></div>
            </div>

            <p className="text-xs text-muted-foreground font-medium pt-2">תקשורת</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="שעות נוחות"><Input value={ext.preferredContactHours || ''} onChange={e => setExt('preferredContactHours', e.target.value)} /></Field>
              <Field label="אמצעי קשר מועדף"><Input value={ext.preferredContactMethod || ''} onChange={e => setExt('preferredContactMethod', e.target.value)} placeholder="טלפון / ווטסאפ / מייל" /></Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2"><Label className="text-xs">זמין לשיחות</Label><Switch checked={ext.availableForCalls || false} onCheckedChange={v => setExt('availableForCalls', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">מאשר SMS</Label><Switch checked={ext.approvesSms || false} onCheckedChange={v => setExt('approvesSms', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">מאשר מיילים</Label><Switch checked={ext.approvesEmail || false} onCheckedChange={v => setExt('approvesEmail', v)} /></div>
            </div>
            <Field label="סטטוס דיוור"><Input value={ext.mailingStatus || ''} onChange={e => setExt('mailingStatus', e.target.value)} /></Field>
          </TabsContent>

          {/* ═══ ביצוע ומסמכים ═══ */}
          <TabsContent value="execution" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground font-medium">סטטוס אישורים</p>
            <Field label="המלצות שאושרו"><Textarea value={ext.approvedRecommendations || ''} onChange={e => setExt('approvedRecommendations', e.target.value)} rows={2} /></Field>
            <Field label="המלצות שנדחו"><Textarea value={ext.rejectedRecommendations || ''} onChange={e => setExt('rejectedRecommendations', e.target.value)} rows={2} /></Field>
            <Field label="ממתין לחשיבה"><Textarea value={ext.pendingRecommendations || ''} onChange={e => setExt('pendingRecommendations', e.target.value)} rows={2} /></Field>
            <Field label="חסר לביצוע"><Textarea value={ext.missingForExecution || ''} onChange={e => setExt('missingForExecution', e.target.value)} rows={2} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="חתימות נדרשות"><Input value={ext.requiredSignatures || ''} onChange={e => setExt('requiredSignatures', e.target.value)} /></Field>
              <Field label="מסמכים נדרשים"><Input value={ext.requiredDocuments || ''} onChange={e => setExt('requiredDocuments', e.target.value)} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="תאריך אישור"><Input type="date" value={ext.approvalDate || ''} onChange={e => setExt('approvalDate', e.target.value)} /></Field>
              <div className="flex items-center gap-2 mt-5"><Label className="text-xs">אישור לקוח</Label><Switch checked={ext.clientApproval || false} onCheckedChange={v => setExt('clientApproval', v)} /></div>
            </div>
            <Field label="הערות לביצוע"><Textarea value={ext.executionNotes || ''} onChange={e => setExt('executionNotes', e.target.value)} rows={3} /></Field>
            <Field label="סיכום שיחה"><Textarea value={ext.conversationSummary || ''} onChange={e => setExt('conversationSummary', e.target.value)} rows={3} /></Field>

            <p className="text-xs text-muted-foreground font-medium pt-2">מסמכים</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2"><Label className="text-xs">צילום ת.ז</Label><Switch checked={ext.hasIdPhoto || false} onCheckedChange={v => setExt('hasIdPhoto', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">צ׳ק/אישור בנק</Label><Switch checked={ext.hasCheckOrBankApproval || false} onCheckedChange={v => setExt('hasCheckOrBankApproval', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">מסלקה</Label><Switch checked={ext.hasClearingHouse || false} onCheckedChange={v => setExt('hasClearingHouse', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">הר הביטוח</Label><Switch checked={ext.hasInsuranceMountain || false} onCheckedChange={v => setExt('hasInsuranceMountain', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">דוחות קיימים</Label><Switch checked={ext.hasExistingReports || false} onCheckedChange={v => setExt('hasExistingReports', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">טפסים חתומים</Label><Switch checked={ext.hasSignedForms || false} onCheckedChange={v => setExt('hasSignedForms', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">שאלון בריאות</Label><Switch checked={ext.hasHealthQuestionnaire || false} onCheckedChange={v => setExt('hasHealthQuestionnaire', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">מסמכים רפואיים</Label><Switch checked={ext.hasMedicalDocuments || false} onCheckedChange={v => setExt('hasMedicalDocuments', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">תלושי שכר</Label><Switch checked={ext.hasPaySlips || false} onCheckedChange={v => setExt('hasPaySlips', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">אישורי מעסיק</Label><Switch checked={ext.hasEmployerApproval || false} onCheckedChange={v => setExt('hasEmployerApproval', v)} /></div>
              <div className="flex items-center gap-2"><Label className="text-xs">מסמכי מס</Label><Switch checked={ext.hasTaxDocuments || false} onCheckedChange={v => setExt('hasTaxDocuments', v)} /></div>
            </div>
            <Field label="נספחים מיוחדים"><Input value={ext.specialAttachments || ''} onChange={e => setExt('specialAttachments', e.target.value)} /></Field>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button onClick={handleSave}>{isEdit ? 'שמור שינויים' : 'צור לקוח'}</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs mb-1 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
