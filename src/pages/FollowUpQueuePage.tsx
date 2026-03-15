import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { StatusBadge } from '@/components/status/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { motion } from 'framer-motion';

const FOLLOW_UP_STATUSES = ['טיוטה', 'נשלח', 'נצפה', 'רוצה לחשוב'];

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

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="תור פולו־אפ"
        subtitle={`${items.length} המלצות ממתינות לטיפול`}
        icon={<Clock className="h-5 w-5" />}
        breadcrumbs={[{ label: 'דשבורד', path: '/dashboard' }, { label: 'פולו־אפ' }]}
      />

      {Object.entries(grouped).map(([status, group]) => group.length > 0 && (
        <div key={status} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge type="decision" status={status} />
            <span className="text-sm text-muted-foreground">({group.length})</span>
          </div>
          <div className="space-y-2">
            {group.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={() => navigate(`/customers/${item.customerId}`)} className="font-bold text-sm hover:text-primary transition-colors">
                            {item.customer?.fullName}
                          </button>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-sm">{item.title}</span>
                          <StatusBadge type="action" status={item.actionType} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {item.product && <span>{item.product.company} - {item.product.productType}</span>}
                          <span>{daysSince(item.updatedAt)} ימים מאז עדכון</span>
                          {item.customerNote && <span className="text-warning">"{item.customerNote}"</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {item.decisionStatus === 'טיוטה' && (
                          <Button size="sm" variant="outline" onClick={() => updateRecommendation(item.id, { decisionStatus: 'נשלח' })}>שלח</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/customers/${item.customerId}`)}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">אין המלצות בתור פולו־אפ</p>
        </motion.div>
      )}
    </div>
  );
}
