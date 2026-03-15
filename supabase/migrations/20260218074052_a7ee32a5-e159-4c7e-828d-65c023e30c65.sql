-- Create onboarding submissions table for NOA bot
CREATE TABLE public.onboarding_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new',
  
  -- Section A: Identification
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE,
  calculated_age INTEGER,
  email TEXT,
  id_number TEXT,
  id_issue_date DATE,
  
  -- Section C: Address
  city TEXT,
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  
  -- Section D: Profile
  gender TEXT,
  marital_status TEXT,
  children_count INTEGER,
  
  -- Section E: Employment
  employment_status TEXT,
  profession TEXT,
  employer_name TEXT,
  work_seniority TEXT,
  annual_income NUMERIC,
  additional_income TEXT,
  
  -- Section F: Health
  smoker BOOLEAN,
  cigarettes_per_day INTEGER,
  health_fund TEXT,
  supplemental_insurance TEXT,
  height_cm INTEGER,
  weight_kg NUMERIC,
  bmi NUMERIC,
  
  -- Section G: Additional
  phone_secondary TEXT,
  preferred_contact TEXT[],
  children_ages TEXT,
  birth_country TEXT,
  immigration_year INTEGER,
  additional_citizenship TEXT,
  
  -- Section H: Spouse
  has_spouse BOOLEAN DEFAULT false,
  spouse_name TEXT,
  spouse_birth_date DATE,
  spouse_phone TEXT,
  spouse_email TEXT,
  spouse_health_fund TEXT,
  spouse_supplemental TEXT,
  spouse_employment TEXT,
  spouse_profession TEXT,
  
  -- Section I: Goals
  referral_reason TEXT,
  interests TEXT[],
  priority_preference TEXT,
  monthly_budget NUMERIC,
  
  -- Section J: Consent
  data_consent BOOLEAN DEFAULT false,
  insurance_report_consent BOOLEAN DEFAULT false,
  summary_delivery TEXT[],
  
  -- Section K: Bank
  bank_name TEXT,
  bank_branch TEXT,
  bank_account TEXT,
  account_type TEXT,
  account_owner TEXT,
  co_owner_name TEXT,
  bank_notes TEXT,
  
  -- Full conversation JSON
  conversation_data JSONB,
  form_data JSONB
);

-- Enable RLS
ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public onboarding form)
CREATE POLICY "Anyone can submit onboarding"
ON public.onboarding_submissions
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_submissions_updated_at
BEFORE UPDATE ON public.onboarding_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();