import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Illustration } from "@/components/brand/Illustration";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, IVORY, LINE, MUTED, PASTEL_SAGE } from "@/lib/brand";

// Personal-area entry (kit p.06): ivory canvas, white card with the logo and a
// labelled form; the journey illustration keeps the statement panel on desktop.

const whatIsInside = [
  "הפוליסות, החיסכון והמסמכים שלכם במקום אחד.",
  "המלצות שהיועץ תיעד בתיק, עם ההסבר שלצידן.",
  "פנייה ליועץ ומעקב אחרי מה שסוכם.",
];

const socialButtonClass =
  "w-full inline-flex items-center justify-center gap-3 min-h-[48px] rounded-xl border bg-white text-[16px] font-bold transition-colors hover:border-[#003D30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30] disabled:opacity-60 disabled:pointer-events-none";

const PersonalAreaLogin = () => {
  const [step, setStep] = useState<"choose" | "email" | "otp">("choose");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signInWithOtp, verifyOtp, signInWithGoogle, signInWithFacebook } = useAuth();
  const reduced = useReducedMotion();

  const stepMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, x: -8 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 8 },
        transition: { duration: 0.18, ease: "easeOut" as const },
      };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    try {
      const fn = provider === "google" ? signInWithGoogle : signInWithFacebook;
      const { error } = await fn();
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ההתחברות לא הצליחה. נסו שוב.");
      setSocialLoading(null);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("נא להזין כתובת אימייל תקינה.");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const { error } = await signInWithOtp(value);
      if (error) throw error;
      setStep("otp");
      toast.success("קוד חד-פעמי נשלח לכתובת שהזנתם.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שליחת הקוד לא הצליחה. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    try {
      const { error } = await verifyOtp(email.trim(), otp);
      if (error) throw error;
      toast.success("התחברתם בהצלחה.");
    } catch {
      toast.error("הקוד שגוי או שפג תוקפו. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: IVORY }}>
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* ── Entry column: logo + the white card ── */}
        <div className="dna-page flex flex-col items-center justify-center px-5 sm:px-8 py-8 sm:py-12">
          <div className="dna-circles" aria-hidden="true">
            <div
              className="dna-circ hidden md:block"
              style={{ width: 300, height: 300, top: -140, left: -120, backgroundColor: PASTEL_SAGE, opacity: 0.8 }}
            />
          </div>

          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[440px]"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link
                to="/"
                aria-label="שילד ביטוח ופיננסים, לדף הבית"
                className="inline-flex rounded-md p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#003D30]"
              >
                <img
                  src="/brand/logo.png"
                  alt="שילד ביטוח ופיננסים"
                  width={118}
                  height={51}
                  style={{ height: 51, width: "auto" }}
                  decoding="async"
                  fetchPriority="high"
                  draggable={false}
                />
              </Link>
              <Link to="/" className="link-rule text-[14px]">
                חזרה לאתר
              </Link>
            </div>

            <div className="dna-concept !p-6 sm:!p-8">
              <h1 className="text-[26px] sm:text-[28px] leading-tight" style={{ color: GREEN }}>
                {step === "choose" && "כניסה לאזור האישי"}
                {step === "email" && "כניסה עם קוד לאימייל"}
                {step === "otp" && "הזנת הקוד"}
              </h1>
              <p className="mt-2 text-[16px] leading-[1.6]" style={{ color: MUTED }}>
                {step === "choose" && "בחרו איך להיכנס. הפרטים משמשים לזיהוי בלבד."}
                {step === "email" && "נשלח לכתובת שתזינו קוד חד-פעמי בן שש ספרות."}
                {step === "otp" && (
                  <>
                    הקוד נשלח לכתובת{" "}
                    <span className="font-bold whitespace-nowrap" style={{ color: GREEN }} dir="ltr">{email.trim()}</span>
                  </>
                )}
              </p>

              <div className="mt-6">
                <AnimatePresence mode="wait">
                  {step === "choose" && (
                    <motion.div key="choose" {...stepMotion} className="space-y-3">
                      <button
                        type="button"
                        className={socialButtonClass}
                        style={{ borderColor: LINE, color: GREEN }}
                        onClick={() => handleSocialLogin("google")}
                        disabled={!!socialLoading}
                      >
                        {socialLoading === "google" ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        ) : (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        )}
                        <span>המשך עם</span>
                        <span dir="ltr">Google</span>
                      </button>

                      <button
                        type="button"
                        className={socialButtonClass}
                        style={{ borderColor: LINE, color: GREEN }}
                        onClick={() => handleSocialLogin("facebook")}
                        disabled={!!socialLoading}
                      >
                        {socialLoading === "facebook" ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        ) : (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        )}
                        <span>המשך עם</span>
                        <span dir="ltr">Facebook</span>
                      </button>

                      <div className="flex items-center gap-3 py-1" aria-hidden="true">
                        <span className="flex-1 h-px" style={{ backgroundColor: LINE }} />
                        <span className="text-[14px]" style={{ color: MUTED }}>או</span>
                        <span className="flex-1 h-px" style={{ backgroundColor: LINE }} />
                      </div>

                      <button
                        type="button"
                        className="btn-primary w-full"
                        onClick={() => setStep("email")}
                      >
                        <Mail className="h-5 w-5" aria-hidden="true" />
                        כניסה עם קוד לאימייל
                      </button>
                    </motion.div>
                  )}

                  {step === "email" && (
                    <motion.form key="email" {...stepMotion} onSubmit={handleSendOtp} className="space-y-4" noValidate>
                      <div>
                        <label htmlFor="pa-email" className="block text-[14px] font-bold mb-1.5" style={{ color: GREEN }}>
                          כתובת אימייל <span aria-hidden="true" style={{ color: "#BD582D" }}>*</span>
                        </label>
                        <input
                          id="pa-email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                          required
                          autoComplete="email"
                          inputMode="email"
                          dir="ltr"
                          className="field"
                          style={{ textAlign: "left" }}
                          aria-invalid={emailError ? "true" : undefined}
                          aria-describedby={emailError ? "pa-email-err" : undefined}
                          autoFocus
                        />
                        {emailError && (
                          <p id="pa-email-err" className="mt-1.5 text-[14px]" style={{ color: "#9A4520" }}>{emailError}</p>
                        )}
                      </div>
                      <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "שלחו לי קוד"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("choose")}
                        className="link-rule text-[15px] mx-auto"
                      >
                        <BrandIcon name="arrow-left" size={16} className="rotate-180" />
                        חזרה לאפשרויות הכניסה
                      </button>
                    </motion.form>
                  )}

                  {step === "otp" && (
                    <motion.div key="otp" {...stepMotion} className="space-y-5">
                      <div>
                        <p id="pa-otp-label" className="text-[14px] font-bold mb-3" style={{ color: GREEN }}>
                          קוד חד-פעמי (שש ספרות)
                        </p>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={otp} onChange={setOtp} dir="ltr" aria-labelledby="pa-otp-label">
                            <InputOTPGroup style={{ fontVariantNumeric: "tabular-nums" }}>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="btn-primary w-full"
                        disabled={loading || otp.length !== 6}
                      >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "אימות וכניסה"}
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-[15px]">
                        <button
                          type="button"
                          onClick={() => { setStep("email"); setOtp(""); }}
                          className="link-rule"
                        >
                          שינוי כתובת האימייל
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          className="link-rule"
                          disabled={loading}
                        >
                          שליחת קוד מחדש
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-5 text-[14px] text-center leading-[1.6]" style={{ color: MUTED }}>
              הכניסה מוצפנת. אין לנו גישה לסיסמאות של החשבונות החיצוניים שלכם.
            </p>
          </motion.div>
        </div>

        {/* ── Statement column (desktop): the journey, and what waits inside ── */}
        <div
          className="hidden lg:flex items-center justify-center px-12 py-16 border-r"
          style={{ backgroundColor: PASTEL_SAGE, borderColor: LINE }}
        >
          <div className="w-full max-w-[520px]">
            <Illustration name="01-journey" priority sizes="(min-width: 1024px) 520px, 100vw" />
            <h2 className="mt-8 text-[30px] leading-tight" style={{ color: GREEN }}>
              תמונה ברורה. צעד הבא ברור.
            </h2>
            <p className="mt-3 text-[17px] leading-[1.7]" style={{ color: BODY }}>
              ממפים את התיק ומלווים את הדרך. מה מחכה באזור האישי:
            </p>
            <ul className="mt-4 border-t" style={{ borderColor: "rgba(0,61,48,0.15)" }}>
              {whatIsInside.map((line) => (
                <li key={line} className="dna-pill-item !py-3 border-b text-[16px]" style={{ borderColor: "rgba(0,61,48,0.15)" }}>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalAreaLogin;
