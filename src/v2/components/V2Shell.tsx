import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Aurora } from "./primitives";

const NAV = [
  { to: "/v2", label: "בית" },
  { to: "/v2/studio", label: "סטודיו הדוחות" },
  { to: "/v2/advisor", label: "יועץ AI" },
];

/* Wordmark mark — a minimal half-filled circle, OneZero-inspired */
function Mark() {
  return (
    <span className="relative flex h-8 w-8 items-center justify-center">
      <svg viewBox="0 0 32 32" className="h-8 w-8">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#18181b" strokeWidth="2" />
        <path d="M16 2 a14 14 0 0 1 0 28 Z" fill="#1d6bf3" />
      </svg>
    </span>
  );
}

export function V2Shell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="v2-root overflow-x-hidden" dir="rtl">
      <Aurora />

      {/* Nav */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mt-4 flex items-center justify-between rounded-full border border-[#18182810] bg-white/80 px-4 py-2.5 backdrop-blur-xl shadow-[0_8px_30px_-18px_rgba(24,24,60,0.3)]">
            <Link to="/v2" className="flex items-center gap-2.5">
              <Mark />
              <span className="v2-display text-[17px] font-extrabold tracking-tight text-[#18181b]">SEELD</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                      active ? "text-[#18181b]" : "text-[#71717a] hover:text-[#18181b]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="v2-nav-pill"
                        className="absolute inset-0 rounded-full bg-[#f1f1f4]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative">{n.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/v2/studio"
                className="v2-btn-primary hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-bold"
              >
                בנה דוח חינם
              </Link>
              <button
                className="md:hidden rounded-full border border-[#18182814] bg-white p-2 text-[#18181b]"
                onClick={() => setOpen((v) => !v)}
                aria-label="תפריט"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden mx-auto max-w-7xl px-5 sm:px-8"
            >
              <div className="mt-2 rounded-3xl border border-[#18182810] bg-white p-2 shadow-xl">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-[#3f3f46] hover:bg-[#f4f4f6]"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">{children}</main>

      {!bare && (
        <footer className="relative z-10 mt-24 border-t border-[#18182810]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-right">
              <div className="flex items-center gap-2.5">
                <Mark />
                <div>
                  <p className="v2-display text-base font-extrabold text-[#18181b]">SEELD</p>
                  <p className="text-[13px] text-[#71717a]">בית פיננסים וביטוח · מבית עמיתים הון</p>
                </div>
              </div>
              <p className="max-w-sm text-[12px] text-[#a1a1aa]">
                המידע אינו מהווה ייעוץ פיננסי. דוחות נוצרים לצרכים אינפורמטיביים בלבד.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
