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
import { motion } from 'framer-motion';
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
      className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all duration-300 ${
        dragging ? 'border-[#5ec6c6] bg-[#5ec6c6]/10 scale-[1.02]' :
        fileList.length > 0 ? 'border-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-border/60 hover:border-[#5ec6c6]/50 hover:bg-[#5ec6c6]/5'
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
            <div key={i} className="flex items-center justify-center gap-2 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">{file.name}</span>
              <span className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-0.5">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-[#0a3d3d]/8 flex items-center justify-center mx-auto mb-3">
            <Upload className="h-7 w-7 text-[#0a3d3d]/60" />
          </div>
          <p className="font-semibold text-foreground text-sm">{dragging ? 'שחרר כאן' : label}</p>
          <p className="text-xs text-muted-foreground mt-1.5">גרור קובץ לכאן או לחץ לבחירה</p>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={e => handleFileSelect(type, e.target.files)} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header with progress */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/customers')}
            className="hover:bg-[#5ec6c6]/10 rounded-xl h-10 w-10 p-0"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">לקוח חדש</h1>
            <p className="text-xs md:text-sm text-muted-foreground">שלב {step} מתוך 2</p>
          </div>
        </div>

        {/* Step progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 1 ? 'bg-[#0a3d3d] text-white shadow-md shadow-[#0a3d3d]/20' : 'bg-muted text-muted-foreground'
            }`}>1</div>
            <span className={`text-xs font-medium hidden sm:inline ${step >= 1 ? 'text-[#0a3d3d]' : 'text-muted-foreground'}`}>העלאת קבצים</span>
          </div>
          <div className={`h-[2px] flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[#0a3d3d]' : 'bg-border'}`} />
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className={`text-xs font-medium hidden sm:inline ${step >= 2 ? 'text-[#0a3d3d]' : 'text-muted-foreground'}`}>פרטי לקוח</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 2 ? 'bg-[#0a3d3d] text-white shadow-md shadow-[#0a3d3d]/20' : 'bg-muted text-muted-foreground'
            }`}>2</div>
          </div>
        </div>
      </motion.div>

      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-b from-[#0a3d3d]/3 to-transparent pb-4">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <div className="w-8 h-8 rounded-xl bg-[#0a3d3d]/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#0a3d3d]" />
                </div>
                העלאת קבצי מקור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadZone label="קובץ מסלקה (ZIP / XML)" type="maslaqa" fileList={files.maslaqa}
                  dragging={draggingMaslaqa} setDrag={setDraggingMaslaqa} inputRef={maslaqaRef} accept=".csv,.xlsx,.xls,.xml,.txt,.zip" />
                <FileUploadZone label="קובץ הר ביטוח (Excel)" type="harBituah" fileList={files.harBituah}
                  dragging={draggingHar} setDrag={setDraggingHar} inputRef={harRef} accept=".csv,.xlsx,.xls,.xml,.txt" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-start gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || (files.maslaqa.length === 0 && files.harBituah.length === 0)}
              size="lg"
              className="gap-2 rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {analyzing ? 'מנתח קבצים...' : 'נתח והמשך'}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setStep(2)} className="rounded-2xl min-h-[48px]">דלג, המשך ללא קבצים</Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-5"
        >
          {/* Personal info */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-[#0a3d3d]/3 to-transparent">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-7 h-7 rounded-lg bg-[#0a3d3d]/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-[#0a3d3d]" />
                </div>
                פרטים אישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">שם פרטי *</Label>
                  <Input value={form.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="שם פרטי" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">שם משפחה *</Label>
                  <Input value={form.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="שם משפחה" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">תעודת זהות *</Label>
                  <Input value={form.idNumber} onChange={e => updateField('idNumber', e.target.value)} placeholder="מספר ת.ז" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                  {errors.idNumber && <p className="text-xs text-destructive mt-1">{errors.idNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">מגדר</Label>
                  <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
                    <SelectTrigger className="rounded-xl h-11 border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="זכר">זכר</SelectItem>
                      <SelectItem value="נקבה">נקבה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">תאריך לידה</Label>
                  <Input type="date" value={form.birthDate} onChange={e => updateField('birthDate', e.target.value)} className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">מצב משפחתי</Label>
                  <Select value={form.maritalStatus} onValueChange={v => updateField('maritalStatus', v)}>
                    <SelectTrigger className="rounded-xl h-11 border-border/60"><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="רווק/ה">רווק/ה</SelectItem>
                      <SelectItem value="נשוי/אה">נשוי/אה</SelectItem>
                      <SelectItem value="גרוש/ה">גרוש/ה</SelectItem>
                      <SelectItem value="אלמן/ה">אלמן/ה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">מספר ילדים</Label>
                  <Input type="number" inputMode="numeric" min="0" value={form.numberOfChildren} onChange={e => updateField('numberOfChildren', e.target.value)} placeholder="0" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
              </div>
              {form.maritalStatus === 'נשוי/אה' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">שם בן/בת זוג</Label>
                    <Input value={form.spouseName} onChange={e => updateField('spouseName', e.target.value)} placeholder="שם מלא" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Contact info */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-[#5ec6c6]/5 to-transparent">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-7 h-7 rounded-lg bg-[#5ec6c6]/15 flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-[#0a3d3d]" />
                </div>
                פרטי קשר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">טלפון נייד *</Label>
                  <Input value={form.mobilePhone} onChange={e => updateField('mobilePhone', e.target.value)} placeholder="05XXXXXXXX" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                  {errors.mobilePhone && <p className="text-xs text-destructive mt-1">{errors.mobilePhone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">אימייל</Label>
                  <Input value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="email@example.com" type="email" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/5 to-transparent">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-7 h-7 rounded-lg bg-blue-100/60 dark:bg-blue-900/20 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                כתובת
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">עיר</Label>
                  <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="עיר" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">רחוב</Label>
                  <Input value={form.street} onChange={e => updateField('street', e.target.value)} placeholder="שם רחוב" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">מספר בית</Label>
                  <Input value={form.houseNumber} onChange={e => updateField('houseNumber', e.target.value)} placeholder="מספר" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">דירה</Label>
                  <Input value={form.apartmentNumber} onChange={e => updateField('apartmentNumber', e.target.value)} placeholder="מספר" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment & Health */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-amber-50/50 dark:from-amber-900/5 to-transparent">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-7 h-7 rounded-lg bg-amber-100/60 dark:bg-amber-900/20 flex items-center justify-center">
                  <Briefcase className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                תעסוקה ובריאות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">עיסוק</Label>
                  <Input value={form.occupation} onChange={e => updateField('occupation', e.target.value)} placeholder="עיסוק" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">סטטוס תעסוקה</Label>
                  <Select value={form.employmentStatus} onValueChange={v => updateField('employmentStatus', v)}>
                    <SelectTrigger className="rounded-xl h-11 border-border/60"><SelectValue placeholder="בחר" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="שכיר">שכיר</SelectItem>
                      <SelectItem value="עצמאי">עצמאי</SelectItem>
                      <SelectItem value="שכיר+עצמאי">שכיר+עצמאי</SelectItem>
                      <SelectItem value="לא עובד">לא עובד</SelectItem>
                      <SelectItem value="פנסיונר">פנסיונר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">הכנסה חודשית</Label>
                  <Input type="number" inputMode="decimal" value={form.monthlyIncome} onChange={e => updateField('monthlyIncome', e.target.value)} placeholder="₪" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">קופת חולים</Label>
                  <Select value={form.healthFund} onValueChange={v => updateField('healthFund', v)}>
                    <SelectTrigger className="rounded-xl h-11 border-border/60"><SelectValue placeholder="בחר" /></SelectTrigger>
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
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-rose-50/40 dark:from-rose-900/5 to-transparent">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-7 h-7 rounded-lg bg-rose-100/50 dark:bg-rose-900/20 flex items-center justify-center">
                  <Heart className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                </div>
                הערות פנימיות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Textarea value={form.internalNotes} onChange={e => updateField('internalNotes', e.target.value)}
                placeholder="הערות פנימיות על הלקוח..." rows={3} className="rounded-xl border-border/60 focus:border-[#5ec6c6] transition-colors resize-none" />
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-2 pb-8">
            <Button
              onClick={handleCreate}
              size="lg"
              className="gap-2 rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
              disabled={creating}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? 'יוצר לקוח ומנתח קבצים...' : 'צור לקוח'}
            </Button>
            <Button variant="outline" onClick={() => setStep(1)} size="lg" className="rounded-2xl min-h-[48px]">חזור</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
