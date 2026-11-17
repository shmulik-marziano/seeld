import "@/components/sd/chrome.css";
import { useLocation } from "react-router-dom";
import { CONTACTS, DEPT_TEAM, contactFor, waHref } from "@/lib/contacts";
import { WhatsAppGlyph } from "@/components/sd/ContactIcons";

/** Floating WhatsApp button, same family as the chat and accessibility launchers.
 *  Target is picked by route: insurance paths reach the insurance desk, everything else the general desk. */
const FloatingWhatsApp = () => {
  const { pathname } = useLocation();
  const dept = contactFor(pathname);
  return (
    <aside aria-label="יצירת קשר מהיר">
      <a
        href={waHref(CONTACTS[dept])}
        target="_blank"
        rel="noopener noreferrer"
        className="sd-chrome-fab sd-chrome-fab-wa"
        aria-label={`וואטסאפ ל${DEPT_TEAM[dept]}`}
      >
        <WhatsAppGlyph size={24} />
      </a>
    </aside>
  );
};

export default FloatingWhatsApp;
