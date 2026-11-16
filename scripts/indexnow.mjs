// Tells IndexNow-enabled engines (Bing, Yandex, Seznam, Naver...) which URLs changed.
// Run AFTER a production deploy is live: the engines fetch the key file from the site.
//   npm run indexnow                 submit every URL in the live sitemap
//   npm run indexnow -- /faq /about  submit only these paths
import { readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "seeld.co.il";
const keyFile = readdirSync(resolve(ROOT, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) { console.error("[indexnow] no key file in public/"); process.exit(1); }
const key = keyFile.replace(".txt", "");

const paths = process.argv.slice(2);
let urls;
if (paths.length) {
  urls = paths.map((p) => `https://${HOST}${p.startsWith("/") ? p : `/${p}`}`);
} else {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
if (!urls.length) { console.error("[indexnow] no URLs"); process.exit(1); }

// The engines verify ownership by fetching the key file: refuse to submit if it is not live yet.
const check = await fetch(`https://${HOST}/${keyFile}`);
if (!check.ok || (await check.text()).trim() !== key) {
  console.error("[indexnow] key file is not live on the site yet; deploy first"); process.exit(1);
}

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls }),
});
console.log(`[indexnow] ${urls.length} URLs -> HTTP ${res.status} ${res.statusText}`);
if (res.status >= 400) process.exit(1);
