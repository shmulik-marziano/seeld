import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2, Mail, ShieldCheck, ArrowLeft, Shield, Lock,
  FileText, Heart, Wallet, CheckCircle2, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SeeIDLogo from "@/components/SeeIDLogo";

const benefits = [
  { icon: FileText, text: "צפייה בפוליסות", desc: "כל הביטוחים שלך במקום אחד", color: "#5ec6c6" },
  { icon: Heart, text: "המלצות מותאמות", desc: "ניתוח אישי של הכיסוי הביטוחי שלך", color: "#e76f51" },
  { icon: Wallet, text: "מעקב חיסכון ופנסיה", desc: "נתונים עדכניים על החסכונות שלך", color: "#f4a261" },
  { icon: Phone, text: "תקשורת עם הסוכן", desc: "צ'אט ישיר ועדכונים בזמן אמת", color: "#90be6d" },
];

const PersonalAreaLogin = () => {
  const [step, setStep] = useState<"choose" | "email" | "otp">("choose");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signInWithOtp, verifyOtp, signInWithGoogle, signInWithFacebook } = useAuth();

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    try {
      const fn = provider === "google" ? signInWithGoogle : signInWithFacebook;
      const { error } = await fn();
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בהתחברות, נסה שוב");
      setSocialLoading(null);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("יש להזין כתובת אימייל"); return; }
    setLoading(true);
    try {
      const { error } = await signInWithOtp(email);
      if (error) throw error;
      setStep("otp");
      toast.success(`קוד חד-פעמי נשלח ל-${email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בשליחת הקוד");
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
      toast.success("התחברת בהצלחה!");
    } catch {
      toast.error("קוד שגוי, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      {/* ══════ Right side — Branding Hero (desktop) ══════ */}
      <div
        className="hidden lg:flex lg:w-[48%] relative items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(165deg, #072e2e 0%, #0a3d3d 40%, #0d4a4a 70%, #0a3d3d 100%)",
        }}
      >
        {/* Soft bubble background elements — conservative style */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large ambient bubbles */}
          <motion.div
            animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[8%] right-[12%] w-[180px] h-[180px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #5ec6c6, transparent 70%)" }}
          />
          <motion.div
            animate={{ y: [0, 12, 0], scale: [1, 1.03, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute bottom-[12%] left-[8%] w-[220px] h-[220px] rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #f4a261, transparent 70%)" }}
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute top-[45%] right-[55%] w-[120px] h-[120px] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, #e76f51, transparent 70%)" }}
          />

          {/* Small floating dots */}
          <motion.div
            animate={{ y: [0, -8, 0], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-[20%] left-[25%] w-3 h-3 rounded-full bg-[#5ec6c6]"
          />
          <motion.div
            animate={{ y: [0, 6, 0], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute bottom-[30%] right-[20%] w-2 h-2 rounded-full bg-[#f4a261]"
          />
          <motion.div
            animate={{ y: [0, -5, 0], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 7, repeat: Infinity, delay: 4 }}
            className="absolute top-[65%] left-[15%] w-2.5 h-2.5 rounded-full bg-[#90be6d]"
          />

          {/* Subtle curved dashed lines */}
          <svg className="absolute bottom-20 left-0 w-full h-16 opacity-[0.06] pointer-events-none" viewBox="0 0 400 50" fill="none">
            <path d="M0 35 Q100 10 200 30 T400 15" stroke="#5ec6c6" strokeWidth="1" strokeDasharray="8 6" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 px-14 space-y-10 max-w-[480px]"
        >
          {/* Logo + title */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/[0.07] backdrop-blur-sm border border-white/[0.06]">
              <SeeIDLogo size="lg" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">האזור האישי</h2>
              <p className="text-base text-white/45 font-light">ניהול חכם של הביטוחים והחסכונות שלך</p>
            </div>
          </div>

          {/* Benefit bubble cards — conservative rounded style */}
          <div className="space-y-3">
            {benefits.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 bg-white/[0.05] backdrop-blur-sm border border-white/[0.05] hover:bg-white/[0.08] transition-all"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}20` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/85">{item.text}</p>
                  <p className="text-xs text-white/35 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 pt-2"
          >
            <Shield className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs text-white/25">מאובטח בתקן SSL | נתונים מוצפנים</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ══════ Left side — Login Form ══════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 bg-[#f8f9fc] overflow-y-auto min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile hero header with bubble style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:hidden mb-8"
          >
            <div
              className="rounded-2xl p-6 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(165deg, #072e2e 0%, #0a3d3d 50%, #0d4a4a 100%)" }}
            >
              {/* Mobile bubbles */}
              <div className="absolute top-[-20%] right-[-15%] w-[140px] h-[140px] rounded-full opacity-[0.06]"
                style={{ background: "radial-gradient(circle, #5ec6c6, transparent 70%)" }} />
              <div className="absolute bottom-[-10%] left-[-10%] w-[100px] h-[100px] rounded-full opacity-[0.04]"
                style={{ background: "radial-gradient(circle, #f4a261, transparent 70%)" }} />
              <div className="flex flex-col items-center gap-3 relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/[0.08] backdrop-blur-sm border border-white/[0.06]">
                  <SeeIDLogo size="md" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">האזור האישי</h2>
                  <p className="text-xs text-white/45 mt-0.5">ניהול חכם של הביטוחים שלך</p>
                </div>
              </div>

              {/* Mobile benefit dots row */}
              <div className="flex items-center justify-center gap-3 mt-4 relative z-10">
                {benefits.map((b, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: `${b.color}25` }}
                  >
                    <b.icon className="w-4 h-4" style={{ color: b.color }} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Form card — clean bubble style */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#e0f2f1] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-[#0a3d3d]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0a3d3d]">
                {step === "choose" && "כניסה לאזור האישי"}
                {step === "email" && "התחברות עם אימייל"}
                {step === "otp" && "אימות קוד"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {step === "choose" && "התחבר כדי לצפות בפוליסות, המלצות ומידע אישי"}
                {step === "email" && "הזן את כתובת המייל שלך ונשלח לך קוד חד-פעמי"}
                {step === "otp" && `הזן את הקוד ששלחנו ל-${email}`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* ──── Step: Choose method ──── */}
              {step === "choose" && (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {/* Google */}
                  <Button
                    variant="outline"
                    className="w-full gap-3 h-12 rounded-full text-sm font-medium border-gray-200 hover:bg-gray-50 transition-all min-h-[48px] shadow-sm"
                    onClick={() => handleSocialLogin("google")}
                    disabled={!!socialLoading}
                  >
                    {socialLoading === "google" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )}
                    המשך עם Google
                  </Button>

                  {/* Facebook */}
                  <Button
                    variant="outline"
                    className="w-full gap-3 h-12 rounded-full text-sm font-medium border-gray-200 hover:bg-gray-50 transition-all min-h-[48px] shadow-sm"
                    onClick={() => handleSocialLogin("facebook")}
                    disabled={!!socialLoading}
                  >
                    {socialLoading === "facebook" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    המשך עם Facebook
                  </Button>

                  <div className="flex items-center gap-3 py-1">
                    <Separator className="flex-1" />
                    <span className="text-xs text-gray-400 font-medium">או</span>
                    <Separator className="flex-1" />
                  </div>

                  {/* Email OTP */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-12 rounded-full text-sm font-medium border-gray-200 hover:bg-gray-50 transition-all min-h-[48px] shadow-sm"
                    onClick={() => setStep("email")}
                  >
                    <Mail className="h-4 w-4 text-[#0a3d3d]" />
                    התחברות עם קוד חד-פעמי באימייל
                  </Button>
                </motion.div>
              )}

              {/* ──── Step: Enter email ──── */}
              {step === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#0a3d3d]">כתובת אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        dir="ltr"
                        className="h-12 sm:h-11 pr-10 rounded-full text-base sm:text-sm border-gray-200 focus-visible:ring-[#0a3d3d]/30 text-left"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 sm:h-11 rounded-full gap-2 font-semibold text-base sm:text-sm min-h-[48px] shadow-lg shadow-[#0a3d3d]/20 bg-[#0a3d3d] hover:bg-[#0d4a4a]"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                    שלח קוד התחברות
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep("choose")}
                    className="w-full text-sm text-gray-500 hover:text-[#0a3d3d] min-h-[44px] transition-colors"
                  >
                    חזרה לאפשרויות התחברות
                  </button>
                </motion.form>
              )}

              {/* ──── Step: Verify OTP ──── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3 bg-[#e0f2f1] border border-[#0a3d3d]/10 rounded-xl p-3.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0a3d3d] shrink-0" />
                    <p className="text-xs sm:text-sm text-[#0a3d3d]/80">
                      שלחנו קוד חד-פעמי ל-<span className="font-semibold text-[#0a3d3d]" dir="ltr">{email}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <Label className="text-xs font-medium text-[#0a3d3d]">קוד חד-פעמי (6 ספרות)</Label>
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
                    className="w-full h-12 sm:h-11 rounded-full gap-2 font-semibold text-base sm:text-sm min-h-[48px] shadow-lg shadow-[#0a3d3d]/20 bg-[#0a3d3d] hover:bg-[#0d4a4a]"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת והתחבר"}
                  </Button>

                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setOtp(""); }}
                      className="text-[#0a3d3d] hover:underline min-h-[44px] px-2 font-medium"
                    >
                      שנה כתובת מייל
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSendOtp(e as any)}
                      className="text-gray-400 hover:text-[#0a3d3d] hover:underline min-h-[44px] px-2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      disabled={loading}
                    >
                      שלח קוד מחדש
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Back to site + trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mt-5"
          >
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-[#0a3d3d] hover:underline font-medium min-h-[44px] px-4 inline-flex items-center"
              >
                חזרה לאתר הראשי
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 text-gray-400">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span className="text-[10px]">הצפנת SSL</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span className="text-[10px]">מאובטח</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-[10px]">SEELD &copy; {new Date().getFullYear()}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PersonalAreaLogin;
