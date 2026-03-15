import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, ArrowLeft, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { motion } from 'framer-motion';

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

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="תור ביצוע"
        subtitle={`${items.length} המלצות מאושרות בתהליך ביצוע`}
        icon={<Zap className="h-5 w-5" />}
        breadcrumbs={[{ label: 'דשבורד', path: '/dashboard' }, { label: 'ביצוע' }]}
      />

      <div className="space-y-3">
        {items.map((item, i) => {
          const missing = item.missingForExecution?.split(', ').filter(Boolean) || [];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Card className={`hover:shadow-md transition-all hover:-translate-y-0.5 ${item.executionStatus === 'חזר ליקוי' ? 'border-destructive/40' : ''}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <button onClick={() => navigate(`/customers/${item.customerId}`)} className="font-bold text-sm hover:text-primary transition-colors">
                          {item.customer?.fullName}
                        </button>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-sm">{item.title}</span>
                        <StatusBadge type="action" status={item.actionType} />
                        {item.executionStatus && <StatusBadge type="execution" status={item.executionStatus} />}
                      </div>
                      {item.product && <p className="text-xs text-muted-foreground">{item.product.company} - {item.product.productType}</p>}
                      {missing.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          <span>חוסרים: {missing.join(' · ')}</span>
                        </div>
                      )}
                      {item.nextStep && <p className="text-xs mt-1"><span className="font-medium">צעד הבא:</span> {item.nextStep}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/customers/${item.customerId}`)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
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
          className="text-center py-16"
        >
          <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">אין המלצות בתור ביצוע</p>
        </motion.div>
      )}
    </div>
  );
}
