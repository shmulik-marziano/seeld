import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search } from 'lucide-react';

export default function ActivityLogPage() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filtered = data.activityLog.filter(a => {
    if (levelFilter !== 'all' && a.level !== levelFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.title.includes(s) || a.detail?.includes(s) || false;
    }
    return true;
  });

  const getCustomerName = (id?: string) => {
    if (!id) return null;
    return data.customers.find(c => c.id === id)?.fullName;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-info" />
        <div>
          <h1 className="text-2xl font-bold">יומן פעולות</h1>
          <p className="text-sm text-muted-foreground">{data.activityLog.length} רשומות</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="חיפוש..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="סוג אירוע" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="מידע">מידע</SelectItem>
              <SelectItem value="הצלחה">הצלחה</SelectItem>
              <SelectItem value="אזהרה">אזהרה</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y max-h-[calc(100vh-250px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">לא נמצאו רשומות</p>
          ) : filtered.map(a => {
            const customerName = getCustomerName(a.customerId);
            return (
              <div key={a.id} className="flex items-start gap-3 p-4">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.level === 'הצלחה' ? 'bg-success' : a.level === 'אזהרה' ? 'bg-warning' : 'bg-info'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  {a.detail && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
                  {customerName && <p className="text-xs text-primary mt-0.5">{customerName}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.timestamp).toLocaleDateString('he-IL')} {new Date(a.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
