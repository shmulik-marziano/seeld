
-- Import batches table
CREATE TABLE public.import_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL,
  agency_id uuid REFERENCES public.agencies(id),
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'processing',
  total_items integer NOT NULL DEFAULT 0,
  succeeded integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  needs_review integer NOT NULL DEFAULT 0,
  import_mode text DEFAULT 'create_and_update',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view import batches" ON public.import_batches FOR SELECT TO authenticated USING (agency_id = get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can insert import batches" ON public.import_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agency members can update import batches" ON public.import_batches FOR UPDATE TO authenticated USING (agency_id = get_user_agency_id(auth.uid()));
CREATE POLICY "Agency members can delete import batches" ON public.import_batches FOR DELETE TO authenticated USING (agency_id = get_user_agency_id(auth.uid()));

CREATE TRIGGER set_agency_id_import_batches BEFORE INSERT ON public.import_batches FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER update_updated_at_import_batches BEFORE UPDATE ON public.import_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Import batch items table
CREATE TABLE public.import_batch_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  row_number integer,
  customer_id_number text,
  customer_name text,
  action text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  customer_id uuid REFERENCES public.customers(id),
  details jsonb DEFAULT '{}',
  source_file_name text,
  products_created integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.import_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage import items" ON public.import_batch_items FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.import_batches b WHERE b.id = import_batch_items.batch_id AND b.agency_id = get_user_agency_id(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.import_batches b WHERE b.id = import_batch_items.batch_id AND b.agency_id = get_user_agency_id(auth.uid())));
