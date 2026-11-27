// What every signed-in screen of the client area shares: the adapter, the client, the portfolio (loaded once by the
// shell), the hide-amounts switch, whether requests are open, and the request sheet.
import { createContext, useContext } from "react";
import type { ClientApi, MeRes, PortfolioRes, RequestTopic } from "@/lib/client-area/api";

export type Loaded<T> = { state: "loading" } | { state: "ok"; data: T } | { state: "error"; text: string };

export interface AreaCtx {
  api: ClientApi;
  me: MeRes;
  portfolio: Loaded<PortfolioRes>;
  reloadPortfolio: () => void;
  hidden: boolean;
  toggleHidden: () => void;
  /** null until GET /requests answered; false = the server switch is off */
  requestsEnabled: boolean | null;
  /** bumps after a request is sent, so the list reloads */
  requestsTick: number;
  openRequest: (topic: RequestTopic | null) => void;
  onAuthLost: () => void;
}

export const Area = createContext<AreaCtx | null>(null);

export function useArea(): AreaCtx {
  const v = useContext(Area);
  if (!v) throw new Error("useArea outside the client area shell");
  return v;
}
