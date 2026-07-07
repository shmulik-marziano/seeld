import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { StatusPill } from "@/components/brand/Live";
import { MONO } from "@/lib/brand";

const navLinks = [
  { href: "/insurances", label: "ביטוח" },
  { href: "/savings/pension-funds", label: "חיסכון ופנסיה" },
  { href: "/calculators", label: "מחשבונים" },
  { href: "/fund-finder", label: "השוואת קופות" },
  { href: "/blog", label: "בלוג" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
];

const mobileNavLinks = [
  { href: "/", label: "דף הבית" },
  { href: "/insurances", label: "ביטוח" },
  { href: "/savings/pension-funds", label: "חיסכון ופנסיה" },
  { href: "/calculators", label: "מחשבונים" },
  { href: "/fund-finder", label: "השוואת קופות" },
  { href: "/blog", label: "בלוג" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
];

const mobileSecondaryLinks = [
  { href: "/personal-area", label: "האזור האישי" },
  { href: "/agents", label: "כניסה לסוכנים" },
];

// Shared desktop nav item classes (quiet precision: Heebo 500, ink on hover/active)
const desktopLinkClass = (active: boolean) =>
  cn(
    "text-[13.5px] font-medium transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--ring))]",
    active
      ? "text-[#171717] dark:text-white underline decoration-[#171717] dark:decoration-white decoration-2 underline-offset-[10px]"
      : "text-[#5c5c5c] dark:text-white/60 hover:text-[#171717] dark:hover:text-white"
  );

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  // Dark mode is parked until it gets a real SEELD Mono dark theme —
  // the legacy .dark palette is off-system. Force light and clear stale state.
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  // Close the mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Skip link: pages render <main> without an id, so focus the first <main> directly.
  const handleSkipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      if (!main.id) main.id = "main";
      main.focus({ preventScroll: true });
      main.scrollIntoView();
    }
  };

  const openChat = () => {
    setIsMenuOpen(false);
    window.dispatchEvent(new Event("seeld:open-chat"));
  };

  return (
    <header
      className="sticky top-0 z-50 px-2 pt-2 pb-2"
      style={{ backgroundColor: "#171717" }}
    >
      {/* Keep focused elements clear of the sticky header (WCAG 2.4.11) */}
      <style>{"html{scroll-padding-top:96px}"}</style>

      {/* Skip link: first focusable element, visually hidden until focused */}
      <a
        href="#main"
        onClick={handleSkipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:right-3 focus:z-[60] focus:bg-[#e9e3d6] focus:text-[#171717] focus:px-4 focus:py-2.5 focus:text-[13.5px] focus:font-medium focus:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
      >
        דלג לתוכן
      </a>

      {/* The toolbar tile — a floating paper panel on the ink gutter */}
      <div
        className={cn("bento-panel transition-shadow duration-200", isScrolled && "shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)]")}
        style={{ borderRadius: 16 }}
      >
        <div className="relative z-10 px-4 sm:px-6">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <SeeIDLogo size="md" className="flex-shrink-0" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="ניווט ראשי">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={desktopLinkClass(isActive(link.href))}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <Link
              to="/agents"
              aria-current={isActive("/agents") ? "page" : undefined}
              className={cn("hidden lg:block", desktopLinkClass(isActive("/agents")))}
            >
              לסוכנים
            </Link>

            <Link
              to="/personal-area"
              className="hidden lg:inline-flex items-center justify-center px-6 py-2.5 bg-[#171717] dark:bg-white text-[#fafafa] dark:text-[#171717] text-[13.5px] font-medium tracking-wide hover:bg-[#33332f] dark:hover:bg-white/85 transition-colors min-h-[42px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            >
              האזור האישי
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 flex items-center justify-center text-[#171717] dark:text-white min-w-[44px] min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
              onClick={() => setIsMenuOpen(true)}
              aria-label="פתח תפריט"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Panel — Snap slide (0.2s, ease-out) */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[85vw] sm:w-[360px] bg-[#fafafa] dark:bg-gray-950 z-50 lg:hidden border-l border-[#ebebeb] dark:border-white/10"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="תפריט ניווט"
            >
              <div className="flex items-center justify-between px-6 h-[68px] border-b border-[#ebebeb] dark:border-white/10">
                <span
                  dir="ltr"
                  className="text-[15px] font-semibold tracking-[-0.02em] text-[#171717] dark:text-white"
                  style={{ fontFamily: "'Heebo', sans-serif" }}
                >
                  SEELD<span className="text-[#6e6e6e]">.</span>
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 flex items-center justify-center min-w-[44px] min-h-[44px] text-[#171717] dark:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                  aria-label="סגור תפריט"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <nav
                className="flex flex-col px-6 pt-2 pb-8 overflow-y-auto h-[calc(100vh-68px)]"
                aria-label="ניווט נייד"
              >
                {/* Primary links */}
                {mobileNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "py-[15px] border-b border-[#ebebeb] dark:border-white/10 text-[18px] font-semibold transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
                      isActive(link.href)
                        ? "text-[#171717] dark:text-white"
                        : "text-[#171717]/75 dark:text-white/75 hover:text-[#171717] dark:hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Secondary group — mono eyebrow */}
                <div className="mt-8">
                  <div
                    className="text-[11px] tracking-[0.18em] font-medium text-[#6e6e6e] dark:text-white/60 mb-3"
                    style={{ fontFamily: MONO }}
                  >
                    חשבון
                  </div>
                  <div className="flex flex-col">
                    {mobileSecondaryLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="py-2.5 text-[14px] font-medium text-[#171717]/60 dark:text-white/60 hover:text-[#171717] dark:hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Bottom: ink CTA + live chat opener */}
                <div className="mt-auto pt-10 space-y-5">
                  <Link
                    to="/contact"
                    className="flex items-center justify-center w-full px-6 py-4 bg-[#171717] dark:bg-white text-[#fafafa] dark:text-[#171717] text-[15px] font-medium tracking-wide hover:bg-[#33332f] dark:hover:bg-white/85 transition-colors min-h-[52px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    בדיקת תיק ללא עלות
                  </Link>
                  <button
                    type="button"
                    onClick={openChat}
                    className="block mx-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                    aria-label="פתיחת שיחה עם היועץ"
                  >
                    <StatusPill>היועץ מחובר עכשיו</StatusPill>
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
