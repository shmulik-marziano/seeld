import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Search, UserPlus, Phone, Mail, Calendar, Users, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import illustrationEmpty from '@/assets/illustration-empty.png';

const filters = [
  { label: 'הכל', value: 'all' },
  { label: 'חדש', value: 'חדש' },
  { label: 'בקליטה', value: 'בקליטה' },
  { label: 'מוכן להמלצה', value: 'מוכן להמלצה' },
  { label: 'פולו־אפ', value: 'ממתין לפולו־אפ' },
  { label: 'בביצוע', value: 'בביצוע' },
  { label: 'הושלם', value: 'הושלם' },
];

export default function CustomerListPage() {
  const navigate = useNavigate();
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = data.customers.filter(c => {
    if (activeFilter !== 'all' && c.status !== activeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.fullName.includes(s) || c.idNumber.includes(s) || c.mobilePhone.includes(s);
    }
    return true;
  });

  const productCount = (id: string) => data.products.filter(p => p.customerId === id).length;
  const recCount = (id: string) => data.recommendations.filter(r => r.customerId === id).length;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="לקוחות"
        subtitle={`${data.customers.length} לקוחות במערכת`}
        icon={<Users className="h-5 w-5" />}
        breadcrumbs={[{ label: 'דשבורד', path: '/dashboard' }, { label: 'לקוחות' }]}
        actions={
          <Button onClick={() => navigate('/app/customers/new')} size="sm" className="gap-1.5 md:gap-2 text-xs md:text-sm min-h-[44px] rounded-xl">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">לקוח חדש</span>
            <span className="sm:hidden">חדש</span>
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-card rounded-xl border shadow-sm overflow-hidden"
      >
        {/* Search & Filters */}
        <div className="p-3 md:p-4 border-b space-y-2 md:space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, ת.ז או טלפון..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 text-sm h-11 sm:h-10 rounded-xl w-full"
            />
          </div>
          <div className="flex gap-1.5 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {filters.map(f => (
              <Button
                key={f.value}
                variant={activeFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(f.value)}
                className="text-[10px] md:text-xs h-8 md:h-7 px-2.5 md:px-3 shrink-0 min-h-[36px] md:min-h-0 rounded-lg"
              >
                {f.label}
                {f.value !== 'all' && (
                  <span className="mr-1 bg-primary-foreground/20 rounded-full px-1 md:px-1.5 text-[9px] md:text-[10px]">
                    {data.customers.filter(c => c.status === f.value).length}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Customer list - card style on mobile */}
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-3 text-center">
              <img src={illustrationEmpty} alt="" className="h-20 sm:h-28 opacity-60" />
              <p className="text-sm text-muted-foreground">לא נמצאו לקוחות</p>
            </div>
          ) : filtered.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="w-full text-right p-3 sm:p-4 hover:bg-muted/50 transition-colors group active:bg-muted/70 min-h-[72px]"
            >
              {/* Mobile: Card layout */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{c.fullName}</span>
                    <StatusBadge type="customer" status={c.status} className="text-[9px] shrink-0" />
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.mobilePhone}</span>
                    <span>ת.ז {c.idNumber}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground shrink-0">
                    {productCount(c.id)} מוצרים · {recCount(c.id)} המלצות
                  </div>
                </div>
                {c.nextFollowUp && (
                  <div className="flex items-center gap-1 text-[10px] text-warning">
                    <Calendar className="h-3 w-3" />
                    פולו-אפ: {new Date(c.nextFollowUp).toLocaleDateString('he-IL')}
                  </div>
                )}
              </div>

              {/* Desktop: Row layout */}
              <div className="hidden sm:flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-1">
                    <span className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors truncate">{c.fullName}</span>
                    <StatusBadge type="customer" status={c.status} className="text-[9px] md:text-xs shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.mobilePhone}</span>
                    {c.email && <span className="hidden md:flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    <span>ת.ז {c.idNumber}</span>
                  </div>
                </div>
                <div className="text-left text-[10px] md:text-xs text-muted-foreground space-y-0.5 shrink-0">
                  <div>{productCount(c.id)} מוצרים · {recCount(c.id)} המלצות</div>
                  {c.nextFollowUp && (
                    <div className="flex items-center gap-1 text-warning">
                      <Calendar className="h-3 w-3" />
                      {new Date(c.nextFollowUp).toLocaleDateString('he-IL')}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
