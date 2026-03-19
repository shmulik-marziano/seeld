import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';

export default function PDageDeficiencyBank() {
  const { session } = useApp();

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['deficiency-categories-all'],
    queryFn: async () => {
      const { data } = await supabase.from('deficiency_categories').select('*').order('sort_order');
      return data || [];
    },
    enabled: !!session,
  });

  const { data: deficiencies = [], isLoading: loadingDefs } = useQuery({
    queryKey: ['deficiency-bank-all'],
    queryFn: async () => {
      const { data } = await supabase.from('deficiency_bank').select('*').eq('is_active', true);
      return data || [];
    },
    enabled: !!session,
  });

  if (loadingCats || loadingDefs) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">בנק חוסרים</h1>
        <p className="text-sm text-muted-foreground">כל סוגי הליקויים והחוסרים המוכרים במערכת</p>
      </div>

      <div className="space-y-4">
        {categories.map(cat => {
          const items = deficiencies.filter(d => d.category_id === cat.id);
          return (
            <Card key={cat.id} className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {cat.name}
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map(item => (
                    <div key={item.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
