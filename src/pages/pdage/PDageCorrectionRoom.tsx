import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Download, ShieldCheck, Pencil, Save, CheckCircle2,
  AlertTriangle, MessageCircle, X, FileText, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PDageChatPanel } from '@/components/pdage/PDageChatPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { CorrectionFieldEditor, type CorrectionFields } from '@/components/pdage/CorrectionFieldEditor';
import { ValidationResultPanel } from '@/components/pdage/ValidationResultPanel';
import jsPDF from 'jspdf';

const DEFAULT_FIELDS: CorrectionFields = {
  customerName: '',
  idNumber: '',
  policyNumber: '',
  company: '',
  productType: '',
  startDate: '',
  endDate: '',
  coverageAmount: '',
  monthlyPremium: '',
  beneficiaries: '',
  additionalNotes: '',
};

export default function PDageCorrectionRoom() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { session } = useApp();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [chatOpen, setChatOpen] = useState(!isMobile);
  const [fields, setFields] = useState<CorrectionFields>(DEFAULT_FIELDS);
  const [fieldsLoaded, setFieldsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ score: number; warnings: string[] } | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['pdage-job', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('correction_jobs')
        .select('*, pdage_customers(full_name, id_number), deficiency_categories(name), deficiency_bank(title, description)')
        .eq('id', jobId!)
        .single();
      return data;
    },
    enabled: !!jobId && !!session,
  });

  // Load fields from job
  useEffect(() => {
    if (job && !fieldsLoaded) {
      const customer = job.pdage_customers as any;
      const saved = (job as any).correction_fields as CorrectionFields | null;
      if (saved && Object.keys(saved).length > 0) {
        setFields({ ...DEFAULT_FIELDS, ...saved });
      } else {
        setFields({
          ...DEFAULT_FIELDS,
          customerName: customer?.full_name || '',
          idNumber: customer?.id_number || '',
        });
      }
      // Load validation if exists
      if ((job as any).validation_score != null) {
        setValidationResult({
          score: (job as any).validation_score,
          warnings: ((job as any).validation_warnings as string[]) || [],
        });
      }
      setFieldsLoaded(true);
    }
  }, [job, fieldsLoaded]);

  const handleFieldChange = (key: keyof CorrectionFields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!jobId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('correction_jobs')
        .update({ correction_fields: fields as any, updated_at: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;
      toast.success('השדות נשמרו בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['pdage-job', jobId] });
    } catch (err: any) {
      toast.error('שגיאה בשמירה: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!jobId) return;
    // Save first
    await handleSave();
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-correction', {
        body: { jobId, fields },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = { score: data.score, warnings: data.warnings || [] };
      setValidationResult(result);

      // Save validation to DB
      await supabase.from('correction_jobs').update({
        validation_score: result.score,
        validation_warnings: result.warnings as any,
      }).eq('id', jobId);

      await supabase.from('correction_activity_log').insert({
        job_id: jobId,
        action_type: 'validation',
        title: 'סריקת AI בוצעה',
        details: `ציון: ${result.score}/100 | ${result.warnings.length} אזהרות`,
      });

      if (result.score >= 80) {
        toast.success(`ציון תקינות: ${result.score}/100 ✅`);
      } else {
        toast.warning(`ציון תקינות: ${result.score}/100 — נדרשים תיקונים נוספים`);
      }
    } catch (err: any) {
      toast.error('שגיאה בסריקה: ' + (err.message || ''));
    } finally {
      setValidating(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!job) return;
    setGenerating(true);
    try {
      const customer = job.pdage_customers as any;
      const deficiency = job.deficiency_bank as any;
      const category = job.deficiency_categories as any;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Header
      doc.setFillColor(43, 74, 56);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('pDage - Corrected Document', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Date: ${new Date().toLocaleDateString('he-IL')}`, pageWidth / 2, 25, { align: 'center' });
      doc.text(`Original: ${job.original_file_name}`, pageWidth / 2, 30, { align: 'center' });

      yPos = 45;

      // Validation badge
      if (validationResult) {
        const color = validationResult.score >= 80 ? [34, 197, 94] : validationResult.score >= 50 ? [234, 179, 8] : [220, 38, 38];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(pageWidth - margin - 35, yPos - 4, 35, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`Score: ${validationResult.score}/100`, pageWidth - margin - 17.5, yPos + 1, { align: 'center' });
      }

      // Deficiency info
      doc.setTextColor(43, 74, 56);
      doc.setFontSize(12);
      doc.text('Deficiency Details', pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      doc.setDrawColor(43, 74, 56);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      if (category) {
        doc.text(`Category: ${category.name}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
      }
      if (deficiency) {
        doc.text(`Deficiency: ${deficiency.title}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        if (deficiency.description) {
          const lines = doc.splitTextToSize(deficiency.description, pageWidth - margin * 2);
          lines.forEach((line: string) => {
            doc.text(line, pageWidth - margin, yPos, { align: 'right' });
            yPos += 4;
          });
        }
      }
      yPos += 5;

      // Corrected fields
      doc.setTextColor(43, 74, 56);
      doc.setFontSize(12);
      doc.text('Corrected Fields', pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      doc.setDrawColor(43, 74, 56);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;

      const fieldLabels: Record<string, string> = {
        customerName: 'Customer Name',
        idNumber: 'ID Number',
        policyNumber: 'Policy Number',
        company: 'Company',
        productType: 'Product Type',
        startDate: 'Start Date',
        endDate: 'End Date',
        coverageAmount: 'Coverage Amount',
        monthlyPremium: 'Monthly Premium',
        beneficiaries: 'Beneficiaries',
        additionalNotes: 'Additional Notes',
      };

      doc.setFontSize(9);
      Object.entries(fields).forEach(([key, value]) => {
        if (!value) return;
        if (yPos > 270) { doc.addPage(); yPos = 20; }
        doc.setTextColor(43, 74, 56);
        doc.setFont('Helvetica', 'bold');
        doc.text(`${fieldLabels[key] || key}:`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 4;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(String(value), pageWidth - margin * 2);
        lines.forEach((line: string) => {
          if (yPos > 275) { doc.addPage(); yPos = 20; }
          doc.text(line, pageWidth - margin, yPos, { align: 'right' });
          yPos += 4;
        });
        yPos += 2;
      });

      // Warnings section
      if (validationResult && validationResult.warnings.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        yPos += 5;
        doc.setTextColor(234, 179, 8);
        doc.setFontSize(11);
        doc.text('Validation Warnings', pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        validationResult.warnings.forEach(w => {
          if (yPos > 275) { doc.addPage(); yPos = 20; }
          doc.text(`• ${w}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 4;
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`pDage | Corrected Document | Page ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }

      const fileName = `corrected_${customer?.full_name?.replace(/\s+/g, '_') || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // Update job status
      await supabase.from('correction_jobs').update({
        status: 'done',
        completed_at: new Date().toISOString(),
      }).eq('id', jobId!);

      await supabase.from('correction_activity_log').insert({
        job_id: jobId!,
        action_type: 'pdf_generated',
        title: 'PDF מתוקן הופק',
        details: `הקובץ ${fileName} הופק בהצלחה`,
      });

      toast.success('PDF מתוקן הופק בהצלחה!');
      queryClient.invalidateQueries({ queryKey: ['pdage-job', jobId] });
    } catch (err: any) {
      toast.error('שגיאה ביצירת PDF: ' + (err.message || ''));
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">העבודה לא נמצאה</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/pdage')}>חזרה לדשבורד</Button>
      </div>
    );
  }

  const customer = job.pdage_customers as any;
  const deficiency = job.deficiency_bank as any;
  const category = job.deficiency_categories as any;

  return (
    <div className="flex gap-4 max-w-7xl mx-auto h-[calc(100vh-5rem)]">
      {/* Main editor area */}
      <div className={`${chatOpen && !isMobile ? 'flex-1 min-w-0' : 'w-full'} flex flex-col gap-4 overflow-y-auto pb-4`}>
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-2">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              חדר ניתוח
            </h1>
            <p className="text-xs text-muted-foreground">{job.original_file_name} · {customer?.full_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={chatOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className="gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              {isMobile ? '' : chatOpen ? 'סגור צ׳אט' : 'עוזר AI'}
            </Button>
          </div>
        </div>

        {/* Deficiency context */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {category && <Badge variant="outline" className="text-xs">{category.name}</Badge>}
                  <span className="text-sm font-medium text-foreground">{deficiency?.title || job.free_text_deficiency || 'חוסר לא מוגדר'}</span>
                </div>
                {deficiency?.description && (
                  <p className="text-xs text-muted-foreground mt-1">{deficiency.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field editor */}
        <CorrectionFieldEditor fields={fields} onChange={handleFieldChange} />

        {/* Validation result */}
        {validationResult && <ValidationResultPanel result={validationResult} />}

        {/* Action bar */}
        <Card className="border-none shadow-sm sticky bottom-0 bg-background">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 justify-between flex-wrap">
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving} variant="outline" size="sm" className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  שמור
                </Button>
                <Button onClick={handleValidate} disabled={validating} variant="outline" size="sm" className="gap-1.5">
                  {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {validating ? 'סורק...' : 'סריקת AI'}
                </Button>
              </div>
              <Button
                onClick={handleGeneratePdf}
                disabled={generating}
                size="sm"
                className="gap-1.5"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {generating ? 'מפיק PDF...' : 'הפק PDF מתוקן'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
              <PDageChatPanel
                jobId={jobId!}
                jobTitle={job.original_file_name}
                onClose={() => setChatOpen(false)}
                correctionFields={fields}
                onFieldUpdate={(key, value) => handleFieldChange(key as keyof CorrectionFields, value)}
              />
            </div>
          ) : (
            <div className="w-[380px] shrink-0 h-full">
              <Card className="border-none shadow-sm h-full flex flex-col overflow-hidden">
                <PDageChatPanel
                  jobId={jobId!}
                  jobTitle={job.original_file_name}
                  onClose={() => setChatOpen(false)}
                  correctionFields={fields}
                  onFieldUpdate={(key, value) => handleFieldChange(key as keyof CorrectionFields, value)}
                />
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
