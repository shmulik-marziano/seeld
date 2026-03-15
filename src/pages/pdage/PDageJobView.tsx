import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Play, FileText, AlertTriangle, CheckCircle2, Clock, RefreshCw, Sparkles, MessageCircle, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { format } from 'date-fns';
import { PDageChatPanel } from '@/components/pdage/PDageChatPanel';
import { useIsMobile } from '@/hooks/use-mobile';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'ממתין', icon: Clock, color: 'bg-warning/10 text-warning' },
  processing: { label: 'בעיבוד', icon: Loader2, color: 'bg-info/10 text-info' },
  review: { label: 'לבדיקה', icon: RefreshCw, color: 'bg-accent/10 text-accent' },
  done: { label: 'הושלם', icon: CheckCircle2, color: 'bg-success/10 text-success' },
  failed: { label: 'נכשל', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
};

export default function PDageJobView() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { session } = useApp();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: job, isLoading } = useQuery({
    queryKey: ['pdage-job', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('correction_jobs')
        .select('*, pdage_customers(full_name, id_number), deficiency_categories(name), deficiency_bank(title, description)')
        .eq('id', jobId!)
        .single();
      return data;
    },
    enabled: !!jobId && !!session,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['pdage-job-activities', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('correction_activity_log')
        .select('*')
        .eq('job_id', jobId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!jobId && !!session,
  });

  const handleProcess = async () => {
    if (!job) return;
    setProcessing(true);
    try {
      // Call AI processing edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('process-correction', {
        body: { jobId: job.id },
      });

      if (fnError) {
        throw new Error(fnError.message || 'שגיאה בהפעלת עיבוד AI');
      }

      if (fnData?.error) {
        throw new Error(fnData.error);
      }

      toast.success('ניתוח AI הושלם בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['pdage-job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['pdage-job-activities', jobId] });
    } catch (err: any) {
      console.error('Processing error:', err);
      // Update job to failed
      await supabase.from('correction_jobs').update({
        status: 'failed',
        processing_notes: err.message || 'שגיאה בעיבוד AI',
      }).eq('id', job.id);

      await supabase.from('correction_activity_log').insert({
        job_id: job.id,
        action_type: 'processing_failed',
        title: 'עיבוד AI נכשל',
        details: err.message || 'שגיאה לא ידועה',
      });

      toast.error(err.message || 'שגיאה בעיבוד');
      queryClient.invalidateQueries({ queryKey: ['pdage-job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['pdage-job-activities', jobId] });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!job?.output_file_path) return;
    const { data } = await supabase.storage.from('correction-files').createSignedUrl(job.output_file_path, 300);
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

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">העבודה לא נמצאה</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/pdage')}>חזרה לדשבורד</Button>
      </div>
    );
  }

  const customer = job.pdage_customers as any;
  const category = job.deficiency_categories as any;
  const deficiency = job.deficiency_bank as any;
  const st = statusConfig[job.status] || statusConfig.pending;
  const StatusIcon = st.icon;

  return (
    <div className={`flex gap-6 ${chatOpen && !isMobile ? 'max-w-6xl' : 'max-w-3xl'} mx-auto transition-all`}>
      {/* Main content */}
      <div className={`${chatOpen && !isMobile ? 'flex-1 min-w-0' : 'w-full'} space-y-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">עבודת תיקון</h1>
            <p className="text-sm text-muted-foreground">{job.original_file_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={chatOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className="gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              {chatOpen ? 'סגור צ׳אט' : 'עוזר AI'}
            </Button>
            <Badge className={`${st.color} border-none text-sm py-1 px-3 gap-1.5`}>
              <StatusIcon className={`h-3.5 w-3.5 ${job.status === 'processing' ? 'animate-spin' : ''}`} />
              {st.label}
            </Badge>
          </div>
        </div>

        {/* Customer & file info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">לקוח</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{customer?.full_name || '—'}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">{customer?.id_number || '—'}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">קובץ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <p className="font-medium text-foreground truncate">{job.original_file_name}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{job.file_type.toUpperCase()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Deficiency info */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">חוסר שנבחר</CardTitle>
          </CardHeader>
          <CardContent>
            {category && <Badge variant="outline" className="mb-2">{category.name}</Badge>}
            {deficiency ? (
              <div>
                <p className="font-medium text-foreground">{deficiency.title}</p>
                {deficiency.description && <p className="text-sm text-muted-foreground">{deficiency.description}</p>}
              </div>
            ) : job.free_text_deficiency ? (
              <p className="text-foreground">{job.free_text_deficiency}</p>
            ) : (
              <p className="text-muted-foreground">לא נבחר חוסר</p>
            )}
          </CardContent>
        </Card>

        {/* Planned fix */}
        {job.planned_fix_summary && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">תיקון מתוכנן</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{job.planned_fix_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Processing notes / AI analysis */}
        {job.processing_notes && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                {job.status === 'done' && <Sparkles className="h-4 w-4 text-primary" />}
                {job.status === 'done' ? 'ניתוח AI' : 'הערות עיבוד'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                {job.processing_notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error message for failed jobs */}
        {job.status === 'failed' && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">העיבוד נכשל</p>
                <p className="text-sm text-muted-foreground">{job.processing_notes || 'אירעה שגיאה בעיבוד המסמך'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {(job.status === 'pending' || job.status === 'review') && (
            <Button onClick={() => navigate(`/app/pdage/job/${job.id}/room`)} size="lg" className="gap-2">
              <Pencil className="h-4 w-4" />
              כניסה לחדר ניתוח
            </Button>
          )}
          {job.status === 'done' && (
            <Button onClick={() => navigate(`/app/pdage/job/${job.id}/room`)} size="lg" variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              חדר ניתוח
            </Button>
          )}
          {job.status === 'done' && job.output_file_path && (
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              הורד קובץ מתוקן
            </Button>
          )}
        </div>

        {/* Activity log */}
        {activities.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">יומן פעולות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map(act => (
                  <div key={act.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{act.title}</p>
                      {act.details && <p className="text-muted-foreground text-xs">{act.details}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(act.created_at), 'dd/MM HH:mm')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat panel - Desktop: side panel, Mobile: overlay */}
      {chatOpen && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
              <PDageChatPanel jobId={jobId!} jobTitle={job.original_file_name} onClose={() => setChatOpen(false)} />
            </div>
          ) : (
            <div className="w-[400px] shrink-0 sticky top-0 h-[calc(100vh-3rem)]">
              <Card className="border-none shadow-sm h-full flex flex-col overflow-hidden">
                <PDageChatPanel jobId={jobId!} jobTitle={job.original_file_name} onClose={() => setChatOpen(false)} />
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
