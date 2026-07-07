import { useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONO, CARD_SHADOW, RING, FAINT, LINE } from "@/lib/brand";

const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
  });

  const updateFontSize = (delta: number) => {
    const newSize = Math.max(80, Math.min(150, settings.fontSize + delta));
    setSettings((prev) => ({ ...prev, fontSize: newSize }));
    document.documentElement.style.fontSize = `${newSize}%`;
  };

  const toggleHighContrast = () => {
    const newValue = !settings.highContrast;
    setSettings((prev) => ({ ...prev, highContrast: newValue }));
    document.documentElement.classList.toggle("high-contrast", newValue);
  };

  const toggleReducedMotion = () => {
    const newValue = !settings.reducedMotion;
    setSettings((prev) => ({ ...prev, reducedMotion: newValue }));
    document.documentElement.classList.toggle("reduced-motion", newValue);
  };

  const resetAll = () => {
    setSettings({ fontSize: 100, highContrast: false, reducedMotion: false });
    document.documentElement.style.fontSize = "100%";
    document.documentElement.classList.remove("high-contrast", "reduced-motion");
  };

  return (
    <>
      {/* Quiet launcher — white circle, hairline ring, ink glyph */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5c5c5c] opacity-60 transition-all duration-200 hover:opacity-100 hover:text-[#171717]"
        style={{ boxShadow: RING }}
        aria-label="הגדרות נגישות"
        aria-expanded={isOpen}
        title="נגישות"
      >
        <Eye className="h-4 w-4" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-[68px] right-6 z-40 w-60 rounded-lg bg-white p-4"
          style={{ boxShadow: CARD_SHADOW }}
          role="group"
          aria-label="הגדרות נגישות"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-[#171717]">נגישות</h3>
            <span
              className="text-[10px] font-medium tracking-[0.12em]"
              style={{ fontFamily: MONO, color: FAINT }}
              dir="ltr"
            >
              A11Y
            </span>
          </div>

          {/* Font size */}
          <div className="flex items-center justify-between border-t py-3" style={{ borderColor: LINE }}>
            <div className="flex gap-1.5">
              <button
                onClick={() => updateFontSize(-10)}
                aria-label="הקטנת גודל טקסט"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#ebebeb] bg-white text-[13px] font-medium text-[#171717] transition-colors duration-150 hover:border-[#171717]"
              >
                א-
              </button>
              <button
                onClick={() => updateFontSize(10)}
                aria-label="הגדלת גודל טקסט"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#ebebeb] bg-white text-[13px] font-medium text-[#171717] transition-colors duration-150 hover:border-[#171717]"
              >
                א+
              </button>
            </div>
            <span className="text-[14px] text-[#4d4d4d]">גודל טקסט</span>
          </div>

          {/* High contrast */}
          <button
            onClick={toggleHighContrast}
            aria-pressed={settings.highContrast}
            className={cn(
              "mb-2 w-full rounded-md border px-3 py-2 text-right text-[14px] font-medium transition-colors duration-150",
              settings.highContrast
                ? "border-[#171717] bg-[#171717] text-white"
                : "border-[#ebebeb] bg-white text-[#171717] hover:border-[#171717]"
            )}
          >
            ניגודיות גבוהה
          </button>

          {/* Reduced motion */}
          <button
            onClick={toggleReducedMotion}
            aria-pressed={settings.reducedMotion}
            className={cn(
              "mb-3 w-full rounded-md border px-3 py-2 text-right text-[14px] font-medium transition-colors duration-150",
              settings.reducedMotion
                ? "border-[#171717] bg-[#171717] text-white"
                : "border-[#ebebeb] bg-white text-[#171717] hover:border-[#171717]"
            )}
          >
            הפחתת אנימציות
          </button>

          {/* Reset */}
          <button
            onClick={resetAll}
            className="w-full border-t pt-2.5 text-center text-[13px] text-[#6e6e6e] transition-colors duration-150 hover:text-[#171717]"
            style={{ borderColor: LINE }}
          >
            איפוס
          </button>
        </div>
      )}
    </>
  );
};

export default AccessibilityButton;
