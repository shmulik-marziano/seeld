import { useState, useEffect } from "react";
import { Building2, CreditCard, CalendarDays, User, CheckCircle2, AlertCircle, Loader2, Sparkles, Shield, Hash, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Header from "@/components/Header";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";
import { usePageMeta } from "@/hooks/usePageMeta";

// ─── Fallback Israeli Banks Data — מקור: בנק ישראל ──────────────────
const FALLBACK_BANKS: Record<string, { name: string; branches: Record<string, string> }> = {
  "3":  { name: "בנק אש ישראל", branches: { "1": "ישראל - תל אביב" } },
  "4":  { name: "בנק יהב לעובדי המדינה", branches: { "120": "ראשי ירושלים", "130": "רוטשילד - תל אביב", "131": "הקריה - תל אביב", "140": "חיפה", "117": "מרכז הנגב - באר שבע", "114": "אשדוד", "119": "פתח תקווה", "133": "נתניה", "136": "ראשון לציון", "116": "מודיעין", "118": "כפר סבא", "7": "מלחה ירושלים", "401": "רמת גן", "284": "חולון" } },
  "10": { name: "בנק לאומי לישראל", branches: { "800": "ראשי - לוד", "631": "רמת אביב", "655": "קסם - רמת גן", "635": "דניה - חיפה", "662": "סיטי אשדוד", "613": "קלנסואה", "621": "מודיעין עילית", "638": "מבשרת ציון", "614": "בנקאות פרטית הרצליה" } },
  "11": { name: "בנק דיסקונט לישראל", branches: { "1": "ראשי - ראשון לציון" } },
  "12": { name: "בנק הפועלים", branches: { "600": "ראשי - תל אביב" } },
  "17": { name: "בנק מרכנתיל דיסקונט", branches: { "1": "ראשי - ראשון לציון" } },
  "18": { name: "וואן זירו (One Zero) – בנק דיגיטלי", branches: { "1": "דיגיטלי - תל אביב" } },
  "20": { name: "בנק מזרחי טפחות", branches: { "400": "ראשי - רמת גן" } },
  "22": { name: "Citibank", branches: { "1": "תל אביב" } },
  "23": { name: "HSBC", branches: { "1": "רמת גן" } },
  "27": { name: "Barclays Bank PLC", branches: { "1": "תל אביב" } },
  "31": { name: "הבנק הבינלאומי הראשון (FIBI)", branches: { "1": "ראשי - תל אביב" } },
  "39": { name: "SBI State Bank of India", branches: { "1": "רמת גן - בורסת היהלומים" } },
  "46": { name: "בנק מסד", branches: { "1": "ראשי - רמת גן" } },
  "54": { name: "בנק ירושלים", branches: { "1": "ראשי - אזור רמלה" } },
};

const DEBIT_DATES = [
  { value: "1", label: "1 בחודש", note: "תחילת החודש" },
  { value: "10", label: "10 בחודש", note: "אמצע ראשון" },
  { value: "15", label: "15 בחודש", note: "אמצע החודש" },
  { value: "25", label: "25 בחודש", note: "סוף החודש" },
];

interface DDForm {
  accountOwner: string;
  idNumber: string;
  bankCode: string;
  branchNumber: string;
  branchName: string;
  accountNumber: string;
  debitDay: string;
}

const initialDD: DDForm = {
  accountOwner: "",
  idNumber: "",
  bankCode: "",
  branchNumber: "",
  branchName: "",
  accountNumber: "",
  debitDay: "",
};

// Israeli ID (Luhn-like) validation
function validateIsraeliId(id: string): { valid: boolean; message?: string } {
  const digits = id.replace(/\D/g, "");
  if (!digits) return { valid: false, message: "שדה חובה" };
  if (digits.length !== 9) return { valid: false, message: `נדרשות 9 ספרות (הוזנו ${digits.length})` };
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = parseInt(digits[i]) * ((i % 2) + 1);
    if (num > 9) num -= 9;
    sum += num;
  }
  if (sum % 10 !== 0) return { valid: false, message: 'ספרת ביקורת שגויה — יש לבדוק את מספר ת"ז' };
  return { valid: true };
}

// ─── Styled Components ─────────────────────────────────────────────────────────
function FieldLabel({ label, required, error }: { label: string; required?: boolean; error?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
        {label}{required && <span className="text-destructive mr-1">*</span>}
      </label>
      {error && (
        <span className="text-destructive text-[11px] flex items-center gap-1 font-medium animate-in slide-in-from-left-2">
          <AlertCircle className="w-3 h-3" />{error}
        </span>
      )}
    </div>
  );
}

function StyledInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-12 px-4 rounded-xl border-2 bg-card/60 backdrop-blur-sm",
        "text-sm text-foreground placeholder:text-muted-foreground/40",
        "border-border/40 focus:border-primary focus:bg-card",
        "focus:outline-none focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]",
        "transition-all duration-300",
        className
      )}
    />
  );
}

function SectionCard({ title, icon, step, children }: { title: string; icon: React.ReactNode; step: number; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md p-6 space-y-5 relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
      <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700" />
      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary">{step}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h2 className="text-sm font-bold tracking-wide text-foreground">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border/40" />
      </div>
      {children}
    </div>
  );
}

// ─── Validation ────────────────────────────────────────────────────────────────
function validateAccountNumber(acc: string): { valid: boolean; message?: string } {
  const digits = acc.replace(/\D/g, "");
  if (digits.length === 0) return { valid: false, message: "שדה חובה" };
  if (digits.length < 5) return { valid: false, message: `חסרות ${5 - digits.length} ספרות (מינימום 5)` };
  if (digits.length > 12) return { valid: false, message: "מקסימום 12 ספרות" };
  return { valid: true };
}

function validateBranch(branch: string, bankCode: string): { valid: boolean; message?: string } {
  const digits = branch.replace(/\D/g, "");
  if (!digits) return { valid: false, message: "שדה חובה" };
  if (digits.length > 4) return { valid: false, message: "מספר סניף יכול להכיל עד 4 ספרות" };
  return { valid: true };
}

// ─── Hook: Dynamic Bank Data ───────────────────────────────────────────────────
function useBankData() {
  const [banks, setBanks] = useState<Record<string, { name: string; branches: Record<string, string> }>>(FALLBACK_BANKS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-bank-branches");
      if (error) throw error;
      if (data?.banks && data?.branches) {
        const structured: Record<string, { name: string; branches: Record<string, string> }> = {};
        for (const [code, name] of Object.entries(data.banks as Record<string, string>)) {
          structured[code] = {
            name,
            branches: data.branches[code] || {},
          };
        }
        setBanks(structured);
        setLastUpdated(data.updatedAt);
        setIsLive(true);
        console.log(`Loaded ${data.totalBranches} branches from BOI`);
      }
    } catch (err) {
      console.warn("Failed to fetch live bank data, using fallback:", err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  return { banks, loading, lastUpdated, isLive, refresh: fetchBranches };
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DirectDebit() {
  usePageMeta("הוראת קבע");
  const { banks, loading: banksLoading, lastUpdated, isLive, refresh: refreshBanks } = useBankData();
  const [form, setForm] = useState<DDForm>(initialDD);
  const [errors, setErrors] = useState<Partial<Record<keyof DDForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof DDForm, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const set = <K extends keyof DDForm>(key: K, value: DDForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const touch = (key: keyof DDForm) =>
    setTouched(prev => ({ ...prev, [key]: true }));

  const bankList = Object.entries(banks)
    .map(([code, data]) => ({ code, name: data.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));

  const bankData = form.bankCode ? banks[form.bankCode] : null;
  const branchOptions = bankData ? Object.entries(bankData.branches) : [];

  const filteredBanks = bankSearch
    ? bankList.filter(b => b.name.includes(bankSearch) || b.code.includes(bankSearch))
    : bankList;

  const handleBranchSelect = (branchNum: string) => {
    const branchName = bankData?.branches[branchNum] ?? "";
    set("branchNumber", branchNum);
    set("branchName", branchName);
    touch("branchNumber");
  };

  const handleBranchInput = (val: string) => {
    const digits = val.replace(/\D/g, "");
    set("branchNumber", digits);
    set("branchName", bankData?.branches[digits] ?? "");
  };

  const validateField = (key: keyof DDForm): string | undefined => {
    switch (key) {
      case "accountOwner":
        return !form.accountOwner.trim() ? "שדה חובה" : form.accountOwner.trim().length < 2 ? "שם חייב להכיל לפחות 2 תווים" : undefined;
      case "idNumber": {
        const res = validateIsraeliId(form.idNumber);
        return res.valid ? undefined : res.message;
      }
      case "bankCode":
        return !form.bankCode ? "יש לבחור בנק" : undefined;
      case "branchNumber": {
        const res = validateBranch(form.branchNumber, form.bankCode);
        return res.valid ? undefined : res.message;
      }
      case "accountNumber": {
        const res = validateAccountNumber(form.accountNumber);
        return res.valid ? undefined : res.message;
      }
      case "debitDay":
        return !form.debitDay ? "יש לבחור תאריך חיוב" : undefined;
      default:
        return undefined;
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof DDForm, string>> = {};
    (Object.keys(initialDD) as (keyof DDForm)[]).forEach(key => {
      if (key === "branchName") return;
      const err = validateField(key);
      if (err) errs[key] = err;
    });
    setErrors(errs);
    setTouched({ accountOwner: true, idNumber: true, bankCode: true, branchNumber: true, accountNumber: true, debitDay: true });
    return Object.keys(errs).length === 0;
  };

  const handleBlur = (key: keyof DDForm) => {
    touch(key);
    const err = validateField(key);
    setErrors(prev => {
      const next = { ...prev };
      if (err) next[key] = err;
      else delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Save to DB
      const { error: insertError } = await (supabase as any).from("onboarding_submissions").insert({
        bank_name: bankData?.name ?? "",
        bank_branch: form.branchNumber,
        bank_account: form.accountNumber,
        account_owner: form.accountOwner,
        id_number: form.idNumber,
        status: "new",
        form_data: { ...form, bankName: bankData?.name, branchName: form.branchName, type: "direct_debit" },
      });
      if (insertError) throw insertError;

      // Send email notification
      try {
        await supabase.functions.invoke("send-onboarding-summary", {
          body: {
            formData: {
              ddAccountOwner: form.accountOwner,
              ddIdNumber: form.idNumber,
              ddBankName: `${bankData?.name} (${form.bankCode})`,
              ddBranchNumber: form.branchNumber,
              ddBranchName: form.branchName,
              ddAccountNumber: form.accountNumber,
              ddDebitDay: form.debitDay,
              type: "direct_debit",
            },
          },
        });
      } catch (emailErr) {
        console.warn("Email notification failed:", emailErr);
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("אירעה שגיאה בשליחת הטופס. אנא נסו שוב או צרו קשר טלפוני.");
    } finally {
      setSubmitting(false);
    }
  };

  // Account number strength indicator
  const accDigits = form.accountNumber.replace(/\D/g, "");
  const accStrength = accDigits.length === 0 ? 0 : accDigits.length < 5 ? 1 : accDigits.length <= 9 ? 2 : 3;

  if (submitted) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <Header />
        <main className="relative z-10 max-w-xl mx-auto px-4 pt-20 pb-20 text-center">
          <div className="w-24 h-24 rounded-full bg-[#d6157e]/10 border-2 border-[#d6157e]/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
            <CheckCircle2 className="w-12 h-12 text-[#d6157e]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1a1a4b] mb-3">הטופס נשלח בהצלחה!</h1>
          <p className="text-gray-500">פרטי הו"ק התקבלו ויועברו לטיפול בהקדם.</p>
          <div className="mt-8 rounded-2xl border border-gray-100 bg-[#f8f9fc] p-6 text-right space-y-4">
            {[
              ["בעל החשבון", form.accountOwner],
              ['ת"ז', form.idNumber],
              ["בנק", `${bankData?.name} (${form.bankCode})`],
              ["סניף", `${form.branchNumber}${form.branchName ? ` – ${form.branchName}` : ""}`],
              ["מספר חשבון", form.accountNumber],
              ["יום חיוב", `${form.debitDay} בחודש`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm border-b border-border/20 pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold font-mono">{val}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Decorative circles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-40 h-40 rounded-full bg-[#d6157e] opacity-[0.06]" />
        <div className="absolute bottom-[10%] left-[5%] w-32 h-32 rounded-full bg-[#6c63ff] opacity-[0.06]" />
      </div>

      <Header />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-10 pb-20">
        {/* Hero */}
        <div className="text-center mb-12 space-y-5">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#d6157e]/20 bg-[#d6157e]/5 text-xs font-bold tracking-widest uppercase text-[#1a1a4b]">
            <Shield className="w-3.5 h-3.5 text-[#d6157e]" />
            הוראת קבע מאובטחת
            <div className="w-2 h-2 rounded-full bg-[#d6157e]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            <span className="block text-[#1a1a4b]">מילוי טופס</span>
            <span className="block text-[#d6157e]">הוראת קבע</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            שמוליק מרציאנו · סוכן ביטוח ופנסיה מוסמך
          </p>
        </div>

        <div className="space-y-5">
          {/* Step 1: Account Owner */}
          <SectionCard title="בעל החשבון" icon={<User className="w-4 h-4" />} step={1}>
            <div>
              <FieldLabel label="שם בעל החשבון" required error={touched.accountOwner ? errors.accountOwner : undefined} />
              <StyledInput
                value={form.accountOwner}
                onChange={e => set("accountOwner", e.target.value)}
                onBlur={() => handleBlur("accountOwner")}
                placeholder="ישראל ישראלי"
                className={touched.accountOwner && errors.accountOwner ? "border-destructive" : touched.accountOwner && !errors.accountOwner && form.accountOwner ? "border-primary/50" : ""}
              />
            </div>
            <div>
              <FieldLabel label='מספר תעודת זהות' required error={touched.idNumber ? errors.idNumber : undefined} />
              <StyledInput
                value={form.idNumber}
                onChange={e => set("idNumber", e.target.value.replace(/\D/g, ""))}
                onBlur={() => handleBlur("idNumber")}
                inputMode="numeric"
                maxLength={9}
                placeholder="9 ספרות"
                className={cn(
                  "font-mono tracking-[0.2em]",
                  touched.idNumber && errors.idNumber ? "border-destructive" : "",
                  touched.idNumber && !errors.idNumber && form.idNumber.length === 9 ? "border-primary/50" : ""
                )}
              />
              {touched.idNumber && !errors.idNumber && form.idNumber.length === 9 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-primary font-medium animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ת"ז תקינה — ספרת ביקורת אומתה</span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Step 2: Bank Selection */}
          <SectionCard title="בחירת בנק" icon={<Building2 className="w-4 h-4" />} step={2}>
            <div>
              {/* Live data indicator */}
              <div className="flex items-center justify-between mb-3">
                <FieldLabel label="חפש ובחר בנק" required error={touched.bankCode ? errors.bankCode : undefined} />
                <div className="flex items-center gap-2">
                  {banksLoading ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      טוען נתונים מבנק ישראל...
                    </span>
                  ) : isLive ? (
                    <span className="text-[10px] text-primary flex items-center gap-1.5 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      נתונים חיים מבנק ישראל
                    </span>
                  ) : (
                    <button onClick={refreshBanks} className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                      <RefreshCw className="w-3 h-3" />
                      נתוני גיבוי — לחץ לרענון
                    </button>
                  )}
                </div>
              </div>
              {/* Search */}
              <StyledInput
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                placeholder="🔍 חפש לפי שם בנק או מספר..."
                className="mb-3"
              />
              <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto rounded-xl border border-border/30 bg-card/30 p-2 scrollbar-thin">
                {filteredBanks.map(bank => (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => { set("bankCode", bank.code); set("branchNumber", ""); set("branchName", ""); touch("bankCode"); setBankSearch(""); }}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                      form.bankCode === bank.code
                        ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                        : "hover:bg-muted/50 text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {form.bankCode === bank.code && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      <span className="font-medium">{bank.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">בנק {bank.code}</span>
                  </button>
                ))}
                {filteredBanks.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">לא נמצאו תוצאות</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Step 3: Branch & Account */}
          {form.bankCode && (
            <SectionCard title={`פרטי חשבון — ${bankData?.name}`} icon={<Hash className="w-4 h-4" />} step={3}>
              <div className="animate-in slide-in-from-top-3 duration-300 space-y-5">
                {/* Branch Number */}
                <div>
                  <FieldLabel label="מספר סניף" required error={touched.branchNumber ? errors.branchNumber : undefined} />
                  <StyledInput
                    value={form.branchNumber}
                    onChange={e => handleBranchInput(e.target.value)}
                    onBlur={() => handleBlur("branchNumber")}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="הזן מספר סניף"
                    className={cn(
                      "font-mono",
                      touched.branchNumber && errors.branchNumber ? "border-destructive" : "",
                      form.branchName ? "border-primary/50" : ""
                    )}
                  />
                  {/* Known branches */}
                  {branchOptions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] text-muted-foreground mb-2 font-medium">סניפים מוכרים — לחץ לבחירה מהירה:</p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {branchOptions.map(([num, name]) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleBranchSelect(num)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border-2 transition-all duration-200 font-medium",
                              form.branchNumber === num
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border/40 bg-card/50 text-foreground/70 hover:border-primary/30 hover:bg-primary/5"
                            )}
                          >
                            <span className="font-mono font-bold">{num}</span>
                            <span className="text-muted-foreground">—</span>
                            <span>{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Auto-filled branch name */}
                  {form.branchName && (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary/20 bg-primary/5 text-sm animate-in fade-in duration-300">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">שם סניף:</span>
                      <span className="font-bold text-primary">{form.branchName}</span>
                    </div>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <FieldLabel label="מספר חשבון" required error={touched.accountNumber ? errors.accountNumber : undefined} />
                  <StyledInput
                    value={form.accountNumber}
                    onChange={e => set("accountNumber", e.target.value.replace(/\D/g, ""))}
                    onBlur={() => handleBlur("accountNumber")}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="5–12 ספרות"
                    className={cn(
                      "font-mono tracking-[0.15em] text-base",
                      touched.accountNumber && errors.accountNumber ? "border-destructive" : "",
                      accStrength >= 2 && !errors.accountNumber ? "border-primary/50" : ""
                    )}
                  />
                  {/* Strength bar */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map(level => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 rounded-full flex-1 transition-all duration-500",
                            accStrength >= level
                              ? level === 1 ? "bg-destructive" : level === 2 ? "bg-accent" : "bg-primary"
                              : "bg-border/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {accDigits.length > 0 ? `${accDigits.length}/12 ספרות` : "5–12 ספרות"}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 4: Debit Date */}
          <SectionCard title="תאריך חיוב מועדף" icon={<CalendarDays className="w-4 h-4" />} step={form.bankCode ? 4 : 3}>
            <div>
              <FieldLabel label="בחר יום חיוב חודשי" required error={touched.debitDay ? errors.debitDay : undefined} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {DEBIT_DATES.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { set("debitDay", opt.value); touch("debitDay"); }}
                    className={cn(
                      "relative flex flex-col items-center py-4 px-3 rounded-xl border-2 transition-all duration-300 group/date",
                      form.debitDay === opt.value
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]"
                        : "border-border/40 bg-card/50 hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    {form.debitDay === opt.value && (
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-in zoom-in">
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <span className={cn(
                      "text-3xl font-black font-mono transition-colors",
                      form.debitDay === opt.value ? "text-primary" : "text-foreground group-hover/date:text-primary/70"
                    )}>{opt.value}</span>
                    <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">{opt.note}</span>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Submit */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "relative flex items-center gap-3 px-10 py-4 rounded-full font-bold text-sm transition-all duration-400",
              "bg-primary text-primary-foreground",
              "hover:shadow-[0_8px_40px_hsl(var(--primary)/0.35)] hover:scale-[1.03]",
              "active:scale-[0.98]",
              "disabled:opacity-60 disabled:scale-100 disabled:shadow-none",
              "overflow-hidden"
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] animate-[shimmer_3s_ease-in-out_infinite]" style={{ animationName: "shimmer" }} />
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin" />שולח את הטופס...</>
              : <><CheckCircle2 className="w-5 h-5" />שלח הוראת קבע</>
            }
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-8 text-muted-foreground/50">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Shield className="w-3.5 h-3.5" />
            <span>מאובטח ומוצפן</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border/50" />
          <div className="flex items-center gap-1.5 text-[11px]">
            <CreditCard className="w-3.5 h-3.5" />
            <span>תקן PCI DSS</span>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
