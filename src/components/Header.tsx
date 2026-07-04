import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
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

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-[#fafafa]/95 dark:bg-gray-950/95 backdrop-blur-md border-[#171717]/15 dark:border-white/10"
          : "bg-[#fafafa] dark:bg-gray-950 border-[#171717]/10 dark:border-white/10"
      )}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <SeeIDLogo size="md" className="flex-shrink-0" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[13.5px] font-medium text-[#171717]/55 dark:text-white/60 hover:text-[#171717] dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={toggleTheme}
              className="hidden sm:flex p-2 items-center justify-center text-[#171717]/45 dark:text-white/60 hover:text-[#171717] dark:hover:text-white transition-colors min-w-[40px] min-h-[40px]"
              aria-label="החלף ערכת נושא"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/agents"
              className="hidden lg:block text-[13.5px] font-medium text-[#171717]/55 dark:text-white/60 hover:text-[#171717] dark:hover:text-white transition-colors"
            >
              לסוכנים
            </Link>

            <Link
              to="/personal-area"
              className="hidden lg:inline-flex items-center justify-center px-6 py-2.5 bg-[#171717] dark:bg-white text-[#fafafa] dark:text-[#171717] text-[13.5px] font-medium tracking-wide hover:bg-[#33332f] dark:hover:bg-white/85 transition-colors min-h-[42px]"
            >
              האזור האישי
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 flex items-center justify-center text-[#171717] dark:text-white min-w-[44px] min-h-[44px]"
              onClick={() => setIsMenuOpen(true)}
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
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
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[85vw] sm:w-[360px] bg-[#fafafa] dark:bg-gray-950 z-50 lg:hidden border-l border-[#171717]/10 dark:border-white/10"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex items-center justify-between px-6 h-[68px] border-b border-[#171717]/10 dark:border-white/10">
                <span className="text-[11px] tracking-[0.25em] font-medium text-[#171717]/50 dark:text-white/50">
                  SEELD
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 flex items-center justify-center min-w-[44px] min-h-[44px] text-[#171717] dark:text-white"
                  aria-label="סגור תפריט"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex flex-col px-6 py-4 overflow-y-auto h-[calc(100vh-68px)]">
                {mobileNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="py-4 border-b border-[#171717]/10 dark:border-white/10 text-base font-medium text-[#171717] dark:text-white/85 hover:text-[#171717]/60 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-8 space-y-4">
                  <Link
                    to="/personal-area"
                    className="flex items-center justify-center w-full px-6 py-4 bg-[#171717] dark:bg-white text-[#fafafa] dark:text-[#171717] text-[15px] font-medium tracking-wide hover:bg-[#33332f] transition-colors min-h-[52px]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    האזור האישי
                  </Link>
                  <Link
                    to="/agents"
                    className="flex items-center justify-center w-full px-6 py-4 border border-[#171717]/25 dark:border-white/25 text-[#171717] dark:text-white text-[15px] font-medium tracking-wide hover:border-[#171717] transition-colors min-h-[52px]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    כניסה לסוכנים
                  </Link>
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
