// Validates every questionnaire definition in src/data/questionnaires/*.json against the zod schema in
// src/questionnaires/types.ts and the cross-checks the schema cannot express:
//   duplicate keys, `when` references (must exist, must come EARLIER, value must be a real option),
//   min > max, empty options, repeat without fields, draft/todo consistency.
// Usage: node scripts/questionnaires/build.mjs            (exit 1 on any problem)
//        import { validateAll } from "./build.mjs"        (used by src/test/questionnaires-data.test.ts)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "src/data/questionnaires");

async function loadSchema() {
  const out = await build({
    stdin: { contents: 'export * from "./types"; export * from "./logic";', resolveDir: path.join(ROOT, "src/questionnaires"), loader: "ts" },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    absWorkingDir: ROOT,
    logLevel: "silent",
  });
  const code = out.outputFiles[0].text;
  const tmp = path.join(ROOT, "node_modules", ".cache");
  fs.mkdirSync(tmp, { recursive: true });
  const file = path.join(tmp, `questionnaire-types-${process.pid}-${Date.now()}.mjs`);
  fs.writeFileSync(file, code);
  try {
    return await import(pathToFileURL(file).href);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function optionValues(q) {
  if (q.type === "consent") return q.options ?? [];
  return q.options ?? null;
}

export async function validateAll() {
  const { QuestionnaireSchema, estimateMinutes } = await loadSchema();
  const index_rows = [];
  const files = fs.readdirSync(DATA).filter((f) => f.endsWith(".json")).sort();
  const errors = [];
  const stats = [];
  for (const f of files) {
    const err = (m) => errors.push(`${f}: ${m}`);
    let def;
    try {
      def = JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
    } catch (e) {
      err(`invalid JSON (${e.message})`);
      continue;
    }
    const parsed = QuestionnaireSchema.safeParse(def);
    if (!parsed.success) {
      for (const i of parsed.error.issues.slice(0, 12)) err(`schema ${i.path.join(".")}: ${i.message}`);
      continue;
    }
    const d = parsed.data;
    if (`${d.key}.json` !== f) err(`key "${d.key}" does not match file name`);
    const index = new Map(); // key -> {q, pos}
    const sectionIds = new Set();
    let pos = 0;
    for (const s of d.sections) {
      if (sectionIds.has(s.id)) err(`duplicate section id ${s.id}`);
      sectionIds.add(s.id);
      for (const q of s.questions) {
        if (index.has(q.key)) err(`duplicate key ${q.key}`);
        index.set(q.key, { q, pos: pos++ });
        if (q.meta.sectionId !== s.id) err(`${q.key}: meta.sectionId ${q.meta.sectionId} != ${s.id}`);
      }
    }
    for (const [key, { q, pos: p }] of index) {
      const where = (m) => err(`${key}: ${m}`);
      if (q.min_val !== null && q.max_val !== null && q.min_val > q.max_val) where(`min_val ${q.min_val} > max_val ${q.max_val}`);
      if ((q.type === "choice" || q.type === "multi" || q.type === "consent") && (!q.options || q.options.length === 0)) where("choice/multi without options");
      if (q.options && new Set(q.options).size !== q.options.length) where("duplicate option values");
      if (q.type === "repeat" && (!q.fields || q.fields.length === 0)) where("repeat without fields");
      if (q.type !== "repeat" && q.fields) where("fields on a non-repeat question");
      if (q.format && q.type !== "text") where(`format ${q.format} on type ${q.type}`);
      if (!!q.meta.draft !== (q.origin === "seeld-draft")) where("meta.draft and origin seeld-draft disagree");
      if (q.meta.draft && !q.meta.todo) where("draft question without a todo");
      if (q.meta.afterKey && !index.has(q.meta.afterKey)) where(`afterKey ${q.meta.afterKey} not found`);
      if (q.meta.minEntries !== undefined && q.meta.maxEntries !== undefined && q.meta.minEntries > q.meta.maxEntries) where("minEntries > maxEntries");
      if (q.when) {
        const ref = index.get(q.when.id);
        if (!ref) where(`when references unknown key ${q.when.id}`);
        else {
          if (ref.pos >= p) where(`when references ${q.when.id} which does not come earlier`);
          const opts = optionValues(ref.q);
          if (opts) for (const v of [].concat(q.when.value)) if (!opts.includes(v)) where(`when value "${v}" is not an option of ${q.when.id}`);
        }
      }
      if (q.fields) {
        const ids = new Set();
        for (const f2 of q.fields) {
          if (ids.has(f2.id)) where(`duplicate sub-field id ${f2.id}`);
          ids.add(f2.id);
          if (f2.min !== undefined && f2.max !== undefined && f2.min > f2.max) where(`sub-field ${f2.id}: min > max`);
          if (f2.type === "choice" && (!f2.options || !f2.options.length)) where(`sub-field ${f2.id}: choice without options`);
        }
        for (const f2 of q.fields) {
          if (!f2.when) continue;
          const sib = q.fields.find((x) => x.id === f2.when.id);
          if (!sib) where(`sub-field ${f2.id}: when references unknown sibling ${f2.when.id}`);
          else if (sib.options) for (const v of [].concat(f2.when.value)) if (!sib.options.includes(v)) where(`sub-field ${f2.id}: when value "${v}" is not an option of ${sib.id}`);
        }
      }
    }
    if (d.screening) {
      const modules = d.sections.filter((s2) => s2.module);
      const gateKeys = new Set(d.screening.gates.map((g) => g.key));
      for (const g of d.screening.gates) {
        const ref = index.get(g.key);
        if (ref && (ref.q.allow_unknown || JSON.stringify(ref.q.options) !== JSON.stringify(["כן", "לא"]))) err(`screening gate ${g.key} must be yes/no only (no unknown)`);
        if (!ref) err(`screening gate ${g.key} not found`);
        else if (ref.q.meta.sectionId !== g.sectionId) err(`screening gate ${g.key} is not in section ${g.sectionId}`);
      }
      for (const m of modules) {
        if (!d.screening.gates.some((g) => g.sectionId === m.id)) err(`module ${m.id} has no screening gate`);
        for (const q of m.questions) if (!gateKeys.has(q.key) && !q.when) err(`${q.key}: module question that is neither a gate nor conditional`);
      }
    } else if (d.sections.some((s2) => s2.module)) err("modules declared without screening");
    const qs = [...index.values()].map((x) => x.q);
    index_rows.push({ key: d.key, title: d.title, description: d.description, status: d.status, group: d.group, sections: d.sections.length, questions: qs.length, minutes: estimateMinutes(d), drafts: qs.filter((q) => q.meta.draft).length, hasScreening: !!d.screening, sensitive: d.key === "health" });
    stats.push({ key: d.key, sections: d.sections.length, questions: qs.length, drafts: qs.filter((q) => q.meta.draft).length, repeats: qs.filter((q) => q.type === "repeat").length });
  }
  return { errors, stats, files, index: index_rows };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors, stats, index } = await validateAll();
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ errors, stats, index }));
    process.exit(0);
  }
  if (process.argv.includes("--write-index") && !errors.length) {
    fs.writeFileSync(path.join(ROOT, "src/data/questionnaires.index.json"), JSON.stringify(index, null, 1) + "\n");
    console.log("wrote src/data/questionnaires.index.json");
  }
  for (const s of stats) console.log(`ok  ${s.key.padEnd(22)} sections ${s.sections}  questions ${s.questions}  drafts ${s.drafts}  repeats ${s.repeats}`);
  if (errors.length) {
    console.error(`\n${errors.length} problem(s):`);
    for (const e of errors) console.error(" - " + e);
    process.exit(1);
  }
  console.log("questionnaires: all definitions valid");
}
