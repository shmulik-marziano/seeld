import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-12 h-12 rounded-full bg-[#6c63ff] flex items-center justify-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a4b]">יומן פעולות</h1>
          <p className="text-sm text-gray-400">{data.activityLog.length} רשומות</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="חיפוש..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 rounded-full border-gray-200 min-h-[44px]" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-36 rounded-full border-gray-200 min-h-[44px]">
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

        <div className="divide-y divide-gray-50 max-h-[calc(100vh-250px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-gray-400">לא נמצאו רשומות</p>
          ) : filtered.map(a => {
            const customerName = getCustomerName(a.customerId);
            return (
              <div key={a.id} className="flex items-start gap-3 p-4 hover:bg-[#f8f9fc] transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                  a.level === 'הצלחה' ? 'bg-[#f06ba8]' : a.level === 'אזהרה' ? 'bg-[#6b6fc4]' : 'bg-[#d6157e]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a4b]">{a.title}</p>
                  {a.detail && <p className="text-xs text-gray-400 mt-0.5">{a.detail}</p>}
                  {customerName && <p className="text-xs text-[#d6157e] mt-0.5 font-medium">{customerName}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
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
