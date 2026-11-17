import { ReactNode } from "react";
import { getToolBySlug, type Tool } from "@/config/tools";
import { Clock, Sparkles } from "lucide-react";
import { SdPic, useSdFont } from "@/components/sd/primitives";
import "./tool-kit.css";

interface ToolPageProps {
  slug: string;
  children?: ReactNode;
}

/** Kit skin per phase: pastel tone + illustration (decorative). */
const PHASE_SKIN: Record<number, { tone: string; art: string }> = {
  1: { tone: "sky", art: "01-hero" },
  2: { tone: "butter", art: "10-financial-planning" },
  3: { tone: "sage", art: "11-claims-service" },
  4: { tone: "rose", art: "02-family-protection" },
  5: { tone: "lavender", art: "04-investments-growth" },
};

function skinOf(tool?: Tool) {
  return PHASE_SKIN[tool?.phase ?? 3] ?? PHASE_SKIN[3];
}

export default function ToolPage({ slug, children }: ToolPageProps) {
  useSdFont();
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="sd-tool sd-tool-sage" dir="rtl">
        <div className="sd-tool-empty">
          <SdPic name="11-claims-service" sizes="320px" className="sd-tool-empty-art" />
          <h2>הכלי לא נמצא</h2>
          <p>בדקו את הקישור או חזרו לרשימת הכלים.</p>
        </div>
      </div>
    );
  }

  const skin = skinOf(tool);

  if (tool.status === "planned") {
    return (
      <div className={`sd-tool sd-tool-${skin.tone}`} dir="rtl">
        <ToolHeader tool={tool} />
        <div className="sd-tool-body">
          <div className="sd-tool-empty">
            <SdPic name={skin.art} sizes="320px" className="sd-tool-empty-art" />
            <h2>בקרוב</h2>
            <p>{tool.description}</p>
            <p style={{ fontSize: 15 }}>הכלי בפיתוח ויושק בקרוב.</p>
            <span className="sd-tool-soon">
              <Clock className="w-4 h-4" aria-hidden="true" />
              מתוכנן לשחרור
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`sd-tool sd-tool-${skin.tone}`} dir="rtl">
      <ToolHeader tool={tool} />
      <div className="sd-tool-body">{children}</div>
    </div>
  );
}

function ToolHeader({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const skin = skinOf(tool);
  return (
    <header className="sd-tool-head">
      <div className="sd-tool-head-in">
        <div className="sd-tool-icon">
          <Icon className="w-7 h-7" aria-hidden="true" />
        </div>
        <div>
          <span className="sd-tool-eyebrow">{tool.phaseLabel}</span>
          <h1 className="sd-tool-title">
            {tool.hebrewName}
            <small>{tool.name}</small>
            {tool.status === "new" && (
              <span className="sd-tool-badge">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Beta
              </span>
            )}
          </h1>
          <p className="sd-tool-desc">{tool.description}</p>
        </div>
      </div>
      <SdPic name={skin.art} sizes="200px" className="sd-tool-art" />
    </header>
  );
}

export { ToolPage };
