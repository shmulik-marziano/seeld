// CSP vs bundle consistency for the Tokyo -> seeld-site cutover (IMPLEMENTATION-PLAN item 22, review fix:
// "remove both Tokyo origins in the same PR/deploy that switches VITE_*"). Shared by
// scripts/ci/check-csp-bundle.mjs (CI, on dist/) and scripts/ci/preview-smoke.mjs (on a deployed preview).
//
// Rules:
//  1. connect-src allows https://<seeld-site>.supabase.co and https://challenges.cloudflare.com; no ipapi.co.
//  2. Every Supabase project the bundle talks to is allowed in connect-src (otherwise the site breaks).
//  3. A Supabase origin (https:// or wss://) in connect-src that the bundle does NOT reference is stale and fails,
//     except seeld-site's https origin (rule 1). So the Tokyo origins must leave the CSP in the same change that
//     moves the bundle off Tokyo, and the CSP cannot keep them "just in case".
//  4. cutoverDone (repository variable CUTOVER_DONE=1, set by the owner at cutover): no Tokyo reference at all,
//     neither in the CSP nor in the bundle.
export const SITE_REF = "qxhpolktdfgcbxtfxgov";
export const TOKYO_REF = "lvifatyksqizwcutfbqp";

const HOST_RE = /https:\/\/([a-z0-9]{20})\.supabase\.co/g;

/** Supabase project refs referenced by a JS text. */
export function bundleRefs(text) {
  const refs = new Set();
  for (const m of text.matchAll(HOST_RE)) refs.add(m[1]);
  return refs;
}

/** connect-src sources of a CSP string (empty array when the directive is missing). */
export function connectSrc(csp) {
  const d = csp.split(";").map((s) => s.trim()).find((s) => /^connect-src\s/i.test(s));
  return d ? d.split(/\s+/).slice(1) : [];
}

/**
 * @param {{ csp: string, refs: Set<string>, cutoverDone?: boolean }} input
 * @returns {string[]} problems (empty = consistent)
 */
export function cspCutoverProblems({ csp, refs, cutoverDone = false }) {
  const problems = [];
  if (!csp) return ["Content-Security-Policy missing"];
  if (/ipapi\.co/.test(csp)) problems.push("CSP still allows ipapi.co");
  const cs = connectSrc(csp);
  if (cs.length === 0) return [...problems, "CSP has no connect-src directive"];
  const siteHttps = `https://${SITE_REF}.supabase.co`;
  if (!cs.includes(siteHttps)) problems.push(`connect-src lacks ${siteHttps}`);
  if (!cs.includes("https://challenges.cloudflare.com")) problems.push("connect-src lacks https://challenges.cloudflare.com");
  for (const ref of refs) {
    if (!cs.includes(`https://${ref}.supabase.co`)) problems.push(`the bundle calls https://${ref}.supabase.co but connect-src does not allow it`);
  }
  for (const src of cs) {
    const m = src.match(/^(https|wss):\/\/([a-z0-9]{20})\.supabase\.co$/);
    if (!m) continue;
    const [, scheme, ref] = m;
    if (scheme === "https" && ref === SITE_REF) continue;
    if (!refs.has(ref)) {
      problems.push(`stale connect-src ${src}: the bundle no longer references ${ref} (cutover checklist: remove it in the same change that switches VITE_*)`);
    }
  }
  if (cutoverDone) {
    if (cs.some((s) => s.includes(TOKYO_REF))) problems.push(`CUTOVER_DONE=1 but connect-src still lists ${TOKYO_REF}`);
    if (refs.has(TOKYO_REF)) problems.push(`CUTOVER_DONE=1 but the bundle still calls ${TOKYO_REF}`);
  }
  return problems;
}
