import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Menu, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { StatusPill } from "@/components/brand/Live";

// Five items, as in the design mock: the two product hubs, the process, the
// knowledge hub and contact. Tools and the blog live under ידע וכלים and in
// the footer; the drawer keeps the direct links.
const navLinks = [
  { href: "/savings", label: "פיננסים" },
  { href: "/insurances", label: "ביטוח" },
  { href: "/#process", label: "איך זה עובד" },
  { href: "/learn", label: "ידע וכלים" },
  { href: "/contact", label: "צור קשר" },
];

const mobileNavLinks = [
  { href: "/", label: "דף הבית" },
  { href: "/savings", label: "פיננסים" },
  { href: "/insurances", label: "ביטוח" },
  { href: "/#process", label: "איך זה עובד" },
  { href: "/learn", label: "ידע וכלים" },
  { href: "/calculators", label: "מחשבונים" },
  { href: "/return-tables", label: "לוח התשואות" },
  { href: "/blog", label: "בלוג" },
  { href: "/contact", label: "צור קשר" },
];

const mobileSecondaryLinks = [
  { href: "/personal-area", label: "האזור האישי" },
  { href: "/agents", label: "כניסה לסוכנים" },
];

// Shared desktop nav item classes (quiet precision: Rubik, ink on hover/active)
const desktopLinkClass = (active: boolean) =>
  cn(
    "text-[15px] font-medium transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--ring))]",
    active
      ? "text-[#003D30] underline decoration-[#819B7D] decoration-2 underline-offset-[10px]"
      : "text-[#476356] hover:text-[#003D30]"
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

  // Escape closes the drawer (it is a dialog) and returns focus to the opener
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        (document.querySelector<HTMLButtonElement>('button[aria-label="פתח תפריט"]'))?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

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
      className="sticky top-0 z-50 border-b bg-[#FAF7EF]/95 backdrop-blur-sm"
      style={{ borderColor: "#CCD6CC" }}
    >
      {/* Keep focused elements clear of the sticky header (WCAG 2.4.11) */}
      <style>{"html{scroll-padding-top:96px}"}</style>

      {/* Skip link: first focusable element, visually hidden until focused */}
      <a
        href="#main"
        onClick={handleSkipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:right-3 focus:z-[60] focus:bg-white focus:text-[#003D30] focus:px-4 focus:py-2.5 focus:text-[13.5px] focus:font-medium focus:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
      >
        דלג לתוכן
      </a>

      {/* The toolbar — institutional white bar */}
      <div className={cn("transition-shadow duration-200", isScrolled && "shadow-[0_6px_18px_-12px_rgba(0,61,48,0.25)]")}>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
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
            {/* Outlined pill with the user glyph, as in the mock. The agents'
                entrance moved to the drawer and the footer. */}
            <Link
              to="/personal-area"
              className="!hidden lg:!inline-flex btn-secondary !min-h-[44px] !py-2 !px-5 !text-[15px] !rounded-full gap-2"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              אזור אישי
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 flex items-center justify-center text-[#003D30] min-w-[44px] min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
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

      {/* Mobile Menu Overlay — portaled to <body>: the header's backdrop-blur
          creates a containing block that traps position:fixed children inside
          the 64px bar (drawer rendered clipped and transparent) */}
      {createPortal(
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
            {/* Panel — Snap slide (0.2s, ease-out); warm-paper surface, bento chrome */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[85vw] sm:w-[360px] bg-white z-50 lg:hidden border-l border-[#CCD6CC]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="תפריט ניווט"
            >
              <div className="flex items-center justify-between px-6 h-[68px] border-b border-[#CCD6CC]">
                <img
                  src="/brand/logo.png"
                  alt="שילד ביטוח ופיננסים"
                  width={93}
                  height={40}
                  style={{ height: 40, width: "auto" }}
                  draggable={false}
                />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 flex items-center justify-center min-w-[44px] min-h-[44px] text-[#003D30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
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
                      "py-[15px] border-b border-[#CCD6CC] text-[18px] font-bold transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
                      isActive(link.href)
                        ? "text-[#003D30]"
                        : "text-[#24483C] hover:text-[#003D30]"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Secondary group — mono eyebrow */}
                <div className="mt-8">
                  <div className="text-[14px] font-bold text-[#476356] mb-3">
                    חשבון
                  </div>
                  <div className="flex flex-col">
                    {mobileSecondaryLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="py-2.5 text-[14px] font-medium text-[#476356] hover:text-[#003D30] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Bottom: ink CTA + live chat opener */}
                <div className="mt-auto pt-10 space-y-5">
                  {/* Quick contact — phone + WhatsApp, thumb-friendly */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="tel:0523097444"
                      className="flex flex-col items-center justify-center px-3 py-2.5 rounded-lg border border-[#CCD6CC] text-[14px] font-medium text-[#003D30] hover:bg-[#EEF2EC] transition-colors min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      חייגו
                      <span dir="ltr" className="tabular-nums text-[14px] font-normal text-[#476356] whitespace-nowrap">052-309-7444</span>
                    </a>
                    <a
                      href="https://wa.me/972523097444"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#CCD6CC] text-[14px] font-medium text-[#003D30] hover:bg-[#EEF2EC] transition-colors min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      WhatsApp
                    </a>
                  </div>
                  <Link
                    to="/contact"
                    className="btn-primary w-full !min-h-[52px]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    בדיקת תיק 360
                  </Link>
                  <button
                    type="button"
                    onClick={openChat}
                    className="block mx-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                    aria-label="פתיחת שיחה עם היועץ"
                  >
                    <StatusPill>שיחה עם היועץ הדיגיטלי</StatusPill>
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </header>
  );
};

export default Header;
