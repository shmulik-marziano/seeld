import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, FileText, CheckCircle2, Clock, TrendingUp,
  Sparkles, LayoutDashboard, UserPlus, Bell, Zap,
  Shield, Wallet, Target, ChevronLeft, ClipboardCheck,
  Activity, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

// New bold color palette
const PALETTE = {
  teal: '#0a3d3d',
  mint: '#5ec6c6',
  orange: '#f4a261',
  green: '#90be6d',
  coral: '#e76f51',
};

const CHART_COLORS = [
  PALETTE.teal,
  PALETTE.mint,
  PALETTE.green,
  PALETTE.orange,
  PALETTE.coral,
];

const DONUT_COLORS = [
  PALETTE.green,
  PALETTE.mint,
  PALETTE.orange,
  PALETTE.coral,
  '#6b7280',
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// Month labels in Hebrew
const MONTHS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

export default function DashboardPage() {
  const { data } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const { customers, recommendations, products } = data;
    const totalCustomers = customers.length;
    const totalProducts = products.length;
    const totalRecs = recommendations.length;
    const openRecs = recommendations.filter(r => ['טיוטה', 'נשלח', 'נצפה'].includes(r.decisionStatus)).length;
    const approvedRecs = recommendations.filter(r => r.decisionStatus === 'מאשר').length;
    const inExecution = recommendations.filter(r => r.decisionStatus === 'עבר לביצוע' || r.executionStatus).length;
    const completedRecs = recommendations.filter(r => r.decisionStatus === 'בוצע').length;
    const thinkingRecs = recommendations.filter(r => r.decisionStatus === 'רוצה לחשוב').length;
    const rejectedRecs = recommendations.filter(r => r.decisionStatus === 'לא מעוניין').length;
    const totalPremium = products.filter(p => p.category === 'ביטוח').reduce((s, p) => s + (p.monthlyPremium || 0), 0);
    const totalDeposit = products.filter(p => p.category === 'כסף').reduce((s, p) => s + (p.monthlyDeposit || 0), 0);
    const totalMonthly = totalPremium + totalDeposit;
    const totalAccumulation = products.reduce((s, p) => s + (p.accumulation || 0), 0);
    const pendingFollowUps = customers.filter(c => c.nextFollowUp && new Date(c.nextFollowUp) <= new Date()).length;
    const moneyProducts = products.filter(p => p.category === 'כסף').length;
    const insuranceProducts = products.filter(p => p.category === 'ביטוח').length;

    // Approval rate
    const decidedRecs = approvedRecs + completedRecs + rejectedRecs;
    const approvalRate = decidedRecs > 0 ? Math.round(((approvedRecs + completedRecs) / decidedRecs) * 100) : 0;

    // Decision donut
    const decisionData = [
      { name: 'מאושר', value: approvedRecs + completedRecs },
      { name: 'בביצוע', value: inExecution },
      { name: 'ממתין', value: openRecs },
      { name: 'לחשוב', value: thinkingRecs },
      { name: 'נדחה', value: rejectedRecs },
    ].filter(d => d.value > 0);

    // Monthly bar chart data (simulated from creation dates)
    const monthlyData = MONTHS.map((month, idx) => {
      const monthCustomers = customers.filter(c => new Date(c.createdAt).getMonth() === idx).length;
      const monthRecs = recommendations.filter(r => new Date(r.createdAt).getMonth() === idx).length;
      const monthProducts = products.filter(p => new Date(p.createdAt).getMonth() === idx).length;
      return { name: month, לקוחות: monthCustomers, המלצות: monthRecs, מוצרים: monthProducts };
    }).filter((_, idx) => idx <= new Date().getMonth());

    // Recent customers (last 5)
    const recentCustomers = [...customers].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    return {
      totalCustomers, totalProducts, totalRecs, openRecs, approvedRecs,
      inExecution, completedRecs, thinkingRecs, rejectedRecs, totalPremium, totalDeposit, totalMonthly,
      totalAccumulation, pendingFollowUps, moneyProducts, insuranceProducts,
      decisionData, monthlyData, recentCustomers, approvalRate,
    };
  }, [data]);

  const isEmpty = data.customers.length === 0;

  // Generate initials avatar color
  const avatarColor = (name: string) => {
    const colors = [
      `bg-[${PALETTE.mint}]/20 text-[${PALETTE.teal}]`,
      `bg-[${PALETTE.coral}]/20 text-[${PALETTE.coral}]`,
      `bg-[${PALETTE.orange}]/20 text-[${PALETTE.orange}]`,
      `bg-[${PALETTE.green}]/20 text-[${PALETTE.green}]`,
      'bg-gray-100 text-gray-600',
    ];
    return colors[name.length % colors.length];
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 17) return 'צהריים טובים';
    if (hour < 21) return 'ערב טוב';
    return 'לילה טוב';
  };

  if (isEmpty) {
    return (
      <div className="space-y-6 px-1 sm:px-0" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="max-w-2xl mx-auto py-6 sm:py-12">
            <Card className="text-center py-10 sm:py-16 border border-gray-100 shadow-lg rounded-3xl relative overflow-hidden bg-[#f8f9fc]">
              {/* Decorative circles like the landing page */}
              <div className="absolute top-6 right-8 w-16 h-16 rounded-full bg-[#5ec6c6] opacity-15" />
              <div className="absolute top-20 right-24 w-10 h-10 rounded-full bg-[#e76f51] opacity-15" />
              <div className="absolute bottom-10 left-12 w-12 h-12 rounded-full bg-[#f4a261] opacity-15" />
              <div className="absolute bottom-20 left-28 w-8 h-8 rounded-full bg-[#90be6d] opacity-15" />
              <CardContent className="flex flex-col items-center gap-5 sm:gap-6 relative z-10 px-4 sm:px-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                >
                  <SeeIDLogo size={70} showText showSubtitle className="mb-2 sm:hidden" />
                  <SeeIDLogo size={90} showText showSubtitle className="mb-2 hidden sm:block" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a3d3d]">{getGreeting()}, ברוכים הבאים!</h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed px-2">
                    התחל על ידי הוספת הלקוח הראשון שלך. המערכת תנתח את המוצרים ותייצר המלצות חכמות בעזרת AI.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={() => navigate('/app/customers/new')} size="lg" className="gap-2 rounded-full h-12 px-8 text-base font-bold shadow-md min-w-[200px] bg-[#0a3d3d] hover:bg-[#0d4a4a]">
                    <UserPlus className="h-5 w-5" />הוסף לקוח ראשון
                  </Button>
                </motion.div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-gray-500">
                  {[
                    { icon: Sparkles, text: 'המלצות AI אוטומטיות', color: PALETTE.mint },
                    { icon: Shield, text: 'ניהול תיק מלא', color: PALETTE.green },
                    { icon: BarChart3, text: 'דוחות וניתוח', color: PALETTE.orange },
                  ].map((f, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-1.5"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: f.color }}>
                        <f.icon className="h-3 w-3 text-white" />
                      </div>
                      {f.text}
                    </motion.span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto" dir="rtl">
      {/* Top header - premium */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-[#f8f9fc] rounded-2xl px-4 sm:px-6 py-4 sm:py-5 gap-3 border border-gray-100"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{ backgroundColor: PALETTE.teal }}>
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0a3d3d] tracking-tight truncate">{getGreeting()}</h1>
            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Recent customer avatars */}
          <div className="hidden md:flex items-center -space-x-2 space-x-reverse ml-2">
            {stats.recentCustomers.slice(0, 4).map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => navigate(`/app/customers/${c.id}`)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white hover:ring-2 hover:ring-[${PALETTE.mint}]/30 transition-all shadow-sm ${avatarColor(c.fullName)}`}
                title={c.fullName}
              >
                {c.firstName.charAt(0)}{c.lastName.charAt(0)}
              </motion.button>
            ))}
            {stats.totalCustomers > 4 && (
              <button
                onClick={() => navigate('/app/customers')}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border-2 border-white hover:bg-[#5ec6c6]/10 transition-colors"
              >
                +{stats.totalCustomers - 4}
              </button>
            )}
          </div>
          <Button onClick={() => navigate('/app/customers/new')} className="gap-2 rounded-full h-11 px-5 font-bold shadow-md text-sm min-h-[44px] bg-[#0a3d3d] hover:bg-[#0d4a4a]">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">לקוח חדש</span>
          </Button>
        </div>
      </motion.div>

      {/* Main grid: 2 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">

        {/* LEFT COLUMN (wider) -- Charts */}
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-8 space-y-4 sm:space-y-5">

          {/* Top stats strip - 2 cols on mobile, 4 on md+ */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'לקוחות פעילים', value: stats.totalCustomers, icon: Users, color: PALETTE.teal, path: '/app/customers' },
              { label: 'מוצרים בתיק', value: stats.totalProducts, icon: Shield, color: PALETTE.mint, path: '/app/customers' },
              { label: 'המלצות שאושרו', value: stats.completedRecs + stats.approvedRecs, icon: CheckCircle2, color: PALETTE.green, path: '/app/recommendation-bank' },
              { label: 'חיוב חודשי', value: `₪${stats.totalMonthly.toLocaleString()}`, icon: Wallet, color: PALETTE.orange, path: '/app/customers' },
            ].map((s) => (
              <motion.div key={s.label} variants={item} whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Card className="cursor-pointer hover:shadow-lg transition-all border border-gray-100 shadow-sm rounded-2xl active:scale-[0.98]" onClick={() => navigate(s.path)}>
                  <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-sm shrink-0" style={{ backgroundColor: s.color }}>
                      <s.icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl sm:text-2xl font-extrabold text-[#0a3d3d] tracking-tight truncate">{s.value}</div>
                      <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts row - stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5">
            {/* Donut chart */}
            <motion.div variants={item} className="md:col-span-2">
              <Card className="h-full border border-gray-100 shadow-sm rounded-2xl">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-[#0a3d3d] mb-3 sm:mb-4 self-start font-bold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.mint }}>
                      <Target className="h-3.5 w-3.5 text-white" />
                    </div>
                    התפלגות החלטות
                  </p>
                  {stats.decisionData.length > 0 ? (
                    <div className="relative w-full flex justify-center">
                      <ResponsiveContainer width={180} height={180} className="sm:!w-[200px] sm:!h-[200px]">
                        <PieChart>
                          <Pie
                            data={stats.decisionData}
                            cx="50%" cy="50%"
                            innerRadius={50} outerRadius={78}
                            paddingAngle={3} dataKey="value"
                            stroke="none"
                          >
                            {stats.decisionData.map((_, i) => (
                              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#0a3d3d]">{stats.totalRecs}</span>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-medium">המלצות</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[180px] sm:h-[200px] flex flex-col items-center justify-center text-gray-300">
                      <Target className="h-10 w-10 mb-2" />
                      <span className="text-xs text-gray-400">אין נתונים עדיין</span>
                    </div>
                  )}
                  {/* Avatars row */}
                  <div className="flex items-center -space-x-2 space-x-reverse mt-3 sm:mt-4 mb-2 sm:mb-3">
                    {stats.recentCustomers.slice(0, 5).map((c) => (
                      <div key={c.id} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold border-2 border-white shadow-sm ${avatarColor(c.fullName)}`}>
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>
                    ))}
                    {stats.totalCustomers > 5 && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-gray-500 border-2 border-white">+{stats.totalCustomers - 5}</div>
                    )}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 justify-center">
                    {stats.decisionData.slice(0, 5).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bar chart */}
            <motion.div variants={item} className="md:col-span-3">
              <Card className="h-full border border-gray-100 shadow-sm rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                    <p className="text-sm text-[#0a3d3d] font-bold flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.orange }}>
                        <Activity className="h-3.5 w-3.5 text-white" />
                      </div>
                      פעילות חודשית
                    </p>
                    <div className="flex gap-2 sm:gap-3">
                      {[
                        { label: 'לקוחות', color: PALETTE.teal },
                        { label: 'המלצות', color: PALETTE.mint },
                        { label: 'מוצרים', color: PALETTE.green },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                          <span className="text-[9px] sm:text-[10px] text-gray-500">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={160} className="sm:!h-[180px]">
                    <BarChart data={stats.monthlyData} barGap={2} barSize={10}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                      <RTooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="לקוחות" fill={PALETTE.teal} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="המלצות" fill={PALETTE.mint} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="מוצרים" fill={PALETTE.green} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick action cards */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'לקוח חדש', desc: 'הוסף לקוח ונתח מוצרים', icon: UserPlus, path: '/app/customers/new', color: PALETTE.teal },
              { label: 'יצירת המלצה', desc: 'המלצת AI חכמה', icon: Sparkles, path: '/app/recommendations/new', color: PALETTE.coral },
              { label: 'סיכום ביצועים', desc: 'תיעוד מה בוצע בפועל', icon: ClipboardCheck, path: '/app/customers', color: PALETTE.mint },
              { label: 'יומן פעולות', desc: 'כל הפעילות מתועדת', icon: FileText, path: '/app/activity-log', color: PALETTE.orange },
            ].map(action => (
              <Card key={action.label} className="cursor-pointer hover:shadow-lg transition-all group border border-gray-100 shadow-sm rounded-2xl active:scale-[0.98]" onClick={() => navigate(action.path)}>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: action.color }}>
                    <action.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0a3d3d] group-hover:text-[#5ec6c6] transition-colors">{action.label}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed hidden sm:block">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN -- Insights & Activity */}
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-4 space-y-4 sm:space-y-5">

          {/* Insights card */}
          <motion.div variants={item}>
            <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1.5" style={{ background: `linear-gradient(to left, ${PALETTE.mint}, ${PALETTE.teal})` }} />
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.green }}>
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-[#0a3d3d]">תובנות ופעולות נדרשות</h3>
                  </div>
                  {stats.approvalRate > 0 && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: PALETTE.green }}>
                      {stats.approvalRate}% אישור
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {/* Insight 1 */}
                  {stats.pendingFollowUps > 0 && (
                    <button onClick={() => navigate('/app/follow-up')} className="w-full text-right p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#5ec6c6]/40 hover:shadow-sm transition-all group min-h-[44px] active:scale-[0.99]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: PALETTE.orange }}>
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#0a3d3d]">פולו-אפ בהמתנה</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{stats.pendingFollowUps} לקוחות מחכים לתשובה שלך</p>
                        </div>
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 mt-1.5 group-hover:text-[#5ec6c6] group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )}

                  {/* Insight 2 */}
                  {stats.openRecs > 0 && (
                    <button onClick={() => navigate('/app/recommendation-bank')} className="w-full text-right p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#5ec6c6]/40 hover:shadow-sm transition-all group min-h-[44px] active:scale-[0.99]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: PALETTE.mint }}>
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#0a3d3d]">המלצות פתוחות</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{stats.openRecs} המלצות ממתינות לטיפול הלקוח</p>
                        </div>
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 mt-1.5 group-hover:text-[#5ec6c6] group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )}

                  {/* Insight 3 */}
                  {stats.inExecution > 0 && (
                    <button onClick={() => navigate('/app/execution')} className="w-full text-right p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#5ec6c6]/40 hover:shadow-sm transition-all group min-h-[44px] active:scale-[0.99]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: PALETTE.coral }}>
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#0a3d3d]">בתהליך ביצוע</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{stats.inExecution} המלצות בשלבי ביצוע שונים</p>
                        </div>
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 mt-1.5 group-hover:text-[#5ec6c6] group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )}

                  {/* Portfolio summary */}
                  <button onClick={() => navigate('/app/customers')} className="w-full text-right p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#5ec6c6]/40 hover:shadow-sm transition-all group min-h-[44px] active:scale-[0.99]">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: PALETTE.teal }}>
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#0a3d3d]">סיכום התיק</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{stats.moneyProducts} מוצרי כסף · {stats.insuranceProducts} ביטוח · ₪{stats.totalAccumulation.toLocaleString()} צבירה</p>
                      </div>
                      <ChevronLeft className="h-3.5 w-3.5 text-gray-300 mt-1.5 group-hover:text-[#5ec6c6] group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent customers */}
          <motion.div variants={item}>
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-sm font-bold text-[#0a3d3d] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.teal }}>
                      <Users className="h-3.5 w-3.5 text-white" />
                    </div>
                    לקוחות אחרונים
                  </p>
                  <button onClick={() => navigate('/app/customers')} className="text-[10px] font-bold flex items-center gap-0.5 min-h-[44px] px-3 rounded-full hover:bg-gray-50 transition-colors" style={{ color: PALETTE.mint }}>
                    הצג הכל
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  {stats.recentCustomers.map((c, i) => (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      onClick={() => navigate(`/app/customers/${c.id}`)}
                      className="w-full text-right flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group min-h-[44px] active:bg-gray-100"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor(c.fullName)} shadow-sm shrink-0`}>
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0a3d3d] truncate group-hover:text-[#5ec6c6] transition-colors">{c.fullName}</p>
                        <p className="text-[10px] text-gray-400">{c.status}</p>
                      </div>
                      <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">
                        {new Date(c.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent activity */}
          <motion.div variants={item}>
            <Card className="border border-gray-100 shadow-sm rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <p className="text-sm font-bold text-[#0a3d3d] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.coral }}>
                      <Clock className="h-3.5 w-3.5 text-white" />
                    </div>
                    פעילות אחרונה
                  </p>
                  <button onClick={() => navigate('/app/activity-log')} className="text-[10px] font-bold flex items-center gap-0.5 min-h-[44px] px-3 rounded-full hover:bg-gray-50 transition-colors" style={{ color: PALETTE.mint }}>
                    הצג הכל
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                </div>
                {data.activityLog.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">אין פעילות מתועדת עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto overscroll-contain">
                    {data.activityLog.slice(0, 8).map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2.5 py-2.5 border-b border-gray-50 last:border-0">
                        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0`} style={{
                          backgroundColor: entry.level === 'הצלחה' ? PALETTE.green : entry.level === 'אזהרה' ? PALETTE.orange : PALETTE.mint
                        }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-[#0a3d3d] truncate">{entry.title}</p>
                          {entry.detail && <p className="text-[10px] text-gray-400 truncate">{entry.detail}</p>}
                        </div>
                        <span className="text-[9px] text-gray-400 whitespace-nowrap mt-0.5 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">
                          {new Date(entry.timestamp).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
