
-- Create execution_summaries table
CREATE TABLE public.execution_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  summary_number INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  general_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create execution_summary_items table
CREATE TABLE public.execution_summary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_summary_id UUID NOT NULL REFERENCES public.execution_summaries(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  executed_as_recommended BOOLEAN NOT NULL DEFAULT false,
  recommended_text_snapshot TEXT,
  actual_execution_text TEXT,
  execution_status TEXT NOT NULL DEFAULT 'not_executed',
  execution_notes TEXT,
  executed_at DATE,
  executed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.execution_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_summary_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for execution_summaries
CREATE POLICY "Agents can manage their execution summaries"
  ON public.execution_summaries
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- RLS policies for execution_summary_items (join through parent summary)
CREATE POLICY "Agents can manage their execution summary items"
  ON public.execution_summary_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.execution_summaries es
    WHERE es.id = execution_summary_items.execution_summary_id
    AND es.agent_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.execution_summaries es
    WHERE es.id = execution_summary_items.execution_summary_id
    AND es.agent_id = auth.uid()
  ));

-- Add updated_at trigger
CREATE TRIGGER update_execution_summaries_updated_at
  BEFORE UPDATE ON public.execution_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_execution_summary_items_updated_at
  BEFORE UPDATE ON public.execution_summary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
