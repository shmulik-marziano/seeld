import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { startConnect } from "@/lib/insbase";
import { BODY, GREEN, IVORY, LINE, MUTED, SAGE_ON_GREEN } from "@/lib/brand";

/**
 * "חיבור התיק": the card a signed-in visitor sees before their InsBase file
 * is linked. One button leaves for the InsBase consent screen (ID number +
 * the personal code from the agency); the visitor comes back here linked.
 */
export const InsbaseConnectCard = ({ compact = false }: { compact?: boolean }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await startConnect();
    } catch {
      setBusy(false);
      setError("החיבור לא נפתח. נסו שוב בעוד רגע, או פנו אלינו.");
    }
  };

  if (compact) {
    return (
      <div className="dna-navy-band rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <BrandIcon name="folder" size={22} style={{ color: SAGE_ON_GREEN }} />
          <h3 className="text-[20px] leading-tight" style={{ color: IVORY }}>התיק עדיין לא מחובר</h3>
        </div>
        <p className="mt-2 text-[15px] leading-[1.6]" style={{ color: SAGE_ON_GREEN }}>
          חברו את התיק עם תעודת הזהות והקוד האישי מהסוכנות, וכל הפוליסות, הצבירות והכיסויים יופיעו כאן, עם מקור ותאריך לכל נתון.
        </p>
        <button type="button" onClick={go} disabled={busy} className="btn-on-green mt-5 w-full sm:w-auto sm:min-w-[200px]">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "חיבור התיק"}
        </button>
        {error && <p className="mt-3 text-[14px]" style={{ color: IVORY }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border p-6 sm:p-7" style={{ borderColor: LINE }}>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: "#E8EDE5" }}>
          <BrandIcon name="folder" size={24} style={{ color: GREEN }} />
        </span>
        <h3 className="text-[22px] leading-tight" style={{ color: GREEN }}>חיבור התיק</h3>
      </div>
      <p className="mt-4 text-[16px] leading-[1.7]" style={{ color: BODY }}>
        התיק שלכם באינסבייס מרכז את הפוליסות, הצבירות, דמי הניהול והכיסויים מכל החברות, כפי שהם רשומים
        במסלקה הפנסיונית ובהר הביטוח. אחרי החיבור תראו כאן תמונת מצב מלאה, עם מקור ותאריך לכל מספר.
      </p>
      <ol className="mt-4 space-y-2 text-[15px]" style={{ color: BODY }}>
        <li className="flex gap-3"><span className="font-bold tabular-nums" style={{ color: GREEN }}>1.</span> לוחצים על "חיבור התיק" ועוברים למסך ההזדהות של אינסבייס.</li>
        <li className="flex gap-3"><span className="font-bold tabular-nums" style={{ color: GREEN }}>2.</span> מזינים תעודת זהות ואת הקוד האישי שקיבלתם מהסוכנות, ומאשרים.</li>
        <li className="flex gap-3"><span className="font-bold tabular-nums" style={{ color: GREEN }}>3.</span> חוזרים לכאן, והתיק מחובר. הניתוק אפשרי בכל רגע מהפרופיל.</li>
      </ol>
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <button type="button" onClick={go} disabled={busy} className="btn-primary w-full sm:w-auto sm:min-w-[220px]">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : "חיבור התיק"}
        </button>
        <p className="text-[14px]" style={{ color: MUTED }}>אין לכם קוד אישי? כתבו לנו תחת פניות ונסדר.</p>
      </div>
      {error && <p className="mt-3 text-[14px]" style={{ color: "#9A4520" }}>{error}</p>}
    </div>
  );
};

export default InsbaseConnectCard;
