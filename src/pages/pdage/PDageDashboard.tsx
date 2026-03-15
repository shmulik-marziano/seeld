import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Clock, CheckCircle2, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'ממתין', color: 'text-warning' },
  processing: { label: 'בעיבוד', color: 'text-info' },
  review: { label: 'לבדיקה', color: 'text-accent' },
  done: { label: 'הושלם', color: 'text-success' },
  failed: { label: 'נכשל', color: 'text-destructive' },
};

export default function PDageDashboard() {
  const navigate = useNavigate();
  const { session } = useApp();

  const { data: jobs = [] } = useQuery({
    queryKey: ['pdage-jobs-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('correction_jobs')
        .select('*, pdage_customers(full_name, id_number)')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!session,
  });

  const openCount = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length;
  const reviewCount = jobs.filter(j => j.status === 'review').length;
  const doneCount = jobs.filter(j => j.status === 'done').length;

  const stats = [
    { label: 'עבודות פתוחות', value: openCount, icon: Clock, color: 'text-warning' },
    { label: 'ממתינות לבדיקה', value: reviewCount, icon: AlertCircle, color: 'text-accent' },
    { label: 'הושלמו', value: doneCount, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">pDage</h1>
          <p className="text-sm text-muted-foreground">ליקויים וחוסרים — כלי חכם לעריכת מסמכים</p>
        </div>
        <Button onClick={() => navigate('/app/pdage/upload')} size="lg" className="gap-2">
          <Upload className="h-4 w-4" />
          העלאת מסמך חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-none shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">עבודות אחרונות</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/pdage/history')} className="gap-1 text-muted-foreground">
            הכל
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">אין עבודות עדיין. העלה מסמך חדש כדי להתחיל.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/app/pdage/upload')}>
                העלאת מסמך
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => {
              const st = statusMap[job.status] || statusMap.pending;
              const customer = job.pdage_customers as any;
              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer border-none shadow-sm" onClick={() => navigate(`/pdage/job/${job.id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{customer?.full_name || 'ללא לקוח'}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.original_file_name}</p>
                    </div>
                    <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(job.created_at), 'dd/MM/yy')}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
