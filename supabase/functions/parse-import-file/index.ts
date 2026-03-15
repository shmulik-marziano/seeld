import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ParsedCustomer {
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

interface ParsedProduct {
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

interface ParseResult {
  fileType: string;
  customers: Array<{ customer: ParsedCustomer; products: ParsedProduct[] }>;
  error?: string;
}

function cleanStr(v: any): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  return String(v).trim();
}

function cleanNum(v: any): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(/[₪,%\s]/g, ''));
  return isNaN(n) ? undefined : n;
}

function detectFileType(fileName: string, sheetNames: string[]): string {
  const lower = fileName.toLowerCase();
  if (lower.startsWith('customersexport') || lower.includes('customersexport')) return 'customers_export';
  if (lower.startsWith('hbresults') || lower.includes('hbresults')) return 'hb_results';
  if (lower.includes('דוח לסוכן') || lower.startsWith('דוח לסוכן')) return 'agent_report';
  if (lower.endsWith('.xml') || lower.includes('מסלקה')) return 'clearing_house';
  // Detect by sheet names
  if (sheetNames.some(s => s === 'לקוחות')) return 'customers_export';
  if (sheetNames.some(s => s === 'תיק ביטוחי')) return 'hb_results';
  if (sheetNames.some(s => s === 'פרטי לקוח') && sheetNames.some(s => s.includes('מוצרי'))) return 'agent_report';
  return 'unknown';
}

function findHeaderRow(sheet: any[][], headerKeywords: string[]): number {
  for (let i = 0; i < Math.min(sheet.length, 15); i++) {
    const row = sheet[i];
    if (!row) continue;
    const rowStr = row.map(c => String(c || '').trim().toLowerCase()).join('|');
    const matches = headerKeywords.filter(k => rowStr.includes(k.toLowerCase()));
    if (matches.length >= 2) return i;
  }
  return 0;
}

function getColumnMap(headerRow: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((cell, idx) => {
    if (cell) map[String(cell).trim()] = idx;
  });
  return map;
}

function getVal(row: any[], colMap: Record<string, number>, ...keys: string[]): any {
  for (const key of keys) {
    for (const [col, idx] of Object.entries(colMap)) {
      if (col.includes(key) || key.includes(col)) {
        if (row[idx] !== null && row[idx] !== undefined && row[idx] !== '') return row[idx];
      }
    }
  }
  return undefined;
}

// ===== XML Clearing House Parser =====

function getElementText(parent: any, tagName: string): string | undefined {
  const el = parent.querySelector(tagName);
  if (!el) return undefined;
  const text = el.textContent?.trim();
  return text || undefined;
}

function getElementNum(parent: any, tagName: string): number | undefined {
  const text = getElementText(parent, tagName);
  if (!text) return undefined;
  const n = parseFloat(text.replace(/[,\s]/g, ''));
  return isNaN(n) ? undefined : n;
}

function formatXmlDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  // Handle formats: YYYY-MM-DD, YYYYMMDD, DD/MM/YYYY
  const clean = dateStr.replace(/[\/\-\.]/g, '');
  if (clean.length === 8) {
    if (dateStr.includes('/')) {
      // DD/MM/YYYY
      const parts = dateStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // YYYYMMDD
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  return dateStr;
}

function detectCategory(productType: string | undefined, branchCode: string | undefined): 'כסף' | 'ביטוח' {
  const savingsKeywords = ['פנסיה', 'גמל', 'השתלמות', 'חיסכון', 'קצבה', 'קרן'];
  const code = branchCode || '';
  const type = (productType || '').toLowerCase();
  
  // Branch codes: 1-3 are typically pension/savings, 4+ are insurance
  if (['1', '2', '3'].includes(code)) return 'כסף';
  if (savingsKeywords.some(k => type.includes(k))) return 'כסף';
  return 'ביטוח';
}

function mapCompanyCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  // Common Israeli insurance company codes
  const companies: Record<string, string> = {
    '1': 'מגדל', '2': 'כלל', '3': 'הפניקס', '4': 'הראל',
    '5': 'מנורה מבטחים', '6': 'איילון', '7': 'הכשרה',
    '8': 'שלמה', '9': 'ביטוח ישיר', '10': 'AIG',
    '11': 'כלל פנסיה', '12': 'מגדל מקפת', '13': 'מיטב דש',
    '14': 'אלטשולר שחם', '15': 'מור', '16': 'פסגות',
    '17': 'אנליסט', '18': 'ילין לפידות', '19': 'מנורה מבטחים פנסיה',
    '20': 'הלמן אלדובי',
    // Common longer codes
    '510037076': 'מגדל', '510002501': 'כלל', '510026947': 'הפניקס',
    '510038959': 'הראל', '510020072': 'מנורה מבטחים', '510005702': 'איילון',
    '510003475': 'הכשרה',
  };
  return companies[code] || code;
}

function parseClearingHouseXml(xmlContent: string): ParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  if (!doc) {
    return { fileType: 'clearing_house', customers: [], error: 'לא ניתן לפרסר את קובץ ה-XML' };
  }

  const customersMap = new Map<string, { customer: ParsedCustomer; products: ParsedProduct[] }>();

  // Strategy 1: Look for YeshutMevutach / Mutzar patterns (common in Mislaka responses)
  const insuredEntities = doc.querySelectorAll(
    'YeshutMevutach, MevutachRashi, Mevutach, BaalPolisa, InsuredEntity, insured'
  );

  if (insuredEntities.length > 0) {
    for (const entity of insuredEntities) {
      const idNumber = getElementText(entity, 'MisparZihuy') ||
                       getElementText(entity, 'TeulatZehut') ||
                       getElementText(entity, 'MisparTeulatZehut') ||
                       getElementText(entity, 'IdNumber') ||
                       getElementText(entity, 'MISPAR_ZIHUY');

      const firstName = getElementText(entity, 'ShemPrati') ||
                        getElementText(entity, 'FirstName') ||
                        getElementText(entity, 'SHEM_PRATI');
      const lastName = getElementText(entity, 'ShemMishpacha') ||
                       getElementText(entity, 'LastName') ||
                       getElementText(entity, 'SHEM_MISHPACHA');
      const fullName = getElementText(entity, 'ShemMale') ||
                       getElementText(entity, 'FullName');

      const birthDate = formatXmlDate(
        getElementText(entity, 'TaarichLeida') ||
        getElementText(entity, 'DateOfBirth') ||
        getElementText(entity, 'TAARICH_LEIDA')
      );

      const gender = getElementText(entity, 'Min') ||
                     getElementText(entity, 'Gender') ||
                     getElementText(entity, 'MIN');

      const phone = getElementText(entity, 'Telephone') ||
                    getElementText(entity, 'MisparTelefon') ||
                    getElementText(entity, 'Phone') ||
                    getElementText(entity, 'MISPAR_TELEFON');

      const email = getElementText(entity, 'Email') ||
                    getElementText(entity, 'KtovetEmail') ||
                    getElementText(entity, 'EMAIL');

      const city = getElementText(entity, 'Yishuv') ||
                   getElementText(entity, 'ShemYishuv') ||
                   getElementText(entity, 'City');
      const street = getElementText(entity, 'Rechov') ||
                     getElementText(entity, 'ShemRechov') ||
                     getElementText(entity, 'Street');
      const houseNumber = getElementText(entity, 'MisparBayit') ||
                          getElementText(entity, 'HouseNumber');

      const key = idNumber || `${firstName}_${lastName}_${birthDate}`;
      if (!key || key === 'undefined_undefined_undefined') continue;

      if (!customersMap.has(key)) {
        const genderHeb = gender === '1' ? 'זכר' : gender === '2' ? 'נקבה' : gender;
        customersMap.set(key, {
          customer: {
            idNumber,
            firstName: firstName || (fullName ? fullName.split(' ')[0] : undefined),
            lastName: lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : undefined),
            fullName: fullName || (firstName && lastName ? `${firstName} ${lastName}` : undefined),
            birthDate,
            gender: genderHeb,
            mobilePhone: phone,
            email,
            city,
            street,
            houseNumber,
            source: 'מסלקה',
          },
          products: [],
        });
      }

      // Parse products within this entity context
      // Look for product elements within or as siblings
      const parentNode = entity.parentElement || doc;
      const productElements = parentNode.querySelectorAll(
        'Mutzar, Polisa, Product, NetuneiMutzar, PirteiTochnit, MutzarPensioni'
      );

      const customerData = customersMap.get(key)!;
      for (const prod of productElements) {
        const companyCode = getElementText(prod, 'KodHevra') ||
                            getElementText(prod, 'GufYatzran') ||
                            getElementText(prod, 'KodGuf') ||
                            getElementText(prod, 'CompanyCode') ||
                            getElementText(prod, 'KOD_HEVRA');
        const company = mapCompanyCode(companyCode) ||
                        getElementText(prod, 'ShemHevra') ||
                        getElementText(prod, 'ShemGuf') ||
                        getElementText(prod, 'CompanyName');

        const policyNumber = getElementText(prod, 'MisparPolisa') ||
                             getElementText(prod, 'MisparCheshbon') ||
                             getElementText(prod, 'PolicyNumber') ||
                             getElementText(prod, 'MISPAR_POLISA');

        const branchCode = getElementText(prod, 'KodAnaf') ||
                           getElementText(prod, 'KodEnaf') ||
                           getElementText(prod, 'BranchCode');
        const productType = getElementText(prod, 'TeurAnaf') ||
                            getElementText(prod, 'TeurMutzar') ||
                            getElementText(prod, 'ShemMutzar') ||
                            getElementText(prod, 'ProductType') ||
                            getElementText(prod, 'TEUR_MUTZAR');
        const subDesc = getElementText(prod, 'TeurTochnit') ||
                        getElementText(prod, 'ShemTochnit') ||
                        getElementText(prod, 'PlanName');

        const premium = getElementNum(prod, 'Premia') ||
                        getElementNum(prod, 'SachPremia') ||
                        getElementNum(prod, 'TashlumChodshy') ||
                        getElementNum(prod, 'PREMIA');
        const deposit = getElementNum(prod, 'Hafkada') ||
                        getElementNum(prod, 'SachHafkada') ||
                        getElementNum(prod, 'HAFKADA');
        const accumulation = getElementNum(prod, 'Tzvirah') ||
                             getElementNum(prod, 'YitratCheshbon') ||
                             getElementNum(prod, 'Shovi') ||
                             getElementNum(prod, 'TZVIRAH');
        const track = getElementText(prod, 'Maslul') ||
                      getElementText(prod, 'ShemMaslul') ||
                      getElementText(prod, 'MASLUL');
        const mgmtFeeDeposit = getElementNum(prod, 'DmeiNihulHafkada') ||
                               getElementNum(prod, 'DmeiNihulMeHafkada');
        const mgmtFeeAccum = getElementNum(prod, 'DmeiNihulTzvirah') ||
                              getElementNum(prod, 'DmeiNihulMeTzvirah');

        const status = getElementText(prod, 'StatusPolisa') ||
                       getElementText(prod, 'Matzav') ||
                       getElementText(prod, 'Status');

        if (!company && !policyNumber && !productType) continue;

        // Avoid duplicates
        const isDupe = customerData.products.some(
          p => p.policyNumber && p.policyNumber === policyNumber && p.company === company
        );
        if (isDupe) continue;

        const category = detectCategory(productType, branchCode);
        const phase = (status === '1' || status === 'פעיל' || !status) ? 'פעיל' : 'לא פעיל';

        customerData.products.push({
          category,
          company,
          productType: productType || (category === 'כסף' ? 'חיסכון' : 'ביטוח'),
          subDescription: subDesc,
          policyNumber,
          monthlyPremium: category === 'ביטוח' ? premium : undefined,
          monthlyDeposit: category === 'כסף' ? (deposit || premium) : undefined,
          accumulation,
          track,
          managementFeeDeposit: mgmtFeeDeposit,
          managementFeeAccumulation: mgmtFeeAccum,
          phase,
        });
      }
    }
  }

  // Strategy 2: If no insured entities found, try flat record structure
  if (customersMap.size === 0) {
    const records = doc.querySelectorAll('Record, Row, record, row, Reshuma');
    for (const rec of records) {
      const idNumber = getElementText(rec, 'MisparZihuy') ||
                       getElementText(rec, 'TeulatZehut') ||
                       getElementText(rec, 'IdNumber') ||
                       getElementText(rec, 'ID');
      const firstName = getElementText(rec, 'ShemPrati') || getElementText(rec, 'FirstName');
      const lastName = getElementText(rec, 'ShemMishpacha') || getElementText(rec, 'LastName');
      const company = getElementText(rec, 'ShemHevra') || getElementText(rec, 'Company') ||
                      mapCompanyCode(getElementText(rec, 'KodHevra'));
      const policyNumber = getElementText(rec, 'MisparPolisa') || getElementText(rec, 'PolicyNumber');
      const productType = getElementText(rec, 'TeurMutzar') || getElementText(rec, 'ProductType');

      if (!idNumber && !firstName) continue;

      const key = idNumber || `${firstName}_${lastName}`;
      if (!customersMap.has(key)) {
        customersMap.set(key, {
          customer: {
            idNumber,
            firstName,
            lastName,
            fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
            source: 'מסלקה',
          },
          products: [],
        });
      }

      if (company || policyNumber || productType) {
        const branchCode = getElementText(rec, 'KodAnaf');
        const category = detectCategory(productType, branchCode);
        customersMap.get(key)!.products.push({
          category,
          company,
          productType: productType || (category === 'כסף' ? 'חיסכון' : 'ביטוח'),
          policyNumber,
          monthlyPremium: getElementNum(rec, 'Premia') || getElementNum(rec, 'Premium'),
          accumulation: getElementNum(rec, 'Tzvirah') || getElementNum(rec, 'Balance'),
          phase: 'פעיל',
        });
      }
    }
  }

  // Strategy 3: Brute-force — scan all elements for ID numbers and product info
  if (customersMap.size === 0) {
    // Try to extract any data from generic XML structure
    const allElements = doc.querySelectorAll('*');
    let currentId: string | undefined;
    let currentName: string | undefined;

    for (const el of allElements) {
      const tag = el.tagName;
      const text = el.textContent?.trim();
      if (!text) continue;

      // Look for ID numbers (9-digit Israeli ID)
      if (text.match(/^\d{9}$/) && (
        tag.includes('Zihuy') || tag.includes('Zehut') || tag.includes('Id') || tag.includes('ID')
      )) {
        currentId = text;
        if (!customersMap.has(currentId)) {
          customersMap.set(currentId, {
            customer: { idNumber: currentId, source: 'מסלקה' },
            products: [],
          });
        }
      }

      // Try to capture name
      if ((tag.includes('Shem') || tag.includes('Name')) && text.length > 1 && text.length < 50) {
        if (tag.includes('Prati') || tag.includes('First')) {
          if (currentId && customersMap.has(currentId)) {
            customersMap.get(currentId)!.customer.firstName = text;
          }
        } else if (tag.includes('Mishpacha') || tag.includes('Last')) {
          if (currentId && customersMap.has(currentId)) {
            customersMap.get(currentId)!.customer.lastName = text;
          }
        }
      }
    }
  }

  const customers = Array.from(customersMap.values());

  if (customers.length === 0) {
    return {
      fileType: 'clearing_house',
      customers: [],
      error: 'לא נמצאו נתוני לקוחות בקובץ XML. ייתכן שמבנה הקובץ אינו מוכר.',
    };
  }

  return { fileType: 'clearing_house', customers };
}

// ===== XLSX Parsers =====

function parseCustomersExport(wb: XLSX.WorkBook): ParseResult {
  const sheetName = wb.SheetNames.find(s => s === 'לקוחות') || wb.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }) as any[][];
  
  const headerIdx = findHeaderRow(sheet, ['שם פרטי', 'שם משפחה', 'מזהה', 'טלפון']);
  const colMap = getColumnMap(sheet[headerIdx] || []);
  
  const customers: Array<{ customer: ParsedCustomer; products: ParsedProduct[] }> = [];
  
  for (let i = headerIdx + 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (!row || row.every(c => !c)) continue;
    
    const idNumber = cleanStr(getVal(row, colMap, 'מספר מזהה', 'מזהה לקוח', 'תעודת זהות', 'ת.ז', 'ת"ז', 'מזהה'));
    const firstName = cleanStr(getVal(row, colMap, 'שם פרטי'));
    const lastName = cleanStr(getVal(row, colMap, 'שם משפחה'));
    const fullName = cleanStr(getVal(row, colMap, 'שם מלא', 'שם'));
    
    if (!idNumber && !firstName && !lastName && !fullName) continue;
    
    const customer: ParsedCustomer = {
      idNumber,
      firstName: firstName || (fullName ? fullName.split(' ')[0] : undefined),
      lastName: lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : undefined),
      fullName,
      mobilePhone: cleanStr(getVal(row, colMap, 'נייד', 'טלפון נייד', 'פלאפון', 'סלולרי', 'טלפון')),
      otherPhone: cleanStr(getVal(row, colMap, 'טלפון נוסף', 'טלפון בבית', 'טל בית')),
      email: cleanStr(getVal(row, colMap, 'דוא"ל', 'אימייל', 'מייל', 'email', 'דואל')),
      city: cleanStr(getVal(row, colMap, 'יישוב', 'עיר', 'ישוב')),
      street: cleanStr(getVal(row, colMap, 'רחוב', 'כתובת')),
      houseNumber: cleanStr(getVal(row, colMap, 'מספר בית', 'בית')),
      zipCode: cleanStr(getVal(row, colMap, 'מיקוד')),
      gender: cleanStr(getVal(row, colMap, 'מין', 'מגדר')),
      birthDate: cleanStr(getVal(row, colMap, 'תאריך לידה', 'ת. לידה')),
      maritalStatus: cleanStr(getVal(row, colMap, 'מצב משפחתי')),
      occupation: cleanStr(getVal(row, colMap, 'מקצוע', 'עיסוק')),
      employmentStatus: cleanStr(getVal(row, colMap, 'מצב תעסוקה', 'תעסוקה')),
      source: cleanStr(getVal(row, colMap, 'מקור')),
      status: cleanStr(getVal(row, colMap, 'סטטוס')),
      isConfidential: getVal(row, colMap, 'חסוי', 'לקוח חסוי') === true || getVal(row, colMap, 'חסוי') === 'כן',
      healthFund: cleanStr(getVal(row, colMap, 'קופת חולים')),
      internalNotes: cleanStr(getVal(row, colMap, 'הערות', 'הערה')),
    };
    
    customers.push({ customer, products: [] });
  }
  
  return { fileType: 'customers_export', customers };
}

function parseHbResults(wb: XLSX.WorkBook): ParseResult {
  const sheetName = wb.SheetNames.find(s => s === 'תיק ביטוחי') || wb.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 }) as any[][];
  
  const headerIdx = findHeaderRow(sheet, ['תעודת זהות', 'ענף', 'חברה', 'פוליסה']);
  const colMap = getColumnMap(sheet[headerIdx] || []);
  
  let idNumber: string | undefined;
  const products: ParsedProduct[] = [];
  
  for (let i = headerIdx + 1; i < sheet.length; i++) {
    const row = sheet[i];
    if (!row || row.every(c => !c)) continue;
    
    const rowId = cleanStr(getVal(row, colMap, 'תעודת זהות', 'ת.ז', 'מספר מזהה'));
    if (rowId && !idNumber) idNumber = rowId;
    if (rowId) idNumber = rowId;
    
    const company = cleanStr(getVal(row, colMap, 'חברה'));
    const productType = cleanStr(getVal(row, colMap, 'ענף ראשי', 'ענף'));
    const subType = cleanStr(getVal(row, colMap, 'ענף', 'סוג מוצר'));
    const policyNumber = cleanStr(getVal(row, colMap, 'מספר פוליסה', 'פוליסה'));
    const premium = cleanNum(getVal(row, colMap, 'פרמיה', 'פרמיה בש"ח'));
    
    if (!company && !productType && !policyNumber) continue;
    
    products.push({
      category: 'ביטוח',
      company,
      productType: productType || 'ביטוח',
      subDescription: subType !== productType ? subType : cleanStr(getVal(row, colMap, 'פרטים נוספים', 'סיווג תכנית')),
      policyNumber,
      monthlyPremium: premium,
      phase: 'פעיל',
      notes: cleanStr(getVal(row, colMap, 'פרטים נוספים', 'הערות')),
    });
  }
  
  // Try to find ID from sheet metadata or first rows
  if (!idNumber) {
    for (let i = 0; i < Math.min(sheet.length, 5); i++) {
      const row = sheet[i];
      if (row) {
        for (const cell of row) {
          const s = String(cell || '');
          const match = s.match(/\d{9}/);
          if (match) { idNumber = match[0]; break; }
        }
      }
      if (idNumber) break;
    }
  }
  
  return {
    fileType: 'hb_results',
    customers: [{ customer: { idNumber }, products }],
  };
}

function parseAgentReport(wb: XLSX.WorkBook): ParseResult {
  // Parse customer details
  const customerSheetName = wb.SheetNames.find(s => s === 'פרטי לקוח' || s.includes('פרטי')) || '';
  const customer: ParsedCustomer = {};
  
  if (customerSheetName) {
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[customerSheetName], { header: 1 }) as any[][];
    const kvMap: Record<string, string> = {};
    for (const row of sheet) {
      if (row && row[0] && row[1]) {
        kvMap[String(row[0]).trim()] = String(row[1]).trim();
      }
      if (row && row[2] && row[3]) {
        kvMap[String(row[2]).trim()] = String(row[3]).trim();
      }
    }
    
    const headerIdx = findHeaderRow(sheet, ['שם', 'מזהה', 'טלפון']);
    if (headerIdx >= 0 && sheet[headerIdx + 1]) {
      const colMap = getColumnMap(sheet[headerIdx]);
      const dataRow = sheet[headerIdx + 1];
      customer.firstName = cleanStr(getVal(dataRow, colMap, 'שם פרטי'));
      customer.lastName = cleanStr(getVal(dataRow, colMap, 'שם משפחה'));
      customer.idNumber = cleanStr(getVal(dataRow, colMap, 'מספר מזהה', 'ת.ז', 'תעודת זהות'));
      customer.mobilePhone = cleanStr(getVal(dataRow, colMap, 'נייד', 'טלפון', 'פלאפון'));
      customer.email = cleanStr(getVal(dataRow, colMap, 'מייל', 'דוא"ל', 'אימייל'));
    }
    
    for (const [key, val] of Object.entries(kvMap)) {
      if (!val || val === 'undefined') continue;
      if (key.includes('שם פרטי')) customer.firstName = val;
      else if (key.includes('שם משפחה')) customer.lastName = val;
      else if (key.includes('שם מלא')) customer.fullName = val;
      else if (key.includes('מזהה') || key.includes('ת.ז') || key.includes('תעודת זהות')) customer.idNumber = val;
      else if (key.includes('סוג') && key.includes('מזהה')) customer.idType = val;
      else if (key.includes('נייד') || key.includes('פלאפון') || key.includes('טלפון')) customer.mobilePhone = val;
      else if (key.includes('מייל') || key.includes('דוא')) customer.email = val;
      else if (key.includes('כתובת') || key.includes('רחוב')) customer.street = val;
      else if (key.includes('יישוב') || key.includes('עיר')) customer.city = val;
      else if (key.includes('מין') || key.includes('מגדר')) customer.gender = val;
      else if (key.includes('לידה')) customer.birthDate = val;
    }
  }
  
  const products: ParsedProduct[] = [];
  
  const savingsSheetName = wb.SheetNames.find(s => s.includes('חיסכון') || s.includes('כסף'));
  if (savingsSheetName) {
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[savingsSheetName], { header: 1 }) as any[][];
    const headerIdx = findHeaderRow(sheet, ['חברה', 'מוצר', 'פוליסה']);
    if (headerIdx >= 0) {
      const colMap = getColumnMap(sheet[headerIdx]);
      for (let i = headerIdx + 1; i < sheet.length; i++) {
        const row = sheet[i];
        if (!row || row.every(c => !c)) continue;
        const company = cleanStr(getVal(row, colMap, 'חברה', 'גוף מוסדי'));
        if (!company) continue;
        products.push({
          category: 'כסף',
          company,
          productType: cleanStr(getVal(row, colMap, 'סוג מוצר', 'מוצר', 'סוג')) || 'חיסכון',
          subDescription: cleanStr(getVal(row, colMap, 'תוכנית', 'שם תוכנית', 'תת סוג')),
          policyNumber: cleanStr(getVal(row, colMap, 'מספר פוליסה', 'מספר חשבון', 'פוליסה')),
          monthlyDeposit: cleanNum(getVal(row, colMap, 'הפקדה', 'הפקדה חודשית')),
          accumulation: cleanNum(getVal(row, colMap, 'צבירה', 'יתרה', 'שווי')),
          track: cleanStr(getVal(row, colMap, 'מסלול', 'מסלול השקעה')),
          managementFeeDeposit: cleanNum(getVal(row, colMap, 'דמ"נ הפקדה', 'דמי ניהול מהפקדה', 'ד.נ הפקדה')),
          managementFeeAccumulation: cleanNum(getVal(row, colMap, 'דמ"נ צבירה', 'דמי ניהול מצבירה', 'ד.נ צבירה')),
          phase: 'פעיל',
        });
      }
    }
  }
  
  const insuranceSheetName = wb.SheetNames.find(s => s.includes('ביטוח') && !s.includes('תיק'));
  if (insuranceSheetName) {
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[insuranceSheetName], { header: 1 }) as any[][];
    const headerIdx = findHeaderRow(sheet, ['חברה', 'מוצר', 'פוליסה', 'פרמיה']);
    if (headerIdx >= 0) {
      const colMap = getColumnMap(sheet[headerIdx]);
      for (let i = headerIdx + 1; i < sheet.length; i++) {
        const row = sheet[i];
        if (!row || row.every(c => !c)) continue;
        const company = cleanStr(getVal(row, colMap, 'חברה', 'גוף מוסדי'));
        if (!company) continue;
        products.push({
          category: 'ביטוח',
          company,
          productType: cleanStr(getVal(row, colMap, 'סוג מוצר', 'מוצר', 'ענף', 'סוג')) || 'ביטוח',
          subDescription: cleanStr(getVal(row, colMap, 'תוכנית', 'כיסוי', 'תת סוג')),
          policyNumber: cleanStr(getVal(row, colMap, 'מספר פוליסה', 'פוליסה')),
          monthlyPremium: cleanNum(getVal(row, colMap, 'פרמיה', 'פרמיה חודשית')),
          phase: 'פעיל',
          notes: cleanStr(getVal(row, colMap, 'הערות', 'פרטים')),
        });
      }
    }
  }
  
  return {
    fileType: 'agent_report',
    customers: [{ customer, products }],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fileName, fileBase64 } = body;

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: 'No file data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 to buffer
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const lowerFileName = (fileName || '').toLowerCase();
    const isXml = lowerFileName.endsWith('.xml');

    // Handle XML files (clearing house)
    if (isXml) {
      const decoder = new TextDecoder('utf-8');
      let xmlContent = decoder.decode(bytes);
      
      // Try windows-1255 / ISO-8859-8 if UTF-8 produces garbled text
      if (xmlContent.includes('�') || xmlContent.includes('\ufffd')) {
        // Attempt basic ISO-8859-8 decode for Hebrew
        const win1255Chars: string[] = [];
        for (const b of bytes) {
          if (b < 128) {
            win1255Chars.push(String.fromCharCode(b));
          } else if (b >= 0xC0 && b <= 0xDA) {
            // Windows-1255 Hebrew range
            win1255Chars.push(String.fromCharCode(0x05D0 + (b - 0xC0)));
          } else {
            win1255Chars.push(String.fromCharCode(b));
          }
        }
        xmlContent = win1255Chars.join('');
      }

      const result = parseClearingHouseXml(xmlContent);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse XLSX workbook
    const wb = XLSX.read(bytes, { type: 'array' });
    
    // Detect file type
    const fileType = detectFileType(fileName || '', wb.SheetNames);
    
    let result: ParseResult;
    
    switch (fileType) {
      case 'customers_export':
        result = parseCustomersExport(wb);
        break;
      case 'hb_results':
        result = parseHbResults(wb);
        break;
      case 'agent_report':
        result = parseAgentReport(wb);
        break;
      default:
        result = parseCustomersExport(wb);
        if (result.customers.length === 0) {
          result = parseHbResults(wb);
        }
        if (result.customers.length === 0) {
          result = { fileType: 'unknown', customers: [], error: 'לא ניתן לזהות את סוג הקובץ' };
        }
        break;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Parse error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Parse failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
