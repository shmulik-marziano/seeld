import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Filter, ChevronDown, ChevronUp, Eye, X,
  User, Phone, Mail, MapPin, FileText, Calendar,
  Shield, Download, RefreshCw, LogOut, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

// Admin password is verified server-side via admin-verify edge function

type Submission = {
  id: string;
  created_at: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  id_number: string | null;
  id_issue_date: string | null;
  birth_date: string | null;
  birth_country: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  gender: string | null;
  marital_status: string | null;
  employment_status: string | null;
  profession: string | null;
  employer_name: string | null;
  work_seniority: string | null;
  annual_income: number | null;
  additional_income: string | null;
  health_fund: string | null;
  supplemental_insurance: string | null;
  smoker: boolean | null;
  cigarettes_per_day: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  calculated_age: number | null;
  has_spouse: boolean | null;
  spouse_name: string | null;
  spouse_birth_date: string | null;
  spouse_phone: string | null;
  spouse_email: string | null;
  spouse_health_fund: string | null;
  spouse_supplemental: string | null;
  spouse_employment: string | null;
  spouse_profession: string | null;
  children_count: number | null;
  children_ages: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  account_type: string | null;
  account_owner: string | null;
  co_owner_name: string | null;
  bank_notes: string | null;
  interests: string[] | null;
  priority_preference: string | null;
  monthly_budget: number | null;
  preferred_contact: string[] | null;
  referral_reason: string | null;
  immigration_year: number | null;
  additional_citizenship: string | null;
  data_consent: boolean | null;
  insurance_report_consent: boolean | null;
  phone_secondary: string | null;
  summary_delivery: string[] | null;
};

const STATUS_LABELS: Record<string, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  in_progress: "בטיפול",
  closed: "סגור",
  cancelled: "בוטל",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  closed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "✓ כן" : "✗ לא") : String(value);
  return (
    <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-border/40 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 pb-1 border-b border-border">{title}</h3>
      {children}
    </div>
  );
}

function CopyBlock({ submission }: { submission: Submission }) {
  const [copied, setCopied] = useState(false);

  const fullName = [submission.first_name, submission.last_name].filter(Boolean).join(" ");
  const address = [submission.street, submission.house_number, submission.city, submission.postal_code].filter(Boolean).join(", ");

  const text = [
    `=== תיק לקוח – ${fullName} ===`,
    `תאריך הגשה: ${new Date(submission.created_at).toLocaleString("he-IL")}`,
    "",
    "── פרטים אישיים ──",
    `שם מלא: ${fullName}`,
    `מספר זהות: ${submission.id_number ?? ""}`,
    `תאריך לידה: ${submission.birth_date ?? ""}`,
    `תאריך הנפקת ת"ז: ${submission.id_issue_date ?? ""}`,
    `ארץ לידה: ${submission.birth_country ?? ""}`,
    `שנת עלייה: ${submission.immigration_year ?? ""}`,
    `אזרחות נוספת: ${submission.additional_citizenship ?? ""}`,
    `מין: ${submission.gender ?? ""}`,
    `גיל: ${submission.calculated_age ?? ""}`,
    `מצב משפחתי: ${submission.marital_status ?? ""}`,
    "",
    "── פרטי קשר ──",
    `טלפון: ${submission.phone ?? ""}`,
    `טלפון נוסף: ${submission.phone_secondary ?? ""}`,
    `דוא"ל: ${submission.email ?? ""}`,
    `כתובת: ${address}`,
    `דרך יצירת קשר מועדפת: ${(submission.preferred_contact ?? []).join(", ")}`,
    "",
    "── עיסוק ──",
    `סטטוס תעסוקה: ${submission.employment_status ?? ""}`,
    `מקצוע: ${submission.profession ?? ""}`,
    `שם מעסיק: ${submission.employer_name ?? ""}`,
    `ותק בעבודה: ${submission.work_seniority ?? ""}`,
    `הכנסה שנתית: ${submission.annual_income ?? ""}`,
    `הכנסה נוספת: ${submission.additional_income ?? ""}`,
    "",
    "── בריאות ──",
    `קופת חולים: ${submission.health_fund ?? ""}`,
    `ביטוח משלים: ${submission.supplemental_insurance ?? ""}`,
    `מעשן: ${submission.smoker ? "כן" : "לא"}`,
    `סיגריות ליום: ${submission.cigarettes_per_day ?? ""}`,
    `גובה (ס"מ): ${submission.height_cm ?? ""}`,
    `משקל (ק"ג): ${submission.weight_kg ?? ""}`,
    `BMI: ${submission.bmi ?? ""}`,
    "",
    "── בן/בת זוג ──",
    `יש בן/בת זוג: ${submission.has_spouse ? "כן" : "לא"}`,
    `שם בן/בת זוג: ${submission.spouse_name ?? ""}`,
    `תאריך לידה בן/בת זוג: ${submission.spouse_birth_date ?? ""}`,
    `טלפון בן/בת זוג: ${submission.spouse_phone ?? ""}`,
    `דוא"ל בן/בת זוג: ${submission.spouse_email ?? ""}`,
    `קופ"ח בן/בת זוג: ${submission.spouse_health_fund ?? ""}`,
    `ביטוח משלים בן/בת זוג: ${submission.spouse_supplemental ?? ""}`,
    `תעסוקה בן/בת זוג: ${submission.spouse_employment ?? ""}`,
    `מקצוע בן/בת זוג: ${submission.spouse_profession ?? ""}`,
    "",
    "── ילדים ──",
    `מספר ילדים: ${submission.children_count ?? ""}`,
    `גילאי ילדים: ${submission.children_ages ?? ""}`,
    "",
    "── בנק ──",
    `שם בנק: ${submission.bank_name ?? ""}`,
    `סניף: ${submission.bank_branch ?? ""}`,
    `מספר חשבון: ${submission.bank_account ?? ""}`,
    `סוג חשבון: ${submission.account_type ?? ""}`,
    `בעל החשבון: ${submission.account_owner ?? ""}`,
    `בעלים משותף: ${submission.co_owner_name ?? ""}`,
    `הערות בנק: ${submission.bank_notes ?? ""}`,
    "",
    "── העדפות ──",
    `תחומי עניין: ${(submission.interests ?? []).join(", ")}`,
    `עדיפות: ${submission.priority_preference ?? ""}`,
    `תקציב חודשי: ${submission.monthly_budget ?? ""}`,
    `סיבת פנייה: ${submission.referral_reason ?? ""}`,
    `אופן משלוח סיכום: ${(submission.summary_delivery ?? []).join(", ")}`,
    "",
    "── הסכמות ──",
    `הסכמה לנתונים: ${submission.data_consent ? "✓" : "✗"}`,
    `הסכמה לדו"ח ביטוח: ${submission.insurance_report_consent ? "✓" : "✗"}`,
  ].filter(line => !line.endsWith(": ")).join("\n");

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="sm" variant="outline" onClick={copy} className="gap-2">
      {copied ? <><span>✓</span> הועתק!</> : <><Download className="w-4 h-4" /> העתק הכל</>}
    </Button>
  );
}

function DetailModal({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const fullName = [submission.first_name, submission.last_name].filter(Boolean).join(" ");
  const address = [submission.street, submission.house_number, submission.city, submission.postal_code].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{new Date(submission.created_at).toLocaleString("he-IL")}</p>
          </div>
          <div className="flex items-center gap-2">
            <CopyBlock submission={submission} />
            <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6" dir="rtl">
          <Section title="פרטים אישיים">
            <Row label="שם מלא" value={fullName} />
            <Row label="מספר זהות" value={submission.id_number} />
            <Row label="תאריך לידה" value={submission.birth_date} />
            <Row label='תאריך הנפקת ת"ז' value={submission.id_issue_date} />
            <Row label="ארץ לידה" value={submission.birth_country} />
            <Row label="שנת עלייה" value={submission.immigration_year} />
            <Row label="אזרחות נוספת" value={submission.additional_citizenship} />
            <Row label="מין" value={submission.gender} />
            <Row label="גיל" value={submission.calculated_age} />
            <Row label="מצב משפחתי" value={submission.marital_status} />
          </Section>

          <Section title="פרטי קשר">
            <Row label="טלפון" value={submission.phone} />
            <Row label="טלפון נוסף" value={submission.phone_secondary} />
            <Row label='דוא"ל' value={submission.email} />
            <Row label="כתובת" value={address} />
            <Row label="דרך יצירת קשר מועדפת" value={(submission.preferred_contact ?? []).join(", ")} />
          </Section>

          <Section title="עיסוק">
            <Row label="סטטוס תעסוקה" value={submission.employment_status} />
            <Row label="מקצוע" value={submission.profession} />
            <Row label="שם מעסיק" value={submission.employer_name} />
            <Row label="ותק בעבודה" value={submission.work_seniority} />
            <Row label="הכנסה שנתית" value={submission.annual_income} />
            <Row label="הכנסה נוספת" value={submission.additional_income} />
          </Section>

          <Section title="בריאות">
            <Row label="קופת חולים" value={submission.health_fund} />
            <Row label="ביטוח משלים" value={submission.supplemental_insurance} />
            <Row label="מעשן" value={submission.smoker} />
            <Row label="סיגריות ליום" value={submission.cigarettes_per_day} />
            <Row label='גובה (ס"מ)' value={submission.height_cm} />
            <Row label='משקל (ק"ג)' value={submission.weight_kg} />
            <Row label="BMI" value={submission.bmi} />
          </Section>

          <Section title='בן/בת זוג'>
            <Row label='יש בן/בת זוג' value={submission.has_spouse} />
            <Row label='שם בן/בת זוג' value={submission.spouse_name} />
            <Row label='תאריך לידה' value={submission.spouse_birth_date} />
            <Row label='טלפון' value={submission.spouse_phone} />
            <Row label='דוא"ל' value={submission.spouse_email} />
            <Row label='קופ"ח' value={submission.spouse_health_fund} />
            <Row label='ביטוח משלים' value={submission.spouse_supplemental} />
            <Row label='תעסוקה' value={submission.spouse_employment} />
            <Row label='מקצוע' value={submission.spouse_profession} />
          </Section>

          <Section title="ילדים">
            <Row label="מספר ילדים" value={submission.children_count} />
            <Row label="גילאי ילדים" value={submission.children_ages} />
          </Section>

          <Section title="פרטי בנק">
            <Row label="שם בנק" value={submission.bank_name} />
            <Row label="סניף" value={submission.bank_branch} />
            <Row label="מספר חשבון" value={submission.bank_account} />
            <Row label="סוג חשבון" value={submission.account_type} />
            <Row label="בעל החשבון" value={submission.account_owner} />
            <Row label="בעלים משותף" value={submission.co_owner_name} />
            <Row label="הערות" value={submission.bank_notes} />
          </Section>

          <Section title="העדפות ותחומי עניין">
            <Row label="תחומי עניין" value={(submission.interests ?? []).join(", ")} />
            <Row label="עדיפות" value={submission.priority_preference} />
            <Row label="תקציב חודשי" value={submission.monthly_budget} />
            <Row label="סיבת פנייה" value={submission.referral_reason} />
            <Row label="אופן משלוח סיכום" value={(submission.summary_delivery ?? []).join(", ")} />
          </Section>

          <Section title="הסכמות">
            <Row label="הסכמה לשימוש בנתונים" value={submission.data_consent} />
            <Row label='הסכמה לדו"ח ביטוח' value={submission.insurance_report_consent} />
          </Section>
        </div>
      </div>
    </div>
  );
}

type DirectDebitSubmission = {
  id: string;
  created_at: string;
  account_owner: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  bank_notes: string | null;
  status: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

export default function Admin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"onboarding" | "directdebit">("onboarding");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [ddSubmissions, setDdSubmissions] = useState<DirectDebitSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<"created_at" | "first_name" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Submission | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ password, action: "fetch" }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        setPasswordError(err.error || "שגיאה בכניסה");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAdminPassword(password);
      setSubmissions(data.submissions || []);
      setDdSubmissions(data.ddSubmissions || []);
      setAuthed(true);
      setPasswordError("");
    } catch {
      setPasswordError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ password: adminPassword, action: "fetch" }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
        setDdSubmissions(data.ddSubmissions || []);
      }
    } catch {
      console.error("Failed to fetch submissions");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authed) fetchSubmissions();
  }, [authed, sortField, sortDir]);

  const filtered = submissions.filter(s => {
    const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.toLowerCase();
    const phone = s.phone ?? "";
    const email = s.email ?? "";
    const matchSearch = !search || name.includes(search.toLowerCase()) || phone.includes(search) || email.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const created = new Date(s.created_at);
    const matchFrom = !dateFrom || created >= new Date(dateFrom);
    const matchTo = !dateTo || created <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-lg">
          <div className="text-center mb-6">
            <Shield className="w-10 h-10 mx-auto mb-3 text-primary" />
            <h1 className="text-xl font-bold">כניסה למנהל</h1>
            <p className="text-sm text-muted-foreground mt-1">SeelD Admin Panel</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="סיסמת כניסה"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              className="text-right"
            />
            {passwordError && <p className="text-destructive text-sm">{passwordError}</p>}
            <Button className="w-full" onClick={handleLogin}>כניסה</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">ניהול לקוחות – SeelD</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} לקוחות נמצאו</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSubmissions} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> רענן
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <LogOut className="w-4 h-4" /> יציאה
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-border bg-card flex gap-2">
        <button
          onClick={() => setActiveTab("onboarding")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors",
            activeTab === "onboarding"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-4 h-4" /> שאלוני הצטרפות ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab("directdebit")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors",
            activeTab === "directdebit"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="w-4 h-4" /> טפסי הו"ק ({ddSubmissions.length})
        </button>
      </div>


      {activeTab === "onboarding" && (
        <>
          {/* Filters */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חפש שם, טלפון, מייל..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9 text-right"
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  className="border border-input bg-background rounded-md px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">כל הסטטוסים</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">מ:</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-input bg-background rounded-md px-3 py-2 text-sm" />
                <span className="text-sm text-muted-foreground">עד:</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-input bg-background rounded-md px-3 py-2 text-sm" />
              </div>
              {(search || statusFilter !== "all" || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}>
                  <X className="w-4 h-4" /> נקה
                </Button>
              )}
            </div>
          </div>

          {/* Onboarding Table */}
          <div className="overflow-x-auto px-6 py-4">
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">טוען נתונים...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">לא נמצאו לקוחות</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-right py-3 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                      <span className="flex items-center gap-1">תאריך <SortIcon field="created_at" /></span>
                    </th>
                    <th className="text-right py-3 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("first_name")}>
                      <span className="flex items-center gap-1">שם מלא <SortIcon field="first_name" /></span>
                    </th>
                    <th className="text-right py-3 px-4 font-medium">טלפון</th>
                    <th className="text-right py-3 px-4 font-medium">דוא"ל</th>
                    <th className="text-right py-3 px-4 font-medium">עיר</th>
                    <th className="text-right py-3 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
                      <span className="flex items-center gap-1">סטטוס <SortIcon field="status" /></span>
                    </th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("he-IL")}</td>
                      <td className="py-3 px-4 font-medium">{[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}</td>
                      <td className="py-3 px-4 font-mono">{s.phone ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.email ?? "—"}</td>
                      <td className="py-3 px-4">{s.city ?? "—"}</td>
                      <td className="py-3 px-4">
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground")}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(s)}>
                          <Eye className="w-3 h-3" /> צפייה
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === "directdebit" && (
        <div className="overflow-x-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">טוען נתונים...</div>
          ) : ddSubmissions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">לא נמצאו טפסי הו"ק</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right py-3 px-4 font-medium">תאריך</th>
                  <th className="text-right py-3 px-4 font-medium">שם לקוח</th>
                  <th className="text-right py-3 px-4 font-medium">בעל חשבון</th>
                  <th className="text-right py-3 px-4 font-medium">בנק</th>
                  <th className="text-right py-3 px-4 font-medium">סניף</th>
                  <th className="text-right py-3 px-4 font-medium font-mono">מספר חשבון</th>
                  <th className="text-right py-3 px-4 font-medium">הערות</th>
                </tr>
              </thead>
              <tbody>
                {ddSubmissions.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("he-IL")}</td>
                    <td className="py-3 px-4 font-medium">{[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}</td>
                    <td className="py-3 px-4">{s.account_owner ?? "—"}</td>
                    <td className="py-3 px-4">{s.bank_name ?? "—"}</td>
                    <td className="py-3 px-4">{s.bank_branch ?? "—"}</td>
                    <td className="py-3 px-4 font-mono font-bold">{s.bank_account ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{s.bank_notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selected && <DetailModal submission={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
