import { useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

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
      {/* Tiny button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-40 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
          "opacity-40 hover:opacity-100 border border-border/30"
        )}
        aria-label="הגדרות נגישות"
        title="נגישות"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-6 z-40 w-56 bg-card rounded-xl shadow-lg border border-border p-4 animate-scale-in">
          <h3 className="font-semibold text-sm mb-3 text-right">נגישות</h3>
          
          {/* Font size */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              <button
                onClick={() => updateFontSize(-10)}
                className="w-7 h-7 rounded bg-muted hover:bg-muted/80 text-xs font-bold"
              >
                א-
              </button>
              <button
                onClick={() => updateFontSize(10)}
                className="w-7 h-7 rounded bg-muted hover:bg-muted/80 text-xs font-bold"
              >
                א+
              </button>
            </div>
            <span className="text-xs text-muted-foreground">גודל טקסט</span>
          </div>

          {/* High contrast */}
          <button
            onClick={toggleHighContrast}
            className={cn(
              "w-full text-right text-xs py-2 px-3 rounded mb-2 transition-colors",
              settings.highContrast ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            ניגודיות גבוהה
          </button>

          {/* Reduced motion */}
          <button
            onClick={toggleReducedMotion}
            className={cn(
              "w-full text-right text-xs py-2 px-3 rounded mb-3 transition-colors",
              settings.reducedMotion ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            הפחתת אנימציות
          </button>

          {/* Reset */}
          <button
            onClick={resetAll}
            className="w-full text-center text-xs py-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            איפוס
          </button>
        </div>
      )}
    </>
  );
};

export default AccessibilityButton;
