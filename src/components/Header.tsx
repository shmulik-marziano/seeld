import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Menu, Moon, Sun, ChevronDown, Home, Shield, Wallet, Zap, BookOpen, MousePointerClick, User, Phone } from "lucide-react";
import SiteSearch from "@/components/SiteSearch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SavingsMegaMenu from "@/components/SavingsMegaMenu";
import InsuranceMegaMenu from "@/components/InsuranceMegaMenu";
import CommonActionsMegaMenu from "@/components/CommonActionsMegaMenu";
import InfoCenterMegaMenu from "@/components/InfoCenterMegaMenu";
import QuickInsuranceMegaMenu from "@/components/QuickInsuranceMegaMenu";
import { insuranceMenuData } from "@/data/insuranceMenuData";
import { commonActionsMenuData } from "@/data/commonActionsMenuData";
import { infoCenterMenuData } from "@/data/infoCenterMenuData";
import { quickInsuranceMenuData } from "@/data/quickInsuranceMenuData";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";


// Collapsible mobile menu section
const MobileMenuSection = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-200",
          open ? "bg-muted/60" : "hover:bg-muted/40"
        )}
      >
        {icon}
        <span className="text-sm font-medium flex-1 text-right">{title}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pr-4 pb-2 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const savingsMenuItems = [
  { href: "/savings/pension-funds", label: "קרנות פנסיה" },
  { href: "/savings/gemel-funds", label: "קופות גמל" },
  { href: "/savings/gemel-investment", label: "קופת גמל להשקעה" },
  { href: "/savings/child-savings", label: "קופת גמל חיסכון לכל ילד" },
  { href: "/savings/training-funds", label: "קרנות השתלמות" },
  { href: "/savings/investment", label: "חיסכון והשקעה" },
  { href: "/savings/pension-life-insurance", label: "ביטוח חיים פנסיוני" },
  { href: "/savings/employer-funds", label: "קופות מרכזיות למעסיק" },
  { href: "/savings/pre-retirement", label: "לפני פרישה" },
  { href: "/savings/post-retirement", label: "אחרי פרישה" },
  { href: "/savings/financial-planning", label: "המרכז לתכנון כלכלי מתקדם" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isQuickInsuranceOpen, setIsQuickInsuranceOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const savingsRef = useRef<HTMLDivElement>(null);
  const insuranceRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const quickInsuranceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Track scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
      if (insuranceRef.current && !insuranceRef.current.contains(event.target as Node)) {
        setIsInsuranceOpen(false);
        setHoveredCategory(null);
      }
      if (savingsRef.current && !savingsRef.current.contains(event.target as Node)) {
        setIsSavingsOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
      if (quickInsuranceRef.current && !quickInsuranceRef.current.contains(event.target as Node)) {
        setIsQuickInsuranceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const servicesSubMenu = [
    { href: "/rights-extraction", label: "מיצוי זכויות" },
    { href: "/calculators", label: "מחשבונים" },
    { href: "/return-tables", label: "לוחות תשואה" },
  ];

  return (
    <header className="sticky top-0 z-50 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <motion.div
          className={cn(
            "relative flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 rounded-2xl transition-all duration-500",
            isScrolled
              ? "bg-background/70 backdrop-blur-xl border border-border/40 shadow-lg shadow-black/[0.03]"
              : "bg-background/50 backdrop-blur-md border border-transparent"
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Brand with Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/">
              <SeeIDLogo size="md" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Savings & Pension Mega Menu */}
            <div
              className="relative"
              ref={savingsRef}
              onMouseEnter={() => setIsSavingsOpen(true)}
              onMouseLeave={() => setIsSavingsOpen(false)}
            >
              <button
                className={cn(
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all flex items-center gap-1",
                  isSavingsOpen && "bg-muted/60"
                )}
              >
                חיסכון ופנסיה
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isSavingsOpen && "rotate-180")} />
              </button>

              {isSavingsOpen && (
                <SavingsMegaMenu onClose={() => setIsSavingsOpen(false)} />
              )}
            </div>

            {/* Insurance Mega Menu */}
            <div
              className="relative"
              ref={insuranceRef}
              onMouseEnter={() => setIsInsuranceOpen(true)}
              onMouseLeave={() => setIsInsuranceOpen(false)}
            >
              <button
                className={cn(
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all flex items-center gap-1",
                  isInsuranceOpen && "bg-muted/60"
                )}
              >
                ביטוחים
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isInsuranceOpen && "rotate-180")} />
              </button>

              {isInsuranceOpen && (
                <InsuranceMegaMenu onClose={() => setIsInsuranceOpen(false)} />
              )}
            </div>

            {/* Common Actions Mega Menu */}
            <div
              className="relative"
              ref={actionsRef}
              onMouseEnter={() => setIsActionsOpen(true)}
              onMouseLeave={() => setIsActionsOpen(false)}
            >
              <button
                className={cn(
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all flex items-center gap-1",
                  isActionsOpen && "bg-muted/60"
                )}
              >
                פעולות נפוצות
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isActionsOpen && "rotate-180")} />
              </button>

              {isActionsOpen && (
                <CommonActionsMegaMenu onClose={() => setIsActionsOpen(false)} />
              )}
            </div>

            {/* Info Center Mega Menu */}
            <div
              className="relative"
              ref={servicesRef}
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button
                className={cn(
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all flex items-center gap-1",
                  isServicesOpen && "bg-muted/60"
                )}
              >
                מרכז המידע
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isServicesOpen && "rotate-180")} />
              </button>

              {isServicesOpen && (
                <InfoCenterMegaMenu onClose={() => setIsServicesOpen(false)} />
              )}
            </div>

            {/* Quick Insurance Mega Menu */}
            <div
              className="relative"
              ref={quickInsuranceRef}
              onMouseEnter={() => setIsQuickInsuranceOpen(true)}
              onMouseLeave={() => setIsQuickInsuranceOpen(false)}
            >
              <button
                className={cn(
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all flex items-center gap-1",
                  isQuickInsuranceOpen && "bg-muted/60"
                )}
              >
                ביטוח בקליק
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isQuickInsuranceOpen && "rotate-180")} />
              </button>

              {isQuickInsuranceOpen && (
                <QuickInsuranceMegaMenu onClose={() => setIsQuickInsuranceOpen(false)} />
              )}
            </div>
            <Link to="/about" className="text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all">
              אודות
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:bg-muted/60 rounded-full px-3 xl:px-4 py-2 transition-all">
              צור קשר
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <SiteSearch />
            <motion.button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full hover:bg-muted/60 transition-all"
              aria-label="החלף ערכת נושא"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 180 }}
            >
              {isDark ? (
                <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              ) : (
                <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              )}
            </motion.button>

            <Link to="/personal-area">
              <Button className="hidden lg:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 xl:px-8 py-2 hover:scale-105 transition-all hover:shadow-lg hover:shadow-primary/20 text-sm">
                לאזור האישי
              </Button>
            </Link>

            <Link to="/app/auth">
              <Button variant="outline" className="hidden lg:flex border-accent text-accent hover:bg-accent hover:text-white rounded-full px-4 xl:px-6 py-2 hover:scale-105 transition-all font-semibold text-sm">
                כניסה לסוכנים
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <motion.button
                  className="lg:hidden p-2 rounded-xl hover:bg-muted/60 transition-colors"
                  aria-label="פתח תפריט"
                  whileTap={{ scale: 0.9 }}
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] sm:w-[400px] p-0 border-l border-border/30">
                <SheetHeader className="p-5 border-b border-border/30 bg-gradient-to-l from-muted/30 to-transparent">
                  <SheetTitle className="text-right font-bold text-lg">תפריט ניווט</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <nav className="flex flex-col p-4 gap-1">
                    {/* Home link */}
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">דף הבית</span>
                    </Link>

                    {/* Savings Section */}
                    <MobileMenuSection
                      icon={<Wallet className="w-5 h-5 text-primary" />}
                      title="חיסכון ופנסיה"
                    >
                      {savingsMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="block text-sm text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </MobileMenuSection>

                    {/* Insurance Section */}
                    <MobileMenuSection
                      icon={<Shield className="w-5 h-5 text-primary" />}
                      title="ביטוחים"
                    >
                      {insuranceMenuData.map((category) => (
                        <div key={category.id} className="mb-2">
                          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1">{category.label}</span>
                          {category.items.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.href}
                              className="block text-sm text-muted-foreground hover:text-foreground py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </MobileMenuSection>

                    {/* Common Actions Section */}
                    <MobileMenuSection
                      icon={<Zap className="w-5 h-5 text-primary" />}
                      title="פעולות נפוצות"
                    >
                      {commonActionsMenuData.map((category) => (
                        <div key={category.id} className="mb-2">
                          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1">{category.label}</span>
                          {category.items.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.href}
                              className="block text-sm text-muted-foreground hover:text-foreground py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </MobileMenuSection>

                    {/* Info Center Section */}
                    <MobileMenuSection
                      icon={<BookOpen className="w-5 h-5 text-primary" />}
                      title="מרכז המידע"
                    >
                      {infoCenterMenuData.map((category) => (
                        <div key={category.id} className="mb-2">
                          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1">{category.label}</span>
                          {category.items.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.href}
                              className="block text-sm text-muted-foreground hover:text-foreground py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </MobileMenuSection>

                    {/* Quick Insurance Section */}
                    <MobileMenuSection
                      icon={<MousePointerClick className="w-5 h-5 text-primary" />}
                      title="ביטוח בקליק"
                    >
                      {quickInsuranceMenuData.map((category) => (
                        <div key={category.id} className="mb-2">
                          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1">{category.label}</span>
                          {category.items.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.href}
                              className="block text-sm text-muted-foreground hover:text-foreground py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </MobileMenuSection>

                    {/* About link */}
                    <Link
                      to="/about"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">אודות</span>
                    </Link>

                    {/* Contact link */}
                    <Link
                      to="/contact"
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">צור קשר</span>
                    </Link>

                    {/* Personal Area + Agent Login CTAs */}
                    <div className="mt-4 pt-4 border-t border-border/30 space-y-3 px-1">
                      <Link
                        to="/personal-area"
                        className="w-full block"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full py-3 text-sm font-semibold shadow-lg shadow-primary/10">
                          לאזור האישי
                        </Button>
                      </Link>
                      <Link
                        to="/app/auth"
                        className="w-full block"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white rounded-full w-full py-3 font-semibold text-sm">
                          כניסה לסוכנים
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
