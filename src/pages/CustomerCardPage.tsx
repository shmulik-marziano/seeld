import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileUploadSection } from '@/components/FileUploadSection';
import { useApp } from '@/contexts/AppContext';
import { useExecutionSummaries } from '@/hooks/useExecutionSummaries';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerModal } from '@/components/modals/CustomerModal';
import { ProductModal } from '@/components/modals/ProductModal';
import { RecommendationModal } from '@/components/modals/RecommendationModal';
import { ProductTable } from '@/components/products/ProductTable';
import { CustomerOverview } from '@/components/customer/CustomerOverview';
import { validateExecutionReadiness } from '@/services/validations';
import { SUMMARY_STATUS_LABELS, ExecutionSummaryStatus } from '@/types/execution-summary';
import {
  ArrowRight, Pencil, Trash2, Link2, Phone, Mail, MapPin, Briefcase, Building2,
  FileText, Plus, Heart, Activity, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Upload,
  ClipboardCheck, Presentation,
} from 'lucide-react';
import { PresentationViewer } from '@/components/slides/SlideEngine';
import { buildRecommendationPresentation } from '@/components/slides/SlideTemplates';
import { toast } from 'sonner';
import { Product, Recommendation, ExecutionStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const EXEC_STEPS: ExecutionStatus[] = ['ממתין לנתונים', 'מוכן להפקה', 'נשלח לחתימה', 'נחתם', 'שוגר', 'הושלם'];

export default function CustomerCardPage() {
  const { data, updateCustomer, deleteCustomer, deleteProduct, updateRecommendation, deleteRecommendation, session, logActivity, agency } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [productModal, setProductModal] = useState<{ open: boolean; product?: Product }>({ open: false });
  const [recModal, setRecModal] = useState<{ open: boolean; rec?: Recommendation; linkedProductId?: string }>({ open: false });
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());

  const { summaries: execSummaries, loading: execLoading } = useExecutionSummaries(id);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);

  const customer = data.customers.find(c => c.id === id);

  // Fetch the current summary token for portal link
  useEffect(() => {
    if (!id) return;
    supabase
      .from('recommendation_summaries')
      .select('link_token')
      .eq('customer_id', id)
      .eq('is_current', true)
      .maybeSingle()
      .then(({ data: summary }) => {
        setPortalToken(summary?.link_token || null);
      });
  }, [id]);

  if (!customer) return <div className="p-6"><p className="text-muted-foreground">לקוח לא נמצא</p><Button variant="ghost" onClick={() => navigate('/')}>חזרה לרשימה</Button></div>;

  const products = data.products.filter(p => p.customerId === id);
  const recs = data.recommendations.filter(r => r.customerId === id);
  const sourceFiles = data.sourceFiles.filter(s => s.customerId === id);
  const activities = data.activityLog.filter(a => a.customerId === id);

  const moneyProducts = products.filter(p => p.category === 'כסף');
  const insuranceProducts = products.filter(p => p.category === 'ביטוח');
  const activeRecs = recs.filter(r => r.decisionStatus !== 'בוצע');
  const execRecs = recs.filter(r => ['מאשר', 'עבר לביצוע'].includes(r.decisionStatus) || (r.executionStatus && r.executionStatus !== 'הושלם'));
  const incompleteProducts = products.filter(p => !p.manuallyCompleted);

  const handleCopyLink = async () => {
    if (!portalToken) {
      toast.error('אין לינק פורטל — צור סיכום המלצות תחילה');
      return;
    }
    // Update summary status to "sent" so the portal can access it via anon RLS
    await supabase
      .from('recommendation_summaries')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('customer_id', customer.id)
      .eq('is_current', true)
      .eq('status', 'draft');
    navigator.clipboard.writeText(`${window.location.origin}/portal/${portalToken}`);
    await logActivity('לינק לקוח הועתק', customer.fullName, 'מידע', { customerId: customer.id });
    toast.success('הלינק הועתק');
  };

  const handleDelete = async () => {
    if (confirm(`למחוק את ${customer.fullName}? הפעולה לא ניתנת לשחזור.`)) {
      await deleteCustomer(customer.id);
      navigate('/');
    }
  };

  const toggleRecExpand = (id: string) => {
    setExpandedRecs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const getExecStepIndex = (status?: ExecutionStatus) => {
    if (!status) return -1;
    if (status === 'חזר ליקוי') return -2;
    return EXEC_STEPS.indexOf(status);
  };

  return (
    <div className="px-3 sm:p-6 max-w-7xl mx-auto animate-fade-in" dir="rtl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-3 overflow-x-auto scrollbar-none">
        <button onClick={() => navigate('/')} className="hover:text-[#0a3d3d] transition-colors flex items-center gap-1 shrink-0 min-h-[44px] sm:min-h-0">
          <span>ראשי</span>
        </button>
        <span className="text-muted-foreground/50 shrink-0">‹</span>
        <button onClick={() => navigate('/app/dashboard')} className="hover:text-[#0a3d3d] transition-colors shrink-0">דשבורד</button>
        <span className="text-muted-foreground/50 shrink-0">‹</span>
        <button onClick={() => navigate('/app/customers')} className="hover:text-[#0a3d3d] transition-colors shrink-0">לקוחות</button>
        <span className="text-muted-foreground/50 shrink-0">‹</span>
        <span className="text-foreground font-medium truncate">{customer.fullName}</span>
      </div>

      {/* Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/customers')} className="min-w-[44px] min-h-[44px] p-0 flex items-center justify-center hover:bg-[#5ec6c6]/10"><ArrowRight className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold truncate text-[#0a3d3d]">{customer.fullName}</h1>
              <StatusBadge type="customer" status={customer.status} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">ת.ז {customer.idNumber} · גיל {customer.age}</p>
          </div>
        </div>
        {/* Action buttons - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 shrink-0 min-h-[40px] text-xs sm:text-sm rounded-full border-[#5ec6c6]/30 hover:bg-[#5ec6c6]/10 hover:border-[#5ec6c6]"><Link2 className="h-3.5 w-3.5 text-[#5ec6c6]" />העתק לינק</Button>
          <Button variant="outline" size="sm" onClick={() => setShowPresentation(true)} className="gap-1.5 shrink-0 min-h-[40px] text-xs sm:text-sm rounded-full border-[#f4a261]/30 hover:bg-[#f4a261]/10 hover:border-[#f4a261]"><Presentation className="h-3.5 w-3.5 text-[#f4a261]" />מצגת</Button>
          <Button variant="outline" size="sm" onClick={() => setCustomerModalOpen(true)} className="gap-1.5 shrink-0 min-h-[40px] text-xs sm:text-sm rounded-full border-[#0a3d3d]/20 hover:bg-[#0a3d3d]/5"><Pencil className="h-3.5 w-3.5" />עריכה</Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="gap-1.5 text-[#e76f51] hover:text-[#e76f51] shrink-0 min-h-[40px] text-xs sm:text-sm rounded-full border-[#e76f51]/30 hover:bg-[#e76f51]/10"><Trash2 className="h-3.5 w-3.5" />מחיקה</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        {/* Horizontally scrollable tabs on mobile */}
        <div className="overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="bg-[#0a3d3d]/5 p-1 inline-flex w-auto min-w-full sm:min-w-0 sm:w-auto rounded-full">
            <TabsTrigger value="overview" className="min-h-[40px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">סקירה</TabsTrigger>
            <TabsTrigger value="products" className="min-h-[40px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">מוצרים ({products.length})</TabsTrigger>
            <TabsTrigger value="recommendations" className="min-h-[40px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">המלצות ({recs.length})</TabsTrigger>
            <TabsTrigger value="execution" className="min-h-[40px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">ביצוע {execRecs.length > 0 && `(${execRecs.length})`}</TabsTrigger>
            <TabsTrigger value="summary" className="min-h-[40px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">סיכום ביצועים {execSummaries.length > 0 && `(${execSummaries.length})`}</TabsTrigger>
            <TabsTrigger value="log" className="min-h-[40px] sm:min-h-0 text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">יומן ({activities.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-3 sm:space-y-4">
          <CustomerOverview
            customer={customer}
            productsCount={products.length}
            activeRecsCount={activeRecs.length}
            execRecsCount={execRecs.length}
            incompleteProductsCount={incompleteProducts.length}
          />

          {/* Source Files */}
          {sourceFiles.length > 0 && (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="px-4 sm:px-6"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><FileText className="h-4 w-4 text-[#0a3d3d]" />קבצי מקור</CardTitle></CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2">
                  {sourceFiles.map(sf => (
                    <div key={sf.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{sf.fileName}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{sf.type} · {new Date(sf.uploadedAt).toLocaleDateString('he-IL')}</p>
                      </div>
                      <StatusBadge type="execution" status={sf.analysisStatus === 'הושלם' ? 'הושלם' : 'ממתין לנתונים'} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <FileUploadSection customerId={customer.id} />

          {customer.nextFollowUp && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="pt-4 sm:pt-5 px-4 sm:px-6 flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">פולו־אפ הבא</p>
                  <p className="font-semibold text-sm">{new Date(customer.nextFollowUp).toLocaleDateString('he-IL')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== PRODUCTS TAB ===== */}
        <TabsContent value="products" className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold">מוצרים</h2>
            <Button size="sm" onClick={() => setProductModal({ open: true })} className="gap-1.5 min-h-[40px] rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15"><Plus className="h-3.5 w-3.5" />מוצר חדש</Button>
          </div>

          <ProductTable
            title={`פנסיה / גמל / השתלמות (${moneyProducts.length})`}
            emoji="💰"
            products={moneyProducts}
            onEdit={p => setProductModal({ open: true, product: p })}
            onDelete={p => { deleteProduct(p.id); toast.success('מוצר נמחק'); }}
            onCreateRec={p => setRecModal({ open: true, linkedProductId: p.id })}
          />

          <ProductTable
            title={`ביטוח (${insuranceProducts.length})`}
            emoji="🛡️"
            products={insuranceProducts}
            onEdit={p => setProductModal({ open: true, product: p })}
            onDelete={p => { deleteProduct(p.id); toast.success('מוצר נמחק'); }}
            onCreateRec={p => setRecModal({ open: true, linkedProductId: p.id })}
          />

          {products.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">אין מוצרים. לחץ "מוצר חדש" להוספה.</p>}
        </TabsContent>

        {/* ===== RECOMMENDATIONS TAB ===== */}
        <TabsContent value="recommendations" className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold">המלצות</h2>
            <Button size="sm" onClick={() => setRecModal({ open: true })} className="gap-1.5 min-h-[40px] rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15"><Plus className="h-3.5 w-3.5" />המלצה חדשה</Button>
          </div>

          <div className="space-y-3">
            {recs.map(r => {
              const linkedProduct = r.linkedProductId ? products.find(p => p.id === r.linkedProductId) : undefined;
              const expanded = expandedRecs.has(r.id);
              return (
                <Card key={r.id} className={`rounded-2xl border-border/50 shadow-sm ${r.decisionStatus === 'בוצע' ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-4 sm:pt-5 px-4 sm:px-6">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-xs sm:text-sm truncate">{r.title}</span>
                        <StatusBadge type="action" status={r.actionType} />
                        <StatusBadge type="decision" status={r.decisionStatus} />
                        {r.requiresQuote && <span className="text-[10px] sm:text-xs bg-info/10 text-info px-2 py-0.5 rounded-full border border-info/20 shrink-0">נדרשת הצעת מחיר</span>}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => toggleRecExpand(r.id)} className="min-w-[40px] min-h-[40px] p-0 flex items-center justify-center">
                          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRecModal({ open: true, rec: r })} className="min-w-[40px] min-h-[40px] p-0 flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { deleteRecommendation(r.id); toast.success('המלצה נמחקה'); }} className="min-w-[40px] min-h-[40px] p-0 flex items-center justify-center"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>

                    {linkedProduct && <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">מוצר: {linkedProduct.company} - {linkedProduct.productType}</p>}
                    {r.currentState && <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">מצב קיים: {r.currentState}</p>}

                    {expanded && (
                      <div className="mt-3 pt-3 border-t space-y-2 text-xs sm:text-sm">
                        <div><span className="font-medium">נימוק:</span> <span className="text-muted-foreground">{r.rationale}</span></div>
                        {r.basedOn && <div><span className="font-medium">מבוסס על:</span> <span className="text-muted-foreground">{r.basedOn}</span></div>}
                        {r.improvement && <div><span className="font-medium">מה משתפר:</span> <span className="text-muted-foreground">{r.improvement}</span></div>}
                        {r.customerNote && <div><span className="font-medium">הערת לקוח:</span> <span className="text-muted-foreground">{r.customerNote}</span></div>}
                        {r.nextStep && <div><span className="font-medium">צעד הבא:</span> <span className="text-muted-foreground">{r.nextStep}</span></div>}
                      </div>
                    )}

                    {['טיוטה', 'נשלח', 'נצפה', 'רוצה לחשוב'].includes(r.decisionStatus) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t flex-wrap">
                        {r.decisionStatus === 'טיוטה' && <Button size="sm" variant="outline" onClick={() => updateRecommendation(r.id, { decisionStatus: 'נשלח' })} className="min-h-[40px] text-xs rounded-full">שלח ללקוח</Button>}
                        <Button size="sm" variant="default" onClick={() => updateRecommendation(r.id, { decisionStatus: 'מאשר' })} className="bg-[#90be6d] hover:bg-[#90be6d]/90 min-h-[40px] text-xs rounded-full text-white">מאשר</Button>
                        <Button size="sm" variant="outline" onClick={() => updateRecommendation(r.id, { decisionStatus: 'רוצה לחשוב' })} className="min-h-[40px] text-xs rounded-full border-[#f4a261]/30 text-[#f4a261] hover:bg-[#f4a261]/10">רוצה לחשוב</Button>
                        <Button size="sm" variant="outline" onClick={() => updateRecommendation(r.id, { decisionStatus: 'לא מעוניין' })} className="text-[#e76f51] min-h-[40px] text-xs rounded-full border-[#e76f51]/30 hover:bg-[#e76f51]/10">לא מעוניין</Button>
                      </div>
                    )}
                    {r.decisionStatus === 'מאשר' && !r.executionStatus && (
                      <div className="flex gap-2 mt-3 pt-3 border-t flex-wrap">
                        <Button size="sm" onClick={() => {
                          const missing = validateExecutionReadiness(customer, r, linkedProduct);
                          updateRecommendation(r.id, {
                            decisionStatus: 'עבר לביצוע',
                            executionStatus: missing.length > 0 ? 'ממתין לנתונים' : 'מוכן להפקה',
                            missingForExecution: missing.length > 0 ? missing.join(', ') : undefined,
                          });
                          toast.success('עבר לביצוע');
                        }} className="min-h-[40px] text-xs rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90">העבר לביצוע</Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/app/execution-summary/${customer.id}`)} className="gap-1 min-h-[40px] text-xs">
                          <ClipboardCheck className="h-3.5 w-3.5" />עבור לסיכום
                        </Button>
                      </div>
                    )}
                    {(r.decisionStatus === 'עבר לביצוע' || r.decisionStatus === 'בוצע') && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/app/execution-summary/${customer.id}`)} className="gap-1 text-xs text-primary min-h-[40px]">
                          <ClipboardCheck className="h-3 w-3" />עבור לסיכום ביצועים
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {recs.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">אין המלצות. לחץ "המלצה חדשה" ליצירה.</p>}
          </div>
        </TabsContent>

        {/* ===== EXECUTION TAB ===== */}
        <TabsContent value="execution" className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-bold">מעקב ביצוע</h2>
          {execRecs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">אין המלצות בביצוע כרגע</p>
          ) : execRecs.map(r => {
            const stepIdx = getExecStepIndex(r.executionStatus);
            const missing = r.missingForExecution?.split(', ').filter(Boolean) || [];
            return (
              <Card key={r.id} className="rounded-2xl border-border/50 shadow-sm">
                <CardContent className="pt-4 sm:pt-5 px-4 sm:px-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0a3d3d]">{r.title}</span>
                      <StatusBadge type="action" status={r.actionType} />
                    </div>
                    {r.executionStatus && <StatusBadge type="execution" status={r.executionStatus} />}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {EXEC_STEPS.map((step, i) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`flex-1 h-2 rounded-full ${i <= stepIdx ? 'bg-[#90be6d]' : 'bg-muted'}`} />
                      </div>
                    ))}
                  </div>
                  {/* Step labels - hidden on very small screens, shown truncated */}
                  <div className="hidden sm:flex justify-between text-[10px] text-muted-foreground">
                    {EXEC_STEPS.map(step => <span key={step}>{step}</span>)}
                  </div>
                  <div className="flex sm:hidden justify-between text-[8px] text-muted-foreground">
                    {EXEC_STEPS.map(step => <span key={step} className="text-center leading-tight max-w-[50px]">{step}</span>)}
                  </div>

                  {r.executionStatus === 'חזר ליקוי' && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-xs sm:text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0" />חזר ליקוי — יש לתקן ולשלוח מחדש
                    </div>
                  )}

                  {missing.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-xs sm:text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">חוסרים:</p>
                        <p className="text-muted-foreground">{missing.join(' · ')}</p>
                      </div>
                    </div>
                  )}

                  {r.nextStep && <p className="text-xs sm:text-sm"><span className="font-medium">צעד הבא:</span> {r.nextStep}</p>}
                  {r.executionNote && <p className="text-xs sm:text-sm text-muted-foreground">{r.executionNote}</p>}

                  {r.executionStatus && r.executionStatus !== 'הושלם' && (
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                      {stepIdx >= 0 && stepIdx < EXEC_STEPS.length - 1 && (
                        <Button size="sm" onClick={() => updateRecommendation(r.id, { executionStatus: EXEC_STEPS[stepIdx + 1] })} className="min-h-[40px] text-xs rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90">
                          קדם ל-{EXEC_STEPS[stepIdx + 1]}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-[#e76f51] min-h-[40px] text-xs rounded-full border-[#e76f51]/30 hover:bg-[#e76f51]/10" onClick={() => updateRecommendation(r.id, { executionStatus: 'חזר ליקוי' })}>
                        חזר ליקוי
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateRecommendation(r.id, { executionStatus: 'הושלם', decisionStatus: 'בוצע' })} className="text-[#90be6d] min-h-[40px] text-xs rounded-full border-[#90be6d]/30 hover:bg-[#90be6d]/10">
                        <CheckCircle2 className="h-3.5 w-3.5 ml-1" />סמן כהושלם
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ===== EXECUTION SUMMARY TAB ===== */}
        <TabsContent value="summary" className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />סיכום ביצועים</h2>
            {recs.some(r => ['מאשר', 'עבר לביצוע', 'בוצע'].includes(r.decisionStatus)) && (
              <Button size="sm" onClick={() => navigate(`/app/execution-summary/${customer.id}`)} className="gap-1.5 min-h-[40px] text-xs sm:text-sm rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15">
                <Plus className="h-3.5 w-3.5" />
                {execSummaries.length > 0 ? 'צפה / ערוך סיכום' : 'צור סיכום ביצועים'}
              </Button>
            )}
          </div>

          {execSummaries.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-xs sm:text-sm px-4">
                  {recs.some(r => ['מאשר', 'עבר לביצוע', 'בוצע'].includes(r.decisionStatus))
                    ? 'לא נוצר סיכום ביצועים עדיין. לחץ "צור סיכום" כדי להתחיל.'
                    : 'אין המלצות מאושרות. יש לאשר המלצות לפני יצירת סיכום.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {execSummaries.map(s => (
                <Card key={s.id} className="cursor-pointer hover:shadow-md transition-all active:scale-[0.99] rounded-2xl border-border/50" onClick={() => navigate(`/app/execution-summary/${customer.id}?summaryId=${s.id}`)}>
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#0a3d3d]/10 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="h-5 w-5 text-[#0a3d3d]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm">סיכום #{s.summaryNumber}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString('he-IL')}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      s.status === 'completed' ? 'bg-[#90be6d]/10 text-[#90be6d]' :
                      s.status === 'partial' ? 'bg-[#f4a261]/10 text-[#f4a261]' :
                      s.status === 'in_progress' ? 'bg-[#5ec6c6]/10 text-[#5ec6c6]' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {SUMMARY_STATUS_LABELS[s.status as ExecutionSummaryStatus] || s.status}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>



        {/* ===== LOG TAB ===== */}
        <TabsContent value="log" className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5" />יומן פעולות</h2>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">אין פעולות</p>
            ) : activities.map(a => (
              <div key={a.id} className="flex items-start gap-2 sm:gap-3 p-3 bg-card rounded-lg border">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.level === 'הצלחה' ? 'bg-[#90be6d]' : a.level === 'אזהרה' ? 'bg-[#f4a261]' : 'bg-[#5ec6c6]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{a.title}</p>
                  {a.detail && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{a.detail}</p>}
                </div>
                <span className="text-[9px] sm:text-xs text-muted-foreground shrink-0">{new Date(a.timestamp).toLocaleDateString('he-IL')} {new Date(a.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CustomerModal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} customer={customer} />
      <ProductModal open={productModal.open} onClose={() => setProductModal({ open: false })} customerId={customer.id} product={productModal.product} />
      <RecommendationModal open={recModal.open} onClose={() => setRecModal({ open: false })} customerId={customer.id} recommendation={recModal.rec} linkedProductId={recModal.linkedProductId} products={products} />

      {/* Presentation Viewer */}
      <PresentationViewer
        open={showPresentation}
        onClose={() => setShowPresentation(false)}
        title={`סקירת לקוח — ${customer.fullName}`}
        agencyBranding={agency ? { name: agency.name, logoUrl: agency.logoUrl, primaryColor: agency.primaryColor, accentColor: agency.accentColor } : undefined}
        slides={buildRecommendationPresentation({
          customer,
          products,
          recommendations: recs.map(r => ({
            ...r,
            product: products.find(p => p.id === r.linkedProductId),
          })) as any,
          agencyName: agency?.name,
        })}
      />
    </div>
  );
}
