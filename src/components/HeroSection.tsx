import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  INK, MONO,
  CHIP_ORANGE, CHIP_GREEN, CHIP_YELLOW,
} from "@/lib/brand";
import { CountUp, LiveClock, LiveDot } from "@/components/brand/Live";

// SEELD Bento: warm paper panels on ink gutters. Snap motion (STYLESEED.md).
const PAPER_MUTED = "#5c5c5c"; // AA on the warm paper

// Capital-markets ticker feed — the moving band on the paper tile.
// Values render in their own LTR span so "+11.4%" survives bidi.
const TICKER_ITEMS: { label: string; value?: string; dot?: boolean }[] = [
  { label: "SEELD · LIVE", dot: true },
  { label: "פנסיה מקיפה", value: "+11.4%" },
  { label: "S&P 500 · מסלול עוקב" },
  { label: "קרן השתלמות", value: "+9.8%" },
  { label: "גמל להשקעה", value: "+8.7%" },
  { label: "השוואה מול 12 חברות" },
];

// Repeating umbrella line-art — the reference's pattern tile, in insurance
const UMBRELLA_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23171717' stroke-width='2' stroke-linecap='round' opacity='0.3'%3E%3Cpath d='M14 26 C14 17 20 13 28 13 C36 13 42 17 42 26'/%3E%3Cpath d='M14 26 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0'/%3E%3Cpath d='M28 13 v-3'/%3E%3Cpath d='M28 26 v12 c0 4 6 4 6 1'/%3E%3C/g%3E%3C/svg%3E")`;

const snap = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: "easeOut" as const },
});

const LiveChip = ({
  label, color, className, delay,
}: { label: string; color: string; className: string; delay: number }) => (
  <motion.span
    className={`absolute z-10 flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-white text-[11px] sm:text-[13px] font-medium whitespace-nowrap ${className}`}
    style={{ backgroundColor: color, boxShadow: "0 2px 6px rgba(0,0,0,.18)" }}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.18, delay, ease: "easeOut" }}
  >
    {label}
  </motion.span>
);

const HeroSection = () => {
  const reduced = useReducedMotion();
  const anim = (delay: number) => (reduced ? {} : snap(delay));

  // Depth on scroll: the wordmark recedes a touch slower than the page
  const { scrollY } = useScroll();
  const wordmarkY = useTransform(scrollY, [0, 600], [0, 40]);

  return (
    <section dir="rtl" className="px-2 pt-2" style={{ backgroundColor: "#0a0a0a" }}>
      {/* ── Bento row: statement panel + live column ── */}
      <div className="grid gap-2 lg:grid-cols-[1.55fr_1fr]">
        {/* Main paper panel — the argument */}
        <div className="bento-panel p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[420px] lg:min-h-[520px]">
          <div className="relative z-10">
            <motion.h1
              {...anim(0)}
              className="text-[#171717] leading-[1.02] tracking-[-0.02em]"
              style={{ fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: "clamp(44px, 6.2vw, 92px)" }}
            >
              כסף מסודר.
              <br />
              ראש שקט.
            </motion.h1>
            <motion.p
              {...anim(0.06)}
              className="mt-6 text-base sm:text-lg leading-[1.8] max-w-md"
              style={{ color: PAPER_MUTED }}
            >
              בית פיננסים וביטוח. יועץ אחד שמכיר אותך, השוואה מול 12 חברות,
              ותמונה מלאה של התיק בתוך 48 שעות.
            </motion.p>
          </div>

          {/* Black CTA bar — the reference gesture */}
          <motion.div {...anim(0.12)} className="relative z-10 mt-10 flex flex-col sm:flex-row gap-2">
            <Link
              to="/contact"
              className="flex-1 inline-flex items-center justify-center h-14 rounded-lg bg-[#171717] text-[#e9dfd2] text-[14px] font-semibold tracking-[0.14em] hover:bg-black transition-colors duration-150"
            >
              בדיקת תיק ללא עלות
            </Link>
            <a
              href="https://wa.me/972523097444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 rounded-lg text-[#171717] text-[14px] font-semibold tracking-[0.1em] transition-colors duration-150 hover:bg-[#171717]/5"
              style={{ boxShadow: "inset 0 0 0 1.5px #171717" }}
            >
              שיחה עם יועץ
            </a>
          </motion.div>
        </div>

        {/* Live column */}
        <div className="grid gap-2 grid-rows-[auto_1fr_auto]">
          {/* Live market ticker (marquee) + the clock tile */}
          <div className="grid gap-2 grid-cols-[1fr_auto]">
            <div
              className="bento-panel flex items-center overflow-hidden"
              dir="ltr"
              aria-label="נתוני שוק ההון בזמן אמת"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
              }}
            >
              <div className="seeld-marquee relative z-10 items-center py-4">
                {[0, 1].map((copy) => (
                  <div
                    key={copy}
                    className="flex items-center shrink-0"
                    aria-hidden={copy === 1 ? "true" : undefined}
                  >
                    {TICKER_ITEMS.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2.5 px-4 text-[12.5px] sm:text-[13.5px] font-semibold tracking-[0.12em] text-[#171717] whitespace-nowrap tabular-nums"
                        style={{ fontFamily: MONO }}
                      >
                        {item.dot && <LiveDot size={6} />}
                        <span dir="auto">{item.label}</span>
                        {item.value && <span dir="ltr">{item.value}</span>}
                        <span className="text-[#171717]/30 select-none">—</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="bento-panel-orange w-[110px] sm:w-[130px] flex flex-col items-center justify-center gap-1.5 py-3">
              <LiveClock size={52} className="relative z-10" />
              <span className="text-[9px] tracking-[0.24em] font-semibold text-[#171717]/80" style={{ fontFamily: MONO }} dir="ltr">
                24/6 · LIVE
              </span>
            </div>
          </div>

          {/* Dark live statement panel */}
          <div className="bento-panel-ink p-6 sm:p-7 flex flex-col justify-between min-h-[220px]">
            <div
              className="flex justify-between text-[10px] tracking-[0.16em]"
              style={{ fontFamily: MONO, color: "rgba(233,223,210,.55)" }}
              dir="ltr"
            >
              <span>STATEMENT</span>
              <span className="inline-flex items-center gap-1.5 text-[#e9dfd2]">
                <LiveDot size={5} />
                LIVE
              </span>
            </div>
            <div>
              <div
                className="text-[34px] sm:text-[42px] font-semibold text-left text-[#e9dfd2]"
                style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", direction: "ltr", lineHeight: 1.1 }}
              >
                <CountUp to={1284600} duration={1100} format={(v) => `₪${v.toLocaleString("en-US")}`} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[13px]" style={{ color: "rgba(233,223,210,.6)" }}>
                  שווי תיק מנוהל · מנוטר מסביב לשעון
                </span>
                <span
                  dir="ltr"
                  className="text-[12px] font-bold tracking-[0.1em] tabular-nums shrink-0"
                  style={{ fontFamily: MONO, color: "#f0a339" }}
                >
                  +11.4% YTD
                </span>
              </div>
            </div>
          </div>

          {/* Two small action tiles */}
          <div className="grid gap-2 grid-cols-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
              className="bento-panel bento-hover flex items-center justify-center gap-2 py-4 px-3 text-[13px] font-semibold text-[#171717] tracking-[0.06em]"
              style={{ boxShadow: "inset 0 0 0 1.5px #171717" }}
            >
              <LiveDot size={6} />
              שיחה עם SEELD AI
            </button>
            <Link
              to="/about"
              className="bento-panel-orange bento-hover relative flex items-center justify-center py-4 px-3 text-[13px] font-semibold text-[#171717] tracking-[0.06em]"
            >
              <span
                className="absolute inset-0"
                aria-hidden="true"
                style={{ backgroundImage: UMBRELLA_PATTERN, backgroundSize: "56px 56px" }}
              />
              <span className="relative z-10 rounded-md px-2 py-0.5" style={{ backgroundColor: "#f0a339" }}>
                הכירו את הבית ←
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── The signature panel: colossal wordmark with live chips ── */}
      <div className="bento-panel mt-2 relative" aria-hidden="true">
        <motion.div style={reduced ? undefined : { y: wordmarkY }}>
          <div
            className="font-bold text-[#171717] text-center whitespace-nowrap select-none pt-6 sm:pt-4"
            style={{
              fontSize: "clamp(96px, 21vw, 310px)",
              lineHeight: 0.82,
              letterSpacing: "-0.045em",
              transform: "translateY(6%)",
            }}
            dir="ltr"
          >
            {"SEELD".split("").map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={reduced ? undefined : { opacity: 0, y: 26 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: 0.12 + i * 0.05, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <LiveChip label="דנה · יועצת פנסיה" color={CHIP_ORANGE} className="top-[6%] right-[7%] sm:top-[10%] sm:right-[13%]" delay={0.45} />
        <LiveChip label="אבי · ביטוח" color={CHIP_GREEN} className="bottom-[10%] right-[33%] sm:bottom-[16%] sm:right-[38%]" delay={0.55} />
        <LiveChip label="התיק שלך · מנוטר" color={CHIP_YELLOW} className="top-[2%] left-[8%] sm:top-[16%] sm:left-[12%]" delay={0.65} />

        {/* Base line inside the panel */}
        <div className="relative border-t border-[#171717]/15 mt-4">
          <div className="px-5 sm:px-8 py-4 flex items-baseline justify-between gap-4 text-[13px]" style={{ color: PAPER_MUTED }}>
            <span>הפגישה הראשונה על חשבוננו. בלי התחייבות.</span>
            <span className="hidden md:inline">מבית עמיתים הון · בפיקוח רשות שוק ההון</span>
            <span
              className="md:hidden inline-flex items-center gap-1.5 shrink-0 text-[12px] tracking-[0.08em]"
              style={{ fontFamily: MONO }}
              aria-hidden="true"
            >
              יש עוד
              <motion.span
                className="inline-block"
                animate={reduced ? undefined : { y: [0, 3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                ↓
              </motion.span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
