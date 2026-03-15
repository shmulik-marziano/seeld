import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Scan, ShieldCheck, Brain, ArrowLeft } from "lucide-react";

const scanLines = [
  { label: "ביטוח בריאות", status: "בדיקת כיסוי", icon: "🏥" },
  { label: "קרן פנסיה", status: "ניתוח תשואות", icon: "📊" },
  { label: "ביטוח חיים", status: "השוואת מחירים", icon: "🛡️" },
  { label: "קרן השתלמות", status: "בדיקת הטבות מס", icon: "💰" },
  { label: "ביטוח משכנתא", status: "אופטימיזציה", icon: "🏠" },
];

const TestimonialsSection = () => {
  const [activeLine, setActiveLine] = useState(0);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setActiveLine((prev) => {
        if (prev >= scanLines.length - 1) {
          setIsScanning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isScanning]);

  useEffect(() => {
    // Reset and loop
    if (!isScanning) {
      const timeout = setTimeout(() => {
        setActiveLine(0);
        setIsScanning(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isScanning]);

  return (
    <section className="py-12 sm:py-16 md:py-24 relative">
      <div className="absolute inset-0 -mx-4 sm:-mx-6 lg:-mx-8 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent pointer-events-none" />

      <motion.div
        className="text-center mb-8 sm:mb-14 space-y-3 relative z-10 px-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm">
          <Brain className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-muted-foreground font-medium">ניתוח פיננסי חכם</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
          הטכנולוגיה עובדת בשבילכם
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
          סריקה חכמה של כל מוצרי הביטוח והחיסכון — למציאת ההתאמה המושלמת
        </p>
      </motion.div>

      <motion.div
        className="relative z-10 max-w-2xl mx-auto px-2"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Terminal-like scanner card */}
        <div className="rounded-2xl sm:rounded-2xl bg-card border border-border/40 overflow-hidden shadow-[0_20px_60px_-15px_hsl(var(--accent)/0.1)]">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-border/30 bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-accent/50" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary/40" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-mono">SeelD Scanner v2.0</span>
            </div>
            <motion.div
              animate={isScanning ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={{ duration: 1, repeat: isScanning ? Infinity : 0 }}
            >
              <Scan className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
            </motion.div>
          </div>

          {/* Scan lines */}
          <div className="p-3.5 sm:p-5 space-y-2 sm:space-y-2.5">
            {scanLines.map((line, index) => {
              const isActive = index === activeLine;
              const isCompleted = index < activeLine || !isScanning;

              return (
                <motion.div
                  key={line.label}
                  className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-500 ${
                    isActive
                      ? "bg-accent/10 border border-accent/20"
                      : isCompleted
                      ? "bg-muted/40 border border-border/20"
                      : "bg-transparent border border-transparent"
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-base sm:text-lg">{line.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-foreground">{line.label}</div>
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground">{line.status}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {isActive && isScanning ? (
                        <motion.div
                          key="scanning"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5"
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                          />
                          <span className="text-[10px] sm:text-[11px] text-accent font-medium font-mono">סורק...</span>
                        </motion.div>
                      ) : isCompleted ? (
                        <motion.div
                          key="done"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="waiting"
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-border/40"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom status */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-border/30 bg-muted/20">
            <AnimatePresence mode="wait">
              {!isScanning ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
                    <span className="text-[10px] sm:text-xs font-medium text-accent">סריקה הושלמה — נמצאו הזדמנויות לחיסכון</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1.5"
                >
                  <div className="flex justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                    <span>מנתח מוצרים...</span>
                    <span className="font-mono">{Math.round(((activeLine + 1) / scanLines.length) * 100)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      animate={{ width: `${((activeLine + 1) / scanLines.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="text-center mt-8 sm:mt-10 relative z-10"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Link to="/contact">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline" className="rounded-full px-6 sm:px-8 gap-2 text-sm">
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              קבלו ניתוח אישי בחינם
            </Button>
          </motion.div>
        </Link>
      </motion.div>
    </section>
  );
};

export default TestimonialsSection;
