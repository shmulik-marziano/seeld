import { ArrowUpLeft } from "lucide-react";

interface ArticleCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  size?: "small" | "large";
}

const ArticleCard = ({ id, title, category, date, image, size = "small" }: ArticleCardProps) => {
  const getCategoryClass = (cat: string) => {
    const normalized = cat.toLowerCase();
    if (normalized.includes("פיננס") || normalized.includes("financ")) return "tag-financing";
    if (normalized.includes("אורח חיים") || normalized.includes("lifestyle")) return "tag-lifestyle";
    if (normalized.includes("קהילה") || normalized.includes("community")) return "tag-community";
    if (normalized.includes("בריאות") || normalized.includes("wellness")) return "tag-wellness";
    if (normalized.includes("טיולים") || normalized.includes("travel")) return "tag-travel";
    if (normalized.includes("יצירתיות") || normalized.includes("creativ")) return "tag-creativity";
    if (normalized.includes("צמיחה") || normalized.includes("growth")) return "tag-growth";
    return "tag-lifestyle";
  };

  return (
    <a
      href={`/article/${id}`}
      className={`group relative block rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] hover:-translate-y-1 ${
        size === "large" ? "col-span-1 md:col-span-2 row-span-2" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-[2rem]">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
          {/* Top section - Category and Date */}
          <div className="flex items-start justify-between">
            <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-md ${getCategoryClass(category)} bg-opacity-80`}>
              {category}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/20">
              {date}
            </span>
          </div>

          {/* Bottom section - Title and Arrow */}
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white text-lg md:text-xl lg:text-2xl font-bold leading-tight tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Arrow button */}
        <div className="absolute bottom-5 left-5 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300">
          <ArrowUpLeft className="w-4 h-4" />
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;
