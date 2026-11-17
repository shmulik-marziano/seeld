import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display-only: some feed names arrive with stray asterisk footnote marks ("***") before or after the fund name. */
export const cleanFundName = (name: string | null | undefined): string =>
  (name ?? "").replace(/\*+/g, "").replace(/\s{2,}/g, " ").trim();
