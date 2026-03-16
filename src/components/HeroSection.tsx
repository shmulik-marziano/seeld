import { ArrowDownLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden bg-[#f8f9fc]">
      {/* Decorative colored circles - hidden on mobile */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Large teal circle - top right */}
        <motion.div
          className="absolute top-[8%] left-[5%] w-[140px] h-[140px] rounded-full bg-[#5ec6c6]/15"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Amber circle - middle right */}
        <motion.div
          className="absolute top-[25%] left-[15%] w-[80px] h-[80px] rounded-full bg-[#f4a261]/20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Green circle - bottom left area */}
        <motion.div
          className="absolute bottom-[20%] left-[8%] w-[100px] h-[100px] rounded-full bg-[#90be6d]/15"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Coral circle - small accent */}
        <motion.div
          className="absolute top-[55%] left-[22%] w-[50px] h-[50px] rounded-full bg-[#e76f51]/15"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        {/* Small teal dot */}
        <motion.div
          className="absolute top-[15%] right-[25%] w-[24px] h-[24px] rounded-full bg-[#5ec6c6]/25"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Small amber dot */}
        <motion.div
          className="absolute bottom-[30%] right-[15%] w-[18px] h-[18px] rounded-full bg-[#f4a261]/30"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        {/* Dashed curved SVG connector with arrow */}
        <svg className="absolute top-[10%] left-[2%] w-[400px] h-[500px] opacity-[0.12]" viewBox="0 0 400 500" fill="none">
          <motion.path
            d="M350,60 C280,60 200,120 220,200 C240,280 150,320 100,380 C80,410 90,450 130,460"
            stroke="#0a3d3d"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, delay: 0.5, ease: "easeInOut" }}
          />
          {/* Arrow head */}
          <motion.polygon
            points="125,452 135,468 143,454"
            fill="#0a3d3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 0.3 }}
          />
        </svg>

        {/* Second dashed line - shorter */}
        <svg className="absolute bottom-[15%] right-[5%] w-[250px] h-[200px] opacity-[0.08]" viewBox="0 0 250 200" fill="none">
          <path
            d="M20,20 C80,10 120,80 180,60 C220,48 240,100 200,140"
            stroke="#5ec6c6"
            strokeWidth="2"
            strokeDasharray="6 5"
            strokeLinecap="round"
            fill="none"
          />
          <polygon points="195,134 205,148 210,132" fill="#5ec6c6" />
        </svg>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-20 sm:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto lg:mx-0 lg:mr-0">
          {/* Content */}
          <div className="space-y-8 lg:space-y-10">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0a3d3d]/[0.06] border border-[#0a3d3d]/[0.08] text-xs sm:text-sm text-[#0a3d3d] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#5ec6c6] animate-pulse" />
                חלק מבית עמיתים הון
              </span>
            </motion.div>

            {/* MASSIVE heading */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] font-extrabold leading-[0.95] tracking-tight"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            >
              <span className="text-[#0a3d3d]">הביטחון הפיננסי</span>
              <br />
              <span className="text-[#0a3d3d]">שלך </span>
              <span className="relative inline-block">
                <span className="text-[#5ec6c6]">מתחיל כאן</span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-[5px] bg-[#f4a261] rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
                  style={{ transformOrigin: "right" }}
                />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-[#0a3d3d]/50 leading-relaxed max-w-2xl font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            >
              SEELD — חלק מבית עמיתים הון | שירות אישי, מקצועי, בגובה העיניים
            </motion.p>

            {/* CTA buttons - pill shaped */}
            <motion.div
              className="flex flex-col sm:flex-row items-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              <Link to="/contact" className="w-full sm:w-auto">
                <Button className="bg-[#0a3d3d] text-white hover:bg-[#0d4a4a] rounded-full px-10 py-5 text-base font-bold transition-all shadow-xl shadow-[#0a3d3d]/15 w-full sm:w-auto min-h-[56px] hover:shadow-2xl hover:shadow-[#0a3d3d]/20">
                  קבלו הצעה מותאמת
                  <ArrowDownLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <a href="https://wa.me/972523097444" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button variant="outline" className="border-[#0a3d3d]/20 text-[#0a3d3d] hover:bg-[#0a3d3d]/[0.04] rounded-full px-10 py-5 text-base font-semibold transition-all w-full sm:w-auto min-h-[56px]">
                  <Phone className="w-5 h-5 ml-2" />
                  דברו איתנו
                </Button>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Trust bar */}
        <motion.div
          className="mt-20 sm:mt-28 pt-8 border-t border-[#0a3d3d]/[0.08]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-4">
            {[
              { text: "חלק מבית", highlight: "עמיתים הון", dotColor: "#5ec6c6" },
              { text: "סוכנות מבוססת ומפוקחת", dotColor: "#f4a261" },
              { text: "שירות בגובה העיניים", dotColor: "#90be6d" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && <span className="hidden sm:block w-px h-5 bg-[#0a3d3d]/10" />}
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.dotColor }} />
                  <span className="text-sm sm:text-base text-[#0a3d3d]/50 font-medium">
                    {item.text}{" "}
                    {item.highlight && <span className="text-[#0a3d3d] font-bold">{item.highlight}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
