import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PDageDeficiency() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { session } = useApp();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDeficiencyId, setSelectedDeficiencyId] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['deficiency-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('deficiency_categories').select('*').order('sort_order');
      return data || [];
    },
    enabled: !!session,
  });

  const { data: deficiencies = [] } = useQuery({
    queryKey: ['deficiency-bank', selectedCategoryId],
    queryFn: async () => {
      const { data } = await supabase
        .from('deficiency_bank')
        .select('*')
        .eq('category_id', selectedCategoryId!)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!selectedCategoryId,
  });

  const handleContinue = async () => {
    if (!selectedDeficiencyId && !freeText.trim()) {
      toast.error('יש לבחור חוסר או לכתוב תיאור חופשי');
      return;
    }

    setSaving(true);
    try {
      const selectedDef = deficiencies.find(d => d.id === selectedDeficiencyId);
      const plannedFix = selectedDef
        ? `תיקון: ${selectedDef.title} — ${selectedDef.description || ''}`
        : `תיקון לפי תיאור: ${freeText}`;

      await supabase.from('correction_jobs').update({
        deficiency_category_id: selectedCategoryId,
        deficiency_bank_id: selectedDeficiencyId,
        free_text_deficiency: freeText.trim() || null,
        planned_fix_summary: plannedFix,
        status: 'review',
      }).eq('id', jobId!);

      await supabase.from('correction_activity_log').insert({
        job_id: jobId!,
        action_type: 'deficiency_selected',
        title: 'חוסר נבחר',
        details: selectedDef ? `נבחר: ${selectedDef.title}` : `טקסט חופשי: ${freeText}`,
      });

      navigate(`/app/pdage/job/${jobId}/room`);
    } catch (err: any) {
      toast.error('שגיאה בשמירה');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">בחירת חוסר</h1>
        <p className="text-sm text-muted-foreground">בחר את סוג החוסר שנמצא במסמך</p>
      </div>

      {/* Categories */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">קטגוריה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge
                key={cat.id}
                variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                className="cursor-pointer text-sm py-2 px-4 transition-all hover:shadow-sm"
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedDeficiencyId(null);
                }}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deficiency items */}
      {selectedCategoryId && deficiencies.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">דוגמאות חוסר</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deficiencies.map(def => (
                <button
                  key={def.id}
                  onClick={() => setSelectedDeficiencyId(def.id)}
                  className={`w-full text-right p-3 rounded-lg border transition-all ${
                    selectedDeficiencyId === def.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium text-sm text-foreground">{def.title}</p>
                  {def.description && <p className="text-xs text-muted-foreground mt-0.5">{def.description}</p>}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free text */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">או תיאור חופשי</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="תאר את החוסר שנמצא במסמך..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={saving || (!selectedDeficiencyId && !freeText.trim())} size="lg" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronLeft className="h-4 w-4" />}
          המשך לתצוגה מקדימה
        </Button>
      </div>
    </div>
  );
}
