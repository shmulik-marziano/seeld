import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus, Search, Tag, Trash2, BookOpen, Filter, Loader2, Edit2,
} from 'lucide-react';

interface ReasoningEntry {
  id: string;
  agent_id: string;
  category: string;
  recommendation_type: string;
  text: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  archived_at: string | null;
}

const categories = ['פנסיה', 'גמל', 'השתלמות', 'ביטוח חיים', 'בריאות', 'סיעוד', 'חיסכון', 'השקעות', 'כללי'];
const recTypes = ['שימור', 'שינוי', 'ביטול', 'הוספה', 'שדרוג', 'החלפה', 'איחוד'];

export default function ReasoningBankPage() {
  const { session } = useApp();
  const [entries, setEntries] = useState<ReasoningEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ReasoningEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Form
  const [form, setForm] = useState({ category: 'כללי', recommendation_type: 'שינוי', text: '', tagsInput: '' });

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('reasoning_bank').select('*').is('archived_at', null).order('usage_count', { ascending: false });
    setEntries((data || []) as ReasoningEntry[]);
    setLoaded(true);
    setLoading(false);
  }, []);

  if (!loaded && !loading) loadEntries();

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterCategory !== 'all') result = result.filter(e => e.category === filterCategory);
    if (filterType !== 'all') result = result.filter(e => e.recommendation_type === filterType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.text.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entries, filterCategory, filterType, searchQuery]);

  const handleOpen = (entry?: ReasoningEntry) => {
    if (entry) {
      setEditEntry(entry);
      setForm({ category: entry.category, recommendation_type: entry.recommendation_type, text: entry.text, tagsInput: entry.tags.join(', ') });
    } else {
      setEditEntry(null);
      setForm({ category: 'כללי', recommendation_type: 'שינוי', text: '', tagsInput: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.text.trim()) { toast.error('טקסט הנימוק חובה'); return; }
    const tags = form.tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (editEntry) {
      const { error } = await supabase.from('reasoning_bank').update({
        category: form.category, recommendation_type: form.recommendation_type,
        text: form.text, tags,
      }).eq('id', editEntry.id);
      if (error) { toast.error('שגיאה בעדכון'); return; }
      toast.success('נימוק עודכן');
    } else {
      const { error } = await supabase.from('reasoning_bank').insert({
        agent_id: session?.user?.id, category: form.category,
        recommendation_type: form.recommendation_type, text: form.text, tags,
      } as any);
      if (error) { toast.error('שגיאה ביצירה'); return; }
      toast.success('נימוק נוסף');
    }
    setModalOpen(false);
    loadEntries();
  };

  const handleArchive = async (id: string) => {
    await supabase.from('reasoning_bank').update({ archived_at: new Date().toISOString() } as any).eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('נימוק הועבר לארכיון');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a4b]">בנק נימוקים</h1>
          <p className="text-sm text-muted-foreground">נימוקים מוכנים לשימוש בהמלצות</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2 rounded-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 shadow-md shadow-[#1a1a4b]/15">
          <Plus className="h-4 w-4" />נימוק חדש
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative group">
            <Search className="h-4 w-4 absolute right-3 top-3 text-muted-foreground group-focus-within:text-[#1a1a4b]" />
            <Input placeholder="חיפוש..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 rounded-xl border-border/60 focus:border-[#d6157e]" />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="קטגוריה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקטגוריות</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="סוג המלצה" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            {recTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">אין נימוקים עדיין. הוסף את הנימוק הראשון!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow rounded-2xl border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs rounded-full border-[#d6157e]/30 text-[#1a1a4b] bg-[#d6157e]/5">{entry.category}</Badge>
                    <Badge variant="secondary" className="text-xs rounded-full bg-[#6b6fc4]/10 text-[#6b6fc4]">{entry.recommendation_type}</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpen(entry)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleArchive(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{entry.text}</p>
                {entry.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs bg-[#1a1a4b]/5 px-2 py-0.5 rounded-full text-[#1a1a4b]/70">
                        <Tag className="h-2.5 w-2.5 inline mr-1" />{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">שימושים: {entry.usage_count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={v => !v && setModalOpen(false)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editEntry ? 'עריכת נימוק' : 'נימוק חדש'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">קטגוריה</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">סוג המלצה</Label>
                <Select value={form.recommendation_type} onValueChange={v => setForm(p => ({ ...p, recommendation_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{recTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">טקסט הנימוק *</Label>
              <Textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} rows={4} placeholder="הזן את הנימוק כאן..." />
            </div>
            <div>
              <Label className="text-xs">תגיות (מופרדות בפסיקים)</Label>
              <Input value={form.tagsInput} onChange={e => setForm(p => ({ ...p, tagsInput: e.target.value }))} placeholder="דמי ניהול, מסלול השקעה, כפל כיסויים" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="rounded-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90">{editEntry ? 'שמור שינויים' : 'הוסף נימוק'}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-full">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
