import { AlertTriangle, Info, Shield } from "lucide-react";

type DisclaimerVariant = "info" | "warning" | "legal";

interface DisclaimerBannerProps {
  variant?: DisclaimerVariant;
  text: string;
  className?: string;
}

const variantStyles: Record<DisclaimerVariant, { bg: string; border: string; icon: typeof Info; iconColor: string; textColor: string }> = {
  info: {
    bg: "bg-[#e0f2f1]",
    border: "border-[#0a3d3d]/10",
    icon: Info,
    iconColor: "text-[#0a3d3d]",
    textColor: "text-[#0a3d3d]/80",
  },
  warning: {
    bg: "bg-[#fef3c7]",
    border: "border-[#f59e0b]/20",
    icon: AlertTriangle,
    iconColor: "text-[#f59e0b]",
    textColor: "text-[#92400e]",
  },
  legal: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: Shield,
    iconColor: "text-gray-400",
    textColor: "text-gray-500",
  },
};

const DisclaimerBanner = ({ variant = "info", text, className = "" }: DisclaimerBannerProps) => {
  const style = variantStyles[variant];
  const IconComp = style.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl p-3.5 border ${style.bg} ${style.border} ${className}`}>
      <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${style.iconColor}`} />
      <p className={`text-xs leading-relaxed ${style.textColor}`}>{text}</p>
    </div>
  );
};

/**
 * Standard legal disclaimer for the client personal area footer.
 */
export const LegalFooterDisclaimer = () => (
  <div className="mt-10 pt-6 border-t border-gray-200 space-y-3">
    <div className="text-[11px] text-gray-400 leading-relaxed text-center max-w-2xl mx-auto space-y-2">
      <p>
        * המידע המוצג באזור האישי הינו לצרכי מידע כללי בלבד ואינו מהווה ייעוץ
        ביטוחי, פנסיוני, פיננסי או משפטי. אין להסתמך על מידע זה כתחליף לייעוץ
        מקצועי אישי מסוכן ביטוח מורשה.
      </p>
      <p>
        * תוכן הצ'אט הבוט מבוסס על מודל בינה מלאכותית ומספק מידע כללי בלבד.
        התשובות אינן מהוות המלצה או ייעוץ מקצועי. לפני כל פעולה או החלטה פיננסית,
        יש להתייעץ עם סוכן הביטוח שלך.
      </p>
      <p>
        * נתוני הפוליסות והכיסויים המוצגים עשויים להשתנות ואינם מחליפים את
        תנאי הפוליסה המקוריים. למידע מעודכן, פנו לסוכן הביטוח שלכם.
      </p>
      <p className="font-medium text-gray-500">
        SEELD &copy; {new Date().getFullYear()} — ביטוח, חיסכון ופנסיה | כל הזכויות שמורות.
      </p>
    </div>
  </div>
);

export default DisclaimerBanner;
