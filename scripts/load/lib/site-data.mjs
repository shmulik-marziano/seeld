// Shared definitions for loading the site's public reference data (Tokyo export -> seeld-site `content` schema).
// Source of truth for column mapping, SQL generation, chunking, resume log and the canonical checksum that is
// computed identically here (over the export JSON) and in Postgres (over the loaded tables / matviews).
//
// Column mapping Tokyo -> content (see supabase/migrations/20261118162630_foundation_content.sql):
//   blog_posts        : identical columns; new `created_by` stays null (Tokyo had no author user id).
//   investment_tracks : identical columns, identity ids are kept (business key fund_number).
//   cma_funds         : identical columns minus `raw_data` (deliberately not carried over, FOUNDATION 2.5).
//   cma_sync_log      : identical columns ('stale' now allowed by the CHECK; export has only success/error).
//   cma_funds_latest, cma_board (matviews) and cma_company_map (view) are NOT loaded: content.refresh_fund_views().
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ENV = {
  dataDir: process.env.SITE_DATA_DIR || 'C:/tmp/infra/migrate-site/data',
  workDir: process.env.SITE_LOAD_WORKDIR || 'C:/tmp/infra/migrate-site',
  logFile: process.env.SITE_LOAD_LOG || 'C:/tmp/infra/migrate-site/LOAD-LOG.md',
  bucket: process.env.LOAD_BUCKET || 'tmp-load',
};

const uuid = 'uuid', text = 'text', ts = 'timestamptz', num = 'numeric', int = 'integer', big = 'bigint', bool = 'boolean', jsonb = 'jsonb';

export const BASE_TABLES = {
  blog_posts: {
    file: 'blog_posts.json', target: 'content.blog_posts', conflict: ['id'], chunk: 25, order: ['id'], dropped: [],
    types: { id: uuid, slug: text, title: text, excerpt: text, content: text, category: text, cover_image_url: text,
      author: text, status: text, published_at: ts, created_at: ts, updated_at: ts },
  },
  investment_tracks: {
    file: 'investment_tracks.json', target: 'content.investment_tracks', conflict: ['fund_number'], chunk: 300, order: ['id'], dropped: [],
    types: { id: big, fund_number: text, name: text, company: text, product_type: text, specialization: text,
      stock_exposure: int, return_year1: num, return_year3: num, return_year5: num, return_month: num,
      fee_assets: num, fee_deposits: num, sharpe_ratio: num, total_assets: num, liquidity: num, report_period: text,
      foreign_exposure: num, currency_exposure: num, stocks_pct: num, gov_bonds_pct: num, corp_bonds_pct: num,
      cash_pct: num, other_pct: num, is_active: bool, last_sync: ts, created_at: ts, updated_at: ts },
  },
  cma_funds: {
    file: 'cma_funds.json', target: 'content.cma_funds', conflict: ['fund_id', 'report_period', 'source'], chunk: 1000, order: ['id'],
    dropped: ['raw_data'],
    types: { id: uuid, fund_id: text, fund_name: text, fund_classification: text, managing_company: text, managing_company_id: text,
      source: text, product_type: text, specialization: text, sub_specialization: text, target_population: text,
      report_period: int, inception_date: text, total_assets: num, deposits: num, withdrawals: num, internal_transfers: num,
      net_monthly_deposits: num, monthly_yield: num, ytd_yield: num, yield_trailing_3yrs: num, yield_trailing_5yrs: num,
      avg_annual_yield_3yrs: num, avg_annual_yield_5yrs: num, avg_annual_management_fee: num, avg_deposit_fee: num,
      standard_deviation: num, alpha: num, sharpe_ratio: num, liquid_assets_percent: num, stock_market_exposure: num,
      foreign_exposure: num, foreign_currency_exposure: num, actuarial_adjustment: num, fetched_at: ts, created_at: ts },
  },
  cma_sync_log: {
    file: 'cma_sync_log.json', target: 'content.cma_sync_log', conflict: ['id'], chunk: 200, order: ['id'], dropped: [],
    types: { id: uuid, source: text, status: text, records_fetched: int, records_upserted: int, latest_period: int,
      error_message: text, duration_ms: int, started_at: ts, completed_at: ts },
  },
};

// Derived objects: compared only (export snapshot of Tokyo vs. refresh in seeld-site).
export const DERIVED = {
  cma_funds_latest: {
    file: 'cma_funds_latest.json', target: 'content.cma_funds_latest', order: ['id'],
    types: { id: uuid, fund_id: text, fund_name: text, fund_classification: text, managing_company: text, source: text,
      product_type: text, specialization: text, sub_specialization: text, report_period: int, total_assets: num,
      monthly_yield: num, ytd_yield: num, yield_trailing_3yrs: num, yield_trailing_5yrs: num, avg_annual_yield_3yrs: num,
      avg_annual_yield_5yrs: num, avg_annual_management_fee: num, avg_deposit_fee: num, standard_deviation: num,
      sharpe_ratio: num, stock_market_exposure: num, foreign_exposure: num, foreign_currency_exposure: num,
      actuarial_adjustment: num, fetched_at: ts },
  },
  cma_board: {
    file: 'cma_board.json', target: 'content.cma_board', order: ['id'],
    types: { id: uuid, fund_id: text, source: text, fund_name: text, managing_company: text, company: text, product_type: text,
      board_product: text, track: text, specialization: text, sub_specialization: text, report_period: int, inception_date: text,
      total_assets: num, monthly_yield: num, ytd_yield: num, ret_3m: num, ret_6m: num, ret_12m: num, ret_3y: num, ret_5y: num,
      avg_annual_yield_3yrs: num, avg_annual_yield_5yrs: num, mgmt_fee: num, deposit_fee: num, std_dev: num, sharpe: num,
      stock_pct: num, foreign_pct: num, fx_pct: num, liquid_pct: num, net_deposits_month: num, inflow_12m: num,
      inflow_months: big, months_12m: big, series_12m: jsonb, fetched_at: ts },
  },
  cma_company_map: {
    file: 'cma_company_map.json', target: 'content.cma_company_map', order: ['company', 'board_product'],
    types: { company: text, board_product: text, funds: big, assets: num, inflow_12m: num, inflow_complete: bool, report_period: int },
  },
};

export const ALL = { ...BASE_TABLES, ...DERIVED };

// ---------------------------------------------------------------- values
// Plain decimal text for a JSON number: no exponent, no trailing zeros, '-0' -> '0'. Mirrors trim_scale(numeric)::text.
export function numStr(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return v === 0 ? '0' : String(v);
  const s = String(v);
  if (!/e/i.test(s)) return s;
  const [m, e] = s.toLowerCase().split('e');
  const neg = m.startsWith('-');
  const mant = m.replace('-', '');
  const digits = mant.replace('.', '');
  const dot = mant.indexOf('.') === -1 ? mant.length : mant.indexOf('.');
  const pointPos = dot + parseInt(e, 10);
  let out;
  if (pointPos <= 0) out = '0.' + '0'.repeat(-pointPos) + digits;
  else if (pointPos >= digits.length) out = digits + '0'.repeat(pointPos - digits.length);
  else out = digits.slice(0, pointPos) + '.' + digits.slice(pointPos);
  out = out.replace(/^0+(?=\d)/, '');
  if (out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '');
  return (neg ? '-' : '') + out;
}

// Compact JSON with jsonb key order (length, then bytes) so it equals replace(replace(jsonb::text, ', ', ','), ': ', ':').
export function canonJson(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return numStr(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonJson).join(',') + ']';
  const keys = Object.keys(v).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0));
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonJson(v[k])).join(',') + '}';
}

export function canonVal(v, type) {
  if (v === null || v === undefined) return '\\N';
  switch (type) {
    case bool: return v ? 't' : 'f';
    case num: case int: case big: return numStr(v);
    case jsonb: return canonJson(v);
    default: return String(v);
  }
}

export function canonRow(spec, row) {
  return Object.keys(spec.types).sort().map(c => c + '=' + canonVal(row[c], spec.types[c])).join('|');
}

function cmpBy(spec) {
  return (a, b) => {
    for (const c of spec.order) {
      const t = spec.types[c];
      const x = a[c], y = b[c];
      if ([num, int, big].includes(t)) { if (x !== y) return x - y; }
      else { const sx = String(x), sy = String(y); if (sx !== sy) return sx < sy ? -1 : 1; }
    }
    return 0;
  };
}

export function localChecksum(spec, rows) {
  const sorted = [...rows].sort(cmpBy(spec));
  const h = crypto.createHash('sha256');
  sorted.forEach((r, i) => { if (i) h.update('\n'); h.update(canonRow(spec, r), 'utf8'); });
  return { rows: rows.length, sha256: h.digest('hex') };
}

// Same checksum, computed by Postgres. One row: t, rows, sha256.
export function checksumSql(name, spec) {
  const cs = Object.keys(spec.types).sort();
  const expr = c => {
    switch (spec.types[c]) {
      case bool: return `case when ${c} then 't' else 'f' end`;
      case num: return `trim_scale(${c})::text`;
      case int: case big: return `${c}::text`;
      case jsonb: return `replace(replace(${c}::text, ', ', ','), ': ', ':')`;
      case ts: return `(to_jsonb(${c}) #>> '{}')`;
      default: return `${c}::text`;
    }
  };
  const rowstr = cs.map(c => `'${c}=' || coalesce(${expr(c)}, E'\\\\N')`).join(` || '|' || `);
  const ord = spec.order.map(c => [num, int, big].includes(spec.types[c]) ? c : `${c}::text collate "C"`).join(', ');
  return `select '${name}' as t, count(*) as rows, encode(sha256(convert_to(string_agg(rs, E'\\n' order by ${ord}), 'UTF8')), 'hex') as sha256\n` +
    `from (select ${spec.order.join(', ')}, ${rowstr} as rs from ${spec.target}) s`;
}

// ---------------------------------------------------------------- rows / SQL
export function loadRows(spec) {
  const raw = JSON.parse(fs.readFileSync(path.join(ENV.dataDir, spec.file), 'utf8'));
  if (!Array.isArray(raw)) throw new Error(`${spec.file}: expected a JSON array`);
  const known = new Set([...Object.keys(spec.types), ...(spec.dropped || [])]);
  const unknown = new Set();
  const rows = raw.map(r => {
    for (const k of Object.keys(r)) if (!known.has(k)) unknown.add(k);
    const o = {};
    for (const c of Object.keys(spec.types)) o[c] = r[c] === undefined ? null : r[c];
    return o;
  });
  if (unknown.size) throw new Error(`${spec.file}: export columns with no target: ${[...unknown].join(', ')} (add to types or dropped)`);
  return rows;
}

export function chunks(rows, n) {
  const out = [];
  for (let i = 0; i < rows.length; i += n) out.push(rows.slice(i, i + n));
  return out;
}

export const chunkName = i => String(i).padStart(3, '0');

const q = s => "'" + s.replace(/'/g, "''") + "'";
export function lit(v, type) {
  if (v === null || v === undefined) return 'null';
  if (type === bool) return v ? 'true' : 'false';
  if ([num, int, big].includes(type)) return numStr(v);
  if (type === jsonb) return q(JSON.stringify(v)) + '::jsonb';
  return q(String(v));
}

export function onConflict(spec) {
  const cols = Object.keys(spec.types);
  const upd = cols.filter(c => !spec.conflict.includes(c) && c !== 'id');
  return `on conflict (${spec.conflict.join(', ')}) do update set ${upd.map(c => `${c} = excluded.${c}`).join(', ')}\n` +
    `where (${upd.map(c => 't.' + c).join(', ')}) is distinct from (${upd.map(c => 'excluded.' + c).join(', ')})`;
}

// Idempotent VALUES insert (for psql / Management API / MCP execute_sql).
export function insertSqlValues(spec, rows) {
  const cols = Object.keys(spec.types);
  const vals = rows.map(r => '(' + cols.map(c => lit(r[c], spec.types[c])).join(',') + ')').join(',\n');
  return `insert into ${spec.target} as t (${cols.join(', ')})\nvalues\n${vals}\n${onConflict(spec)};\n`;
}

// Idempotent insert from staged chunks fetched by pg_net (each response body = {"table","chunk","sha256","rows":[...]}).
export function insertSqlFromResponses(table, spec, minId, maxId) {
  const cols = Object.keys(spec.types);
  return `insert into ${spec.target} as t (${cols.join(', ')})\nselect ${cols.map(c => 'x.' + c).join(', ')}\n` +
    `from net._http_response r\ncross join lateral jsonb_populate_recordset(null::${spec.target}, r.content::jsonb -> 'rows') x\n` +
    `where r.id between ${minId} and ${maxId} and r.status_code = 200 and r.content::jsonb ->> 'table' = '${table}'\n${onConflict(spec)};\n`;
}

export const POST_SQL = [
  `select setval(pg_get_serial_sequence('content.investment_tracks', 'id'), coalesce((select max(id) from content.investment_tracks), 1), (select count(*) > 0 from content.investment_tracks));`,
  `select content.refresh_fund_views();`,
].join('\n');

// ---------------------------------------------------------------- resume log
export function appendLog(line) {
  fs.mkdirSync(path.dirname(ENV.logFile), { recursive: true });
  fs.appendFileSync(ENV.logFile, `- ${new Date().toISOString()} ${line}\n`);
}
export function doneSet() {
  if (!fs.existsSync(ENV.logFile)) return new Set();
  return new Set(fs.readFileSync(ENV.logFile, 'utf8').split('\n')
    .map(l => (l.match(/DONE (\S+ \S+ \S+)/) || [])[1]).filter(Boolean));
}
export const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
