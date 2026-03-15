-- 1. Add agency_id to all data tables
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.recommendation_summaries ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.client_access_links ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.source_files ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.execution_summaries ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);
ALTER TABLE public.reasoning_bank ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- 2. Create trigger function to auto-set agency_id from agent_id
CREATE OR REPLACE FUNCTION public.set_agency_id_from_agent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.agency_id IS NULL AND NEW.agent_id IS NOT NULL THEN
    NEW.agency_id := (SELECT agency_id FROM public.profiles WHERE user_id = NEW.agent_id LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Attach triggers to all data tables
CREATE TRIGGER set_agency_id_customers BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_products BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_recommendations BEFORE INSERT ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_recommendation_summaries BEFORE INSERT ON public.recommendation_summaries FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_client_access_links BEFORE INSERT ON public.client_access_links FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_source_files BEFORE INSERT ON public.source_files FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_activity_log BEFORE INSERT ON public.activity_log FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_execution_summaries BEFORE INSERT ON public.execution_summaries FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();
CREATE TRIGGER set_agency_id_reasoning_bank BEFORE INSERT ON public.reasoning_bank FOR EACH ROW EXECUTE FUNCTION public.set_agency_id_from_agent();

-- 4. Backfill existing data
UPDATE public.customers SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.products SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.recommendations SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.recommendation_summaries SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.client_access_links SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.source_files SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.activity_log SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.execution_summaries SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;
UPDATE public.reasoning_bank SET agency_id = public.get_user_agency_id(agent_id) WHERE agency_id IS NULL AND agent_id IS NOT NULL;