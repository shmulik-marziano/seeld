import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { ExecutionSummary, ExecutionSummaryItem, ExecutionSummaryStatus, ItemExecutionStatus } from '@/types/execution-summary';

function mapSummary(row: any): ExecutionSummary {
  return {
    id: row.id,
    agentId: row.agent_id,
    customerId: row.customer_id,
    status: row.status,
    summaryNumber: row.summary_number,
    version: row.version,
    generalNotes: row.general_notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: any): ExecutionSummaryItem {
  return {
    id: row.id,
    executionSummaryId: row.execution_summary_id,
    recommendationId: row.recommendation_id,
    productId: row.product_id || undefined,
    executedAsRecommended: row.executed_as_recommended,
    recommendedTextSnapshot: row.recommended_text_snapshot || undefined,
    actualExecutionText: row.actual_execution_text || undefined,
    executionStatus: row.execution_status,
    executionNotes: row.execution_notes || undefined,
    executedAt: row.executed_at || undefined,
    executedBy: row.executed_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useExecutionSummaries(customerId?: string) {
  const { session, logActivity, updateCustomer, updateRecommendation, data } = useApp();
  const [summaries, setSummaries] = useState<ExecutionSummary[]>([]);
  const [items, setItems] = useState<ExecutionSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const agentId = session?.user?.id;

  const fetchSummaries = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    let query = supabase.from('execution_summaries').select('*').order('created_at', { ascending: false });
    if (customerId) query = query.eq('customer_id', customerId);
    const { data: rows } = await query;
    setSummaries((rows || []).map(mapSummary));

    // Fetch items for these summaries
    if (rows && rows.length > 0) {
      const summaryIds = rows.map(r => r.id);
      const { data: itemRows } = await supabase
        .from('execution_summary_items')
        .select('*')
        .in('execution_summary_id', summaryIds)
        .order('created_at', { ascending: true });
      setItems((itemRows || []).map(mapItem));
    } else {
      setItems([]);
    }
    setLoading(false);
  }, [agentId, customerId]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const createSummary = useCallback(async (custId: string): Promise<ExecutionSummary> => {
    if (!agentId) throw new Error('Not authenticated');

    // Calculate summary number
    const existing = summaries.filter(s => s.customerId === custId);
    const summaryNumber = existing.length + 1;

    const { data: row, error } = await supabase.from('execution_summaries').insert({
      agent_id: agentId,
      customer_id: custId,
      status: 'draft',
      summary_number: summaryNumber,
      version: 1,
    } as any).select().single();
    if (error) throw error;

    const summary = mapSummary(row);

    // Get relevant recommendations (approved / in execution / completed)
    const relevantRecs = data.recommendations.filter(
      r => r.customerId === custId && ['מאשר', 'עבר לביצוע', 'בוצע'].includes(r.decisionStatus)
    );

    // Create items for each recommendation
    const itemInserts = relevantRecs.map(rec => {
      const product = data.products.find(p => p.id === rec.linkedProductId);
      return {
        execution_summary_id: summary.id,
        recommendation_id: rec.id,
        product_id: rec.linkedProductId || null,
        executed_as_recommended: false,
        recommended_text_snapshot: `${rec.title}\n${rec.rationale}${rec.currentState ? `\nמצב קיים: ${rec.currentState}` : ''}${rec.improvement ? `\nמה משתפר: ${rec.improvement}` : ''}`,
        actual_execution_text: null,
        execution_status: rec.decisionStatus === 'בוצע' ? 'fully_executed' : 'not_executed',
        execution_notes: null,
        executed_at: null,
        executed_by: null,
      };
    });

    if (itemInserts.length > 0) {
      const { data: insertedItems } = await supabase
        .from('execution_summary_items')
        .insert(itemInserts as any)
        .select();
      if (insertedItems) {
        setItems(prev => [...prev, ...insertedItems.map(mapItem)]);
      }
    }

    setSummaries(prev => [summary, ...prev]);

    // Update customer status
    await updateCustomer(custId, { status: 'בביצוע' as any });
    await logActivity('סיכום ביצועים נוצר', `סיכום #${summaryNumber}`, 'הצלחה', { customerId: custId });

    return summary;
  }, [agentId, summaries, data.recommendations, data.products, logActivity, updateCustomer]);

  const updateSummary = useCallback(async (id: string, updates: Partial<{ status: ExecutionSummaryStatus; generalNotes: string }>) => {
    const dbData: Record<string, any> = {};
    if (updates.status !== undefined) dbData.status = updates.status;
    if (updates.generalNotes !== undefined) dbData.general_notes = updates.generalNotes || null;

    const { data: row, error } = await supabase.from('execution_summaries').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    const updated = mapSummary(row);
    setSummaries(prev => prev.map(s => s.id === id ? updated : s));

    await logActivity('סיכום ביצועים עודכן', `סטטוס: ${updates.status || ''}`, 'מידע', { customerId: updated.customerId });
    return updated;
  }, [logActivity]);

  const updateItem = useCallback(async (id: string, updates: Partial<{
    executedAsRecommended: boolean;
    actualExecutionText: string;
    executionStatus: ItemExecutionStatus;
    executionNotes: string;
    executedAt: string;
    executedBy: string;
  }>) => {
    const dbData: Record<string, any> = {};
    if (updates.executedAsRecommended !== undefined) dbData.executed_as_recommended = updates.executedAsRecommended;
    if (updates.actualExecutionText !== undefined) dbData.actual_execution_text = updates.actualExecutionText || null;
    if (updates.executionStatus !== undefined) dbData.execution_status = updates.executionStatus;
    if (updates.executionNotes !== undefined) dbData.execution_notes = updates.executionNotes || null;
    if (updates.executedAt !== undefined) dbData.executed_at = updates.executedAt || null;
    if (updates.executedBy !== undefined) dbData.executed_by = updates.executedBy || null;

    const { data: row, error } = await supabase.from('execution_summary_items').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    const updated = mapItem(row);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  }, []);

  const completeSummary = useCallback(async (summaryId: string, custId: string) => {
    const summaryItems = items.filter(i => i.executionSummaryId === summaryId);
    const allFullyExecuted = summaryItems.every(i => i.executionStatus === 'fully_executed');
    const someExecuted = summaryItems.some(i => i.executionStatus !== 'not_executed');

    // Update each recommendation's decisionStatus based on its execution item
    for (const si of summaryItems) {
      if (si.executionStatus === 'fully_executed') {
        await updateRecommendation(si.recommendationId, {
          decisionStatus: 'בוצע',
          executionStatus: 'הושלם',
        });
      } else if (si.executionStatus === 'partially_executed') {
        await updateRecommendation(si.recommendationId, {
          decisionStatus: 'עבר לביצוע',
        });
      }
    }

    let summaryStatus: ExecutionSummaryStatus;
    let customerStatus: string;

    if (allFullyExecuted) {
      summaryStatus = 'completed';
      customerStatus = 'הושלם';
    } else if (someExecuted) {
      summaryStatus = 'partial';
      customerStatus = 'בביצוע';
    } else {
      summaryStatus = 'draft';
      customerStatus = 'בביצוע';
    }

    await updateSummary(summaryId, { status: summaryStatus });
    await updateCustomer(custId, { status: customerStatus as any });
    await logActivity(
      allFullyExecuted ? 'סיכום ביצועים הושלם' : 'סיכום ביצועים נשמר',
      `סטטוס: ${summaryStatus}`,
      allFullyExecuted ? 'הצלחה' : 'מידע',
      { customerId: custId }
    );
  }, [items, updateSummary, updateCustomer, updateRecommendation, logActivity]);

  return {
    summaries,
    items,
    loading,
    createSummary,
    updateSummary,
    updateItem,
    completeSummary,
    refreshSummaries: fetchSummaries,
  };
}
