// Cover art for blog posts and articles.
//
// STYLESEED bans stock photography. Posts whose cover is a stock photo (the
// early ones point at Unsplash) get the kit illustration that matches their
// category instead; a post with its own real image keeps it.
import type { IllustrationName } from "@/components/brand/Illustration";

const STOCK_HOSTS = /(^|\.)(unsplash\.com|pexels\.com|pixabay\.com|shutterstock\.com|istockphoto\.com)\b/i;

export const isStockPhoto = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    return STOCK_HOSTS.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** The kit illustration that stands for a content category (kit p.11 map). */
export const illustrationForCategory = (category: string | null | undefined): IllustrationName => {
  const c = (category ?? "").trim();
  if (/פרישה|פנסיה|קצבה/.test(c)) return "04-retirement-horizon";
  if (/חיסכון|השקע|תקציב|גמל|השתלמות/.test(c)) return "03-saving-growth";
  if (/בריאות|חיים|משפחה|סיעוד|כושר/.test(c)) return "02-family-protection";
  if (/רכב|דירה|נסיעות|עסק|רכוש/.test(c)) return "01-journey";
  if (/מסמכ|טפסים|שירות|זכויות/.test(c)) return "06-documents-service";
  return "05-clarity-decisions";
};
