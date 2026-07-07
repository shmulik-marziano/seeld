import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { siteSupabase } from '@/integrations/supabase/site-client';
import { motion } from 'framer-motion';
import { Loader2, Target, ArrowRight, Search, Phone, Mail, Calendar, Shield, Wallet, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

type InsuranceLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  insurance_type: string;
  status: string;
  created_at: string;
  notes: string | null;
};

type PensionLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  employment_status: string | null;
  notes: string | null;
};

type UnifiedLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  type: 'insurance' | 'pension';
  subType: string;
  status: string;
  created_at: string;
  notes: string | null;
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  new:         { label: 'חדש',       bg: '#e0f2fe', text: '#0369a1' },
  contacted:   { label: 'נוצר קשר',  bg: '#fef3c7', text: '#92400e' },
  in_progress: { label: 'בטיפול',    bg: '#dbeafe', text: '#1e40af' },
  closed:      { label: 'נסגר',      bg: '#dcfce7', text: '#166534' },
  cancelled:   { label: 'בוטל',      bg: '#fee2e2', text: '#991b1b' },
};

const INSURANCE_TYPE_MAP: Record<string, string> = {
  vehicle: 'רכב', home: 'דירה', business: 'עסק', travel: 'נסיעות',
  dental: 'שיניים', disability: 'אובדן כושר', foreign_workers: 'עובדים זרים',
  nursing: 'סיעודי', health: 'בריאות', life: 'חיים', mortgage: 'משכנתא',
  critical_illness: 'מחלות קשות', personal_accidents: 'תאונות אישיות',
  partners_risk: 'שותפים', renters: 'שוכרים',
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      setError(null);
      try {
        const [insRes, penRes] = await Promise.all([
          siteSupabase.from('insurance_leads').select('id,full_name,email,phone,insurance_type,status,created_at,notes').order('created_at', { ascending: false }).limit(200),
          siteSupabase.from('pension_analysis_leads').select('id,full_name,email,phone,status,created_at,employment_status,notes').order('created_at', { ascending: false }).limit(200),
        ]);

        const unified: UnifiedLead[] = [];

        if (insRes.data) {
          for (const r of insRes.data as InsuranceLead[]) {
            unified.push({
              id: r.id, full_name: r.full_name, email: r.email, phone: r.phone,
              type: 'insurance', subType: INSURANCE_TYPE_MAP[r.insurance_type] || r.insurance_type,
              status: r.status, created_at: r.created_at, notes: r.notes,
            });
          }
        }
        if (penRes.data) {
          for (const r of penRes.data as PensionLead[]) {
            unified.push({
              id: r.id, full_name: r.full_name, email: r.email, phone: r.phone,
              type: 'pension', subType: r.employment_status || 'ניתוח פנסיוני',
              status: r.status, created_at: r.created_at, notes: r.notes,
            });
          }
        }

        unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLeads(unified);
      } catch (err: any) {
        setError(err?.message || 'שגיאה בטעינת הלידים');
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const filtered = leads.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return l.full_name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || l.phone.includes(s);
    }
    return true;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    inProgress: leads.filter(l => l.status === 'in_progress' || l.status === 'contacted').length,
    closed: leads.filter(l => l.status === 'closed').length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/dashboard')}
            className="w-10 h-10 rounded-full bg-[#171717] flex items-center justify-center hover:bg-[#171717]/80 transition-colors">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div className="w-12 h-12 rounded-full bg-[#b45309] flex items-center justify-center shadow-lg">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#171717]">לידים</h1>
            <p className="text-sm text-gray-400">{leads.length} לידים מהאתר</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'סה״כ', value: stats.total, color: '#171717', bg: '#17171715' },
          { label: 'חדשים', value: stats.new, color: '#0369a1', bg: '#e0f2fe' },
          { label: 'בטיפול', value: stats.inProgress, color: '#1e40af', bg: '#dbeafe' },
          { label: 'נסגרו', value: stats.closed, color: '#166534', bg: '#dcfce7' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4 border border-gray-100 shadow-sm"
            style={{ backgroundColor: s.bg }}>
            <p className="text-[11px] font-bold" style={{ color: s.color + 'aa' }}>{s.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="חיפוש לפי שם, מייל או טלפון..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 rounded-full border-gray-200 min-h-[44px]" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 bg-white min-h-[44px]">
              <option value="all">כל הסטטוסים</option>
              <option value="new">חדש</option>
              <option value="contacted">נוצר קשר</option>
              <option value="in_progress">בטיפול</option>
              <option value="closed">נסגר</option>
              <option value="cancelled">בוטל</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 bg-white min-h-[44px]">
              <option value="all">כל הסוגים</option>
              <option value="insurance">ביטוח</option>
              <option value="pension">פנסיה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#171717]" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <p className="text-red-500 font-bold mb-2">שגיאה בטעינת הלידים</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#b45309]/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[#b45309]" />
          </div>
          <p className="text-lg font-extrabold text-[#171717] mb-2">
            {leads.length === 0 ? 'אין לידים עדיין' : 'לא נמצאו תוצאות'}
          </p>
          <p className="text-sm text-gray-400">
            {leads.length === 0
              ? 'לידים שנכנסים מהאתר יופיעו כאן אוטומטית'
              : 'נסה לשנות את מסנני החיפוש'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead, i) => {
            const st = STATUS_MAP[lead.status] || STATUS_MAP.new;
            return (
              <motion.div key={lead.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: lead.type === 'insurance' ? '#171717' : '#171717' }}>
                      {lead.type === 'insurance'
                        ? <Shield className="w-5 h-5 text-white" />
                        : <Wallet className="w-5 h-5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#171717] truncate">{lead.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: lead.type === 'insurance' ? '#17171720' : '#17171720',
                            color: lead.type === 'insurance' ? '#171717' : '#171717',
                          }}>
                          {lead.type === 'insurance' ? 'ביטוח' : 'פנסיה'} &middot; {lead.subType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`}
                        className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-green-600" />
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`}
                        className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(lead.created_at).toLocaleDateString('he-IL')}
                  </span>
                  {lead.email && <span className="truncate max-w-[200px]">{lead.email}</span>}
                  {lead.phone && <span dir="ltr">{lead.phone}</span>}
                </div>
                {lead.notes && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-1 border-t border-gray-50 pt-2">{lead.notes}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Coming Soon Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="mt-8 rounded-2xl p-6 text-center border-2 border-dashed"
        style={{ borderColor: '#17171740', backgroundColor: '#17171708' }}>
        <div className="w-12 h-12 rounded-full bg-[#171717]/10 flex items-center justify-center mx-auto mb-3">
          <Filter className="w-6 h-6 text-[#171717]" />
        </div>
        <p className="text-sm font-extrabold text-[#171717]">ניהול לידים מלא - בקרוב</p>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          יכלול: הקצאת ליד לסוכן, שינוי סטטוס, תיעוד פעולות, מעקב המרות, ועוד
        </p>
      </motion.div>
    </div>
  );
}
