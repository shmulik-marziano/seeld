import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useExecutionSummaries } from '@/hooks/useExecutionSummaries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/status/StatusBadge';
import { motion } from 'framer-motion';
import {
  ArrowRight, Save, FileText, CheckCircle2, Clock, User,
  ClipboardCheck, Download, AlertTriangle, Sparkles, Share2, Copy, ExternalLink, MessageCircle, Presentation,
} from 'lucide-react';
import { PresentationViewer } from '@/components/slides/SlideEngine';
import { buildExecutionPresentation } from '@/components/slides/SlideTemplates';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SUMMARY_STATUS_LABELS, ITEM_STATUS_LABELS, ItemExecutionStatus, ExecutionSummaryStatus } from '@/types/execution-summary';
import { generateExecutionSummaryPdf } from '@/services/pdf-generator';

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ExecutionSummaryPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const summaryIdParam = searchParams.get('summaryId');
  const navigate = useNavigate();
  const { data, agency } = useApp();
  const { summaries, items, loading, createSummary, updateSummary, updateItem, completeSummary } = useExecutionSummaries(customerId);

  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(summaryIdParam);
  const [generalNotes, setGeneralNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  const customer = data.customers.find(c => c.id === customerId);
  const customerProducts = data.products.filter(p => p.customerId === customerId);
  const customerRecs = data.recommendations.filter(r => r.customerId === customerId);

  // Auto-select or create summary
  useEffect(() => {
    if (!loading && summaries.length > 0 && !activeSummaryId) {
      const latest = summaries[0];
      setActiveSummaryId(latest.id);
      setGeneralNotes(latest.generalNotes || '');
    }
  }, [loading, summaries, activeSummaryId]);

  const activeSummary = summaries.find(s => s.id === activeSummaryId);
  const summaryItems = items.filter(i => i.executionSummaryId === activeSummaryId);

  const handleCreate = async () => {
    if (!customerId) return;
    try {
      const newSummary = await createSummary(customerId);
      setActiveSummaryId(newSummary.id);
      setGeneralNotes('');
      toast.success('סיכום ביצועים חדש נוצר');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה ביצירת הסיכום');
    }
  };

  const handleSave = async () => {
    if (!activeSummaryId || !customerId) return;
    setSaving(true);
    try {
      await updateSummary(activeSummaryId, { generalNotes, status: 'in_progress' });
      toast.success('הסיכום נשמר בהצלחה');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשמירה');
    }
    setSaving(false);
  };

  const handleComplete = async () => {
    if (!activeSummaryId || !customerId) return;
    setSaving(true);
    try {
      await updateSummary(activeSummaryId, { generalNotes });
      await completeSummary(activeSummaryId, customerId);
      toast.success('סיכום הביצועים הושלם');
    } catch (err: any) {
      toast.error(err.message || 'שגיאה');
    }
    setSaving(false);
  };

  const getShareUrl = async (): Promise<string | null> => {
    if (!activeSummaryId || !activeSummary) return null;
    const { data: row } = await supabase
      .from('execution_summaries')
      .select('link_token')
      .eq('id', activeSummaryId)
      .single();
    if (!row?.link_token) { toast.error('שגיאה ביצירת הלינק'); return null; }
    if (activeSummary.status === 'draft') {
      await updateSummary(activeSummaryId, { status: 'in_progress', generalNotes });
    }
    return `${window.location.origin}/execution-portal/${row.link_token}`;
  };

  const handleShareLink = async () => {
    const url = await getShareUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success('הלינק הועתק ללוח! שלח אותו ללקוח');
  };

  const handleShareWhatsApp = async () => {
    const url = await getShareUrl();
    if (!url) return;
    const text = `שלום ${customer?.fullName || ''}, סיכום הביצועים שלך מוכן לצפייה:\n${url}`;
    const phone = customer?.mobilePhone?.replace(/\D/g, '').replace(/^0/, '972') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleToggleAsRecommended = async (itemId: string, currentSnapshot: string | undefined) => {
    const currentItem = summaryItems.find(i => i.id === itemId);
    if (!currentItem) return;
    const newVal = !currentItem.executedAsRecommended;
    await updateItem(itemId, {
      executedAsRecommended: newVal,
      actualExecutionText: newVal ? (currentSnapshot || '') : currentItem.actualExecutionText,
      executionStatus: newVal ? 'fully_executed' : currentItem.executionStatus,
      executedAt: newVal ? new Date().toISOString().split('T')[0] : currentItem.executedAt,
    });
  };

  const handleExportPdf = () => {
    if (!customer || !activeSummary) return;
    const doc = generateExecutionSummaryPdf({
      customerName: customer.fullName,
      customerId: customer.idNumber,
      summaryNumber: activeSummary.summaryNumber,
      status: SUMMARY_STATUS_LABELS[activeSummary.status as ExecutionSummaryStatus] || activeSummary.status,
      generalNotes: generalNotes || activeSummary.generalNotes || '',
      date: new Date(activeSummary.createdAt).toLocaleDateString('he-IL'),
      items: summaryItems.map(si => {
        const rec = customerRecs.find(r => r.id === si.recommendationId);
        const prod = customerProducts.find(p => p.id === si.productId);
        return {
          title: rec?.title || '',
          company: prod?.company || '',
          productType: prod?.productType || '',
          recommendedText: si.recommendedTextSnapshot || '',
          actualText: si.actualExecutionText || '',
          status: ITEM_STATUS_LABELS[si.executionStatus as ItemExecutionStatus] || si.executionStatus,
          executedAt: si.executedAt || '',
          executedBy: si.executedBy || '',
          notes: si.executionNotes || '',
        };
      }),
    });
    const fileName = `execution_summary_${customer.fullName.replace(/\s+/g, '_')}_${activeSummary.summaryNumber}.pdf`;
    doc.save(fileName);
    toast.success('PDF הופק בהצלחה');
  };

  if (!customer) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-muted-foreground">לקוח לא נמצא</p>
        <Button variant="ghost" onClick={() => navigate('/app/customers')}>חזרה</Button>
      </div>
    );
  }

  const relevantRecs = customerRecs.filter(r => ['מאשר', 'עבר לביצוע', 'בוצע'].includes(r.decisionStatus));
  const canCreate = relevantRecs.length > 0;

  const completedCount = summaryItems.filter(i => i.executionStatus === 'fully_executed').length;
  const partialCount = summaryItems.filter(i => i.executionStatus === 'partially_executed').length;
  const totalItems = summaryItems.length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button onClick={() => navigate('/')} className="hover:text-[#0a3d3d] transition-colors">ראשי</button>
        <span className="text-muted-foreground/50">‹</span>
        <button onClick={() => navigate('/app/customers')} className="hover:text-[#0a3d3d] transition-colors">לקוחות</button>
        <span className="text-muted-foreground/50">‹</span>
        <button onClick={() => navigate(`/app/customers/${customerId}`)} className="hover:text-[#0a3d3d] transition-colors">{customer.fullName}</button>
        <span className="text-muted-foreground/50">‹</span>
        <span className="text-foreground font-medium">סיכום ביצועים</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/customers/${customerId}`)} className="hover:bg-[#5ec6c6]/10">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-[#0a3d3d]">סיכום ביצועים</h1>
              {activeSummary && (
                <span className="text-xs px-2 py-1 rounded-full bg-muted font-medium">
                  #{activeSummary.summaryNumber} · {SUMMARY_STATUS_LABELS[activeSummary.status as ExecutionSummaryStatus] || activeSummary.status}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{customer.fullName} · ת.ז {customer.idNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeSummary && (
            <>
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-1.5 text-[#90be6d] border-[#90be6d]/30 hover:bg-[#90be6d]/5 rounded-full">
                <MessageCircle className="h-3.5 w-3.5" />WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareLink} className="gap-1.5 rounded-full border-[#5ec6c6]/30 hover:bg-[#5ec6c6]/10">
                <Share2 className="h-3.5 w-3.5 text-[#5ec6c6]" />העתק לינק
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5 rounded-full">
                <Download className="h-3.5 w-3.5" />PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPresentation(true)} className="gap-1.5 rounded-full border-[#f4a261]/30 hover:bg-[#f4a261]/10">
                <Presentation className="h-3.5 w-3.5 text-[#f4a261]" />מצגת
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 rounded-full">
                <Save className="h-3.5 w-3.5" />שמירה
              </Button>
            </>
          )}
          {canCreate && (
            <Button size="sm" onClick={handleCreate} className="gap-1.5 rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15">
              <ClipboardCheck className="h-3.5 w-3.5" />סיכום חדש
            </Button>
          )}
        </div>
      </motion.div>

      {/* Summary selector if multiple */}
      {summaries.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">גרסאות:</span>
          {summaries.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSummaryId(s.id); setGeneralNotes(s.generalNotes || ''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                s.id === activeSummaryId ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              #{s.summaryNumber} — {SUMMARY_STATUS_LABELS[s.status as ExecutionSummaryStatus] || s.status}
            </button>
          ))}
        </div>
      )}

      {/* No summary yet */}
      {!activeSummary && !loading && (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold">אין סיכום ביצועים עדיין</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {canCreate
                ? `ישנן ${relevantRecs.length} המלצות מאושרות/בביצוע. צור סיכום ביצועים כדי לתעד מה בוצע בפועל.`
                : 'אין המלצות מאושרות ללקוח זה. יש לאשר המלצות לפני יצירת סיכום.'}
            </p>
            {canCreate && (
              <Button onClick={handleCreate} className="gap-1.5">
                <ClipboardCheck className="h-4 w-4" />צור סיכום ביצועים
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active summary */}
      {activeSummary && (
        <div className="space-y-5">
          {/* Status bar */}
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">תאריך יצירה</p>
                  <p className="font-medium">{new Date(activeSummary.createdAt).toLocaleDateString('he-IL')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">סטטוס</p>
                  <p className="font-medium text-[#0a3d3d]">{SUMMARY_STATUS_LABELS[activeSummary.status as ExecutionSummaryStatus]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">בוצע מלא</p>
                  <p className="font-semibold text-[#90be6d]">{completedCount}/{totalItems}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">בוצע חלקית</p>
                  <p className="font-medium text-[#f4a261]">{partialCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">לא בוצע</p>
                  <p className="font-medium text-[#e76f51]">{totalItems - completedCount - partialCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              פירוט ביצועים ({totalItems} המלצות)
            </h3>

            {summaryItems.map((si, idx) => {
              const rec = customerRecs.find(r => r.id === si.recommendationId);
              const prod = customerProducts.find(p => p.id === si.productId);

              return (
                <motion.div key={si.id} variants={item} initial="hidden" animate="show" transition={{ delay: idx * 0.05 }}>
                  <Card className={`transition-all rounded-2xl border-border/50 shadow-sm ${si.executionStatus === 'fully_executed' ? 'border-[#90be6d]/30 bg-[#90be6d]/5' : si.executionStatus === 'partially_executed' ? 'border-[#f4a261]/30 bg-[#f4a261]/5' : ''}`}>
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{rec?.title || 'המלצה'}</span>
                            {rec && <StatusBadge type="action" status={rec.actionType} />}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              si.executionStatus === 'fully_executed' ? 'bg-[#90be6d]/10 text-[#90be6d]' :
                              si.executionStatus === 'partially_executed' ? 'bg-[#f4a261]/10 text-[#f4a261]' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {ITEM_STATUS_LABELS[si.executionStatus as ItemExecutionStatus]}
                            </span>
                          </div>
                          {prod && (
                            <p className="text-xs text-muted-foreground mt-1">{prod.company} · {prod.productType} · {prod.category}</p>
                          )}
                        </div>
                      </div>

                      {/* What was recommended */}
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />מה הומלץ
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{si.recommendedTextSnapshot || '—'}</p>
                      </div>

                      {/* Toggle: executed as recommended */}
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                        <Switch
                          checked={si.executedAsRecommended}
                          onCheckedChange={() => handleToggleAsRecommended(si.id, si.recommendedTextSnapshot)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">בוצע בדיוק כמו ההמלצה</p>
                          <p className="text-xs text-muted-foreground">לחיצה תעתיק אוטומטית את תוכן ההמלצה ותסמן כ"בוצע מלא"</p>
                        </div>
                        {si.executedAsRecommended && <CheckCircle2 className="h-5 w-5 text-success" />}
                      </div>

                      {/* What was actually executed */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">מה בוצע בפועל</label>
                        <Textarea
                          value={si.actualExecutionText || ''}
                          onChange={e => updateItem(si.id, { actualExecutionText: e.target.value, executedAsRecommended: false })}
                          placeholder="תאר את מה שבוצע בפועל..."
                          className="min-h-[80px] text-sm"
                        />
                      </div>

                      {/* Status, date, executor, notes */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">סטטוס ביצוע</label>
                          <Select
                            value={si.executionStatus}
                            onValueChange={(v) => updateItem(si.id, { executionStatus: v as ItemExecutionStatus })}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_executed">לא בוצע</SelectItem>
                              <SelectItem value="partially_executed">בוצע חלקית</SelectItem>
                              <SelectItem value="fully_executed">בוצע מלא</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">תאריך ביצוע</label>
                          <Input
                            type="date"
                            value={si.executedAt || ''}
                            onChange={e => updateItem(si.id, { executedAt: e.target.value })}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">מבצע</label>
                          <Input
                            value={si.executedBy || ''}
                            onChange={e => updateItem(si.id, { executedBy: e.target.value })}
                            placeholder="שם המבצע"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">הערות</label>
                          <Input
                            value={si.executionNotes || ''}
                            onChange={e => updateItem(si.id, { executionNotes: e.target.value })}
                            placeholder="הערה..."
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* General notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">הערות מסכמות</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
                placeholder="סיכום כללי ללקוח, הערות מסכמות..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-2 pb-6">
            <Button variant="outline" onClick={() => navigate(`/app/customers/${customerId}`)} className="rounded-full">
              <ArrowRight className="h-4 w-4 ml-1.5" />חזרה לכרטיס לקוח
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5 rounded-full">
                <Save className="h-4 w-4" />שמירה
              </Button>
              <Button variant="outline" onClick={handleExportPdf} className="gap-1.5 rounded-full">
                <Download className="h-4 w-4" />שמירה + PDF
              </Button>
              <Button onClick={handleComplete} disabled={saving} className="gap-1.5 rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15">
                <CheckCircle2 className="h-4 w-4" />סיום וסימון לקוח
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Viewer */}
      {customer && (
        <PresentationViewer
          open={showPresentation}
          onClose={() => setShowPresentation(false)}
          title={`סיכום ביצועים — ${customer.fullName}`}
          agencyBranding={agency ? { name: agency.name, logoUrl: agency.logoUrl, primaryColor: agency.primaryColor, accentColor: agency.accentColor } : undefined}
          slides={buildExecutionPresentation({
            customer,
            items: summaryItems.map(si => {
              const rec = customerRecs.find(r => r.id === si.recommendationId);
              return {
                id: si.id,
                title: rec?.title || 'המלצה',
                status: si.executionStatus === 'fully_executed' ? 'executed' : si.executionStatus === 'partially_executed' ? 'partial' : 'open',
                executedAsRecommended: si.executedAsRecommended,
                actualText: si.actualExecutionText || undefined,
                notes: si.executionNotes || undefined,
              };
            }),
            agencyName: agency?.name,
          })}
        />
      )}
    </div>
  );
}
