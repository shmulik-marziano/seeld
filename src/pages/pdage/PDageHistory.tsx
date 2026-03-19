import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'ממתין', variant: 'outline' },
  processing: { label: 'בעיבוד', variant: 'secondary' },
  review: { label: 'לבדיקה', variant: 'default' },
  done: { label: 'הושלם', variant: 'default' },
  failed: { label: 'נכשל', variant: 'destructive' },
};

export default function PDageHistory() {
  const navigate = useNavigate();
  const { session } = useApp();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['pdage-jobs-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('correction_jobs')
        .select('*, pdage_customers(full_name, id_number), deficiency_categories(name), deficiency_bank(title)')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session,
  });

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from('correction-files').createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      toast.error('שגיאה ביצירת קישור הורדה');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">היסטוריית תיקונים</h1>
        <p className="text-sm text-muted-foreground">כל עבודות התיקון שביצעת</p>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">אין עבודות עדיין</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => {
            const customer = job.pdage_customers as any;
            const category = job.deficiency_categories as any;
            const deficiency = job.deficiency_bank as any;
            const st = statusMap[job.status] || statusMap.pending;

            return (
              <Card key={job.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-foreground">{customer?.full_name || 'ללא לקוח'}</p>
                        {customer?.id_number && (
                          <span className="text-xs text-muted-foreground" dir="ltr">{customer.id_number}</span>
                        )}
                        <Badge variant={st.variant} className="shrink-0 sm:hidden">{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{job.original_file_name}</span>
                        {category && <span className="shrink-0">· {category.name}</span>}
                        {deficiency && <span className="shrink-0">· {deficiency.title}</span>}
                      </div>
                    </div>

                    <Badge variant={st.variant} className="shrink-0 hidden sm:inline-flex">{st.label}</Badge>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                      <div className="text-xs text-muted-foreground text-left shrink-0">
                        <p>{format(new Date(job.created_at), 'dd/MM/yy')}</p>
                        {job.updated_at !== job.created_at && (
                          <p className="text-muted-foreground/60">{format(new Date(job.updated_at), 'dd/MM HH:mm')}</p>
                        )}
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/pdage/job/${job.id}`)} className="min-h-[40px]">
                          פתח
                        </Button>
                        {job.status === 'done' && job.output_file_path && (
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(job.output_file_path!)} className="min-h-[40px] min-w-[40px]">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
