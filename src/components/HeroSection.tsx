import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  BLUE_TEXT, DISPLAY, GOLD_TEXT, LINE, MONO, MUTED, NAVY,
  PASTEL_BLUE, PASTEL_MINT, PASTEL_PEACH, TINT_GOLD, TURQ_TEXT,
} from "@/lib/brand";
import { CountUp, LiveClock, LiveDate, LiveDot } from "@/components/brand/Live";
import { MarketMarquee, type MarqueeItem } from "@/components/brand/Marquee";

// SEELD DNA v3: white canvas, pastel circles, navy/turquoise/gold. Snap motion (STYLESEED.md).

// Light turquoise for small text on the navy statement panel (6.88:1 on #1D2D3D, measured)
const TURQ_ON_NAVY = "#7fc2b5";

// Ticker band on the white tile.
// ⚠ These figures are STATIC constants, not a feed. They were previously
// announced as "נתוני שוק ההון בזמן אמת" — a real-time claim the data does not
// support, which is not something a licensed agency should publish. The label
// now describes them as illustrative. To make the claim true instead, feed this
// from useCmaFunds (live CMA yields) and restore the real-time wording.
// Values render in their own LTR span so "+11.4%" survives bidi.
const TICKER_ITEMS: MarqueeItem[] = [
  { label: "SEELD · LIVE", dot: true },
  { label: "פנסיה מקיפה", value: "+11.4%" },
  { label: "S&P 500 · מסלול עוקב" },
  { label: "קרן השתלמות", value: "+9.8%" },
  { label: "גמל להשקעה", value: "+8.7%" },
  { label: "השוואה מול 12 חברות" },
];

// Repeating umbrella line-art — recolored to navy at low opacity on the gold tint
const UMBRELLA_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%231D2D3D' stroke-width='2' stroke-linecap='round' opacity='0.14'%3E%3Cpath d='M14 26 C14 17 20 13 28 13 C36 13 42 17 42 26'/%3E%3Cpath d='M14 26 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0 q3.5 -3 7 0'/%3E%3Cpath d='M28 13 v-3'/%3E%3Cpath d='M28 26 v12 c0 4 6 4 6 1'/%3E%3C/g%3E%3C/svg%3E")`;

const snap = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: "easeOut" as const },
});

// Chip text is 11-13px (small) — white on the raw accents fails AA, so the
// chips use the *_TEXT backgrounds (white on #356d60 5.99:1, #4a6fa5 5.11:1,
// #8a5a1e 5.90:1 — all measured, AA pass).
const LiveChip = ({
  label, color, className, delay,
}: { label: string; color: string; className: string; delay: number }) => (
  <motion.span
    className={`absolute z-10 flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-white text-[11px] sm:text-[13px] font-medium whitespace-nowrap ${className}`}
    style={{ backgroundColor: color, boxShadow: "0 2px 6px rgba(29,45,61,.18)" }}
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
    <section dir="rtl" className="dna-page">
      {/* Pastel circle backdrop — decorative, never behind small text */}
      <div className="dna-circles" aria-hidden="true">
        <div
          className="dna-circ"
          style={{ width: 300, height: 300, top: -110, right: -70, backgroundColor: PASTEL_BLUE, opacity: 0.55 }}
        />
        <div
          className="dna-circ"
          style={{ width: 230, height: 230, top: "42%", left: -110, backgroundColor: PASTEL_PEACH, opacity: 0.6 }}
        />
        <div
          className="dna-circ"
          style={{ width: 260, height: 260, bottom: -130, right: "34%", backgroundColor: PASTEL_MINT, opacity: 0.45 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-6">
        {/* ── Hero row: the argument + live column ── */}
        <div className="grid gap-10 lg:gap-14 lg:grid-cols-[1.55fr_1fr] items-start">
          {/* The argument */}
          <div className="flex flex-col justify-between min-h-[340px] lg:min-h-[440px]">
            <div>
              <motion.h1
                {...anim(0)}
                className="leading-[1.12]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: "clamp(40px, 5.5vw, 64px)",
                  color: NAVY,
                  letterSpacing: "-0.5px",
                }}
              >
                כסף מסודר.
                <br />
                ראש שקט.
              </motion.h1>
              <motion.p
                {...anim(0.06)}
                className="mt-6 text-base sm:text-lg leading-[1.8] max-w-md"
                style={{ color: MUTED }}
              >
                בית פיננסים וביטוח. יועץ אחד שמכיר אותך, השוואה מול 12 חברות,
                ותמונה מלאה של התיק בתוך 48 שעות.
              </motion.p>
            </div>

            {/* CTAs — institutional navy */}
            <motion.div {...anim(0.12)} className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/contact"
                className="flex-1 sm:flex-none sm:min-w-[240px] inline-flex items-center justify-center h-14 px-8 rounded-lg bg-[#1D2D3D] text-white text-[15px] font-medium tracking-wide hover:bg-[#16222f] transition-colors duration-150"
              >
                בדיקת תיק ללא עלות
              </Link>
              <a
                href="https://wa.me/972523097444"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-14 px-8 rounded-lg text-[#1D2D3D] text-[15px] font-medium tracking-wide transition-colors duration-150 hover:bg-[#1D2D3D]/5"
                style={{ boxShadow: `inset 0 0 0 1.5px ${NAVY}` }}
              >
                שיחה עם יועץ
              </a>
            </motion.div>
          </div>

          {/* Live column — the Silicon-Valley layer, recolored to the DNA */}
          <div className="grid gap-3 grid-rows-[auto_1fr_auto]">
            {/* Live market ticker (marquee) + the clock tile */}
            <div className="grid gap-3 grid-cols-[1fr_auto]">
              <MarketMarquee
                items={TICKER_ITEMS}
                ariaLabel="תשואות לדוגמה במסלולי חיסכון"
                className="!bg-white !rounded-xl border border-[#E1EAF1] after:!content-none"
              />
              <div
                className="w-[110px] sm:w-[130px] rounded-xl flex flex-col items-center justify-center gap-1.5 py-3"
                style={{ backgroundColor: PASTEL_MINT }}
              >
                <LiveClock size={52} color={NAVY} className="relative z-10" />
                <LiveDate
                  weekday={false}
                  className="text-[10px] font-semibold text-center leading-tight px-1"
                  style={{ fontFamily: MONO, color: TURQ_TEXT }}
                />
                <span
                  className="text-[10px] tracking-[0.2em] font-semibold"
                  style={{ fontFamily: MONO, color: TURQ_TEXT }}
                  dir="ltr"
                >
                  24/6 · LIVE
                </span>
              </div>
            </div>

            {/* Navy live statement panel */}
            <div
              className="rounded-xl p-6 sm:p-7 flex flex-col justify-between min-h-[220px]"
              style={{ backgroundColor: NAVY }}
            >
              <div
                className="flex justify-between text-[10px] tracking-[0.16em]"
                style={{ fontFamily: MONO, color: "rgba(255,255,255,.65)" }}
                dir="ltr"
              >
                <span>STATEMENT</span>
                <span className="inline-flex items-center gap-1.5 text-white">
                  <LiveDot size={5} color={TURQ_ON_NAVY} />
                  LIVE
                </span>
              </div>
              <div>
                <div
                  className="text-[34px] sm:text-[42px] font-semibold text-left text-white"
                  style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", direction: "ltr", lineHeight: 1.1 }}
                >
                  <CountUp to={1284600} duration={1100} format={(v) => `₪${v.toLocaleString("en-US")}`} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,.65)" }}>
                    שווי תיק מנוהל · מנוטר מסביב לשעון
                  </span>
                  <span
                    dir="ltr"
                    className="text-[12px] font-bold tracking-[0.1em] tabular-nums shrink-0"
                    style={{ fontFamily: MONO, color: TURQ_ON_NAVY }}
                  >
                    +11.4% YTD
                  </span>
                </div>
              </div>
            </div>

            {/* Two small action tiles */}
            <div className="grid gap-3 grid-cols-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="dna-concept dna-hover flex items-center justify-center gap-2 !py-4 !px-3 text-[13px] font-semibold"
                style={{ color: NAVY }}
              >
                <LiveDot size={6} />
                שיחה עם SEELD AI
              </button>
              <Link
                to="/about"
                className="dna-hover relative rounded-xl flex items-center justify-center py-4 px-3 text-[13px] font-semibold overflow-hidden"
                style={{ backgroundColor: TINT_GOLD, color: NAVY }}
              >
                <span
                  className="absolute inset-0"
                  aria-hidden="true"
                  style={{ backgroundImage: UMBRELLA_PATTERN, backgroundSize: "56px 56px" }}
                />
                <span className="relative z-10 rounded-md px-2 py-0.5" style={{ backgroundColor: TINT_GOLD }}>
                  הכירו את הבית ←
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── The signature panel: ghost wordmark with live chips ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6" aria-hidden="true">
        <div className="relative">
          <motion.div style={reduced ? undefined : { y: wordmarkY }}>
            <div
              className="text-center whitespace-nowrap select-none pt-6 sm:pt-4"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                color: NAVY,
                opacity: 0.06,
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

          <LiveChip label="דנה · יועצת פנסיה" color={TURQ_TEXT} className="top-[6%] right-[7%] sm:top-[10%] sm:right-[13%]" delay={0.45} />
          <LiveChip label="אבי · ביטוח" color={BLUE_TEXT} className="bottom-[10%] right-[33%] sm:bottom-[16%] sm:right-[38%]" delay={0.55} />
          <LiveChip label="התיק שלך · מנוטר" color={GOLD_TEXT} className="top-[2%] left-[8%] sm:top-[16%] sm:left-[12%]" delay={0.65} />
        </div>

        {/* Base line under the wordmark */}
        <div className="relative border-t mt-4" style={{ borderColor: LINE }}>
          <div className="py-4 flex items-baseline justify-between gap-4 text-[13px]" style={{ color: MUTED }}>
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
