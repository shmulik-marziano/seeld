import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, User, Building2, Calendar, Shield, DollarSign, Users, StickyNote } from 'lucide-react';

export interface CorrectionFields {
  customerName: string;
  idNumber: string;
  policyNumber: string;
  company: string;
  productType: string;
  startDate: string;
  endDate: string;
  coverageAmount: string;
  monthlyPremium: string;
  beneficiaries: string;
  additionalNotes: string;
  [key: string]: string;
}

interface Props {
  fields: CorrectionFields;
  onChange: (key: keyof CorrectionFields, value: string) => void;
}

const FIELD_GROUPS = [
  {
    title: 'פרטי לקוח',
    icon: User,
    fields: [
      { key: 'customerName', label: 'שם מלא', placeholder: 'ישראל ישראלי' },
      { key: 'idNumber', label: 'תעודת זהות', placeholder: '000000000', dir: 'ltr' as const },
    ],
  },
  {
    title: 'פרטי פוליסה',
    icon: FileText,
    fields: [
      { key: 'policyNumber', label: 'מספר פוליסה', placeholder: '', dir: 'ltr' as const },
      { key: 'company', label: 'חברת ביטוח', placeholder: '' },
      { key: 'productType', label: 'סוג מוצר', placeholder: '' },
    ],
  },
  {
    title: 'תאריכים',
    icon: Calendar,
    fields: [
      { key: 'startDate', label: 'תאריך התחלה', placeholder: 'dd/mm/yyyy', dir: 'ltr' as const },
      { key: 'endDate', label: 'תאריך סיום', placeholder: 'dd/mm/yyyy', dir: 'ltr' as const },
    ],
  },
  {
    title: 'כיסוי ועלויות',
    icon: Shield,
    fields: [
      { key: 'coverageAmount', label: 'סכום כיסוי', placeholder: '₪', dir: 'ltr' as const },
      { key: 'monthlyPremium', label: 'פרמיה חודשית', placeholder: '₪', dir: 'ltr' as const },
    ],
  },
  {
    title: 'מוטבים',
    icon: Users,
    fields: [
      { key: 'beneficiaries', label: 'מוטבים', placeholder: 'שם מוטב, קרבה, אחוז', type: 'textarea' as const },
    ],
  },
  {
    title: 'הערות נוספות',
    icon: StickyNote,
    fields: [
      { key: 'additionalNotes', label: 'הערות / פרטים נוספים', placeholder: 'הוסף הערות חופשיות...', type: 'textarea' as const },
    ],
  },
];

export function CorrectionFieldEditor({ fields, onChange }: Props) {
  return (
    <div className="space-y-4">
      {FIELD_GROUPS.map(group => {
        const Icon = group.icon;
        return (
          <Card key={group.title} className="border-none shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.fields.map(field => (
                  <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <Label htmlFor={field.key} className="text-xs mb-1 block">{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.key}
                        value={fields[field.key] || ''}
                        onChange={e => onChange(field.key as keyof CorrectionFields, e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                        className="text-sm min-h-[60px]"
                      />
                    ) : (
                      <Input
                        id={field.key}
                        value={fields[field.key] || ''}
                        onChange={e => onChange(field.key as keyof CorrectionFields, e.target.value)}
                        placeholder={field.placeholder}
                        dir={field.dir}
                        className="text-sm h-9"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
