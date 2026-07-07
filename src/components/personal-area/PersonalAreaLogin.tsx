import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DISPLAY, MONO, MUTED, NAVY, PASTEL_BLUE, PASTEL_MINT, RING, TURQ, TURQ_TEXT } from "@/lib/brand";
import { StatusPill } from "@/components/brand/Live";

// SEELD DNA v3: white canvas + navy statement panel (STYLESEED.md)

const benefits = [
  { title: "צפייה בפוליסות", desc: "כל הביטוחים שלך במקום אחד" },
  { title: "המלצות מותאמות", desc: "ניתוח אישי של הכיסוי הביטוחי שלך" },
  { title: "מעקב חיסכון ופנסיה", desc: "נתונים עדכניים על החסכונות שלך" },
  { title: "תקשורת עם היועץ", desc: "צ'אט ישיר ועדכונים בזמן אמת" },
];

// Light turquoise for small text on the navy panel (6.88:1 on #1D2D3D, measured)
const TURQ_ON_NAVY = "#7fc2b5";

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
    // White DNA canvas; the brand statement lives on one navy panel.
    <div className="min-h-screen flex flex-col lg:flex-row bg-white" dir="rtl">
      {/* ── Right side: navy statement panel with the SEELD wordmark + ruled benefit list ── */}
      <div className="hidden lg:flex lg:w-[48%] items-center justify-center" style={{ backgroundColor: NAVY }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-[440px] px-14"
        >
          <h2
            className="leading-none text-white"
            style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: "56px", letterSpacing: "-0.035em" }}
            dir="ltr"
          >
            SEELD
          </h2>
          <p className="mt-4 text-lg font-medium text-white">האזור האישי</p>
          <p className="mt-1 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,.65)" }}>
            כל הפוליסות, החיסכון והמסמכים שלך. במקום אחד.
          </p>

          {/* Ruled list — turquoise dots, no ornamental numerals */}
          <div className="mt-10">
            {benefits.map((item) => (
              <div key={item.title} className="flex items-baseline gap-4 border-t border-white/10 py-4">
                <span
                  className="shrink-0 w-2 h-2 rounded-full translate-y-[1px]"
                  style={{ backgroundColor: TURQ }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,.65)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="border-t border-white/10" aria-hidden="true" />
          </div>

          <p
            className="mt-8 text-[11px] tracking-[0.14em]"
            style={{ fontFamily: MONO, color: TURQ_ON_NAVY }}
            dir="ltr"
          >
            PERSONAL AREA · SSL · ENCRYPTED
          </p>
        </motion.div>
      </div>

      {/* ── Left side: login form on the white canvas ── */}
      <div className="dna-page flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto min-h-screen lg:min-h-0">
        {/* Pastel circle backdrop — decorative, never behind small text */}
        <div className="dna-circles" aria-hidden="true">
          <div
            className="dna-circ"
            style={{ width: 240, height: 240, top: -100, left: -90, backgroundColor: PASTEL_BLUE, opacity: 0.5 }}
          />
          <div
            className="dna-circ"
            style={{ width: 200, height: 200, bottom: -100, right: -80, backgroundColor: PASTEL_MINT, opacity: 0.45 }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile header — the navy panel is hidden, so the wordmark sits here */}
          <div className="lg:hidden mb-6 px-1">
            <h2
              style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY, fontSize: "30px", letterSpacing: "-0.02em" }}
              dir="ltr"
            >
              SEELD
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: MUTED }}>האזור האישי · כל הפוליסות והחיסכון במקום אחד</p>
          </div>

          {/* The one StatusPill — live, secure connection */}
          <div className="mb-4 text-center">
            <StatusPill>חיבור מאובטח לאזור האישי</StatusPill>
          </div>

          {/* Form — the calm white DNA card */}
          <div className="dna-concept !p-6 sm:!p-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="space-y-1.5">
                <h1
                  className="text-xl sm:text-2xl tracking-tight"
                  style={{ fontFamily: DISPLAY, fontWeight: 700, color: NAVY }}
                >
                  {step === "choose" && "כניסה לאזור האישי"}
                  {step === "email" && "התחברות עם אימייל"}
                  {step === "otp" && "אימות קוד"}
                </h1>
                <p className="text-sm text-[#3a4c5a]">
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
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-3"
                  >
                    {/* Google */}
                    <Button
                      variant="outline"
                      className="w-full gap-3 h-12 rounded-md text-sm font-medium border-[#E7EDF1] bg-white text-[#1D2D3D] shadow-none transition-colors duration-150 hover:bg-white hover:border-[#1D2D3D] min-h-[48px]"
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
                      className="w-full gap-3 h-12 rounded-md text-sm font-medium border-[#E7EDF1] bg-white text-[#1D2D3D] shadow-none transition-colors duration-150 hover:bg-white hover:border-[#1D2D3D] min-h-[48px]"
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
                      <Separator className="flex-1 bg-[#E7EDF1]" />
                      <span className="text-xs font-medium" style={{ color: MUTED }}>או</span>
                      <Separator className="flex-1 bg-[#E7EDF1]" />
                    </div>

                    {/* Email OTP */}
                    <Button
                      variant="outline"
                      className="w-full gap-2 h-12 rounded-md text-sm font-medium border-[#E7EDF1] bg-white text-[#1D2D3D] shadow-none transition-colors duration-150 hover:bg-white hover:border-[#1D2D3D] min-h-[48px]"
                      onClick={() => setStep("email")}
                    >
                      <Mail className="h-4 w-4 text-[#1D2D3D]" />
                      התחברות עם קוד חד-פעמי באימייל
                    </Button>
                  </motion.div>
                )}

                {/* ──── Step: Enter email ──── */}
                {step === "email" && (
                  <motion.form
                    key="email"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    onSubmit={handleSendOtp}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-[#1D2D3D]">כתובת אימייל</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: MUTED }} />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          dir="ltr"
                          className="h-12 sm:h-11 pr-10 rounded-md text-base sm:text-sm border-[#E7EDF1] bg-white focus-visible:border-[#1D2D3D] focus-visible:ring-[#1D2D3D]/15 text-left"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 sm:h-11 rounded-md gap-2 font-medium text-base sm:text-sm min-h-[48px] shadow-none bg-[#1D2D3D] text-white transition-colors duration-150 hover:bg-[#16222f]"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                      שלח קוד התחברות
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStep("choose")}
                      className="w-full text-sm text-[#5a6a78] hover:text-[#1D2D3D] min-h-[44px] transition-colors duration-150"
                    >
                      חזרה לאפשרויות התחברות
                    </button>
                  </motion.form>
                )}

                {/* ──── Step: Verify OTP ──── */}
                {step === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3 rounded-md bg-white p-3.5" style={{ boxShadow: RING, border: "1px solid #E7EDF1" }}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: TURQ_TEXT }} />
                      <p className="text-sm text-[#3a4c5a]">
                        שלחנו קוד חד-פעמי ל-<span className="font-medium text-[#1D2D3D]" dir="ltr">{email}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <Label className="text-[13px] font-medium text-[#1D2D3D]">קוד חד-פעמי (6 ספרות)</Label>
                      <InputOTP maxLength={6} value={otp} onChange={setOtp} dir="ltr">
                        <InputOTPGroup style={{ fontFamily: MONO }}>
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
                      className="w-full h-12 sm:h-11 rounded-md gap-2 font-medium text-base sm:text-sm min-h-[48px] shadow-none bg-[#1D2D3D] text-white transition-colors duration-150 hover:bg-[#16222f]"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "אמת והתחבר"}
                    </Button>

                    <div className="flex justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => { setStep("email"); setOtp(""); }}
                        className="text-[#1D2D3D] hover:underline min-h-[44px] px-2 font-medium"
                      >
                        שנה כתובת מייל
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSendOtp(e as any)}
                        className="text-[#5a6a78] hover:text-[#1D2D3D] hover:underline min-h-[44px] px-2 transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none"
                        disabled={loading}
                      >
                        שלח קוד מחדש
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Back to site + trust line — on the white canvas */}
          <div className="mt-5 space-y-3 text-center">
            <div>
              <Link
                to="/"
                className="text-sm text-[#1D2D3D] hover:underline font-medium min-h-[44px] px-4 inline-flex items-center"
              >
                חזרה לאתר הראשי
              </Link>
            </div>
            <p
              className="text-[11px] tracking-[0.14em]"
              style={{ fontFamily: MONO, color: MUTED }}
              dir="ltr"
            >
              SSL ENCRYPTED · SEELD © {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PersonalAreaLogin;
