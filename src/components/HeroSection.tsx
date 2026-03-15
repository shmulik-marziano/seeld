import { Phone, Mail, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative rounded-[2.5rem] overflow-hidden my-8 md:my-12">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--muted))] via-[hsl(var(--card))] to-[hsl(var(--accent)/0.15)]" />
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--accent)/0.2)] rounded-full blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 bg-[hsl(var(--secondary)/0.25)] rounded-full blur-[100px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
      </div>

      <div className="relative grid md:grid-cols-2 gap-6 md:gap-12 p-6 md:p-12 lg:p-16">
        {/* Right side - Image */}
        <motion.div
          className="relative aspect-[4/3] md:aspect-auto rounded-[2rem] overflow-hidden md:order-2 group"
          initial={{ opacity: 0, scale: 0.92, x: -40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1920&q=80"
            alt="תכנון פיננסי וביטוח"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>

        {/* Left side - Content */}
        <div className="flex flex-col justify-center space-y-6 md:space-y-8 md:order-1">
          <div className="space-y-4 md:space-y-6">
            {/* Eyebrow tag */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-accent"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold text-accent tracking-wide">SeelD פיננסים וביטוח</span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.08] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              הביטחון הפיננסי
              <span className="block mt-1">
                שלכם מתחיל{" "}
                <span className="relative inline-block">
                  כאן
                  <motion.svg
                    className="absolute -bottom-2 left-0 w-full"
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
              className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              ברוכים הבאים ל-SeelD פיננסים וביטוח: המקום שבו תמצאו את כל הפתרונות לחיסכון, השקעות וביטוח במקום אחד. אנחנו כאן כדי להבטיח לכם עתיד כלכלי יציב ובטוח.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-5 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Link to="/contact">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-4 md:px-10 md:py-6 text-base font-medium transition-all hover:shadow-lg w-full sm:w-auto group/btn">
                  להצטרפות ל-SeelD
                  <ArrowDownLeft className="w-4 h-4 mr-1 transition-transform group-hover/btn:-translate-x-1 group-hover/btn:translate-y-0.5" />
                </Button>
              </motion.div>
            </Link>

            <div className="flex items-center gap-3">
              {[
                { href: "https://wa.me/972523097444", icon: Phone, label: "וואטסאפ" },
                { href: "mailto:info@seeld-ins.co.il", icon: Mail, label: "אימייל" },
              ].map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-11 h-11 rounded-full border border-border/60 hover:border-accent hover:bg-accent/10 transition-all flex items-center justify-center"
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
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
