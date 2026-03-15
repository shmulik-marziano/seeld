import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, ArrowRight, CheckCircle2, Loader2, User, Phone, MapPin, Briefcase, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { customerBasicSchema } from '@/services/validations';
import JSZip from 'jszip';

export default function NewCustomerPage() {
  const navigate = useNavigate();
  const { addCustomer, addSourceFile } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [files, setFiles] = useState<{ maslaqa: File[]; harBituah: File[] }>({ maslaqa: [], harBituah: [] });
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', idNumber: '', mobilePhone: '', email: '',
    gender: 'זכר', birthDate: '', maritalStatus: '', numberOfChildren: '',
    city: '', street: '', houseNumber: '', apartmentNumber: '',
    occupation: '', employmentStatus: '', monthlyIncome: '',
    healthFund: '', spouseName: '', internalNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggingMaslaqa, setDraggingMaslaqa] = useState(false);
  const [draggingHar, setDraggingHar] = useState(false);
  const maslaqaRef = useRef<HTMLInputElement>(null);
  const harRef = useRef<HTMLInputElement>(null);

  const updateField = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const isBinaryFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return name.endsWith('.xlsx') || name.endsWith('.xls');
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractFilesFromZip = async (zipFile: File): Promise<File[]> => {
    const zip = await JSZip.loadAsync(zipFile);
    const extracted: File[] = [];
    const validExts = ['.csv', '.xlsx', '.xls', '.xml', '.txt', '.json'];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) continue;
      const blob = await entry.async('blob');
      const fileName = path.split('/').pop() || path;
      extracted.push(new File([blob], fileName, { type: blob.type }));
    }
    return extracted;
  };

  const handleFileSelect = async (type: 'maslaqa' | 'harBituah', inputFiles: FileList | null) => {
    if (!inputFiles || inputFiles.length === 0) return;
    const expanded: File[] = [];
    for (const file of Array.from(inputFiles)) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        try {
          const inner = await extractFilesFromZip(file);
          if (inner.length > 0) { toast.success(`נמצאו ${inner.length} קבצים ב-${file.name}`); expanded.push(...inner); }
          else { toast.warning(`לא נמצאו קבצים מתאימים ב-${file.name}`); }
        } catch { toast.error(`שגיאה בפריסת ${file.name}`); }
      } else { expanded.push(file); }
    }
    if (expanded.length > 0) setFiles(prev => ({ ...prev, [type]: [...prev[type], ...expanded] }));
  };

  const handleAnalyze = async () => {
    const allFiles = [...files.maslaqa, ...files.harBituah];
    if (allFiles.length === 0) { toast.error('יש להעלות לפחות קובץ אחד'); return; }
    setAnalyzing(true);
    try {
      const orderedFiles = [
        ...files.maslaqa.map(f => ({ file: f, type: 'מסלקה' as const })),
        ...files.harBituah.map(f => ({ file: f, type: 'הר ביטוח' as const })),
      ];
      const mergedInfo: Record<string, string> = {};
      for (const entry of orderedFiles) {
        let bodyPayload: Record<string, any> = { fileName: entry.file.name, fileType: entry.type, extractCustomerInfo: true };
        if (isBinaryFile(entry.file)) { bodyPayload.fileBase64 = await readFileAsBase64(entry.file); }
        else { const text = await entry.file.text(); bodyPayload.fileContent = text.substring(0, 80000); }
        try {
          const response = await supabase.functions.invoke('parse-insurance-file', { body: bodyPayload });
          if (response.data?.customerInfo) {
            const info = response.data.customerInfo;
            for (const [key, val] of Object.entries(info)) { if (val && !mergedInfo[key]) mergedInfo[key] = val as string; }
          }
        } catch (e) { console.warn('Failed to extract from', entry.file.name, e); }
      }
      if (Object.keys(mergedInfo).length > 0) {
        setForm(prev => ({
          ...prev,
          firstName: mergedInfo.firstName || prev.firstName,
          lastName: mergedInfo.lastName || prev.lastName,
          idNumber: mergedInfo.idNumber || prev.idNumber,
          mobilePhone: mergedInfo.mobilePhone || prev.mobilePhone,
          email: mergedInfo.email || prev.email,
        }));
        toast.success('פרטי לקוח חולצו מהקבצים בהצלחה');
      } else { toast.info('לא נמצאו פרטי לקוח בקבצים, יש למלא ידנית'); }
      setStep(2);
    } catch (err: any) {
      console.error('Analysis error:', err);
      toast.error('שגיאה בניתוח הקובץ');
      setStep(2);
    } finally { setAnalyzing(false); }
  };

  const handleCreate = async () => {
    const result = customerBasicSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setCreating(true);
    try {
      const customer = await addCustomer({
        firstName: form.firstName,
        lastName: form.lastName,
        idNumber: form.idNumber,
        mobilePhone: form.mobilePhone,
        email: form.email || undefined,
        gender: (form.gender as any) || undefined,
        birthDate: form.birthDate || undefined,
        maritalStatus: (form.maritalStatus as any) || undefined,
        numberOfChildren: form.numberOfChildren ? parseInt(form.numberOfChildren) : undefined,
        city: form.city || undefined,
        street: form.street || undefined,
        houseNumber: form.houseNumber || undefined,
        apartmentNumber: form.apartmentNumber || undefined,
        occupation: form.occupation || undefined,
        employmentStatus: form.employmentStatus || undefined,
        monthlyIncome: form.monthlyIncome ? parseFloat(form.monthlyIncome) : undefined,
        healthFund: form.healthFund || undefined,
        spouseName: form.spouseName || undefined,
        internalNotes: form.internalNotes || undefined,
        status: 'בקליטה',
      });
      const allFileEntries = [
        ...files.maslaqa.map(f => ({ file: f, type: 'מסלקה' as const })),
        ...files.harBituah.map(f => ({ file: f, type: 'הר ביטוח' as const })),
      ];
      for (const entry of allFileEntries) {
        await addSourceFile({ customerId: customer.id, type: entry.type, fileName: entry.file.name, analysisStatus: 'בניתוח' });
        const filePath = `${customer.id}/${Date.now()}_${entry.file.name}`;
        await supabase.storage.from('source-files').upload(filePath, entry.file);
        let bodyPayload: Record<string, any> = { fileName: entry.file.name, fileType: entry.type, customerId: customer.id };
        if (isBinaryFile(entry.file)) { bodyPayload.fileBase64 = await readFileAsBase64(entry.file); }
        else { const text = await entry.file.text(); bodyPayload.fileContent = text.substring(0, 80000); }
        const response = await supabase.functions.invoke('parse-insurance-file', { body: bodyPayload });
        if (response.data?.count) { toast.success(`${entry.file.name}: נמצאו ${response.data.count} מוצרים`); }
      }
      toast.success('הלקוח נוצר בהצלחה');
      navigate(`/customers/${customer.id}`);
    } catch (err: any) {
      toast.error(err.message || 'שגיאה ביצירת לקוח');
    } finally { setCreating(false); }
  };

  const handleDrop = (type: 'maslaqa' | 'harBituah', e: React.DragEvent) => {
    e.preventDefault();
    type === 'maslaqa' ? setDraggingMaslaqa(false) : setDraggingHar(false);
    handleFileSelect(type, e.dataTransfer.files);
  };

  const FileUploadZone = ({ label, type, fileList, dragging, setDrag, inputRef, accept }: {
    label: string; type: 'maslaqa' | 'harBituah'; fileList: File[];
    dragging: boolean; setDrag: (v: boolean) => void;
    inputRef: React.RefObject<HTMLInputElement>; accept: string;
  }) => (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging ? 'border-primary bg-primary/10' :
        fileList.length > 0 ? 'border-success/50 bg-success/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => handleDrop(type, e)}
    >
      {fileList.length > 0 ? (
        <div className="space-y-2">
          {fileList.map((file, i) => (
            <div key={i} className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-foreground">{file.name}</span>
              <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">{dragging ? 'שחרר כאן' : label}</p>
          <p className="text-xs text-muted-foreground mt-1">גרור קובץ לכאן או לחץ לבחירה</p>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={e => handleFileSelect(type, e.target.files)} />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/customers')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">לקוח חדש</h1>
          <p className="text-sm text-muted-foreground">שלב {step} מתוך 2</p>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                העלאת קבצי מקור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadZone label="קובץ מסלקה (ZIP / XML)" type="maslaqa" fileList={files.maslaqa}
                  dragging={draggingMaslaqa} setDrag={setDraggingMaslaqa} inputRef={maslaqaRef} accept=".csv,.xlsx,.xls,.xml,.txt,.zip" />
                <FileUploadZone label="קובץ הר ביטוח (Excel)" type="harBituah" fileList={files.harBituah}
                  dragging={draggingHar} setDrag={setDraggingHar} inputRef={harRef} accept=".csv,.xlsx,.xls,.xml,.txt" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-start gap-3">
            <Button onClick={handleAnalyze} disabled={analyzing || (files.maslaqa.length === 0 && files.harBituah.length === 0)} size="lg" className="gap-2">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {analyzing ? 'מנתח קבצים...' : 'נתח והמשך'}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setStep(2)}>דלג, המשך ללא קבצים</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Personal info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-seeld-teal" />
                פרטים אישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">שם פרטי *</Label>
                  <Input value={form.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="שם פרטי" />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label className="text-xs">שם משפחה *</Label>
                  <Input value={form.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="שם משפחה" />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <Label className="text-xs">תעודת זהות *</Label>
                  <Input value={form.idNumber} onChange={e => updateField('idNumber', e.target.value)} placeholder="מספר ת.ז" />
                  {errors.idNumber && <p className="text-xs text-destructive mt-1">{errors.idNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">מגדר</Label>
                  <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="זכר">זכר</SelectItem>
                      <SelectItem value="נקבה">נקבה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">תאריך לידה</Label>
                  <Input type="date" value={form.birthDate} onChange={e => updateField('birthDate', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">מצב משפחתי</Label>
                  <Select value={form.maritalStatus} onValueChange={v => updateField('maritalStatus', v)}>
                    <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="רווק/ה">רווק/ה</SelectItem>
                      <SelectItem value="נשוי/אה">נשוי/אה</SelectItem>
                      <SelectItem value="גרוש/ה">גרוש/ה</SelectItem>
                      <SelectItem value="אלמן/ה">אלמן/ה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">מספר ילדים</Label>
                  <Input type="number" inputMode="numeric" min="0" value={form.numberOfChildren} onChange={e => updateField('numberOfChildren', e.target.value)} placeholder="0" />
                </div>
              </div>
              {form.maritalStatus === 'נשוי/אה' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">שם בן/בת זוג</Label>
                    <Input value={form.spouseName} onChange={e => updateField('spouseName', e.target.value)} placeholder="שם מלא" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-seeld-coral" />
                פרטי קשר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">טלפון נייד *</Label>
                  <Input value={form.mobilePhone} onChange={e => updateField('mobilePhone', e.target.value)} placeholder="05XXXXXXXX" />
                  {errors.mobilePhone && <p className="text-xs text-destructive mt-1">{errors.mobilePhone}</p>}
                </div>
                <div>
                  <Label className="text-xs">אימייל</Label>
                  <Input value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="email@example.com" type="email" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-seeld-sky" />
                כתובת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">עיר</Label>
                  <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="עיר" />
                </div>
                <div>
                  <Label className="text-xs">רחוב</Label>
                  <Input value={form.street} onChange={e => updateField('street', e.target.value)} placeholder="שם רחוב" />
                </div>
                <div>
                  <Label className="text-xs">מספר בית</Label>
                  <Input value={form.houseNumber} onChange={e => updateField('houseNumber', e.target.value)} placeholder="מספר" />
                </div>
                <div>
                  <Label className="text-xs">דירה</Label>
                  <Input value={form.apartmentNumber} onChange={e => updateField('apartmentNumber', e.target.value)} placeholder="מספר" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment & Health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-seeld-sand" />
                תעסוקה ובריאות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">עיסוק</Label>
                  <Input value={form.occupation} onChange={e => updateField('occupation', e.target.value)} placeholder="עיסוק" />
                </div>
                <div>
                  <Label className="text-xs">סטטוס תעסוקה</Label>
                  <Select value={form.employmentStatus} onValueChange={v => updateField('employmentStatus', v)}>
                    <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="שכיר">שכיר</SelectItem>
                      <SelectItem value="עצמאי">עצמאי</SelectItem>
                      <SelectItem value="שכיר+עצמאי">שכיר+עצמאי</SelectItem>
                      <SelectItem value="לא עובד">לא עובד</SelectItem>
                      <SelectItem value="פנסיונר">פנסיונר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">הכנסה חודשית</Label>
                  <Input type="number" inputMode="decimal" value={form.monthlyIncome} onChange={e => updateField('monthlyIncome', e.target.value)} placeholder="₪" />
                </div>
                <div>
                  <Label className="text-xs">קופת חולים</Label>
                  <Select value={form.healthFund} onValueChange={v => updateField('healthFund', v)}>
                    <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="כללית">כללית</SelectItem>
                      <SelectItem value="מכבי">מכבי</SelectItem>
                      <SelectItem value="מאוחדת">מאוחדת</SelectItem>
                      <SelectItem value="לאומית">לאומית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4 text-seeld-blush" />
                הערות פנימיות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={form.internalNotes} onChange={e => updateField('internalNotes', e.target.value)}
                placeholder="הערות פנימיות על הלקוח..." rows={3} />
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} size="lg" className="gap-2" disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? 'יוצר לקוח ומנתח קבצים...' : 'צור לקוח'}
            </Button>
            <Button variant="outline" onClick={() => setStep(1)} size="lg">חזור</Button>
          </div>
        </div>
      )}
    </div>
  );
}
