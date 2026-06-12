import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Israeli phone: 05X-XXXXXXX mobile (10 digits) or 0X-XXXXXXX landline (9 digits). Ignores spaces/dashes. */
export function isValidIsraeliPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^0(5\d{8}|[2-4789]\d{7})$/.test(digits);
}
