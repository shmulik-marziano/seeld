import { useState, useEffect, useCallback, Component, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { supabase as agentSupabase } from "@/integrations/supabase/client";

// Error boundary to catch runtime crashes
class AdminErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, maxWidth: 500, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h2 style={{ color: '#e76f51', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>שגיאה בטעינת מנהל האתר</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{ background: '#0a3d3d', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 50, cursor: 'pointer', fontWeight: 700 }}>
              נסה שוב
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  | "analytics"
  | "blog"
  | "leads"
  | "client-invites"
  | "agent-management"
  | "onboarding"
  | "directdebit"
  | "settings";

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "סקירה כללית", icon: LayoutDashboard },
  { id: "analytics", label: "אנליטיקה", icon: BarChart3 },
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

const ADMIN_PIN = "seeld2024!";

function SiteAdminInner() {
  let user: any = null, authLoading = false, signInWithOtp: any = () => Promise.resolve({ error: null }),
      verifyOtp: any = () => Promise.resolve({ error: null }), signInWithGoogle: any = () => Promise.resolve({ error: null }),
      signOut: any = () => Promise.resolve();
  try {
    const auth = useAuth();
    user = auth.user; authLoading = auth.loading;
    signInWithOtp = auth.signInWithOtp; verifyOtp = auth.verifyOtp;
    signInWithGoogle = auth.signInWithGoogle; signOut = auth.signOut;
  } catch { /* auth context not available — PIN login still works */ }
  const [step, setStep] = useState<"login" | "otp" | "magic-sent" | "denied" | "admin">("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Check if already authenticated via pin (session storage)
  useEffect(() => {
    if (sessionStorage.getItem("seeld_admin_auth") === "true") {
      setStep("admin");
    }
  }, []);

  // Determine auth state
  useEffect(() => {
    if (sessionStorage.getItem("seeld_admin_auth") === "true") return;
    if (authLoading) return;
    if (user) {
      if (user.email === ADMIN_EMAIL) {
        setStep("admin");
      } else {
        setStep("denied");
      }
    } else {
      if (step === "admin" || step === "denied") setStep("login");
    }
  }, [user, authLoading]);

  const handlePinLogin = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("seeld_admin_auth", "true");
      setStep("admin");
      setPinError("");
    } else {
      setPinError("סיסמה שגויה");
    }
  };

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendMagicLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const targetEmail = email || ADMIN_EMAIL;
    if (targetEmail.toLowerCase() !== ADMIN_EMAIL) {
      toast.error("כתובת מייל לא מורשית");
      return;
    }
    setEmail(targetEmail);
    setLoading(true);
    try {
      // Send magic link (not OTP code) — more reliable delivery
      const { error } = await siteSupabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin + "/site-admin",
        },
      });
      if (error) throw error;
      setStep("magic-sent");
      setResendTimer(60);
      toast.success("לינק כניסה נשלח למייל!");
    } catch {
      toast.error("שגיאה בשליחה. נסה Google login.");
    } finally {
      setLoading(false);
    }
  };

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
      setResendTimer(60);
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
    sessionStorage.removeItem("seeld_admin_auth");
    await signOut();
    setStep("login");
    setEmail("");
    setOtp("");
    setPin("");
  };

  // ── Loading state (skip if already PIN authenticated) ──
  if (authLoading && step !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0a3d3d]" />
      </div>
    );
  }

  // ── Denied ──
  if (step === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] px-4" dir="rtl">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#e76f51]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#e76f51]" />
          </div>
          <h2 className="text-xl font-bold text-[#0a3d3d] mb-2">אין הרשאה</h2>
          <p className="text-gray-500 text-sm mb-6">
            המייל {user?.email} אינו מורשה לגשת לממשק הניהול.
          </p>
          <Button onClick={handleSignOut} variant="outline" className="rounded-full gap-2 border-gray-200">
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>
      </div>
    );
  }

  // ── Login / OTP / Magic Link ──
  if (step === "login" || step === "otp" || step === "magic-sent") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" dir="rtl"
        style={{ background: "#f0f2f5" }}
      >
        {/* Decorative bubbles matching site design */}
        <div className="absolute top-[10%] left-[8%] w-[140px] h-[140px] rounded-full opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, #f4a261, transparent 70%)" }} />
        <div className="absolute top-[25%] left-[20%] w-[90px] h-[90px] rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, #e76f51, transparent 70%)" }} />
        <div className="absolute top-[18%] left-[32%] w-[110px] h-[110px] rounded-full opacity-35 pointer-events-none"
          style={{ background: "radial-gradient(circle, #5ec6c6, transparent 70%)" }} />
        <div className="absolute bottom-[15%] right-[10%] w-[60px] h-[60px] rounded-full opacity-20 pointer-events-none bg-[#f4a261]" />
        <div className="absolute bottom-[25%] right-[25%] w-[30px] h-[30px] rounded-full opacity-15 pointer-events-none bg-[#5ec6c6]" />
        <div className="absolute top-[5%] right-[40%] w-3 h-3 rounded-full bg-[#f4a261] opacity-60 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0a3d3d 0%, #125555 100%)" }}
                >
                  <Shield className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#0a3d3d]">ניהול האתר</h1>
                <p className="text-sm text-gray-400 mt-1">SEELD Site Admin</p>
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
                  {/* Quick PIN login */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value); setPinError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handlePinLogin()}
                        placeholder="סיסמת מנהל"
                        className="h-12 pr-11 rounded-full text-sm border-gray-200 focus-visible:ring-[#5ec6c6]/40 text-right"
                      />
                    </div>
                    {pinError && <p className="text-red-500 text-xs text-center">{pinError}</p>}
                    <Button
                      type="button"
                      onClick={handlePinLogin}
                      className="w-full h-12 rounded-full gap-2 text-sm font-semibold bg-[#0a3d3d] hover:bg-[#125555] shadow-lg shadow-[#0a3d3d]/15"
                    >
                      <Shield className="h-4 w-4" />
                      כניסה למנהל
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[11px] text-gray-400">או עם Google</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Google Login */}
                  <Button
                    variant="outline"
                    className="w-full gap-3 h-13 rounded-full text-sm font-semibold border-gray-200 hover:bg-gray-50 shadow-sm min-h-[52px]"
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
                    <span className="text-[11px] text-gray-400">או באימייל</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Magic link + OTP */}
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={ADMIN_EMAIL}
                        required
                        dir="ltr"
                        className="h-12 pr-11 rounded-full text-sm border-gray-200 focus-visible:ring-[#5ec6c6]/40 text-left"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => handleSendMagicLink()}
                        className="flex-1 h-11 rounded-full gap-2 text-sm font-semibold bg-[#0a3d3d] hover:bg-[#125555] shadow-lg shadow-[#0a3d3d]/15"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        שלח לינק כניסה
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-11 rounded-full gap-1.5 text-sm border-gray-200 px-4"
                        disabled={loading}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        קוד OTP
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Magic link sent */}
              {step === "magic-sent" && (
                <motion.div
                  key="magic"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "#5ec6c620" }}>
                    <Mail className="w-7 h-7 text-[#5ec6c6]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0a3d3d] text-lg mb-1">בדוק את המייל</h3>
                    <p className="text-sm text-gray-500">
                      שלחנו לינק כניסה ל-<span className="font-semibold text-[#0a3d3d]" dir="ltr">{email}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">לחץ על הלינק במייל כדי להתחבר. בדוק גם בספאם.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSendMagicLink()}
                      disabled={resendTimer > 0 || loading}
                      className="w-full rounded-full gap-2 h-11 border-gray-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {resendTimer > 0 ? `שלח שוב (${resendTimer}s)` : "שלח שוב"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setStep("login"); setOtp(""); }}
                      className="text-sm text-gray-400 hover:text-[#0a3d3d] py-2 transition-colors"
                    >
                      חזרה לאפשרויות התחברות
                    </button>
                  </div>
                </motion.div>
              )}

              {/* OTP verification */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  <div className="bg-[#5ec6c6]/10 rounded-2xl p-3.5 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5ec6c6] shrink-0" />
                    <p className="text-xs text-[#0a3d3d]/80">
                      קוד נשלח ל-<span className="font-semibold text-[#0a3d3d]" dir="ltr">{email}</span>
                    </p>
                  </div>

                  {/* Circular OTP inputs */}
                  <div className="flex justify-center gap-2.5" dir="ltr">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[i] || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          const newOtp = otp.split("");
                          newOtp[i] = val;
                          setOtp(newOtp.join("").slice(0, 6));
                          if (val && i < 5) {
                            const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) {
                            const prev = (e.target as HTMLElement).parentElement?.children[i - 1] as HTMLInputElement;
                            prev?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                          setOtp(paste);
                          const target = (e.target as HTMLElement).parentElement?.children[Math.min(paste.length, 5)] as HTMLInputElement;
                          target?.focus();
                        }}
                        className={cn(
                          "w-12 h-12 rounded-full border-2 text-center text-lg font-bold text-[#0a3d3d] outline-none transition-all",
                          otp[i]
                            ? "border-[#5ec6c6] bg-[#5ec6c6]/5 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300",
                          "focus:border-[#5ec6c6] focus:ring-2 focus:ring-[#5ec6c6]/20"
                        )}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    className="w-full h-12 rounded-full font-semibold bg-[#0a3d3d] hover:bg-[#125555] shadow-lg shadow-[#0a3d3d]/15"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת והיכנס"}
                  </Button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => { setStep("login"); setOtp(""); }}
                      className="text-sm text-gray-400 hover:text-[#0a3d3d] transition-colors"
                    >
                      חזרה
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSendOtp(e as any)}
                      disabled={resendTimer > 0 || loading}
                      className={cn(
                        "text-sm transition-colors flex items-center gap-1",
                        resendTimer > 0 ? "text-gray-300" : "text-[#5ec6c6] hover:text-[#0a3d3d]"
                      )}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {resendTimer > 0 ? `שלח שוב (${resendTimer}s)` : "שלח שוב"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 mt-5 text-gray-400">
            <Lock className="w-3 h-3" />
            <span className="text-[10px]">גישה מורשית בלבד</span>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-[10px]">SEELD &copy; {new Date().getFullYear()}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  //  ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex" dir="rtl">
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
          {activeTab === "analytics" && <AnalyticsModule />}
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
//  MODULE: Analytics
// ══════════════════════════════════════════════════════

// actual DB schema: id (int8), slug (text), viewed_at (timestamptz), country, city, device, referrer, browser, session_id
type PageViewRow = { slug: string; viewed_at: string; country?: string; city?: string; device?: string; referrer?: string; browser?: string; session_id?: string };

const COUNTRY_MAP: Record<string, { flag: string; name: string }> = {
  IL: { flag: "\u{1F1EE}\u{1F1F1}", name: "\u05D9\u05E9\u05E8\u05D0\u05DC" },
  US: { flag: "\u{1F1FA}\u{1F1F8}", name: "\u05D0\u05E8\u05D4\"\u05D1" },
  GB: { flag: "\u{1F1EC}\u{1F1E7}", name: "\u05D1\u05E8\u05D9\u05D8\u05E0\u05D9\u05D4" },
  DE: { flag: "\u{1F1E9}\u{1F1EA}", name: "\u05D2\u05E8\u05DE\u05E0\u05D9\u05D4" },
  FR: { flag: "\u{1F1EB}\u{1F1F7}", name: "\u05E6\u05E8\u05E4\u05EA" },
  RU: { flag: "\u{1F1F7}\u{1F1FA}", name: "\u05E8\u05D5\u05E1\u05D9\u05D4" },
  UA: { flag: "\u{1F1FA}\u{1F1E6}", name: "\u05D0\u05D5\u05E7\u05E8\u05D0\u05D9\u05E0\u05D4" },
  CA: { flag: "\u{1F1E8}\u{1F1E6}", name: "\u05E7\u05E0\u05D3\u05D4" },
  AU: { flag: "\u{1F1E6}\u{1F1FA}", name: "\u05D0\u05D5\u05E1\u05D8\u05E8\u05DC\u05D9\u05D4" },
  IN: { flag: "\u{1F1EE}\u{1F1F3}", name: "\u05D4\u05D5\u05D3\u05D5" },
  BR: { flag: "\u{1F1E7}\u{1F1F7}", name: "\u05D1\u05E8\u05D6\u05D9\u05DC" },
  AR: { flag: "\u{1F1E6}\u{1F1F7}", name: "\u05D0\u05E8\u05D2\u05E0\u05D8\u05D9\u05E0\u05D4" },
  TR: { flag: "\u{1F1F9}\u{1F1F7}", name: "\u05D8\u05D5\u05E8\u05E7\u05D9\u05D4" },
  NL: { flag: "\u{1F1F3}\u{1F1F1}", name: "\u05D4\u05D5\u05DC\u05E0\u05D3" },
  SE: { flag: "\u{1F1F8}\u{1F1EA}", name: "\u05E9\u05D5\u05D5\u05D3\u05D9\u05D4" },
  CH: { flag: "\u{1F1E8}\u{1F1ED}", name: "\u05E9\u05D5\u05D5\u05D9\u05E5" },
  IT: { flag: "\u{1F1EE}\u{1F1F9}", name: "\u05D0\u05D9\u05D8\u05DC\u05D9\u05D4" },
  ES: { flag: "\u{1F1EA}\u{1F1F8}", name: "\u05E1\u05E4\u05E8\u05D3" },
  TH: { flag: "\u{1F1F9}\u{1F1ED}", name: "\u05EA\u05D0\u05D9\u05DC\u05E0\u05D3" },
  JP: { flag: "\u{1F1EF}\u{1F1F5}", name: "\u05D9\u05E4\u05DF" },
};

const PAGE_LABELS: Record<string, string> = {
  "/": "\u05D3\u05E3 \u05D4\u05D1\u05D9\u05EA",
  "/calculators": "\u05DE\u05D7\u05E9\u05D1\u05D5\u05E0\u05D9\u05DD",
  "/fund-finder": "\u05DE\u05D5\u05E6\u05D0 \u05E7\u05E8\u05E0\u05D5\u05EA",
  "/blog": "\u05D1\u05DC\u05D5\u05D2",
  "/contact": "\u05E6\u05D5\u05E8 \u05E7\u05E9\u05E8",
  "/onboarding": "\u05D4\u05E6\u05D8\u05E8\u05E4\u05D5\u05EA",
  "/personal-area": "\u05D0\u05D6\u05D5\u05E8 \u05D0\u05D9\u05E9\u05D9",
  "/insurances": "\u05D1\u05D9\u05D8\u05D5\u05D7\u05D9\u05DD",
  "/direct-debit": "\u05D4\u05D5\u05E8\u05D0\u05EA \u05E7\u05D1\u05E2",
  "/about": "\u05D0\u05D5\u05D3\u05D5\u05EA",
  "/faq": "\u05E9\u05D0\u05DC\u05D5\u05EA \u05D5\u05EA\u05E9\u05D5\u05D1\u05D5\u05EA",
  "/agents": "\u05DE\u05E2\u05E8\u05DB\u05EA \u05E1\u05D5\u05DB\u05E0\u05D9\u05DD",
  "/app/dashboard": "\u05D3\u05E9\u05D1\u05D5\u05E8\u05D3 \u05E1\u05D5\u05DB\u05DF",
};

function Sparkline({ data, color = "#5ec6c6", width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsModule() {
  const [views, setViews] = useState<PageViewRow[]>([]);
  const [prevViews, setPrevViews] = useState<PageViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "week" | "month" | "all">("week");

  const getRangeDates = useCallback((r: typeof range) => {
    const now = new Date();
    let from: Date | null = null;
    if (r === "today") from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (r === "week") from = new Date(now.getTime() - 7 * 86400000);
    else if (r === "month") from = new Date(now.getTime() - 30 * 86400000);
    return from;
  }, []);

  const getPrevRangeDates = useCallback((r: typeof range) => {
    const now = new Date();
    if (r === "today") {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(end.getTime() - 86400000);
      return { start, end };
    } else if (r === "week") {
      const end = new Date(now.getTime() - 7 * 86400000);
      const start = new Date(end.getTime() - 7 * 86400000);
      return { start, end };
    } else if (r === "month") {
      const end = new Date(now.getTime() - 30 * 86400000);
      const start = new Date(end.getTime() - 30 * 86400000);
      return { start, end };
    }
    return null;
  }, []);

  const fetchViews = useCallback(async () => {
    setLoading(true);
    const from = getRangeDates(range);

    let query = siteSupabase
      .from("page_views" as any)
      .select("slug, viewed_at, country, city, device, referrer, browser, session_id")
      .order("viewed_at", { ascending: false })
      .limit(5000);
    if (from) query = query.gte("viewed_at", from.toISOString());

    const { data, error } = await query;
    if (error) console.warn("[Analytics] fetch failed:", error.message);
    setViews((data as PageViewRow[]) ?? []);

    // Fetch previous period for comparison
    const prev = getPrevRangeDates(range);
    if (prev) {
      const pq = siteSupabase
        .from("page_views" as any)
        .select("slug, viewed_at, country, city, device, referrer, browser, session_id")
        .gte("viewed_at", prev.start.toISOString())
        .lt("viewed_at", prev.end.toISOString())
        .limit(5000);
      const { data: pd } = await pq;
      setPrevViews((pd as PageViewRow[]) ?? []);
    } else {
      setPrevViews([]);
    }
    setLoading(false);
  }, [range, getRangeDates, getPrevRangeDates]);

  useEffect(() => { fetchViews(); }, [fetchViews]);

  // Auto-refresh live feed every 30s
  useEffect(() => {
    const interval = setInterval(() => { fetchViews(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchViews]);

  // ── Computed stats ──
  const totalViews = views.length;
  const prevTotalViews = prevViews.length;

  const uniqueSessions = new Set(views.filter(v => v.session_id).map(v => v.session_id)).size || 0;
  const prevUniqueSessions = new Set(prevViews.filter(v => v.session_id).map(v => v.session_id)).size || 0;

  // Bounce rate: sessions with only 1 page view
  const sessionCounts: Record<string, number> = {};
  for (const v of views) {
    if (v.session_id) sessionCounts[v.session_id] = (sessionCounts[v.session_id] ?? 0) + 1;
  }
  const totalSessions = Object.keys(sessionCounts).length || 1;
  const bounceSessions = Object.values(sessionCounts).filter(c => c === 1).length;
  const bounceRate = Math.round((bounceSessions / totalSessions) * 100);

  const prevSessionCounts: Record<string, number> = {};
  for (const v of prevViews) {
    if (v.session_id) prevSessionCounts[v.session_id] = (prevSessionCounts[v.session_id] ?? 0) + 1;
  }
  const prevTotalSessions = Object.keys(prevSessionCounts).length || 1;
  const prevBounceSessions = Object.values(prevSessionCounts).filter(c => c === 1).length;
  const prevBounceRate = Math.round((prevBounceSessions / prevTotalSessions) * 100);

  // Avg pages per session
  const avgPages = totalSessions > 0 ? +(totalViews / totalSessions).toFixed(1) : 0;
  const prevAvgPages = prevTotalSessions > 0 ? +(prevViews.length / prevTotalSessions).toFixed(1) : 0;

  // % change helper
  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Sparkline data: split current period into 7 buckets
  const getSparklineData = (rows: PageViewRow[]) => {
    if (rows.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const sorted = [...rows].sort((a, b) => new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime());
    const minT = new Date(sorted[0].viewed_at).getTime();
    const maxT = new Date(sorted[sorted.length - 1].viewed_at).getTime();
    const span = Math.max(maxT - minT, 1);
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    for (const r of sorted) {
      const t = new Date(r.viewed_at).getTime();
      const idx = Math.min(Math.floor(((t - minT) / span) * 7), 6);
      buckets[idx]++;
    }
    return buckets;
  };

  const sparkViews = getSparklineData(views);
  const sparkSessions = (() => {
    if (views.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    const sorted = [...views].sort((a, b) => new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime());
    const minT = new Date(sorted[0].viewed_at).getTime();
    const maxT = new Date(sorted[sorted.length - 1].viewed_at).getTime();
    const span = Math.max(maxT - minT, 1);
    const buckets: Set<string>[] = Array.from({ length: 7 }, () => new Set());
    for (const r of sorted) {
      if (!r.session_id) continue;
      const t = new Date(r.viewed_at).getTime();
      const idx = Math.min(Math.floor(((t - minT) / span) * 7), 6);
      buckets[idx].add(r.session_id);
    }
    return buckets.map(s => s.size);
  })();

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const v of views) pageCounts[v.slug] = (pageCounts[v.slug] ?? 0) + 1;
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxPageCount = topPages[0]?.[1] ?? 1;

  // Daily views for bar chart
  const dailyCounts: Record<string, number> = {};
  for (const v of views) {
    const day = new Date(v.viewed_at).toISOString().slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
  }
  const dailyEntries = Object.entries(dailyCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDaily = Math.max(...dailyEntries.map(e => e[1]), 1);

  // Countries
  const countryCounts: Record<string, number> = {};
  for (const v of views) {
    if (v.country) countryCounts[v.country] = (countryCounts[v.country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCountry = topCountries[0]?.[1] ?? 1;

  // Devices
  const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
  for (const v of views) {
    if (v.device && v.device in deviceCounts) deviceCounts[v.device]++;
  }
  const totalDevices = Math.max(Object.values(deviceCounts).reduce((a, b) => a + b, 0), 1);

  // Browsers
  const browserCounts: Record<string, number> = {};
  for (const v of views) {
    if (v.browser) browserCounts[v.browser] = (browserCounts[v.browser] ?? 0) + 1;
  }
  const topBrowsers = Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalBrowsers = Math.max(topBrowsers.reduce((a, e) => a + e[1], 0), 1);

  // Referrers
  const refCounts: Record<string, number> = {};
  for (const v of views) {
    if (v.referrer) {
      try {
        const domain = new URL(v.referrer).hostname.replace(/^www\./, "");
        refCounts[domain] = (refCounts[domain] ?? 0) + 1;
      } catch {
        refCounts[v.referrer] = (refCounts[v.referrer] ?? 0) + 1;
      }
    }
  }
  const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const label = (slug: string) => PAGE_LABELS[slug] ?? slug;
  const countryLabel = (code: string) => {
    const c = COUNTRY_MAP[code];
    return c ? `${c.flag} ${c.name}` : code;
  };

  const DEVICE_COLORS: Record<string, string> = { desktop: "#0a3d3d", mobile: "#5ec6c6", tablet: "#f4a261" };
  const DEVICE_LABELS: Record<string, string> = { desktop: "\u05DE\u05D7\u05E9\u05D1", mobile: "\u05E0\u05D9\u05D9\u05D3", tablet: "\u05D8\u05D0\u05D1\u05DC\u05D8" };
  const BROWSER_COLORS: Record<string, string> = { Chrome: "#0a3d3d", Safari: "#5ec6c6", Firefox: "#f4a261", Edge: "#90be6d", Other: "#e76f51" };
  const DEVICE_ICONS: Record<string, string> = { desktop: "\u{1F5A5}", mobile: "\u{1F4F1}", tablet: "\u{1F4F1}" };

  const TrendArrow = ({ value, invertColors = false }: { value: number; invertColors?: boolean }) => {
    const isPositive = invertColors ? value < 0 : value > 0;
    const isNegative = invertColors ? value > 0 : value < 0;
    return (
      <span className={cn("text-xs font-bold flex items-center gap-0.5", isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-400")}>
        {value > 0 ? "\u25B2" : value < 0 ? "\u25BC" : "\u2013"} {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="\u05D0\u05E0\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4"
        subtitle="\u05DE\u05E2\u05E7\u05D1 \u05D1\u05D9\u05E7\u05D5\u05E8\u05D9\u05DD \u05D5\u05E0\u05EA\u05D5\u05E0\u05D9 \u05D2\u05DC\u05D9\u05E9\u05D4 \u05D1\u05D0\u05EA\u05E8"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-gray-200 overflow-hidden">
              {(["today", "week", "month", "all"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    range === r ? "bg-[#0a3d3d] text-white" : "text-gray-500 hover:text-[#0a3d3d]"
                  )}
                >
                  {r === "today" ? "\u05D4\u05D9\u05D5\u05DD" : r === "week" ? "\u05E9\u05D1\u05D5\u05E2" : r === "month" ? "\u05D7\u05D5\u05D3\u05E9" : "\u05D4\u05DB\u05DC"}
                </button>
              ))}
            </div>
            <Button onClick={fetchViews} variant="outline" size="icon" className="rounded-full">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        }
      />

      {/* ── Section 1: KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">{"\u05E6\u05E4\u05D9\u05D5\u05EA"}</p>
            <TrendArrow value={pctChange(totalViews, prevTotalViews)} />
          </div>
          <p className="text-3xl font-extrabold text-[#0a3d3d]">{loading ? "..." : totalViews.toLocaleString()}</p>
          <div className="mt-3">
            <Sparkline data={sparkViews} color="#5ec6c6" />
          </div>
        </div>
        {/* Unique Visitors */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">{"\u05DE\u05D1\u05E7\u05E8\u05D9\u05DD \u05D9\u05D9\u05D7\u05D5\u05D3\u05D9\u05D9\u05DD"}</p>
            <TrendArrow value={pctChange(uniqueSessions, prevUniqueSessions)} />
          </div>
          <p className="text-3xl font-extrabold text-[#0a3d3d]">{loading ? "..." : uniqueSessions.toLocaleString()}</p>
          <div className="mt-3">
            <Sparkline data={sparkSessions} color="#f4a261" />
          </div>
        </div>
        {/* Bounce Rate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">{"\u05E9\u05D9\u05E2\u05D5\u05E8 \u05E0\u05D8\u05D9\u05E9\u05D4"}</p>
            <TrendArrow value={pctChange(bounceRate, prevBounceRate)} invertColors />
          </div>
          <p className="text-3xl font-extrabold text-[#0a3d3d]">{loading ? "..." : `${bounceRate}%`}</p>
          <div className="mt-3">
            <Sparkline data={[0, 0, 0, 0, 0, 0, 0].map(() => bounceRate)} color="#e76f51" />
          </div>
        </div>
        {/* Avg Pages / Session */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">{"\u05DE\u05DE\u05D5\u05E6\u05E2 \u05E2\u05DE\u05D5\u05D3\u05D9\u05DD / \u05D1\u05D9\u05E7\u05D5\u05E8"}</p>
            <TrendArrow value={pctChange(avgPages, prevAvgPages)} />
          </div>
          <p className="text-3xl font-extrabold text-[#0a3d3d]">{loading ? "..." : avgPages}</p>
          <div className="mt-3">
            <Sparkline data={[0, 0, 0, 0, 0, 0, 0].map(() => avgPages)} color="#90be6d" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Views Over Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#5ec6c6]" />
              {"\u05E6\u05E4\u05D9\u05D5\u05EA \u05DC\u05D0\u05D5\u05E8\u05DA \u05D6\u05DE\u05DF"}
            </h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#0a3d3d]" /></div>
            ) : dailyEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{"\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E2\u05D3\u05D9\u05D9\u05DF"}</p>
            ) : (
              <div>
                <div className="flex items-end gap-1" style={{ height: 120 }}>
                  {dailyEntries.map(([day, count]) => {
                    const pct = Math.round((count / maxDaily) * 100);
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center group relative">
                        <div
                          className="w-full rounded-t-md transition-all duration-300 cursor-pointer"
                          style={{
                            height: `${Math.max(pct, count > 0 ? 8 : 2)}%`,
                            background: "linear-gradient(180deg, #5ec6c6, #0a3d3d)",
                            minHeight: 3,
                          }}
                        />
                        <span className="absolute -top-6 text-[10px] font-bold text-[#0a3d3d] bg-white px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-gray-400">
                  {dailyEntries.length > 0 && <span>{new Date(dailyEntries[0][0]).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}</span>}
                  {dailyEntries.length > 1 && <span>{new Date(dailyEntries[dailyEntries.length - 1][0]).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5ec6c6]" />
              {"\u05E2\u05DE\u05D5\u05D3\u05D9\u05DD \u05DE\u05D5\u05D1\u05D9\u05DC\u05D9\u05DD"}
            </h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#0a3d3d]" /></div>
            ) : topPages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{"\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E2\u05D3\u05D9\u05D9\u05DF"}</p>
            ) : (
              <div className="space-y-3">
                {topPages.map(([slug, count]) => {
                  const pct = Math.round((count / maxPageCount) * 100);
                  return (
                    <div key={slug} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#0a3d3d] font-medium truncate flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#5ec6c6] shrink-0" />
                          {label(slug)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{pct}%</span>
                          <span className="text-xs font-bold text-[#0a3d3d] min-w-[32px] text-left" dir="ltr">{count}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #5ec6c6, #0a3d3d)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Countries */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#5ec6c6]" />
              {"\u05DE\u05D3\u05D9\u05E0\u05D5\u05EA"}
            </h3>
            {topCountries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{"\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9 \u05DE\u05D3\u05D9\u05E0\u05D5\u05EA"}</p>
            ) : (
              <div className="space-y-2.5">
                {topCountries.map(([code, count]) => (
                  <div key={code} className="flex items-center gap-3">
                    <span className="text-sm min-w-[120px] truncate">{countryLabel(code)}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((count / maxCountry) * 100)}%`,
                          background: "linear-gradient(90deg, #5ec6c6, #0a3d3d)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#0a3d3d] min-w-[28px] text-left" dir="ltr">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Devices */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#f4a261]" />
              {"\u05DE\u05DB\u05E9\u05D9\u05E8\u05D9\u05DD"}
            </h3>
            {/* Stacked horizontal bar */}
            <div className="h-8 rounded-full overflow-hidden flex mb-3">
              {(["desktop", "mobile", "tablet"] as const).map((d) => {
                const pct = Math.round((deviceCounts[d] / totalDevices) * 100);
                if (pct === 0) return null;
                return (
                  <div
                    key={d}
                    className="h-full transition-all duration-500 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ width: `${pct}%`, backgroundColor: DEVICE_COLORS[d], minWidth: pct > 0 ? 20 : 0 }}
                  >
                    {pct > 8 && `${pct}%`}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 justify-center flex-wrap">
              {(["desktop", "mobile", "tablet"] as const).map((d) => (
                <div key={d} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEVICE_COLORS[d] }} />
                  <span>{DEVICE_LABELS[d]}</span>
                  <span className="font-bold text-[#0a3d3d]">{deviceCounts[d]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Browsers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#90be6d]" />
              {"\u05D3\u05E4\u05D3\u05E4\u05E0\u05D9\u05DD"}
            </h3>
            {/* Stacked horizontal bar */}
            <div className="h-8 rounded-full overflow-hidden flex mb-3">
              {topBrowsers.map(([name, count]) => {
                const pct = Math.round((count / totalBrowsers) * 100);
                if (pct === 0) return null;
                return (
                  <div
                    key={name}
                    className="h-full transition-all duration-500 flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ width: `${pct}%`, backgroundColor: BROWSER_COLORS[name] ?? "#999", minWidth: pct > 0 ? 20 : 0 }}
                  >
                    {pct > 8 && `${pct}%`}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 justify-center flex-wrap">
              {topBrowsers.map(([name, count]) => (
                <div key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: BROWSER_COLORS[name] ?? "#999" }} />
                  <span>{name}</span>
                  <span className="font-bold text-[#0a3d3d]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#e76f51]" />
              {"\u05DE\u05E7\u05D5\u05E8\u05D5\u05EA \u05EA\u05E0\u05D5\u05E2\u05D4"}
            </h3>
            {topReferrers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{"\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9 \u05D4\u05E4\u05E0\u05D9\u05D5\u05EA"}</p>
            ) : (
              <div className="space-y-2">
                {topReferrers.map(([domain, count]) => (
                  <div key={domain} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                    <span className="text-sm text-[#0a3d3d] truncate max-w-[200px]" dir="ltr">{domain}</span>
                    <span className="text-xs font-bold text-[#0a3d3d]">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Live Feed ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-[#0a3d3d] mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#5ec6c6]" />
          {"\u05E4\u05E2\u05D9\u05DC\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D4"}
          <span className="mr-auto text-[10px] text-gray-400 font-normal">{"\u05DE\u05EA\u05E2\u05D3\u05DB\u05DF \u05DB\u05DC 30 \u05E9\u05E0\u05D9\u05D5\u05EA"}</span>
        </h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#0a3d3d]" /></div>
        ) : views.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{"\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E2\u05D3\u05D9\u05D9\u05DF"}</p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {views.slice(0, 50).map((v, i) => {
              const d = new Date(v.viewed_at);
              const timeStr = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
              const dateStr = d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
              const isToday = new Date().toDateString() === d.toDateString();
              const cInfo = v.country ? COUNTRY_MAP[v.country] : null;
              const deviceIcon = v.device ? (DEVICE_ICONS[v.device] ?? "") : "";
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  <span className="text-xs text-gray-400 shrink-0 min-w-[60px]" dir="ltr">
                    {isToday ? timeStr : `${dateStr} ${timeStr}`}
                  </span>
                  <span className="font-medium text-[#0a3d3d] truncate flex-1">{label(v.slug)}</span>
                  {cInfo && <span className="text-sm shrink-0" title={cInfo.name}>{cInfo.flag}</span>}
                  {deviceIcon && <span className="text-sm shrink-0" title={v.device}>{deviceIcon}</span>}
                  {v.browser && <span className="text-[10px] text-gray-400 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded">{v.browser}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
//  MODULE: Overview
// ══════════════════════════════════════════════════════

function TrackSyncCard() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useCallback((input: HTMLInputElement | null) => {
    if (input) input.value = "";
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSyncing(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const { data, error } = await siteSupabase.functions.invoke("sync-tracks", {
        body: { fileBase64: base64 },
      });

      if (error) throw error;
      setResult(`סונכרנו ${data?.tracks_synced || 0} מסלולים מ-${data?.companies?.length || 0} חברות`);
    } catch (err) {
      setResult("שגיאה: " + (err.message || "לא ידוע"));
    }
    setSyncing(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-all">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ background: "linear-gradient(135deg, #90be6d 0%, #6fa34d 100%)" }}
      >
        <RefreshCw className={cn("w-6 h-6 text-white", syncing && "animate-spin")} />
      </div>
      <h4 className="font-bold text-[#0a3d3d] mb-0.5">סנכרן מסלולי השקעה</h4>
      <p className="text-xs text-gray-400 mb-3">העלה קובץ Excel מגמלנט/פנסיהנט</p>
      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#90be6d] text-white text-xs font-semibold cursor-pointer hover:bg-[#7dab5a] transition-colors">
        <input type="file" accept=".xls,.xlsx" onChange={handleFileUpload} className="hidden" ref={fileRef} />
        {syncing ? "מסנכרן..." : "בחר קובץ"}
      </label>
      {result && <p className="text-xs mt-2 text-[#0a3d3d]">{result}</p>}
    </div>
  );
}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <TrackSyncCard />
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
  const [phone, setPhone] = useState("");
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
      const info = [name || email, `(${email})`, phone ? `| ${phone}` : '', `— ${new Date().toLocaleTimeString("he-IL")}`].filter(Boolean).join(' ');
      setSent(prev => [...prev, info]);
      setEmail("");
      setName("");
      setPhone("");
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
            <Label className="text-xs font-medium text-[#0a3d3d]">טלפון</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="052-000-0000"
              dir="ltr"
              className="mt-1 rounded-full border-gray-200 text-left"
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
  const [agentPhone, setAgentPhone] = useState("");
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
      setAgentPhone("");
      fetchData();
    } catch (err) {
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
    } catch (err) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
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
          <div>
            <Label className="text-xs font-medium text-[#0a3d3d]">טלפון הסוכן</Label>
            <Input
              type="tel"
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              placeholder="052-000-0000"
              dir="ltr"
              className="mt-1 rounded-full border-gray-200 text-left"
            />
          </div>
        </div>
        <div>
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
            body: JSON.stringify({ password: ADMIN_PIN, action: "fetch" }),
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

// ══════════════════════════════════════════════════════
//  EXPORT WITH ERROR BOUNDARY
// ══════════════════════════════════════════════════════

export default function SiteAdmin() {
  return (
    <AdminErrorBoundary>
      <SiteAdminInner />
    </AdminErrorBoundary>
  );
}
