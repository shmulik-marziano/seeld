import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2, Clock, XCircle, TrendingUp, Banknote,
  Heart, ChevronDown, ChevronUp, Send, Loader2,
  Star, ListChecks, BarChart3, ArrowLeft,
  Shield, AlertTriangle, FileCheck, Eye, Sparkles,
  Lock, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

// ==================== TYPES ====================
type PortalState =
  | 'loading'
  | 'welcome'
  | 'verify'
  | 'portal'
  | 'submitted'
  | 'already_submitted'
  | 'expired'
  | 'invalid'
  | 'blocked'
  | 'archived'
  | 'new_version';

type DecisionChoice = 'מאשר' | 'רוצה לחשוב' | 'לא מעוניין';

interface RecDecision { status: DecisionChoice | null; note: string; }

interface SummaryRow {
  id: string; customer_id: string; agent_id: string; version: number;
  status: string; is_current: boolean; link_token: string | null;
  link_expires_at: string | null; sent_at: string | null;
  opened_at: string | null; client_submitted_at: string | null;
  archived_at: string | null;
}

interface RecRow {
  id: string; title: string; rationale: string; current_state: string | null;
  improvement: string | null; action_type: string; decision_status: string;
  customer_note: string | null; linked_product_id: string | null;
  urgency: string | null; problem_gap: string | null;
  advantages: string | null; disadvantages: string | null;
  recommended_company: string | null; recommended_track: string | null;
  recommended_investment_track: string | null; recommended_investment_track_custom: string | null;
  recommended_risk_level: string | null;
  cost_before: number | null; cost_after: number | null;
  execution_status: string | null; product_snapshot: any;
  recommendation_type: string | null; based_on: string | null;
}

interface ProductRow {
  id: string; category: string; company: string | null; product_type: string | null;
  policy_number: string | null; monthly_premium: number | null; accumulation: number | null;
  management_fee_deposit: number | null; management_fee_accumulation: number | null;
  return_year: number | null; return_3_years: number | null;
  is_active: boolean | null; phase: string | null; track: string | null;
  sub_description: string | null;
  investment_track: string | null; investment_track_custom: string | null;
  preferred_risk_level: string | null;
  monthly_deposit: number | null;
}

interface CustomerRow {
  id: string; first_name: string; last_name: string; full_name: string | null; id_number: string;
}

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getBlockStatus(token: string): { blocked: boolean; remaining: number } {
  const key = `portal_block_${token}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { blocked: false, remaining: 0 };
  const { until } = JSON.parse(raw);
  const remaining = until - Date.now();
  return { blocked: remaining > 0, remaining: Math.ceil(remaining / 1000) };
}

function getAttempts(token: string): number {
  return parseInt(localStorage.getItem(`portal_attempts_${token}`) || '0', 10);
}

function incrementAttempts(token: string) {
  const count = getAttempts(token) + 1;
  localStorage.setItem(`portal_attempts_${token}`, String(count));
  if (count >= MAX_ATTEMPTS) {
    localStorage.setItem(`portal_block_${token}`, JSON.stringify({ until: Date.now() + BLOCK_DURATION_MS }));
  }
}

function clearAttempts(token: string) {
  localStorage.removeItem(`portal_attempts_${token}`);
  localStorage.removeItem(`portal_block_${token}`);
}

// NumericKeypad removed - using native inputMode="numeric" instead

// ==================== PRODUCT ICON ====================
function ProductIcon({ category }: { category: string }) {
  if (category === 'כסף') return <Banknote className="h-5 w-5 text-[hsl(var(--success))]" />;
  return <Heart className="h-5 w-5 text-destructive" />;
}

// ==================== MAIN COMPONENT ====================
export default function ClientPortalPage() {
  const params = useParams<{ token?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  // Support both /portal/:token and /client/:id(?token=xxx)
  const routeToken = params.token; // from /portal/:token
  const routeId = params.id;       // from /client/:id
  const queryToken = searchParams.get('token');
  const resolvedToken = routeToken || queryToken || routeId || '';
  
  const [state, setState] = useState<PortalState>('loading');
  const [activeTab, setActiveTab] = useState('recommendations');
  const [idInput, setIdInput] = useState('');
  const [idError, setIdError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [recommendations, setRecommendations] = useState<RecRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [decisions, setDecisions] = useState<Record<string, RecDecision>>({});
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // ========== INITIAL TOKEN VALIDATION ==========
  useEffect(() => {
    if (!resolvedToken) { setState('invalid'); return; }

    const blockStatus = getBlockStatus(resolvedToken);
    if (blockStatus.blocked) { setState('blocked'); return; }

    (async () => {
      let summaryData: any = null;

      // First try by link_token (works for /portal/:token and /client/:id?token=xxx)
      const { data: byToken } = await supabase
        .from('recommendation_summaries')
        .select('*')
        .eq('link_token', resolvedToken)
        .maybeSingle();
      
      if (byToken) {
        summaryData = byToken;
      } else if (routeId) {
        // Fallback: routeId might be a customer_id, find current summary
        const { data: byCustomer } = await supabase
          .from('recommendation_summaries')
          .select('*')
          .eq('customer_id', routeId)
          .eq('is_current', true)
          .order('created_at', { ascending: false })
          .maybeSingle();
        summaryData = byCustomer;
      }

      if (!summaryData) { setState('invalid'); return; }

      const s = summaryData as SummaryRow;

      if (s.archived_at) { setState('archived'); return; }
      if (!s.is_current) { setState('new_version'); return; }
      if (s.link_expires_at && new Date(s.link_expires_at) < new Date()) { setState('expired'); return; }
      if (s.client_submitted_at) {
        setSummary(s);
        setState('already_submitted');
        return;
      }

      setSummary(s);
      setState('welcome');
    })();
  }, [resolvedToken, routeId]);

  // ========== ID VERIFICATION ==========
  const handleVerify = useCallback(async () => {
    if (!idInput.trim() || !summary || !resolvedToken) return;
    setVerifyLoading(true);
    setIdError('');

    const blockStatus = getBlockStatus(resolvedToken);
    if (blockStatus.blocked) { setState('blocked'); setVerifyLoading(false); return; }

    const { data: cData } = await supabase
      .from('customers')
      .select('id, first_name, last_name, full_name, id_number')
      .eq('id', summary.customer_id)
      .maybeSingle();

    if (!cData) {
      setIdError('אירעה שגיאה, נסה שוב מאוחר יותר');
      setVerifyLoading(false);
      return;
    }

    // Verify: last 4 digits match
    const customerIdNum = (cData as CustomerRow).id_number;
    const lastFour = customerIdNum.slice(-4);
    const isMatch = idInput.trim() === lastFour || idInput.trim() === customerIdNum;

    if (!isMatch) {
      incrementAttempts(resolvedToken);
      const attempts = getAttempts(resolvedToken);
      if (attempts >= MAX_ATTEMPTS) {
        setState('blocked');
        setVerifyLoading(false);
        return;
      }
      setIdError(`הנתונים שהוזנו אינם תואמים. נותרו ${MAX_ATTEMPTS - attempts} ניסיונות`);
      setVerifyLoading(false);
      return;
    }

    clearAttempts(resolvedToken);
    setCustomer(cData as CustomerRow);

    // Fetch recommendations and products
    const [rRes, pRes] = await Promise.all([
      supabase.from('recommendations').select('*')
        .eq('customer_id', summary.customer_id)
        .eq('summary_id', summary.id)
        .order('sort_order', { ascending: true }),
      supabase.from('products').select('*')
        .eq('customer_id', summary.customer_id),
    ]);

    setRecommendations((rRes.data || []) as RecRow[]);
    setProducts((pRes.data || []) as ProductRow[]);

    // Initialize decisions from existing data
    const initDecisions: Record<string, RecDecision> = {};
    (rRes.data || []).forEach((r: any) => {
      if (['מאשר', 'רוצה לחשוב', 'לא מעוניין'].includes(r.decision_status)) {
        initDecisions[r.id] = { status: r.decision_status as DecisionChoice, note: r.customer_note || '' };
      }
    });
    setDecisions(initDecisions);

    // Mark summary as opened
    await supabase
      .from('recommendation_summaries')
      .update({ opened_at: summary.opened_at || new Date().toISOString() })
      .eq('id', summary.id);

    setVerifyLoading(false);
    setState('portal');
  }, [idInput, summary, resolvedToken]);

  // ========== DECISION ACTIONS ==========
  const setDecision = (recId: string, status: DecisionChoice) => {
    setDecisions(prev => ({ ...prev, [recId]: { status, note: prev[recId]?.note || '' } }));
  };
  const setNote = (recId: string, note: string) => {
    setDecisions(prev => ({ ...prev, [recId]: { ...prev[recId], status: prev[recId]?.status || null, note } }));
  };
  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ========== SUBMIT ALL TO AGENT ==========
  const handleSubmitAll = useCallback(async () => {
    if (!summary) return;
    setSubmitting(true);

    try {
      // Update each recommendation with its decision
      const updates = Object.entries(decisions).filter(([, d]) => d.status);
      for (const [recId, decision] of updates) {
        await supabase.from('recommendations').update({
          decision_status: decision.status!, customer_note: decision.note || null,
        }).eq('id', recId);
      }

      // Mark summary as submitted
      await supabase.from('recommendation_summaries').update({
        client_submitted_at: new Date().toISOString(),
        status: 'client_responded',
      }).eq('id', summary.id);

      setState('submitted');
      toast.success('ההחלטות נשלחו בהצלחה!');
    } catch {
      toast.error('שגיאה בשליחה, נסה שוב');
    } finally {
      setSubmitting(false);
    }
  }, [summary, decisions]);

  // ========== COMPUTED VALUES ==========
  const visibleRecs = useMemo(() =>
    recommendations.filter(r => !['טיוטה'].includes(r.decision_status) || decisions[r.id]),
  [recommendations, decisions]);

  const moneyProducts = useMemo(() => products.filter(p => p.category === 'כסף'), [products]);
  const insuranceProducts = useMemo(() => products.filter(p => p.category === 'ביטוח'), [products]);

  const totalRecs = visibleRecs.length;
  const decidedCount = visibleRecs.filter(r => decisions[r.id]?.status).length;
  const progressPercent = totalRecs > 0 ? Math.round((decidedCount / totalRecs) * 100) : 0;
  const undecidedCount = totalRecs - decidedCount;

  const approvedCount = visibleRecs.filter(r => decisions[r.id]?.status === 'מאשר').length;
  const thinkingCount = visibleRecs.filter(r => decisions[r.id]?.status === 'רוצה לחשוב').length;
  const declinedCount = visibleRecs.filter(r => decisions[r.id]?.status === 'לא מעוניין').length;

  const displayName = customer?.full_name || `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim();
  const totalAccumulation = useMemo(() => products.reduce((s, p) => s + (p.accumulation || 0), 0), [products]);

  const isCompleted = (rec: RecRow) =>
    rec.execution_status === 'הושלם' || rec.decision_status === 'בוצע';

  // ==================== RENDER STATE SCREENS ====================

  // --- LOADING ---
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl"
        style={{ background: 'linear-gradient(165deg, hsl(38,30%,96%) 0%, hsl(35,22%,88%) 100%)' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">טוען...</p>
        </motion.div>
      </div>
    );
  }

  // --- INVALID TOKEN ---
  if (state === 'invalid') {
    return (
      <StatusScreen
        icon={<AlertTriangle className="h-16 w-16 text-destructive" />}
        title="הקישור אינו תקף"
        description="ייתכן שהקישור שגוי או שאינו קיים יותר. פנה לסוכן שלך לקבלת קישור חדש."
      />
    );
  }

  // --- EXPIRED ---
  if (state === 'expired') {
    return (
      <StatusScreen
        icon={<Clock className="h-16 w-16 text-[hsl(var(--accent))]" />}
        title="הקישור פג תוקף"
        description="הקישור שקיבלת כבר אינו בתוקף. פנה לסוכן שלך לקבלת קישור מעודכן."
      />
    );
  }

  // --- ARCHIVED ---
  if (state === 'archived') {
    return (
      <StatusScreen
        icon={<Lock className="h-16 w-16 text-muted-foreground" />}
        title="הסיכום אינו זמין"
        description="סיכום ההמלצות הועבר לארכיון. פנה לסוכן שלך לפרטים נוספים."
      />
    );
  }

  // --- NEW VERSION ---
  if (state === 'new_version') {
    return (
      <StatusScreen
        icon={<RefreshCw className="h-16 w-16 text-[hsl(var(--accent))]" />}
        title="קיימת גרסה חדשה"
        description="הסוכן שלך שלח לך גרסה מעודכנת של ההמלצות. בדוק את ההודעות שלך לקישור החדש."
      />
    );
  }

  // --- BLOCKED ---
  if (state === 'blocked') {
    return (
      <StatusScreen
        icon={<Shield className="h-16 w-16 text-destructive" />}
        title="הגישה נחסמה זמנית"
        description="בוצעו יותר מדי ניסיונות הזדהות שגויים. נסה שוב בעוד 15 דקות, או פנה לסוכן שלך."
      />
    );
  }

  // --- SUBMITTED ---
  if (state === 'submitted') {
    return (
      <StatusScreen
        icon={<CheckCircle2 className="h-20 w-20 text-[hsl(var(--success))]" />}
        title="ההחלטות נשלחו בהצלחה!"
        description={`תודה ${displayName}! הסוכן שלך יקבל את הבחירות ויחזור אליך בהקדם.`}
        showStats
        stats={{ approved: approvedCount, thinking: thinkingCount, declined: declinedCount }}
      />
    );
  }

  // --- ALREADY SUBMITTED ---
  if (state === 'already_submitted') {
    return (
      <StatusScreen
        icon={<FileCheck className="h-16 w-16 text-[hsl(var(--success))]" />}
        title="כבר שלחת את הבחירות שלך"
        description="ההחלטות שלך כבר נשמרו ונשלחו לסוכן. אם ברצונך לעדכן, פנה לסוכן שלך."
      />
    );
  }

  // ==================== WELCOME SCREEN ====================
  if (state === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
        style={{ background: 'linear-gradient(165deg, hsl(38,30%,96%) 0%, hsl(35,22%,88%) 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-[400px] w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <SeeIDLogo size={80} showText showSubtitle />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-extrabold text-foreground leading-tight">
              ריכזנו עבורך את ההמלצות<br />בצורה פשוטה וברורה
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
              כאן תוכל/י לראות את המצב הקיים, את ההמלצות שלנו, ולסמן מה נכון לך.
            </p>
          </div>

          <div className="flex justify-center gap-6">
            {[
              { icon: Eye, label: 'צפייה במוצרים' },
              { icon: Star, label: 'המלצות מקצועיות' },
              { icon: CheckCircle2, label: 'בחירה קלה' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setState('verify')}
            className="w-full h-14 rounded-2xl text-lg font-bold text-primary-foreground flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(28,45%,42%))' }}
          >
            <Sparkles className="h-5 w-5" />
            התחל/י לצפות
          </motion.button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>מאובטח ומוצפן · פרטיותך שמורה</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== VERIFY SCREEN ====================
  if (state === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
        style={{ background: 'linear-gradient(165deg, hsl(38,30%,96%) 0%, hsl(35,22%,88%) 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-[380px] w-full"
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-border/60 bg-card">
            <div className="h-1.5 bg-gradient-to-l from-primary via-[hsl(var(--accent))] to-[hsl(var(--gold))]" />
            <div className="p-6 sm:p-8 space-y-5">
              <div className="text-center space-y-2">
                <SeeIDLogo size={60} showText />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  לצורך שמירה על פרטיותך, הזן את 4 הספרות האחרונות של תעודת הזהות
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="id-verify-input" className="text-sm font-semibold block text-right text-foreground">
                  4 ספרות אחרונות של ת״ז
                </label>
                <input
                  id="id-verify-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={9}
                  autoComplete="off"
                  value={idInput}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setIdInput(v);
                  }}
                  className="w-full h-14 text-center text-2xl font-bold tracking-[0.3em] rounded-2xl border-2 border-border bg-card text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  dir="ltr"
                  placeholder="• • • •"
                />
                <AnimatePresence>
                  {idError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-center font-medium text-destructive"
                    >
                      {idError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleVerify}
                disabled={verifyLoading || idInput.length < 4}
                className="w-full h-12 text-base font-bold rounded-2xl gap-2 transition-all duration-200 flex items-center justify-center text-primary-foreground disabled:opacity-50"
                style={{
                  background: idInput.length >= 4
                    ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(28,45%,42%))'
                    : 'hsl(var(--muted))',
                }}
              >
                {verifyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeft className="h-5 w-5" />}
                כניסה מאובטחת
              </button>

              <p className="text-[11px] text-center leading-relaxed text-muted-foreground">
                הנתונים שלך מוגנים ומוצפנים בהתאם לתקנות הפרטיות.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== MAIN PORTAL ====================
  const urgencyStyle = (u: string | null) => {
    if (u === 'קריטי') return { text: 'דחוף', className: 'bg-destructive/10 text-destructive border-destructive/20' };
    if (u === 'חשוב') return { text: 'חשוב', className: 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/20' };
    return { text: 'רגיל', className: 'bg-muted text-muted-foreground border-border' };
  };

  const renderProductCard = (p: ProductRow) => (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border p-4 transition-all duration-200 hover:shadow-md bg-card"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.category === 'כסף' ? 'bg-[hsl(var(--success))]/10' : 'bg-destructive/10'}`}>
          <ProductIcon category={p.category} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold truncate text-foreground">{p.company}</p>
            <div className={`w-2 h-2 rounded-full shrink-0 ${p.is_active ? 'bg-[hsl(var(--success))]' : 'bg-muted-foreground/40'}`} />
          </div>
          <p className="text-xs mt-0.5 text-muted-foreground">
            {p.product_type}{p.sub_description ? ` · ${p.sub_description}` : ''}
          </p>
          {!p.is_active && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border mt-1 inline-block">
              לא פעיל
            </span>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            {p.category === 'ביטוח' && p.monthly_premium != null && p.monthly_premium > 0 && (
              <span>פרמיה חודשית: <b className="text-foreground">₪{p.monthly_premium.toLocaleString()}</b></span>
            )}
            {p.category !== 'ביטוח' && p.monthly_deposit != null && p.monthly_deposit > 0 && (
              <span>הפקדה חודשית: <b className="text-foreground">₪{p.monthly_deposit.toLocaleString()}</b></span>
            )}
            {p.accumulation != null && p.accumulation > 0 && (
              <span>צבירה: <b className="text-foreground">₪{p.accumulation.toLocaleString()}</b></span>
            )}
            {p.management_fee_deposit != null && <span>ד.נ הפקדה: <b>{p.management_fee_deposit}%</b></span>}
            {p.management_fee_accumulation != null && <span>ד.נ צבירה: <b>{p.management_fee_accumulation}%</b></span>}
            {(() => {
              const trackDisplay = p.investment_track === 'אחר' ? p.investment_track_custom : (p.investment_track || p.track);
              return trackDisplay ? <span>מסלול: <b className="text-foreground">{trackDisplay}</b></span> : null;
            })()}
            {p.preferred_risk_level && (
              <span>סיכון: <b className={`${
                p.preferred_risk_level === 'גבוה' ? 'text-destructive' :
                p.preferred_risk_level === 'בינוני' ? 'text-[hsl(var(--warning))]' :
                'text-[hsl(var(--success))]'
              }`}>{p.preferred_risk_level}</b></span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderRecCard = (rec: RecRow, showDecisionButtons: boolean = true) => {
    const product = products.find(p => p.id === rec.linked_product_id);
    const decision = decisions[rec.id];
    const expanded = expandedCards.has(rec.id);
    const completed = isCompleted(rec);
    const urgency = urgencyStyle(rec.urgency);

    const cardBg = completed
      ? 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20'
      : decision?.status === 'מאשר' ? 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20'
      : decision?.status === 'רוצה לחשוב' ? 'bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20'
      : decision?.status === 'לא מעוניין' ? 'bg-destructive/5 border-destructive/20'
      : 'bg-card border-border';

    return (
      <motion.div
        key={rec.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border overflow-hidden transition-all duration-200 ${cardBg}`}
      >
        {/* Header */}
        <div className="p-4 cursor-pointer" onClick={() => toggleExpanded(rec.id)}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${urgency.className}`}>
                  {urgency.text}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground border border-border">
                  {rec.action_type}
                </span>
                {completed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border border-[hsl(var(--success))]/30">
                    ✓ בוצע
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
              {product && (
                <p className="text-xs mt-0.5 flex items-center gap-1 text-muted-foreground">
                  <ProductIcon category={product.category} />
                  {product.company} · {product.product_type}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {decision?.status && (
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                  decision.status === 'מאשר' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
                  : decision.status === 'רוצה לחשוב' ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]'
                  : 'bg-destructive/20 text-destructive'
                }`}>
                  {decision.status}
                </span>
              )}
              {expanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>

          {!expanded && rec.rationale && (
            <p className="text-xs mt-2 leading-relaxed line-clamp-2 text-muted-foreground">
              {rec.rationale}
            </p>
          )}
        </div>

        {/* Quick decision buttons - visible when collapsed and undecided */}
        {showDecisionButtons && !decision?.status && !completed && !expanded && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={(e) => { e.stopPropagation(); setDecision(rec.id, 'מאשר'); }}
                className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20 hover:bg-[hsl(var(--success))]/20">
                <CheckCircle2 className="h-4 w-4" />מעוניין
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDecision(rec.id, 'רוצה לחשוב'); }}
                className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20 hover:bg-[hsl(var(--warning))]/20">
                <Clock className="h-4 w-4" />לחשוב
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDecision(rec.id, 'לא מעוניין'); }}
                className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                <XCircle className="h-4 w-4" />לא
              </button>
            </div>
          </div>
        )}

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Current state */}
                {rec.current_state && (
                  <div className="rounded-xl p-3 bg-muted/50 border border-border">
                    <h4 className="text-[11px] font-bold mb-1 text-muted-foreground">מצב קיים</h4>
                    <p className="text-sm text-foreground">{rec.current_state}</p>
                  </div>
                )}

                {/* Agent Recommendation */}
                {rec.problem_gap && (
                  <div className="rounded-xl p-3 bg-primary/5 border border-primary/10">
                    <h4 className="text-[11px] font-bold mb-1 text-primary">המלצת סוכן</h4>
                    <p className="text-sm text-foreground">{rec.problem_gap}</p>
                  </div>
                )}

                {/* Rationale */}
                <p className="text-sm leading-relaxed text-foreground">{rec.rationale}</p>

                {/* Improvement */}
                {rec.improvement && (
                  <div className="rounded-xl p-3 bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/15">
                    <h4 className="text-[11px] font-bold mb-1 flex items-center gap-1 text-[hsl(var(--success))]">
                      <TrendingUp className="h-3.5 w-3.5" />מה משתפר
                    </h4>
                    <p className="text-sm text-foreground">{rec.improvement}</p>
                  </div>
                )}

                {/* Advantages / Disadvantages */}
                {rec.advantages && (
                  <div className="rounded-xl p-3 bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/15">
                    <h4 className="text-[11px] font-bold mb-1 text-[hsl(var(--success))]">יתרונות</h4>
                    <p className="text-sm text-foreground">{rec.advantages}</p>
                  </div>
                )}
                {rec.disadvantages && (
                  <div className="rounded-xl p-3 bg-[hsl(var(--warning))]/5 border border-[hsl(var(--warning))]/15">
                    <h4 className="text-[11px] font-bold mb-1 text-[hsl(var(--warning))]">חסרונות / ויתורים</h4>
                    <p className="text-sm text-foreground">{rec.disadvantages}</p>
                  </div>
                )}

                {/* Cost comparison */}
                {(rec.cost_before != null || rec.cost_after != null) && (
                  <div className="flex items-center gap-3 text-sm rounded-xl p-3 bg-muted/50">
                    {rec.cost_before != null && <span className="text-muted-foreground">עלות נוכחית: <b className="text-foreground">₪{rec.cost_before}</b></span>}
                    {rec.cost_before != null && rec.cost_after != null && <span className="text-muted-foreground/50">←</span>}
                    {rec.cost_after != null && <span className="text-[hsl(var(--success))]"><b>₪{rec.cost_after}</b></span>}
                  </div>
                )}

                {/* Recommended company & track */}
                {(rec.recommended_company || rec.recommended_investment_track || rec.recommended_risk_level) && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {rec.recommended_company && (
                      <p>חברה מומלצת: <b className="text-foreground">{rec.recommended_company}</b>
                        {rec.recommended_track && ` · מסלול: ${rec.recommended_track}`}
                      </p>
                    )}
                    {rec.recommended_investment_track && (
                      <p>מסלול השקעה מומלץ: <b className="text-foreground">
                        {rec.recommended_investment_track === 'אחר' ? rec.recommended_investment_track_custom : rec.recommended_investment_track}
                      </b></p>
                    )}
                    {rec.recommended_risk_level && (
                      <p>סיכון מועדף: <b className={`${
                        rec.recommended_risk_level === 'גבוה' ? 'text-destructive' :
                        rec.recommended_risk_level === 'בינוני' ? 'text-[hsl(var(--warning))]' :
                        'text-[hsl(var(--success))]'
                      }`}>{rec.recommended_risk_level}</b></p>
                    )}
                  </div>
                )}

                {/* Decision section */}
                {showDecisionButtons && !completed && (
                  <div className="pt-3 space-y-3 border-t border-border">
                    <p className="text-xs font-bold text-foreground">מה ההחלטה שלך?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { status: 'מאשר' as DecisionChoice, icon: CheckCircle2, label: 'מעוניין', active: 'bg-[hsl(var(--success))] text-white', inactive: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20' },
                        { status: 'רוצה לחשוב' as DecisionChoice, icon: Clock, label: 'לחשוב', active: 'bg-[hsl(var(--accent))] text-white', inactive: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20' },
                        { status: 'לא מעוניין' as DecisionChoice, icon: XCircle, label: 'לא', active: 'bg-destructive text-white', inactive: 'bg-destructive/10 text-destructive border-destructive/20' },
                      ]).map(btn => (
                        <button
                          key={btn.status}
                          onClick={() => setDecision(rec.id, btn.status)}
                          className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                            decision?.status === btn.status ? btn.active : btn.inactive
                          }`}
                        >
                          <btn.icon className="h-4 w-4" />{btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Note field */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="רוצה להוסיף הערה לסוכן? (לא חובה)"
                        value={decision?.note || ''}
                        onChange={e => setNote(rec.id, e.target.value)}
                        className="text-sm min-h-[50px] resize-none rounded-xl border-border bg-card"
                      />
                    </div>
                  </div>
                )}

                {/* Customer note if already set */}
                {decision?.note && decision.note.trim() && (
                  <div className="rounded-xl p-3 bg-muted/50">
                    <p className="text-[11px] mb-0.5 text-muted-foreground">ההערה שלך:</p>
                    <p className="text-sm text-foreground">"{decision.note}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ==================== PORTAL MAIN ====================
  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: 'linear-gradient(180deg, hsl(38,30%,96%) 0%, hsl(35,22%,88%) 100%)' }}>
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[hsl(30,15%,18%)] via-[hsl(30,12%,25%)] to-[hsl(30,10%,30%)]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-lg mx-auto px-4 py-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <SeeIDLogo size={36} />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-widest uppercase text-[hsl(var(--accent))]">SEELD</p>
              <h1 className="text-xl font-extrabold text-white">שלום, {customer?.first_name} 👋</h1>
              <p className="text-xs mt-0.5 text-white/50">הנה סקירת המצב וההמלצות שלך</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'מוצרים', value: products.length },
              { label: 'צבירה כוללת', value: `₪${totalAccumulation > 999 ? `${(totalAccumulation / 1000).toFixed(0)}K` : totalAccumulation.toLocaleString()}` },
              { label: 'המלצות', value: totalRecs },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-2.5 text-center bg-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-white/50">{stat.label}</p>
                <p className="text-lg font-extrabold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs - sticky */}
      <div className="max-w-lg mx-auto px-4 -mt-3 relative z-10 sticky top-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-12 rounded-2xl shadow-lg border border-border bg-card">
            <TabsTrigger value="overview" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-secondary">
              <BarChart3 className="h-3.5 w-3.5" />מצב קיים
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-secondary">
              <Star className="h-3.5 w-3.5" />המלצות
              {totalRecs > 0 && (
                <span className="h-4 min-w-4 px-1 text-[10px] leading-none rounded-full flex items-center justify-center font-bold bg-[hsl(var(--accent))] text-white">
                  {totalRecs}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-choices" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-secondary">
              <ListChecks className="h-3.5 w-3.5" />בחירות
              {decidedCount > 0 && (
                <span className="h-4 min-w-4 px-1 text-[10px] leading-none rounded-full flex items-center justify-center font-bold bg-primary text-primary-foreground">
                  {decidedCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-4 space-y-4 pb-12">
            {moneyProducts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2.5 px-1 text-foreground">
                  <Banknote className="h-4 w-4 text-[hsl(var(--success))]" />חיסכון ופיננסים
                  <span className="text-xs font-normal text-muted-foreground">({moneyProducts.length})</span>
                </h3>
                <div className="space-y-2">{moneyProducts.map(renderProductCard)}</div>
              </div>
            )}
            {insuranceProducts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2.5 px-1 text-foreground">
                  <Heart className="h-4 w-4 text-destructive" />ביטוח
                  <span className="text-xs font-normal text-muted-foreground">({insuranceProducts.length})</span>
                </h3>
                <div className="space-y-2">{insuranceProducts.map(renderProductCard)}</div>
              </div>
            )}
            {products.length === 0 && (
              <div className="rounded-2xl p-8 text-center border border-border bg-card">
                <p className="text-sm text-muted-foreground">אין מוצרים להצגה כרגע.</p>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Recommendations */}
          <TabsContent value="recommendations" className="mt-4 space-y-4 pb-12">
            {/* Progress bar */}
            {totalRecs > 0 && (
              <div className="rounded-2xl p-4 border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">התקדמות</span>
                  <span className="text-xs text-muted-foreground">{decidedCount} מתוך {totalRecs}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--success)))' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                {progressPercent === 100 && (
                  <p className="text-xs font-bold mt-2 flex items-center gap-1 text-[hsl(var(--success))]">
                    <CheckCircle2 className="h-4 w-4" />מעולה! סיימת לבחור — לחץ ״שלח לסוכן״
                  </p>
                )}
              </div>
            )}

            {/* Recommendation cards by category */}
            {(() => {
              const moneyRecs = visibleRecs.filter(r => {
                const product = products.find(p => p.id === r.linked_product_id);
                return !product || product.category === 'כסף';
              });
              const insuranceRecs = visibleRecs.filter(r => {
                const product = products.find(p => p.id === r.linked_product_id);
                return product && product.category === 'ביטוח';
              });

              return (
                <>
                  {moneyRecs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-2.5 px-1 text-foreground">
                        <Banknote className="h-4 w-4 text-[hsl(var(--success))]" />חסכונות ופיננסים
                      </h3>
                      <div className="space-y-3">{moneyRecs.map(r => renderRecCard(r, true))}</div>
                    </div>
                  )}
                  {insuranceRecs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-2.5 px-1 text-foreground">
                        <Heart className="h-4 w-4 text-destructive" />ביטוח
                      </h3>
                      <div className="space-y-3">{insuranceRecs.map(r => renderRecCard(r, true))}</div>
                    </div>
                  )}
                </>
              );
            })()}

            {visibleRecs.length === 0 && (
              <div className="rounded-2xl p-8 text-center border border-border bg-card">
                <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">אין המלצות להצגה כרגע.</p>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: My Choices */}
          <TabsContent value="my-choices" className="mt-4 space-y-4 pb-12">
            {decidedCount === 0 ? (
              <div className="rounded-2xl p-8 text-center border border-border bg-card">
                <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">טרם קיבלת החלטות.</p>
                <button onClick={() => setActiveTab('recommendations')}
                  className="mt-3 text-sm font-bold gap-1 inline-flex items-center text-[hsl(var(--accent))]">
                  <Star className="h-3.5 w-3.5" />עבור להמלצות
                </button>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: CheckCircle2, count: approvedCount, label: 'אושרו', cls: 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20 text-[hsl(var(--success))]' },
                    { icon: Clock, count: thinkingCount, label: 'בחשיבה', cls: 'bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]' },
                    { icon: XCircle, count: declinedCount, label: 'נדחו', cls: 'bg-destructive/10 border-destructive/20 text-destructive' },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-2xl p-3 text-center border ${s.cls}`}>
                      <s.icon className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-lg font-extrabold">{s.count}</p>
                      <p className="text-[10px] font-medium opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Choices list */}
                <div className="space-y-2">
                  {visibleRecs.filter(r => decisions[r.id]?.status).map(rec => {
                    const product = products.find(p => p.id === rec.linked_product_id);
                    const decision = decisions[rec.id];
                    const statusCls = decision?.status === 'מאשר'
                      ? 'bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/20'
                      : decision?.status === 'רוצה לחשוב'
                        ? 'bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20'
                        : 'bg-destructive/5 border-destructive/20';
                    const badgeCls = decision?.status === 'מאשר'
                      ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'
                      : decision?.status === 'רוצה לחשוב'
                        ? 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]'
                        : 'bg-destructive/20 text-destructive';
                    return (
                      <div key={rec.id} className={`p-3 rounded-2xl border ${statusCls}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-foreground">{rec.title}</p>
                            {product && <p className="text-xs text-muted-foreground">{product.company} · {product.product_type}</p>}
                            {decision?.note && <p className="text-xs mt-1 text-muted-foreground italic">"{decision.note}"</p>}
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold shrink-0 ${badgeCls}`}>
                            {decision?.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Undecided warning */}
                {undecidedCount > 0 && (
                  <div className="rounded-2xl p-3 border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5">
                    <p className="text-xs text-[hsl(var(--warning))] font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 inline ml-1" />
                      נותרו {undecidedCount} המלצות ללא בחירה — ניתן לשלוח גם ככה
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed bottom CTA - Send to agent */}
      {decidedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-card via-card to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmitAll}
              disabled={submitting}
              className="w-full h-14 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl text-primary-foreground disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(152,42%,25%))' }}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  שלח {decidedCount} החלטות לסוכן
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STATUS SCREEN COMPONENT ====================
function StatusScreen({ icon, title, description, showStats, stats }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  showStats?: boolean;
  stats?: { approved: number; thinking: number; declined: number };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{ background: 'linear-gradient(165deg, hsl(38,30%,96%) 0%, hsl(35,22%,88%) 100%)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[400px] w-full text-center space-y-6"
      >
        <div className="flex justify-center">{icon}</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {showStats && stats && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-2xl p-3 text-center bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--success))]" />
              <p className="text-lg font-extrabold text-[hsl(var(--success))]">{stats.approved}</p>
              <p className="text-[10px] font-medium text-[hsl(var(--success))]/70">אושרו</p>
            </div>
            <div className="rounded-2xl p-3 text-center bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20">
              <Clock className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--warning))]" />
              <p className="text-lg font-extrabold text-[hsl(var(--warning))]">{stats.thinking}</p>
              <p className="text-[10px] font-medium text-[hsl(var(--warning))]/70">בחשיבה</p>
            </div>
            <div className="rounded-2xl p-3 text-center bg-destructive/10 border border-destructive/20">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-extrabold text-destructive">{stats.declined}</p>
              <p className="text-[10px] font-medium text-destructive/70">נדחו</p>
            </div>
          </div>
        )}
        <div className="pt-4 space-y-2 text-center">
          <SeeIDLogo size={40} showText />
          <div className="flex justify-center gap-3 text-[10px] text-muted-foreground/60">
            <a href="/terms" target="_blank" className="hover:text-foreground transition-colors">תנאי שימוש</a>
            <span>·</span>
            <a href="/privacy" target="_blank" className="hover:text-foreground transition-colors">מדיניות פרטיות</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
