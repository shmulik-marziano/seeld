
-- Create storage bucket for correction files
INSERT INTO storage.buckets (id, name, public) VALUES ('correction-files', 'correction-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for correction-files
CREATE POLICY "Users upload correction files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'correction-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own correction files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'correction-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own correction files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'correction-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Deficiency categories
CREATE TABLE public.deficiency_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deficiency_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read categories" ON public.deficiency_categories FOR SELECT TO authenticated USING (true);

-- Deficiency bank
CREATE TABLE public.deficiency_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.deficiency_categories(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deficiency_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read deficiencies" ON public.deficiency_bank FOR SELECT TO authenticated USING (true);

-- pDage customers (separate from main customers table)
CREATE TABLE public.pdage_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  id_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pdage_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pdage customers" ON public.pdage_customers FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Correction jobs
CREATE TABLE public.correction_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_id uuid REFERENCES public.pdage_customers(id) ON DELETE SET NULL,
  source_file_path text,
  output_file_path text,
  original_file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  deficiency_category_id uuid REFERENCES public.deficiency_categories(id),
  deficiency_bank_id uuid REFERENCES public.deficiency_bank(id),
  free_text_deficiency text,
  planned_fix_summary text,
  processing_notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.correction_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own correction jobs" ON public.correction_jobs FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Correction activity log
CREATE TABLE public.correction_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.correction_jobs(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  title text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.correction_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own job activities" ON public.correction_activity_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.correction_jobs WHERE id = job_id AND user_id = auth.uid()));
CREATE POLICY "Users insert own job activities" ON public.correction_activity_log FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.correction_jobs WHERE id = job_id AND user_id = auth.uid()));

-- Seed deficiency categories
INSERT INTO public.deficiency_categories (name, sort_order) VALUES
  ('חתימה חסרה', 1),
  ('תאריך לא עדכני', 2),
  ('פרטים חסרים', 3),
  ('סעיפים לא מסומנים', 4),
  ('חוסרי חיתום', 5),
  ('טופס שגוי / גרסה ישנה', 6);

-- Seed deficiency bank items
INSERT INTO public.deficiency_bank (category_id, title, description) VALUES
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=1), 'טופס לא חתום', 'הטופס חסר חתימה של אחד הצדדים'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=1), 'חתימת עמית חסרה', 'חתימת העמית/מבוטח חסרה על הטופס'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=1), 'חתימת סוכן חסרה', 'חתימת הסוכן חסרה על הטופס'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=2), 'תאריך חתימה ישן', 'תאריך החתימה על הטופס אינו עדכני'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=2), 'תאריך פג תוקף', 'תאריך התוקף של המסמך עבר'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=2), 'תאריך לא תקין', 'התאריך במסמך אינו תקין או חסר'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=3), 'הכר לקוח לא מלא', 'טופס הכר את הלקוח אינו מלא'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=3), 'פרטי משלם חריג', 'פרטי המשלם החריג חסרים או שגויים'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=3), 'מספר רישיון לא פעיל', 'מספר הרישיון אינו פעיל או חסר'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=3), 'פרטי לקוח חסרים', 'פרטי הלקוח בטופס חסרים או חלקיים'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=4), 'צ׳קבוקס חסר', 'סימון צ׳קבוקס חובה חסר בטופס'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=4), 'סימון פעיל/לא פעיל חסר', 'לא סומן האם השדה פעיל או לא'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=4), 'בחירה חובה לא סומנה', 'שדה בחירה חובה לא מולא'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=5), 'מסמך רפואי חסר', 'מסמך רפואי נדרש לא צורף'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=5), 'הצהרת בריאות חסרה', 'הצהרת בריאות חסרה או לא מלאה'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=5), 'טופס רפואי לא צורף', 'טופס רפואי נדרש לא צורף לבקשה'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=6), 'גרסת טופס לא עדכנית', 'הטופס שנשלח אינו בגרסה העדכנית'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=6), 'צריך להחליף טופס', 'יש להחליף את הטופס בטופס המתאים'),
  ((SELECT id FROM public.deficiency_categories WHERE sort_order=6), 'טופס לא מתאים לפעולה', 'הטופס שנשלח אינו מתאים לפעולה המבוקשת');

-- Updated_at triggers
CREATE TRIGGER update_pdage_customers_updated_at BEFORE UPDATE ON public.pdage_customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_correction_jobs_updated_at BEFORE UPDATE ON public.correction_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
