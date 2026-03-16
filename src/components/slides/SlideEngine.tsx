import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, Maximize2, Download, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { SlideThemeProvider, DEFAULT_THEME, lightenColor, type SlideTheme } from './SlideTheme';

const SLIDE_W = 1920;
const SLIDE_H = 1080;

// ─── Scaled slide container ────────────────────────────────────────
export function ScaledSlide({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / SLIDE_W, height / SLIDE_H));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full h-full overflow-hidden', containerClassName)}>
      <div
        className={cn('absolute origin-center', className)}
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          left: '50%',
          top: '50%',
          marginLeft: -SLIDE_W / 2,
          marginTop: -SLIDE_H / 2,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Slide layout wrapper ──────────────────────────────────────────
export function SlideLayout({
  children,
  className,
  background = 'bg-white',
}: {
  children: React.ReactNode;
  className?: string;
  background?: string;
}) {
  return (
    <div className={cn('w-[1920px] h-[1080px] p-16 flex flex-col', background, className)}>
      {children}
    </div>
  );
}

// ─── Slide data type ───────────────────────────────────────────────
export interface SlideData {
  id: string;
  render: () => React.ReactNode;
}

// ─── Theme Settings Panel ──────────────────────────────────────────
function ThemeSettingsPanel({
  theme,
  onChange,
  onClose,
}: {
  theme: SlideTheme;
  onChange: (t: SlideTheme) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-lg border-r border-white/10 z-10 flex flex-col text-white overflow-y-auto" dir="rtl">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-bold text-sm">הגדרות תבנית</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-5 text-sm">
        {/* Colors */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">צבעים</h4>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs">צבע ראשי</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={e => onChange({
                  ...theme,
                  primaryColor: e.target.value,
                  primaryColorLight: lightenColor(e.target.value),
                })}
                className="w-8 h-8 rounded cursor-pointer border border-white/20"
              />
              <Input
                value={theme.primaryColor}
                onChange={e => onChange({
                  ...theme,
                  primaryColor: e.target.value,
                  primaryColorLight: lightenColor(e.target.value),
                })}
                className="h-8 bg-white/10 border-white/20 text-white text-xs font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs">צבע דגש</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={theme.accentColor}
                onChange={e => onChange({ ...theme, accentColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-white/20"
              />
              <Input
                value={theme.accentColor}
                onChange={e => onChange({ ...theme, accentColor: e.target.value })}
                className="h-8 bg-white/10 border-white/20 text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Preset palettes */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">פלטות מוכנות</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { primary: '#3d6b4f', accent: '#c8892e', label: 'ברירת מחדל' },
                { primary: '#1e40af', accent: '#f59e0b', label: 'כחול-זהב' },
                { primary: '#7c3aed', accent: '#06b6d4', label: 'סגול-טורקיז' },
                { primary: '#dc2626', accent: '#111827', label: 'אדום-שחור' },
                { primary: '#0f766e', accent: '#ea580c', label: 'טיל-כתום' },
                { primary: '#111827', accent: '#3b82f6', label: 'כהה-כחול' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => onChange({
                    ...theme,
                    primaryColor: p.primary,
                    primaryColorLight: lightenColor(p.primary),
                    accentColor: p.accent,
                  })}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs hover:bg-white/10 transition-colors border border-white/10"
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: p.primary }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: p.accent }} />
                  <span className="text-white/70">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">לוגו</h4>
          <div className="flex items-center justify-between">
            <Label className="text-white/80 text-xs">הצג לוגו</Label>
            <Switch
              checked={theme.showLogo}
              onCheckedChange={v => onChange({ ...theme, showLogo: v })}
            />
          </div>
          {theme.showLogo && theme.logoUrl && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
              <img src={theme.logoUrl} alt="Agency logo" className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1" />
              <span className="text-xs text-white/60">לוגו סוכנות</span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider">טקסט</h4>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs">שם סוכנות</Label>
            <Input
              value={theme.agencyName}
              onChange={e => onChange({ ...theme, agencyName: e.target.value })}
              className="h-8 bg-white/10 border-white/20 text-white text-xs"
              placeholder="SEELD"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs">כותרת ראשית (שקף פתיחה)</Label>
            <Input
              value={theme.titleOverride || ''}
              onChange={e => onChange({ ...theme, titleOverride: e.target.value || undefined })}
              className="h-8 bg-white/10 border-white/20 text-white text-xs"
              placeholder="אוטומטי"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs">תת-כותרת (שקף פתיחה)</Label>
            <Input
              value={theme.subtitleOverride || ''}
              onChange={e => onChange({ ...theme, subtitleOverride: e.target.value || undefined })}
              className="h-8 bg-white/10 border-white/20 text-white text-xs"
              placeholder="אוטומטי"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80 text-xs">טקסט פוטר</Label>
            <Input
              value={theme.footerText}
              onChange={e => onChange({ ...theme, footerText: e.target.value })}
              className="h-8 bg-white/10 border-white/20 text-white text-xs"
              placeholder="שם הסוכנות (ברירת מחדל)"
            />
          </div>
        </div>

        {/* Reset */}
        <div className="pt-2 border-t border-white/10">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => onChange({
              ...DEFAULT_THEME,
              logoUrl: theme.logoUrl,
              agencyName: theme.agencyName,
            })}
          >
            איפוס לברירת מחדל
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Presentation viewer ───────────────────────────────────────────
export interface AgencyBranding {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

interface PresentationViewerProps {
  slides: SlideData[];
  open: boolean;
  onClose: () => void;
  title?: string;
  agencyBranding?: AgencyBranding;
}

export function PresentationViewer({ slides, open, onClose, title, agencyBranding }: PresentationViewerProps) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize theme from agency branding
  const [theme, setTheme] = useState<SlideTheme>(() => {
    const primary = agencyBranding?.primaryColor || DEFAULT_THEME.primaryColor;
    return {
      ...DEFAULT_THEME,
      primaryColor: primary,
      primaryColorLight: lightenColor(primary),
      accentColor: agencyBranding?.accentColor || DEFAULT_THEME.accentColor,
      agencyName: agencyBranding?.name || DEFAULT_THEME.agencyName,
      logoUrl: agencyBranding?.logoUrl,
    };
  });

  // Update theme if branding changes
  useEffect(() => {
    if (!agencyBranding) return;
    setTheme(prev => ({
      ...prev,
      agencyName: agencyBranding.name || prev.agencyName,
      logoUrl: agencyBranding.logoUrl || prev.logoUrl,
      primaryColor: agencyBranding.primaryColor || prev.primaryColor,
      primaryColorLight: lightenColor(agencyBranding.primaryColor || prev.primaryColor),
      accentColor: agencyBranding.accentColor || prev.accentColor,
    }));
  }, [agencyBranding?.name, agencyBranding?.logoUrl, agencyBranding?.primaryColor, agencyBranding?.accentColor]);

  const goNext = useCallback(() => setCurrent(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrent(i => Math.max(i - 1, 0)), []);

  const exportToPdf = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    toast.info('מייצא מצגת ל-PDF...', { duration: 2000 });

    try {
      const [html2canvas, { jsPDF }] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf'),
      ]);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [SLIDE_W, SLIDE_H] });

      const offscreen = document.createElement('div');
      offscreen.style.cssText = `position:fixed;left:-9999px;top:0;width:${SLIDE_W}px;height:${SLIDE_H}px;overflow:hidden;z-index:-1;`;
      offscreen.dir = 'rtl';
      document.body.appendChild(offscreen);

      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], 'landscape');

        const { createRoot } = await import('react-dom/client');
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `width:${SLIDE_W}px;height:${SLIDE_H}px;`;
        offscreen.innerHTML = '';
        offscreen.appendChild(wrapper);

        const root = createRoot(wrapper);
        await new Promise<void>(resolve => {
          root.render(
            <React.StrictMode>
              <SlideThemeProvider theme={theme}>
                {slides[i].render()}
              </SlideThemeProvider>
            </React.StrictMode>
          );
          setTimeout(resolve, 150);
        });

        const canvas = await html2canvas(wrapper, {
          width: SLIDE_W,
          height: SLIDE_H,
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, SLIDE_W, SLIDE_H);
        root.unmount();
      }

      document.body.removeChild(offscreen);
      pdf.save(`${title || 'presentation'}.pdf`);
      toast.success('PDF יוצא בהצלחה!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('שגיאה בייצוא ל-PDF');
    } finally {
      setExporting(false);
    }
  }, [slides, title, exporting, theme]);

  useEffect(() => {
    if (!open) { setCurrent(0); return; }
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === ' ') goNext();
      if (e.key === 'ArrowRight') goPrev();
      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); return; }
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goNext, goPrev, onClose, showSettings]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  if (!open || slides.length === 0) return null;

  return (
    <SlideThemeProvider theme={theme}>
      <div
        ref={containerRef}
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
        dir="rtl"
      >
        {/* Top bar */}
        {!isFullscreen && (
          <div className="flex items-center justify-between px-6 py-3 bg-black/80 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </Button>
              {title && <span className="text-sm font-medium opacity-80">{title}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-60">
                {current + 1} / {slides.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(v => !v)}
                className={cn('text-white hover:bg-white/10', showSettings && 'bg-white/20')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={exportToPdf} disabled={exporting} className="text-white hover:bg-white/10">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/10">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && !isFullscreen && (
          <ThemeSettingsPanel theme={theme} onChange={setTheme} onClose={() => setShowSettings(false)} />
        )}

        {/* Slide area */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          <ScaledSlide containerClassName="w-full h-full">
            {slides[current].render()}
          </ScaledSlide>

          {/* Nav arrows */}
          {current < slides.length - 1 && (
            <button
              onClick={goNext}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {current > 0 && (
            <button
              onClick={goPrev}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Fullscreen slide counter overlay */}
        {isFullscreen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full opacity-60">
            {current + 1} / {slides.length}
          </div>
        )}

        {/* Thumbnail strip */}
        {!isFullscreen && slides.length > 1 && (
          <div className="flex gap-2 px-6 py-3 bg-black/80 overflow-x-auto shrink-0">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  'shrink-0 w-32 h-[72px] rounded-lg overflow-hidden border-2 transition-all',
                  i === current ? 'border-white/80 ring-2 ring-white/30' : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-80',
                )}
              >
                <ScaledSlide containerClassName="w-full h-full pointer-events-none">
                  {slide.render()}
                </ScaledSlide>
              </button>
            ))}
          </div>
        )}
      </div>
    </SlideThemeProvider>
  );
}
