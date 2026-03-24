import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, ArrowLeft, AlertTriangle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { motion } from 'framer-motion';

const executionStatusConfig: Record<string, { color: string; bg: string; borderColor: string; icon: string }> = {
  'חזר ליקוי': { color: 'text-destructive', bg: 'bg-destructive/5', borderColor: 'border-destructive/30', icon: '🔴' },
  'ממתין לנתונים': { color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-900/10', borderColor: 'border-amber-300/30', icon: '🟡' },
  'בטיפול': { color: 'text-blue-600', bg: 'bg-blue-50/50 dark:bg-blue-900/10', borderColor: 'border-blue-300/30', icon: '🔵' },
  'הושלם': { color: 'text-emerald-600', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', borderColor: 'border-emerald-300/30', icon: '🟢' },
};

export default function ExecutionQueuePage() {
  const navigate = useNavigate();
  const { data } = useApp();

  const items = data.recommendations
    .filter(r => (['מאשר', 'עבר לביצוע'].includes(r.decisionStatus) && r.decisionStatus !== 'בוצע') || (r.executionStatus && r.executionStatus !== 'הושלם'))
    .map(r => ({
      ...r,
      customer: data.customers.find(c => c.id === r.customerId),
      product: r.linkedProductId ? data.products.find(p => p.id === r.linkedProductId) : undefined,
    }))
    .sort((a, b) => {
      const priority = (s?: string) => s === 'חזר ליקוי' ? 0 : s === 'ממתין לנתונים' ? 1 : 2;
      return priority(a.executionStatus) - priority(b.executionStatus);
    });

  // Stats
  const defectCount = items.filter(i => i.executionStatus === 'חזר ליקוי').length;
  const waitingCount = items.filter(i => i.executionStatus === 'ממתין לנתונים').length;
  const inProgressCount = items.filter(i => !['חזר ליקוי', 'ממתין לנתונים'].includes(i.executionStatus || '')).length;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="תור ביצוע"
        subtitle={`${items.length} המלצות מאושרות בתהליך ביצוע`}
        icon={<Zap className="h-5 w-5" />}
        breadcrumbs={[{ label: 'דשבורד', path: '/dashboard' }, { label: 'ביצוע' }]}
      />

      {/* Stats summary */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-3 gap-2 md:gap-3 mb-6"
        >
          <div className="rounded-2xl p-3 md:p-4 bg-destructive/5 border border-destructive/10 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-4 w-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive">חזר ליקוי</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{defectCount}</p>
          </div>
          <div className="rounded-2xl p-3 md:p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/20 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">ממתין</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{waitingCount}</p>
          </div>
          <div className="rounded-2xl p-3 md:p-4 bg-[#5ec6c6]/5 border border-[#5ec6c6]/10 transition-all">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-[#0a3d3d]" />
              <span className="text-xs font-semibold text-[#0a3d3d]">בטיפול</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{inProgressCount}</p>
          </div>
        </motion.div>
      )}

      <div className="space-y-2.5">
        {items.map((item, i) => {
          const missing = item.missingForExecution?.split(', ').filter(Boolean) || [];
          const statusConf = item.executionStatus ? executionStatusConfig[item.executionStatus] : null;
          const isDefect = item.executionStatus === 'חזר ליקוי';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card className={`rounded-2xl border-border/50 hover:shadow-lg hover:shadow-[#0a3d3d]/5 transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden ${
                isDefect ? 'border-destructive/30' : ''
              }`}>
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Priority indicator bar */}
                    <div className={`w-1 shrink-0 ${
                      isDefect ? 'bg-destructive' :
                      item.executionStatus === 'ממתין לנתונים' ? 'bg-amber-400' :
                      'bg-[#5ec6c6]'
                    }`} />

                    <div className="flex items-start justify-between flex-1 p-3 md:p-4 gap-3">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <button
                            onClick={() => navigate(`/app/customers/${item.customerId}`)}
                            className="font-bold text-sm hover:text-[#0a3d3d] transition-colors flex items-center gap-1.5"
                          >
                            <div className="w-6 h-6 rounded-lg bg-[#0a3d3d]/8 flex items-center justify-center text-[10px] font-bold text-[#0a3d3d] shrink-0">
                              {item.customer?.firstName?.[0]}
                            </div>
                            {item.customer?.fullName}
                          </button>
                          <span className="text-muted-foreground text-xs hidden sm:inline">·</span>
                          <span className="text-sm text-foreground/80 truncate">{item.title}</span>
                          <StatusBadge type="action" status={item.actionType} />
                          {item.executionStatus && <StatusBadge type="execution" status={item.executionStatus} />}
                        </div>

                        {item.product && (
                          <p className="text-xs text-muted-foreground mb-1.5">
                            <span className="bg-muted/50 rounded-lg px-2 py-0.5 text-[10px] inline-block">
                              {item.product.company} - {item.product.productType}
                            </span>
                          </p>
                        )}

                        {missing.length > 0 && (
                          <div className="flex items-start gap-1.5 mt-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/30">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">חוסרים:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {missing.map((m, idx) => (
                                  <span key={idx} className="text-[10px] bg-amber-100/60 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md px-1.5 py-0.5">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {item.nextStep && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs">
                            <span className="font-medium text-[#0a3d3d]">צעד הבא:</span>
                            <span className="text-foreground/70">{item.nextStep}</span>
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/app/customers/${item.customerId}`)}
                        className="rounded-xl h-9 w-9 p-0 min-h-[36px] hover:bg-[#5ec6c6]/10 shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-[#5ec6c6]/10 flex items-center justify-center mx-auto mb-5">
            <Zap className="h-10 w-10 text-[#5ec6c6]/50" />
          </div>
          <p className="text-foreground/70 font-medium mb-1">אין המלצות בתור ביצוע</p>
          <p className="text-sm text-muted-foreground">המלצות שאושרו על ידי לקוחות יופיעו כאן</p>
        </motion.div>
      )}
    </div>
  );
}
