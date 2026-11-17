// Single source of truth for every public phone / WhatsApp / email on the site.
// Two departments, no personal names in visible UI: insurance matters reach the
// insurance desk, finance / management / everything else reach the general desk.
// (The addresses themselves contain first names by the owner's explicit choice:
// use them only as mailto hrefs, structured data and the contact page small print.)

export type ContactDept = "insurance" | "general";

export interface ContactInfo {
  phone: string;
  tel: string;
  wa: string;
  email: string;
}

export const CONTACTS: Record<ContactDept, ContactInfo> = {
  insurance: { phone: "052-7958970", tel: "+972527958970", wa: "972527958970", email: "Moshe@seeld.info" },
  general: { phone: "052-3097444", tel: "+972523097444", wa: "972523097444", email: "Shmulik@seeld.info" },
};

/** Generic public mailbox customers already know. Not a department address. */
export const GENERAL_MAILBOX = "info@seeld.co.il";

/** Department labels (UI text, no names). */
export const DEPT_LABEL: Record<ContactDept, string> = {
  insurance: "ביטוח",
  general: "פיננסים וכללי",
};

/** Department names as used in accessible names ("התקשרו לצוות ...").  */
export const DEPT_TEAM: Record<ContactDept, string> = {
  insurance: "צוות הביטוח",
  general: "צוות הפיננסים והכללי",
};

const INSURANCE_TOPICS = new Set([
  "insurance", "insurances", "travel", "life", "health", "vehicle", "car", "home", "apartment", "business",
  "nursing", "mortgage", "disability", "critical-illness", "accidents", "personal_accidents",
  "dental", "foreign_workers", "foreign-workers", "partners_risk", "renters", "wellness",
]);

/**
 * Which desk should a path, topic key or lead subject reach?
 * - /insurance/* (and /insurances, /travel) paths, insurance-type topics and
 *   Hebrew subjects that mention insurance or travel -> insurance
 * - finance, savings, pension, management and everything else -> general
 */
export function contactFor(pathOrTopic?: string | null): ContactDept {
  if (!pathOrTopic) return "general";
  const raw = String(pathOrTopic).trim();
  if (raw.startsWith("/")) {
    const p = raw.split(/[?#]/)[0].toLowerCase();
    if (/^\/(insurance|insurances|travel)(\/|$)/.test(p)) return "insurance";
    return "general";
  }
  const key = raw.toLowerCase();
  if (INSURANCE_TOPICS.has(key)) return "insurance";
  if (/ביטוח|נסיעות|נסיעה/.test(raw)) return "insurance";
  return "general";
}

export const contactInfoFor = (pathOrTopic?: string | null): ContactInfo => CONTACTS[contactFor(pathOrTopic)];

export const telHref = (c: ContactInfo) => `tel:${c.tel}`;
export const waHref = (c: ContactInfo) => `https://wa.me/${c.wa}`;
export const mailHref = (c: ContactInfo) => `mailto:${c.email}`;

/** Plain-text fallback line for toasts and error messages (route-agnostic general desk). */
export const GENERAL_PHONE = CONTACTS.general.phone;
