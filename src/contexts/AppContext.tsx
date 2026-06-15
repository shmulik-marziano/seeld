import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppData, Customer, Product, Recommendation, ActivityEntry, EventLevel, SourceFile, IdType, Gender, MaritalStatus, CustomerStatus, ProductCategory, ProductPhase, ActionType, DecisionStatus, ExecutionStatus, SourceFileType, AnalysisStatus } from '../types';
import type { Tables } from '@/integrations/supabase/types';
import { Session } from '@supabase/supabase-js';

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

function calculateBMI(h?: number, w?: number): number | undefined {
  if (!h || !w) return undefined;
  return +(w / ((h / 100) ** 2)).toFixed(1);
}

// Map DB row to frontend type
function mapCustomer(row: Tables<'customers'>): Customer {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name || `${row.first_name} ${row.last_name}`.trim(),
    idType: (row.id_type || 'תעודת זהות') as IdType,
    idNumber: row.id_number,
    birthDate: row.birth_date || '',
    age: row.birth_date ? calculateAge(row.birth_date) : 0,
    gender: (row.gender || 'זכר') as Gender,
    maritalStatus: (row.marital_status || 'רווק/ה') as MaritalStatus,
    mobilePhone: row.mobile_phone,
    otherPhone: row.other_phone || undefined,
    email: row.email || undefined,
    city: row.city || undefined,
    street: row.street || undefined,
    houseNumber: row.house_number || undefined,
    apartmentNumber: row.apartment_number || undefined,
    poBox: row.po_box || undefined,
    zipCode: row.zip_code || undefined,
    country: row.country || undefined,
    source: row.source || undefined,
    internalNotes: row.internal_notes || undefined,
    status: (row.status || 'חדש') as CustomerStatus,
    nextFollowUp: row.next_follow_up || undefined,
    employmentStatus: row.employment_status || undefined,
    occupation: row.occupation || undefined,
    profession: row.profession || undefined,
    position: row.position || undefined,
    monthlyIncome: row.monthly_income ? Number(row.monthly_income) : undefined,
    annualIncome: row.annual_income ? Number(row.annual_income) : undefined,
    bank: row.bank || undefined,
    branch: row.branch || undefined,
    accountNumber: row.account_number || undefined,
    accountType: row.account_type || undefined,
    taxResident: row.tax_resident ?? undefined,
    usCitizen: row.us_citizen ?? undefined,
    birthCountry: row.birth_country || undefined,
    idIssueDate: row.id_issue_date || undefined,
    isConfidential: row.is_confidential ?? undefined,
    healthFund: row.health_fund || undefined,
    supplementaryInsurance: row.supplementary_insurance || undefined,
    height: row.height ? Number(row.height) : undefined,
    weight: row.weight ? Number(row.weight) : undefined,
    bmi: row.bmi ? Number(row.bmi) : undefined,
    isSmoker: row.is_smoker ?? undefined,
    cigarettesPerDay: row.cigarettes_per_day ?? undefined,
    wasSmoker: row.was_smoker ?? undefined,
    quitYear: row.quit_year ?? undefined,
    medicalAdviceToQuit: row.medical_advice_to_quit ?? undefined,
    medicalDetails: row.medical_details || undefined,
    medications: row.medications || undefined,
    hospitalizations: row.hospitalizations || undefined,
    surgeries: row.surgeries || undefined,
    preExistingConditions: row.pre_existing_conditions || undefined,
    dangerousHobbies: row.dangerous_hobbies || undefined,
    spouseName: row.spouse_name || undefined,
    numberOfChildren: row.number_of_children ?? undefined,
    beneficiaries: row.beneficiaries || undefined,
    extendedData: (row.extended_data && typeof row.extended_data === 'object') ? row.extended_data : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProduct(row: Tables<'products'>): Product {
  return {
    id: row.id, customerId: row.customer_id, category: row.category as ProductCategory,
    company: row.company || '', productType: row.product_type || '',
    subDescription: row.sub_description || undefined,
    policyNumber: row.policy_number || undefined,
    productNumber: row.product_number || undefined,
    isActive: row.is_active ?? true, phase: (row.phase || 'פעיל') as ProductPhase,
    monthlyPremium: row.monthly_premium ? Number(row.monthly_premium) : undefined,
    monthlyDeposit: row.monthly_deposit ? Number(row.monthly_deposit) : undefined,
    accumulation: row.accumulation ? Number(row.accumulation) : undefined,
    track: row.track || undefined,
    investmentTrack: row.investment_track || undefined,
    investmentTrackCustom: row.investment_track_custom || undefined,
    preferredRiskLevel: row.preferred_risk_level || undefined,
    managementFeeDeposit: row.management_fee_deposit ? Number(row.management_fee_deposit) : undefined,
    managementFeeAccumulation: row.management_fee_accumulation ? Number(row.management_fee_accumulation) : undefined,
    returnYear: row.return_year ? Number(row.return_year) : undefined,
    return3Years: row.return_3_years ? Number(row.return_3_years) : undefined,
    notes: row.notes || undefined,
    manuallyCompleted: row.manually_completed ?? false,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapRecommendation(row: Tables<'recommendations'>): Recommendation {
  return {
    id: row.id, customerId: row.customer_id,
    linkedProductId: row.linked_product_id || undefined,
    title: row.title, rationale: row.rationale,
    currentState: row.current_state || undefined,
    basedOn: row.based_on || undefined,
    improvement: row.improvement || undefined,
    actionType: (row.action_type || 'הצטרפות בלבד') as ActionType,
    requiresQuote: row.requires_quote ?? false,
    decisionStatus: (row.decision_status || 'טיוטה') as DecisionStatus,
    executionStatus: (row.execution_status || undefined) as ExecutionStatus | undefined,
    nextStep: row.next_step || undefined,
    missingForExecution: row.missing_for_execution || undefined,
    executionNote: row.execution_note || undefined,
    customerNote: row.customer_note || undefined,
    recommendedInvestmentTrack: row.recommended_investment_track || undefined,
    recommendedInvestmentTrackCustom: row.recommended_investment_track_custom || undefined,
    recommendedRiskLevel: row.recommended_risk_level || undefined,
    urgency: row.urgency || undefined,
    problemGap: row.problem_gap || undefined,
    recommendedCompany: row.recommended_company || undefined,
    recommendedTrack: row.recommended_track || undefined,
    costBefore: row.cost_before != null ? Number(row.cost_before) : undefined,
    costAfter: row.cost_after != null ? Number(row.cost_after) : undefined,
    recommendationType: row.recommendation_type || undefined,
    productSnapshot: row.product_snapshot || undefined,
    advantages: row.advantages || undefined,
    disadvantages: row.disadvantages || undefined,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : undefined,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapSourceFile(row: Tables<'source_files'>): SourceFile {
  return {
    id: row.id, customerId: row.customer_id,
    type: (row.type || 'מסלקה') as SourceFileType, fileName: row.file_name,
    uploadedAt: row.uploaded_at, analysisStatus: (row.analysis_status || 'ממתין') as AnalysisStatus,
  };
}

function mapActivity(row: Tables<'activity_log'>): ActivityEntry {
  return {
    id: row.id, timestamp: row.created_at,
    title: row.title, detail: row.detail || undefined,
    level: (row.level || 'מידע') as EventLevel,
    customerId: row.customer_id || undefined,
    productId: row.product_id || undefined,
    recommendationId: row.recommendation_id || undefined,
  };
}

// Map frontend Customer to DB insert/update
function customerToDb(input: Partial<Customer>, agentId?: string): Record<string, unknown> {
  const m: Record<string, unknown> = {};
  if (agentId) m.agent_id = agentId;
  if (input.firstName !== undefined) m.first_name = input.firstName;
  if (input.lastName !== undefined) m.last_name = input.lastName;
  if (input.idType !== undefined) m.id_type = input.idType;
  if (input.idNumber !== undefined) m.id_number = input.idNumber;
  if (input.birthDate !== undefined) m.birth_date = input.birthDate || null;
  if (input.gender !== undefined) m.gender = input.gender;
  if (input.maritalStatus !== undefined) m.marital_status = input.maritalStatus;
  if (input.mobilePhone !== undefined) m.mobile_phone = input.mobilePhone;
  if (input.otherPhone !== undefined) m.other_phone = input.otherPhone || null;
  if (input.email !== undefined) m.email = input.email || null;
  if (input.city !== undefined) m.city = input.city || null;
  if (input.street !== undefined) m.street = input.street || null;
  if (input.houseNumber !== undefined) m.house_number = input.houseNumber || null;
  if (input.apartmentNumber !== undefined) m.apartment_number = input.apartmentNumber || null;
  if (input.poBox !== undefined) m.po_box = input.poBox || null;
  if (input.zipCode !== undefined) m.zip_code = input.zipCode || null;
  if (input.country !== undefined) m.country = input.country || null;
  if (input.source !== undefined) m.source = input.source || null;
  if (input.internalNotes !== undefined) m.internal_notes = input.internalNotes || null;
  if (input.status !== undefined) m.status = input.status;
  if (input.nextFollowUp !== undefined) m.next_follow_up = input.nextFollowUp || null;
  if (input.employmentStatus !== undefined) m.employment_status = input.employmentStatus || null;
  if (input.occupation !== undefined) m.occupation = input.occupation || null;
  if (input.profession !== undefined) m.profession = input.profession || null;
  if (input.position !== undefined) m.position = input.position || null;
  if (input.monthlyIncome !== undefined) m.monthly_income = input.monthlyIncome ?? null;
  if (input.annualIncome !== undefined) m.annual_income = input.annualIncome ?? null;
  if (input.bank !== undefined) m.bank = input.bank || null;
  if (input.branch !== undefined) m.branch = input.branch || null;
  if (input.accountNumber !== undefined) m.account_number = input.accountNumber || null;
  if (input.accountType !== undefined) m.account_type = input.accountType || null;
  if (input.taxResident !== undefined) m.tax_resident = input.taxResident ?? null;
  if (input.usCitizen !== undefined) m.us_citizen = input.usCitizen ?? null;
  if (input.birthCountry !== undefined) m.birth_country = input.birthCountry || null;
  if (input.idIssueDate !== undefined) m.id_issue_date = input.idIssueDate || null;
  if (input.isConfidential !== undefined) m.is_confidential = input.isConfidential ?? null;
  if (input.healthFund !== undefined) m.health_fund = input.healthFund || null;
  if (input.supplementaryInsurance !== undefined) m.supplementary_insurance = input.supplementaryInsurance || null;
  if (input.height !== undefined) m.height = input.height ?? null;
  if (input.weight !== undefined) m.weight = input.weight ?? null;
  if (input.height !== undefined || input.weight !== undefined) {
    m.bmi = calculateBMI(input.height, input.weight) ?? null;
  }
  if (input.isSmoker !== undefined) m.is_smoker = input.isSmoker ?? null;
  if (input.cigarettesPerDay !== undefined) m.cigarettes_per_day = input.cigarettesPerDay ?? null;
  if (input.wasSmoker !== undefined) m.was_smoker = input.wasSmoker ?? null;
  if (input.quitYear !== undefined) m.quit_year = input.quitYear ?? null;
  if (input.medicalAdviceToQuit !== undefined) m.medical_advice_to_quit = input.medicalAdviceToQuit ?? null;
  if (input.medicalDetails !== undefined) m.medical_details = input.medicalDetails || null;
  if (input.medications !== undefined) m.medications = input.medications || null;
  if (input.hospitalizations !== undefined) m.hospitalizations = input.hospitalizations || null;
  if (input.surgeries !== undefined) m.surgeries = input.surgeries || null;
  if (input.preExistingConditions !== undefined) m.pre_existing_conditions = input.preExistingConditions || null;
  if (input.dangerousHobbies !== undefined) m.dangerous_hobbies = input.dangerousHobbies || null;
  if (input.spouseName !== undefined) m.spouse_name = input.spouseName || null;
  if (input.numberOfChildren !== undefined) m.number_of_children = input.numberOfChildren ?? null;
  if (input.beneficiaries !== undefined) m.beneficiaries = input.beneficiaries || null;
  if (input.extendedData !== undefined) m.extended_data = input.extendedData;
  return m;
}

interface AgentProfile {
  id: string;
  userId: string;
  agencyId: string;
  fullName: string;
  phone?: string;
  licenseNumber?: string;
  role: string;
}

interface Agency {
  id: string;
  name: string;
  licenseNumber?: string;
  entityType?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

interface AppContextType {
  data: AppData;
  session: Session | null;
  loading: boolean;
  profile: AgentProfile | null;
  agency: Agency | null;
  needsOnboarding: boolean;
  addCustomer: (input: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (input: Partial<Product> & { customerId: string }) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addRecommendation: (input: Partial<Recommendation> & { customerId: string }) => Promise<Recommendation>;
  updateRecommendation: (id: string, updates: Partial<Recommendation>) => Promise<void>;
  deleteRecommendation: (id: string) => Promise<void>;
  addSourceFile: (input: Partial<SourceFile> & { customerId: string }) => Promise<SourceFile>;
  deleteSourceFile: (id: string) => Promise<void>;
  logActivity: (title: string, detail: string, level: EventLevel, refs?: { customerId?: string; productId?: string; recommendationId?: string }) => Promise<void>;
  refreshData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppCtx = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [data, setData] = useState<AppData>({
    customers: [], products: [], recommendations: [], sourceFiles: [], activityLog: [],
  });

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const agentId = session?.user?.id;

  // Load profile & agency when session changes
  useEffect(() => {
    if (!agentId) {
      setProfile(null);
      setAgency(null);
      setNeedsOnboarding(false);
      return;
    }
    (async () => {
      const { data: profileRow } = await supabase.from('profiles').select('*').eq('user_id', agentId).single();
      if (!profileRow) {
        setNeedsOnboarding(true);
        setProfile(null);
        setAgency(null);
        return;
      }
      setNeedsOnboarding(false);
      setProfile({
        id: profileRow.id,
        userId: profileRow.user_id,
        agencyId: profileRow.agency_id,
        fullName: profileRow.full_name,
        phone: profileRow.phone || undefined,
        licenseNumber: profileRow.license_number || undefined,
        role: profileRow.role,
      });
      const { data: agencyRow } = await supabase.from('agencies').select('*').eq('id', profileRow.agency_id).single();
      if (agencyRow) {
        setAgency({
          id: agencyRow.id,
          name: agencyRow.name,
          licenseNumber: agencyRow.license_number || undefined,
          entityType: agencyRow.entity_type || undefined,
          phone: agencyRow.phone || undefined,
          email: agencyRow.email || undefined,
          logoUrl: agencyRow.logo_url || undefined,
          primaryColor: agencyRow.primary_color || undefined,
          secondaryColor: agencyRow.secondary_color || undefined,
          accentColor: agencyRow.accent_color || undefined,
        });
      }
    })();
  }, [agentId]);

  // Fetch all data when session changes
  const refreshData = useCallback(async () => {
    if (!agentId) {
      setData({ customers: [], products: [], recommendations: [], sourceFiles: [], activityLog: [] });
      return;
    }
    const [cRes, pRes, rRes, sfRes, aRes] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('recommendations').select('*').order('created_at', { ascending: false }),
      supabase.from('source_files').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    setData({
      customers: (cRes.data || []).map(mapCustomer),
      products: (pRes.data || []).map(mapProduct),
      recommendations: (rRes.data || []).map(mapRecommendation),
      sourceFiles: (sfRes.data || []).map(mapSourceFile),
      activityLog: (aRes.data || []).map(mapActivity),
    });
  }, [agentId]);

  useEffect(() => {
    if (agentId) refreshData();
  }, [agentId, refreshData]);

  const logActivity = useCallback(async (title: string, detail: string, level: EventLevel, refs?: { customerId?: string; productId?: string; recommendationId?: string }) => {
    if (!agentId) return;
    const { data: row } = await supabase.from('activity_log').insert({
      agent_id: agentId, title, detail, level,
      customer_id: refs?.customerId || null,
      product_id: refs?.productId || null,
      recommendation_id: refs?.recommendationId || null,
    }).select().single();
    if (row) {
      setData(prev => ({ ...prev, activityLog: [mapActivity(row), ...prev.activityLog] }));
    }
  }, [agentId]);

  const addCustomer = useCallback(async (input: Partial<Customer>): Promise<Customer> => {
    const dbData = customerToDb(input, agentId);
    const { data: row, error } = await supabase.from('customers').insert(dbData as any).select().single();
    if (error) throw error;
    const customer = mapCustomer(row);
    setData(prev => ({ ...prev, customers: [customer, ...prev.customers] }));
    logActivity('לקוח חדש נוצר', customer.fullName, 'הצלחה', { customerId: customer.id });
    return customer;
  }, [agentId, logActivity]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const dbData = customerToDb(updates);
    const { data: row, error } = await supabase.from('customers').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    const updated = mapCustomer(row);
    setData(prev => ({ ...prev, customers: prev.customers.map(c => c.id === id ? updated : c) }));
    logActivity('לקוח עודכן', updated.fullName, 'מידע', { customerId: id });
  }, [logActivity]);

  const deleteCustomer = useCallback(async (id: string) => {
    const cust = data.customers.find(c => c.id === id);
    // Cascade: delete related data
    await Promise.all([
      supabase.from('recommendations').delete().eq('customer_id', id),
      supabase.from('products').delete().eq('customer_id', id),
      supabase.from('source_files').delete().eq('customer_id', id),
      supabase.from('client_access_links').delete().eq('customer_id', id),
      supabase.from('recommendation_summaries').delete().eq('customer_id', id),
    ]);
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
      products: prev.products.filter(p => p.customerId !== id),
      recommendations: prev.recommendations.filter(r => r.customerId !== id),
      sourceFiles: prev.sourceFiles.filter(s => s.customerId !== id),
    }));
    logActivity('לקוח נמחק', cust?.fullName || '', 'אזהרה', { customerId: id });
  }, [data.customers, logActivity]);

  const addProduct = useCallback(async (input: Partial<Product> & { customerId: string }): Promise<Product> => {
    const dbData: Record<string, unknown> = {
      agent_id: agentId,
      customer_id: input.customerId,
      category: input.category || 'כסף',
      company: input.company || null,
      product_type: input.productType || null,
      sub_description: input.subDescription || null,
      policy_number: input.policyNumber || null,
      product_number: input.productNumber || null,
      is_active: input.isActive ?? true,
      phase: input.phase || 'פעיל',
      monthly_premium: input.monthlyPremium ?? null,
      monthly_deposit: input.monthlyDeposit ?? null,
      accumulation: input.accumulation ?? null,
      track: input.track || null,
      investment_track: input.investmentTrack || null,
      investment_track_custom: input.investmentTrackCustom || null,
      preferred_risk_level: input.preferredRiskLevel || null,
      management_fee_deposit: input.managementFeeDeposit ?? null,
      management_fee_accumulation: input.managementFeeAccumulation ?? null,
      return_year: input.returnYear ?? null,
      return_3_years: input.return3Years ?? null,
      notes: input.notes || null,
      manually_completed: input.manuallyCompleted ?? false,
    };
    const { data: row, error } = await supabase.from('products').insert(dbData as any).select().single();
    if (error) throw error;
    const product = mapProduct(row);
    setData(prev => ({ ...prev, products: [product, ...prev.products] }));
    logActivity('מוצר חדש נוצר', `${product.company} - ${product.productType}`, 'הצלחה', { customerId: product.customerId, productId: product.id });
    return product;
  }, [agentId, logActivity]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const dbData: Record<string, unknown> = {};
    if (updates.category !== undefined) dbData.category = updates.category;
    if (updates.company !== undefined) dbData.company = updates.company || null;
    if (updates.productType !== undefined) dbData.product_type = updates.productType || null;
    if (updates.subDescription !== undefined) dbData.sub_description = updates.subDescription || null;
    if (updates.policyNumber !== undefined) dbData.policy_number = updates.policyNumber || null;
    if (updates.productNumber !== undefined) dbData.product_number = updates.productNumber || null;
    if (updates.isActive !== undefined) dbData.is_active = updates.isActive;
    if (updates.phase !== undefined) dbData.phase = updates.phase;
    if (updates.monthlyPremium !== undefined) dbData.monthly_premium = updates.monthlyPremium ?? null;
    if (updates.monthlyDeposit !== undefined) dbData.monthly_deposit = updates.monthlyDeposit ?? null;
    if (updates.accumulation !== undefined) dbData.accumulation = updates.accumulation ?? null;
    if (updates.track !== undefined) dbData.track = updates.track || null;
    if (updates.investmentTrack !== undefined) dbData.investment_track = updates.investmentTrack || null;
    if (updates.investmentTrackCustom !== undefined) dbData.investment_track_custom = updates.investmentTrackCustom || null;
    if (updates.preferredRiskLevel !== undefined) dbData.preferred_risk_level = updates.preferredRiskLevel || null;
    if (updates.managementFeeDeposit !== undefined) dbData.management_fee_deposit = updates.managementFeeDeposit ?? null;
    if (updates.managementFeeAccumulation !== undefined) dbData.management_fee_accumulation = updates.managementFeeAccumulation ?? null;
    if (updates.returnYear !== undefined) dbData.return_year = updates.returnYear ?? null;
    if (updates.return3Years !== undefined) dbData.return_3_years = updates.return3Years ?? null;
    if (updates.notes !== undefined) dbData.notes = updates.notes || null;
    if (updates.manuallyCompleted !== undefined) dbData.manually_completed = updates.manuallyCompleted;

    const { data: row, error } = await supabase.from('products').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    const updated = mapProduct(row);
    setData(prev => ({ ...prev, products: prev.products.map(p => p.id === id ? updated : p) }));
    logActivity('מוצר עודכן', `${updated.company} - ${updated.productType}`, 'מידע', { productId: id });
  }, [logActivity]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
    logActivity('מוצר נמחק', '', 'אזהרה', { productId: id });
  }, [logActivity]);

  const addRecommendation = useCallback(async (input: Partial<Recommendation> & { customerId: string }): Promise<Recommendation> => {
    const dbData: Record<string, unknown> = {
      agent_id: agentId,
      customer_id: input.customerId,
      linked_product_id: input.linkedProductId || null,
      title: input.title || '',
      rationale: input.rationale || '',
      current_state: input.currentState || null,
      based_on: input.basedOn || null,
      improvement: input.improvement || null,
      action_type: input.actionType || 'הצטרפות בלבד',
      requires_quote: input.requiresQuote ?? false,
      decision_status: input.decisionStatus || 'טיוטה',
      execution_status: input.executionStatus || null,
      next_step: input.nextStep || null,
      missing_for_execution: input.missingForExecution || null,
      execution_note: input.executionNote || null,
      customer_note: input.customerNote || null,
      recommended_investment_track: input.recommendedInvestmentTrack || null,
      recommended_investment_track_custom: input.recommendedInvestmentTrackCustom || null,
      recommended_risk_level: input.recommendedRiskLevel || null,
    };
    const { data: row, error } = await supabase.from('recommendations').insert(dbData as any).select().single();
    if (error) throw error;
    const rec = mapRecommendation(row);
    setData(prev => ({ ...prev, recommendations: [rec, ...prev.recommendations] }));
    logActivity('המלצה חדשה נוצרה', rec.title, 'הצלחה', { customerId: rec.customerId, recommendationId: rec.id });
    return rec;
  }, [agentId, logActivity]);

  const updateRecommendation = useCallback(async (id: string, updates: Partial<Recommendation>) => {
    const dbData: Record<string, unknown> = {};
    if (updates.linkedProductId !== undefined) dbData.linked_product_id = updates.linkedProductId || null;
    if (updates.title !== undefined) dbData.title = updates.title;
    if (updates.rationale !== undefined) dbData.rationale = updates.rationale;
    if (updates.currentState !== undefined) dbData.current_state = updates.currentState || null;
    if (updates.basedOn !== undefined) dbData.based_on = updates.basedOn || null;
    if (updates.improvement !== undefined) dbData.improvement = updates.improvement || null;
    if (updates.actionType !== undefined) dbData.action_type = updates.actionType;
    if (updates.requiresQuote !== undefined) dbData.requires_quote = updates.requiresQuote;
    if (updates.decisionStatus !== undefined) dbData.decision_status = updates.decisionStatus;
    if (updates.executionStatus !== undefined) dbData.execution_status = updates.executionStatus || null;
    if (updates.nextStep !== undefined) dbData.next_step = updates.nextStep || null;
    if (updates.missingForExecution !== undefined) dbData.missing_for_execution = updates.missingForExecution || null;
    if (updates.executionNote !== undefined) dbData.execution_note = updates.executionNote || null;
    if (updates.customerNote !== undefined) dbData.customer_note = updates.customerNote || null;
    if (updates.recommendedInvestmentTrack !== undefined) dbData.recommended_investment_track = updates.recommendedInvestmentTrack || null;
    if (updates.recommendedInvestmentTrackCustom !== undefined) dbData.recommended_investment_track_custom = updates.recommendedInvestmentTrackCustom || null;
    if (updates.recommendedRiskLevel !== undefined) dbData.recommended_risk_level = updates.recommendedRiskLevel || null;

    const { data: row, error } = await supabase.from('recommendations').update(dbData).eq('id', id).select().single();
    if (error) throw error;
    const updated = mapRecommendation(row);
    setData(prev => ({ ...prev, recommendations: prev.recommendations.map(r => r.id === id ? updated : r) }));
    if (updates.decisionStatus) logActivity('סטטוס החלטה שונה', updates.decisionStatus, 'מידע', { recommendationId: id });
    if (updates.executionStatus) logActivity('סטטוס ביצוע שונה', updates.executionStatus, 'מידע', { recommendationId: id });
  }, [logActivity]);

  const deleteRecommendation = useCallback(async (id: string) => {
    const { error } = await supabase.from('recommendations').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({ ...prev, recommendations: prev.recommendations.filter(r => r.id !== id) }));
    logActivity('המלצה נמחקה', '', 'אזהרה', { recommendationId: id });
  }, [logActivity]);

  const addSourceFile = useCallback(async (input: Partial<SourceFile> & { customerId: string }): Promise<SourceFile> => {
    const { data: row, error } = await supabase.from('source_files').insert({
      agent_id: agentId,
      customer_id: input.customerId,
      type: input.type || 'מסלקה',
      file_name: input.fileName || '',
      analysis_status: input.analysisStatus || 'ממתין',
    }).select().single();
    if (error) throw error;
    const sf = mapSourceFile(row);
    setData(prev => ({ ...prev, sourceFiles: [sf, ...prev.sourceFiles] }));
    logActivity('קובץ מקור הועלה', `${sf.type}: ${sf.fileName}`, 'הצלחה', { customerId: sf.customerId });
    return sf;
  }, [agentId, logActivity]);

  const deleteSourceFile = useCallback(async (id: string) => {
    const { error } = await supabase.from('source_files').delete().eq('id', id);
    if (error) throw error;
    setData(prev => ({ ...prev, sourceFiles: prev.sourceFiles.filter(s => s.id !== id) }));
    logActivity('קובץ מקור נמחק', '', 'אזהרה');
  }, [logActivity]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setData({ customers: [], products: [], recommendations: [], sourceFiles: [], activityLog: [] });
  }, []);

  return (
    <AppCtx.Provider value={{
      data, session, loading, profile, agency, needsOnboarding,
      addCustomer, updateCustomer, deleteCustomer,
      addProduct, updateProduct, deleteProduct,
      addRecommendation, updateRecommendation, deleteRecommendation,
      addSourceFile, deleteSourceFile,
      logActivity, refreshData, signOut,
    }}>
      {children}
    </AppCtx.Provider>
  );
};
