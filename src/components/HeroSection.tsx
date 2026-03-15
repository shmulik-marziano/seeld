import { Phone, Mail, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const floatingShapes = [
  { size: 180, x: "8%", y: "12%", color: "hsl(var(--accent)/0.08)", delay: 0, duration: 7 },
  { size: 120, x: "78%", y: "65%", color: "hsl(var(--primary)/0.06)", delay: 1.5, duration: 9 },
  { size: 90, x: "65%", y: "10%", color: "hsl(var(--seeld-mint)/0.1)", delay: 3, duration: 8 },
  { size: 60, x: "20%", y: "75%", color: "hsl(var(--seeld-coral)/0.07)", delay: 2, duration: 6 },
];

const HeroSection = () => {
  return (
    <section className="relative rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden my-4 sm:my-8 md:my-12">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--muted))] via-[hsl(var(--card))] to-[hsl(var(--accent)/0.12)]" />
      <div className="absolute inset-0 bg-gradient-to-tl from-[hsl(var(--primary)/0.05)] via-transparent to-transparent" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[hsl(var(--accent)/0.15)] rounded-full blur-[100px] sm:blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[hsl(var(--primary)/0.12)] rounded-full blur-[80px] sm:blur-[120px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.15, 0.3], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-[hsl(var(--seeld-mint)/0.08)] rounded-full blur-[90px] sm:blur-[130px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Floating geometric shapes */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full hidden sm:block"
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
            backgroundColor: shape.color,
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      ))}

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 p-5 sm:p-8 md:p-12 lg:p-16 xl:p-20">
        {/* Right side - Image */}
        <motion.div
          className="relative aspect-[4/3] md:aspect-auto rounded-2xl sm:rounded-[2rem] overflow-hidden md:order-2 group shadow-2xl"
          initial={{ opacity: 0, scale: 0.92, x: -40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative border glow */}
          <div className="absolute -inset-[1px] rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-accent/20 via-transparent to-primary/20 z-10 pointer-events-none" />
          <img
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80"
            alt="תכנון פיננסי וביטוח"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />

          {/* Floating badge on image */}
          <motion.div
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 backdrop-blur-xl bg-white/80 dark:bg-black/60 rounded-2xl px-4 py-3 shadow-lg border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">SeelD</p>
                <p className="text-[10px] text-muted-foreground">פיננסים וביטוח</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Left side - Content */}
        <div className="flex flex-col justify-center space-y-5 sm:space-y-6 md:space-y-8 md:order-1">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Eyebrow tag */}
            <motion.div
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-accent"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[11px] sm:text-xs font-semibold text-accent tracking-wide">SeelD פיננסים וביטוח</span>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="bg-gradient-to-l from-foreground via-foreground to-foreground/80 bg-clip-text">
                הביטחון הפיננסי
              </span>
              <span className="block mt-1 sm:mt-2">
                שלכם מתחיל{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-l from-accent via-primary to-accent bg-clip-text text-transparent">
                    כאן
                  </span>
                  <motion.svg
                    className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                    viewBox="0 0 120 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                  >
                    <motion.path
                      d="M2 8C20 3 60 2 118 6"
                      stroke="hsl(var(--accent))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
                    />
                  </motion.svg>
                </span>
              </span>
            </motion.h1>

            <motion.p
              className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              ברוכים הבאים ל-SeelD פיננסים וביטוח: המקום שבו תמצאו את כל הפתרונות לחיסכון, השקעות וביטוח במקום אחד. אנחנו כאן כדי להבטיח לכם עתיד כלכלי יציב ובטוח.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-5 pt-2 sm:pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Link to="/contact" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 sm:px-8 py-3.5 sm:py-4 md:px-10 md:py-6 text-sm sm:text-base font-medium transition-all hover:shadow-xl hover:shadow-primary/20 w-full sm:w-auto group/btn">
                  להצטרפות ל-SeelD
                  <ArrowDownLeft className="w-4 h-4 mr-1 transition-transform group-hover/btn:-translate-x-1 group-hover/btn:translate-y-0.5" />
                </Button>
              </motion.div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {[
                { href: "https://wa.me/972523097444", icon: Phone, label: "וואטסאפ" },
                { href: "mailto:info@seeld-ins.co.il", icon: Mail, label: "אימייל" },
              ].map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-border/60 hover:border-accent hover:bg-accent/10 transition-all duration-300 flex items-center justify-center backdrop-blur-sm bg-card/30"
                  aria-label={social.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.15, y: -2 }}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex items-center gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-border/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
          >
            {[
              { value: "15+", label: "שנות ניסיון" },
              { value: "5K+", label: "לקוחות מרוצים" },
              { value: "98%", label: "שביעות רצון" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.1 }}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
