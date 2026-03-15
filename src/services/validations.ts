import { z } from 'zod';
import { supplementaryByFund } from '../data/health-funds';
import { Customer, Recommendation, Product } from '../types';

export const customerBasicSchema = z.object({
  firstName: z.string().min(1, 'שם פרטי חובה').max(50),
  lastName: z.string().min(1, 'שם משפחה חובה').max(50),
  idNumber: z.string().min(1, 'מספר מזהה חובה').max(20),
  mobilePhone: z.string().regex(/^05\d{7,8}$/, 'מספר טלפון נייד לא תקין'),
});

export const productSchema = z.object({
  category: z.enum(['כסף', 'ביטוח']),
  company: z.string().min(1, 'חברה חובה'),
  productType: z.string().min(1, 'סוג מוצר חובה'),
  monthlyPremium: z.number().min(0, 'פרמיה חייבת להיות חיובית').optional().nullable(),
  accumulation: z.number().min(0, 'צבירה חייבת להיות חיובית').optional().nullable(),
  managementFeeDeposit: z.number().min(0).max(10).optional().nullable(),
  managementFeeAccumulation: z.number().min(0).max(5).optional().nullable(),
});

export const recommendationSchema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  rationale: z.string().min(1, 'נימוק חובה'),
  actionType: z.enum(['החלפה', 'שדרוג', 'הוספה', 'שמירה', 'ביטול', 'איחוד', 'קביעת פגישה']),
});

export function validateHealthFund(healthFund?: string, supplementary?: string): string[] {
  const errors: string[] = [];
  if (supplementary && !healthFund) {
    errors.push('לא ניתן לבחור ביטוח משלים ללא קופת חולים');
  }
  if (healthFund && !supplementary) {
    errors.push('יש לבחור סוג ביטוח משלים');
  }
  if (healthFund && supplementary) {
    const valid = supplementaryByFund[healthFund];
    if (!valid?.includes(supplementary)) {
      errors.push('ביטוח משלים לא תואם לקופת החולים שנבחרה');
    }
  }
  return errors;
}

export function validateExecutionReadiness(
  customer: Customer,
  recommendation: Recommendation,
  product?: Product
): string[] {
  const missing: string[] = [];
  if (product?.category === 'כסף' && ['החלפה', 'הוספה', 'איחוד'].includes(recommendation.actionType)) {
    if (!customer.bank) missing.push('בנק');
    if (!customer.accountNumber) missing.push('מספר חשבון');
    if (customer.taxResident === undefined) missing.push('תושבות מס');
  }
  if (product?.category === 'ביטוח' && ['החלפה', 'שדרוג'].includes(recommendation.actionType)) {
    if (!customer.healthFund) missing.push('קופת חולים');
    if (customer.height === undefined) missing.push('גובה');
    if (customer.weight === undefined) missing.push('משקל');
  }
  return missing;
}
