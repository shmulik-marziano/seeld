import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ITEM_STATUS_LABELS, ItemExecutionStatus } from '@/types/execution-summary';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BODY, GREEN, LINE, MUTED } from '@/lib/brand';
import { CaFrame, CaLoadingPage, CaScreen, CaStatus, LOGO_W } from '@/components/sd/client';
import { SdPic } from '@/components/sd/primitives';
import { Link } from 'react-router-dom';

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
  fully_executed: { bg: '#DFE9DC', text: '#203957', border: '#D9DEE4' },
  partially_executed: { bg: '#F5EEE0', text: '#7C5C22', border: '#E5D3B3' },
  not_executed: { bg: '#E8E6DE', text: '#55677C', border: '#D9DEE4' },
};

const LogoLine = () => (
  <img src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={LOGO_W} height={44} style={{ height: 44, width: 'auto' }} decoding="async" draggable={false} />
);

export default function ExecutionSummaryPortalPage() {
  const { token } = useParams<{ token: string }>();
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

  if (state === 'loading') return <CaLoadingPage label="טוענים את הסיכום" tint="sky" art="11-claims-service" />;

  if (state === 'invalid' || state === 'expired') {
    return (
      <CaStatus
        tint="butter" art="11-claims-service" icon="hourglass"
        title="הקישור אינו תקף"
        text="הקישור פג תוקף או אינו קיים. כתבו לנו או התקשרו, ונשלח קישור חדש."
      />
    );
  }

  if (state === 'verify') {
    return (
      <CaScreen tint="sky" art="11-claims-service">
        <span className="sd-eyebrow">סיכום ביצוע</span>
        <h1 className="mt-3">רגע קטן לפני שנכנסים</h1>
        <p>
          {customerName ? `שלום ${customerName}. ` : ''}
          כדי לצפות בסיכום, הזינו את ארבע הספרות האחרונות של תעודת הזהות.
        </p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="exec-id4" className="sd-ca-field-label">
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
            {verifyError && <p id="exec-id4-err" role="alert" className="mt-1.5 text-[14px] text-start" style={{ color: '#9A4520' }}>{verifyError}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={idInput.length < 4}>
            <BrandIcon name="check" size={20} />
            אימות וצפייה
          </button>
        </form>
        <p className="sd-ca-fine">הזיהוי נועד להגן על הפרטים שלכם. הסיכום מוצג רק למי שמכיר את המספר.</p>
      </CaScreen>
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
    <CaFrame tint="sky">
      <header className="sd-ca-portalhead">
        <div className="sd-wrap sd-ca-portalhead-in has-art" style={{ maxWidth: 900 }}>
          <div>
            <Link to="/" aria-label="שילד ביטוח ופיננסים, לדף הבית" className="inline-flex"><LogoLine /></Link>
            <h1>סיכום ביצוע</h1>
            <p>
              {customerName && <span>{customerName} · </span>}
              סיכום מספר <span dir="ltr" className="tabular-nums">{summary?.summary_number}</span>
              {summary?.created_at && (
                <> · <span dir="ltr" className="tabular-nums">{new Date(summary.created_at).toLocaleDateString('he-IL')}</span></>
              )}
            </p>
          </div>
          <div className="sd-ca-portalhead-art" aria-hidden="true"><SdPic name="11-claims-service" sizes="180px" priority /></div>
        </div>
      </header>

      <main className="sd-ca-portalmain">
        {/* What this page is */}
        <section className="sd-ca-panel has-stripe sd-ca-tone-sage">
          <div>
            <div>
              <h2 className="sd-h3 mb-2" style={{ fontSize: 22 }}>מה יש בסיכום הזה</h2>
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
          </div>
        </section>

        {items.length === 0 && (
          <p className="text-[16px]" style={{ color: MUTED }}>עוד אין פעולות מתועדות בסיכום הזה.</p>
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
          <section className="sd-ca-soft sd-ca-tone-butter">
            <h2 className="sd-h3" style={{ fontSize: 20 }}>הערות הצוות שלנו</h2>
            <p className="sd-quote whitespace-pre-wrap">{summary.general_notes}</p>
          </section>
        )}

        <footer className="pt-6 border-t text-[14px] leading-[1.6]" style={{ borderColor: LINE, color: MUTED }}>
          <p>הופק על ידי שילד ביטוח ופיננסים. מצב הביצוע משקף את תיעוד הסוכנות ואינו אישור כיסוי.</p>
          <p className="mt-1">שאלות על אחת הפעולות? אפשר להתקשר 052-309-7444 או לכתוב ל-info@seeld.co.il.</p>
        </footer>
      </main>
    </CaFrame>
  );
}

function SummaryItemCard({ item }: { item: ItemData }) {
  const style = STATUS_STYLE[item.execution_status] || STATUS_STYLE.not_executed;
  const label = ITEM_STATUS_LABELS[item.execution_status as ItemExecutionStatus] || item.execution_status;

  return (
    <li className="sd-ca-panel has-stripe" style={{ ["--stripe" as string]: style.bg }}>
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
