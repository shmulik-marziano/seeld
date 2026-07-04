import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const INK = "#1a1a18";
const BRONZE = "#9c8a63";
const SERIF = "'Frank Ruhl Libre', 'Heebo', serif";

const specSheet = [
  { label: "משפחות בליווי", value: "600+" },
  { label: "חברות בהשוואה", value: "12" },
  { label: "דוח תיק מלא", value: "48 שעות" },
  { label: "פגישה ראשונה", value: "ללא עלות" },
  { label: "משרדים", value: "רעננה · ירושלים" },
  { label: "פיקוח", value: "רשות שוק ההון" },
];

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

const HeroSection = () => {
  return (
    <section className="bg-[#f6f5f1]" dir="rtl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 lg:pt-32 pb-14 sm:pb-20">
        {/* Top rule + label */}
        <motion.div {...rise(0)} className="border-t border-[#1a1a18]/20 pt-5 mb-14 sm:mb-20 flex items-baseline justify-between gap-4">
          <span className="text-[11px] tracking-[0.25em] font-medium text-[#1a1a18]/60">
            SEELD — בית פיננסים פרטי
          </span>
          <span className="text-[11px] tracking-[0.15em] font-medium text-[#1a1a18]/40 hidden sm:block">
            מבית עמיתים הון
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-14 lg:gap-24 items-start">
          {/* Statement */}
          <div>
            <motion.h1
              {...rise(0.08)}
              className="text-[#1a1a18] leading-[1.12] mb-9"
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: "clamp(2.6rem, 6.5vw, 4.9rem)",
                letterSpacing: "-0.01em",
              }}
            >
              שקט פיננסי
              <br />
              הוא לא מקרה.
              <br />
              <span style={{ color: BRONZE }}>הוא מתוכנן.</span>
            </motion.h1>

            <motion.p
              {...rise(0.2)}
              className="text-[#1a1a18]/60 text-base sm:text-[17px] leading-[1.9] max-w-md mb-10"
            >
              אנחנו מלווים משפחות בביטוח, בפנסיה ובהשקעות — יועץ אישי אחד,
              השוואה שקופה מול כל החברות בישראל, ותשתית דיגיטלית שמראה לך
              בכל רגע איפה הכסף עומד.
            </motion.p>

            <motion.div {...rise(0.3)} className="flex flex-wrap items-center gap-6">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-9 py-4 bg-[#1a1a18] text-[#f6f5f1] text-[15px] font-medium tracking-wide hover:bg-[#33332f] transition-colors duration-300 min-h-[52px]"
              >
                בדיקת תיק ללא עלות
              </Link>
              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#1a1a18] border-b border-[#1a1a18]/25 pb-0.5 hover:border-[#1a1a18] transition-colors"
              >
                שיחה עם יועץ
                <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
              </a>
            </motion.div>
          </div>

          {/* Spec sheet */}
          <motion.div {...rise(0.25)}>
            <div className="border-t border-[#1a1a18]/20">
              {specSheet.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between py-[15px] border-b border-[#1a1a18]/10"
                >
                  <span className="text-[13px] text-[#1a1a18]/45">{row.label}</span>
                  <span
                    className="text-[15px] text-[#1a1a18] tabular-nums"
                    style={{ fontFamily: SERIF, fontWeight: 500 }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-[#1a1a18]/35">
              סוכנות ביטוח פנסיונית מורשית. חברים בלשכת סוכני הביטוח.
              ההשוואות מבוססות על נתונים רשמיים של רשות שוק ההון.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
