import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { Menu, Moon, Sun, ChevronDown, ChevronLeft, Home, Shield, Wallet, Zap, BookOpen, MousePointerClick, User } from "lucide-react";
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
          "flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors",
          open ? "bg-muted/60" : "hover:bg-muted/40"
        )}
      >
        {icon}
        <span className="text-sm font-medium flex-1 text-right">{title}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="pr-4 pb-2 pt-1 animate-fade-in">
          {children}
        </div>
      )}
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
    <header className="sticky top-0 z-50 py-2 sm:py-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-14 sm:h-16 pill-nav px-4 sm:px-6">
          {/* Brand with Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <SeeIDLogo size="md" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {/* Savings & Pension Mega Menu */}
            <div 
              className="relative" 
              ref={savingsRef}
              onMouseEnter={() => setIsSavingsOpen(true)}
              onMouseLeave={() => setIsSavingsOpen(false)}
            >
              <button
                className={cn(
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all flex items-center gap-1",
                  isSavingsOpen && "bg-muted/60"
                )}
              >
                חיסכון ופנסיה
                <ChevronDown className={cn("w-4 h-4 transition-transform", isSavingsOpen && "rotate-180")} />
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
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all flex items-center gap-1",
                  isInsuranceOpen && "bg-muted/60"
                )}
              >
                ביטוחים
                <ChevronDown className={cn("w-4 h-4 transition-transform", isInsuranceOpen && "rotate-180")} />
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
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all flex items-center gap-1",
                  isActionsOpen && "bg-muted/60"
                )}
              >
                פעולות נפוצות
                <ChevronDown className={cn("w-4 h-4 transition-transform", isActionsOpen && "rotate-180")} />
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
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all flex items-center gap-1",
                  isServicesOpen && "bg-muted/60"
                )}
              >
                מרכז המידע
                <ChevronDown className={cn("w-4 h-4 transition-transform", isServicesOpen && "rotate-180")} />
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
                  "text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all flex items-center gap-1",
                  isQuickInsuranceOpen && "bg-muted/60"
                )}
              >
                ביטוח בקליק
                <ChevronDown className={cn("w-4 h-4 transition-transform", isQuickInsuranceOpen && "rotate-180")} />
              </button>
              
              {isQuickInsuranceOpen && (
                <QuickInsuranceMegaMenu onClose={() => setIsQuickInsuranceOpen(false)} />
              )}
            </div>
            <Link to="/about" className="text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all">
              אודות
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <SiteSearch />
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full hover:bg-muted/60 transition-all"
              aria-label="החלף ערכת נושא"
            >
              {isDark ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            
            <Link to="/personal-area">
              <Button className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-2 hover:scale-105 transition-all">
                לאזור האישי
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden p-1.5 sm:p-2"
                  aria-label="פתח תפריט"
                >
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="text-right font-serif">תפריט ניווט</SheetTitle>
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

                    {/* Personal Area CTA */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <Link 
                        to="/personal-area"
                        className="w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full">
                          לאזור האישי
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
