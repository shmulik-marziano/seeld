-- Create enum for insurance types
CREATE TYPE public.insurance_type AS ENUM (
  'vehicle', 'home', 'business', 'travel', 'dental', 
  'disability', 'foreign_workers', 'nursing', 'health', 
  'life', 'mortgage', 'critical_illness', 'personal_accidents', 
  'partners_risk', 'renters'
);

-- Create enum for pension product types
CREATE TYPE public.pension_product_type AS ENUM (
  'pension_fund', 'gemel', 'gemel_investment', 'child_savings',
  'training_fund', 'life_insurance_pension', 'employer_fund'
);

-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'in_progress', 'closed', 'cancelled');

-- Insurance enrollment leads table
CREATE TABLE public.insurance_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  id_number TEXT,
  
  -- Insurance details
  insurance_type insurance_type NOT NULL,
  
  -- Vehicle insurance specific
  vehicle_type TEXT,
  vehicle_year INTEGER,
  vehicle_manufacturer TEXT,
  vehicle_model TEXT,
  license_plate TEXT,
  
  -- Home/Renters insurance specific
  property_type TEXT,
  property_size_sqm INTEGER,
  property_value DECIMAL,
  property_address TEXT,
  
  -- Business insurance specific
  business_type TEXT,
  business_employees INTEGER,
  annual_revenue DECIMAL,
  
  -- Health insurance specific
  birth_date DATE,
  smoker BOOLEAN,
  pre_existing_conditions TEXT,
  
  -- Travel insurance specific
  destination TEXT,
  travel_start_date DATE,
  travel_end_date DATE,
  travelers_count INTEGER,
  
  -- General
  current_insurer TEXT,
  additional_notes TEXT,
  preferred_contact_time TEXT,
  
  -- Status tracking
  status lead_status NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  notes TEXT
);

-- Pension analysis leads table
CREATE TABLE public.pension_analysis_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  id_number TEXT,
  birth_date DATE,
  
  -- Employment info
  employment_status TEXT, -- employee, self_employed, both, unemployed
  monthly_salary DECIMAL,
  employer_name TEXT,
  employment_start_date DATE,
  
  -- Existing pension products (JSONB array)
  existing_products JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ type: 'pension_fund', company: 'מנורה', product_name: 'מנורה מבטחים', monthly_deposit: 1500, balance: 150000 }]
  
  -- Analysis preferences
  retirement_age INTEGER,
  desired_monthly_pension DECIMAL,
  risk_tolerance TEXT, -- low, medium, high
  
  -- Goals
  primary_goals TEXT[], -- retirement, disability_coverage, survivors_coverage, savings
  
  -- Additional info
  spouse_employed BOOLEAN,
  children_count INTEGER,
  additional_notes TEXT,
  preferred_contact_time TEXT,
  
  -- Status tracking
  status lead_status NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.insurance_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pension_analysis_leads ENABLE ROW LEVEL SECURITY;

-- RLS policies - anyone can insert (lead capture)
CREATE POLICY "Anyone can submit insurance leads"
ON public.insurance_leads
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can submit pension analysis leads"
ON public.pension_analysis_leads
FOR INSERT
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_insurance_leads_updated_at
BEFORE UPDATE ON public.insurance_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pension_leads_updated_at
BEFORE UPDATE ON public.pension_analysis_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();