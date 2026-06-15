import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/v2", label: "בית" },
  { to: "/v2/studio", label: "סטודיו הדוחות" },
  { to: "/v2/advisor", label: "יועץ AI" },
];

export function V2Shell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="v2-root overflow-x-hidden" dir="rtl">
      {/* Nav — editorial, hairline, monochrome */}
      <header className="sticky top-0 z-40 border-b border-[#18181a12] bg-[#fbfbf9]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 py-4">
          <Link to="/v2" className="flex items-center gap-2">
            <span className="v2-display text-[18px] font-extrabold tracking-tight text-[#18181a]">SEELD</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a8a6a0]">finance</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`relative text-[14px] font-medium transition-colors ${
                    active ? "text-[#18181a]" : "text-[#76746e] hover:text-[#18181a]"
                  }`}
                >
                  {n.label}
                  {active && (
                    <motion.span
                      layoutId="v2-nav-underline"
                      className="absolute -bottom-1.5 right-0 left-0 h-[2px] bg-[#18181a]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/v2/studio"
              className="v2-btn-primary hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold"
            >
              בנה דוח חינם
            </Link>
            <button
              className="md:hidden rounded-full border border-[#18181a1f] p-2 text-[#18181a]"
              onClick={() => setOpen((v) => !v)}
              aria-label="תפריט"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-[#18181a12] bg-white"
            >
              <div className="mx-auto max-w-6xl px-5 py-2 sm:px-8">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-[#3a3a3c] hover:text-[#18181a]"
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
        <footer className="relative z-10 mt-28 border-t border-[#18181a12]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-right">
              <div>
                <p className="v2-display text-base font-extrabold text-[#18181a]">SEELD <span className="text-[#a8a6a0] font-medium">finance</span></p>
                <p className="mt-1 text-[13px] text-[#76746e]">בית פיננסים וביטוח · מבית עמיתים הון</p>
              </div>
              <p className="max-w-sm text-[12px] text-[#a8a6a0]">
                המידע אינו מהווה ייעוץ פיננסי. דוחות נוצרים לצרכים אינפורמטיביים בלבד.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
