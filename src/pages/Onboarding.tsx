import { useState, useRef, useEffect, useCallback } from "react";
import {
  User, Phone, Mail, MapPin, FileText, Shield,
  CheckCircle2, Download, Copy, Check,
  ChevronLeft, Pen, X, AlertCircle, Loader2, Sparkles, Lock, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import Header from "@/components/Header";
import { usePageMeta } from "@/hooks/usePageMeta";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  firstName: string; lastName: string;
  idNumber: string; idIssueDate: string;
  birthDate: string; birthCountry: string;
  phone: string; email: string;
  city: string; street: string; houseNumber: string; postalCode: string;
  maritalStatus: string;
  healthFund: string;
  childrenCount: number;
  employmentStatus: string[];
  annualIncome: string;
  smoker: boolean | null;
  cigarettesPerDay: string;
  consentPensionClearinghouse: boolean;
  consentInsuranceMountain: boolean;
  consentPolicies: boolean;
  signature: string;
}
const initialForm: FormData = {
  firstName: "", lastName: "", idNumber: "", idIssueDate: "",
  birthDate: "", birthCountry: "ישראל", phone: "", email: "",
  city: "", street: "", houseNumber: "", postalCode: "",
  maritalStatus: "",
  healthFund: "",
  childrenCount: 0,
  employmentStatus: [],
  annualIncome: "",
  smoker: null,
  cigarettesPerDay: "",
  consentPensionClearinghouse: false,
  consentInsuranceMountain: false,
  consentPolicies: false,
  signature: "",
};

function validateIsraeliId(id: string): boolean {
  const s = id.replace(/\D/g, "");
  if (s.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = +s[i] * (i % 2 === 0 ? 1 : 2);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}

// ─── Israeli Cities Data ──────────────────────────────────────────────────────
const ISRAELI_CITIES: Record<string, string> = {
  "תל אביב-יפו": "6100000", "ירושלים": "9100000",
  "חיפה": "3100000", "ראשון לציון": "7500000", "פתח תקווה": "4900000",
  "אשדוד": "7700000", "נתניה": "4200000", "באר שבע": "8400000",
  "בני ברק": "5126000", "חולון": "5800000", "רמת גן": "5200000",
  "אשקלון": "7900000", "רחובות": "7600000", "הרצליה": "4610000",
  "כפר סבא": "4460000", "בית שמש": "9974000", "הוד השרון": "4524000",
  "רעננה": "4350000", "לוד": "7100000", "רמלה": "7275000",
  "נס ציונה": "7400000", "גבעתיים": "5340000", "חדרה": "3800000",
  "קריית גת": "8200000", "אילת": "2100000",
  "אור יהודה": "6761000", "אור עקיבא": "2530000", "אלעד": "7030000",
  "אריאל": "4485800", "באר יעקב": "7030700", "בית שאן": "1090000",
  "גבעת שמואל": "5252000", "גדרה": "7010000", "יבנה": "7401000",
  "יהוד-מונוסון": "5600000", "כפר שמריהו": "4692000", "כרמיאל": "2011700",
  "מגדל העמק": "2300000", "מודיעין-מכבים-רעות": "7177500",
  "מודיעין עילית": "7175000", "מעלה אדומים": "9040000",
  "מעלות-תרשיחא": "2510000", "נהריה": "2270000", "נצרת": "1700000",
  "נצרת עילית": "1730000", "נשר": "3080000", "נתיבות": "8776000",
  "עכו": "2410000", "עפולה": "1850000", "ערד": "8700000",
  "צפת": "1300000", "קריית אונו": "5545000", "קריית אתא": "2840000",
  "קריית ביאליק": "2800000", "קריית מוצקין": "2620000", "קריית מלאכי": "8204000",
  "קריית שמונה": "1201000", "קריית ים": "2780000", "ראש העין": "4800000",
  "ראש פינה": "1201500", "רמת השרון": "4600000", "רכסים": "3065000",
  "שדרות": "8053000", "טבריה": "1400000", "טירה": "4490000",
  "טירת כרמל": "3050000",
  "אבו גוש": "9084500", "אום אל-פחם": "3001500", "אכסאל": "1712800",
  "בקה אל גרביה": "3001000", "ג'סר א-זרקא": "3786500", "טמרה": "2491000",
  "עראבה": "1686500", "קלנסווה": "4291000", "שפרעם": "2073000",
  "לקיה": "8493500", "כסיפה": "8493000", "רהט": "8465000",
  "ביתר עילית": "9973500", "אלפי מנשה": "4482000",
  "אבן יהודה": "4052000", "אחיעזר": "7028000",
  "גן יבנה": "7010500", "גן שמואל": "3780500", "גני תקווה": "5083000",
  "זכרון יעקב": "3783000", "חרות": "4571000", "כפר יונה": "4246000",
  "כפר חיים": "3776000", "כפר נטר": "4591200", "כפר קאסם": "4884000",
  "מעגן מיכאל": "3786000", "נורדיה": "4059000", "נוף הגליל": "1730000",
  "ניר אליהו": "4573000", "פרדס חנה-כרכור": "3780000",
  "קיסריה": "3880000", "תל מונד": "4581000",
  "אופקים": "8752000", "אורים": "8553000",
  "דימונה": "8700500", "ירוחם": "8052000",
  "כפר מנחם": "0", "מצפה רמון": "8053500",
  "עומר": "8496500", "שדה בוקר": "8490000", "תל שבע": "8470000",
  "יסוד המעלה": "1234000", "כפר ורדים": "2011500",
  "מגדל": "1455000", "ראמה": "2034000", "שלומי": "2290000",
  "בית אלפא": "1095000", "כפר יהושע": "1742000", "נהלל": "1744500",
  "ציפורי": "1714000",
  "אזור": "5850000", "בית דגן": "5090000",
  "גבעת ברנר": "7600500", "מזכרת בתיה": "7022000",
  "ניר צבי": "5092000", "שהם": "5096000",
  "אפרת": "9049500", "גבעת זאב": "9046000",
  "מבשרת ציון": "9058700", "קרית ארבע": "9038000",
  "באר טוביה": "7011000", "חוף אשקלון": "7961000",
  "יקנעם עילית": "2066100", "עמק חפר": "0",
  "בית אל": "9995000",
};

const CITY_STREETS: Record<string, string[]> = {
  "תל אביב-יפו": ["דיזנגוף", "בן יהודה", "אלנבי", "רוטשילד", "ארלוזורוב", "קינג ג'ורג'", "נחלת בנימין"],
  "ירושלים": ["יפו", "בן יהודה", "עמק רפאים", "הנביאים", "מלכי ישראל", "הרב קוק"],
  "חיפה": ["הנמל", "הרצל", "ביאליק", "נורדאו", "הגפן", "הכרמל"],
  "ראשון לציון": ["רוטשילד", "הרצל", "ז'בוטינסקי", "הציונות", "שנקר"],
  "פתח תקווה": ["הרצל", "ביאליק", "ז'בוטינסקי", "ראול ולנברג", "סירקין"],
  "אשדוד": ["הנשיאים", "רמז", "הגדוד העברי", "קישון", "בן גוריון"],
  "נתניה": ["הרצל", "ז'בוטינסקי", "ויצמן", "שמריהו לוין"],
  "באר שבע": ["הנשיאים", "הציונות", "שוקן", "יצחק נפחא"],
  "רחובות": ["הרצל", "ביאליק", "ויצמן", "ז'בוטינסקי", "כצנלסון"],
  "הרצליה": ["בן גוריון", "ז'בוטינסקי", "שנקר", "סוקולוב"],
  "כפר סבא": ["הרצל", "ויצמן", "ז'בוטינסקי", "בלפור"],
  "רעננה": ["ז'בוטינסקי", "אחוזה", "ויצמן", "בן גוריון"],
  "חולון": ["ז'בוטינסקי", "ויצמן", "סוקולוב", "בן גוריון", "גולדה מאיר"],
  "בני ברק": ["ז'בוטינסקי", "הרב קוק", "רבי עקיבא"],
  "רמת גן": ["ביאליק", "ז'בוטינסקי", "ויצמן", "אבא הלל"],
  "אשקלון": ["הרצל", "ז'בוטינסקי", "הרב קוק", "ירושלים"],
  "טבריה": ["הגליל", "הנביאים", "הרצל", "ביאליק"],
  "עכו": ["בן עמי", "הגנה", "יהושפט"],
  "נהריה": ["הגעתון", "ויצמן", "הרצל"],
};

const CITY_NAMES = Object.keys(ISRAELI_CITIES).sort((a, b) => a.localeCompare(b, "he"));

// ─── Date Mask Input ──────────────────────────────────────────────────────────
function DateMaskInput({
  value, onChange, placeholder, className, error
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let masked = "";
    if (raw.length >= 1) masked = raw.slice(0, 2);
    if (raw.length >= 3) masked += "/" + raw.slice(2, 4);
    if (raw.length >= 5) masked += "/" + raw.slice(4, 8);
    onChange(masked);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    onChange(`${d}/${m}/${y}`);
    setOpen(false);
  };

  const parsedDate = (() => {
    const parts = value.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (!isNaN(d.getTime())) return d;
    }
    return undefined;
  })();

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleInput}
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder ?? "DD/MM/YYYY"}
        className={cn(
          "w-full h-12 px-4 pr-11 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm",
          "text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50",
          "focus:outline-none focus:border-accent focus:bg-card focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]",
          "transition-all duration-200 font-mono tracking-widest",
          error && "border-destructive",
          className
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute left-3 text-muted-foreground hover:text-accent transition-colors"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[200]" align="end">
          <CalendarComp
            mode="single"
            selected={parsedDate}
            onSelect={handleCalendarSelect}
            initialFocus
            className="p-3 pointer-events-auto"
            captionLayout="dropdown-buttons"
            fromYear={1920}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── City Autocomplete ────────────────────────────────────────────────────────
function CityInput({
  value, onChange, onPostalChange, className, error
}: {
  value: string;
  onChange: (val: string) => void;
  onPostalChange?: (postal: string) => void;
  className?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? CITY_NAMES.filter(c => c.startsWith(query) || c.includes(query)).slice(0, 8)
    : [];

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
    const postal = ISRAELI_CITIES[city];
    if (postal && postal !== "0" && onPostalChange) onPostalChange(postal);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="תל אביב"
        className={cn(
          "w-full h-12 px-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm",
          "text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50",
          "focus:outline-none focus:border-accent focus:bg-card focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]",
          "transition-all duration-200",
          error && "border-destructive",
          className
        )}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-[100] top-full mt-1 w-full rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.map(city => (
            <button
              key={city}
              type="button"
              onMouseDown={() => select(city)}
              className="w-full text-right px-4 py-3 min-h-[44px] text-sm hover:bg-accent/10 hover:text-accent transition-colors border-b border-border/30 last:border-0"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Street Autocomplete ──────────────────────────────────────────────────────
function StreetInput({
  value, onChange, city, className
}: {
  value: string;
  onChange: (val: string) => void;
  city?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const streetHints = (city && CITY_STREETS[city]) ? CITY_STREETS[city] : [];
  const filtered = query.length >= 1
    ? streetHints.filter(s => s.includes(query) || s.startsWith(query)).slice(0, 6)
    : streetHints.slice(0, 6);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="שם הרחוב"
        className={cn(
          "w-full h-12 px-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm",
          "text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50",
          "focus:outline-none focus:border-accent focus:bg-card focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]",
          "transition-all duration-200",
          className
        )}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-[100] top-full mt-1 w-full rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.map(street => (
            <button
              key={street}
              type="button"
              onMouseDown={() => { onChange(street); setQuery(street); setOpen(false); }}
              className="w-full text-right px-4 py-3 min-h-[44px] text-sm hover:bg-accent/10 hover:text-accent transition-colors border-b border-border/30 last:border-0"
            >
              {street}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Particle Background ──────────────────────────────────────────────────────
function ParticleBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100,200,120,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,200,120,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Floating orbs */}
      <div className="absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-accent/8 blur-3xl animate-float-slow" />
      <div className="absolute top-[55%] right-[10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-float-medium" />
      <div className="absolute bottom-[10%] left-[40%] w-64 h-64 rounded-full bg-accent/6 blur-3xl animate-float-fast" />
      {/* Particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-accent/20 animate-particle"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${Math.random() * 6 + 8}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated step indicator ──────────────────────────────────────────────────
const STEPS = [
  { icon: User, label: "פרטים אישיים", short: "01" },
  { icon: Shield, label: "הרשאות", short: "02" },
  { icon: Pen, label: "חתימה", short: "03" },
  { icon: CheckCircle2, label: "סיכום", short: "04" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10 relative">
      {/* connecting line */}
      <div className="absolute top-5 left-0 right-0 h-px bg-border/50 z-0" />
      <div
        className="absolute top-5 left-0 h-px bg-accent z-0 transition-all duration-700 ease-out"
        style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
      />
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-col items-center z-10 px-4 md:px-8">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 border-2",
              done
                ? "bg-accent border-accent text-accent-foreground scale-95"
                : active
                  ? "bg-card border-accent text-accent scale-110 shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
                  : "bg-card/60 border-border/50 text-muted-foreground"
            )}>
              {done ? <Check className="w-4 h-4" /> : (
                active
                  ? <step.icon className="w-4 h-4" />
                  : <span className="text-xs">{step.short}</span>
              )}
            </div>
            <span className={cn(
              "text-[10px] mt-2 font-medium tracking-wide uppercase transition-colors duration-300 hidden md:block",
              active ? "text-accent" : done ? "text-accent/60" : "text-muted-foreground/50"
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Glass Input ──────────────────────────────────────────────────────────────
function GlassInput({
  label, error, required, children
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground group-focus-within:text-accent transition-colors duration-200">
        {label}{required && <span className="text-accent mr-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-destructive text-xs flex items-center gap-1 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

function TechInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-12 px-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm",
        "text-base sm:text-sm text-foreground placeholder:text-muted-foreground/50",
        "focus:outline-none focus:border-accent focus:bg-card focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]",
        "transition-all duration-200",
        className
      )}
    />
  );
}

// ─── Consent Card ─────────────────────────────────────────────────────────────
function ConsentCard({
  checked, onChange, title, description, pdfPath, pdfLabel, index,
}: {
  checked: boolean; onChange: (v: boolean) => void;
  title: string; description: string;
  pdfPath: string; pdfLabel: string; index: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full text-right rounded-2xl border-2 p-5 transition-all duration-300 cursor-pointer group",
        "hover:border-accent/50 hover:shadow-[0_0_20px_hsl(var(--accent)/0.1)]",
        checked
          ? "border-accent bg-accent/8 shadow-[0_0_30px_hsl(var(--accent)/0.15)]"
          : "border-border/50 bg-card/40 backdrop-blur-sm"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className={cn(
          "mt-0.5 w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all duration-300",
          checked
            ? "bg-accent border-accent shadow-[0_0_10px_hsl(var(--accent)/0.5)]"
            : "border-border/60 bg-card/60 group-hover:border-accent/50"
        )}>
          {checked && (
            <Check className="w-3.5 h-3.5 text-accent-foreground animate-in zoom-in-50 duration-200" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="font-bold text-sm tracking-wide">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          <a
            href={pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent transition-colors mt-1 font-medium"
          >
            <Download className="w-3 h-3" />
            {pdfLabel}
          </a>
        </div>
        {/* Glow dot */}
        <div className={cn(
          "w-2 h-2 rounded-full mt-1 shrink-0 transition-all duration-500",
          checked ? "bg-accent shadow-[0_0_8px_hsl(var(--accent)/0.8)]" : "bg-muted/50"
        )} />
      </div>
    </button>
  );
}

// ─── Signature Canvas ─────────────────────────────────────────────────────────
function SignatureCanvas({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className={cn(
        "relative rounded-2xl overflow-hidden border-2 transition-all duration-300",
        hasDrawn
          ? "border-accent shadow-[0_0_20px_hsl(var(--accent)/0.15)]"
          : "border-border/50 border-dashed"
      )}>
        {/* scan line animation */}
        {!hasDrawn && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent animate-scan z-10 pointer-events-none" />
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full touch-none cursor-crosshair bg-card/30 backdrop-blur-sm"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
            <Pen className="w-6 h-6 text-muted-foreground/30" />
            <p className="text-muted-foreground/40 text-sm font-mono tracking-widest">חתום/י כאן</p>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <X className="w-3.5 h-3.5" />
          נקה וחתום שוב
        </button>
      )}
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors text-muted-foreground hover:text-accent"
    >
      {copied
        ? <Check className="w-3 h-3 text-accent" />
        : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 group">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold font-mono">{value}</span>
        <CopyBtn text={value} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  usePageMeta("שאלון הצטרפות", "הצטרפו ל-SEELD — מילוי שאלון מקוון קצר וחתימה דיגיטלית, והיועץ שלכם יתחיל לעבוד.");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = "שדה חובה";
      if (!form.lastName.trim()) errs.lastName = "שדה חובה";
      if (!form.idNumber.trim()) errs.idNumber = "שדה חובה";
      else if (!validateIsraeliId(form.idNumber)) errs.idNumber = "מספר זהות לא תקין";
      if (!form.idIssueDate.trim()) errs.idIssueDate = "שדה חובה";
      else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.idIssueDate)) errs.idIssueDate = "פורמט נדרש: DD/MM/YYYY";
      if (!form.birthDate.trim()) errs.birthDate = "שדה חובה";
      else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.birthDate)) errs.birthDate = "פורמט נדרש: DD/MM/YYYY";
      else {
        const parts = form.birthDate.split("/");
        const birthYear = parseInt(parts[2]);
        const birthMonth = parseInt(parts[1]) - 1;
        const birthDay = parseInt(parts[0]);
        const birth = new Date(birthYear, birthMonth, birthDay);
        const now = new Date();
        const ageDiff = now.getFullYear() - birth.getFullYear() -
          (now < new Date(now.getFullYear(), birthMonth, birthDay) ? 1 : 0);
        if (ageDiff < 18) errs.birthDate = "גיל מינימלי הוא 18 שנה";
        else if (ageDiff > 120) errs.birthDate = "תאריך לידה לא תקין";
      }
      if (!form.phone.trim()) errs.phone = "שדה חובה";
      else if (!/^05\d{8}$/.test(form.phone.replace(/[-\s]/g, ""))) errs.phone = "מספר נייד חייב להתחיל ב-05 ולהכיל 10 ספרות";
      if (!form.email.trim()) errs.email = "שדה חובה";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "מייל לא תקין";
      if (!form.city.trim()) errs.city = "שדה חובה";
      else if (!CITY_NAMES.includes(form.city)) errs.city = "עיר לא נמצאה ברשימה";
      if (!form.maritalStatus) errs.maritalStatus = "שדה חובה";
    }
    if (step === 1) {
      if (!form.consentPensionClearinghouse) errs.consentPensionClearinghouse = "נדרש אישור";
      if (!form.consentInsuranceMountain) errs.consentInsuranceMountain = "נדרש אישור";
      if (!form.consentPolicies) errs.consentPolicies = "נדרש אישור";
    }
    if (step === 2 && !form.signature) errs.signature = "נדרשת חתימה";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validate()) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep(s => s + 1);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      setTransitioning(false);
    }, 200);
  };

  const goPrev = () => {
    setTransitioning(true);
    setTimeout(() => {
      setStep(s => s - 1);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      setTransitioning(false);
    }, 200);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from("onboarding_submissions").insert({
        first_name: form.firstName,
        last_name: form.lastName,
        id_number: form.idNumber,
        id_issue_date: form.idIssueDate || null,
        birth_date: form.birthDate || null,
        birth_country: form.birthCountry,
        phone: form.phone,
        email: form.email,
        city: form.city,
        street: form.street,
        house_number: form.houseNumber,
        insurance_report_consent: form.consentInsuranceMountain,
        data_consent: form.consentPolicies,
        form_data: form as unknown as Record<string, unknown>,
        status: "new",
      });
      if (insertError) throw insertError;
      // Email notification is non-blocking — the submission is already saved
      try {
        await supabase.functions.invoke("send-onboarding-summary", {
          body: { formData: form },
        });
      } catch (emailErr) {
        console.error("Failed to send onboarding summary email:", emailErr);
      }
      setTransitioning(true);
      setTimeout(() => {
        setSubmitted(true);
        topRef.current?.scrollIntoView({ behavior: "smooth" });
        setTransitioning(false);
      }, 200);
    } catch (err) {
      console.error(err);
      toast.error("אירעה שגיאה בשליחת הטופס. אנא נסו שוב או צרו קשר טלפוני.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.03); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes particle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-80px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200px); opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 hsl(var(--accent)/0.4); }
          70% { box-shadow: 0 0 0 12px hsl(var(--accent)/0); }
          100% { box-shadow: 0 0 0 0 hsl(var(--accent)/0); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }
        .animate-particle { animation: particle linear infinite; }
        .animate-scan { animation: scan 3s linear infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
      `}</style>

      <div className="min-h-screen bg-white" dir="rtl">
        <ParticleBg />
        <Header />
        <div ref={topRef} />

        <main className="relative z-10 max-w-2xl mx-auto px-4 pt-10 pb-20">

          {/* ── Hero Header ── */}
          <div className="text-center mb-10 space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#5ec6c6]/30 bg-[#5ec6c6]/5 text-xs font-semibold tracking-widest uppercase text-[#0a3d3d]">
              <div className="w-2 h-2 rounded-full bg-[#5ec6c6]" />
              SEELD — פתיחת תיק לקוח
              <Sparkles className="w-3.5 h-3.5 text-[#5ec6c6]" />
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none">
              <span className="block text-[#0a3d3d]">שאלון</span>
              <span className="block text-[#5ec6c6]">
                הצטרפות
              </span>
            </h1>

            <p className="text-sm text-gray-400 font-mono">
              שמוליק מרציאנו · סוכן ביטוח ופנסיה מוסמך
            </p>
          </div>

          {/* ── Step Bar ── */}
          {step < 4 && !submitted && <StepBar current={step} />}

          {/* ── Thank You Screen ── */}
          {submitted ? (
            <div className={cn(
              "flex flex-col items-center justify-center text-center py-16 space-y-8 transition-all duration-500",
              transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}>
              {/* Animated checkmark */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center animate-pulse-ring">
                  <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  </div>
                </div>
                {/* Orbiting dots */}
                {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-accent/40"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${deg}deg) translateX(60px) translateY(-50%)`,
                    }}
                  />
                ))}
              </div>

              {/* Text */}
              <div className="space-y-3">
                <h2 className="text-4xl font-extrabold tracking-tight text-[#0a3d3d]">
                    תודה רבה!
                </h2>
                <p className="text-lg font-semibold text-foreground">
                  {form.firstName}, התיק שלך נשלח בהצלחה
                </p>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mx-auto">
                  שמוליק מרציאנו יעיין בפרטייך ויצור איתך קשר בהקדם האפשרי.
                </p>
              </div>

              {/* Info card */}
              <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 space-y-3 text-right">
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground font-mono">שם</span>
                  <span className="text-sm font-bold font-mono">{form.firstName} {form.lastName}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                  <span className="text-xs text-muted-foreground font-mono">טלפון</span>
                  <span className="text-sm font-bold font-mono">{form.phone}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground font-mono">אימייל</span>
                  <span className="text-sm font-bold font-mono">{form.email}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/5 text-xs font-semibold text-accent">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                הטפסים הועברו לטיפול
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : null}

          {/* ── Card wrapper ── */}
          {!submitted && <div className={cn(
            "transition-all duration-200",
            transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}>

            {/* ═══════ STEP 0: Personal ═══════ */}
            {step === 0 && (
              <div className="space-y-4">
                {/* Personal */}
                <TechSection title="פרטי זיהוי" icon={<User className="w-4 h-4" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="שם פרטי" error={errors.firstName} required>
                      <TechInput value={form.firstName} onChange={e => set("firstName", e.target.value)}
                        placeholder="ישראל" className={errors.firstName ? "border-destructive" : ""} />
                    </GlassInput>
                    <GlassInput label="שם משפחה" error={errors.lastName} required>
                      <TechInput value={form.lastName} onChange={e => set("lastName", e.target.value)}
                        placeholder="ישראלי" className={errors.lastName ? "border-destructive" : ""} />
                    </GlassInput>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="מספר תעודת זהות" error={errors.idNumber} required>
                      <TechInput value={form.idNumber}
                        onChange={e => set("idNumber", e.target.value.replace(/\D/g, ""))}
                        maxLength={9} inputMode="numeric" placeholder="000000000"
                        className={cn("font-mono tracking-widest", errors.idNumber ? "border-destructive" : "")} />
                    </GlassInput>
                    <GlassInput label={'תאריך הנפקת ת"ז'} error={errors.idIssueDate} required>
                      <DateMaskInput
                        value={form.idIssueDate}
                        onChange={v => set("idIssueDate", v)}
                        error={!!errors.idIssueDate}
                      />
                    </GlassInput>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="תאריך לידה" error={errors.birthDate} required>
                      <DateMaskInput
                        value={form.birthDate}
                        onChange={v => set("birthDate", v)}
                        error={!!errors.birthDate}
                      />
                    </GlassInput>
                    <GlassInput label="ארץ לידה">
                      <TechInput value={form.birthCountry}
                        onChange={e => set("birthCountry", e.target.value)} placeholder="ישראל" />
                    </GlassInput>
                  </div>
                </TechSection>

                {/* Contact */}
                <TechSection title="פרטי קשר" icon={<Phone className="w-4 h-4" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="טלפון נייד" error={errors.phone} required>
                      <TechInput value={form.phone} onChange={e => set("phone", e.target.value)}
                        inputMode="tel" placeholder="050-0000000"
                        className={cn("font-mono", errors.phone ? "border-destructive" : "")} />
                    </GlassInput>
                    <GlassInput label={'דוא"ל'} error={errors.email} required>
                      <TechInput type="email" value={form.email}
                        onChange={e => set("email", e.target.value)}
                        placeholder="email@example.com"
                        className={errors.email ? "border-destructive" : ""} />
                    </GlassInput>
                  </div>
                </TechSection>

                {/* Address */}
                <TechSection title="כתובת מגורים" icon={<MapPin className="w-4 h-4" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <GlassInput label="רחוב">
                        <StreetInput
                          value={form.street}
                          onChange={v => set("street", v)}
                          city={form.city}
                        />
                      </GlassInput>
                    </div>
                    <GlassInput label="מספר">
                      <TechInput value={form.houseNumber} onChange={e => set("houseNumber", e.target.value)} placeholder="1" />
                    </GlassInput>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="עיר" error={errors.city} required>
                      <CityInput
                        value={form.city}
                        onChange={v => { set("city", v); set("street", ""); }}
                        onPostalChange={postal => set("postalCode", postal)}
                        error={!!errors.city}
                      />
                    </GlassInput>
                    <GlassInput label="מיקוד">
                      <TechInput
                        value={form.postalCode}
                        onChange={e => set("postalCode", e.target.value)}
                        placeholder="מתמלא אוטומטית"
                        className="font-mono"
                      />
                    </GlassInput>
                  </div>
                </TechSection>

                {/* Profile Questions */}
                <TechSection title="פרופיל אישי" icon={<User className="w-4 h-4" />}>
                  {/* Marital Status */}
                  <GlassInput label="מצב משפחתי" error={errors.maritalStatus} required>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["נשוי/אה", "רווק/ה", "אלמן/ה", "קטין/ה", "אחר"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { set("maritalStatus", opt); setErrors(e => ({ ...e, maritalStatus: undefined })); }}
                          className={cn(
                            "px-4 py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all duration-200",
                            form.maritalStatus === opt
                              ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_hsl(var(--accent)/0.2)]"
                              : "border-border/50 bg-card/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </GlassInput>

                  {/* Health Fund */}
                  <GlassInput label="קופת חולים">
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["כללית", "מכבי", "מאוחדת", "לאומית"].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set("healthFund", form.healthFund === opt ? "" : opt)}
                          className={cn(
                            "px-4 py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all duration-200",
                            form.healthFund === opt
                              ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_hsl(var(--accent)/0.2)]"
                              : "border-border/50 bg-card/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </GlassInput>

                  {/* Children */}
                  <GlassInput label="מספר ילדים">
                    <div className="flex items-center gap-4 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => set("childrenCount", Math.max(0, form.childrenCount - 1))}
                          className="w-11 h-11 rounded-xl border-2 border-border/50 bg-card/50 text-foreground font-bold text-lg flex items-center justify-center hover:border-accent/50 hover:bg-accent/10 transition-all"
                        >−</button>
                        <span className="w-12 text-center text-2xl font-extrabold font-mono text-accent">
                          {form.childrenCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => set("childrenCount", Math.min(24, form.childrenCount + 1))}
                          className="w-11 h-11 rounded-xl border-2 border-border/50 bg-card/50 text-foreground font-bold text-lg flex items-center justify-center hover:border-accent/50 hover:bg-accent/10 transition-all"
                        >+</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[0,1,2,3,4,5,6].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => set("childrenCount", n)}
                            className={cn(
                              "w-10 h-10 rounded-lg border text-xs font-bold transition-all",
                              form.childrenCount === n
                                ? "border-accent bg-accent/15 text-accent"
                                : "border-border/40 bg-card/40 text-muted-foreground hover:border-accent/30"
                            )}
                          >{n}</button>
                        ))}
                        <button
                          type="button"
                          onClick={() => set("childrenCount", form.childrenCount > 6 ? form.childrenCount : 7)}
                          className={cn(
                            "px-2 h-8 rounded-lg border text-xs font-bold transition-all",
                            form.childrenCount > 6
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border/40 bg-card/40 text-muted-foreground hover:border-accent/30"
                          )}
                        >7+</button>
                      </div>
                    </div>
                  </GlassInput>

                  {/* Employment Status - multi select */}
                  <GlassInput label="מעמד תעסוקתי">
                    <p className="text-xs text-muted-foreground mb-2">ניתן לסמן יותר מאחד</p>
                    <div className="flex flex-wrap gap-2">
                      {["שכיר/ה", "עצמאי/ת", "שכיר/ה בעל/ת שליטה"].map(opt => {
                        const selected = form.employmentStatus.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const cur = form.employmentStatus;
                              set("employmentStatus", selected ? cur.filter(x => x !== opt) : [...cur, opt]);
                            }}
                            className={cn(
                              "px-4 py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all duration-200",
                              selected
                                ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_hsl(var(--accent)/0.2)]"
                                : "border-border/50 bg-card/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                            )}
                          >
                            {selected && <span className="ml-1">✓</span>}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </GlassInput>

                  {/* Annual Income */}
                  <GlassInput label="גובה הכנסות שנתי">
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { label: "100–150 אלף ₪", value: "100-150" },
                        { label: "150–250 אלף ₪", value: "150-250" },
                        { label: "250–400 אלף ₪", value: "250-400" },
                        { label: "מעל 400 אלף ₪", value: "400+" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set("annualIncome", opt.value)}
                          className={cn(
                            "px-4 py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all duration-200",
                            form.annualIncome === opt.value
                              ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_hsl(var(--accent)/0.2)]"
                              : "border-border/50 bg-card/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </GlassInput>
                  {/* Smoker */}
                  <GlassInput label="מעשן/ת?">
                    <div className="flex gap-3 pt-1">
                      {[{ label: "כן", value: true }, { label: "לא", value: false }].map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => { set("smoker", opt.value); if (!opt.value) set("cigarettesPerDay", ""); }}
                          className={cn(
                            "px-6 py-2.5 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all duration-200",
                            form.smoker === opt.value
                              ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_hsl(var(--accent)/0.2)]"
                              : "border-border/50 bg-card/50 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          )}
                        >{opt.label}</button>
                      ))}
                    </div>
                    {form.smoker === true && (
                      <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground block mb-1.5">
                          כמות סיגריות ביום
                        </label>
                        <TechInput
                          type="number"
                          min="1"
                          max="100"
                          value={form.cigarettesPerDay}
                          onChange={e => set("cigarettesPerDay", e.target.value)}
                          placeholder="לדוגמה: 10"
                          className="w-32 font-mono"
                        />
                      </div>
                    )}
                  </GlassInput>
                </TechSection>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-4 mb-2">
                  <p className="text-sm text-muted-foreground leading-relaxed text-center">
                    <Lock className="w-4 h-4 inline ml-1 text-accent" />
                    לחץ על כל כרטיסייה לאישור ההרשאה. ניתן לצפות בנספח המלא לפני האישור.
                  </p>
                </div>

                {[
                  {
                    key: "consentPensionClearinghouse" as const,
                    title: "נספח א׳ – סליקה פנסיונית",
                    description: "הרשאה חד-פעמית לסוכן הפנסיוני לפנות בשמך לגופים מוסדיים לקבלת מידע על מוצרים פנסיוניים. בתוקף 3 חודשים.",
                    pdf: "/docs/נספח_א.pdf",
                    label: "פתח נספח א׳",
                  },
                  {
                    key: "consentInsuranceMountain" as const,
                    title: "נספח ה׳ – הר הביטוח",
                    description: "הרשאה לסוכן לחפש בשמך ובשם ילדיך הקטינים במאגר הר הביטוח של המפקח על הביטוח. בתוקף 5 ימי עבודה.",
                    pdf: "/docs/נספח_ה.pdf",
                    label: "פתח נספח ה׳",
                  },
                  {
                    key: "consentPolicies" as const,
                    title: "נספח ב׳ – פוליסות ביטוח",
                    description: "ייפוי כוח לקבלת מידע מחברות הביטוח על פוליסות הביטוח שלך ושל בני משפחתך. בתוקף 30 ימי עבודה.",
                    pdf: "/docs/נספח_ב.pdf",
                    label: "פתח נספח ב׳",
                  },
                ].map((item, i) => (
                  <div key={item.key}>
                    <ConsentCard
                      index={i}
                      checked={form[item.key]}
                      onChange={v => { set(item.key, v); setErrors(e => ({ ...e, [item.key]: undefined })); }}
                      title={item.title}
                      description={item.description}
                      pdfPath={item.pdf}
                      pdfLabel={item.label}
                    />
                    {errors[item.key] && (
                      <p className="text-destructive text-xs flex items-center gap-1 mt-1 mr-2">
                        <AlertCircle className="w-3 h-3" />{errors[item.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ═══════ STEP 2: Signature ═══════ */}
            {step === 2 && (
              <div className="space-y-4">
                <TechSection title="חתימה דיגיטלית" icon={<Pen className="w-4 h-4" />}>
                  <p className="text-sm text-muted-foreground mb-4">
                    החתימה תחול על שלושת ההרשאות שאישרת (נספח א׳, ב׳ ו-ה׳).
                  </p>
                  <SignatureCanvas
                    value={form.signature}
                    onChange={v => { set("signature", v); setErrors(e => ({ ...e, signature: undefined })); }}
                  />
                  {errors.signature && (
                    <p className="text-destructive text-xs flex items-center gap-1 mt-2">
                      <AlertCircle className="w-3 h-3" />{errors.signature}
                    </p>
                  )}
                </TechSection>

                {/* Confirmation box */}
                <div className="relative rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm p-5 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/3 to-transparent pointer-events-none" />
                  <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                    בלחיצה על ״שלח ואשר״ אני מאשר/ת שקראתי את תוכן ההרשאות ומסכים/ה לתנאים.<br />
                    <span className="font-bold text-foreground font-mono mt-1 block">
                      {form.firstName} {form.lastName} · {form.idNumber}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* ═══════ STEP 3: Summary ═══════ */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Success banner */}
                <div className="relative rounded-2xl border border-accent/30 bg-accent/5 backdrop-blur-sm p-6 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-accent/8 to-transparent pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center animate-pulse-ring">
                      <CheckCircle2 className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight">התיק נשלח בהצלחה!</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        סיכום נשלח למייל שלך ולשמוליק. הוא יצור קשר בהקדם.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Data summary */}
                <TechSection title="פרטי הלקוח" icon={<FileText className="w-4 h-4" />}>
                  <SummaryRow label="שם מלא" value={`${form.firstName} ${form.lastName}`} />
                  <SummaryRow label="מספר זהות" value={form.idNumber} />
                  <SummaryRow label="תאריך לידה" value={form.birthDate} />
                  <SummaryRow label={'הנפקת ת"ז'} value={form.idIssueDate} />
                  <SummaryRow label="ארץ לידה" value={form.birthCountry} />
                  <SummaryRow label="טלפון" value={form.phone} />
                  <SummaryRow label={'דוא"ל'} value={form.email} />
                  <SummaryRow label="כתובת" value={[form.street, form.houseNumber, form.city].filter(Boolean).join(" ")} />
                </TechSection>

                {/* Authorizations */}
                <TechSection title="הרשאות שאושרו" icon={<Shield className="w-4 h-4" />}>
                  {[
                    { label: "נספח א׳ – סליקה פנסיונית", pdf: "/docs/נספח_א.pdf" },
                    { label: "נספח ה׳ – הר הביטוח", pdf: "/docs/נספח_ה.pdf" },
                    { label: "נספח ב׳ – פוליסות ביטוח", pdf: "/docs/נספח_ב.pdf" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent)/0.7)]" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <a
                        href={item.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        הורד
                      </a>
                    </div>
                  ))}
                </TechSection>

                {/* Signature */}
                {form.signature && (
                  <TechSection title="חתימה" icon={<Pen className="w-4 h-4" />}>
                    <img src={form.signature} alt="חתימה"
                      className="max-h-20 rounded-xl border border-border/40 bg-white" />
                    <p className="text-xs text-muted-foreground font-mono mt-2">
                      {new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
                    </p>
                  </TechSection>
                )}
               </div>
            )}
          </div>}

          {/* ── Navigation ── */}
          {!submitted && step < 3 && (
            <div className="flex items-center justify-between mt-8 gap-4">
              {step > 0 ? (
                <button
                  onClick={goPrev}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  חזרה
                </button>
              ) : <div />}

              <button
                onClick={step === 2 ? handleSubmit : goNext}
                disabled={submitting}
                className={cn(
                  "relative flex items-center gap-2 px-8 py-3 min-h-[48px] rounded-xl font-bold text-base sm:text-sm transition-all duration-300",
                  "bg-primary text-primary-foreground",
                  "hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:scale-105",
                  "disabled:opacity-60 disabled:scale-100 disabled:shadow-none",
                  "overflow-hidden"
                )}
              >
                {/* shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-[shimmer_3s_ease-in-out_infinite]" />
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />שולח...</>
                  : step === 2
                    ? <><CheckCircle2 className="w-4 h-4" />שלח ואשר</>
                    : <>המשך<ChevronLeft className="w-4 h-4" /></>
                }
              </button>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function TechSection({
  title, icon, children
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 space-y-4 relative overflow-hidden">
      {/* corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-bl-3xl pointer-events-none" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent">{icon}</span>
        <h2 className="text-xs font-bold tracking-widest uppercase text-foreground/80">{title}</h2>
        <div className="flex-1 h-px bg-border/40 mr-2" />
      </div>
      {children}
    </div>
  );
}
