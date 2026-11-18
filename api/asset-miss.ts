// Answers requests for /assets/* files that do not exist in this deployment (vercel.json rewrites
// /assets/:path* here; Vercel serves a real file first, so a rewrite only ever sees misses).
//
// Why: vercel.json gives /assets/(.*) `Cache-Control: public, max-age=31536000, immutable`, and a header rule
// applies to every response on that path, 404s included. A browser holding HTML from an older deployment that
// asked for a chunk missing here got a 404 marked immutable for a year (the 2026-11-17 incident). A
// Cache-Control set by a function takes priority over vercel.json headers, so this 404 is never cached.
// Skew Protection (?dpl=) is the structural fix for the old-HTML case; this keeps a miss from sticking.

function handler(): Response {
  return new Response("Not found\n", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default { fetch: handler };
