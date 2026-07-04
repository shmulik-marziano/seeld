import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import { BONE, BRONZE, SERIF, MONO } from "@/lib/brand";
import { LiveDot, StatusPill } from "@/components/brand/Live";
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

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
  if (sum % 10 !== 0) return { valid: false, message: 'ספרת ביקורת שגויה. יש לבדוק את מספר ת"ז' };
  return { valid: true };
}

// ─── Styled pieces (SEELD Mono) ─────────────────────────────────────────────
const inputClass =
  "w-full px-0 py-3 bg-transparent border-b border-[#171717]/20 text-[#171717] placeholder:text-[#6e6e6e] text-base focus:outline-none focus:border-[#171717] transition-colors min-h-[44px] rounded-none";

function FieldLabel({ label, required, error }: { label: string; required?: boolean; error?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1 gap-4">
      <label className="text-[13px] text-[#5c5c5c] font-medium">
        {label}
        {required && <span className="text-[#6e6e6e] mr-1">*</span>}
      </label>
      {error && <span className="text-[#b91c1c] text-[12px] font-medium">{error}</span>}
    </div>
  );
}

function StyledInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, className)} />;
}

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <div className="border-t border-[#171717]/20 pt-5 mb-7 flex items-baseline gap-6">
      <span className="text-[12px] tabular-nums tracking-[0.2em] shrink-0" style={{ color: BRONZE, fontFamily: MONO }}>
        {index}
      </span>
      <h2 className="text-lg text-[#171717]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
        {title}
      </h2>
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
      await (supabase as any).from("onboarding_submissions").insert({
        bank_name: bankData?.name ?? "",
        bank_branch: form.branchNumber,
        bank_account: form.accountNumber,
        account_owner: form.accountOwner,
        id_number: form.idNumber,
        status: "new",
        form_data: { ...form, bankName: bankData?.name, branchName: form.branchName, type: "direct_debit" },
      });

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
    }
    finally {
      setSubmitting(false);
    }
  };

  const accDigits = form.accountNumber.replace(/\D/g, "");

  if (submitted) {
    return (
      <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
        <Header />
        <main className="max-w-xl mx-auto px-5 sm:px-8 pt-16 pb-24">
          <div className="border-t border-[#171717]/20 pt-6">
            <div className="flex items-center gap-2.5 mb-4">
              <LiveDot size={7} />
              <span className="text-[12px] tracking-[0.14em] font-medium text-[#5c5c5c]" style={{ fontFamily: MONO }}>
                RECEIVED
              </span>
            </div>
            <h1
              className="text-[#171717] leading-tight mb-3"
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)" }}
            >
              הטופס נשלח
            </h1>
            <p className="text-base text-[#5c5c5c] leading-[1.85]">
              פרטי הוראת הקבע התקבלו ויועברו לטיפול בהקדם.
            </p>
          </div>
          <div className="mt-10 border-t border-[#171717]/15">
            {[
              ["בעל החשבון", form.accountOwner],
              ['ת"ז', form.idNumber],
              ["בנק", `${bankData?.name} (${form.bankCode})`],
              ["סניף", `${form.branchNumber}${form.branchName ? ` – ${form.branchName}` : ""}`],
              ["מספר חשבון", form.accountNumber],
              ["יום חיוב", `${form.debitDay} בחודש`],
            ].map(([label, val]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 py-[14px] border-b border-[#171717]/10">
                <span className="text-[13px] text-[#6e6e6e] shrink-0">{label}</span>
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ backgroundColor: BONE }}>
      <Header />

      <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-24">
        {/* HERO — one idea: fill the debit order */}
        <div className="border-t border-[#171717]/20 pt-5 mb-6 flex items-baseline justify-between gap-4">
          <nav className="flex items-center gap-2 text-[12px] text-[#6e6e6e]">
            <Link to="/" className="hover:text-[#171717] transition-colors">דף הבית</Link>
            <span>←</span>
            <span className="text-[#171717]/70 font-medium">הוראת קבע</span>
          </nav>
          <span className="text-[11px] tracking-[0.14em] font-medium" style={{ color: BRONZE, fontFamily: MONO }} dir="ltr">
            SECURE · PCI DSS
          </span>
        </div>

        <h1
          className="text-[#171717] leading-[1.15] mb-4"
          style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)" }}
        >
          הוראת קבע
        </h1>
        <p className="text-base text-[#5c5c5c] leading-[1.9] mb-2">
          שתי דקות למלא. אפס אותיות קטנות.
        </p>
        <p className="text-[13px] text-[#6e6e6e] mb-8">
          שמוליק מרציאנו · סוכן ביטוח ופנסיה מוסמך
        </p>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("seeld:open-chat"))}
          className="mb-12 block transition-transform hover:-translate-y-[1px]"
          aria-label="פתיחת שיחה עם יועץ SEELD"
        >
          <StatusPill>היועץ מחובר עכשיו · שאלו לפני שממלאים</StatusPill>
        </button>

        <div className="space-y-12">
          {/* 01: Account Owner */}
          <section>
            <SectionHead index="01" title="בעל החשבון" />
            <div className="space-y-6">
              <div>
                <FieldLabel label="שם בעל החשבון" required error={touched.accountOwner ? errors.accountOwner : undefined} />
                <StyledInput
                  value={form.accountOwner}
                  onChange={e => set("accountOwner", e.target.value)}
                  onBlur={() => handleBlur("accountOwner")}
                  placeholder="ישראל ישראלי"
                  className={touched.accountOwner && errors.accountOwner ? "border-[#b91c1c]" : ""}
                />
              </div>
              <div>
                <FieldLabel label="מספר תעודת זהות" required error={touched.idNumber ? errors.idNumber : undefined} />
                <StyledInput
                  value={form.idNumber}
                  onChange={e => set("idNumber", e.target.value.replace(/\D/g, ""))}
                  onBlur={() => handleBlur("idNumber")}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="9 ספרות"
                  dir="ltr"
                  style={{ fontFamily: MONO, letterSpacing: "0.15em", textAlign: "right" }}
                  className={touched.idNumber && errors.idNumber ? "border-[#b91c1c]" : ""}
                />
                {touched.idNumber && !errors.idNumber && form.idNumber.length === 9 && (
                  <p className="mt-2 text-[12px] font-medium" style={{ color: "#15803d" }}>
                    ת"ז תקינה. ספרת ביקורת אומתה.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 02: Bank Selection */}
          <section>
            <SectionHead index="02" title="בחירת בנק" />
            <div>
              <div className="flex items-baseline justify-between mb-1 gap-4">
                <FieldLabel label="חפשו ובחרו בנק" required error={touched.bankCode ? errors.bankCode : undefined} />
                <div className="shrink-0">
                  {banksLoading ? (
                    <span className="text-[11px] text-[#6e6e6e] flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      טוען נתונים מבנק ישראל
                    </span>
                  ) : isLive ? (
                    <span className="text-[11px] text-[#5c5c5c] flex items-center gap-1.5 font-medium">
                      <LiveDot size={5} />
                      נתונים חיים מבנק ישראל
                    </span>
                  ) : (
                    <button
                      onClick={refreshBanks}
                      className="text-[11px] text-[#6e6e6e] flex items-center gap-1 hover:text-[#171717] transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      נתוני גיבוי. לחצו לרענון
                    </button>
                  )}
                </div>
              </div>
              <StyledInput
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                placeholder="חיפוש לפי שם בנק או מספר"
                className="mb-4"
              />
              <div
                className="max-h-56 overflow-y-auto rounded-[8px] bg-white"
                style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
              >
                {filteredBanks.map(bank => (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => { set("bankCode", bank.code); set("branchNumber", ""); set("branchName", ""); touch("bankCode"); setBankSearch(""); }}
                    className={cn(
                      "w-full flex items-baseline justify-between gap-4 px-4 py-3 min-h-[44px] text-start border-b border-[#171717]/[0.06] last:border-0 transition-colors",
                      form.bankCode === bank.code
                        ? "bg-[#171717] text-[#fafafa]"
                        : "text-[#171717] hover:bg-[#f5f5f5]"
                    )}
                  >
                    <span className="text-[14px] font-medium">{bank.name}</span>
                    <span
                      className={cn("text-[11px] tabular-nums shrink-0", form.bankCode === bank.code ? "text-[#fafafa]/60" : "text-[#6e6e6e]")}
                      style={{ fontFamily: MONO }}
                      dir="ltr"
                    >
                      {bank.code.padStart(2, "0")}
                    </span>
                  </button>
                ))}
                {filteredBanks.length === 0 && (
                  <p className="text-center text-[#6e6e6e] text-sm py-5">לא נמצא בנק בשם הזה. נסו שם קצר יותר או מספר בנק.</p>
                )}
              </div>
            </div>
          </section>

          {/* 03: Branch & Account */}
          {form.bankCode && (
            <section>
              <SectionHead index="03" title={`פרטי חשבון · ${bankData?.name}`} />
              <div className="space-y-6">
                {/* Branch Number */}
                <div>
                  <FieldLabel label="מספר סניף" required error={touched.branchNumber ? errors.branchNumber : undefined} />
                  <StyledInput
                    value={form.branchNumber}
                    onChange={e => handleBranchInput(e.target.value)}
                    onBlur={() => handleBlur("branchNumber")}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="מספר סניף"
                    dir="ltr"
                    style={{ fontFamily: MONO, textAlign: "right" }}
                    className={touched.branchNumber && errors.branchNumber ? "border-[#b91c1c]" : ""}
                  />
                  {/* Known branches */}
                  {branchOptions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[12px] text-[#6e6e6e] mb-2.5">סניפים מוכרים, לבחירה מהירה:</p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {branchOptions.map(([num, name]) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleBranchSelect(num)}
                            className={cn(
                              "inline-flex items-baseline gap-1.5 px-3 py-2 min-h-[36px] rounded-[6px] text-[12px] font-medium transition-colors",
                              form.branchNumber === num
                                ? "bg-[#171717] text-[#fafafa]"
                                : "bg-white text-[#171717]/70 hover:text-[#171717]"
                            )}
                            style={form.branchNumber === num ? undefined : { boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
                          >
                            <span className="tabular-nums" style={{ fontFamily: MONO }} dir="ltr">{num}</span>
                            <span className={form.branchNumber === num ? "text-[#fafafa]/60" : "text-[#6e6e6e]"}>·</span>
                            <span>{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Auto-filled branch name */}
                  {form.branchName && (
                    <p className="mt-3 text-[13px] text-[#5c5c5c]">
                      שם סניף: <span className="text-[#171717] font-medium">{form.branchName}</span>
                    </p>
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
                    dir="ltr"
                    style={{ fontFamily: MONO, letterSpacing: "0.12em", textAlign: "right" }}
                    className={touched.accountNumber && errors.accountNumber ? "border-[#b91c1c]" : ""}
                  />
                  <p className="mt-2 text-[11px] text-[#6e6e6e] tabular-nums" style={{ fontFamily: MONO }} dir="ltr">
                    {accDigits.length > 0 ? `${accDigits.length}/12` : "5–12"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 04: Debit Date */}
          <section>
            <SectionHead index={form.bankCode ? "04" : "03"} title="תאריך חיוב מועדף" />
            <div>
              <FieldLabel label="יום החיוב החודשי" required error={touched.debitDay ? errors.debitDay : undefined} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {DEBIT_DATES.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { set("debitDay", opt.value); touch("debitDay"); }}
                    className={cn(
                      "flex flex-col items-center py-4 px-3 rounded-[6px] transition-colors min-h-[44px]",
                      form.debitDay === opt.value
                        ? "bg-[#171717] text-[#fafafa]"
                        : "bg-white text-[#171717] hover:bg-[#f5f5f5]"
                    )}
                    style={form.debitDay === opt.value ? undefined : { boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
                  >
                    <span
                      className="text-2xl tabular-nums"
                      style={{ fontFamily: MONO, fontWeight: 600 }}
                      dir="ltr"
                    >
                      {opt.value}
                    </span>
                    <span className={cn("text-[11px] mt-1.5", form.debitDay === opt.value ? "text-[#fafafa]/60" : "text-[#6e6e6e]")}>
                      {opt.note}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Submit — the one action */}
        <div className="mt-14 border-t border-[#171717]/15 pt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center px-9 py-4 bg-[#171717] text-[#fafafa] text-base font-medium tracking-wide hover:bg-[#33332f] transition-colors disabled:opacity-60 min-h-[52px] min-w-[200px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "שליחת הוראת קבע"}
          </button>
          <p className="mt-5 text-[12px] text-[#6e6e6e]">
            מאובטח ומוצפן · תקן PCI DSS
          </p>
        </div>
      </main>
    </div>
  );
}
