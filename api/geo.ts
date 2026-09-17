// Visitor country/city for the page-view log, read from the geo headers Vercel
// attaches to every request. Same origin, so no CORS, no third-party call and
// nothing for an ad blocker to block (the previous ipapi.co lookup logged a
// CORS error on every page). Under `vite preview` the route does not exist and
// the caller records nulls.

export const config = { runtime: "edge", regions: ["fra1"] };

export default function handler(req: Request): Response {
  const h = req.headers;
  const country = h.get("x-vercel-ip-country");
  const city = h.get("x-vercel-ip-city");
  return new Response(
    JSON.stringify({
      country: country || null,
      city: city ? decodeURIComponent(city) : null,
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
