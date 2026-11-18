#!/usr/bin/env node
// Prints the latest REPORT_PERIOD that data.gov.il publishes for the three official CMA datasets the site's
// investment tracks come from (ADR-36). Compare it with content.investment_tracks.source_period (the as-of on the site):
// if data.gov.il is ahead for more than one load cycle, fetch-cma-data or the watchdog refresh step is not running.
//
//   node scripts/tracks/check-tracks-source.mjs [expectedPeriod]     e.g. 202609
// Exit 0 when every dataset answers (and, with expectedPeriod, none is newer than it); 1 otherwise. No keys needed.
const DATASETS = [
  ['gemelnet', 'a30dcbea-a1d2-482c-ae29-8f781f5025fb'],   // gemel, gemel_invest, hishtalmut, child_savings
  ['pensyanet', '6d47d6b5-cb08-488b-b333-f1e717b1e1bd'],  // pensia
  ['bituachnet', 'c6c62cc7-fe02-4b18-8f3e-813abfbb4647'], // polisa
];
const CKAN = 'https://data.gov.il/api/3/action/datastore_search';
const expected = process.argv[2] ? Number(process.argv[2]) : null;
let failed = false;
for (const [source, id] of DATASETS) {
  const url = `${CKAN}?resource_id=${id}&limit=1&fields=REPORT_PERIOD&sort=${encodeURIComponent('REPORT_PERIOD desc')}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (tracks-source-check)' } });
    const json = await res.json();
    const period = Number(json?.result?.records?.[0]?.REPORT_PERIOD);
    if (!res.ok || !Number.isFinite(period)) throw new Error(`HTTP ${res.status}`);
    const behind = expected != null && period > expected;
    if (behind) failed = true;
    console.log(`${source}\t${period}${behind ? `\tNEWER than ${expected}` : ''}`);
  } catch (e) {
    failed = true;
    console.log(`${source}\tERROR ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
