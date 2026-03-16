import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Shield, TrendingUp, Users, HeartHandshake, FileSearch, CheckCircle2, FileText, Briefcase, PiggyBank, Heart } from "lucide-react";
import { brandDots } from "@/components/SeeIDLogo";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const scanSteps = [
  { text: "סורק פוליסות ביטוח קיימות", icon: Shield, color: brandDots[1].fill, duration: 1200 },
  { text: "בודק חיסכון פנסיוני", icon: PiggyBank, color: brandDots[3].fill, duration: 1000 },
  { text: "מנתח קרנות השתלמות", icon: Briefcase, color: brandDots[2].fill, duration: 800 },
  { text: "בודק ביטוחי בריאות וחיים", icon: Heart, color: brandDots[4].fill, duration: 1100 },
  { text: "מחשב פוטנציאל חיסכון", icon: TrendingUp, color: brandDots[0].fill, duration: 900 },
];

const findings = [
  { label: "חיסכון שנתי ממוצע", value: "₪4,200", icon: TrendingUp },
  { label: "מוצרי ביטוח לבדיקה", value: "16+", icon: Shield },
  { label: "אפיקי חיסכון זמינים", value: "11", icon: Users },
];

function AnimatedCounter({ target, duration = 2 }: { target: string; duration?: number }) {
  const isNumber = /^\d/.test(target);
  const num = isNumber ? parseInt(target.replace(/[^\d]/g, "")) : 0;
  const prefix = isNumber ? (target.match(/^[^\d]*/)?.[0] || "") : "";
  const suffix = isNumber ? (target.match(/[^\d]*$/)?.[0] || "") : "";

  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v: number) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  const [display, setDisplay] = useState(isNumber ? `${prefix}0${suffix}` : target);

  useEffect(() => {
    if (!isNumber) return;
    const unsub = rounded.on("change", setDisplay);
    const controls = animate(motionVal, num, { duration, ease: "easeOut" });
    return () => { unsub(); controls.stop(); };
  }, []);

  return <motion.span>{display}</motion.span>;
}

/** Typewriter text that appears character by character */
function TypewriterText({ text, delay = 0, speed = 40 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 600);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay, speed]);

  return (
    <span>
      {displayed}
      {showCursor && (
        <motion.span
          className="inline-block w-[2px] h-[1em] bg-accent ml-0.5 align-text-bottom"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </span>
  );
}

const IntroSection = () => {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const hasScanned = useRef(false);

  const startScan = () => {
    if (scanState !== "idle") return;
    setScanState("scanning");
    setCurrentStep(0);
    setProgress(0);
    setCompletedSteps([]);

    let step = 0;
    const totalDuration = scanSteps.reduce((a, s) => a + s.duration, 0);
    let elapsed = 0;

    const runStep = () => {
      if (step >= scanSteps.length) {
        setScanState("done");
        setProgress(100);
        return;
      }
      setCurrentStep(step);
      const stepDuration = scanSteps[step].duration;
      const startProgress = (elapsed / totalDuration) * 100;
      elapsed += stepDuration;
      const endProgress = (elapsed / totalDuration) * 100;

      const startTime = Date.now();
      const tick = () => {
        const now = Date.now();
        const pct = Math.min((now - startTime) / stepDuration, 1);
        setProgress(startProgress + (endProgress - startProgress) * pct);
        if (pct < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      const currentStepIndex = step;
      step++;
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, currentStepIndex]);
        runStep();
      }, stepDuration);
    };
    runStep();
  };

  useEffect(() => {
    if (hasScanned.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasScanned.current) {
          hasScanned.current = true;
          setTimeout(startScan, 600);
        }
      },
      { threshold: 0.3 }
    );
    const el = document.getElementById("client-scanner");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="max-w-5xl mx-auto py-10 sm:py-16 md:py-24 px-2 sm:px-4" id="client-scanner">
      <div className="text-center space-y-3 sm:space-y-5 mb-8 sm:mb-14">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <FileSearch className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-muted-foreground font-medium">סריקה חכמה</span>
        </motion.div>
        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          סורק תיק לקוח
        </motion.h2>
        <motion.p
          className="text-muted-foreground max-w-xl mx-auto text-xs sm:text-sm md:text-base px-2"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          בדיקה מהירה של כל מוצרי הביטוח והחיסכון שלכם — גלו כמה אתם יכולים לחסוך
        </motion.p>
      </div>

      {/* Scanner card */}
      <motion.div
        className="relative rounded-2xl sm:rounded-3xl border border-border/30 overflow-hidden max-w-2xl mx-auto shadow-xl"
        style={{
          background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-border/20 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: brandDots[1].fill }} />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: brandDots[2].fill }} />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: brandDots[3].fill }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/40" />
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/50 font-mono tracking-wider hidden sm:inline">SEELD — סורק תיק לקוח</span>
            <span className="text-[10px] text-muted-foreground/50 font-mono tracking-wider sm:hidden">SEELD Scanner</span>
          </div>
        </div>

        <div className="p-4 sm:p-7 md:p-10 min-h-[240px] sm:min-h-[280px] flex flex-col justify-center">
          {/* Idle */}
          {scanState === "idle" && (
            <div className="text-center space-y-4 sm:space-y-6">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FileSearch className="w-10 h-10 sm:w-14 sm:h-14 mx-auto text-accent/50" />
              </motion.div>
              <p className="text-xs sm:text-sm text-muted-foreground">מתחיל סריקה...</p>
            </div>
          )}

          {/* Scanning */}
          {scanState === "scanning" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Progress */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-muted-foreground/60 font-mono">
                  <span>{Math.round(progress)}%</span>
                  <span>סריקת תיק לקוח</span>
                </div>
                <div className="h-1 sm:h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full transition-colors duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: scanSteps[currentStep]?.color || brandDots[3].fill,
                    }}
                  />
                </div>
              </div>

              {/* Steps log — typewriter style */}
              <div className="space-y-1.5 sm:space-y-2 font-mono text-xs sm:text-sm" dir="rtl">
                {scanSteps.map((step, i) => {
                  const StepIcon = step.icon;
                  const isCompleted = completedSteps.includes(i);
                  const isCurrent = i === currentStep;
                  const isHidden = i > currentStep;

                  if (isHidden) return null;

                  return (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: step.color }} />
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <StepIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-muted-foreground/60" />
                        </motion.div>
                      )}
                      <span className={`${isCompleted ? "text-foreground/70" : "text-muted-foreground"}`}>
                        {isCurrent ? (
                          <TypewriterText text={step.text} speed={50} />
                        ) : (
                          step.text
                        )}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Done */}
          {scanState === "done" && (
            <motion.div
              className="space-y-5 sm:space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Completed steps summary */}
              <div className="space-y-1 sm:space-y-1.5 font-mono text-xs sm:text-sm" dir="rtl">
                {scanSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2 sm:gap-3 py-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: step.color }} />
                    <span className="text-foreground/60">{step.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border/30" />
                <motion.span
                  className="text-[10px] sm:text-xs font-bold text-accent"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  הסריקה הושלמה
                </motion.span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              {/* Results */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {findings.map((f, i) => (
                  <motion.div
                    key={f.label}
                    className="text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 200 }}
                  >
                    <f.icon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2.5 text-accent" />
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                      <AnimatedCounter target={f.value} duration={1.5} />
                    </div>
                    <div className="text-[9px] sm:text-[11px] text-muted-foreground mt-1 sm:mt-1.5 leading-tight">{f.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                className="text-center space-y-2 sm:space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Link to="/onboarding">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="rounded-full px-6 sm:px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm">
                      <HeartHandshake className="ml-1.5 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                      קבלו ניתוח מלא — בחינם
                    </Button>
                  </motion.div>
                </Link>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-[10px] sm:text-xs"
                    onClick={() => { setScanState("idle"); setCurrentStep(0); setProgress(0); setCompletedSteps([]); setTimeout(startScan, 400); }}
                  >
                    סרוק שוב
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default IntroSection;
