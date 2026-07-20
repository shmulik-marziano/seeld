export interface Company {
  name: string;
  slug: string;
  color: string;
  initial: string;
  /** Official brand logo, served from public/logos */
  logo: string;
}

export const COMPANIES: Company[] = [
  { name: "הראל", slug: "harel", color: "#0077B6", initial: "ה", logo: "/logos/harel.svg" },
  { name: "מנורה מבטחים", slug: "menora", color: "#6C63FF", initial: "מ", logo: "/logos/menora.png" },
  { name: "מגדל", slug: "migdal", color: "#1B3A5C", initial: "מ", logo: "/logos/migdal.png" },
  { name: "כלל", slug: "clal", color: "#2A9D8F", initial: "כ", logo: "/logos/clal.svg" },
  { name: "איילון", slug: "ayalon", color: "#E07A00", initial: "א", logo: "/logos/ayalon.svg" },
  { name: "הפניקס", slug: "phoenix", color: "#E76F51", initial: "ה", logo: "/logos/phoenix.svg" },
  { name: "מיטב", slug: "meitav", color: "#B8860B", initial: "מ", logo: "/logos/meitav.png" },
  { name: "מור", slug: "mor", color: "#5B8C5A", initial: "מ", logo: "/logos/mor.svg" },
  { name: "ילין לפידות", slug: "yelin", color: "#4A6FA5", initial: "י", logo: "/logos/yelin.png" },
  { name: "אנליסט", slug: "analyst", color: "#7B68EE", initial: "א", logo: "/logos/analyst.svg" },
  { name: "אינפיניטי", slug: "infinity", color: "#20B2AA", initial: "א", logo: "/logos/infinity.png" },
  { name: "אלטשולר שחם", slug: "altshuler", color: "#CD5C5C", initial: "א", logo: "/logos/altshuler.png" },
  { name: "פאספורטקארד", slug: "passportcard", color: "#4682B4", initial: "פ", logo: "/logos/passportcard.png" },
  { name: "הכשרה", slug: "hachshara", color: "#8B4513", initial: "ה", logo: "/logos/hachshara.png" },
];
