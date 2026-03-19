import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { supabase as agentSupabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import SeeIDLogo from "@/components/SeeIDLogo";
import {
  Loader2, Mail, ShieldCheck, ArrowLeft, Shield, Lock,
  LayoutDashboard, FileText, Users, UserPlus, Send,
  Settings, LogOut, Menu, X, TrendingUp, Eye,
  MessageSquare, Trash2, Clock, CheckCircle2, XCircle,
  Plus, Search, Filter, RefreshCw, Download, ChevronDown,
  ChevronUp, Phone, Link2, Copy, Edit3, Save,
  BarChart3, UserCheck, Bot, Sparkles, AlertTriangle,
  Globe, PenTool, CreditCard, User, MapPin, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════

const ADMIN_EMAIL = "shmulik@seeld-ins.co.il";

type AdminTab =
  | "overview"
  | "blog"
  | "leads"
  | "client-invites"
  | "agent-management"
  | "onboarding"
  | "directdebit"
  | "settings";

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "סקירה כללית", icon: LayoutDashboard },
  { id: "blog", label: "ניהול בלוג", icon: PenTool },
  { id: "leads", label: "לידים ופניות", icon: MessageSquare },
  { id: "client-invites", label: "הזמנת לקוחות", icon: Link2 },
  { id: "agent-management", label: "ניהול סוכנים", icon: UserPlus },
  { id: "onboarding", label: "שאלוני הצטרפות", icon: Users },
  { id: "directdebit", label: "טפסי הוראת קבע", icon: CreditCard },
  { id: "settings", label: "הגדרות", icon: Settings },
];

// ══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════

export default function SiteAdmin() {
  const { user, loading: authLoading, signInWithOtp, verifyOtp, signInWithGoogle, signOut } = useAuth();
  const [step, setStep] = useState<"login" | "otp" | "denied" | "admin">("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine auth state
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      if (user.email === ADMIN_EMAIL) {
        setStep("admin");
      } else {
        setStep("denied");
      }
    } else {
      setStep("login");
    }
  }, [user, authLoading]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      toast.error("כתובת מייל לא מורשית");
      return;
    }
    setLoading(true);
    try {
      const { error } = await signInWithOtp(email);
      if (error) throw error;
      setStep("otp");
      toast.success("קוד חד-פעמי נשלח למייל");
    } catch {
      toast.error("שגיאה בשליחת הקוד");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await verifyOtp(email, otp);
      if (error) throw error;
    } catch {
      toast.error("קוד שגוי, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setStep("login");
    setEmail("");
    setOtp("");
  };

  // ── Loading state ──
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a3d3d]" />
      </div>
    );
  }

  // ── Denied ──
  if (step === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] px-4" dir="rtl">
        <div className="bg-white rounded-2xl p-8 shadow-lg border max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">אין הרשאה</h2>
          <p className="text-gray-500 text-sm mb-6">
            המייל {user?.email} אינו מורשה לגשת לממשק הניהול.
          </p>
          <Button onClick={handleSignOut} variant="outline" className="rounded-full gap-2">
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>
      </div>
    );
  }

  // ── Login / OTP ──
  if (step === "login" || step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <div className="bg-white rounded-2xl border shadow-lg p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0a3d3d 0%, #0d4a4a 100%)" }}
              >
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0a3d3d]">ניהול האתר</h1>
                <p className="text-sm text-gray-400">SEELD Site Admin</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Google Login — primary */}
                  <Button
                    variant="outline"
                    className="w-full gap-3 h-12 rounded-full text-sm font-medium border-gray-200 hover:bg-gray-50 shadow-sm"
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await signInWithGoogle("/site-admin");
                      if (error) { toast.error("שגיאה בהתחברות"); setLoading(false); }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    התחבר עם Google
                  </Button>

                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">או</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* OTP fallback */}
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        dir="ltr"
                        className="h-12 pr-10 rounded-full text-sm border-gray-200 focus-visible:ring-[#0a3d3d]/30 text-left"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full h-11 rounded-full gap-2 text-sm border-gray-200 hover:bg-gray-50"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      שלח קוד כניסה למייל
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="bg-[#e0f2f1] rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0a3d3d] shrink-0" />
                    <p className="text-xs text-[#0a3d3d]/80">
                      קוד נשלח ל-<span className="font-semibold" dir="ltr">{email}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} dir="ltr">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 rounded-full font-semibold bg-[#0a3d3d] hover:bg-[#0d4a4a] shadow-lg shadow-[#0a3d3d]/20"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת והיכנס"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep("login"); setOtp(""); }}
                    className="w-full text-sm text-gray-400 hover:text-[#0a3d3d]"
                  >
                    חזרה
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
            <Lock className="w-3 h-3" />
            <span className="text-[10px]">גישה מורשית בלבד</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  //  ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex" dir="rtl">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-[260px] border-l bg-white shrink-0 sticky top-0 h-screen">
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: 260 }}
              animate={{ x: 0 }}
              exit={{ x: 260 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-[260px] bg-white z-50 shadow-xl lg:hidden"
            >
              <SidebarContent
                activeTab={activeTab}
                setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false); }}
                onSignOut={handleSignOut}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#0a3d3d]">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">ניהול ופיקוח על אתר SEELD</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="hidden sm:inline">{ADMIN_EMAIL}</span>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === "overview" && <OverviewModule />}
          {activeTab === "blog" && <BlogModule />}
          {activeTab === "leads" && <LeadsModule />}
          {activeTab === "client-invites" && <ClientInvitesModule />}
          {activeTab === "agent-management" && <AgentManagementModule />}
          {activeTab === "onboarding" && <OnboardingModule />}
          {activeTab === "directdebit" && <DirectDebitModule />}
          {activeTab === "settings" && <SettingsModule />}
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════════════

function SidebarContent({
  activeTab,
  setActiveTab,
  onSignOut,
}: {
  activeTab: AdminTab;
  setActiveTab: (t: AdminTab) => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #0a3d3d 0%, #0d4a4a 100%)" }}
        >
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-[#0a3d3d]">SEELD Admin</p>
          <p className="text-[10px] text-gray-400">ניהול האתר</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-right",
                isActive
                  ? "bg-[#0a3d3d] text-white shadow-md shadow-[#0a3d3d]/15"
                  : "text-gray-600 hover:bg-gray-100 hover:text-[#0a3d3d]"
              )}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ══════════════════════════════════════════════════════

function StatCard({ icon, color, bg, label, value }: {
  icon: React.ReactNode; color: string; bg: string; label: string; value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: bg, color }}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold text-[#0a3d3d]">{value}</p>
          <p className="text-[11px] text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ModuleHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold text-[#0a3d3d]">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: {
  icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Overview
// ══════════════════════════════════════════════════════

function OverviewModule() {
  const [stats, setStats] = useState({ leads: 0, onboarding: 0, blogPosts: 0, contacts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [leadsRes, onboardingRes, blogRes, contactRes] = await Promise.all([
        siteSupabase.from("insurance_leads").select("id", { count: "exact", head: true }),
        siteSupabase.from("onboarding_submissions").select("id", { count: "exact", head: true }),
        siteSupabase.from("blog_posts").select("id", { count: "exact", head: true }),
        siteSupabase.from("contact_submissions").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        leads: (leadsRes.count ?? 0) + (contactRes.count ?? 0),
        onboarding: onboardingRes.count ?? 0,
        blogPosts: blogRes.count ?? 0,
        contacts: contactRes.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0a3d3d]" /></div>;

  return (
    <div className="space-y-6">
      <ModuleHeader title="סקירה כללית" subtitle="סטטיסטיקות ומצב כללי של האתר" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<MessageSquare className="w-5 h-5" />} color="#0a3d3d" bg="#e0f2f1" label="לידים ופניות" value={stats.leads} />
        <StatCard icon={<Users className="w-5 h-5" />} color="#6366f1" bg="#ede9fe" label="שאלוני הצטרפות" value={stats.onboarding} />
        <StatCard icon={<PenTool className="w-5 h-5" />} color="#f59e0b" bg="#fef3c7" label="פוסטים בבלוג" value={stats.blogPosts} />
        <StatCard icon={<Mail className="w-5 h-5" />} color="#e76f51" bg="#fee2e2" label="פניות צור קשר" value={stats.contacts} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          icon={<UserPlus className="w-6 h-6 text-white" />}
          gradient="linear-gradient(135deg, #0a3d3d 0%, #125555 100%)"
          title="הזמן סוכן חדש"
          subtitle="שלח לינק הזמנה לסוכן חדש"
        />
        <QuickActionCard
          icon={<Link2 className="w-6 h-6 text-white" />}
          gradient="linear-gradient(135deg, #5ec6c6 0%, #3ba8a8 100%)"
          title="הזמן לקוח לאזור אישי"
          subtitle="שלח לינק כניסה ללקוח קיים"
        />
        <QuickActionCard
          icon={<PenTool className="w-6 h-6 text-white" />}
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          title="כתוב פוסט חדש"
          subtitle="הוסף תוכן לבלוג האתר"
        />
      </div>
    </div>
  );
}

function QuickActionCard({ icon, gradient, title, subtitle }: {
  icon: React.ReactNode; gradient: string; title: string; subtitle: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-all cursor-pointer group">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <h4 className="font-bold text-[#0a3d3d] mb-0.5">{title}</h4>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Blog Management
// ══════════════════════════════════════════════════════

type BlogPost = {
  id: string; slug: string; title: string; excerpt: string | null;
  category: string | null; status: string | null; published_at: string | null; created_at: string;
};

function BlogModule() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await siteSupabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, category, status, published_at, created_at")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = posts.filter(p =>
    !search || p.title.includes(search) || p.slug.includes(search)
  );

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את הפוסט?")) return;
    const { error } = await siteSupabase.from("blog_posts").delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    toast.success("הפוסט נמחק");
    fetchPosts();
  };

  return (
    <div>
      <ModuleHeader
        title="ניהול בלוג"
        subtitle={`${posts.length} פוסטים`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש פוסט..."
                className="pr-10 rounded-full h-10 w-[200px] border-gray-200"
              />
            </div>
            <Button onClick={fetchPosts} variant="outline" size="icon" className="rounded-full">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0a3d3d]" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<PenTool className="w-8 h-8" />} title="אין פוסטים" subtitle="עדיין לא פורסמו פוסטים בבלוג" />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-4 border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-[#0a3d3d] truncate">{post.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {post.category && <span className="bg-[#e0f2f1] text-[#0a3d3d] px-2 py-0.5 rounded-full text-[10px] font-medium">{post.category}</span>}
                  <span>{new Date(post.created_at).toLocaleDateString("he-IL")}</span>
                  <span className={post.status === "published" ? "text-green-600" : "text-gray-400"}>
                    {post.status === "published" ? "פורסם" : "טיוטה"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 mr-3">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Leads
// ══════════════════════════════════════════════════════

function LeadsModule() {
  const [leads, setLeads] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"leads" | "contacts">("leads");

  useEffect(() => {
    const fetch = async () => {
      const [leadsRes, contactsRes] = await Promise.all([
        siteSupabase.from("insurance_leads").select("*").order("created_at", { ascending: false }).limit(50),
        siteSupabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setLeads(leadsRes.data ?? []);
      setContacts(contactsRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0a3d3d]" /></div>;

  return (
    <div>
      <ModuleHeader title="לידים ופניות" subtitle={`${leads.length} לידים | ${contacts.length} פניות`} />

      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "leads" ? "default" : "outline"}
          className={cn("rounded-full gap-2", tab === "leads" && "bg-[#0a3d3d] hover:bg-[#0d4a4a]")}
          onClick={() => setTab("leads")}
        >
          <TrendingUp className="w-4 h-4" />
          לידים ({leads.length})
        </Button>
        <Button
          variant={tab === "contacts" ? "default" : "outline"}
          className={cn("rounded-full gap-2", tab === "contacts" && "bg-[#0a3d3d] hover:bg-[#0d4a4a]")}
          onClick={() => setTab("contacts")}
        >
          <Mail className="w-4 h-4" />
          פניות ({contacts.length})
        </Button>
      </div>

      {tab === "leads" ? (
        leads.length === 0 ? (
          <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="אין לידים" subtitle="טרם הגיעו לידים מהאתר" />
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#0a3d3d]">{lead.full_name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span dir="ltr">{lead.phone}</span>
                      <span>{lead.email}</span>
                      <span className="bg-[#e0f2f1] text-[#0a3d3d] px-2 py-0.5 rounded-full text-[10px] font-medium">{lead.insurance_type}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString("he-IL")}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        contacts.length === 0 ? (
          <EmptyState icon={<Mail className="w-8 h-8" />} title="אין פניות" subtitle="טרם הגיעו פניות צור קשר" />
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#0a3d3d]">{c.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                    {c.message && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.message}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(c.created_at).toLocaleDateString("he-IL")}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Client Invites (Personal Area)
// ══════════════════════════════════════════════════════

function ClientInvitesModule() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const handleSend = async () => {
    if (!email) { toast.error("יש להזין אימייל"); return; }
    setSending(true);
    try {
      const { error } = await siteSupabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/personal-area`,
        },
      });
      if (error) throw error;
      toast.success(`לינק כניסה נשלח ל-${name || email}`);
      setSent(prev => [...prev, `${name || email} (${email}) — ${new Date().toLocaleTimeString("he-IL")}`]);
      setEmail("");
      setName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/personal-area`);
    toast.success("הקישור הועתק!");
  };

  return (
    <div>
      <ModuleHeader title="הזמנת לקוחות לאזור האישי" subtitle="שלח לינק כניסה ללקוחות קיימים" />

      <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
        <h3 className="font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          שלח לינק כניסה
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs font-medium text-[#0a3d3d]">שם הלקוח</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              className="mt-1 rounded-full border-gray-200"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-[#0a3d3d]">אימייל</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@email.com"
              dir="ltr"
              className="mt-1 rounded-full border-gray-200 text-left"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSend}
            disabled={sending || !email}
            className="gap-2 rounded-full bg-[#0a3d3d] hover:bg-[#0d4a4a] shadow-lg shadow-[#0a3d3d]/15"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            שלח לינק
          </Button>
          <Button variant="outline" onClick={handleCopyLink} className="gap-2 rounded-full border-gray-200">
            <Copy className="w-4 h-4" />
            העתק קישור
          </Button>
        </div>
      </div>

      {/* Sent log */}
      {sent.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h4 className="text-sm font-bold text-[#0a3d3d] mb-3">נשלחו היום ({sent.length})</h4>
          <div className="space-y-2">
            {sent.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-[#e0f2f1]/50 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Agent Management
// ══════════════════════════════════════════════════════

function AgentManagementModule() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Get agency from profiles
    const { data: agencies } = await agentSupabase.from("agencies").select("id, name").limit(1);
    const agencyId = agencies?.[0]?.id;

    if (agencyId) {
      const [agentsRes, invRes] = await Promise.all([
        agentSupabase.from("profiles").select("id, full_name, phone, role, created_at").eq("agency_id", agencyId),
        agentSupabase.from("agency_invitations").select("*").eq("agency_id", agencyId).order("created_at", { ascending: false }),
      ]);
      setAgents(agentsRes.data ?? []);
      setInvitations(invRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("כתובת אימייל לא תקינה");
      return;
    }

    setSending(true);
    try {
      const { data: agencies } = await agentSupabase.from("agencies").select("id, name").limit(1);
      const agency = agencies?.[0];
      if (!agency) throw new Error("לא נמצאה סוכנות");

      const res = await agentSupabase.functions.invoke("invite-agent", {
        body: {
          email: email.trim().toLowerCase(),
          agencyId: agency.id,
          agencyName: agency.name,
          inviterName: "מנהל המערכת",
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success(`הזמנה נשלחה ל-${email}`);
      setEmail("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "שגיאה בשליחת ההזמנה");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    const { error } = await agentSupabase.from("agency_invitations").delete().eq("id", id);
    if (error) { toast.error("שגיאה במחיקה"); return; }
    toast.success("ההזמנה נמחקה");
    fetchData();
  };

  const handleResend = async (inv: any) => {
    setSending(true);
    try {
      const { data: agencies } = await agentSupabase.from("agencies").select("id, name").limit(1);
      const agency = agencies?.[0];
      if (!agency) throw new Error("לא נמצאה סוכנות");

      const res = await agentSupabase.functions.invoke("invite-agent", {
        body: {
          email: inv.email,
          agencyId: agency.id,
          agencyName: agency.name,
          inviterName: "מנהל המערכת",
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`הזמנה נשלחה מחדש ל-${inv.email}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "שגיאה בשליחה מחדש");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0a3d3d]" /></div>;

  return (
    <div>
      <ModuleHeader title="ניהול סוכנים" subtitle="הקם סוכנים חדשים ושלח הזמנות" />

      {/* Invite form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
        <h3 className="font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          הזמן סוכן חדש
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-xs font-medium text-[#0a3d3d]">אימייל הסוכן</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
              dir="ltr"
              className="mt-1 rounded-full border-gray-200 text-left"
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <Button
            onClick={handleInvite}
            disabled={sending || !email.trim()}
            className="gap-2 rounded-full bg-[#0a3d3d] hover:bg-[#0d4a4a] shadow-lg shadow-[#0a3d3d]/15"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            שלח הזמנה
          </Button>
        </div>
      </div>

      {/* Active agents */}
      {agents.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
          <h4 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            סוכנים פעילים ({agents.length})
          </h4>
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #0a3d3d, #0d4a4a)" }}>
                    {a.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#0a3d3d]">{a.full_name}</p>
                    {a.phone && <p className="text-[11px] text-gray-400" dir="ltr">{a.phone}</p>}
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-2.5 py-1 rounded-full",
                  a.role === "admin" ? "bg-[#e0f2f1] text-[#0a3d3d]" : "bg-gray-100 text-gray-500"
                )}>
                  {a.role === "admin" ? "מנהל" : "סוכן"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h4 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            הזמנות ({invitations.length})
          </h4>
          <div className="space-y-2">
            {invitations.map((inv) => {
              const isExpired = inv.expires_at && new Date(inv.expires_at) < new Date();
              const isAccepted = inv.status === "accepted";
              return (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono" dir="ltr">{inv.email}</span>
                    {isAccepted ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />התקבלה
                      </span>
                    ) : isExpired ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />פג תוקף
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />ממתינה
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {inv.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => handleResend(inv)} disabled={sending} className="h-8 text-xs gap-1 rounded-full">
                        <Send className="w-3 h-3" />שלח שוב
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteInvitation(inv.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Onboarding Submissions (migrated from old Admin)
// ══════════════════════════════════════════════════════

function OnboardingModule() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await siteSupabase
        .from("onboarding_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      setSubmissions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = submissions.filter(s => {
    const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
    return !search || name.includes(search.toLowerCase()) || (s.phone ?? "").includes(search) || (s.email ?? "").includes(search.toLowerCase());
  });

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0a3d3d]" /></div>;

  return (
    <div>
      <ModuleHeader
        title="שאלוני הצטרפות"
        subtitle={`${submissions.length} שאלונים`}
        action={
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש..." className="pr-10 rounded-full h-10 w-[200px] border-gray-200" />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="אין שאלונים" subtitle="טרם הוגשו שאלוני הצטרפות" />
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const fullName = [s.first_name, s.last_name].filter(Boolean).join(" ") || "—";
            return (
              <div key={s.id} className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e0f2f1] flex items-center justify-center text-[#0a3d3d] font-bold text-sm">
                      {(s.first_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#0a3d3d]">{fullName}</h4>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        {s.phone && <span dir="ltr">{s.phone}</span>}
                        {s.email && <span>{s.email}</span>}
                        {s.city && <span>{s.city}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      s.status === "new" ? "bg-blue-100 text-blue-700" :
                      s.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                      s.status === "closed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {s.status === "new" ? "חדש" : s.status === "in_progress" ? "בטיפול" : s.status === "closed" ? "סגור" : s.status}
                    </span>
                    <span>{new Date(s.created_at).toLocaleDateString("he-IL")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Direct Debit
// ══════════════════════════════════════════════════════

function DirectDebitModule() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDD = async () => {
      // Try fetching via the admin-verify edge function (same as old admin)
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ password: "seeld2024!", action: "fetch" }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data.ddSubmissions || []);
        }
      } catch {
        // Silent fail
      }
      setLoading(false);
    };
    fetchDD();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0a3d3d]" /></div>;

  return (
    <div>
      <ModuleHeader title="טפסי הוראת קבע" subtitle={`${submissions.length} טפסים`} />

      {submissions.length === 0 ? (
        <EmptyState icon={<CreditCard className="w-8 h-8" />} title="אין טפסים" subtitle="טרם הוגשו טפסי הוראת קבע" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-right py-3 px-4 font-medium text-gray-500">תאריך</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">שם לקוח</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">בעל חשבון</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">בנק</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">סניף</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">מספר חשבון</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400">{new Date(s.created_at).toLocaleDateString("he-IL")}</td>
                  <td className="py-3 px-4 font-medium text-[#0a3d3d]">{[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}</td>
                  <td className="py-3 px-4">{s.account_owner ?? "—"}</td>
                  <td className="py-3 px-4">{s.bank_name ?? "—"}</td>
                  <td className="py-3 px-4">{s.bank_branch ?? "—"}</td>
                  <td className="py-3 px-4 font-mono font-bold">{s.bank_account ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Settings
// ══════════════════════════════════════════════════════

function SettingsModule() {
  return (
    <div>
      <ModuleHeader title="הגדרות" subtitle="הגדרות כלליות של האתר" />

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            פרטי האתר
          </h3>
          <div className="space-y-4">
            <InfoRow label="כתובת האתר" value="seeld.co.il" />
            <InfoRow label="אימייל מנהל" value={ADMIN_EMAIL} />
            <InfoRow label="טלפון" value="052-309-7444" />
            <InfoRow label="פלטפורמה" value="Vercel + Supabase" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            אבטחה
          </h3>
          <div className="space-y-4">
            <InfoRow label="אימות" value="OTP (קוד חד-פעמי למייל)" />
            <InfoRow label="מייל מורשה" value={ADMIN_EMAIL} />
            <InfoRow label="SSL" value="פעיל" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            קישורים מהירים
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LinkButton label="אתר ראשי" href="/" />
            <LinkButton label="אזור אישי ללקוחות" href="/personal-area" />
            <LinkButton label="מערכת סוכנים" href="/app/auth" />
            <LinkButton label="בלוג" href="/blog" />
            <LinkButton label="שאלון הצטרפות" href="/onboarding" />
            <LinkButton label="צור קשר" href="/contact" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-[#0a3d3d]" dir="ltr">{value}</span>
    </div>
  );
}

function LinkButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0a3d3d]/30 hover:bg-[#e0f2f1]/30 text-sm text-[#0a3d3d] font-medium transition-all"
    >
      <Globe className="w-4 h-4 text-gray-400" />
      {label}
    </a>
  );
}
