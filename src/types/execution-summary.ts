export type ExecutionSummaryStatus = 'draft' | 'in_progress' | 'partial' | 'completed' | 'archived';
export type ItemExecutionStatus = 'not_executed' | 'partially_executed' | 'fully_executed';

export interface ExecutionSummary {
  id: string;
  agentId: string;
  customerId: string;
  status: ExecutionSummaryStatus;
  summaryNumber: number;
  version: number;
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionSummaryItem {
  id: string;
  executionSummaryId: string;
  recommendationId: string;
  productId?: string;
  executedAsRecommended: boolean;
  recommendedTextSnapshot?: string;
  actualExecutionText?: string;
  executionStatus: ItemExecutionStatus;
  executionNotes?: string;
  executedAt?: string;
  executedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const SUMMARY_STATUS_LABELS: Record<ExecutionSummaryStatus, string> = {
  draft: 'טיוטה',
  in_progress: 'בתהליך',
  partial: 'חלקי',
  completed: 'הושלם',
  archived: 'בארכיון',
};

export const ITEM_STATUS_LABELS: Record<ItemExecutionStatus, string> = {
  not_executed: 'לא בוצע',
  partially_executed: 'בוצע חלקית',
  fully_executed: 'בוצע מלא',
};
