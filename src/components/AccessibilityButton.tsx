import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/components/sd/chrome.css";
import { CARD_SHADOW, LINE, GREEN, BODY, MUTED } from "@/lib/brand";

const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
  });

  // Opened from the mobile drawer (the floating launcher is hidden on phones), closed with Escape.
  useEffect(() => {
    const open = () => setIsOpen(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("seeld:open-a11y", open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("seeld:open-a11y", open);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

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
      active ? "border-[#203957] bg-[#203957] text-[#FAF7EF]" : "border-[#D9DEE4] bg-white text-[#203957] hover:border-[#203957]",
    );

  return (
    <aside aria-label="נגישות">
      {/* Quiet launcher — white circle, hairline ring, green glyph */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sd-chrome-fab sd-chrome-fab-a11y"
        aria-label="הגדרות נגישות"
        aria-expanded={isOpen}
        title="נגישות"
      >
        <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="sd-chrome-a11y-panel"
          style={{ boxShadow: CARD_SHADOW, borderColor: LINE }}
          role="group"
          aria-label="הגדרות נגישות"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[16px]" style={{ color: GREEN }}>נגישות</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="סגירת הגדרות נגישות"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#203957]"
            >
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          {/* Font size */}
          <div className="flex items-center justify-between border-t py-3" style={{ borderColor: LINE }}>
            <div className="flex gap-1.5">
              <button
                onClick={() => updateFontSize(-10)}
                aria-label="א-, הקטנת גודל טקסט"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9DEE4] bg-white text-[15px] font-bold text-[#203957] transition-colors duration-150 hover:border-[#203957]"
              >
                א-
              </button>
              <button
                onClick={() => updateFontSize(10)}
                aria-label="א+, הגדלת גודל טקסט"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9DEE4] bg-white text-[15px] font-bold text-[#203957] transition-colors duration-150 hover:border-[#203957]"
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
            className="mt-1 w-full border-t pt-3 text-center text-[14px] font-bold transition-colors duration-150 hover:text-[#203957] min-h-[40px]"
            style={{ borderColor: LINE, color: MUTED }}
          >
            איפוס
          </button>
        </div>
      )}
    </aside>
  );
};

export default AccessibilityButton;
