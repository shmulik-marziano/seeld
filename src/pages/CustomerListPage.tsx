import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Search, UserPlus, Phone, Mail, Calendar, Users, ChevronLeft, Package, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
          <Button
            onClick={() => navigate('/app/customers/new')}
            size="sm"
            className="gap-1.5 md:gap-2 text-xs md:text-sm min-h-[44px] rounded-2xl bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-lg shadow-[#0a3d3d]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[#0a3d3d]/30 hover:-translate-y-0.5"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">לקוח חדש</span>
            <span className="sm:hidden">חדש</span>
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-card rounded-2xl border shadow-sm overflow-hidden"
      >
        {/* Search & Filters */}
        <div className="p-4 md:p-5 border-b space-y-3 md:space-y-4 bg-gradient-to-b from-muted/30 to-transparent">
          <div className="relative group">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-[#0a3d3d]" />
            <Input
              placeholder="חיפוש לפי שם, ת.ז או טלפון..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 text-sm h-12 sm:h-11 rounded-xl w-full border-border/60 bg-background shadow-sm focus:shadow-md focus:border-[#5ec6c6] transition-all duration-200"
            />
          </div>
          <div className="flex gap-1.5 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {filters.map(f => {
              const count = f.value !== 'all' ? data.customers.filter(c => c.status === f.value).length : data.customers.length;
              return (
                <Button
                  key={f.value}
                  variant={activeFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(f.value)}
                  className={`text-[10px] md:text-xs h-9 md:h-8 px-3 md:px-3.5 shrink-0 min-h-[40px] md:min-h-0 rounded-xl transition-all duration-200 ${
                    activeFilter === f.value
                      ? 'bg-[#0a3d3d] hover:bg-[#0a3d3d]/90 shadow-md shadow-[#0a3d3d]/15'
                      : 'hover:border-[#5ec6c6]/50 hover:text-[#0a3d3d] hover:bg-[#5ec6c6]/5'
                  }`}
                >
                  {f.label}
                  <span className={`mr-1.5 rounded-full px-1.5 md:px-2 text-[9px] md:text-[10px] font-medium ${
                    activeFilter === f.value
                      ? 'bg-white/20'
                      : 'bg-muted'
                  }`}>
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Customer list */}
        <div className="divide-y divide-border/50">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="p-12 flex flex-col items-center gap-4 text-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted/50 flex items-center justify-center">
                  <img src={illustrationEmpty} alt="" className="h-14 sm:h-18 opacity-50" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/70 mb-1">לא נמצאו לקוחות</p>
                  <p className="text-xs text-muted-foreground">נסה לשנות את מילות החיפוש או את המסנן</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(''); setActiveFilter('all'); }}
                  className="rounded-xl text-xs"
                >
                  נקה חיפוש
                </Button>
              </motion.div>
            ) : filtered.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3), ease: 'easeOut' }}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="w-full text-right p-3.5 sm:p-4 hover:bg-[#5ec6c6]/5 transition-all duration-200 group active:bg-[#5ec6c6]/10 min-h-[76px] relative"
              >
                {/* Hover accent line */}
                <div className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0a3d3d] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />

                {/* Mobile: Card layout */}
                <div className="sm:hidden space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#0a3d3d]/8 flex items-center justify-center text-[#0a3d3d] font-bold text-xs shrink-0 group-hover:bg-[#0a3d3d]/12 transition-colors">
                        {c.firstName?.[0]}{c.lastName?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-sm text-foreground group-hover:text-[#0a3d3d] transition-colors block truncate">{c.fullName}</span>
                      </div>
                      <StatusBadge type="customer" status={c.status} className="text-[9px] shrink-0" />
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground/30 shrink-0 group-hover:text-[#0a3d3d] group-hover:translate-x-[-2px] transition-all duration-200" />
                  </div>
                  <div className="flex items-center justify-between gap-2 pr-11">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.mobilePhone}</span>
                      <span>ת.ז {c.idNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                      <span className="flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{productCount(c.id)}</span>
                      <span className="flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />{recCount(c.id)}</span>
                    </div>
                  </div>
                  {c.nextFollowUp && (
                    <div className="flex items-center gap-1 text-[10px] text-warning pr-11 font-medium">
                      <Calendar className="h-3 w-3" />
                      פולו-אפ: {new Date(c.nextFollowUp).toLocaleDateString('he-IL')}
                    </div>
                  )}
                </div>

                {/* Desktop: Row layout */}
                <div className="hidden sm:flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#0a3d3d]/8 flex items-center justify-center text-[#0a3d3d] font-bold text-sm shrink-0 group-hover:bg-[#0a3d3d]/12 group-hover:shadow-md group-hover:shadow-[#0a3d3d]/5 transition-all duration-200">
                      {c.firstName?.[0]}{c.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                        <span className="font-bold text-sm md:text-base text-foreground group-hover:text-[#0a3d3d] transition-colors truncate">{c.fullName}</span>
                        <StatusBadge type="customer" status={c.status} className="text-[9px] md:text-xs shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.mobilePhone}</span>
                        {c.email && <span className="hidden md:flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                        <span>ת.ז {c.idNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-left text-[10px] md:text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{productCount(c.id)} מוצרים</span>
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{recCount(c.id)} המלצות</span>
                      </div>
                      {c.nextFollowUp && (
                        <div className="flex items-center gap-1 text-warning font-medium">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.nextFollowUp).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground/30 group-hover:text-[#0a3d3d] group-hover:translate-x-[-2px] transition-all duration-200" />
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer with count */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-muted/20 text-center">
            <p className="text-[10px] text-muted-foreground">
              מציג {filtered.length} מתוך {data.customers.length} לקוחות
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
