import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { siteSupabase } from '@/integrations/supabase/site-client';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Target, ArrowRight, Search, Phone, Mail, Calendar, Shield, Wallet, UserPlus, ChevronDown, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'cancelled';
type LeadTable = 'insurance_leads' | 'pension_analysis_leads';

type InsuranceLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  insurance_type: string;
  status: LeadStatus;
  created_at: string;
  notes: string | null;
  id_number: string | null;
  assigned_to: string | null;
  additional_notes: string | null;
};

type PensionLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  created_at: string;
  employment_status: string | null;
  notes: string | null;
  id_number: string | null;
  assigned_to: string | null;
  additional_notes: string | null;
};

type UnifiedLead = {
  id: string;
  table: LeadTable;
  full_name: string;
  email: string;
  phone: string;
  type: 'insurance' | 'pension';
  subType: string;
  status: LeadStatus;
  created_at: string;
  notes: string | null;
  id_number: string | null;
  assigned_to: string | null;
  additional_notes: string | null;
};

const STATUS_MAP: Record<LeadStatus, { label: string; bg: string; text: string }> = {
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

const digitsOf = (s: string | null | undefined) => (s || '').replace(/\D/g, '');

const errMessage = (err: unknown, fallback: string) =>
  (err instanceof Error && err.message) || (typeof err === 'object' && err && 'message' in err && String((err as { message: unknown }).message)) || fallback;

export default function LeadsPage() {
  const navigate = useNavigate();
  const { data, addCustomer, profile } = useApp();
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      setError(null);
      try {
        const [insRes, penRes] = await Promise.all([
          siteSupabase.from('insurance_leads').select('id,full_name,email,phone,insurance_type,status,created_at,notes,id_number,assigned_to,additional_notes').order('created_at', { ascending: false }).limit(200),
          siteSupabase.from('pension_analysis_leads').select('id,full_name,email,phone,status,created_at,employment_status,notes,id_number,assigned_to,additional_notes').order('created_at', { ascending: false }).limit(200),
        ]);

        const unified: UnifiedLead[] = [];

        if (insRes.data) {
          for (const r of insRes.data as InsuranceLead[]) {
            unified.push({
              id: r.id, table: 'insurance_leads', full_name: r.full_name, email: r.email, phone: r.phone,
              type: 'insurance', subType: INSURANCE_TYPE_MAP[r.insurance_type] || r.insurance_type,
              status: r.status, created_at: r.created_at, notes: r.notes,
              id_number: r.id_number, assigned_to: r.assigned_to, additional_notes: r.additional_notes,
            });
          }
        }
        if (penRes.data) {
          for (const r of penRes.data as PensionLead[]) {
            unified.push({
              id: r.id, table: 'pension_analysis_leads', full_name: r.full_name, email: r.email, phone: r.phone,
              type: 'pension', subType: r.employment_status || 'ניתוח פנסיוני',
              status: r.status, created_at: r.created_at, notes: r.notes,
              id_number: r.id_number, assigned_to: r.assigned_to, additional_notes: r.additional_notes,
            });
          }
        }

        unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLeads(unified);
      } catch (err) {
        setError(errMessage(err, 'שגיאה בטעינת הלידים'));
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  async function updateLead(lead: UnifiedLead, patch: { status?: LeadStatus; notes?: string | null; assigned_to?: string | null }) {
    const payload = { ...patch, updated_at: new Date().toISOString() };
    const { error: updateError } = lead.table === 'insurance_leads'
      ? await siteSupabase.from('insurance_leads').update(payload).eq('id', lead.id)
      : await siteSupabase.from('pension_analysis_leads').update(payload).eq('id', lead.id);
    if (updateError) throw updateError;
    setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, ...patch } : l)));
  }

  async function handleStatusChange(lead: UnifiedLead, status: LeadStatus) {
    if (status === lead.status) return;
    // First touch claims the lead for the acting agent
    const patch: Parameters<typeof updateLead>[1] = { status };
    if (!lead.assigned_to && profile?.fullName) patch.assigned_to = profile.fullName;
    try {
      await updateLead(lead, patch);
      toast.success(`סטטוס עודכן ל"${STATUS_MAP[status].label}"`);
    } catch (err) {
      toast.error(errMessage(err, 'עדכון הסטטוס נכשל'));
    }
  }

  function toggleExpand(lead: UnifiedLead) {
    if (expandedId === lead.id) {
      setExpandedId(null);
    } else {
      setExpandedId(lead.id);
      setNoteDraft(lead.notes || '');
    }
  }

  async function handleSaveNote(lead: UnifiedLead) {
    setSavingNote(true);
    try {
      await updateLead(lead, { notes: noteDraft.trim() || null });
      toast.success('ההערה נשמרה');
    } catch (err) {
      toast.error(errMessage(err, 'שמירת ההערה נכשלה'));
    } finally {
      setSavingNote(false);
    }
  }

  async function handleConvert(lead: UnifiedLead) {
    const phoneDigits = digitsOf(lead.phone);
    const existing = data.customers.find(c =>
      (lead.id_number && c.idNumber && c.idNumber === lead.id_number) ||
      (phoneDigits && digitsOf(c.mobilePhone) === phoneDigits)
    );
    if (existing) {
      toast.info(`כבר קיים לקוח עם הפרטים האלה: ${existing.fullName}`);
      navigate(`/app/customers/${existing.id}`);
      return;
    }

    const [firstName, ...rest] = lead.full_name.trim().split(/\s+/);
    setConvertingId(lead.id);
    try {
      const customer = await addCustomer({
        firstName: firstName || lead.full_name,
        lastName: rest.join(' '),
        idNumber: lead.id_number || '',
        mobilePhone: lead.phone || '',
        email: lead.email || undefined,
        source: lead.type === 'insurance' ? `ליד מהאתר — ביטוח ${lead.subType}` : 'ליד מהאתר — ניתוח פנסיוני',
        internalNotes: [lead.additional_notes, lead.notes].filter(Boolean).join('\n') || undefined,
        status: 'חדש',
      });
      const stamp = `הומר ללקוח ב-${new Date().toLocaleDateString('he-IL')}`;
      await updateLead(lead, {
        status: 'closed',
        notes: [lead.notes, stamp].filter(Boolean).join('\n'),
        ...(lead.assigned_to ? {} : profile?.fullName ? { assigned_to: profile.fullName } : {}),
      });
      toast.success('הליד הומר ללקוח');
      navigate(`/app/customers/${customer.id}`);
    } catch (err) {
      toast.error(errMessage(err, 'המרת הליד נכשלה'));
    } finally {
      setConvertingId(null);
    }
  }

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
            const expanded = expandedId === lead.id;
            return (
              <motion.div key={lead.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-[#171717]">
                      {lead.type === 'insurance'
                        ? <Shield className="w-5 h-5 text-white" />
                        : <Wallet className="w-5 h-5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#171717] truncate">{lead.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <select
                          value={lead.status}
                          onChange={e => handleStatusChange(lead, e.target.value as LeadStatus)}
                          aria-label={`סטטוס הליד של ${lead.full_name}`}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border-0 cursor-pointer appearance-none"
                          style={{ backgroundColor: st.bg, color: st.text }}>
                          {(Object.keys(STATUS_MAP) as LeadStatus[]).map(s => (
                            <option key={s} value={s}>{STATUS_MAP[s].label}</option>
                          ))}
                        </select>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#17171720] text-[#171717]">
                          {lead.type === 'insurance' ? 'ביטוח' : 'פנסיה'} &middot; {lead.subType}
                        </span>
                        {lead.assigned_to && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#b4530920] text-[#b45309] flex items-center gap-1">
                            <User className="w-3 h-3" />{lead.assigned_to}
                          </span>
                        )}
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
                    <button onClick={() => handleConvert(lead)}
                      disabled={convertingId === lead.id}
                      title="צור לקוח מהליד"
                      className="w-8 h-8 rounded-full bg-[#b45309]/10 flex items-center justify-center hover:bg-[#b45309]/20 transition-colors disabled:opacity-50">
                      {convertingId === lead.id
                        ? <Loader2 className="w-3.5 h-3.5 text-[#b45309] animate-spin" />
                        : <UserPlus className="w-3.5 h-3.5 text-[#b45309]" />}
                    </button>
                    <button onClick={() => toggleExpand(lead)}
                      title={expanded ? 'סגור פרטים' : 'פרטים והערות'}
                      className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(lead.created_at).toLocaleDateString('he-IL')}
                  </span>
                  {lead.email && <span className="truncate max-w-[200px]">{lead.email}</span>}
                  {lead.phone && <span dir="ltr">{lead.phone}</span>}
                  {lead.id_number && <span>ת.ז {lead.id_number}</span>}
                </div>
                {!expanded && lead.notes && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-1 border-t border-gray-50 pt-2">{lead.notes}</p>
                )}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                        {lead.additional_notes && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 mb-1">מה הלקוח כתב בטופס</p>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">{lead.additional_notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 mb-1">הערות פנימיות</p>
                          <Textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
                            placeholder="תיעוד שיחה, סיכום, תזכורת..."
                            className="text-xs rounded-xl border-gray-200 min-h-[70px]" />
                          <div className="flex justify-end mt-2">
                            <Button size="sm" onClick={() => handleSaveNote(lead)}
                              disabled={savingNote || noteDraft === (lead.notes || '')}
                              className="rounded-full px-5">
                              {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'שמור הערה'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
