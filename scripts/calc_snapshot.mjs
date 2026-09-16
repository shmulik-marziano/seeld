import { chromium } from "@playwright/test";
const base = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1440,height:900}, locale:"he-IL" });
await p.addInitScript(()=>{ try{localStorage.setItem("cookie-consent","accepted")}catch{} });
const out = {};
for (const tab of ["mortgage","pension","savings","goal","compare","income-tax","life-insurance","car-insurance"]) {
  await p.goto(base + "/calculators", { waitUntil:"networkidle" });
  await p.click(`[role="tab"][data-state][value="${tab}"], button[role="tab"]:has-text("")`).catch(()=>{});
  const tabs = await p.$$('button[role="tab"]');
  const idx = ["mortgage","pension","savings","goal","compare","income-tax","life-insurance","car-insurance"].indexOf(tab);
  await tabs[idx].click(); await p.waitForTimeout(400);
  const panel = await p.$('[role="tabpanel"][data-state="active"]');
  const text = await panel.innerText();
  // collect all currency/percent figures in order
  out[tab] = (text.match(/[₪]?\s?\d[\d,\.]*\s?[₪%]?/g) || []).map(s=>s.trim()).filter(s=>/\d{2,}/.test(s)).slice(0,40);
}
console.log(JSON.stringify(out));
await b.close();
