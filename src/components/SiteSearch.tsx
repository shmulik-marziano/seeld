import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowLeft, Clock, Trash2 } from "lucide-react";
import { searchSite, type SearchItem } from "@/data/searchIndex";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const HISTORY_KEY = "site-search-history";
const MAX_HISTORY = 8;

const getHistory = (): SearchItem[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveToHistory = (item: SearchItem) => {
  const history = getHistory().filter((h) => h.href !== item.href);
  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
};

const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

const SiteSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [history, setHistory] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setHistory(getHistory());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    if (value.trim().length >= 1) {
      setResults(searchSite(value).slice(0, 12));
    } else {
      setResults([]);
    }
  }, []);

  const handleSelect = (item: SearchItem) => {
    saveToHistory(item);
    setOpen(false);
    if (item.href.startsWith("http")) {
      window.open(item.href, "_blank");
    } else {
      navigate(item.href);
    }
  };

  const activeList = query.trim() ? results : history;
  const showHistory = !query.trim() && history.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, activeList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeList[selectedIndex]) {
      handleSelect(activeList[selectedIndex]);
    }
  };

  // Group results by category
  const grouped = results.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <>
      {/* Trigger button – pencil-drawn magnifying glass */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/60 transition-all group"
        aria-label="חיפוש באתר"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          className="text-muted-foreground group-hover:text-foreground transition-colors"
        >
          {/* Hand-drawn style magnifying glass */}
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="0.1 0"
            style={{ filter: "url(#pencil-search)" }}
          />
          <line
            x1="15.5"
            y1="15.5"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ filter: "url(#pencil-search)" }}
          />
          <defs>
            <filter id="pencil-search" x="-2" y="-2" width="28" height="28">
              <feTurbulence type="turbulence" baseFrequency="0.35" numOctaves="3" seed="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
            </filter>
          </defs>
        </svg>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Search panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -5 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Input area */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="חפשו דף, ביטוח, מאמר..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-right"
                  dir="rtl"
                />
                {query && (
                  <button onClick={() => handleSearch("")} className="p-1 hover:bg-muted/60 rounded-full transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/50 text-[10px] text-muted-foreground font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results / History */}
              <div className="max-h-[50vh] overflow-y-auto">
                {/* Recent searches */}
                {showHistory && (
                  <div>
                    <div className="flex items-center justify-between px-5 pt-3 pb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider">חיפושים אחרונים</span>
                      <button
                        onClick={() => { clearHistory(); setHistory([]); }}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        נקה
                      </button>
                    </div>
                    {history.map((item, idx) => (
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-2.5 text-right transition-colors",
                          idx === selectedIndex ? "bg-accent/10" : "hover:bg-muted/40"
                        )}
                      >
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground/60 truncate">{item.description}</p>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {query.trim().length > 0 && results.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    לא נמצאו תוצאות עבור "{query}"
                  </motion.div>
                )}

                {/* Search results */}
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-5 pt-3 pb-1">
                      <span className="text-[11px] font-semibold text-muted-foreground/60 tracking-wider">{category}</span>
                    </div>
                    {items.map((item) => {
                      flatIndex++;
                      const idx = flatIndex;
                      return (
                        <motion.button
                          key={item.href}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.025 }}
                          onClick={() => handleSelect(item)}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 py-3 text-right transition-colors",
                            idx === selectedIndex ? "bg-accent/10" : "hover:bg-muted/40"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          </div>
                          <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              {!query && !showHistory && (
                <div className="px-5 py-4 border-t border-border/30 text-center">
                  <p className="text-xs text-muted-foreground/50">
                    הקלידו לחיפוש בין כל דפי האתר, הביטוחים, החיסכונות והמאמרים
                  </p>
                </div>
              )}

              {/* Keyboard hints footer */}
              <div className="flex items-center justify-center gap-4 px-5 py-2.5 border-t border-border/20 bg-muted/20">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                  <kbd className="px-1 py-0.5 rounded bg-muted/60 border border-border/30 font-mono text-[9px]">↑↓</kbd>
                  ניווט
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                  <kbd className="px-1 py-0.5 rounded bg-muted/60 border border-border/30 font-mono text-[9px]">↵</kbd>
                  בחירה
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                  <kbd className="px-1 py-0.5 rounded bg-muted/60 border border-border/30 font-mono text-[9px]">esc</kbd>
                  סגירה
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SiteSearch;
