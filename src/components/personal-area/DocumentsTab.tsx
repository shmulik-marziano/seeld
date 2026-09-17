import { useEffect, useState } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Illustration } from "@/components/brand/Illustration";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { BODY, GREEN, LINE, MUTED } from "@/lib/brand";

type SourceFile = {
  id: string;
  file_name: string | null;
  file_type: string | null;
  status: string | null;
  created_at: string;
  file_url: string | null;
  original_name: string | null;
};

// Receipt states, as the brief distinguishes them: received, being checked,
// checked. None of these is a professional approval of the document's content.
const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  uploaded: { label: "התקבל", bg: "#E8EDE5", text: "#003D30" },
  processing: { label: "בבדיקה", bg: "#F5EEE0", text: "#8A6230" },
  processed: { label: "נבדק", bg: "#E8EDE5", text: "#003D30" },
  error: { label: "שגיאה בקליטה", bg: "#F6E5DC", text: "#9A4520" },
  pending: { label: "ממתין", bg: "#E1E8E1", text: "#476356" },
};

const fileTypeLabels: Record<string, string> = {
  pdf: "PDF",
  image: "תמונה",
  doc: "DOC",
  xlsx: "XLS",
};

const DocumentsTab = ({ customerId }: { customerId: string }) => {
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [customerId]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await siteSupabase
        .from("source_files")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles((data || []) as SourceFile[]);
    } catch {
      toast.error("טעינת המסמכים לא הצליחה. נסו לרענן את העמוד.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" aria-busy="true" aria-live="polite">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} aria-hidden="true" />
        <span className="sr-only">טוען מסמכים</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="dna-concept !p-8 sm:!p-10 text-center">
        <Illustration
          name="06-documents-service"
          sizes="240px"
          className="max-w-[240px] mx-auto mb-5"
        />
        <h3 className="text-[20px] mb-2" style={{ color: GREEN }}>אין עדיין מסמכים להצגה</h3>
        <p className="text-[16px] leading-[1.6] max-w-md mx-auto" style={{ color: BODY }}>
          לאחר שיועלו מסמכים לתיק, הם יופיעו כאן עם תאריך הקליטה ומצב הבדיקה.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[22px]" style={{ color: GREEN }}>המסמכים בתיק</h2>
        <span className="text-[14px]" style={{ color: MUTED }}>
          <span dir="ltr" className="tabular-nums">{files.length}</span> מסמכים
        </span>
      </div>
      <ul className="dna-concept !p-0 overflow-hidden divide-y" style={{ borderColor: LINE }}>
        {files.map((file) => {
          const status = statusConfig[file.status || "pending"] || statusConfig.pending;
          const displayName = file.original_name || file.file_name || "מסמך";
          const typeLabel = fileTypeLabels[file.file_type || ""] || file.file_type?.toUpperCase() || "קובץ";

          return (
            <li key={file.id} className="flex items-center gap-4 p-4" style={{ borderColor: LINE }}>
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[14px] font-bold"
                style={{ backgroundColor: "#E8EDE5", color: GREEN }}
                dir="ltr"
                aria-hidden="true"
              >
                {typeLabel.slice(0, 5)}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-[16px] truncate" style={{ color: GREEN }} dir="auto">
                  {displayName}
                </p>
                <p className="text-[14px] mt-0.5" style={{ color: MUTED }}>
                  התקבל בתאריך <span dir="ltr" className="tabular-nums">{new Date(file.created_at).toLocaleDateString("he-IL")}</span>
                </p>
              </div>

              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[14px] font-bold shrink-0"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                {status.label}
              </span>

              {file.file_url && (
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-11 h-11 rounded-full inline-flex items-center justify-center transition-colors hover:bg-[#EEF2EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#003D30]"
                  style={{ color: GREEN }}
                  aria-label={`הורדה או צפייה: ${displayName}`}
                >
                  <BrandIcon name="download" size={20} />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DocumentsTab;
