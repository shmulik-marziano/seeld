// Regenerates the committed static SEO files from the route registry (src/data/seo/routes.ts):
//   public/sitemap.xml, public/llms.txt, public/llms-full.txt
// The build (scripts/prerender.mjs) regenerates them again into dist/ with the live blog posts.
// Run after adding or changing a route:  npm run seo:generate
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, loadData, buildSitemap, buildLlms, buildLlmsFull } from "./seo/lib.mjs";

const d = await loadData();
await writeFile(join(ROOT, "public/sitemap.xml"), buildSitemap(d));
await writeFile(join(ROOT, "public/llms.txt"), buildLlms(d));
await writeFile(join(ROOT, "public/llms-full.txt"), buildLlmsFull(d));
console.log(`[seo-generate] ${d.ROUTES.length} routes -> public/sitemap.xml, llms.txt, llms-full.txt`);
