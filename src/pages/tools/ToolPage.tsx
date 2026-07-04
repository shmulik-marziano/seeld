import { ReactNode } from "react";
import { getToolBySlug, type Tool } from "@/config/tools";
import { Clock, Sparkles } from "lucide-react";

interface ToolPageProps {
  slug: string;
  children?: ReactNode;
}

export default function ToolPage({ slug, children }: ToolPageProps) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] p-12 text-center">
          <p className="text-gray-500 text-lg">הכלי לא נמצא</p>
        </div>
      </div>
    );
  }

  if (tool.status === "planned") {
    return (
      <div className="min-h-screen bg-[#fafafa]" dir="rtl">
        <ToolHeader tool={tool} />
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="bg-white rounded-2xl shadow-sm border border-[#171717]/[0.06] p-16 text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${tool.gradient[0]}20, ${tool.gradient[1]}20)` }}
            >
              <Clock className="w-10 h-10" style={{ color: tool.color }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">בקרוב...</h2>
            <p className="text-gray-500 text-lg mb-2">{tool.description}</p>
            <p className="text-sm text-gray-400">הכלי בפיתוח ויושק בקרוב. הישארו מעודכנים!</p>
            <div
              className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium"
              style={{ background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})` }}
            >
              <Clock className="w-4 h-4" />
              מתוכנן לשחרור
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]" dir="rtl">
      <ToolHeader tool={tool} />
      <div className="max-w-7xl mx-auto px-6 py-6">{children}</div>
    </div>
  );
}

function ToolHeader({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})` }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white/10" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{tool.hebrewName}</h1>
              <span className="text-white/60 text-sm font-medium">{tool.name}</span>
              {tool.status === "new" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" />
                  Beta
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm mt-1">{tool.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ToolPage };
