ALTER TABLE public.correction_jobs ADD COLUMN IF NOT EXISTS correction_fields jsonb DEFAULT '{}';
ALTER TABLE public.correction_jobs ADD COLUMN IF NOT EXISTS validation_score integer;
ALTER TABLE public.correction_jobs ADD COLUMN IF NOT EXISTS validation_warnings jsonb;