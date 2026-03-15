import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, FileText, CheckCircle2, Clock, TrendingUp, ArrowUpRight,
  Sparkles, LayoutDashboard, UserPlus, Bell, Zap, ArrowLeft,
  Shield, Wallet, Target, AlertTriangle, ChevronLeft, ClipboardCheck,
  Activity, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';

const CHART_GREENS = [
  'hsl(152, 42%, 30%)',
  'hsl(152, 38%, 42%)',
  'hsl(160, 42%, 55%)',
  'hsl(160, 35%, 68%)',
  'hsl(152, 25%, 78%)',
];

const DONUT_COLORS = [
  'hsl(152, 42%, 35%)',
  'hsl(160, 42%, 55%)',
  'hsl(35, 35%, 75%)',
  'hsl(0, 55%, 72%)',
  'hsl(355, 50%, 76%)',
  'hsl(210, 25%, 72%)',
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
      'bg-seeld-mint/20 text-seeld-teal',
      'bg-seeld-coral/20 text-seeld-coral',
      'bg-seeld-sky/20 text-info',
      'bg-seeld-sand/20 text-accent',
      'bg-seeld-blush/20 text-seeld-blush',
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
      <div className="space-y-6" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="max-w-2xl mx-auto py-12">
            <Card className="text-center py-16 border-0 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
              <CardContent className="flex flex-col items-center gap-6 relative z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                >
                  <SeeIDLogo size={90} showText showSubtitle className="mb-2" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">{getGreeting()}, ברוכים הבאים!</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    התחל על ידי הוספת הלקוח הראשון שלך. המערכת תנתח את המוצרים ותייצר המלצות חכמות בעזרת AI.
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={() => navigate('/app/customers/new')} size="lg" className="gap-2 rounded-xl h-12 px-8 text-base font-bold shadow-md">
                    <UserPlus className="h-5 w-5" />הוסף לקוח ראשון
                  </Button>
                </motion.div>
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
                  {[
                    { icon: Sparkles, text: 'המלצות AI אוטומטיות' },
                    { icon: Shield, text: 'ניהול תיק מלא' },
                    { icon: BarChart3, text: 'דוחות וניתוח' },
                  ].map((f, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-1.5"
                    >
                      <f.icon className="h-3.5 w-3.5 text-primary/60" />
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
    <div className="space-y-6" dir="rtl">
      {/* Top header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{getGreeting()}</h1>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Recent customer avatars */}
          <div className="hidden md:flex items-center -space-x-2 space-x-reverse ml-3">
            {stats.recentCustomers.slice(0, 4).map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => navigate(`/app/customers/${c.id}`)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background hover:ring-2 hover:ring-primary/30 transition-all ${avatarColor(c.fullName)}`}
                title={c.fullName}
              >
                {c.firstName.charAt(0)}{c.lastName.charAt(0)}
              </motion.button>
            ))}
            {stats.totalCustomers > 4 && (
              <button
                onClick={() => navigate('/app/customers')}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border-2 border-background hover:bg-primary/10 transition-colors"
              >
                +{stats.totalCustomers - 4}
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/customers/new')} className="gap-1.5 rounded-lg shadow-sm">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">לקוח חדש</span>
          </Button>
        </div>
      </motion.div>

      {/* Main grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT COLUMN (wider) -- Charts */}
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-8 space-y-5">

          {/* Top stats strip */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'לקוחות פעילים', value: stats.totalCustomers, icon: Users, color: 'text-seeld-teal', bg: 'bg-gradient-to-br from-seeld-mint/15 to-seeld-mint/5', path: '/app/customers' },
              { label: 'מוצרים בתיק', value: stats.totalProducts, icon: Shield, color: 'text-info', bg: 'bg-gradient-to-br from-seeld-sky/15 to-seeld-sky/5', path: '/app/customers' },
              { label: 'המלצות שאושרו', value: stats.completedRecs + stats.approvedRecs, icon: CheckCircle2, color: 'text-success', bg: 'bg-gradient-to-br from-seeld-mint/15 to-seeld-mint/5', path: '/app/recommendation-bank' },
              { label: 'חיוב חודשי', value: `₪${stats.totalMonthly.toLocaleString()}`, icon: Wallet, color: 'text-accent', bg: 'bg-gradient-to-br from-seeld-sand/15 to-seeld-sand/5', path: '/app/customers' },
            ].map((s, i) => (
              <motion.div key={s.label} variants={item} whileHover={{ y: -2, scale: 1.01 }}>
                <Card className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm" onClick={() => navigate(s.path)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} shadow-sm`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xl font-bold text-foreground tracking-tight">{s.value}</div>
                      <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Donut chart */}
            <motion.div variants={item}>
              <Card className="h-full border-0 shadow-sm">
                <CardContent className="p-5 flex flex-col items-center justify-center h-full">
                  <p className="text-xs text-muted-foreground mb-3 self-start font-semibold flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    התפלגות החלטות
                  </p>
                  {stats.decisionData.length > 0 ? (
                    <div className="relative">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={stats.decisionData}
                            cx="50%" cy="50%"
                            innerRadius={48} outerRadius={72}
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
                        <span className="text-2xl font-extrabold text-foreground">{stats.totalRecs}</span>
                        <span className="text-[10px] text-muted-foreground">המלצות</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[160px] flex items-center justify-center text-muted-foreground text-xs">אין נתונים</div>
                  )}
                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    {stats.decisionData.slice(0, 4).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                        <span className="text-[9px] text-muted-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Bar chart */}
            <motion.div variants={item} className="md:col-span-4">
              <Card className="h-full border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      פעילות חודשית
                    </p>
                    <div className="flex gap-3">
                      {[
                        { label: 'לקוחות', color: CHART_GREENS[0] },
                        { label: 'המלצות', color: CHART_GREENS[2] },
                        { label: 'מוצרים', color: CHART_GREENS[4] },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                          <span className="text-[10px] text-muted-foreground">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.monthlyData} barGap={2} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(35, 16%, 90%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(30, 8%, 48%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(30, 8%, 48%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(35, 16%, 86%)' }} />
                      <Bar dataKey="לקוחות" fill={CHART_GREENS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="המלצות" fill={CHART_GREENS[2]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="מוצרים" fill={CHART_GREENS[4]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick action cards -- bottom row */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'לקוח חדש', desc: 'הוסף לקוח ונתח מוצרים', icon: UserPlus, path: '/app/customers/new', bg: 'bg-gradient-to-br from-seeld-mint/12 to-seeld-mint/4', color: 'text-seeld-teal' },
              { label: 'יצירת המלצה', desc: 'המלצת AI חכמה', icon: Sparkles, path: '/app/recommendations/new', bg: 'bg-gradient-to-br from-seeld-coral/12 to-seeld-coral/4', color: 'text-seeld-coral' },
              { label: 'סיכום ביצועים', desc: 'תיעוד מה בוצע בפועל', icon: ClipboardCheck, path: '/app/customers', bg: 'bg-gradient-to-br from-primary/12 to-primary/4', color: 'text-primary' },
              { label: 'יומן פעולות', desc: 'כל הפעילות מתועדת', icon: FileText, path: '/app/activity-log', bg: 'bg-gradient-to-br from-seeld-sand/12 to-seeld-sand/4', color: 'text-accent' },
            ].map(action => (
              <Card key={action.label} className="cursor-pointer hover:shadow-md transition-all group border-0 shadow-sm" onClick={() => navigate(action.path)}>
                <CardContent className="p-4 space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.bg} group-hover:scale-110 transition-transform shadow-sm`}>
                    <action.icon className={`h-4.5 w-4.5 ${action.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{action.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN -- Insights & Activity */}
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-4 space-y-5">

          {/* Insights card */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-l from-primary/60 via-primary/30 to-transparent" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">תובנות ופעולות נדרשות</h3>
                  </div>
                  {stats.approvalRate > 0 && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {stats.approvalRate}% אישור
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {/* Insight 1 */}
                  {stats.pendingFollowUps > 0 && (
                    <button onClick={() => navigate('/app/follow-up')} className="w-full text-right p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                          <Bell className="h-4 w-4 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">פולו-אפ בהמתנה</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.pendingFollowUps} לקוחות מחכים לתשובה שלך</p>
                        </div>
                        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 mt-1.5 group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )}

                  {/* Insight 2 */}
                  {stats.openRecs > 0 && (
                    <button onClick={() => navigate('/app/recommendation-bank')} className="w-full text-right p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-seeld-mint/15 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-seeld-teal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">המלצות פתוחות</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.openRecs} המלצות ממתינות לטיפול הלקוח</p>
                        </div>
                        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 mt-1.5 group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )}

                  {/* Insight 3 */}
                  {stats.inExecution > 0 && (
                    <button onClick={() => navigate('/app/execution')} className="w-full text-right p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-seeld-coral/10 flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4 text-seeld-coral" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">בתהליך ביצוע</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.inExecution} המלצות בשלבי ביצוע שונים</p>
                        </div>
                        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 mt-1.5 group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  )}

                  {/* Portfolio summary -- always show */}
                  <button onClick={() => navigate('/app/customers')} className="w-full text-right p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">סיכום התיק</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{stats.moneyProducts} מוצרי כסף · {stats.insuranceProducts} ביטוח · ₪{stats.totalAccumulation.toLocaleString()} צבירה</p>
                      </div>
                      <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 mt-1.5 group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent customers */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    לקוחות אחרונים
                  </p>
                  <button onClick={() => navigate('/app/customers')} className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5">
                    הצג הכל
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {stats.recentCustomers.map((c, i) => (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      onClick={() => navigate(`/app/customers/${c.id}`)}
                      className="w-full text-right flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor(c.fullName)} shadow-sm`}>
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{c.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.status}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
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
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    פעילות אחרונה
                  </p>
                  <button onClick={() => navigate('/app/activity-log')} className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5">
                    הצג הכל
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                </div>
                {data.activityLog.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">אין פעילות מתועדת עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {data.activityLog.slice(0, 8).map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-0">
                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                          entry.level === 'הצלחה' ? 'bg-seeld-mint' : entry.level === 'אזהרה' ? 'bg-warning' : 'bg-seeld-sky'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-foreground truncate">{entry.title}</p>
                          {entry.detail && <p className="text-[10px] text-muted-foreground truncate">{entry.detail}</p>}
                        </div>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-0.5 bg-muted/50 px-1.5 py-0.5 rounded">
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
