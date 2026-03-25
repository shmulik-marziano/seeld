export interface Company {
  name: string;
  slug: string;
  color: string;
  initial: string;
}

export const COMPANIES: Company[] = [
  { name: "הראל", slug: "harel", color: "#0077B6", initial: "ה" },
  { name: "מנורה מבטחים", slug: "menora", color: "#6C63FF", initial: "מ" },
  { name: "מגדל", slug: "migdal", color: "#1B3A5C", initial: "מ" },
  { name: "כלל", slug: "clal", color: "#2A9D8F", initial: "כ" },
  { name: "איילון", slug: "ayalon", color: "#E07A00", initial: "א" },
  { name: "הפניקס", slug: "phoenix", color: "#E76F51", initial: "ה" },
  { name: "מיטב", slug: "meitav", color: "#B8860B", initial: "מ" },
  { name: "מור", slug: "mor", color: "#5B8C5A", initial: "מ" },
  { name: "ילין לפידות", slug: "yelin", color: "#4A6FA5", initial: "י" },
  { name: "אנליסט", slug: "analyst", color: "#7B68EE", initial: "א" },
  { name: "אינפיניטי", slug: "infinity", color: "#20B2AA", initial: "א" },
  { name: "אלטשולר שחם", slug: "altshuler", color: "#CD5C5C", initial: "א" },
  { name: "פאספורטקארד", slug: "passportcard", color: "#4682B4", initial: "פ" },
  { name: "הכשרה", slug: "hachshara", color: "#8B4513", initial: "ה" },
];
