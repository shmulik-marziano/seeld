/** Reading routes (knowledge section and the legacy articles): at most one floating action, no chat nudge, no chat launcher.
 *  The chat still opens from the page's own "ask" buttons (seeld:open-chat). Design pass 23.11.2026. */
export const isQuietRoute = (pathname: string): boolean => /^\/(learn|article)(\/|$)/.test(pathname);
