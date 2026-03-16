import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Search, FileText, Copy, Eye, MoreHorizontal,
  Send, Zap, Library, Presentation,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PresentationViewer } from '@/components/slides/SlideEngine';
import { buildBankPresentation } from '@/components/slides/SlideTemplates';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type QueueFilter = 'all' | 'drafts' | 'sent' | 'opened' | 'waiting' | 'thinking' | 'approved' | 'executed' | 'closed';

const queueFilters: { key: QueueFilter; label: string; }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'drafts', label: 'טיוטות' },
  { key: 'sent', label: 'נשלחו' },
  { key: 'waiting', label: 'ממתינות' },
  { key: 'thinking', label: 'רוצה לחשוב' },
  { key: 'approved', label: 'מאושרות' },
  { key: 'executed', label: 'בוצעו' },
  { key: 'closed', label: 'סגורות' },
];

function getDecisionBadge(status: string) {
  switch (status) {
    case 'טיוטה': return <Badge variant="outline" className="text-xs rounded-full">טיוטה</Badge>;
    case 'נשלח': return <Badge className="text-xs bg-[#5ec6c6]/10 text-[#5ec6c6] border-[#5ec6c6]/20 rounded-full">נשלח</Badge>;
    case 'נצפה': return <Badge className="text-xs bg-[#5ec6c6]/10 text-[#5ec6c6] border-[#5ec6c6]/20 rounded-full">נצפה</Badge>;
    case 'מאשר': return <Badge className="text-xs bg-[#90be6d]/10 text-[#90be6d] border-[#90be6d]/20 rounded-full">מאשר</Badge>;
    case 'רוצה לחשוב': return <Badge className="text-xs bg-[#f4a261]/10 text-[#f4a261] border-[#f4a261]/20 rounded-full">לחשוב</Badge>;
    case 'לא מעוניין': return <Badge className="text-xs bg-[#e76f51]/10 text-[#e76f51] border-[#e76f51]/20 rounded-full">לא מעוניין</Badge>;
    case 'עבר לביצוע': return <Badge className="text-xs bg-[#0a3d3d]/10 text-[#0a3d3d] border-[#0a3d3d]/20 rounded-full">בביצוע</Badge>;
    case 'בוצע': return <Badge className="text-xs bg-[#90be6d]/10 text-[#90be6d] border-[#90be6d]/20 rounded-full">בוצע</Badge>;
    default: return <Badge variant="outline" className="text-xs rounded-full">{status}</Badge>;
  }
}

export default function RecommendationBankPage() {
  const navigate = useNavigate();
  const { data, updateRecommendation, agency } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<QueueFilter>('all');
  const [sortBy, setSortBy] = useState<'date' | 'customer'>('date');
  const [showPresentation, setShowPresentation] = useState(false);

  const enrichedRecs = useMemo(() => {
    return data.recommendations.map(rec => {
      const customer = data.customers.find(c => c.id === rec.customerId);
      const product = data.products.find(p => p.id === rec.linkedProductId);
      return { ...rec, customer, product };
    });
  }, [data]);

  const filtered = useMemo(() => {
    let result = enrichedRecs;
    switch (queue) {
      case 'drafts': result = result.filter(r => r.decisionStatus === 'טיוטה'); break;
      case 'sent': result = result.filter(r => ['נשלח', 'נצפה'].includes(r.decisionStatus)); break;
      case 'waiting': result = result.filter(r => ['נשלח', 'נצפה', 'רוצה לחשוב'].includes(r.decisionStatus)); break;
      case 'thinking': result = result.filter(r => r.decisionStatus === 'רוצה לחשוב'); break;
      case 'approved': result = result.filter(r => ['מאשר', 'עבר לביצוע'].includes(r.decisionStatus)); break;
      case 'executed': result = result.filter(r => r.decisionStatus === 'בוצע'); break;
      case 'closed': result = result.filter(r => r.decisionStatus === 'לא מעוניין'); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.customer?.fullName.toLowerCase().includes(q) ||
        r.customer?.idNumber.includes(q) ||
        r.product?.company?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'customer') {
      result.sort((a, b) => (a.customer?.fullName || '').localeCompare(b.customer?.fullName || ''));
    } else {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return result;
  }, [enrichedRecs, queue, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: data.recommendations.length,
    drafts: data.recommendations.filter(r => r.decisionStatus === 'טיוטה').length,
    sent: data.recommendations.filter(r => ['נשלח', 'נצפה'].includes(r.decisionStatus)).length,
    approved: data.recommendations.filter(r => ['מאשר', 'עבר לביצוע'].includes(r.decisionStatus)).length,
    thinking: data.recommendations.filter(r => r.decisionStatus === 'רוצה לחשוב').length,
    executed: data.recommendations.filter(r => r.decisionStatus === 'בוצע').length,
    rejected: data.recommendations.filter(r => r.decisionStatus === 'לא מעוניין').length,
  }), [data.recommendations]);

  const [portalTokens, setPortalTokens] = useState<Record<string, string>>({});

  // Fetch portal tokens for all customers that have summaries
  useEffect(() => {
    const customerIds = [...new Set(data.recommendations.map(r => r.customerId))];
    if (customerIds.length === 0) return;
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase
        .from('recommendation_summaries')
        .select('customer_id, link_token')
        .in('customer_id', customerIds)
        .eq('is_current', true)
        .then(({ data: summaries }) => {
          const tokens: Record<string, string> = {};
          summaries?.forEach(s => { if (s.link_token) tokens[s.customer_id] = s.link_token; });
          setPortalTokens(tokens);
        });
    });
  }, [data.recommendations]);

  const handleCopyLink = async (customerId: string) => {
    const token = portalTokens[customerId];
    if (!token) {
      toast.error('אין לינק פורטל — צור סיכום המלצות תחילה');
      return;
    }
    const link = `${window.location.origin}/portal/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success('הלינק הועתק');
  };

  const handleStatusChange = async (recId: string, newStatus: string) => {
    try {
      await updateRecommendation(recId, { decisionStatus: newStatus as any });
      toast.success('סטטוס עודכן');
    } catch { toast.error('שגיאה'); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="בנק המלצות"
        subtitle="ניהול כל ההמלצות במקום אחד"
        icon={<Library className="h-5 w-5" />}
        breadcrumbs={[{ label: 'דשבורד', path: '/dashboard' }, { label: 'בנק המלצות' }]}
        actions={
          <div className="flex gap-2">
            {filtered.length > 0 && (
              <Button variant="outline" onClick={() => setShowPresentation(true)} className="gap-2 rounded-full border-[#f4a261]/30 hover:bg-[#f4a261]/10">
                <Presentation className="h-4 w-4 text-[#f4a261]" />מצגת
              </Button>
            )}
            <Button onClick={() => navigate('/app/recommendations/new')} className="gap-2 rounded-full bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15">
              <FileText className="h-4 w-4" />המלצה חדשה
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-3 md:grid-cols-7 gap-2"
      >
        {[
          { label: 'סה"כ', value: stats.total, color: 'text-[#0a3d3d]' },
          { label: 'טיוטות', value: stats.drafts, color: 'text-muted-foreground' },
          { label: 'נשלחו', value: stats.sent, color: 'text-[#5ec6c6]' },
          { label: 'ממתינות', value: stats.thinking, color: 'text-[#f4a261]' },
          { label: 'מאושרות', value: stats.approved, color: 'text-[#90be6d]' },
          { label: 'בוצעו', value: stats.executed, color: 'text-[#0a3d3d]' },
          { label: 'נדחו', value: stats.rejected, color: 'text-[#e76f51]' },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="h-4 w-4 absolute right-3 top-3 text-muted-foreground group-focus-within:text-[#0a3d3d]" />
          <Input placeholder="חיפוש לפי שם לקוח, ת.ז, כותרת, חברה..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 rounded-xl border-border/60 focus:border-[#5ec6c6]" />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">לפי תאריך</SelectItem>
            <SelectItem value="customer">לפי לקוח</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue tabs */}
      <Tabs value={queue} onValueChange={v => setQueue(v as QueueFilter)}>
        <TabsList className="flex-wrap h-auto gap-1 bg-[#0a3d3d]/5 p-1 rounded-full">
          {queueFilters.map(f => (
            <TabsTrigger key={f.key} value={f.key} className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white">
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">אין המלצות להצגה בתור הנבחר</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 rounded-2xl border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm truncate">{rec.customer?.fullName || 'לקוח לא ידוע'}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{rec.customer?.idNumber ? `***${rec.customer.idNumber.slice(-4)}` : ''}</span>
                        {getDecisionBadge(rec.decisionStatus)}
                        {rec.executionStatus && (
                          <Badge variant="outline" className="text-xs">{rec.executionStatus}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{rec.title}</p>
                      {rec.product && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rec.product.company} · {rec.product.productType}
                          {rec.product.monthlyPremium ? ` · ₪${rec.product.monthlyPremium}` : ''}
                        </p>
                      )}
                      {rec.customerNote && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">
                          💬 {rec.customerNote}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(rec.updatedAt).toLocaleDateString('he-IL')}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/customers/${rec.customerId}`)}>
                            <Eye className="h-3.5 w-3.5 ml-2" />פתח כרטיס לקוח
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(rec.customerId)}>
                            <Copy className="h-3.5 w-3.5 ml-2" />העתק לינק
                          </DropdownMenuItem>
                          {rec.decisionStatus === 'טיוטה' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(rec.id, 'נשלח')}>
                              <Send className="h-3.5 w-3.5 ml-2" />סמן כנשלח
                            </DropdownMenuItem>
                          )}
                          {['מאשר'].includes(rec.decisionStatus) && (
                            <DropdownMenuItem onClick={() => handleStatusChange(rec.id, 'עבר לביצוע')}>
                              <Zap className="h-3.5 w-3.5 ml-2" />העבר לביצוע
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <PresentationViewer
        slides={showPresentation ? buildBankPresentation({
          recommendations: filtered.map(r => ({
            ...r,
            product: r.product,
            customer: r.customer,
            costBefore: undefined,
            costAfter: undefined,
          })),
          customers: data.customers,
          products: data.products,
          agencyName: agency?.name,
        }) : []}
        open={showPresentation}
        onClose={() => setShowPresentation(false)}
        title="מצגת בנק המלצות"
        agencyBranding={agency ? { name: agency.name, logoUrl: agency.logoUrl, primaryColor: agency.primaryColor, accentColor: agency.accentColor } : undefined}
      />
    </div>
  );
}
