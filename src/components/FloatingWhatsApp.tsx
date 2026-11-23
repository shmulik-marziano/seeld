import "@/components/sd/chrome.css";
import { useLocation } from "react-router-dom";
import { CONTACTS, DEPT_TEAM, contactFor, waHref } from "@/lib/contacts";
import { WhatsAppGlyph } from "@/components/sd/ContactIcons";
import { isQuietRoute } from "@/lib/quietRoutes";

/** Floating WhatsApp button, same family as the chat and accessibility launchers.
 *  Target is picked by route: insurance paths reach the insurance desk, everything else the general desk.
 *  On reading routes it is the only floating action, so it also shows on phones (is-solo, chrome.css). */
const FloatingWhatsApp = () => {
  const { pathname } = useLocation();
  const dept = contactFor(pathname);
  const solo = isQuietRoute(pathname);
  return (
    <aside aria-label="יצירת קשר מהיר">
      <a
        href={waHref(CONTACTS[dept])}
        target="_blank"
        rel="noopener noreferrer"
        className={`sd-chrome-fab sd-chrome-fab-wa${solo ? " is-solo" : ""}`}
        aria-label={`וואטסאפ ל${DEPT_TEAM[dept]}`}
      >
        <WhatsAppGlyph size={24} />
      </a>
    </aside>
  );
};

export default FloatingWhatsApp;
