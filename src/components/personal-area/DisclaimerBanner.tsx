import { AlertTriangle, Info, Shield } from "lucide-react";
import { BRAND_YEAR } from "@/lib/brandYear";

type DisclaimerVariant = "info" | "warning" | "legal";

interface DisclaimerBannerProps {
  variant?: DisclaimerVariant;
  text: string;
  className?: string;
}

// Brand tints: sage-light for information, sand tint for attention, white for legal.
const variantStyles: Record<DisclaimerVariant, { bg: string; border: string; icon: typeof Info; iconColor: string; textColor: string }> = {
  info: {
    bg: "#EEF2EC",
    border: "#D9DEE4",
    icon: Info,
    iconColor: "#203957",
    textColor: "#2D435D",
  },
  warning: {
    bg: "#F5EEE0",
    border: "#E5D3B3",
    icon: AlertTriangle,
    iconColor: "#7C5C22",
    textColor: "#2D435D",
  },
  legal: {
    bg: "#FFFFFF",
    border: "#D9DEE4",
    icon: Shield,
    iconColor: "#55677C",
    textColor: "#55677C",
  },
};

const DisclaimerBanner = ({ variant = "info", text, className = "" }: DisclaimerBannerProps) => {
  const style = variantStyles[variant];
  const IconComp = style.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl p-4 border ${className}`}
      style={{ backgroundColor: style.bg, borderColor: style.border }}
      role="note"
    >
      <IconComp className="w-5 h-5 shrink-0 mt-0.5" style={{ color: style.iconColor }} strokeWidth={1.75} aria-hidden="true" />
      <p className="text-[14px] leading-[1.6]" style={{ color: style.textColor }}>{text}</p>
    </div>
  );
};

/**
 * Standard legal disclaimer for the client personal area footer.
 */
export const LegalFooterDisclaimer = () => (
  <div className="mt-10 pt-6 border-t space-y-3" style={{ borderColor: "#D9DEE4" }}>
    <div className="text-[14px] leading-[1.6] text-center max-w-2xl mx-auto space-y-2" style={{ color: "#55677C" }}>
      <p>
        המידע המוצג באזור האישי הוא לצורכי מידע כללי בלבד ואינו מהווה ייעוץ
        ביטוחי, פנסיוני, פיננסי או משפטי. אין להסתמך עליו כתחליף לייעוץ
        מקצועי אישי מסוכן ביטוח ברישיון.
      </p>
      <p>
        תשובות העוזר הדיגיטלי מבוססות על מודל בינה מלאכותית ומספקות מידע כללי בלבד.
        הן אינן המלצה או ייעוץ מקצועי. לפני כל פעולה או החלטה פיננסית,
        מומלץ להתייעץ עם הצוות שלנו.
      </p>
      <p>
        נתוני הפוליסות והכיסויים המוצגים עשויים להשתנות ואינם מחליפים את
        תנאי הפוליסה המקוריים. למידע מעודכן, פנו אלינו.
      </p>
      <p className="font-bold" style={{ color: "#203957" }}>
        שילד ביטוח ופיננסים &copy; {BRAND_YEAR}. כל הזכויות שמורות.
      </p>
    </div>
  </div>
);

export default DisclaimerBanner;
