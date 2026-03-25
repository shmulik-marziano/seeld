import { useEffect, useState } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Lightbulb, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";

type Recommendation = {
  id: string;
  title: string | null;
  rationale: string | null;
  status: string | null;
  created_at: string;
  category: string | null;
  priority: string | null;
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "ממתין", bg: "#fef3c7", text: "#92400e" },
  approved: { label: "אושר", bg: "#d1fae5", text: "#065f46" },
  rejected: { label: "נדחה", bg: "#fee2e2", text: "#991b1b" },
  implemented: { label: "מומש", bg: "#dbeafe", text: "#1e40af" },
  sent: { label: "נשלח", bg: "#e0e7ff", text: "#3730a3" },
  draft: { label: "טיוטה", bg: "#f3f4f6", text: "#374151" },
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
      toast.error("שגיאה בטעינת ההמלצות");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#0a3d3d" }} />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#fef3c7" }}>
          <Lightbulb className="w-8 h-8" style={{ color: "#f59e0b" }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#0a3d3d" }}>אין המלצות עדיין</h3>
        <p className="text-gray-500">הסוכן שלך יכין עבורך המלצות מותאמות אישית בקרוב.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#0a3d3d" }}>המלצות הסוכן</h2>
      <div className="grid gap-4">
        {recommendations.map((rec) => {
          const status = statusConfig[rec.status || "pending"] || statusConfig.pending;
          return (
            <div key={rec.id} className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
                    <Lightbulb className="w-5 h-5" style={{ color: "#f59e0b" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-base" style={{ color: "#0a3d3d" }}>
                        {rec.title || "המלצה"}
                      </h3>
                      <span
                        className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium"
                        style={{ background: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                    </div>
                    {rec.rationale && (
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{rec.rationale}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(rec.created_at).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsTab;
