import { ArrowDownLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-[#0a3d3d] via-[#0d4a4a] to-[#062e2e] rounded-2xl sm:rounded-3xl">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.04)_0%,_transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content - Right side in RTL */}
          <div className="space-y-8">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-white"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              הביטחון הפיננסי שלכם
              <br />
              <span className="text-[#5ec6c6]">מתחיל כאן</span>
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-white/60 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            >
              פתרונות ביטוח, חיסכון ופנסיה מותאמים אישית.
              ליווי מקצועי לכל שלבי החיים.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <Link to="/contact" className="w-full sm:w-auto">
                <Button className="bg-white text-[#0a3d3d] hover:bg-white/90 rounded-full px-8 py-3.5 text-sm font-semibold transition-all shadow-lg w-full sm:w-auto min-h-[44px]">
                  קבלו הצעה מותאמת
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
              <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 rounded-full px-8 py-3.5 text-sm font-semibold transition-all bg-transparent w-full sm:w-auto min-h-[44px]">
                  <Phone className="w-4 h-4 ml-2" />
                  דברו איתנו
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Image - Left side in RTL */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80"
                alt="תכנון פיננסי וביטוח"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a3d3d]/40 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Trust indicators */}
        <motion.div
          className="mt-12 sm:mt-16 pt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-2 text-xs sm:text-sm text-white/40">
            <span>15+ שנות ניסיון</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>5,000+ לקוחות מרוצים</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>שירות אישי ומקצועי</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
