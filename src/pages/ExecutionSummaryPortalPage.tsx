import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Loader2, FileText, ArrowLeft, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ITEM_STATUS_LABELS, ItemExecutionStatus } from '@/types/execution-summary';

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

  const handleVerify = () => {
    if (idInput === customerId4 || idInput === customerId4.padStart(4, '0')) {
      setState('portal');
    } else {
      setVerifyError('הספרות שהוזנו אינן תואמות. נסה שוב.');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'invalid' || state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full text-center p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">הקישור אינו תקף</h2>
          <p className="text-sm text-muted-foreground">קישור זה פג תוקף או אינו קיים. פנה לסוכן שלך לקבלת קישור חדש.</p>
        </Card>
      </div>
    );
  }

  if (state === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="flex justify-center">
                <SeeIDLogo size={48} />
              </div>
              <h2 className="text-lg font-bold">סיכום ביצועים</h2>
              <p className="text-sm text-muted-foreground">
                שלום {customerName}, כדי לצפות בסיכום הביצועים שלך, הזן את 4 הספרות האחרונות של תעודת הזהות שלך.
              </p>
              <div className="flex gap-2" dir="ltr">
                <Input
                  value={idInput}
                  onChange={e => { setIdInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setVerifyError(''); }}
                  placeholder="XXXX"
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              {verifyError && <p className="text-xs text-destructive">{verifyError}</p>}
              <Button onClick={handleVerify} className="w-full gap-2" disabled={idInput.length < 4}>
                <Lock className="h-4 w-4" />אימות וצפייה
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Portal view
  const executedItems = items.filter(i => i.execution_status === 'fully_executed');
  const partialItems = items.filter(i => i.execution_status === 'partially_executed');
  const pendingItems = items.filter(i => i.execution_status === 'not_executed');

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <SeeIDLogo size={36} />
          <div>
            <h1 className="text-lg font-bold">סיכום ביצועים</h1>
            <p className="text-xs opacity-80">{customerName} · סיכום #{summary?.summary_number}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-xl font-bold text-success">{executedItems.length}</p>
              <p className="text-[10px] text-muted-foreground">בוצע מלא</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 text-warning mx-auto mb-1" />
              <p className="text-xl font-bold text-warning">{partialItems.length}</p>
              <p className="text-[10px] text-muted-foreground">חלקי</p>
            </CardContent>
          </Card>
          <Card className="border-muted">
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xl font-bold">{pendingItems.length}</p>
              <p className="text-[10px] text-muted-foreground">למעקב</p>
            </CardContent>
          </Card>
        </div>

        {/* Executed items */}
        {executedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />מה בוצע
            </h3>
            {executedItems.map(item => (
              <SummaryItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Partial items */}
        {partialItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" />בוצע חלקית
            </h3>
            {partialItems.map(item => (
              <SummaryItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Pending items */}
        {pendingItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />למעקב
            </h3>
            {pendingItems.map(item => (
              <SummaryItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Agent notes */}
        {summary?.general_notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />הערות הסוכן
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{summary.general_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-muted-foreground/50">
          <p>מופק על ידי SEELD · {new Date(summary?.created_at || '').toLocaleDateString('he-IL')}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryItemCard({ item }: { item: ItemData }) {
  const statusColor = item.execution_status === 'fully_executed' ? 'border-success/20' :
    item.execution_status === 'partially_executed' ? 'border-warning/20' : 'border-muted';

  return (
    <Card className={`${statusColor}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium flex-1">
            {item.actual_execution_text || item.recommended_text_snapshot?.split('\n')[0] || 'פעולה'}
          </p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
            item.execution_status === 'fully_executed' ? 'bg-success/10 text-success' :
            item.execution_status === 'partially_executed' ? 'bg-warning/10 text-warning' :
            'bg-muted text-muted-foreground'
          }`}>
            {ITEM_STATUS_LABELS[item.execution_status as ItemExecutionStatus] || item.execution_status}
          </span>
        </div>
        {item.execution_notes && (
          <p className="text-xs text-muted-foreground">{item.execution_notes}</p>
        )}
        {item.executed_at && (
          <p className="text-[10px] text-muted-foreground/60">
            תאריך: {new Date(item.executed_at).toLocaleDateString('he-IL')}
            {item.executed_by && ` · מבצע: ${item.executed_by}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
