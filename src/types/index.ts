export type IdType = 'תעודת זהות' | 'דרכון' | 'מספר חברה';
export type Gender = 'זכר' | 'נקבה';
export type MaritalStatus = 'רווק/ה' | 'נשוי/אה' | 'גרוש/ה' | 'אלמן/ה';
export type CustomerStatus = 'חדש' | 'בקליטה' | 'בהשלמת מוצרים' | 'מוכן להמלצה' | 'ממתין לפולו־אפ' | 'מאושר לביצוע' | 'בביצוע' | 'הושלם';
export type ProductCategory = 'כסף' | 'ביטוח';
export type ProductPhase = 'פעיל' | 'לא פעיל' | 'מוקפא';
export type ActionType = 'החלפה' | 'שדרוג' | 'הוספה' | 'שמירה' | 'ביטול' | 'איחוד' | 'קביעת פגישה' | 'שחלוף' | 'מינוי סוכן' | 'ניוד' | 'שינוי מוצר' | 'הצטרפות בלבד';
export type DecisionStatus = 'טיוטה' | 'נשלח' | 'נצפה' | 'מאשר' | 'רוצה לחשוב' | 'לא מעוניין' | 'עבר לביצוע' | 'בוצע';
export type ExecutionStatus = 'ממתין לנתונים' | 'מוכן להפקה' | 'נשלח לחתימה' | 'נחתם' | 'שוגר' | 'חזר ליקוי' | 'הושלם';
export type EventLevel = 'מידע' | 'הצלחה' | 'אזהרה';
export type SourceFileType = 'מסלקה' | 'הר ביטוח';
export type AnalysisStatus = 'ממתין' | 'בניתוח' | 'הושלם' | 'שגיאה';

export interface SourceFile {
  id: string;
  customerId: string;
  type: SourceFileType;
  fileName: string;
  uploadedAt: string;
  analysisStatus: AnalysisStatus;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  idNumber?: string;
}

/** Extended customer data stored in JSONB */
export interface CustomerExtendedData {
  // ── משפחה מורחבת ──
  spouseIdNumber?: string;
  spouseBirthDate?: string;
  childrenNames?: string;
  childrenBirthDates?: string;
  dependentFamilyMembers?: string;
  beneficiaryDistribution?: string;
  familyRelation?: string;

  // ── קשר ותפעול ──
  availableForCalls?: boolean;
  preferredContactHours?: string;
  preferredContactMethod?: string;
  approvesSms?: boolean;
  approvesEmail?: boolean;
  mailingStatus?: string;
  conversationSummary?: string;
  linkSent?: boolean;
  linkViewed?: boolean;
  responded?: boolean;

  // ── ניתוח מקצועי ──
  employer?: string;
  workplace?: string;
  incomeLevelFamily?: string;
  additionalIncomeSources?: string;
  exceptionalObligations?: string;
  generalFinancialStatus?: string;
  savingsGoals?: string;
  insuranceGoals?: string;
  savingsTimeframe?: string;
  desiredRiskLevel?: string;
  currentInvestmentTrack?: string;
  desiredInvestmentTrack?: string;

  // ── בנקאות מורחבת ──
  bankNumber?: string;
  accountOwnership?: string;
  paymentMethod?: string;
  debitAuthorization?: boolean;
  salaryDetails?: string;
  depositStatus?: string;
  desiredMonthlyDeposit?: number;
  desiredLumpSum?: number;
  fundsSource?: string;

  // ── רגולציה ──
  usResident?: boolean;
  usAffiliation?: boolean;
  taxCountry?: string;
  foreignTaxId?: string;
  fatcaCrsDeclarations?: string;
  fundsSourceDeclarations?: string;

  // ── בריאות מורחבת ──
  disabilities?: string;
  medicalRestrictions?: string;
  currentTreatments?: string;
  specialTests?: string;
  dangerousOccupation?: string;
  extremeSports?: string;
  specialLicense?: string;

  // ── העדפות והתאמה ──
  priorityPreference?: string;
  wantsToReduceCost?: boolean;
  wantsToImproveCoverage?: boolean;
  wantsToConsolidate?: boolean;
  wantsChildSavings?: boolean;
  specificMoneyGoal?: string;
  openToTrackChange?: boolean;
  riskPreference?: string;
  wantsOnlyReview?: boolean;
  wantsExecution?: boolean;

  // ── ביצוע ──
  approvedRecommendations?: string;
  rejectedRecommendations?: string;
  pendingRecommendations?: string;
  missingForExecution?: string;
  requiredSignatures?: string;
  requiredDocuments?: string;
  clientApproval?: boolean;
  approvalDate?: string;
  executionNotes?: string;

  // ── מסמכים ──
  hasIdPhoto?: boolean;
  hasCheckOrBankApproval?: boolean;
  hasClearingHouse?: boolean;
  hasInsuranceMountain?: boolean;
  hasExistingReports?: boolean;
  hasSignedForms?: boolean;
  hasHealthQuestionnaire?: boolean;
  hasMedicalDocuments?: boolean;
  hasPaySlips?: boolean;
  hasEmployerApproval?: boolean;
  hasTaxDocuments?: boolean;
  specialAttachments?: string;

  // ── כתובת באנגלית ──
  addressEnglish?: string;
  residenceStatus?: string;

  // ── כללי נוסף ──
  [key: string]: any;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  idType: IdType;
  idNumber: string;
  birthDate: string;
  age: number;
  gender: Gender;
  maritalStatus: MaritalStatus;
  mobilePhone: string;
  otherPhone?: string;
  email?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  apartmentNumber?: string;
  poBox?: string;
  zipCode?: string;
  country?: string;
  source?: string;
  internalNotes?: string;
  status: CustomerStatus;
  linkCreatedAt?: string;
  lastViewedAt?: string;
  nextFollowUp?: string;
  employmentStatus?: string;
  occupation?: string;
  profession?: string;
  position?: string;
  monthlyIncome?: number;
  annualIncome?: number;
  bank?: string;
  branch?: string;
  accountNumber?: string;
  accountType?: string;
  taxResident?: boolean;
  usCitizen?: boolean;
  birthCountry?: string;
  idIssueDate?: string;
  isConfidential?: boolean;
  healthFund?: string;
  supplementaryInsurance?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  isSmoker?: boolean;
  cigarettesPerDay?: number;
  wasSmoker?: boolean;
  quitYear?: number;
  medicalAdviceToQuit?: boolean;
  medicalDetails?: string;
  medications?: string;
  hospitalizations?: string;
  surgeries?: string;
  preExistingConditions?: string;
  dangerousHobbies?: string;
  spouseName?: string;
  numberOfChildren?: number;
  familyMembers?: FamilyMember[];
  beneficiaries?: string;
  extendedData: CustomerExtendedData;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  customerId: string;
  category: ProductCategory;
  company: string;
  productType: string;
  subDescription?: string;
  policyNumber?: string;
  productNumber?: string;
  isActive: boolean;
  monthlyPremium?: number;
  monthlyDeposit?: number;
  accumulation?: number;
  track?: string;
  investmentTrack?: string;
  investmentTrackCustom?: string;
  preferredRiskLevel?: string;
  managementFeeDeposit?: number;
  managementFeeAccumulation?: number;
  returnYear?: number;
  return3Years?: number;
  phase: ProductPhase;
  notes?: string;
  manuallyCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Returns the correct monthly amount label based on product category */
export function getMonthlyAmountLabel(category: ProductCategory): string {
  return category === 'ביטוח' ? 'פרמיה חודשית' : 'הפקדה חודשית';
}

/** Returns the monthly amount value based on product category */
export function getMonthlyAmount(product: Product): number | undefined {
  return product.category === 'ביטוח' ? product.monthlyPremium : product.monthlyDeposit;
}

export interface Recommendation {
  id: string;
  customerId: string;
  linkedProductId?: string;
  title: string;
  currentState?: string;
  rationale: string;
  basedOn?: string;
  improvement?: string;
  actionType: ActionType;
  requiresQuote?: boolean;
  decisionStatus: DecisionStatus;
  nextStep?: string;
  missingForExecution?: string;
  executionNote?: string;
  executionStatus?: ExecutionStatus;
  customerNote?: string;
  recommendedInvestmentTrack?: string;
  recommendedInvestmentTrackCustom?: string;
  recommendedRiskLevel?: string;
  urgency?: string;
  problemGap?: string;
  recommendedCompany?: string;
  recommendedTrack?: string;
  costBefore?: number;
  costAfter?: number;
  recommendationType?: string;
  productSnapshot?: any;
  advantages?: string;
  disadvantages?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  title: string;
  detail?: string;
  level: EventLevel;
  customerId?: string;
  productId?: string;
  recommendationId?: string;
}

export interface AppData {
  customers: Customer[];
  products: Product[];
  recommendations: Recommendation[];
  sourceFiles: SourceFile[];
  activityLog: ActivityEntry[];
}
