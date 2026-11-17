import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import SeeIDLogo from "@/components/SeeIDLogo";
import { ChevronDown, Menu, User, X } from "lucide-react";
import { ContactIcons } from "@/components/sd/ContactIcons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { INSURANCE_GROUPS, SAVINGS_LINKS, iconSrc, type ChromeLink } from "@/components/sd/chromeData";
import "@/components/sd/chrome.css";

type MenuId = "insurance" | "savings";

// Desktop primary nav. Two hubs carry a sub-menu; the rest are direct links.
// "צור קשר" is the primary action button on the right of the bar.
const plainLinks = [
  { href: "/#process", label: "איך זה עובד" },
  { href: "/learn", label: "ידע וכלים" },
];

const mobileNavLinks = [
  { href: "/", label: "דף הבית" },
  { href: "/#process", label: "איך זה עובד" },
  { href: "/learn", label: "ידע וכלים" },
  { href: "/calculators", label: "מחשבונים" },
  { href: "/return-tables", label: "לוח התשואות" },
  { href: "/blog", label: "בלוג" },
  { href: "/contact", label: "צור קשר" },
];

const mobileSecondaryLinks = [
  { href: "/personal-area", label: "האזור האישי" },
  { href: "/agents", label: "כניסה לסוכנים" },
];

const RowIcon = ({ link }: { link: ChromeLink }) =>
  link.icon ? (
    <img src={iconSrc(link.icon)} alt="" aria-hidden="true" width={30} height={30} className="sd-chrome-ico" draggable={false} />
  ) : null;

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [mobileSection, setMobileSection] = useState<MenuId | null>(null);
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | undefined>(undefined);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const hubActive = (id: MenuId) => (id === "insurance" ? isActive("/insurances") || isActive("/insurance") : isActive("/savings"));

  // Dark mode is parked until it gets a real SEELD dark theme; force light.
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when the drawer is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  // Close everything on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  const closeDrawer = useCallback(() => {
    setIsMenuOpen(false);
    openerRef.current?.focus();
  }, []);

  // Drawer is a dialog: Escape closes, Tab stays inside, focus moves in on open
  useEffect(() => {
    if (!isMenuOpen) return;
    const t = window.setTimeout(() => closeRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeDrawer(); return; }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const f = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      ).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [isMenuOpen, closeDrawer]);

  // Desktop sub-menu: Escape and outside click close it
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(null); };
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [openMenu]);

  const hoverOpen = (id: MenuId) => {
    window.clearTimeout(hoverTimer.current);
    setOpenMenu(id);
  };
  const hoverClose = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  // Skip link: pages render <main> without an id, so focus the first <main> directly.
  const handleSkipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      if (!main.id) main.id = "main";
      main.focus({ preventScroll: true });
      main.scrollIntoView();
    }
  };

  const openChat = () => {
    setIsMenuOpen(false);
    window.dispatchEvent(new Event("seeld:open-chat"));
  };

  const openA11y = () => {
    setIsMenuOpen(false);
    window.dispatchEvent(new Event("seeld:open-a11y"));
  };

  const hubs: { id: MenuId; href: string; label: string }[] = [
    { id: "insurance", href: "/insurances", label: "ביטוח" },
    { id: "savings", href: "/savings", label: "פיננסים" },
  ];

  return (
    <header className="sd-chrome-header" data-scrolled={isScrolled ? "true" : "false"}>
      {/* Keep focused elements clear of the sticky header (WCAG 2.4.11) */}
      <style>{"html{scroll-padding-top:140px}"}</style>

      {/* Skip link: first focusable element, visually hidden until focused */}
      <a href="#main" onClick={handleSkipToMain} className="sd-chrome-skip">
        דלג לתוכן
      </a>

      <div className="sd-chrome-bar">
        <SeeIDLogo size="md" className="flex-shrink-0" />

        {/* Desktop navigation */}
        <nav ref={navRef} className="sd-chrome-nav" aria-label="ניווט ראשי">
          {hubs.map((hub) => (
            <div
              key={hub.id}
              className="sd-chrome-item"
              onMouseEnter={() => hoverOpen(hub.id)}
              onMouseLeave={hoverClose}
            >
              <Link
                to={hub.href}
                aria-current={hubActive(hub.id) ? "page" : undefined}
                className="sd-chrome-link"
                data-active={hubActive(hub.id) ? "true" : "false"}
              >
                {hub.label}
              </Link>
              <button
                type="button"
                className="sd-chrome-chev"
                aria-expanded={openMenu === hub.id}
                aria-controls={`sd-chrome-sub-${hub.id}`}
                aria-label={`תת-תפריט ${hub.label}`}
                onClick={() => setOpenMenu(openMenu === hub.id ? null : hub.id)}
              >
                <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
              </button>

              <div
                id={`sd-chrome-sub-${hub.id}`}
                className="sd-chrome-sub"
                data-open={openMenu === hub.id ? "true" : "false"}
                data-wide={hub.id === "insurance" ? "true" : "false"}
              >
                {hub.id === "insurance" ? (
                  <div className="sd-chrome-sub-grid">
                    {INSURANCE_GROUPS.map((g) => (
                      <div key={g.title}>
                        <p className="sd-chrome-sub-title">{g.title}</p>
                        <ul>
                          {g.links.map((l) => (
                            <li key={l.href}>
                              <Link to={l.href} tabIndex={openMenu === hub.id ? 0 : -1}><RowIcon link={l} /><span>{l.label}</span></Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="sd-chrome-sub-list">
                    {SAVINGS_LINKS.map((l) => (
                      <li key={l.href}>
                        <Link to={l.href} tabIndex={openMenu === hub.id ? 0 : -1}><RowIcon link={l} /><span>{l.label}</span></Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link to={hub.href} className="sd-chrome-sub-all" tabIndex={openMenu === hub.id ? 0 : -1}>
                  {hub.id === "insurance" ? "לכל תחומי הביטוח" : "לכל תחומי הפיננסים"}
                </Link>
              </div>
            </div>
          ))}

          {plainLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className="sd-chrome-link"
              data-active={isActive(link.href) ? "true" : "false"}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="sd-chrome-actions">
          <Link to="/personal-area" className="sd-chrome-ghost">
            <User size={18} strokeWidth={1.75} aria-hidden="true" />
            אזור אישי
          </Link>
          <Link to="/contact" className="sd-chrome-cta">צור קשר</Link>

          <button
            ref={openerRef}
            type="button"
            className="sd-chrome-burger"
            onClick={() => setIsMenuOpen(true)}
            aria-label="פתח תפריט"
            aria-expanded={isMenuOpen}
            aria-haspopup="dialog"
          >
            <Menu size={22} strokeWidth={1.6} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer, portaled to <body>: the header's backdrop blur creates a
          containing block that would trap position:fixed children inside the bar. */}
      {createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className="sd-chrome-root">
              <motion.div
                className="sd-chrome-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
                onClick={closeDrawer}
              />
              <motion.div
                ref={drawerRef}
                className="sd-chrome-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
                role="dialog"
                aria-modal="true"
                aria-label="תפריט ניווט"
                dir="rtl"
              >
                <div className="sd-chrome-drawer-head">
                  <img
                    src="/brand/logo.png"
                    srcSet="/brand/logo-204.png 204w, /brand/logo-306.png 306w, /brand/logo-480.png 480w"
                    sizes="115px"
                    alt="שילד ביטוח ופיננסים"
                    width={115}
                    height={48}
                    style={{ height: 48, width: "auto" }}
                    draggable={false}
                  />
                  <button ref={closeRef} type="button" onClick={closeDrawer} className="sd-chrome-burger" style={{ display: "inline-flex" }} aria-label="סגור תפריט">
                    <X size={22} strokeWidth={1.6} aria-hidden="true" />
                  </button>
                </div>

                <nav className="sd-chrome-drawer-nav" aria-label="ניווט נייד">
                  <Link to="/" aria-current={pathname === "/" ? "page" : undefined} className="sd-chrome-drawer-link" onClick={() => setIsMenuOpen(false)}>
                    דף הבית
                  </Link>

                  {hubs.map((hub) => (
                    <div key={hub.id} className="sd-chrome-acc">
                      <button
                        type="button"
                        className="sd-chrome-drawer-link sd-chrome-acc-btn"
                        aria-expanded={mobileSection === hub.id}
                        aria-controls={`sd-chrome-m-${hub.id}`}
                        onClick={() => setMobileSection(mobileSection === hub.id ? null : hub.id)}
                      >
                        <span>{hub.label}</span>
                        <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
                      </button>
                      {mobileSection === hub.id && (
                        <div id={`sd-chrome-m-${hub.id}`} className="sd-chrome-acc-panel">
                          {hub.id === "insurance"
                            ? INSURANCE_GROUPS.map((g) => (
                                <div key={g.title}>
                                  <p className="sd-chrome-sub-title">{g.title}</p>
                                  {g.links.map((l) => (
                                    <Link key={l.href} to={l.href} onClick={() => setIsMenuOpen(false)}><RowIcon link={l} /><span>{l.label}</span></Link>
                                  ))}
                                </div>
                              ))
                            : SAVINGS_LINKS.map((l) => (
                                <Link key={l.href} to={l.href} onClick={() => setIsMenuOpen(false)}><RowIcon link={l} /><span>{l.label}</span></Link>
                              ))}
                          <Link to={hub.href} className="sd-chrome-sub-all" onClick={() => setIsMenuOpen(false)}>
                            {hub.id === "insurance" ? "לכל תחומי הביטוח" : "לכל תחומי הפיננסים"}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}

                  {mobileNavLinks.slice(1).map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className="sd-chrome-drawer-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="sd-chrome-drawer-sec">
                    <p className="sd-chrome-sub-title">חשבון</p>
                    {mobileSecondaryLinks.map((link) => (
                      <Link key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)}>{link.label}</Link>
                    ))}
                  </div>

                  <div className="sd-chrome-drawer-foot">
                    <div className="sd-chrome-quick-icons">
                      <ContactIcons tone="dark" onNavigate={() => setIsMenuOpen(false)} />
                    </div>
                    <Link to="/contact" className="sd-chrome-cta sd-chrome-cta-block" onClick={() => setIsMenuOpen(false)}>
                      צור קשר
                    </Link>
                    <Link to="/personal-area" className="sd-chrome-ghost sd-chrome-cta-block" onClick={() => setIsMenuOpen(false)}>
                      <User size={18} strokeWidth={1.75} aria-hidden="true" />
                      אזור אישי
                    </Link>
                    <button type="button" onClick={openChat} className="sd-chrome-chatlink" aria-label="פתיחת שיחה עם היועץ">
                      <i aria-hidden="true" />
                      שיחה עם היועץ הדיגיטלי
                    </button>
                    <button type="button" onClick={openA11y} className="sd-chrome-chatlink">
                      הגדרות נגישות
                    </button>
                  </div>
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};

export default Header;
