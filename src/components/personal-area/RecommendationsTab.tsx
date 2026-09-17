import { useEffect, useState } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";

type Recommendation = {
  id: string;
  title: string | null;
  rationale: string | null;
  status: string | null;
  created_at: string;
  category: string | null;
  priority: string | null;
};

// Decision states of a documented recommendation. A state is a record of what
// was decided, not an approval of cover.
const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "טיוטה", bg: "#E1E8E1", text: "#476356" },
  sent: { label: "נשלחה אליכם", bg: "#E8EDE5", text: "#003D30" },
  pending: { label: "ממתינה להחלטה", bg: "#F5EEE0", text: "#8A6230" },
  approved: { label: "אושרה על ידכם", bg: "#E8EDE5", text: "#003D30" },
  rejected: { label: "נדחתה", bg: "#F6E5DC", text: "#9A4520" },
  implemented: { label: "בוצעה", bg: "#003D30", text: "#FAF7EF" },
};

const RecommendationsTab = ({ customerId }: { customerId: string }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [customerId]);

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await siteSupabase
        .from("recommendations")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecommendations((data || []) as Recommendation[]);
    } catch {
      toast.error("טעינת ההמלצות לא הצליחה. נסו לרענן את העמוד.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" aria-busy="true" aria-live="polite">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} aria-hidden="true" />
        <span className="sr-only">טוען המלצות</span>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="dna-concept !p-8 sm:!p-10 text-center">
        <BrandIcon name="document" size={40} className="mx-auto mb-4" style={{ color: GREEN }} />
        <h3 className="text-[20px] mb-2" style={{ color: GREEN }}>אין עדיין המלצות מתועדות</h3>
        <p className="text-[16px] leading-[1.6] max-w-md mx-auto" style={{ color: BODY }}>
          כשהיועץ יתעד המלצות בתיק, הן יופיעו כאן עם ההסבר שלצידן והחלטה שלכם לכל אחת.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[22px]" style={{ color: GREEN }}>המלצות היועץ</h2>
        <span className="text-[14px]" style={{ color: MUTED }}>
          <span dir="ltr" className="tabular-nums">{recommendations.length}</span> המלצות
        </span>
      </div>
      <ul className="grid gap-4">
        {recommendations.map((rec) => {
          const status = statusConfig[rec.status || "pending"] || statusConfig.pending;
          return (
            <li key={rec.id} className="dna-concept">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <h3 className="text-[18px] leading-snug" style={{ color: GREEN }}>
                  {rec.title || "המלצה"}
                </h3>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-[14px] font-bold shrink-0"
                  style={{ backgroundColor: status.bg, color: status.text }}
                >
                  {status.label}
                </span>
              </div>
              {rec.rationale && (
                <p className="text-[16px] leading-[1.7] mb-3" style={{ color: BODY }}>{rec.rationale}</p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] pt-3 border-t" style={{ color: MUTED, borderColor: LINE }}>
                <span>
                  תועדה בתאריך <span dir="ltr" className="tabular-nums">{new Date(rec.created_at).toLocaleDateString("he-IL")}</span>
                </span>
                {rec.category && <span>תחום: {rec.category}</span>}
                {rec.priority && <span>עדיפות: {rec.priority}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecommendationsTab;
