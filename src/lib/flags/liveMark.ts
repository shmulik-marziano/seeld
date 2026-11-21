// Live-mark switch: the living brand mark (LogoMark) in place of the five big dots in the page transition.
// Build time, like logoDots.ts:
//   VITE_LIVE_MARK=off  -> the five logo dots (LogoDots), i.e. the previous behaviour exactly.
//   unset / any other value -> on (default).
// Keep this file free of imports.
export const LIVE_MARK: boolean = import.meta.env.VITE_LIVE_MARK !== "off";
