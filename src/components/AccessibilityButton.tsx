import { useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD_SHADOW, RING, LINE, GREEN, BODY, MUTED } from "@/lib/brand";

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

  const optionClass = (active: boolean) =>
    cn(
      "mb-2 w-full rounded-lg border px-3 py-2.5 text-right text-[15px] font-bold transition-colors duration-150 min-h-[44px]",
      active ? "border-[#003D30] bg-[#003D30] text-[#FAF7EF]" : "border-[#CCD6CC] bg-white text-[#003D30] hover:border-[#003D30]",
    );

  return (
    <>
      {/* Quiet launcher — white circle, hairline ring, green glyph */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 sm:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#476356] opacity-80 transition-all duration-200 hover:opacity-100 hover:text-[#003D30] focus-visible:opacity-100"
        style={{ boxShadow: RING, bottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}
        aria-label="הגדרות נגישות"
        aria-expanded={isOpen}
        title="נגישות"
      >
        <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed right-4 sm:right-6 z-40 w-64 max-w-[calc(100vw-32px)] rounded-2xl bg-white p-4 border"
          style={{ boxShadow: CARD_SHADOW, borderColor: LINE, bottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
          role="group"
          aria-label="הגדרות נגישות"
        >
          <div className="mb-3">
            <h3 className="text-[16px]" style={{ color: GREEN }}>נגישות</h3>
          </div>

          {/* Font size */}
          <div className="flex items-center justify-between border-t py-3" style={{ borderColor: LINE }}>
            <div className="flex gap-1.5">
              <button
                onClick={() => updateFontSize(-10)}
                aria-label="הקטנת גודל טקסט"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#CCD6CC] bg-white text-[15px] font-bold text-[#003D30] transition-colors duration-150 hover:border-[#003D30]"
              >
                א-
              </button>
              <button
                onClick={() => updateFontSize(10)}
                aria-label="הגדלת גודל טקסט"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#CCD6CC] bg-white text-[15px] font-bold text-[#003D30] transition-colors duration-150 hover:border-[#003D30]"
              >
                א+
              </button>
            </div>
            <span className="text-[15px]" style={{ color: BODY }}>גודל טקסט</span>
          </div>

          {/* High contrast */}
          <button onClick={toggleHighContrast} aria-pressed={settings.highContrast} className={optionClass(settings.highContrast)}>
            ניגודיות גבוהה
          </button>

          {/* Reduced motion */}
          <button onClick={toggleReducedMotion} aria-pressed={settings.reducedMotion} className={optionClass(settings.reducedMotion)}>
            הפחתת אנימציות
          </button>

          {/* Reset */}
          <button
            onClick={resetAll}
            className="mt-1 w-full border-t pt-3 text-center text-[14px] font-bold transition-colors duration-150 hover:text-[#003D30] min-h-[40px]"
            style={{ borderColor: LINE, color: MUTED }}
          >
            איפוס
          </button>
        </div>
      )}
    </>
  );
};

export default AccessibilityButton;
