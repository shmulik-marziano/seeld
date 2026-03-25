import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, X } from 'lucide-react';

const COLORS = ['#5ec6c6', '#f4a261', '#e76f51', '#90be6d', '#ffc929', '#6c63ff'];

const STATUS_COLOR: Record<string, string> = {
  'חדש': '#5ec6c6',
  'בקליטה': '#f4a261',
  'מוכן להמלצה': '#90be6d',
  'ממתין לפולו-אפ': '#ffc929',
  'בביצוע': '#e76f51',
  'הושלם': '#6c63ff',
};

const SIZES = [96, 104, 88, 112, 92, 100, 84, 108, 96, 90];

const FILTERS = [
  { label: 'הכל', value: 'all' },
  { label: 'חדש', value: 'חדש' },
  { label: 'בקליטה', value: 'בקליטה' },
  { label: 'השלמת מוצרים', value: 'בהשלמת מוצרים' },
  { label: 'מוכן להמלצה', value: 'מוכן להמלצה' },
  { label: 'פולו-אפ', value: 'ממתין לפולו-אפ' },
  { label: 'מאושר לביצוע', value: 'מאושר לביצוע' },
  { label: 'בביצוע', value: 'בביצוע' },
  { label: 'הושלם', value: 'הושלם' },
];

export default function CustomerListPage() {
  const navigate = useNavigate();
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = data.customers.filter(c => {
    if (activeFilter !== 'all' && c.status !== activeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.fullName.includes(s) || c.idNumber.includes(s) || c.mobilePhone.includes(s);
    }
    return true;
  });

  return (
    <div
      className="-m-3 sm:-m-4 md:-m-6 min-h-screen relative overflow-x-hidden"
      style={{ backgroundColor: '#f8f9fc' }}
      dir="rtl"
    >
      {/* Background decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.07] blur-3xl" style={{ backgroundColor: '#5ec6c6' }} />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-[0.06] blur-3xl" style={{ backgroundColor: '#f4a261' }} />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 rounded-full opacity-[0.05] blur-3xl" style={{ backgroundColor: '#6c63ff' }} />
        {/* Watermark */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[120px] font-black tracking-widest select-none opacity-[0.025] text-[#0a3d3d] whitespace-nowrap">
          SEELD
        </div>
      </div>

      {/* Top bar */}
      <div
        className="sticky top-0 z-30 px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(248,249,252,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-gray-400">SEELD פלטפורמה</p>
          <h1 className="text-2xl font-extrabold leading-tight" style={{ color: '#0a3d3d' }}>
            לקוחות
            <span className="mr-2 text-sm font-medium text-gray-400">({data.customers.length})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => { setSearchOpen(v => !v); }}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: searchOpen ? '#0a3d3d' : '#5ec6c6', color: 'white' }}
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate('/app/customers/new')}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#0a3d3d', color: 'white' }}
          >
            <UserPlus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden relative z-20"
          >
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="חיפוש לפי שם, ת.ז או טלפון..."
                  className="w-full pr-11 pl-4 py-3 rounded-2xl border bg-white text-sm focus:outline-none transition-all"
                  style={{ borderColor: '#5ec6c6', boxShadow: '0 2px 12px rgba(94,198,198,0.15)' }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter pills */}
      <div className="px-5 pb-5 flex gap-2 flex-wrap relative z-10">
        {FILTERS.map(f => {
          const count =
            f.value === 'all'
              ? data.customers.length
              : data.customers.filter(c => c.status === f.value).length;
          const active = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
              style={{
                backgroundColor: active ? '#0a3d3d' : 'white',
                color: active ? 'white' : '#6b7280',
                border: `2px solid ${active ? '#0a3d3d' : '#e5e7eb'}`,
                boxShadow: active ? '0 4px 12px rgba(10,61,61,0.2)' : 'none',
              }}
            >
              {f.label}
              <span className={`mr-1 text-[10px] ${active ? 'opacity-60' : 'opacity-40'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bubble canvas */}
      <div className="px-5 pb-12 relative z-10 min-h-[60vh]">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-xl"
              style={{ backgroundColor: '#5ec6c6', boxShadow: '0 12px 32px rgba(94,198,198,0.35)' }}
            >
              <UserPlus className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-gray-500 font-semibold mb-1">לא נמצאו לקוחות</p>
            <p className="text-xs text-gray-400 mb-4">נסה לשנות את החיפוש או המסנן</p>
            <button
              onClick={() => { setSearch(''); setActiveFilter('all'); }}
              className="px-5 py-2 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: '#0a3d3d' }}
            >
              נקה סינון
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-wrap gap-5"
            style={{ direction: 'rtl' }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => {
                const color = COLORS[i % COLORS.length];
                const statusColor = STATUS_COLOR[c.status] || '#5ec6c6';
                const size = SIZES[i % SIZES.length];
                const floatDelay = (i % 6) * 0.5;

                return (
                  <motion.button
                    key={c.id}
                    layout
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: -10 }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 22,
                      delay: Math.min(i * 0.035, 0.55),
                    }}
                    whileHover={{ scale: 1.1, y: -6 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => navigate(`/app/customers/${c.id}`)}
                    className="flex flex-col items-center gap-2 focus:outline-none"
                  >
                    {/* Floating idle animation wrapper */}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.2 + floatDelay * 0.4,
                        delay: floatDelay,
                        ease: 'easeInOut',
                      }}
                      className="relative"
                    >
                      {/* Circle */}
                      <div
                        className="rounded-full flex items-center justify-center relative select-none"
                        style={{
                          width: size,
                          height: size,
                          backgroundColor: color,
                          boxShadow: `0 10px 28px ${color}55, 0 2px 8px ${color}30`,
                          border: `3px solid ${statusColor}`,
                        }}
                      >
                        <span
                          className="text-white font-black"
                          style={{ fontSize: Math.round(size * 0.22) }}
                        >
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </span>

                        {/* Status dot */}
                        <div
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white"
                          style={{ backgroundColor: statusColor }}
                        />
                      </div>
                    </motion.div>

                    {/* Name */}
                    <span
                      className="text-xs font-bold text-center leading-tight"
                      style={{
                        color: '#0a3d3d',
                        maxWidth: size + 12,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.fullName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{c.mobilePhone}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Count footer */}
      {filtered.length > 0 && (
        <div className="text-center pb-8 relative z-10">
          <p className="text-xs text-gray-400">
            מציג {filtered.length} מתוך {data.customers.length} לקוחות
          </p>
        </div>
      )}
    </div>
  );
}
