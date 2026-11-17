import { CONTACTS, telHref } from "@/lib/contacts";
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
import { CaFrame, CaLoadingPage, CaScreen, LOGO_W } from '@/components/sd/client';
import { SdIcon, SdPic } from '@/components/sd/primitives';
import type { ArtName, Pastel } from '@/components/sd/topics';

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
  execution_status: string | null; product_snapshot: unknown;
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
      let summaryData: unknown = null;

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
    (rRes.data || []).forEach((r) => {
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
    setExpandedCards(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
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
  if (state === 'loading') return <CaLoadingPage label="טוענים את ההמלצות שלכם" tint="sky" art="10-financial-planning" />;

  // --- INVALID TOKEN ---
  if (state === 'invalid') {
    return (
      <StatusScreen
        icon={<AlertTriangle className="h-16 w-16 text-destructive" />}
        title="הקישור אינו תקף"
        description="ייתכן שהקישור שגוי או שאינו קיים יותר. כתבו לנו או התקשרו, ונשלח קישור חדש."
      />
    );
  }

  // --- EXPIRED ---
  if (state === 'expired') {
    return (
      <StatusScreen
        icon={<Clock className="h-16 w-16 text-[hsl(var(--accent))]" />}
        title="הקישור פג תוקף"
        description="הקישור שקיבלת כבר אינו בתוקף. כתבו לנו או התקשרו, ונשלח קישור מעודכן."
      />
    );
  }

  // --- ARCHIVED ---
  if (state === 'archived') {
    return (
      <StatusScreen
        icon={<Lock className="h-16 w-16 text-muted-foreground" />}
        title="הסיכום אינו זמין"
        description="סיכום ההמלצות הועבר לארכיון. כתבו לנו או התקשרו לפרטים נוספים."
      />
    );
  }

  // --- NEW VERSION ---
  if (state === 'new_version') {
    return (
      <StatusScreen
        icon={<RefreshCw className="h-16 w-16 text-[hsl(var(--accent))]" />}
        title="קיימת גרסה חדשה"
        description="שלחנו לכם גרסה מעודכנת של ההמלצות. אפשר לבדוק בהודעות את הקישור החדש."
      />
    );
  }

  // --- BLOCKED ---
  if (state === 'blocked') {
    return (
      <StatusScreen
        icon={<Shield className="h-16 w-16 text-destructive" />}
        title="הגישה נחסמה זמנית"
        description="בוצעו יותר מדי ניסיונות הזדהות שגויים. אפשר לנסות שוב בעוד 15 דקות, או לפנות אלינו."
      />
    );
  }

  // --- SUBMITTED ---
  if (state === 'submitted') {
    return (
      <StatusScreen
        tint="sage" art="02-family-protection"
        icon={<CheckCircle2 className="h-20 w-20 text-[hsl(var(--success))]" />}
        title="ההחלטות נשלחו. תודה."
        description={`תודה ${displayName}. קיבלנו את הבחירות ונחזור אליכם בהקדם.`}
        showStats
        stats={{ approved: approvedCount, thinking: thinkingCount, declined: declinedCount }}
      />
    );
  }

  // --- ALREADY SUBMITTED ---
  if (state === 'already_submitted') {
    return (
      <StatusScreen
        tint="sage" art="02-family-protection"
        icon={<FileCheck className="h-16 w-16 text-[hsl(var(--success))]" />}
        title="כבר שלחתם את הבחירות"
        description="ההחלטות שלכם כבר נשמרו ונשלחו אלינו. אם תרצו לעדכן, כתבו לנו."
      />
    );
  }

  // ==================== WELCOME SCREEN ====================
  if (state === 'welcome') {
    return (
      <CaScreen tint="sky" art="10-financial-planning">
        <span className="sd-eyebrow">ההמלצות שלכם</span>
        <h1 className="mt-3">ריכזנו עבורכם את ההמלצות, בצורה פשוטה וברורה</h1>
        <p>כאן אפשר לראות את המצב הקיים, את ההמלצות שלנו, ולסמן מה נכון לכם. בלי לחץ ובלי למהר.</p>
        <ul className="sd-ca-ticks">
          {[
            { icon: 'search', label: 'צפייה במוצרים הקיימים' },
            { icon: 'checklist', label: 'ההמלצות שלנו, עם ההסבר' },
            { icon: 'handshake', label: 'בחירה קלה, וההחלטה תמיד שלכם' },
          ].map((item) => (
            <li key={item.label}><SdIcon name={item.icon} size={40} /><span>{item.label}</span></li>
          ))}
        </ul>
        <div className="sd-ca-actions">
          <button type="button" onClick={() => setState('verify')} className="sd-btn">התחלה<ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <p className="sd-ca-fine"><Lock className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" /> מאובטח ומוצפן. הפרטיות שלכם שמורה.</p>
      </CaScreen>
    );
  }

  // ==================== VERIFY SCREEN ====================
  if (state === 'verify') {
    return (
      <CaScreen tint="sky" art="01-hero">
        <h1>רגע קטן לפני שנכנסים</h1>
        <p>לשמירה על הפרטיות שלכם, הזינו את 4 הספרות האחרונות של תעודת הזהות.</p>
        <div className="mt-6">
          <label htmlFor="id-verify-input" className="sd-ca-field-label">4 ספרות אחרונות של ת״ז</label>
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
            className="field text-center text-[22px] font-bold tracking-[0.3em]"
            dir="ltr"
            aria-invalid={idError ? 'true' : undefined}
            aria-describedby={idError ? 'id-verify-err' : undefined}
          />
          {idError && <p id="id-verify-err" role="alert" className="mt-2 text-[14px] text-start" style={{ color: '#9A4520' }}>{idError}</p>}
        </div>
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifyLoading || idInput.length < 4}
          className="btn-primary w-full mt-5"
        >
          {verifyLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowLeft className="h-5 w-5" aria-hidden="true" />}
          כניסה מאובטחת
        </button>
        <p className="sd-ca-fine">הנתונים שלכם מוגנים ומוצפנים בהתאם לתקנות הפרטיות.</p>
      </CaScreen>
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
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${urgency.className}`}>
                  {urgency.text}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border">
                  {rec.action_type}
                </span>
                {completed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border border-[hsl(var(--success))]/30">
                    בוצע
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
                    <h4 className="text-[11px] font-bold mb-1 text-primary">המלצה שלנו</h4>
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
                        placeholder="רוצה להוסיף הערה לצוות שלנו? (לא חובה)"
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
    <CaFrame tint="sky" className="pb-28">
      <header className="sd-ca-portalhead">
        <div className="max-w-lg mx-auto px-4 sd-ca-portalhead-in" style={{ display: 'block' }}>
          <img src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={LOGO_W} height={44} style={{ height: 40, width: 'auto' }} decoding="async" />
          <h1>שלום, {customer?.first_name}</h1>
          <p>הנה סקירת המצב וההמלצות שלכם.</p>
          <div className="sd-ca-kpis">
            {[
              { label: 'מוצרים', value: products.length },
              { label: 'צבירה כוללת', value: `₪${totalAccumulation > 999 ? `${(totalAccumulation / 1000).toFixed(0)}K` : totalAccumulation.toLocaleString()}` },
              { label: 'המלצות', value: totalRecs },
            ].map((stat) => (
              <div key={stat.label} className="sd-ca-kpi"><span>{stat.label}</span><b>{stat.value}</b></div>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs - sticky */}
      <div className="max-w-lg mx-auto px-4 -mt-3 relative z-10 sticky top-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-12 rounded-full shadow-lg border border-border bg-card">
            <TabsTrigger value="overview" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-[#203957] data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" />מצב קיים
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-[#203957] data-[state=active]:text-white">
              <Star className="h-3.5 w-3.5" />המלצות
              {totalRecs > 0 && (
                <span className="h-4 min-w-4 px-1 text-[10px] leading-none rounded-full flex items-center justify-center font-bold bg-[hsl(var(--accent))] text-white">
                  {totalRecs}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-choices" className="gap-1.5 text-xs rounded-xl data-[state=active]:shadow-md data-[state=active]:bg-[#203957] data-[state=active]:text-white">
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
              <div className="sd-ca-empty sd-ca-tone-sage">
                <div className="sd-ca-empty-art" aria-hidden="true"><SdPic name="10-financial-planning" sizes="220px" /></div>
                <h3>עוד אין מוצרים להצגה</h3>
                <p>כשנוסיף מוצרים לתיק שלכם, הם יופיעו כאן.</p>
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
                    style={{ background: '#203957' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                {progressPercent === 100 && (
                  <p className="text-xs font-bold mt-2 flex items-center gap-1 text-[hsl(var(--success))]">
                    <CheckCircle2 className="h-4 w-4" />סיימתם לבחור. אפשר ללחוץ ״שלחו לנו״
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
                      <p className="text-lg font-bold">{s.count}</p>
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
              className="w-full h-14 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl text-primary-foreground disabled:opacity-70"
              style={{ background: '#203957' }}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  שלחו לנו {decidedCount} החלטות
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </CaFrame>
  );
}

// ==================== STATUS SCREEN COMPONENT ====================
function StatusScreen({ icon, title, description, showStats, stats, tint = 'butter', art = '11-claims-service' }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  showStats?: boolean;
  stats?: { approved: number; thinking: number; declined: number };
  tint?: Pastel;
  art?: ArtName;
}) {
  return (
    <CaScreen tint={tint} art={art}>
      <span className="sd-ca-badge [&_svg]:!h-7 [&_svg]:!w-7" aria-hidden="true">{icon}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {showStats && stats && (
        <div className="sd-ca-stats">
          <div className="sd-ca-stat sd-ca-tone-sage"><b>{stats.approved}</b><span>אושרו</span></div>
          <div className="sd-ca-stat sd-ca-tone-butter"><b>{stats.thinking}</b><span>בחשיבה</span></div>
          <div className="sd-ca-stat sd-ca-tone-rose"><b>{stats.declined}</b><span>נדחו</span></div>
        </div>
      )}
      <p className="sd-ca-fine">שאלה? <a href={telHref(CONTACTS.general)} dir="ltr">{CONTACTS.general.phone}</a> או <a href="mailto:info@seeld.co.il" dir="ltr">info@seeld.co.il</a></p>
      <p className="sd-ca-fine" style={{ marginTop: 6 }}>
        <a href="/terms" target="_blank" rel="noopener noreferrer">תנאי שימוש</a> · <a href="/privacy" target="_blank" rel="noopener noreferrer">מדיניות פרטיות</a>
      </p>
    </CaScreen>
  );
}
