// Minimal TOML reader for supabase/config.toml (no dependency).
// Supports what that file uses: [table] and [a.b.c] headers, key = value with strings ("..."), integers,
// booleans, and single-line arrays of strings/numbers/booleans, plus # comments. Anything else throws, so an
// unexpected construct fails CI loudly instead of being skipped.

function stripComment(line) {
  let inStr = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "\\" && inStr) { i++; continue; }
    if (c === '"') inStr = !inStr;
    if (c === "#" && !inStr) return line.slice(0, i);
  }
  return line;
}

function parseScalar(raw, where) {
  const v = raw.trim();
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) throw new Error(`${where}: unterminated string`);
    return JSON.parse(v);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^[+-]?\d+$/.test(v)) return Number(v);
  if (/^[+-]?\d+\.\d+$/.test(v)) return Number(v);
  throw new Error(`${where}: unsupported value ${v}`);
}

function splitArray(body, where) {
  const items = [];
  let cur = "";
  let inStr = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "\\" && inStr) { cur += c + body[++i]; continue; }
    if (c === '"') inStr = !inStr;
    if (c === "," && !inStr) { items.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (inStr) throw new Error(`${where}: unterminated string in array`);
  if (cur.trim() !== "") items.push(cur);
  return items.map((s) => parseScalar(s, where));
}

/** @returns {Record<string, any>} nested object */
export function parseToml(text) {
  const root = {};
  let table = root;
  const seenTables = new Set();
  const lines = text.split(/\r?\n/);
  lines.forEach((rawLine, idx) => {
    const where = `line ${idx + 1}`;
    const line = stripComment(rawLine).trim();
    if (!line) return;
    const header = line.match(/^\[([A-Za-z0-9_.\-]+)\]$/);
    if (header) {
      const path = header[1];
      if (seenTables.has(path)) throw new Error(`${where}: duplicate table [${path}]`);
      seenTables.add(path);
      table = root;
      for (const part of path.split(".")) {
        if (table[part] === undefined) table[part] = {};
        if (typeof table[part] !== "object" || Array.isArray(table[part])) {
          throw new Error(`${where}: [${path}] collides with a value`);
        }
        table = table[part];
      }
      return;
    }
    if (line.startsWith("[")) throw new Error(`${where}: unsupported table syntax ${line}`);
    const kv = line.match(/^([A-Za-z0-9_\-]+)\s*=\s*(.+)$/);
    if (!kv) throw new Error(`${where}: cannot parse ${line}`);
    const [, key, rawValue] = kv;
    if (Object.prototype.hasOwnProperty.call(table, key)) throw new Error(`${where}: duplicate key ${key}`);
    const value = rawValue.trim();
    if (value.startsWith("[")) {
      if (!value.endsWith("]")) throw new Error(`${where}: multi-line arrays are not supported`);
      table[key] = splitArray(value.slice(1, -1), where);
    } else {
      table[key] = parseScalar(value, where);
    }
  });
  return root;
}
