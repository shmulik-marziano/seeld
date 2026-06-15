import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { Aurora } from "./primitives";

const NAV = [
  { to: "/v2", label: "בית" },
  { to: "/v2/studio", label: "סטודיו הדוחות" },
  { to: "/v2/advisor", label: "יועץ AI" },
];

export function V2Shell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="v2-root v2-grain overflow-x-hidden" dir="rtl">
      <Aurora />

      {/* Nav */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
            <Link to="/v2" className="flex items-center gap-2.5 group">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0218a] to-[#7c3aed] shadow-lg shadow-[#e0218a]/30">
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#e0218a] to-[#7c3aed] blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                <Sparkles className="relative h-[18px] w-[18px] text-white" />
              </span>
              <span className="v2-display text-lg font-extrabold tracking-tight">
                SEELD<span className="text-[#f9a8d4]">.</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                      active ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="v2-nav-pill"
                        className="absolute inset-0 rounded-full bg-white/10 border border-white/10"
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
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-[#0a0a18] transition-transform hover:scale-[1.03]"
              >
                בנה דוח חינם
              </Link>
              <button
                className="md:hidden rounded-lg border border-white/10 bg-white/5 p-2 text-white"
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
              <div className="mt-2 rounded-2xl border border-white/10 bg-black/60 p-2 backdrop-blur-xl">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-white/80 hover:bg-white/5"
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
        <footer className="relative z-10 mt-24 border-t border-white/8">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-right">
              <div>
                <p className="v2-display text-base font-extrabold">SEELD<span className="text-[#f9a8d4]">.</span></p>
                <p className="mt-1 text-[13px] text-white/45">בית פיננסים וביטוח · מבית עמיתים הון</p>
              </div>
              <p className="text-[12px] text-white/35">
                המידע אינו מהווה ייעוץ פיננסי. דוחות נוצרים לצרכים אינפורמטיביים בלבד.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
