// Chat stage switch (nudge, home stage, lead card inside the chat). Build time:
//   VITE_CHAT_NUDGE=off  -> none of it renders.
//   unset / any other value -> on (default).
// Keep this file free of imports.
export const CHAT_NUDGE: boolean = import.meta.env.VITE_CHAT_NUDGE !== "off";
