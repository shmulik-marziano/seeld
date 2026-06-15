import { useEffect, useState } from "react";
import { siteSupabase } from "@/integrations/supabase/site-client";
import { FolderOpen, Loader2, FileText, Calendar, FileCheck, Download } from "lucide-react";
import { toast } from "sonner";

type SourceFile = {
  id: string;
  file_name: string | null;
  file_type: string | null;
  status: string | null;
  created_at: string;
  file_url: string | null;
  original_name: string | null;
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  uploaded: { label: "הועלה", bg: "#dbeafe", text: "#1e40af" },
  processed: { label: "עובד", bg: "#d1fae5", text: "#065f46" },
  processing: { label: "בעיבוד", bg: "#fef3c7", text: "#92400e" },
  error: { label: "שגיאה", bg: "#fee2e2", text: "#991b1b" },
  pending: { label: "ממתין", bg: "#f3f4f6", text: "#374151" },
};

const fileTypeIcons: Record<string, string> = {
  pdf: "PDF",
  image: "IMG",
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
      setFiles((data || []) as unknown as SourceFile[]);
    } catch {
      toast.error("שגיאה בטעינת המסמכים");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#1a1a4b" }} />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#ede9fe" }}>
          <FolderOpen className="w-8 h-8" style={{ color: "#6366f1" }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a4b" }}>אין מסמכים עדיין</h3>
        <p className="text-gray-500">כשהסוכן שלך יעלה מסמכים לתיק, הם יופיעו כאן.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold" style={{ color: "#1a1a4b" }}>המסמכים שלי</h2>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {files.map((file, index) => {
          const status = statusConfig[file.status || "pending"] || statusConfig.pending;
          const displayName = file.original_name || file.file_name || "מסמך";
          const typeLabel = fileTypeIcons[file.file_type || ""] || file.file_type?.toUpperCase() || "FILE";

          return (
            <div
              key={file.id}
              className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                index < files.length - 1 ? "border-b" : ""
              }`}
            >
              {/* File type icon */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: "#1a1a4b" }}
              >
                {typeLabel.slice(0, 3)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: "#1a1a4b" }}>
                  {displayName}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(file.created_at).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>

              {/* Download button */}
              {file.file_url && (
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors text-[#d6157e] hover:text-[#1a1a4b]"
                  title="הורד / צפה"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              {/* Status badge */}
              <span
                className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium shrink-0"
                style={{ background: status.bg, color: status.text }}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsTab;
