import { useState, useRef, useEffect, useCallback } from "react";
import {
  User, Phone, MapPin, FileText, Shield,
  Download, Copy, Check,
  ChevronLeft, Pen, X, AlertCircle, Loader2, Lock, Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { BRONZE, SERIF, MONO } from "@/lib/brand";
import { LiveDot, StatusPill } from "@/components/brand/Live";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import Header from "@/components/Header";

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
          "w-full min-h-[44px] px-0 pl-9 py-3 bg-transparent border-b border-[#171717]/20 rounded-none",
          "text-base text-[#171717] placeholder:text-[#171717]/35",
          "focus:outline-none focus:border-[#171717]",
          "transition-colors tracking-widest",
          error && "border-[#b91c1c]",
          className
        )}
        style={{ fontFamily: MONO }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute left-1 p-1.5 text-[#171717]/40 hover:text-[#171717] transition-colors"
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
          "w-full min-h-[44px] px-0 py-3 bg-transparent border-b border-[#171717]/20 rounded-none",
          "text-base text-[#171717] placeholder:text-[#171717]/35",
          "focus:outline-none focus:border-[#171717]",
          "transition-colors",
          error && "border-[#b91c1c]",
          className
        )}
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute z-[100] top-full mt-1 w-full rounded-[8px] bg-white overflow-hidden max-h-60 overflow-y-auto"
          style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 8px 16px -8px rgba(0,0,0,.12)" }}
        >
          {filtered.map(city => (
            <button
              key={city}
              type="button"
              onMouseDown={() => select(city)}
              className="w-full text-right px-4 py-3 min-h-[44px] text-sm text-[#171717] hover:bg-[#f5f5f5] transition-colors border-b border-[#171717]/[0.06] last:border-0"
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
          "w-full min-h-[44px] px-0 py-3 bg-transparent border-b border-[#171717]/20 rounded-none",
          "text-base text-[#171717] placeholder:text-[#171717]/35",
          "focus:outline-none focus:border-[#171717]",
          "transition-colors",
          className
        )}
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute z-[100] top-full mt-1 w-full rounded-[8px] bg-white overflow-hidden max-h-60 overflow-y-auto"
          style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.08), 0 8px 16px -8px rgba(0,0,0,.12)" }}
        >
          {filtered.map(street => (
            <button
              key={street}
              type="button"
              onMouseDown={() => { onChange(street); setQuery(street); setOpen(false); }}
              className="w-full text-right px-4 py-3 min-h-[44px] text-sm text-[#171717] hover:bg-[#f5f5f5] transition-colors border-b border-[#171717]/[0.06] last:border-0"
            >
              {street}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step indicator — mono numerals over a thin progress rule ─────────────────
const STEPS = [
  { label: "פרטים אישיים", short: "01" },
  { label: "הרשאות", short: "02" },
  { label: "חתימה", short: "03" },
  { label: "סיכום", short: "04" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="mb-12" aria-label={`שלב ${current + 1} מתוך ${STEPS.length}`}>
      <div className="flex items-baseline justify-between gap-3">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-[12px] tabular-nums tracking-[0.14em] transition-colors",
                  active || done ? "text-[#171717]" : "text-[#171717]/35"
                )}
                style={{ fontFamily: MONO }}
                dir="ltr"
              >
                {step.short}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium hidden sm:inline transition-colors",
                  active ? "text-[#171717]" : done ? "text-[#171717]/55" : "text-[#171717]/35"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mt-4 h-px bg-[#171717]/10">
        <div
          className="absolute inset-y-0 right-0 bg-[#171717] transition-all duration-200 ease-out"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Glass Input ──────────────────────────────────────────────────────────────
function GlassInput({
  label, error, required, children
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[13px] font-medium text-[#171717]/55 group-focus-within:text-[#171717] transition-colors">
        {label}{required && <span className="text-[#171717]/40 mr-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[#b91c1c] text-[12px] font-medium flex items-center gap-1">
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
        "w-full min-h-[44px] px-0 py-3 bg-transparent border-b border-[#171717]/20 rounded-none",
        "text-base text-[#171717] placeholder:text-[#171717]/35",
        "focus:outline-none focus:border-[#171717]",
        "transition-colors",
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
      aria-pressed={checked}
      className={cn(
        "w-full text-right rounded-[8px] bg-white p-5 transition-colors cursor-pointer group",
        checked ? "" : "hover:bg-[#fafafa]"
      )}
      style={{ boxShadow: checked ? "0 0 0 1px #171717" : "0 0 0 1px rgba(0,0,0,.08)" }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div
          className={cn(
            "mt-0.5 w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center transition-colors",
            checked ? "bg-[#171717]" : "bg-white"
          )}
          style={checked ? undefined : { boxShadow: "0 0 0 1px rgba(23,23,23,.25)" }}
        >
          {checked && <Check className="w-3.5 h-3.5 text-[#fafafa]" />}
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="font-medium text-[15px] text-[#171717]">{title}</p>
          <p className="text-[13px] text-[#171717]/50 leading-[1.7]">{description}</p>
          <a
            href={pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#171717]/55 hover:text-[#171717] transition-colors mt-1 font-medium border-b border-[#171717]/20 pb-0.5"
          >
            <Download className="w-3 h-3" />
            {pdfLabel}
          </a>
        </div>
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
    ctx.strokeStyle = "#171717";
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
        "relative rounded-[8px] overflow-hidden border transition-colors",
        hasDrawn
          ? "border-[#171717]"
          : "border-[#171717]/25 border-dashed"
      )}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full touch-none cursor-crosshair bg-white"
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
            <Pen className="w-6 h-6 text-[#171717]/25" />
            <p className="text-[#171717]/35 text-sm tracking-widest" style={{ fontFamily: MONO }}>חתמו כאן</p>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 text-[12px] text-[#171717]/50 hover:text-[#171717] transition-colors font-medium min-h-[32px]"
        >
          <X className="w-3.5 h-3.5" />
          נקו וחתמו שוב
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
      className="p-1.5 rounded-[4px] hover:bg-[#f5f5f5] transition-colors text-[#171717]/40 hover:text-[#171717]"
      aria-label="העתקה"
    >
      {copied
        ? <Check className="w-3 h-3" style={{ color: "#15803d" }} />
        : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#171717]/10 last:border-0 group">
      <span className="text-[12px] text-[#171717]/45">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-[#171717] tabular-nums" style={{ fontFamily: MONO }}>{value}</span>
        <CopyBtn text={value} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Onboarding() {
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
      await (supabase as any).from("onboarding_submissions").insert({
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
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-onboarding-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ formData: form }),
      });
      setTransitioning(true);
      setTimeout(() => {
        setSubmitted(true);
        topRef.current?.scrollIntoView({ behavior: "smooth" });
        setTransitioning(false);
      }, 200);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white" dir="rtl">
        <Header />
        <div ref={topRef} />

        <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-24">

          {/* ── Hero — one idea: open your file ── */}
          <div className="mb-10">
            <div className="border-t border-[#171717]/20 pt-5 mb-6 flex items-baseline justify-between gap-4">
              <nav className="flex items-center gap-2 text-[12px] text-[#171717]/40">
                <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
                <span>←</span>
                <span className="text-[#171717]/70 font-medium">פתיחת תיק</span>
              </nav>
              <span className="text-[11px] tracking-[0.14em] font-medium" style={{ color: BRONZE, fontFamily: MONO }} dir="ltr">
                SECURE
              </span>
            </div>

            <h1
              className="text-[#171717] leading-[1.15] mb-4"
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)" }}
            >
              שאלון הצטרפות
            </h1>
            <p className="text-base text-[#171717]/55 leading-[1.9] mb-2">
              ארבעה שלבים, בלי אותיות קטנות. בסוף שמוליק מתקשר.
            </p>
            <p className="text-[13px] text-[#171717]/40">
              שמוליק מרציאנו · סוכן ביטוח ופנסיה מוסמך
            </p>
            {!submitted && step === 0 && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
                className="mt-7 block transition-transform hover:-translate-y-[1px]"
                aria-label="פתיחת שיחה עם יועץ SEELD"
              >
                <StatusPill>היועץ מחובר עכשיו · שאלו לפני שממלאים</StatusPill>
              </button>
            )}
          </div>

          {/* ── Step Bar ── */}
          {step < 4 && !submitted && <StepBar current={step} />}

          {/* ── Thank You Screen ── */}
          {submitted ? (
            <div className={cn(
              "py-6 transition-all duration-200",
              transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            )}>
              <div className="border-t border-[#171717]/20 pt-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <LiveDot size={7} />
                  <span className="text-[12px] tracking-[0.14em] font-medium text-[#171717]/55" style={{ fontFamily: MONO }} dir="ltr">
                    RECEIVED
                  </span>
                </div>
                <h2
                  className="text-[#171717] leading-tight mb-3"
                  style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
                >
                  {form.firstName}, התיק נשלח
                </h2>
                <p className="text-base text-[#171717]/55 leading-[1.85] max-w-md">
                  שמוליק מרציאנו יעבור על הפרטים ויצור קשר בהקדם. הסיכום נשלח גם למייל שלך.
                </p>
              </div>

              <div className="mt-10 border-t border-[#171717]/15 max-w-md">
                {[
                  ["שם", `${form.firstName} ${form.lastName}`],
                  ["טלפון", form.phone],
                  ["אימייל", form.email],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-baseline justify-between gap-6 py-[14px] border-b border-[#171717]/10">
                    <span className="text-[13px] text-[#171717]/45 shrink-0">{label}</span>
                    <span className="text-base text-[#171717] tabular-nums text-left" style={{ fontFamily: MONO }}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-2 text-[14px] font-medium text-[#171717] border-b border-[#171717]/25 pb-0.5 hover:border-[#171717] transition-colors"
                >
                  חזרה לדף הבית
                  <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
                </Link>
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
              <div className="space-y-10">
                {/* Personal */}
                <TechSection title="פרטי זיהוי" icon={<User className="w-4 h-4" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="שם פרטי" error={errors.firstName} required>
                      <TechInput value={form.firstName} onChange={e => set("firstName", e.target.value)}
                        placeholder="ישראל" className={errors.firstName ? "border-[#b91c1c]" : ""} />
                    </GlassInput>
                    <GlassInput label="שם משפחה" error={errors.lastName} required>
                      <TechInput value={form.lastName} onChange={e => set("lastName", e.target.value)}
                        placeholder="ישראלי" className={errors.lastName ? "border-[#b91c1c]" : ""} />
                    </GlassInput>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput label="מספר תעודת זהות" error={errors.idNumber} required>
                      <TechInput value={form.idNumber}
                        onChange={e => set("idNumber", e.target.value.replace(/\D/g, ""))}
                        maxLength={9} inputMode="numeric" placeholder="000000000"
                        className={cn("tracking-widest", errors.idNumber ? "border-[#b91c1c]" : "")}
                        style={{ fontFamily: MONO }} />
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
                        className={errors.phone ? "border-[#b91c1c]" : ""}
                        style={{ fontFamily: MONO }} />
                    </GlassInput>
                    <GlassInput label={'דוא"ל'} error={errors.email} required>
                      <TechInput type="email" value={form.email}
                        onChange={e => set("email", e.target.value)}
                        placeholder="email@example.com"
                        className={errors.email ? "border-[#b91c1c]" : ""} />
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
                        style={{ fontFamily: MONO }}
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
                            "px-4 py-2.5 min-h-[44px] rounded-[6px] border text-sm font-medium transition-colors",
                            form.maritalStatus === opt
                              ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                              : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50 hover:text-[#171717]"
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
                            "px-4 py-2.5 min-h-[44px] rounded-[6px] border text-sm font-medium transition-colors",
                            form.healthFund === opt
                              ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                              : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50 hover:text-[#171717]"
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
                          className="w-11 h-11 rounded-[6px] border border-[#171717]/20 bg-white text-[#171717] font-medium text-lg flex items-center justify-center hover:border-[#171717]/50 transition-colors"
                        >−</button>
                        <span className="w-12 text-center text-2xl text-[#171717] tabular-nums" style={{ fontFamily: MONO, fontWeight: 600 }}>
                          {form.childrenCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => set("childrenCount", Math.min(24, form.childrenCount + 1))}
                          className="w-11 h-11 rounded-[6px] border border-[#171717]/20 bg-white text-[#171717] font-medium text-lg flex items-center justify-center hover:border-[#171717]/50 transition-colors"
                        >+</button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[0,1,2,3,4,5,6].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => set("childrenCount", n)}
                            className={cn(
                              "w-10 h-10 rounded-[6px] border text-xs font-medium transition-colors tabular-nums",
                              form.childrenCount === n
                                ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                                : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50"
                            )}
                          >{n}</button>
                        ))}
                        <button
                          type="button"
                          onClick={() => set("childrenCount", form.childrenCount > 6 ? form.childrenCount : 7)}
                          className={cn(
                            "px-2 h-10 rounded-[6px] border text-xs font-medium transition-colors tabular-nums",
                            form.childrenCount > 6
                              ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                              : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50"
                          )}
                        >7+</button>
                      </div>
                    </div>
                  </GlassInput>

                  {/* Employment Status - multi select */}
                  <GlassInput label="מעמד תעסוקתי">
                    <p className="text-[12px] text-[#171717]/45 mb-2">ניתן לסמן יותר מאחד</p>
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
                              "px-4 py-2.5 min-h-[44px] rounded-[6px] border text-sm font-medium transition-colors",
                              selected
                                ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                                : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50 hover:text-[#171717]"
                            )}
                          >
                            {selected && <Check className="w-3.5 h-3.5 inline ml-1" />}
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
                            "px-4 py-2.5 min-h-[44px] rounded-[6px] border text-sm font-medium transition-colors",
                            form.annualIncome === opt.value
                              ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                              : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50 hover:text-[#171717]"
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
                            "px-6 py-2.5 min-h-[44px] rounded-[6px] border text-sm font-medium transition-colors",
                            form.smoker === opt.value
                              ? "border-[#171717] bg-[#171717] text-[#fafafa]"
                              : "border-[#171717]/20 bg-white text-[#171717]/60 hover:border-[#171717]/50 hover:text-[#171717]"
                          )}
                        >{opt.label}</button>
                      ))}
                    </div>
                    {form.smoker === true && (
                      <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[13px] font-medium text-[#171717]/55 block mb-1.5">
                          כמות סיגריות ביום
                        </label>
                        <TechInput
                          type="number"
                          min="1"
                          max="100"
                          value={form.cigarettesPerDay}
                          onChange={e => set("cigarettesPerDay", e.target.value)}
                          placeholder="לדוגמה: 10"
                          className="w-32"
                          style={{ fontFamily: MONO }}
                        />
                      </div>
                    )}
                  </GlassInput>
                </TechSection>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-t border-[#171717]/15 pt-4 mb-4">
                  <p className="text-sm text-[#171717]/55 leading-[1.8]">
                    <Lock className="w-3.5 h-3.5 inline ml-1.5 text-[#171717]/40" />
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
                      <p className="text-[#b91c1c] text-[12px] font-medium flex items-center gap-1 mt-1.5 mr-2">
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
                  <p className="text-sm text-[#171717]/55 leading-[1.8] mb-4">
                    החתימה תחול על שלושת ההרשאות שאישרת (נספח א׳, ב׳ ו-ה׳).
                  </p>
                  <SignatureCanvas
                    value={form.signature}
                    onChange={v => { set("signature", v); setErrors(e => ({ ...e, signature: undefined })); }}
                  />
                  {errors.signature && (
                    <p className="text-[#b91c1c] text-[12px] font-medium flex items-center gap-1 mt-2">
                      <AlertCircle className="w-3 h-3" />{errors.signature}
                    </p>
                  )}
                </TechSection>

                {/* Confirmation box */}
                <div className="border-t border-[#171717]/15 pt-5">
                  <p className="text-[13px] text-[#171717]/50 leading-[1.8]">
                    בלחיצה על ״שלח ואשר״ אני מאשר/ת שקראתי את תוכן ההרשאות ומסכים/ה לתנאים.<br />
                    <span className="font-medium text-[#171717] mt-1 block tabular-nums" style={{ fontFamily: MONO }}>
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
                <div className="border-t border-[#171717]/20 pt-6">
                  <div className="flex items-center gap-2.5 mb-3">
                    <LiveDot size={7} />
                    <span className="text-[12px] tracking-[0.14em] font-medium text-[#171717]/55" style={{ fontFamily: MONO }} dir="ltr">
                      SENT
                    </span>
                  </div>
                  <h2 className="text-xl text-[#171717]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                    התיק נשלח בהצלחה
                  </h2>
                  <p className="text-sm text-[#171717]/55 mt-1.5">
                    סיכום נשלח למייל שלך ולשמוליק. הוא יצור קשר בהקדם.
                  </p>
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
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[#171717]/10 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#15803d" }} />
                        <span className="text-sm font-medium text-[#171717]">{item.label}</span>
                      </div>
                      <a
                        href={item.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] text-[#171717]/50 hover:text-[#171717] transition-colors"
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
                      className="max-h-20 rounded-[6px] bg-white"
                      style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }} />
                    <p className="text-[12px] text-[#171717]/40 mt-2 tabular-nums" style={{ fontFamily: MONO }}>
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
                  className="text-sm text-[#171717]/50 hover:text-[#171717] transition-colors font-medium flex items-center gap-1.5 min-h-[44px]"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  חזרה
                </button>
              ) : <div />}

              <button
                onClick={step === 2 ? handleSubmit : goNext}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[160px]"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />שולח...</>
                  : step === 2
                    ? "שלח ואשר"
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
    <div className="border-t border-[#171717]/15 pt-5 space-y-5">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-[#171717]/40">{icon}</span>
        <h2 className="text-[15px] text-[#171717]" style={{ fontFamily: SERIF, fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
