import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Menu, Moon, Sun, Home, Shield, Wallet, Calculator, User, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/insurances", label: "ביטוח" },
  { href: "/savings/pension-funds", label: "חיסכון ופנסיה" },
  { href: "/calculators", label: "מחשבונים" },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
];

const mobileNavLinks = [
  { href: "/", label: "דף הבית", icon: Home },
  { href: "/insurances", label: "ביטוח", icon: Shield },
  { href: "/savings/pension-funds", label: "חיסכון ופנסיה", icon: Wallet },
  { href: "/calculators", label: "מחשבונים", icon: Calculator },
  { href: "/about", label: "אודות", icon: User },
  { href: "/contact", label: "צור קשר", icon: Phone },
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
          ? "bg-background/80 backdrop-blur-xl border-border/40 shadow-sm"
          : "bg-background border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <SeeIDLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="החלף ערכת נושא"
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            <Link to="/personal-area" className="hidden lg:block">
              <Button className="bg-[#0a3d3d] hover:bg-[#0d4a4a] text-white rounded-lg px-6 py-2 text-sm font-medium transition-all">
                כניסה לאזור האישי
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2.5 rounded-lg hover:bg-muted/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsMenuOpen(true)}
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" />
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
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[85vw] sm:w-[360px] bg-background z-50 lg:hidden shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-border/30">
                <span className="font-bold text-lg">תפריט</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 rounded-lg hover:bg-muted/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col p-4 gap-1 overflow-y-auto h-[calc(100vh-80px)]">
                {mobileNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-muted/60 transition-colors min-h-[48px]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon className="w-5 h-5 text-[#0a3d3d] dark:text-[#5ec6c6]" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}

                <div className="mt-6 pt-4 border-t border-border/30 space-y-3">
                  <Link
                    to="/personal-area"
                    className="block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="bg-[#0a3d3d] hover:bg-[#0d4a4a] text-white rounded-lg w-full py-3 min-h-[48px] text-base font-semibold">
                      כניסה לאזור האישי
                    </Button>
                  </Link>
                  <Link
                    to="/app/auth"
                    className="block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" className="border-[#0a3d3d] text-[#0a3d3d] dark:border-[#5ec6c6] dark:text-[#5ec6c6] rounded-lg w-full py-3 min-h-[48px] font-semibold text-base">
                      כניסה לסוכנים
                    </Button>
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
