import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

// Types
export type ImportFileType = 'customers_export' | 'hb_results' | 'agent_report' | 'pre_treatment_kit' | 'clearing_house' | 'unknown';
export type ImportMode = 'create_only' | 'update_only' | 'create_and_update';
export type ItemStatus = 'pending' | 'success' | 'error' | 'needs_review' | 'duplicate' | 'skipped';
export type ItemAction = 'pending' | 'create' | 'update' | 'skip' | 'error' | 'needs_review' | 'manual_assign';

export interface ParsedCustomer {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  idType?: string;
  idNumber?: string;
  mobilePhone?: string;
  otherPhone?: string;
  email?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
  gender?: string;
  birthDate?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  occupation?: string;
  employmentStatus?: string;
  healthFund?: string;
  height?: number;
  weight?: number;
  isSmoker?: boolean;
  source?: string;
  internalNotes?: string;
  isConfidential?: boolean;
  status?: string;
}

export interface ParsedProduct {
  category: 'כסף' | 'ביטוח';
  company?: string;
  productType?: string;
  subDescription?: string;
  policyNumber?: string;
  monthlyPremium?: number;
  monthlyDeposit?: number;
  accumulation?: number;
  track?: string;
  managementFeeDeposit?: number;
  managementFeeAccumulation?: number;
  phase?: string;
  notes?: string;
}

export interface ImportItem {
  id: string;
  rowNumber?: number;
  customerIdNumber?: string;
  customerName?: string;
  action: ItemAction;
  status: ItemStatus;
  errorMessage?: string;
  customerId?: string;
  parsedCustomer?: ParsedCustomer;
  parsedProducts?: ParsedProduct[];
  productsCreated: number;
  productsUpdated: number;
  sourceFileName?: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  totalItems: number;
  succeeded: number;
  failed: number;
  needsReview: number;
  importMode: ImportMode;
  createdAt: string;
  items: ImportItem[];
}

export interface ImportSummary {
  customersCreated: number;
  customersUpdated: number;
  filesAttached: number;
  filesFailed: number;
  needsManualReview: number;
  productsCreated: number;
  productsUpdated: number;
}

// Detect file type from filename
export function detectFileType(fileName: string): ImportFileType {
  const lower = fileName.toLowerCase();
  if (lower.startsWith('customersexport') || lower.includes('customersexport')) return 'customers_export';
  if (lower.startsWith('hbresults') || lower.includes('hbresults')) return 'hb_results';
  if (lower.includes('דוח לסוכן') || lower.startsWith('דוח לסוכן')) return 'agent_report';
  if (lower.includes('קיט טרום טיפול') || lower.startsWith('קיט טרום')) return 'pre_treatment_kit';
  if (lower.includes('מסלקה')) return 'clearing_house';
  if (lower.endsWith('.zip')) return 'pre_treatment_kit'; // Default ZIP to kit
  return 'unknown';
}

export function getFileTypeLabel(type: ImportFileType): string {
  switch (type) {
    case 'customers_export': return 'ייצוא לקוחות';
    case 'hb_results': return 'הר ביטוח';
    case 'agent_report': return 'דוח לסוכן';
    case 'pre_treatment_kit': return 'קיט טרום טיפול';
    case 'clearing_house': return 'מסלקה';
    default: return 'לא ידוע';
  }
}

// Read file as base64
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract files from ZIP
export async function extractFilesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const extracted: File[] = [];
  const validExts = ['.csv', '.xlsx', '.xls', '.xml', '.txt', '.json', '.pdf'];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) continue;
    const blob = await entry.async('blob');
    const fileName = path.split('/').pop() || path;
    extracted.push(new File([blob], fileName, { type: blob.type }));
  }
  return extracted;
}

// Parse an XLSX file via the edge function
export async function parseExcelFile(file: File, fileName: string): Promise<{
  fileType: string;
  customers: Array<{ customer: ParsedCustomer; products: ParsedProduct[] }>;
  error?: string;
}> {
  const base64 = await readFileAsBase64(file);
  const { data, error } = await supabase.functions.invoke('parse-import-file', {
    body: { fileName, fileBase64: base64 },
  });
  if (error) throw new Error(error.message || 'שגיאה בפיענוח הקובץ');
  if (data?.error) throw new Error(data.error);
  return data;
}

// Parse a PDF file via AI edge function
export async function parsePdfFile(file: File, fileName: string): Promise<{
  fileType: string;
  customers: Array<{ customer: ParsedCustomer; products: ParsedProduct[] }>;
  error?: string;
}> {
  const base64 = await readFileAsBase64(file);
  const { data, error } = await supabase.functions.invoke('parse-pdf-policy', {
    body: { fileName, fileBase64: base64 },
  });
  if (error) throw new Error(error.message || 'שגיאה בפיענוח ה-PDF');
  if (data?.error) throw new Error(data.error);
  return data;
}

// Find existing customer by ID number
export async function findCustomerByIdNumber(idNumber: string): Promise<{ id: string; firstName: string; lastName: string; fullName: string } | null> {
  const { data } = await supabase
    .from('customers')
    .select('id, first_name, last_name, full_name')
    .eq('id_number', idNumber)
    .limit(1);
  if (data && data.length > 0) {
    const r = data[0];
    return { id: r.id, firstName: r.first_name, lastName: r.last_name, fullName: r.full_name || `${r.first_name} ${r.last_name}` };
  }
  return null;
}

// Find existing product by key fields
export async function findExistingProduct(customerId: string, policyNumber?: string, company?: string, productType?: string): Promise<string | null> {
  if (!policyNumber) return null;
  let query = supabase.from('products').select('id').eq('customer_id', customerId);
  if (policyNumber) query = query.eq('policy_number', policyNumber);
  if (company) query = query.eq('company', company);
  const { data } = await query.limit(1);
  return data && data.length > 0 ? data[0].id : null;
}

// Create or update a customer
export async function upsertCustomer(
  parsed: ParsedCustomer,
  existingId: string | null,
  mode: ImportMode,
  agentId: string
): Promise<{ id: string; action: 'create' | 'update' | 'skip' }> {
  if (existingId && mode === 'create_only') {
    return { id: existingId, action: 'skip' };
  }
  
  if (!existingId && mode === 'update_only') {
    throw new Error('לקוח לא נמצא במערכת ומצב העבודה הוא עדכון בלבד');
  }

  const dbData: Record<string, any> = {};
  if (parsed.firstName) dbData.first_name = parsed.firstName;
  if (parsed.lastName) dbData.last_name = parsed.lastName;
  if (parsed.fullName) dbData.full_name = parsed.fullName;
  if (parsed.idNumber) dbData.id_number = parsed.idNumber;
  if (parsed.idType) dbData.id_type = parsed.idType;
  if (parsed.mobilePhone) dbData.mobile_phone = parsed.mobilePhone;
  if (parsed.otherPhone) dbData.other_phone = parsed.otherPhone;
  if (parsed.email) dbData.email = parsed.email;
  if (parsed.city) dbData.city = parsed.city;
  if (parsed.street) dbData.street = parsed.street;
  if (parsed.houseNumber) dbData.house_number = parsed.houseNumber;
  if (parsed.zipCode) dbData.zip_code = parsed.zipCode;
  if (parsed.gender) dbData.gender = parsed.gender;
  if (parsed.birthDate) dbData.birth_date = parsed.birthDate;
  if (parsed.maritalStatus) dbData.marital_status = parsed.maritalStatus;
  if (parsed.numberOfChildren !== undefined) dbData.number_of_children = parsed.numberOfChildren;
  if (parsed.occupation) dbData.occupation = parsed.occupation;
  if (parsed.employmentStatus) dbData.employment_status = parsed.employmentStatus;
  if (parsed.healthFund) dbData.health_fund = parsed.healthFund;
  if (parsed.height) dbData.height = parsed.height;
  if (parsed.weight) dbData.weight = parsed.weight;
  if (parsed.isSmoker !== undefined) dbData.is_smoker = parsed.isSmoker;
  if (parsed.source) dbData.source = parsed.source;
  if (parsed.internalNotes) dbData.internal_notes = parsed.internalNotes;
  if (parsed.isConfidential !== undefined) dbData.is_confidential = parsed.isConfidential;
  if (parsed.status) dbData.status = parsed.status;

  if (existingId) {
    // Update - only fill missing fields
    const { data: existing } = await supabase.from('customers').select('*').eq('id', existingId).single();
    if (existing) {
      const updates: Record<string, any> = {};
      for (const [key, val] of Object.entries(dbData)) {
        if (val !== null && val !== undefined && val !== '' && (!existing[key] || existing[key] === '')) {
          updates[key] = val;
        }
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('customers').update(updates).eq('id', existingId);
      }
    }
    return { id: existingId, action: 'update' };
  } else {
    // Create
    if (!dbData.first_name) dbData.first_name = parsed.fullName?.split(' ')[0] || 'לא ידוע';
    if (!dbData.last_name) dbData.last_name = parsed.fullName?.split(' ').slice(1).join(' ') || '';
    if (!dbData.id_number) throw new Error('חסרה תעודת זהות ליצירת לקוח');
    if (!dbData.mobile_phone) dbData.mobile_phone = '0000000000';
    if (!dbData.id_type) dbData.id_type = 'תעודת זהות';
    dbData.agent_id = agentId;
    
    const { data: row, error } = await (supabase.from('customers') as any).insert(dbData).select('id').single();
    if (error) throw error;
    return { id: row.id, action: 'create' };
  }
}

// Create or update products for a customer
export async function upsertProducts(
  customerId: string,
  products: ParsedProduct[],
  agentId: string
): Promise<{ created: number; updated: number }> {
  let created = 0, updated = 0;

  for (const p of products) {
    const existingId = await findExistingProduct(customerId, p.policyNumber, p.company, p.productType);
    
    const dbData: Record<string, any> = {
      customer_id: customerId,
      category: p.category,
      company: p.company || null,
      product_type: p.productType || null,
      sub_description: p.subDescription || null,
      policy_number: p.policyNumber || null,
      monthly_premium: p.monthlyPremium ?? null,
      monthly_deposit: p.monthlyDeposit ?? null,
      accumulation: p.accumulation ?? null,
      track: p.track || null,
      management_fee_deposit: p.managementFeeDeposit ?? null,
      management_fee_accumulation: p.managementFeeAccumulation ?? null,
      phase: p.phase || 'פעיל',
      notes: p.notes || null,
      is_active: true,
    };

    if (existingId) {
      // Update non-null fields
      const updates: Record<string, any> = {};
      for (const [key, val] of Object.entries(dbData)) {
        if (key === 'customer_id' || key === 'agent_id') continue;
        if (val !== null && val !== undefined) updates[key] = val;
      }
      await supabase.from('products').update(updates).eq('id', existingId);
      updated++;
    } else {
      dbData.agent_id = agentId;
      await (supabase.from('products') as any).insert(dbData);
      created++;
    }
  }

  return { created, updated };
}

// Create source file record
export async function createSourceFile(customerId: string, fileName: string, fileType: string, agentId: string): Promise<void> {
  await supabase.from('source_files').insert({
    customer_id: customerId,
    agent_id: agentId,
    file_name: fileName,
    type: fileType === 'hb_results' ? 'הר ביטוח' : 'מסלקה',
    analysis_status: 'הושלם',
  });
}

// Log activity
export async function logImportActivity(title: string, detail: string, level: string, agentId: string, customerId?: string): Promise<void> {
  await supabase.from('activity_log').insert({
    agent_id: agentId,
    title,
    detail,
    level,
    customer_id: customerId || null,
  });
}

// Upload file to storage
export async function uploadFileToStorage(file: File, customerId: string): Promise<void> {
  const filePath = `${customerId}/${Date.now()}_${file.name}`;
  await supabase.storage.from('source-files').upload(filePath, file);
}

// Create import batch
export async function createImportBatch(agentId: string, fileName: string, fileType: string, importMode: ImportMode): Promise<string> {
  const { data, error } = await (supabase.from('import_batches') as any).insert({
    agent_id: agentId,
    file_name: fileName,
    file_type: fileType,
    import_mode: importMode,
    status: 'processing',
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

// Update import batch
export async function updateImportBatch(batchId: string, updates: Record<string, any>): Promise<void> {
  await (supabase.from('import_batches') as any).update(updates).eq('id', batchId);
}

// Create import batch item
export async function createImportBatchItem(batchId: string, item: Partial<ImportItem>): Promise<string> {
  const { data, error } = await (supabase.from('import_batch_items') as any).insert({
    batch_id: batchId,
    row_number: item.rowNumber || null,
    customer_id_number: item.customerIdNumber || null,
    customer_name: item.customerName || null,
    action: item.action || 'pending',
    status: item.status || 'pending',
    error_message: item.errorMessage || null,
    customer_id: item.customerId || null,
    details: { customer: item.parsedCustomer, products: item.parsedProducts },
    source_file_name: item.sourceFileName || null,
    products_created: item.productsCreated || 0,
    products_updated: item.productsUpdated || 0,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

// Update import batch item
export async function updateImportBatchItem(itemId: string, updates: Record<string, any>): Promise<void> {
  await (supabase.from('import_batch_items') as any).update(updates).eq('id', itemId);
}

// Load import history
export async function loadImportHistory(): Promise<ImportBatch[]> {
  const { data: batches } = await (supabase.from('import_batches') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!batches || batches.length === 0) return [];

  const batchIds = batches.map((b: any) => b.id);
  const { data: items } = await (supabase.from('import_batch_items') as any)
    .select('*')
    .in('batch_id', batchIds)
    .order('row_number', { ascending: true });

  return batches.map((b: any) => ({
    id: b.id,
    fileName: b.file_name,
    fileType: b.file_type,
    status: b.status,
    totalItems: b.total_items,
    succeeded: b.succeeded,
    failed: b.failed,
    needsReview: b.needs_review,
    importMode: (b.import_mode || 'create_and_update') as ImportMode,
    createdAt: b.created_at,
    items: (items || []).filter((i: any) => i.batch_id === b.id).map((i: any) => ({
      id: i.id,
      rowNumber: i.row_number || undefined,
      customerIdNumber: i.customer_id_number || undefined,
      customerName: i.customer_name || undefined,
      action: (i.action || 'pending') as ItemAction,
      status: (i.status || 'pending') as ItemStatus,
      errorMessage: i.error_message || undefined,
      customerId: i.customer_id || undefined,
      parsedCustomer: i.details?.customer,
      parsedProducts: i.details?.products,
      productsCreated: i.products_created || 0,
      productsUpdated: i.products_updated || 0,
      sourceFileName: i.source_file_name || undefined,
    })),
  }));
}
