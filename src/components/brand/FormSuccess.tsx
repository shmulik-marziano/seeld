import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, LINE, MUTED, PASTEL_SAGE, TINT_SAGE } from "@/lib/brand";

/**
 * What replaces a form after it is sent (mock: "מה מכינים לפגישה?").
 * Not a toast that disappears: a card that says what happens next and what
 * to have ready, so the visitor leaves with a plan rather than a confirmation.
 */
interface FormSuccessProps {
  title?: string;
  /** What happens next, one sentence */
  next?: string;
  /** Things to prepare, three at most */
  prepare?: { title: string; body: string }[];
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
}

const DEFAULT_PREPARE = [
  { title: "מסמכים קיימים", body: "פוליסות, דוחות שנתיים ותלושי שכר אחרונים." },
  { title: "שאלות שחשוב לכם לשאול", body: "נושאים שמטרידים אתכם או החלטות שמתלבטים בהן." },
  { title: "מטרות להמשך", body: "מה חשוב לכם להשיג: הגנה, חיסכון, פרישה." },
];

export const FormSuccess = ({
  title = "קיבלנו. תודה.",
  next = "נחזור אליכם ביום העסקים הבא בטלפון שהשארתם.",
  prepare = DEFAULT_PREPARE,
  onReset,
  resetLabel = "שליחת פרטים נוספים",
  className = "",
}: FormSuccessProps) => (
  <div className={`rounded-2xl bg-white border p-6 sm:p-7 ${className}`} style={{ borderColor: LINE }} role="status" aria-live="polite">
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: PASTEL_SAGE }}>
        <BrandIcon name="check" size={24} style={{ color: GREEN }} />
      </span>
      <div>
        <h3 className="text-[22px] leading-tight" style={{ color: GREEN }}>{title}</h3>
        <p className="mt-1 text-[16px]" style={{ color: BODY }}>{next}</p>
      </div>
    </div>

    <div className="mt-6 rounded-2xl p-5" style={{ background: TINT_SAGE }}>
      <p className="text-[16px] font-bold" style={{ color: GREEN }}>מה מכינים לשיחה?</p>
      <ul className="mt-3 space-y-3">
        {prepare.map((p) => (
          <li key={p.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              <BrandIcon name="check" size={14} style={{ color: GREEN }} />
            </span>
            <span>
              <span className="block text-[15px] font-bold" style={{ color: GREEN }}>{p.title}</span>
              <span className="block text-[14px] leading-[1.6]" style={{ color: MUTED }}>{p.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>

    {onReset && (
      <button type="button" onClick={onReset} className="link-rule mt-5 text-[15px]">
        {resetLabel}
        <BrandIcon name="arrow-left" size={18} />
      </button>
    )}
  </div>
);

export default FormSuccess;
