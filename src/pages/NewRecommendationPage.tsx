import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowRight, ArrowLeft, Search, UserPlus, Users, Package, FileText,
  Loader2, CheckCircle2, Plus, Link2, Copy, Trash2, BookOpen, Eye,
  AlertTriangle, AlertCircle, Clock, Sparkles, MessageCircle, Mail,
  Lock as LockIcon, Upload, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Customer, Product, ActionType, Recommendation } from '@/types';
import { customerBasicSchema } from '@/services/validations';
import { ProductModal } from '@/components/modals/ProductModal';
import { downloadRecommendationPdf } from '@/services/pdf-generator';
import JSZip from 'jszip';

type Step = 'choose-customer' | 'customer-details' | 'manage-products' | 'write-recommendations' | 'preview' | 'summary';

const actionTypes: ActionType[] = ['שחלוף', 'מינוי סוכן', 'ניוד', 'שינוי מוצר', 'הצטרפות בלבד'];
const recTypes = ['שימור', 'שינוי', 'ביטול', 'הוספה', 'שדרוג', 'החלפה', 'איחוד'];
const urgencyLevels = [
  { value: 'קריטי', label: 'קריטי', color: 'text-destructive', icon: AlertTriangle },
  { value: 'חשוב', label: 'חשוב', color: 'text-warning', icon: AlertCircle },
  { value: 'אפשר להמתין', label: 'אפשר להמתין', color: 'text-muted-foreground', icon: Clock },
];

const insuranceCompanies = ['מנורה מבטחים', 'הראל', 'מגדל', 'כלל', 'הפניקס', 'איילון', 'מיטב', 'ילין לפידות', 'אנליסט', 'אלטשולר שחם', 'הכשרה'];

interface RecDraft {
  productId: string;
  title: string;
  rationale: string;
  currentState: string;
  problemGap: string;
  improvement: string;
  advantages: string;
  disadvantages: string;
  actionType: ActionType;
  recommendationType: string;
  urgency: string;
  basedOn: string;
  nextStep: string;
  requiresQuote: boolean;
  recommendedCompany: string;
  recommendedTrack: string;
  costBefore: string;
  costAfter: string;
}

interface ReasoningEntry {
  id: string; category: string; recommendation_type: string; text: string; tags: string[];
}

function createRecDraft(product: Product): RecDraft {
  return {
    productId: product.id,
    title: '',
    rationale: '',
    currentState: [
      product.company, product.productType,
      product.category === 'ביטוח' && product.monthlyPremium ? `פרמיה חודשית: ₪${product.monthlyPremium}` : '',
      product.category === 'כסף' && product.monthlyDeposit ? `הפקדה חודשית: ₪${product.monthlyDeposit}` : '',
      product.accumulation ? `צבירה: ₪${product.accumulation.toLocaleString()}` : '',
      product.managementFeeDeposit ? `ד.נ הפקדה: ${product.managementFeeDeposit}%` : '',
      product.managementFeeAccumulation ? `ד.נ צבירה: ${product.managementFeeAccumulation}%` : '',
    ].filter(Boolean).join(' | '),
    problemGap: '',
    improvement: '',
    advantages: '',
    disadvantages: '',
    actionType: 'שדרוג',
    recommendationType: 'שינוי',
    urgency: 'חשוב',
    basedOn: `${product.company} - ${product.productType}${product.policyNumber ? ` (${product.policyNumber})` : ''}`,
    nextStep: '',
    requiresQuote: false,
    recommendedCompany: '',
    recommendedTrack: '',
    costBefore: product.monthlyPremium ? String(product.monthlyPremium) : '',
    costAfter: '',
  };
}

export default function NewRecommendationPage() {
  const navigate = useNavigate();
  const { data, addCustomer, addRecommendation, addProduct, logActivity, refreshData, deleteProduct } = useApp();
  const [step, setStep] = useState<Step>('choose-customer');
  const [customerMode, setCustomerMode] = useState<'new' | 'existing' | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [createdRecIds, setCreatedRecIds] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadStatus, setFileUploadStatus] = useState<string>('');
  const [fileDragging, setFileDragging] = useState(false);
  const pretreatmentFileRef = useRef<HTMLInputElement>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [summaryVersion, setSummaryVersion] = useState(1);
  const [summaryLinkToken, setSummaryLinkToken] = useState<string | null>(null);

  // New customer form
  const [form, setForm] = useState({ firstName: '', lastName: '', idNumber: '', mobilePhone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Recommendation drafts
  const [recDrafts, setRecDrafts] = useState<RecDraft[]>([]);

  // Reasoning bank
  const [reasoningEntries, setReasoningEntries] = useState<ReasoningEntry[]>([]);
  const [reasoningModalOpen, setReasoningModalOpen] = useState(false);
  const [reasoningTarget, setReasoningTarget] = useState<string>('');
  const [reasoningFilter, setReasoningFilter] = useState('');

  const selectedCustomer = data.customers.find(c => c.id === selectedCustomerId);
  const customerProducts = data.products.filter(p => p.customerId === selectedCustomerId);

  // Load reasoning bank on mount
  useEffect(() => {
    supabase.from('reasoning_bank').select('id, category, recommendation_type, text, tags')
      .is('archived_at', null).order('usage_count', { ascending: false })
      .then(({ data }) => setReasoningEntries((data || []) as ReasoningEntry[]));
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return data.customers.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return data.customers.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.idNumber.includes(q) ||
      c.mobilePhone.includes(q)
    ).slice(0, 20);
  }, [data.customers, searchQuery]);

  const handleChooseMode = (mode: 'new' | 'existing') => {
    setCustomerMode(mode);
    setStep('customer-details');
  };

  const handleSelectExistingCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setStep('manage-products');
  };

  const handleCreateAndContinue = async () => {
    const result = customerBasicSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const customer = await addCustomer({
        firstName: form.firstName, lastName: form.lastName,
        idNumber: form.idNumber, mobilePhone: form.mobilePhone,
        email: form.email || undefined, status: 'בקליטה',
      });
      setSelectedCustomerId(customer.id);
      toast.success('הלקוח נוצר');
      setStep('manage-products');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setSaving(false);
    }
  };

  const processPretreatmentFiles = async (files: File[]) => {
    if (files.length === 0 || !selectedCustomerId) return;

    setFileUploading(true);
    setFileUploadStatus('מעלה קבצים...');

    try {
      const expandedFiles: File[] = [];
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          setFileUploadStatus(`פורס ZIP: ${file.name}...`);
          const zip = await JSZip.loadAsync(file);
          const validExts = ['.csv', '.xlsx', '.xls', '.xml', '.txt', '.json'];
          for (const [path, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
            if (!validExts.includes(ext)) continue;
            const blob = await entry.async('blob');
            const fileName = path.split('/').pop() || path;
            expandedFiles.push(new File([blob], fileName, { type: blob.type }));
          }
        } else {
          expandedFiles.push(file);
        }
      }

      if (expandedFiles.length === 0) {
        toast.warning('לא נמצאו קבצים מתאימים');
        return;
      }

      let totalProducts = 0;
      for (let i = 0; i < expandedFiles.length; i++) {
        const file = expandedFiles[i];
        setFileUploadStatus(`מנתח ${i + 1}/${expandedFiles.length}: ${file.name}...`);

        const isBinary = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
        const bodyPayload: Record<string, any> = {
          fileName: file.name,
          fileType: file.name.toLowerCase().includes('hb') || isBinary ? 'הר ביטוח' : 'מסלקה',
          customerId: selectedCustomerId,
        };

        if (isBinary) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          bodyPayload.fileBase64 = base64;
        } else {
          const text = await file.text();
          bodyPayload.fileContent = text.substring(0, 80000);
        }

        const response = await supabase.functions.invoke('parse-insurance-file', { body: bodyPayload });
        if (response.error) {
          console.error('Parse error:', response.error);
          toast.error(`שגיאה בניתוח ${file.name}`);
          continue;
        }
        const result = response.data;
        if (result.error) {
          toast.error(`${file.name}: ${result.error}`);
          continue;
        }
        totalProducts += result.count || 0;
      }

      await logActivity('קובץ טרום טיפול נותח', `${totalProducts} מוצרים נקלטו`, 'הצלחה', { customerId: selectedCustomerId });
      await refreshData();
      setFileUploadStatus('');
      toast.success(`נמצאו ${totalProducts} מוצרים (ללא ביטוח רכב/דירה)`);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'שגיאה בהעלאת הקובץ');
    } finally {
      setFileUploading(false);
      setFileUploadStatus('');
      if (pretreatmentFileRef.current) pretreatmentFileRef.current.value = '';
    }
  };

  const handlePretreatmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processPretreatmentFiles(Array.from(e.target.files || []));
  };

  const handlePretreatmentDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragging(false);
    await processPretreatmentFiles(Array.from(e.dataTransfer.files));
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Remove any draft for this product
      setRecDrafts(prev => prev.filter(d => d.productId !== productId));
      await deleteProduct(productId);
      toast.success('מוצר נמחק');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה במחיקת מוצר');
    }
  };

  const handleContinueToRecs = () => {
    if (customerProducts.length === 0) {
      toast.error('יש להוסיף לפחות מוצר אחד');
      return;
    }
    // Keep existing drafts, don't auto-create for all products
    setStep('write-recommendations');
  };

  const addDraftForProduct = (productId: string) => {
    const existing = recDrafts.find(d => d.productId === productId);
    if (existing) {
      toast.info('כבר קיימת טיוטת המלצה למוצר זה');
      return;
    }
    const product = customerProducts.find(p => p.id === productId);
    if (product) {
      setRecDrafts(prev => [...prev, createRecDraft(product)]);
      
      // Auto-find next product without a draft and highlight it
      const productsWithoutDraft = customerProducts.filter(
        cp => cp.id !== productId && !recDrafts.some(d => d.productId === cp.id)
      );
      
      if (productsWithoutDraft.length > 0) {
        toast.success(`המלצה נוספה ל-${product.company} — ${product.productType}. נותרו ${productsWithoutDraft.length} מוצרים`);
      } else {
        toast.success('המלצה נוספה! כל המוצרים מכוסים — ניתן להמשיך לכתיבה');
      }
    }
  };

  const updateDraft = (productId: string, updates: Partial<RecDraft>) => {
    setRecDrafts(prev => prev.map(d => d.productId === productId ? { ...d, ...updates } : d));
  };

  const removeDraft = (productId: string) => {
    setRecDrafts(prev => prev.filter(d => d.productId !== productId));
  };

  const openReasoningBank = (productId: string) => {
    setReasoningTarget(productId);
    setReasoningFilter('');
    setReasoningModalOpen(true);
  };

  const selectReasoning = (entry: ReasoningEntry) => {
    const draft = recDrafts.find(d => d.productId === reasoningTarget);
    if (draft) {
      const currentRationale = draft.rationale;
      updateDraft(reasoningTarget, {
        rationale: currentRationale ? `${currentRationale}\n${entry.text}` : entry.text,
      });
      // Increment usage count
      supabase.from('reasoning_bank').update({ usage_count: (entry as any).usage_count + 1 || 1 } as any).eq('id', entry.id).then();
    }
    setReasoningModalOpen(false);
    toast.success('נימוק נוסף להמלצה');
  };

  const generateAiRecommendation = async (productId: string) => {
    const product = customerProducts.find(p => p.id === productId);
    if (!product) return;
    setAiLoading(prev => ({ ...prev, [productId]: true }));
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-recommendation', {
        body: {
          product: {
            company: product.company, productType: product.productType, category: product.category,
            policyNumber: product.policyNumber, monthlyPremium: product.monthlyPremium,
            accumulation: product.accumulation, managementFeeDeposit: product.managementFeeDeposit,
            managementFeeAccumulation: product.managementFeeAccumulation, track: product.track, phase: product.phase,
          },
          customer: selectedCustomer ? {
            fullName: selectedCustomer.fullName, birthDate: selectedCustomer.birthDate,
            maritalStatus: selectedCustomer.maritalStatus, occupation: selectedCustomer.occupation,
          } : null,
        },
      });
      if (fnError) throw fnError;
      const rec = fnData.recommendation;
      updateDraft(productId, {
        title: rec.title || '',
        rationale: rec.rationale || '',
        currentState: rec.currentState || '',
        problemGap: rec.problemGap || '',
        improvement: rec.improvement || '',
        advantages: rec.advantages || '',
        disadvantages: rec.disadvantages || '',
        recommendationType: rec.recommendationType || 'שינוי',
        actionType: rec.actionType || 'שדרוג',
        urgency: rec.urgency || 'חשוב',
        recommendedCompany: rec.recommendedCompany || '',
        recommendedTrack: rec.recommendedTrack || '',
        nextStep: rec.nextStep || '',
      });
      toast.success('המלצה נוצרה בעזרת AI');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה ביצירת המלצה');
    } finally {
      setAiLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const filteredReasonings = useMemo(() => {
    if (!reasoningFilter) return reasoningEntries;
    const q = reasoningFilter.toLowerCase();
    return reasoningEntries.filter(e => e.text.toLowerCase().includes(q) || e.tags.some(t => t.includes(q)));
  }, [reasoningEntries, reasoningFilter]);

  const handleSubmitAll = async () => {
    const activeDrafts = recDrafts.filter(d => d.title.trim() && d.rationale.trim());
    if (activeDrafts.length === 0) {
      toast.error('יש למלא לפחות המלצה אחת עם כותרת ונימוק');
      return;
    }

    setSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('לא מחובר');

      // Get latest version for this customer
      const { data: existingSummaries } = await supabase
        .from('recommendation_summaries')
        .select('version')
        .eq('customer_id', selectedCustomerId)
        .eq('agent_id', user.id)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingSummaries && existingSummaries.length > 0
        ? (existingSummaries[0] as any).version + 1
        : 1;

      // Mark previous versions as not current
      if (nextVersion > 1) {
        await supabase.from('recommendation_summaries')
          .update({ is_current: false } as any)
          .eq('customer_id', selectedCustomerId)
          .eq('agent_id', user.id);
      }

      // Create summary record
      const { data: summaryData, error: summaryError } = await supabase
        .from('recommendation_summaries')
        .insert({
          customer_id: selectedCustomerId,
          agent_id: user.id,
          version: nextVersion,
          status: 'draft',
          is_current: true,
          link_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any)
        .select()
        .single();

      if (summaryError) throw summaryError;
      const summary = summaryData as any;

      const ids: string[] = [];
      for (let i = 0; i < activeDrafts.length; i++) {
        const draft = activeDrafts[i];
        const product = customerProducts.find(p => p.id === draft.productId);
        const snapshot = product ? {
          company: product.company, productType: product.productType,
          policyNumber: product.policyNumber, monthlyPremium: product.monthlyPremium,
          accumulation: product.accumulation, managementFeeDeposit: product.managementFeeDeposit,
          managementFeeAccumulation: product.managementFeeAccumulation, category: product.category,
          track: product.track, phase: product.phase,
        } : null;

        const rec = await addRecommendation({
          customerId: selectedCustomerId,
          linkedProductId: draft.productId,
          title: draft.title,
          rationale: draft.rationale,
          currentState: draft.currentState || undefined,
          improvement: draft.improvement || undefined,
          actionType: draft.actionType,
          basedOn: draft.basedOn || undefined,
          nextStep: draft.nextStep || undefined,
          requiresQuote: draft.requiresQuote,
          decisionStatus: 'טיוטה',
        });

        await supabase.from('recommendations').update({
          summary_id: summary.id,
          sort_order: i,
          urgency: draft.urgency,
          problem_gap: draft.problemGap || null,
          recommended_company: draft.recommendedCompany || null,
          recommended_track: draft.recommendedTrack || null,
          cost_before: draft.costBefore ? Number(draft.costBefore) : null,
          cost_after: draft.costAfter ? Number(draft.costAfter) : null,
          recommendation_type: draft.recommendationType,
          product_snapshot: snapshot,
          advantages: draft.advantages || null,
          disadvantages: draft.disadvantages || null,
        }).eq('id', rec.id);

        ids.push(rec.id);
      }

      setCreatedRecIds(ids);
      setSummaryId(summary.id);
      setSummaryVersion(nextVersion);
      setSummaryLinkToken(summary.link_token);
      toast.success(`גרסה ${nextVersion} — ${activeDrafts.length} המלצות נוצרו בהצלחה`);
      setStep('summary');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה');
    } finally {
      setSaving(false);
    }
  };

  const handleSendSummary = async () => {
    if (!summaryId) return;
    await supabase.from('recommendation_summaries')
      .update({ status: 'sent', sent_at: new Date().toISOString() } as any)
      .eq('id', summaryId);
    // Update all linked recommendations to "נשלח"
    await (supabase.from('recommendations')
      .update({ decision_status: 'נשלח' }) as any)
      .eq('summary_id', summaryId);
    toast.success('הסיכום נשלח — ההמלצות ננעלו לעריכה');
  };

  const handleCopyLink = async () => {
    const token = summaryLinkToken;
    if (!token) {
      toast.error('אין טוקן זמין — שמור את הסיכום תחילה');
      return;
    }
    const link = `${window.location.origin}/portal/${token}`;
    await navigator.clipboard.writeText(link);
    await logActivity('לינק לקוח הועתק', selectedCustomer?.fullName || '', 'מידע', { customerId: selectedCustomerId });
    toast.success('הלינק הועתק ללוח');
  };

  const stepLabels: Record<Step, string> = {
    'choose-customer': 'בחירת לקוח',
    'customer-details': customerMode === 'new' ? 'פרטי לקוח חדש' : 'בחירת לקוח קיים',
    'manage-products': 'ניהול מוצרים',
    'write-recommendations': 'כתיבת המלצות',
    'preview': 'תצוגה מקדימה',
    'summary': 'סיכום ושליחה',
  };

  const allSteps: Step[] = ['choose-customer', 'customer-details', 'manage-products', 'write-recommendations', 'preview', 'summary'];
  const stepNumber = allSteps.indexOf(step) + 1;

  const goBack = () => {
    if (step === 'choose-customer') navigate('/');
    else if (step === 'customer-details') setStep('choose-customer');
    else if (step === 'manage-products') setStep(customerMode === 'new' ? 'customer-details' : 'customer-details');
    else if (step === 'write-recommendations') setStep('manage-products');
    else if (step === 'preview') setStep('write-recommendations');
    else setStep('preview');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in px-0">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Button variant="ghost" size="sm" onClick={goBack} className="hover:bg-[#5ec6c6]/10 shrink-0 h-9 w-9 p-0 md:h-10 md:w-10 rounded-xl min-h-[44px]">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-foreground">יצירת המלצה</h1>
          <p className="text-xs md:text-sm text-muted-foreground">שלב {stepNumber} מתוך 6 — {stepLabels[step]}</p>
        </div>
      </div>

      {/* Progress bar - premium segmented design */}
      <div className="flex gap-1 md:gap-1.5 mb-5 md:mb-8">
        {allSteps.map((s, i) => (
          <div key={s} className="flex-1 relative">
            <div className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ease-out ${
              i < stepNumber
                ? 'bg-gradient-to-l from-[#0a3d3d] to-[#5ec6c6] shadow-sm shadow-[#5ec6c6]/20'
                : i === stepNumber - 1
                  ? 'bg-[#0a3d3d]'
                  : 'bg-border/50'
            }`} />
          </div>
        ))}
      </div>

      {/* Step 1: Choose customer type */}
      {step === 'choose-customer' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Card className="cursor-pointer hover:border-[#5ec6c6]/50 hover:shadow-xl hover:shadow-[#0a3d3d]/5 transition-all duration-300 group rounded-2xl hover:-translate-y-1" onClick={() => handleChooseMode('existing')}>
            <CardContent className="flex flex-col items-center gap-2 md:gap-3 p-6 md:p-10">
              <div className="w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-[#0a3d3d]/8 flex items-center justify-center group-hover:bg-[#0a3d3d]/15 group-hover:shadow-lg group-hover:shadow-[#0a3d3d]/10 transition-all duration-300">
                <Users className="h-7 w-7 md:h-8 md:w-8 text-[#0a3d3d]" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground">לקוח קיים</h3>
              <p className="text-xs md:text-sm text-muted-foreground text-center">בחר מרשימת הלקוחות הקיימים</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-[#5ec6c6]/50 hover:shadow-xl hover:shadow-[#0a3d3d]/5 transition-all duration-300 group rounded-2xl hover:-translate-y-1" onClick={() => handleChooseMode('new')}>
            <CardContent className="flex flex-col items-center gap-2 md:gap-3 p-6 md:p-10">
              <div className="w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-[#5ec6c6]/10 flex items-center justify-center group-hover:bg-[#5ec6c6]/20 group-hover:shadow-lg group-hover:shadow-[#5ec6c6]/10 transition-all duration-300">
                <UserPlus className="h-7 w-7 md:h-8 md:w-8 text-[#0a3d3d]" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground">לקוח חדש</h3>
              <p className="text-xs md:text-sm text-muted-foreground text-center">צור לקוח חדש והוסף המלצה</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2a: Select existing customer */}
      {step === 'customer-details' && customerMode === 'existing' && (
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-[#0a3d3d]/3 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0a3d3d]/10 flex items-center justify-center">
                <Search className="h-4 w-4 text-[#0a3d3d]" />
              </div>
              חיפוש לקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 md:p-6">
            <Input placeholder="חפש לפי שם, ת.ז או טלפון..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
              className="rounded-xl h-12 border-border/60 focus:border-[#5ec6c6] transition-colors text-sm" />
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">לא נמצאו לקוחות</p>
                </div>
              )}
              {filteredCustomers.map(c => (
                <button key={c.id} onClick={() => handleSelectExistingCustomer(c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#5ec6c6]/5 transition-all duration-200 text-right group min-h-[52px]">
                  <div className="w-10 h-10 rounded-xl bg-[#0a3d3d]/8 flex items-center justify-center text-[#0a3d3d] font-bold text-sm group-hover:bg-[#0a3d3d]/12 group-hover:shadow-md transition-all duration-200">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium group-hover:text-[#0a3d3d] transition-colors">{c.fullName}</p>
                    <p className="text-xs text-muted-foreground">{c.idNumber} · {c.mobilePhone}</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#0a3d3d] group-hover:translate-x-[-2px] transition-all duration-200" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2b: New customer form */}
      {step === 'customer-details' && customerMode === 'new' && (
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-b from-[#0a3d3d]/3 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0a3d3d]/10 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-[#0a3d3d]" />
                </div>
                פרטי לקוח חדש
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">שם פרטי *</Label>
                  <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6]" />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">שם משפחה *</Label>
                  <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6]" />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">תעודת זהות *</Label>
                  <Input value={form.idNumber} onChange={e => setForm(p => ({ ...p, idNumber: e.target.value }))} className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6]" />
                  {errors.idNumber && <p className="text-xs text-destructive mt-1">{errors.idNumber}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">טלפון נייד *</Label>
                  <Input value={form.mobilePhone} onChange={e => setForm(p => ({ ...p, mobilePhone: e.target.value }))} className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6]" />
                  {errors.mobilePhone && <p className="text-xs text-destructive mt-1">{errors.mobilePhone}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">אימייל</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" className="rounded-xl h-11 border-border/60 focus:border-[#5ec6c6]" />
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleCreateAndContinue} size="lg" className="gap-2 rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            צור לקוח והמשך
          </Button>
        </div>
      )}

      {/* Step 3: Manage products */}
      {step === 'manage-products' && (
        <div className="space-y-4">
          {selectedCustomer && (
            <div className="flex items-center gap-3 p-3.5 bg-gradient-to-l from-[#0a3d3d]/5 to-[#5ec6c6]/5 rounded-2xl mb-4 border border-[#5ec6c6]/10">
              <div className="w-10 h-10 rounded-xl bg-[#0a3d3d]/10 flex items-center justify-center text-[#0a3d3d] font-bold text-sm shadow-sm">
                {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedCustomer.fullName}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.idNumber}</p>
              </div>
            </div>
          )}

          {/* Pre-treatment file upload */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-[#0a3d3d]/3 to-transparent">
              <CardTitle className="text-base flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0a3d3d]/10 flex items-center justify-center">
                  <Upload className="h-3.5 w-3.5 text-[#0a3d3d]" />
                </div>
                העלאת קובץ טרום טיפול
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${
                  fileDragging ? 'border-[#5ec6c6] bg-[#5ec6c6]/10 scale-[1.01]' :
                  fileUploading ? 'border-[#5ec6c6] bg-[#5ec6c6]/5' : 'border-border/60 hover:border-[#5ec6c6]/50 hover:bg-[#5ec6c6]/5'
                }`}
                onClick={() => !fileUploading && pretreatmentFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setFileDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setFileDragging(true); }}
                onDragLeave={() => setFileDragging(false)}
                onDrop={handlePretreatmentDrop}
              >
                {fileUploading ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-[#5ec6c6]/20 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0a3d3d]" />
                      </div>
                      <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-[#5ec6c6] animate-spin" style={{ animationDuration: '1.5s' }} />
                    </div>
                    <p className="text-sm font-semibold text-[#0a3d3d]">{fileUploadStatus}</p>
                    <p className="text-xs text-muted-foreground">מוצרי רכב ודירה מסוננים אוטומטית</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#0a3d3d]/8 flex items-center justify-center mx-auto mb-2">
                      <Upload className="h-5 w-5 text-[#0a3d3d]/60" />
                    </div>
                    <p className="text-sm font-medium">{fileDragging ? 'שחרר כאן' : 'לחץ או גרור קובץ טרום טיפול'}</p>
                    <p className="text-xs text-muted-foreground mt-1">ZIP, CSV, XLSX, XML · ביטוחי רכב ודירה מסוננים אוטומטית</p>
                  </>
                )}
                <input
                  ref={pretreatmentFileRef}
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls,.xml,.txt,.zip"
                  className="hidden"
                  onChange={handlePretreatmentUpload}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-b from-[#5ec6c6]/3 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#5ec6c6]/15 flex items-center justify-center">
                    <Package className="h-4 w-4 text-[#0a3d3d]" />
                  </div>
                  מוצרים ({customerProducts.length})
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl min-h-[36px] border-[#0a3d3d]/20 text-[#0a3d3d] hover:bg-[#0a3d3d]/5" onClick={() => { setEditingProduct(undefined); setProductModalOpen(true); }}>
                  <Plus className="h-3.5 w-3.5" />הוסף מוצר
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">לחץ על ⊕ ליד כל מוצר כדי ליצור עבורו המלצה. לאחר מכן המשך לכתיבה.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {customerProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">אין מוצרים עדיין. הוסף מוצר כדי להמשיך.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Money products */}
                  {customerProducts.filter(p => p.category === 'כסף').length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gold/5 border-b">
                        <span>💰</span>
                        <span className="text-xs font-semibold text-muted-foreground">כסף ({customerProducts.filter(p => p.category === 'כסף').length})</span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {customerProducts.filter(p => p.category === 'כסף').map(p => {
                          const hasDraft = recDrafts.some(d => d.productId === p.id);
                          return (
                            <WizardProductRow key={p.id} product={p} hasDraft={hasDraft}
                              onAddDraft={() => addDraftForProduct(p.id)}
                              onEdit={() => { setEditingProduct(p); setProductModalOpen(true); }}
                              onDelete={() => handleDeleteProduct(p.id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Insurance products */}
                  {customerProducts.filter(p => p.category === 'ביטוח').length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-info/5 border-b">
                        <span>🛡️</span>
                        <span className="text-xs font-semibold text-muted-foreground">ביטוח ({customerProducts.filter(p => p.category === 'ביטוח').length})</span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {customerProducts.filter(p => p.category === 'ביטוח').map(p => {
                          const hasDraft = recDrafts.some(d => d.productId === p.id);
                          return (
                            <WizardProductRow key={p.id} product={p} hasDraft={hasDraft}
                              onAddDraft={() => addDraftForProduct(p.id)}
                              onEdit={() => { setEditingProduct(p); setProductModalOpen(true); }}
                              onDelete={() => handleDeleteProduct(p.id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Progress indicator */}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-l from-[#0a3d3d]/5 to-[#5ec6c6]/5 border border-[#5ec6c6]/10">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-medium">המלצות נוצרו</span>
                        <span className="font-bold text-[#0a3d3d]">{recDrafts.length} / {customerProducts.length}</span>
                      </div>
                      <div className="h-2 bg-[#0a3d3d]/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-[#0a3d3d] to-[#5ec6c6] rounded-full transition-all duration-500 ease-out shadow-sm shadow-[#5ec6c6]/30"
                          style={{ width: `${customerProducts.length > 0 ? (recDrafts.length / customerProducts.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleContinueToRecs} size="lg" className="gap-2 rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5" disabled={customerProducts.length === 0}>
              המשך לכתיבת המלצות ({recDrafts.length}) <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {selectedCustomerId && (
            <ProductModal
              open={productModalOpen}
              onClose={() => { setProductModalOpen(false); setEditingProduct(undefined); }}
              customerId={selectedCustomerId}
              product={editingProduct}
            />
          )}
        </div>
      )}

      {/* Step 4: Write recommendations */}
      {step === 'write-recommendations' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-l from-[#0a3d3d]/5 to-[#5ec6c6]/5 rounded-2xl border border-[#5ec6c6]/10">
            {selectedCustomer && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0a3d3d]/10 flex items-center justify-center text-[#0a3d3d] font-bold text-[10px]">
                  {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                </div>
                <span className="font-semibold text-sm">{selectedCustomer.fullName}</span>
              </div>
            )}
            <span className="text-sm text-muted-foreground">· {recDrafts.length} מוצרים</span>
          </div>

          {recDrafts.map((draft, idx) => {
            const product = customerProducts.find(p => p.id === draft.productId);
            if (!product) return null;
            return (
              <Card key={draft.productId} className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 px-3 md:px-6 bg-gradient-to-b from-muted/30 to-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <span className="w-6 h-6 md:w-7 md:h-7 rounded-xl bg-[#0a3d3d] text-white text-[10px] md:text-xs flex items-center justify-center font-bold shrink-0 shadow-sm shadow-[#0a3d3d]/20">
                        {idx + 1}
                      </span>
                      <span className="truncate">{product.company} — {product.productType}</span>
                    </CardTitle>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="sm"
                        className="gap-1 text-[10px] md:text-xs h-8 px-2.5 rounded-xl border-[#5ec6c6]/30 text-[#0a3d3d] hover:bg-[#5ec6c6]/10 min-h-[32px] transition-all duration-200"
                        onClick={() => generateAiRecommendation(draft.productId)}
                        disabled={aiLoading[draft.productId]}>
                        {aiLoading[draft.productId] ? (
                          <div className="relative">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full border border-transparent border-t-[#5ec6c6] animate-spin" />
                          </div>
                        ) : <Sparkles className="h-3 w-3" />}
                        AI
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-[10px] md:text-xs h-8 px-2.5 rounded-xl min-h-[32px]" onClick={() => openReasoningBank(draft.productId)}>
                        <BookOpen className="h-3 w-3" /><span className="hidden sm:inline">בנק נימוקים</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0 rounded-xl min-h-[32px] hover:bg-destructive/10" onClick={() => removeDraft(draft.productId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.category} · {product.policyNumber || 'ללא מספר פוליסה'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 px-3 md:px-6">
                  {/* Row 1: Title + Action type + Recommendation type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">כותרת *</Label>
                      <Input value={draft.title} onChange={e => updateDraft(draft.productId, { title: e.target.value })} placeholder="לדוגמה: החלפת קרן פנסיה" />
                    </div>
                    <div>
                      <Label className="text-xs">סוג פעולה</Label>
                      <Select value={draft.actionType} onValueChange={v => updateDraft(draft.productId, { actionType: v as ActionType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{actionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">סוג המלצה</Label>
                      <Select value={draft.recommendationType} onValueChange={v => updateDraft(draft.productId, { recommendationType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{recTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: Urgency + Recommended company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">דחיפות</Label>
                      <Select value={draft.urgency} onValueChange={v => updateDraft(draft.productId, { urgency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {urgencyLevels.map(u => (
                            <SelectItem key={u.value} value={u.value}>
                              <span className={u.color}>{u.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">חברה מומלצת</Label>
                      <Select value={draft.recommendedCompany || 'none'} onValueChange={v => updateDraft(draft.productId, { recommendedCompany: v === 'none' ? '' : v })}>
                        <SelectTrigger><SelectValue placeholder="בחר חברה" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ללא</SelectItem>
                          {insuranceCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">מצב נוכחי</Label>
                    <Textarea value={draft.currentState} onChange={e => updateDraft(draft.productId, { currentState: e.target.value })} rows={2} />
                  </div>

                  <div>
                    <Label className="text-xs">המלצת סוכן</Label>
                    <Textarea value={draft.problemGap} onChange={e => updateDraft(draft.productId, { problemGap: e.target.value })} rows={2} placeholder="טקסט חופשי - המלצת הסוכן" />
                  </div>

                  <div>
                    <Label className="text-xs">נימוק * <span className="text-muted-foreground">(ניתן להשתמש בבנק נימוקים)</span></Label>
                    <Textarea value={draft.rationale} onChange={e => updateDraft(draft.productId, { rationale: e.target.value })} rows={3} placeholder="הסבר מדוע ההמלצה נכונה" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">יתרונות</Label>
                      <Textarea value={draft.advantages} onChange={e => updateDraft(draft.productId, { advantages: e.target.value })} rows={2} placeholder="יתרונות הפעולה" />
                    </div>
                    <div>
                      <Label className="text-xs">חסרונות / ויתורים</Label>
                      <Textarea value={draft.disadvantages} onChange={e => updateDraft(draft.productId, { disadvantages: e.target.value })} rows={2} placeholder="מה מוותרים עליו" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">שיפור מוצע</Label>
                    <Textarea value={draft.improvement} onChange={e => updateDraft(draft.productId, { improvement: e.target.value })} rows={2} placeholder="מה ישתפר עבור הלקוח" />
                  </div>

                  {/* Cost comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">עלות לפני (₪)</Label>
                      <Input type="number" inputMode="decimal" value={draft.costBefore} onChange={e => updateDraft(draft.productId, { costBefore: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">עלות אחרי (₪)</Label>
                      <Input type="number" inputMode="decimal" value={draft.costAfter} onChange={e => updateDraft(draft.productId, { costAfter: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">מסלול מומלץ</Label>
                      <Select value={draft.recommendedTrack || 'none'} onValueChange={v => updateDraft(draft.productId, { recommendedTrack: v === 'none' ? '' : v })}>
                        <SelectTrigger><SelectValue placeholder="בחר מסלול" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ללא</SelectItem>
                          {(['כללי','מניות','עוקב S&P 500','מדדי מניות','מסלול אג"ח','אג"ח ממשלות','עוקב מדדי אג"ח','אג"ח סחיר','אג"ח סחיר עד 25% מניות','עד 25% מניות','משולב סחיר','מניות סחיר','הלכתי','גילאי 50 ומטה','גילאי 50–60','גילאי 60 ומעלה','סיכון גבוה','סיכון בינוני','סיכון נמוך','קיימות','שריעה / הלכה אסלאמית','אחר']).map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">צעד הבא</Label>
                    <Input value={draft.nextStep} onChange={e => updateDraft(draft.productId, { nextStep: e.target.value })} placeholder="לדוגמה: לקבוע פגישה" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={draft.requiresQuote} onCheckedChange={v => updateDraft(draft.productId, { requiresQuote: v })} />
                    <Label className="text-xs">נדרשת הצעת מחיר</Label>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-3">
            <Button onClick={() => setStep('preview')} size="lg" className="gap-2 rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
              תצוגה מקדימה <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => setStep('manage-products')} className="rounded-2xl min-h-[48px]">חזור</Button>
          </div>
        </div>
      )}

      {/* Step 5: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          <Card className="border-[#5ec6c6]/20 bg-gradient-to-l from-[#0a3d3d]/5 to-[#5ec6c6]/5 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-center gap-2">
              <Eye className="h-4 w-4 text-[#0a3d3d]" />
              <p className="text-sm text-center text-[#0a3d3d] font-medium">תצוגה מקדימה — כך הלקוח יראה את ההמלצות</p>
            </CardContent>
          </Card>

          {recDrafts.filter(d => d.title.trim()).map((draft, idx) => {
            const product = customerProducts.find(p => p.id === draft.productId);
            const urgency = urgencyLevels.find(u => u.value === draft.urgency);
            return (
              <Card key={draft.productId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{draft.title}</CardTitle>
                    <div className="flex gap-2">
                      {urgency && (
                        <Badge variant="outline" className={`text-xs ${urgency.color}`}>
                          {urgency.label}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">{draft.recommendationType}</Badge>
                    </div>
                  </div>
                  {product && <p className="text-sm text-muted-foreground">{product.company} · {product.productType}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {draft.currentState && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">מצב קיים</h4>
                      <p className="text-sm">{draft.currentState}</p>
                    </div>
                  )}
                  {draft.problemGap && (
                    <div className="bg-warning/5 rounded-lg p-3 border border-warning/10">
                      <h4 className="text-xs font-semibold text-warning mb-1">המלצת סוכן</h4>
                      <p className="text-sm">{draft.problemGap}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">נימוק</h4>
                    <p className="text-sm">{draft.rationale}</p>
                  </div>
                  {(draft.advantages || draft.disadvantages) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {draft.advantages && (
                        <div className="bg-success/5 rounded-lg p-3 border border-success/10">
                          <h4 className="text-xs font-semibold text-success mb-1">יתרונות</h4>
                          <p className="text-sm">{draft.advantages}</p>
                        </div>
                      )}
                      {draft.disadvantages && (
                        <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                          <h4 className="text-xs font-semibold text-destructive mb-1">חסרונות</h4>
                          <p className="text-sm">{draft.disadvantages}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {(draft.costBefore || draft.costAfter) && (
                    <div className="flex gap-4 p-3 bg-muted/30 rounded-lg">
                      {draft.costBefore && <span className="text-sm">עלות לפני: <strong>₪{draft.costBefore}</strong></span>}
                      {draft.costAfter && <span className="text-sm">עלות אחרי: <strong className="text-success">₪{draft.costAfter}</strong></span>}
                      {draft.costBefore && draft.costAfter && Number(draft.costAfter) < Number(draft.costBefore) && (
                        <span className="text-sm text-success font-medium">חיסכון: ₪{(Number(draft.costBefore) - Number(draft.costAfter)).toFixed(0)}</span>
                      )}
                    </div>
                  )}
                  {draft.improvement && (
                    <div className="bg-success/5 rounded-lg p-3 border border-success/10">
                      <h4 className="text-xs font-semibold text-success mb-1">מה משתפר</h4>
                      <p className="text-sm">{draft.improvement}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-3">
            <Button onClick={handleSubmitAll} size="lg" className="gap-2 rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 min-h-[48px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              צור {recDrafts.filter(d => d.title.trim() && d.rationale.trim()).length} המלצות
            </Button>
            <Button variant="outline" size="lg" onClick={() => setStep('write-recommendations')} className="rounded-2xl min-h-[48px]">חזור לעריכה</Button>
          </div>
        </div>
      )}

      {/* Step 6: Summary + generate link */}
      {step === 'summary' && (
        <div className="space-y-6">
          <Card className="border-[#5ec6c6]/20 rounded-2xl overflow-hidden">
            <CardContent className="p-8 md:p-10 text-center space-y-4 bg-gradient-to-b from-emerald-50/30 dark:from-emerald-900/5 to-transparent">
              <div className="w-18 h-18 rounded-full bg-emerald-100/60 dark:bg-emerald-900/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200/20">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold">גרסה {summaryVersion} — ההמלצות נוצרו בהצלחה!</h2>
              <p className="text-muted-foreground text-sm">
                {createdRecIds.length} המלצות נוצרו עבור {selectedCustomer?.fullName}
              </p>
              {summaryVersion > 1 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-1.5 inline-block">גרסאות קודמות נשמרות בהיסטוריה ואינן מוצגות ללקוח.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-b from-[#0a3d3d]/3 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#0a3d3d]/10 flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-[#0a3d3d]" />
                  </div>
                  שליחה ונעילה
                </CardTitle>
                <Button size="sm" className="gap-1.5 rounded-xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 min-h-[36px]" onClick={handleSendSummary}>
                  <LockIcon className="h-3.5 w-3.5" />שלח ונעל
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">לאחר השליחה ההמלצות יינעלו. לשינויים — צור גרסה חדשה.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input readOnly value={summaryLinkToken ? `${window.location.origin}/portal/${summaryLinkToken}` : 'שמור את הסיכום כדי לקבל לינק'} className="text-xs font-mono bg-muted/50" dir="ltr" />
                <Button onClick={handleCopyLink} variant="outline" className="gap-1.5 shrink-0">
                  <Copy className="h-4 w-4" />העתק
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                  if (!summaryLinkToken) { toast.error('אין טוקן זמין'); return; }
                  const link = `${window.location.origin}/portal/${summaryLinkToken}`;
                  const text = `שלום ${selectedCustomer?.firstName || ''}, ההמלצות שלך מוכנות לצפייה:\n${link}`;
                  const phone = selectedCustomer?.mobilePhone?.replace(/\D/g, '').replace(/^0/, '972') || '';
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                }}>
                  <MessageCircle className="h-4 w-4" />שלח בוואטסאפ
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                  if (!summaryLinkToken) { toast.error('אין טוקן זמין'); return; }
                  const link = `${window.location.origin}/portal/${summaryLinkToken}`;
                  const subject = 'ההמלצות שלך מוכנות';
                  const body = `שלום ${selectedCustomer?.firstName || ''},\n\nההמלצות הביטוחיות והפיננסיות שלך מוכנות לצפייה.\nלחץ על הקישור הבא:\n${link}\n\nתזדקק למספר תעודת הזהות שלך לאימות.`;
                  window.open(`mailto:${selectedCustomer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                }}>
                  <Mail className="h-4 w-4" />שלח במייל
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                הלקוח יזדהה עם מספר תעודת הזהות שלו ויוכל לצפות במצב הקיים ולאשר או לדחות כל המלצה.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2 md:gap-3 flex-wrap">
            <Button variant="outline" size="lg" className="gap-2 rounded-2xl min-h-[48px]" onClick={() => {
              const activeDrafts = recDrafts.filter(d => d.title.trim());
              downloadRecommendationPdf({
                customerName: selectedCustomer?.fullName || '',
                customerId: selectedCustomer?.idNumber || '',
                agencyName: 'SeelD',
                products: customerProducts.map(p => ({
                  company: p.company, productType: p.productType, category: p.category,
                  policyNumber: p.policyNumber, monthlyPremium: p.monthlyPremium,
                  accumulation: p.accumulation, managementFeeDeposit: p.managementFeeDeposit,
                  managementFeeAccumulation: p.managementFeeAccumulation, phase: p.phase,
                })),
                recommendations: activeDrafts.map(d => {
                  const product = customerProducts.find(p => p.id === d.productId);
                  return {
                    title: d.title, rationale: d.rationale, currentState: d.currentState || null,
                    problemGap: d.problemGap || null, improvement: d.improvement || null,
                    advantages: d.advantages || null, disadvantages: d.disadvantages || null,
                    actionType: d.actionType, recommendationType: d.recommendationType,
                    urgency: d.urgency, recommendedCompany: d.recommendedCompany || null,
                    costBefore: d.costBefore ? Number(d.costBefore) : null,
                    costAfter: d.costAfter ? Number(d.costAfter) : null,
                    product: product ? {
                      company: product.company, productType: product.productType, category: product.category,
                      policyNumber: product.policyNumber, monthlyPremium: product.monthlyPremium,
                      accumulation: product.accumulation, managementFeeDeposit: product.managementFeeDeposit,
                      managementFeeAccumulation: product.managementFeeAccumulation, phase: product.phase,
                    } : undefined,
                  };
                }),
              });
              toast.success('PDF הורד בהצלחה');
            }}>
              <FileText className="h-4 w-4" />הורד PDF
            </Button>
            <Button onClick={() => navigate('/app/recommendation-bank')} size="lg" className="rounded-2xl min-h-[48px] bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20">
              עבור לבנק המלצות
            </Button>
            <Button onClick={() => navigate(`/customers/${selectedCustomerId}`)} variant="outline" size="lg" className="rounded-2xl min-h-[48px]">
              כרטיס הלקוח
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/')} className="rounded-2xl min-h-[48px]">
              חזרה לדשבורד
            </Button>
          </div>
        </div>
      )}

      {/* Reasoning Bank Modal */}
      <Dialog open={reasoningModalOpen} onOpenChange={v => !v && setReasoningModalOpen(false)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />בנק נימוקים
            </DialogTitle>
          </DialogHeader>
          <Input placeholder="חיפוש..." value={reasoningFilter} onChange={e => setReasoningFilter(e.target.value)} className="mt-2" />
          <div className="space-y-2 mt-3">
            {filteredReasonings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">אין נימוקים. הוסף נימוקים מדף בנק הנימוקים.</p>
            ) : (
              filteredReasonings.map(entry => (
                <button key={entry.id} onClick={() => selectReasoning(entry)}
                  className="w-full text-right p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                  <div className="flex gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{entry.recommendation_type}</Badge>
                  </div>
                  <p className="text-sm">{entry.text}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WizardProductRow({ product, hasDraft, onAddDraft, onEdit, onDelete }: {
  product: Product; hasDraft: boolean;
  onAddDraft: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-3 transition-all duration-200 ${hasDraft ? 'bg-[#5ec6c6]/5' : 'hover:bg-muted/30'}`}>
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${product.isActive ? 'bg-emerald-400 shadow-sm shadow-emerald-300/50' : 'bg-muted-foreground/40'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.company} — {product.productType}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {product.policyNumber && `${product.policyNumber} · `}
          {product.monthlyPremium ? `₪${product.monthlyPremium}` : ''}
          {product.accumulation ? ` · צבירה: ₪${product.accumulation.toLocaleString()}` : ''}
          {product.managementFeeDeposit ? ` · דמ״נ: ${product.managementFeeDeposit}%` : ''}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {hasDraft ? (
          <Badge variant="secondary" className="text-[10px] gap-1 bg-[#0a3d3d]/10 text-[#0a3d3d] border-[#0a3d3d]/15 rounded-lg">
            <CheckCircle2 className="h-3 w-3" />יש המלצה
          </Badge>
        ) : (
          <Button variant="outline" size="sm" className="text-[10px] gap-1 h-8 px-2.5 border-[#0a3d3d]/20 text-[#0a3d3d] hover:bg-[#0a3d3d]/5 rounded-xl min-h-[32px]" onClick={onAddDraft}>
            <Plus className="h-3 w-3" />צור המלצה
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl min-h-[32px]" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl min-h-[32px] text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
