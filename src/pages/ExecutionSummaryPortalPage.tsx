import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ITEM_STATUS_LABELS, ItemExecutionStatus } from '@/types/execution-summary';
import { Illustration } from '@/components/brand/Illustration';
import { BrandDots } from '@/components/brand/Elements';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BODY, GREEN, IVORY, LINE, MUTED, SAGE_ON_GREEN } from '@/lib/brand';

type PortalState = 'loading' | 'verify' | 'portal' | 'expired' | 'invalid';

interface SummaryData {
  id: string;
  status: string;
  general_notes: string | null;
  summary_number: number;
  created_at: string;
  customer_id: string;
}

interface ItemData {
  id: string;
  recommended_text_snapshot: string | null;
  actual_execution_text: string | null;
  execution_status: string;
  execution_notes: string | null;
  executed_at: string | null;
  executed_by: string | null;
  executed_as_recommended: boolean;
  recommendation_id: string;
  product_id: string | null;
}

// Execution states, as recorded by the agency. A state describes what was
// carried out; it is not an approval of cover.
const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  fully_executed: { bg: '#E8EDE5', text: '#003D30', border: '#CCD6CC' },
  partially_executed: { bg: '#F5EEE0', text: '#8A6230', border: '#E5D3B3' },
  not_executed: { bg: '#E1E8E1', text: '#476356', border: '#CCD6CC' },
};

const LogoLine = () => (
  <img
    src="/brand/logo.png"
    alt="שילד ביטוח ופיננסים"
    width={118}
    height={51}
    style={{ height: 51, width: 'auto' }}
    decoding="async"
    draggable={false}
  />
);

export default function ExecutionSummaryPortalPage() {
  const { token } = useParams<{ token: string }>();
  const reduced = useReducedMotion();
  const [state, setState] = useState<PortalState>('loading');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [idInput, setIdInput] = useState('');
  const [customerId4, setCustomerId4] = useState('');
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      const { data: row, error } = await supabase
        .from('execution_summaries')
        .select('*')
        .eq('link_token', token)
        .single();
      if (error || !row) { setState('invalid'); return; }
      if (row.status === 'draft') { setState('invalid'); return; }
      setSummary(row as SummaryData);

      // Get customer name
      const { data: cust } = await supabase
        .from('customers')
        .select('full_name, id_number')
        .eq('id', row.customer_id)
        .single();
      if (cust) {
        setCustomerName(cust.full_name || '');
        setCustomerId4(cust.id_number?.slice(-4) || '');
      }

      // Get items
      const { data: itemRows } = await supabase
        .from('execution_summary_items')
        .select('*')
        .eq('execution_summary_id', row.id)
        .order('created_at', { ascending: true });
      setItems((itemRows || []) as ItemData[]);

      setState('verify');
    })();
  }, [token]);

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (idInput === customerId4 || idInput === customerId4.padStart(4, '0')) {
      setState('portal');
    } else {
      setVerifyError('הספרות שהוזנו אינן תואמות. נסו שוב.');
    }
  };

  const fade = reduced ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' as const } };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: IVORY }} aria-busy="true" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: GREEN }} aria-hidden="true" />
        <span className="sr-only">טוען את הסיכום</span>
      </div>
    );
  }

  if (state === 'invalid' || state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" dir="rtl" style={{ backgroundColor: IVORY }}>
        <motion.div {...fade} className="dna-concept !p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-5"><LogoLine /></div>
          <BrandIcon name="close" size={36} className="mx-auto mb-3" style={{ color: '#9A4520' }} />
          <h1 className="text-[22px] mb-2" style={{ color: GREEN }}>הקישור אינו תקף</h1>
          <p className="text-[16px] leading-[1.6]" style={{ color: BODY }}>
            הקישור פג תוקף או אינו קיים. פנו ליועץ לקבלת קישור חדש.
          </p>
        </motion.div>
      </div>
    );
  }

  if (state === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" dir="rtl" style={{ backgroundColor: IVORY }}>
        <motion.div {...fade} className="w-full max-w-md">
          <div className="dna-concept !p-6 sm:!p-8">
            <div className="flex justify-center mb-6"><LogoLine /></div>
            <BrandDots className="mb-3" />
            <h1 className="text-[24px] leading-tight" style={{ color: GREEN }}>סיכום ביצוע</h1>
            <p className="mt-2 text-[16px] leading-[1.6]" style={{ color: BODY }}>
              {customerName ? `שלום ${customerName}. ` : ''}
              כדי לצפות בסיכום, הזינו את ארבע הספרות האחרונות של תעודת הזהות.
            </p>
            <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="exec-id4" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                  ארבע ספרות אחרונות של תעודת הזהות <span aria-hidden="true" style={{ color: '#BD582D' }}>*</span>
                </label>
                <input
                  id="exec-id4"
                  value={idInput}
                  onChange={e => { setIdInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setVerifyError(''); }}
                  className="field text-center text-[22px] font-bold tabular-nums tracking-[0.3em]"
                  maxLength={4}
                  inputMode="numeric"
                  autoComplete="off"
                  dir="ltr"
                  aria-invalid={verifyError ? 'true' : undefined}
                  aria-describedby={verifyError ? 'exec-id4-err' : undefined}
                />
                {verifyError && <p id="exec-id4-err" className="mt-1.5 text-[14px]" style={{ color: '#9A4520' }}>{verifyError}</p>}
              </div>
              <button type="submit" className="btn-primary w-full" disabled={idInput.length < 4}>
                <BrandIcon name="check" size={20} />
                אימות וצפייה
              </button>
            </form>
            <p className="mt-4 text-[14px] leading-[1.6]" style={{ color: MUTED }}>
              הזיהוי נועד להגן על הפרטים שלכם. הסיכום מוצג רק למי שמכיר את המספר.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Portal view
  const executedItems = items.filter(i => i.execution_status === 'fully_executed');
  const partialItems = items.filter(i => i.execution_status === 'partially_executed');
  const pendingItems = items.filter(i => i.execution_status === 'not_executed');

  const groups: { key: string; title: string; items: ItemData[]; icon: 'check' | 'clock' | 'route' }[] = [
    { key: 'done', title: 'מה בוצע', items: executedItems, icon: 'check' },
    { key: 'partial', title: 'בוצע חלקית', items: partialItems, icon: 'clock' },
    { key: 'pending', title: 'במעקב', items: pendingItems, icon: 'route' },
  ];

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      {/* Header band */}
      <header className="dna-navy-band">
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="inline-flex items-center rounded-2xl px-4 py-2.5 self-start" style={{ backgroundColor: IVORY }}>
            <LogoLine />
          </div>
          <div>
            <h1 className="text-[26px] sm:text-[30px] leading-tight" style={{ color: IVORY }}>סיכום ביצוע</h1>
            <p className="mt-1 text-[15px]" style={{ color: SAGE_ON_GREEN }}>
              {customerName && <span>{customerName} · </span>}
              סיכום מספר <span dir="ltr" className="tabular-nums">{summary?.summary_number}</span>
              {summary?.created_at && (
                <> · <span dir="ltr" className="tabular-nums">{new Date(summary.created_at).toLocaleDateString('he-IL')}</span></>
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-8">
        {/* What this page is */}
        <section className="dna-concept">
          <div className="grid gap-6 md:grid-cols-[1fr_220px] items-center">
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: GREEN }}>מה יש בסיכום הזה</h2>
              <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>
                הפעולות שבוצעו בעקבות ההמלצות שסוכמו איתכם, מה בוצע חלקית ומה עדיין במעקב.
                לכל פעולה מופיע מצב הביצוע, תאריך ומי ביצע, כפי שתועדו בסוכנות.
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {groups.map(g => (
                  <div key={g.key} className="rounded-xl p-3 text-center border" style={{ backgroundColor: STATUS_STYLE[g.key === 'done' ? 'fully_executed' : g.key === 'partial' ? 'partially_executed' : 'not_executed'].bg, borderColor: LINE }}>
                    <dd className="text-[22px] font-bold tabular-nums" style={{ color: GREEN }} dir="ltr">{g.items.length}</dd>
                    <dt className="text-[14px]" style={{ color: MUTED }}>{g.title}</dt>
                  </div>
                ))}
              </dl>
            </div>
            <Illustration name="05-clarity-decisions" sizes="220px" className="max-w-[220px] mx-auto" />
          </div>
        </section>

        {items.length === 0 && (
          <p className="text-[16px]" style={{ color: MUTED }}>אין עדיין פעולות מתועדות בסיכום הזה.</p>
        )}

        {groups.filter(g => g.items.length > 0).map(g => (
          <section key={g.key} className="space-y-3">
            <h2 className="text-[20px] flex items-center gap-2" style={{ color: GREEN }}>
              <BrandIcon name={g.icon} size={22} />
              {g.title}
            </h2>
            <ul className="space-y-3">
              {g.items.map(item => <SummaryItemCard key={item.id} item={item} />)}
            </ul>
          </section>
        ))}

        {/* Agent notes */}
        {summary?.general_notes && (
          <section className="dna-quote">
            <p className="dna-ql">הערות היועץ</p>
            <p className="dna-qt whitespace-pre-wrap">{summary.general_notes}</p>
          </section>
        )}

        <footer className="pt-6 border-t text-[14px] leading-[1.6]" style={{ borderColor: LINE, color: MUTED }}>
          <p>הופק על ידי שילד ביטוח ופיננסים. מצב הביצוע משקף את תיעוד הסוכנות ואינו אישור כיסוי.</p>
          <p className="mt-1">שאלות על אחת הפעולות? פנו ליועץ.</p>
        </footer>
      </main>
    </div>
  );
}

function SummaryItemCard({ item }: { item: ItemData }) {
  const style = STATUS_STYLE[item.execution_status] || STATUS_STYLE.not_executed;
  const label = ITEM_STATUS_LABELS[item.execution_status as ItemExecutionStatus] || item.execution_status;

  return (
    <li className="dna-concept">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-[16px] font-bold leading-snug flex-1" style={{ color: GREEN }}>
          {item.actual_execution_text || item.recommended_text_snapshot?.split('\n')[0] || 'פעולה'}
        </p>
        <span
          className="text-[14px] px-3 py-1 rounded-full font-bold shrink-0"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {label}
        </span>
      </div>
      {item.execution_notes && (
        <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: BODY }}>{item.execution_notes}</p>
      )}
      {(item.executed_at || item.executed_by) && (
        <p className="mt-2 text-[14px]" style={{ color: MUTED }}>
          {item.executed_at && (
            <>תאריך: <span dir="ltr" className="tabular-nums">{new Date(item.executed_at).toLocaleDateString('he-IL')}</span></>
          )}
          {item.executed_at && item.executed_by && ' · '}
          {item.executed_by && <>ביצוע: {item.executed_by}</>}
        </p>
      )}
    </li>
  );
}
