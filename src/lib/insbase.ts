// InsBase (insbase.io) — the customer's own file, spoken to over MCP.
//
// The site is a public OAuth 2.1 client (PKCE, dynamic registration, no
// secret): the visitor authorises on the InsBase consent screen with the ID
// number and the personal code the agency gave them; we keep the tokens in the
// visitor's own row of insbase_links (RLS) and call the MCP tools from the
// browser (the gateway allows any origin). Every answer is a ready Hebrew text
// with its source and date, produced by InsBase — the site renders it, it does
// not compute or interpret anything.
import { siteSupabase as supabase } from "@/integrations/supabase/site-client";

export const INSBASE_ISSUER = "https://insbase.io/auth";
export const INSBASE_MCP = "https://insbase.io/mcp";
const SCOPE = "insbase:read";
const LS_CLIENT = "insbase_client";      // { origin, client_id }
const LS_PENDING = "insbase_pending";    // { verifier, state, client_id, redirect }

export type InsbaseTool =
  | "portfolio_snapshot" | "list_products" | "balances" | "management_fees" | "liquidity"
  | "coverages" | "last_deposit" | "agency_recommendations" | "product_details"
  | "explain_term" | "whats_changed" | "beneficiaries" | "open_service_request";

export interface InsbaseLink {
  user_id: string;
  client_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  refresh_expires_at: string | null;
  display_name: string | null;
  connected_at: string;
}

// ── PKCE helpers (Web Crypto) ──
const b64url = (bytes: ArrayBuffer | Uint8Array) => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const random = (n: number) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (text: string) => b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));

const redirectUri = () => `${window.location.origin}/personal-area`;

/** One registered client per origin, cached in this browser. */
async function clientId(): Promise<string> {
  try {
    const cached = JSON.parse(localStorage.getItem(LS_CLIENT) || "null");
    if (cached && cached.origin === window.location.origin && cached.client_id) return cached.client_id;
  } catch { /* ignore */ }
  const res = await fetch(`${INSBASE_ISSUER}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_name: "SEELD — האזור האישי", redirect_uris: [redirectUri()] }),
  });
  if (!res.ok) throw new Error("registration failed");
  const data = await res.json();
  localStorage.setItem(LS_CLIENT, JSON.stringify({ origin: window.location.origin, client_id: data.client_id }));
  return data.client_id as string;
}

/** Step 1: leave for the InsBase consent screen. */
export async function startConnect(): Promise<void> {
  const client = await clientId();
  const verifier = random(32);
  const state = random(12);
  const challenge = await sha256(verifier);
  localStorage.setItem(LS_PENDING, JSON.stringify({ verifier, state, client_id: client, redirect: redirectUri() }));
  const q = new URLSearchParams({
    client_id: client,
    redirect_uri: redirectUri(),
    response_type: "code",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: SCOPE,
  });
  window.location.assign(`${INSBASE_ISSUER}/authorize?${q}`);
}

/** Step 2: back on /personal-area?code=…&state=… — exchange and store. Returns true when a link was made. */
export async function finishConnect(userId: string): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return false;
  const pending = (() => { try { return JSON.parse(localStorage.getItem(LS_PENDING) || "null"); } catch { return null; } })();
  // Clean the address either way, so a refresh does not replay the code.
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
  if (!pending || pending.state !== state) throw new Error("state mismatch");
  localStorage.removeItem(LS_PENDING);

  const res = await fetch(`${INSBASE_ISSUER}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "authorization_code", code, client_id: pending.client_id, redirect_uri: pending.redirect, code_verifier: pending.verifier }),
  });
  if (!res.ok) throw new Error("token exchange failed");
  const tok = await res.json();
  const now = Date.now();
  const row = {
    user_id: userId,
    client_id: pending.client_id,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: new Date(now + (tok.expires_in ?? 2592000) * 1000).toISOString(),
    refresh_expires_at: new Date(now + 180 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("insbase_links" as never).upsert(row as never, { onConflict: "user_id" } as never);
  if (error) throw error;
  return true;
}

export async function loadLink(userId: string): Promise<InsbaseLink | null> {
  const { data, error } = await supabase.from("insbase_links" as never).select("*").eq("user_id", userId).maybeSingle();
  if (error) return null;
  return (data as unknown as InsbaseLink) ?? null;
}

export async function disconnect(userId: string): Promise<void> {
  await supabase.from("insbase_links" as never).delete().eq("user_id", userId);
}

async function refresh(link: InsbaseLink): Promise<InsbaseLink> {
  const res = await fetch(`${INSBASE_ISSUER}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: link.refresh_token, client_id: link.client_id }),
  });
  if (!res.ok) throw new Error("refresh failed");
  const tok = await res.json();
  const next: InsbaseLink = {
    ...link,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: new Date(Date.now() + (tok.expires_in ?? 2592000) * 1000).toISOString(),
  };
  await supabase.from("insbase_links" as never).update({
    access_token: next.access_token,
    refresh_token: next.refresh_token,
    expires_at: next.expires_at,
    updated_at: new Date().toISOString(),
  } as never).eq("user_id", link.user_id);
  return next;
}

/** One product card, as the InsBase server returns it in `structuredContent` (list_products). */
export interface InsbaseProduct {
  policy_number: string;
  family: string;
  product_type: string;
  producer: string;
  plan_name: string | null;
  status: string;
  active: boolean;
  kind: "savings" | "insurance";
  source: string;
  valid_date: string;
  highlights: { label: string; display: string; source: string; valid_date: string }[];
}

export interface ToolAnswer {
  text: string;
  isError: boolean;
  /** Present only when the server sent structured data alongside the text. */
  structured?: { products?: InsbaseProduct[] } & Record<string, unknown>;
}

let seq = 1;

/** Call one InsBase tool. Refreshes the token once on 401 / expiry. */
export async function callTool(link: InsbaseLink, tool: InsbaseTool, args: Record<string, string> = {}): Promise<{ answer: ToolAnswer; link: InsbaseLink }> {
  let current = link;
  if (new Date(current.expires_at).getTime() < Date.now() + 60_000) current = await refresh(current);
  const run = async (l: InsbaseLink) =>
    fetch(INSBASE_MCP, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${l.access_token}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: seq++, method: "tools/call", params: { name: tool, arguments: args } }),
    });
  let res = await run(current);
  if (res.status === 401) {
    current = await refresh(current);
    res = await run(current);
  }
  if (!res.ok) throw new Error(`insbase ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message || "insbase error");
  const content = (body.result?.content ?? []) as { type: string; text?: string }[];
  const text = content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
  const structured = body.result?.structuredContent && typeof body.result.structuredContent === "object"
    ? (body.result.structuredContent as ToolAnswer["structured"])
    : undefined;
  return { answer: { text, isError: Boolean(body.result?.isError), structured }, link: current };
}

/** The first line of the snapshot after the title: the summary sentence. */
export const snapshotSummary = (text: string): { title: string; summary: string } => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return { title: lines[0] ?? "", summary: lines[1] ?? "" };
};
