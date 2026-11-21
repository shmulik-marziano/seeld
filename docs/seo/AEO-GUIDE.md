# AEO / GEO guide

Adding a public page:
1. Add an entry to `src/data/seo/routes.ts` (title, description, kind, parent, related, group).
2. Add a summary to `src/data/answerSummaries.ts` (no numbers, promises or personal names).
3. Run `npm run seo:generate` (sitemap.xml, llms.txt, llms-full.txt in public/).
4. `PRERENDER_STRICT=1 npm run build:seo && npm run check:aeo`.

Single source: `routes.ts` feeds RouteSeo, JSON-LD (`src/lib/structuredData.ts`), the related-pages block, sitemap and llms files.

Knowledge guides: a page of `kind: "article"` and `group: "guides"` (under `/learn/guides/` or `/learn/pension-tax/`) also gets an `Article` node in its JSON-LD (`#article`, referenced as `mainEntity`), `og:type=article`, and must not call `usePageSeo`. Every `group` used in `ROUTES` needs a row in `GROUPS` in `scripts/seo/lib.mjs` (`src/test/knowledge.test.ts` checks it). See `docs/product/KNOWLEDGE-GUIDES.md`.
