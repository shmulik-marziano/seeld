import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { GREEN, MUTED } from "@/lib/brand";
import { CaFrame, LOGO_W } from "@/components/sd/client";
import { SdIcon, SdPic } from "@/components/sd/primitives";

// Personal-area entry: calm and warm. A sage field with the family illustration
// beside a white form card; on a phone the illustration sits above the form.

const whatIsInside = [
  { icon: "document", t: "הפוליסות, החיסכון והמסמכים שלכם במקום אחד." },
  { icon: "checklist", t: "המלצות שהצוות שלנו תיעד בתיק, עם ההסבר שלצידן." },
  { icon: "handshake", t: "פנייה אלינו ומעקב אחרי מה שסוכם." },
];

const PersonalAreaLogin = () => {
  const [step, setStep] = useState<"choose" | "email" | "otp">("choose");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithOtp, verifyOtp } = useAuth();
  const reduced = useReducedMotion();

  const stepMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, x: -8 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 8 },
        transition: { duration: 0.18, ease: "easeOut" as const },
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
    <CaFrame tint="sage" className="sd-ca-login-frame">
      <div className="sd-ca-login">
        <div className="sd-ca-login-form">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-[440px]"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <Link
                to="/"
                aria-label="שילד ביטוח ופיננסים, לדף הבית"
                className="inline-flex rounded-md p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#203957]"
              >
                <img
                  src="/brand/logo.png"
                  alt="שילד ביטוח ופיננסים"
                  width={LOGO_W}
                  height={44}
                  style={{ height: 44, width: "auto" }}
                  decoding="async"
                  draggable={false}
                />
              </Link>
              <Link to="/" className="sd-ca-back-lnk">
                חזרה לאתר
              </Link>
            </div>
            <div className="sd-ca-login-mobile" aria-hidden="true"><SdPic name="02-family-protection" sizes="260px" priority /></div>

            <div className="sd-ca-formcard">
              <span className="sd-eyebrow">האזור האישי שלכם</span>
              <h1 className="mt-3">
                {step === "choose" && "כניסה לאזור האישי"}
                {step === "email" && "כניסה עם קוד לאימייל"}
                {step === "otp" && "הזנת הקוד"}
              </h1>
              <p className="sd-ca-sub">
                {step === "choose" && "הפרטים משמשים לזיהוי בלבד."}
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
                      <p className="text-[15px] leading-[1.65]" style={{ color: MUTED }}>
                        הכניסה פתוחה ללקוחות שקיבלו מאיתנו הזמנה. בקרוב: כניסה עם תעודת זהות והודעה לנייד.
                      </p>

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
              הכניסה מוצפנת וזמינה ללקוחות שהוזמנו על ידי הצוות.
            </p>
          </motion.div>
        </div>

        {/* Statement column (desktop): what waits inside */}
        <div className="sd-ca-login-panel">
          <div className="sd-ca-login-panel-in">
            <div className="sd-ca-login-art" aria-hidden="true"><SdPic name="02-family-protection" sizes="(min-width: 1024px) 500px, 100vw" priority /></div>
            <h2 className="sd-h2 mt-8">הכול שלכם, במקום אחד ושקט.</h2>
            <p className="sd-text mt-3">אנחנו ממפים את התיק ומלווים את הדרך. מה מחכה באזור האישי:</p>
            <ul className="sd-ca-ticks">
              {whatIsInside.map((it) => (
                <li key={it.t}><SdIcon name={it.icon} size={40} /><span>{it.t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </CaFrame>
  );
};

export default PersonalAreaLogin;
