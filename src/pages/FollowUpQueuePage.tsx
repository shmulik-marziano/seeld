import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ArrowLeft, Calendar, MessageCircle, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { motion } from 'framer-motion';

const FOLLOW_UP_STATUSES = ['טיוטה', 'נשלח', 'נצפה', 'רוצה לחשוב'];

const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
  'טיוטה': { color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-900/20', icon: '📝' },
  'נשלח': { color: 'text-blue-600', bg: 'bg-blue-50/50 dark:bg-blue-900/10', icon: '📤' },
  'נצפה': { color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-900/10', icon: '👁' },
  'רוצה לחשוב': { color: 'text-purple-600', bg: 'bg-purple-50/50 dark:bg-purple-900/10', icon: '🤔' },
};

export default function FollowUpQueuePage() {
  const navigate = useNavigate();
  const { data, updateRecommendation } = useApp();

  const items = data.recommendations
    .filter(r => FOLLOW_UP_STATUSES.includes(r.decisionStatus))
    .map(r => ({
      ...r,
      customer: data.customers.find(c => c.id === r.customerId),
      product: r.linkedProductId ? data.products.find(p => p.id === r.linkedProductId) : undefined,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const grouped = {
    'טיוטה': items.filter(i => i.decisionStatus === 'טיוטה'),
    'נשלח': items.filter(i => i.decisionStatus === 'נשלח'),
    'נצפה': items.filter(i => i.decisionStatus === 'נצפה'),
    'רוצה לחשוב': items.filter(i => i.decisionStatus === 'רוצה לחשוב'),
  };

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

  const getPriorityColor = (days: number) => {
    if (days >= 14) return 'text-destructive';
    if (days >= 7) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="תור פולו־אפ"
        subtitle={`${items.length} המלצות ממתינות לטיפול`}
        icon={<Clock className="h-5 w-5" />}
        breadcrumbs={[{ label: 'דשבורד', path: '/dashboard' }, { label: 'פולו־אפ' }]}
      />

      {/* Stats summary */}
      {items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-6"
        >
          {Object.entries(grouped).map(([status, group]) => {
            const config = statusConfig[status];
            return (
              <div
                key={status}
                className={`rounded-2xl p-3 md:p-4 ${config.bg} border border-transparent transition-all duration-200`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{config.icon}</span>
                  <span className={`text-xs font-semibold ${config.color}`}>{status}</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{group.length}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      {Object.entries(grouped).map(([status, group]) => group.length > 0 && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{statusConfig[status]?.icon}</span>
            <StatusBadge type="decision" status={status} />
            <span className="text-xs text-muted-foreground font-medium">({group.length})</span>
            <div className="flex-1 h-px bg-border/50 mr-2" />
          </div>
          <div className="space-y-2">
            {group.map((item, i) => {
              const days = daysSince(item.updatedAt);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:shadow-[#0a3d3d]/5 transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Priority indicator bar */}
                        <div className={`w-1 shrink-0 ${
                          days >= 14 ? 'bg-destructive' : days >= 7 ? 'bg-amber-400' : 'bg-[#5ec6c6]'
                        }`} />

                        <div className="flex items-center justify-between flex-1 p-3 md:p-4 gap-3">
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
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              {item.product && (
                                <span className="bg-muted/50 rounded-lg px-2 py-0.5 text-[10px]">
                                  {item.product.company} - {item.product.productType}
                                </span>
                              )}
                              <span className={`flex items-center gap-1 font-medium ${getPriorityColor(days)}`}>
                                <Calendar className="h-3 w-3" />
                                {days} ימים מאז עדכון
                              </span>
                              {item.customerNote && (
                                <span className="flex items-center gap-1 text-warning italic">
                                  <MessageCircle className="h-3 w-3" />
                                  "{item.customerNote}"
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 items-center shrink-0">
                            {item.decisionStatus === 'טיוטה' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRecommendation(item.id, { decisionStatus: 'נשלח' })}
                                className="gap-1.5 rounded-xl text-xs h-9 min-h-[36px] border-[#0a3d3d]/20 text-[#0a3d3d] hover:bg-[#0a3d3d] hover:text-white transition-all duration-200"
                              >
                                <Send className="h-3 w-3" />
                                <span className="hidden sm:inline">שלח</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/app/customers/${item.customerId}`)}
                              className="rounded-xl h-9 w-9 p-0 min-h-[36px] hover:bg-[#5ec6c6]/10"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {items.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-full bg-[#5ec6c6]/10 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-10 w-10 text-[#5ec6c6]/50" />
          </div>
          <p className="text-foreground/70 font-medium mb-1">אין המלצות בתור פולו־אפ</p>
          <p className="text-sm text-muted-foreground">המלצות שנשלחו ללקוחות יופיעו כאן</p>
        </motion.div>
      )}
    </div>
  );
}
