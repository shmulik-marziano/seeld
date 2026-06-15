import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  Download,
  Sparkles,
  Loader2,
  TrendingUp,
  ShieldAlert,
  Wallet,
  Gauge,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { V2Shell } from "../components/V2Shell";
import { GlassCard, GradientText, En, Ring, Eyebrow } from "../components/primitives";
import { ProjectionChart } from "../components/ProjectionChart";
import { exportElementToPdf } from "../lib/report-pdf";
import { deterministicInsights, streamInsights } from "../lib/ai";
import {
  DEFAULT_PROFILE,
  FinancialProfile,
  Coverage,
  buildReport,
  shekels,
  shekelsCompact,
  percent,
  readinessLabel,
} from "../lib/finance";

/* ── Input controls ─────────────────────────────────────────── */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-[#3a3a3c]">{label}</label>
        <span className="tnum v2-display text-[15px] font-bold text-[#18181a]">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-right transition-all ${
        checked ? "border-[#18181a] bg-[#18181a] text-white" : "border-[#18181a1f] bg-white text-[#76746e] hover:border-[#18181a40]"
      }`}
    >
      <span className="text-[13px] font-medium">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-white/30" : "bg-[#dedcd4]"}`}>
        <motion.span layout className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow" style={{ [checked ? "left" : "right"]: 2 } as any} />
      </span>
    </button>
  );
}

const COVERAGE_FIELDS: { key: keyof Coverage; label: string }[] = [
  { key: "life", label: "ביטוח חיים" },
  { key: "disability", label: "אובדן כושר עבודה" },
  { key: "health", label: "בריאות פרטי" },
  { key: "critical", label: "מחלות קשות" },
  { key: "longTermCare", label: "סיעוד" },
  { key: "mortgage", label: "ביטוח משכנתא" },
];

function Stat({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn";
}) {
  const accent = tone === "warn" ? "text-[#b4453a]" : tone === "good" ? "text-[#2f7d5b]" : "text-[#18181a]";
  return (
    <GlassCard className="p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#18181a14] ${accent}`}>{icon}</div>
      <p className="text-[12px] text-[#76746e]">{label}</p>
      <p className="tnum v2-display mt-0.5 text-xl font-extrabold text-[#18181a]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[#a8a6a0]">{sub}</p>}
    </GlassCard>
  );
}

export default function ReportStudio() {
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const result = useMemo(() => buildReport(profile), [profile]);
  const ready = readinessLabel(result.readinessScore);

  const [aiText, setAiText] = useState<string | null>(null);
  const [aiState, setAiState] = useState<"idle" | "streaming" | "error">("idle");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiText(null);
    setAiState("idle");
  }, [profile]);

  const insights = aiText ?? deterministicInsights(profile, result);

  const set = <K extends keyof FinancialProfile>(k: K, v: FinancialProfile[K]) => setProfile((p) => ({ ...p, [k]: v }));
  const setCov = (k: keyof Coverage, v: boolean) => setProfile((p) => ({ ...p, coverage: { ...p.coverage, [k]: v } }));

  const runAI = () => {
    setAiState("streaming");
    setAiText("");
    const handle = streamInsights(profile, result, (full) => setAiText(full));
    handle.promise
      .then((full) => {
        if (full && full.trim().length > 0) setAiState("idle");
        else throw new Error("empty");
      })
      .catch(() => {
        setAiState("error");
        setAiText(null);
        toast.error("היועץ החכם אינו זמין כרגע", {
          description: "מציג ניתוח מבוסס-נתונים. כדי להפעיל את אריק (AI) יש להגדיר מפתח Google AI בשרת.",
        });
      });
  };

  const handlePdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(reportRef.current, "seeld-financial-report.pdf", "#fbfbf9");
      toast.success("הדוח הורד בהצלחה");
    } catch {
      toast.error("אירעה שגיאה ביצירת הדוח");
    } finally {
      setExporting(false);
    }
  };

  return (
    <V2Shell>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-12 sm:pt-16 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <Eyebrow>סטודיו הדוחות · ללא הרשמה</Eyebrow>
          <h1 className="v2-display mt-5 text-4xl sm:text-6xl font-extrabold leading-[1.0] text-[#18181a]">
            בנה את הדוח הפיננסי <GradientText>שלך.</GradientText>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] sm:text-base text-[#3a3a3c] leading-relaxed">
            הזן את הנתונים שלך וקבל תמונת מצב חיה — צבירה, קצבה לפרישה, אובדן מדמי ניהול ופערי כיסוי.
            הכול מתעדכן בזמן אמת. בסיום — ניתוח חכם והורדת דוח PDF.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-8">
          {/* ── Input panel ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <GlassCard className="p-5 sm:p-6">
              <p className="v2-index mb-5 text-[11px]">01 · הפרופיל שלך</p>
              <div className="space-y-5">
                <Slider label="גיל" value={profile.age} min={22} max={66} display={`${profile.age}`} onChange={(v) => set("age", v)} />
                <Slider label="גיל פרישה" value={profile.retirementAge} min={60} max={70} display={`${profile.retirementAge}`} onChange={(v) => set("retirementAge", v)} />
                <Slider label="הכנסה חודשית" value={profile.monthlyIncome} min={5000} max={60000} step={500} display={shekels(profile.monthlyIncome)} onChange={(v) => set("monthlyIncome", v)} />
                <Slider label="צבירה פנסיונית נוכחית" value={profile.pensionBalance} min={0} max={3000000} step={10000} display={shekelsCompact(profile.pensionBalance)} onChange={(v) => set("pensionBalance", v)} />
                <Slider label="הפקדה חודשית לפנסיה" value={profile.monthlyDeposit} min={0} max={12000} step={100} display={shekels(profile.monthlyDeposit)} onChange={(v) => set("monthlyDeposit", v)} />
                <Slider label="דמי ניהול מצבירה" value={profile.feeOnBalance} min={0} max={1.05} step={0.01} display={`${profile.feeOnBalance.toFixed(2)}%`} onChange={(v) => set("feeOnBalance", v)} />
                <Slider label="דמי ניהול מהפקדה" value={profile.feeOnDeposit} min={0} max={6} step={0.1} display={`${profile.feeOnDeposit.toFixed(1)}%`} onChange={(v) => set("feeOnDeposit", v)} />
                <Slider label="תשואה שנתית (הנחה)" value={profile.annualReturn} min={2} max={9} step={0.5} display={`${profile.annualReturn}%`} onChange={(v) => set("annualReturn", v)} />
              </div>

              <p className="v2-index mb-3 mt-7 text-[11px]">02 · כיסוי ביטוחי</p>
              <div className="grid grid-cols-2 gap-2">
                {COVERAGE_FIELDS.map((f) => (
                  <Toggle key={f.key} label={f.label} checked={profile.coverage[f.key]} onChange={(v) => setCov(f.key, v)} />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 items-center">
                <Toggle label="יש משכנתא" checked={profile.hasMortgage} onChange={(v) => set("hasMortgage", v)} />
                <Slider label="תלויים" value={profile.dependents} min={0} max={6} display={`${profile.dependents}`} onChange={(v) => set("dependents", v)} />
              </div>
            </GlassCard>
          </div>

          {/* ── Results dashboard (PDF target) ── */}
          <div ref={reportRef} className="rounded-3xl">
            {/* Hero result */}
            <GlassCard className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] text-[#76746e]">צבירה צפויה בגיל {profile.retirementAge}</p>
                  <motion.p
                    key={Math.round(result.balanceAtRetirement)}
                    initial={{ opacity: 0.4, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="v2-display tnum mt-1 text-5xl sm:text-6xl font-extrabold leading-none text-[#18181a]"
                  >
                    {shekels(result.balanceAtRetirement)}
                  </motion.p>
                  <p className="mt-3 text-[13px] text-[#3a3a3c]">
                    מתוכם <span className="font-semibold text-[#18181a]">{shekelsCompact(result.totalGrowth)}</span> תשואה ·
                    קצבה חודשית של <span className="font-semibold text-[#18181a]">{shekels(result.monthlyPension)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <Ring value={result.readinessScore} size={128}>
                    <span className="v2-display tnum text-3xl font-extrabold text-[#18181a]">{result.readinessScore}</span>
                    <span className="text-[10px] text-[#a8a6a0]">מתוך 100</span>
                  </Ring>
                  <span
                    className={`mt-2 text-[12px] font-semibold ${
                      ready.tone === "good" ? "text-[#2f7d5b]" : ready.tone === "ok" ? "text-[#b07a16]" : "text-[#b4453a]"
                    }`}
                  >
                    {ready.label}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Stat grid */}
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon={<Wallet className="h-4 w-4" />} label="קצבה חודשית צפויה" value={shekels(result.monthlyPension)} />
              <Stat icon={<Gauge className="h-4 w-4" />} label="שיעור תחלופה" value={percent(result.replacementRatio)} sub="יעד מומלץ: 70%" tone={result.replacementRatio >= 0.7 ? "good" : "warn"} />
              <Stat icon={<TrendingUp className="h-4 w-4" />} label="אובדן מדמי ניהול" value={shekelsCompact(result.lostToFees)} sub={`≈ ${shekels(result.extraMonthlyIfOptimized)} בחודש`} tone="warn" />
              <Stat icon={<ShieldAlert className="h-4 w-4" />} label="ציון כיסוי ביטוחי" value={`${result.coverageScore}%`} sub={`${result.coverageGaps.length} פערים`} tone={result.coverageScore >= 80 ? "good" : "warn"} />
            </div>

            {/* Chart */}
            <GlassCard className="mt-4 p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#18181a]">מסלול הצבירה עד הפרישה</h3>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#76746e]"><span className="h-2 w-3 rounded-full bg-[#18181a]" /> תרחיש נוכחי</span>
                  <span className="flex items-center gap-1.5 text-[#76746e]"><span className="h-2 w-3 rounded-full bg-[#2f7d5b]" /> דמי ניהול מופחתים</span>
                </div>
              </div>
              <div className="h-64">
                <ProjectionChart series={result.series} />
              </div>
            </GlassCard>

            {/* Coverage gaps */}
            {result.coverageGaps.length > 0 && (
              <GlassCard className="mt-4 p-5 sm:p-6">
                <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-[#18181a]">
                  <ShieldAlert className="h-4 w-4 text-[#b4453a]" /> פערים בכיסוי שכדאי לבחון
                </h3>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {result.coverageGaps.map((g) => (
                    <div key={g.key} className="rounded-2xl border border-[#18181a12] bg-[#f4f3ef] p-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${g.severity === "high" ? "bg-[#b4453a]" : g.severity === "medium" ? "bg-[#b07a16]" : "bg-[#76746e]"}`} />
                        <p className="text-[13px] font-semibold text-[#18181a]">{g.label}</p>
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#76746e]">{g.reason}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Insights */}
            <GlassCard className="mt-4 p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#18181a]">
                  <Sparkles className="h-4 w-4 text-[#18181a]" />
                  {aiText !== null ? "ניתוח אריק (AI)" : "ניתוח מבוסס-נתונים"}
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={runAI} disabled={aiState === "streaming"} className="v2-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold disabled:opacity-60">
                    {aiState === "streaming" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    נתח עם אריק (AI)
                  </button>
                  <button onClick={handlePdf} disabled={exporting} className="v2-btn-primary inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold disabled:opacity-60">
                    {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    הורד PDF
                  </button>
                </div>
              </div>

              <div
                className="max-w-none text-[14px] leading-[1.85] text-[#3a3a3c]
                  [&_h2]:v2-display [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-[#18181a]
                  [&_strong]:font-bold [&_strong]:text-[#18181a]
                  [&_ol]:mt-2 [&_ol]:space-y-1 [&_ol]:pr-5 [&_ol]:list-decimal
                  [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:pr-5 [&_ul]:list-disc
                  [&_p]:mt-2"
              >
                <ReactMarkdown>{insights}</ReactMarkdown>
                {aiState === "streaming" && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-[#18181a] align-middle" />}
              </div>

              {/* CTA */}
              <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-[#18181a14] bg-[#f4f3ef] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-[#2f7d5b]" />
                  <p className="text-[13px] text-[#3a3a3c]">רוצה לממש את ההזדמנויות שזוהו? פגישת הייעוץ הראשונה <En>on us.</En></p>
                </div>
                <Link to="/contact" className="v2-btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-[13px] font-semibold">
                  קביעת פגישה <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </V2Shell>
  );
}
