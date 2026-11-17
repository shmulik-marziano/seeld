// MaslakaXmlParser: the Capital Market Authority uniform interface (root <Mimshak>, schema versions 008 and 009, one schema for every family).
// Detection is by CONTENT: the three-letter family code in the file name is only a hint and never decides a product type.
// Client-side and in-memory: uses DOMParser, never sends anything. Field mapping is documented in docs/product/REPORTS.md.
// Robustness rules (from ~2,300 real files): optional BOM / no XML declaration / surrounding whitespace; every value is trimmed and
// stripped of bidi marks; empty tag skeletons are "no data" (null), never zero; ReshumatSgira counts are ignored (unreliable);
// a file may hold two clients and a product up to five accounts; unknown codes degrade to "לא התקבל מידע" and are counted.
import { toIsoDate } from "../format";
import type { Coverage, DepositRow, InvestmentTrack, Loan, Person, Product, ProductExtras } from "../types";
import {
  HAFRASHA_PENSION, HAFRASHA_PROVIDENT, HOTZAA, MAFKID, STATUS_POLISA, STATUS_RECOGNISED_NO_MEANING, SUG_MUTZAR,
  cleanText, decideKind, familyHintFromName, isMacJunk, shortManufacturer,
} from "./codes";
import {
  countCode, emptyDiagnostics, noteNoMeaning, noteUnmapped, opaqueKey, type MaslakaFileInput, type MaslakaParser, type ParseDiagnostics, type ParseResult,
} from "./types";

const num = (s: string): number | null => {
  if (s === "") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
};
/** zero means "no cover / no premium" for insurance amounts */
const pos = (n: number | null): number | null => (n !== null && n > 0 ? n : null);

interface Candidate { product: Product; key: string; bitzua: string; asOf: string; group: string; complete: number; signature: string; file: string }

/** Strip BOM and surrounding whitespace so that DOMParser accepts files with or without an XML declaration. */
export function normaliseXmlText(text: string): string {
  return (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).trim();
}

export class MaslakaXmlParser implements MaslakaParser {
  /** leaf tag names the mapping reads (dev coverage report only) */
  readonly consumedTags = new Set<string>();

  parse(files: MaslakaFileInput[]): ParseResult {
    const diag = emptyDiagnostics();
    const persons = new Map<string, Person>();
    const candidates: Candidate[] = [];
    const loans: { loan: Loan; key: string; bitzua: string }[] = [];

    for (const f of files) {
      if (isMacJunk(f.name)) { diag.filesSkipped.push({ name: "(קובץ מערכת)", reason: "קובץ מערכת של macOS (שמתחיל ב-._), דילגנו עליו." }); continue; }
      let doc: Document;
      try {
        const text = normaliseXmlText(f.text);
        if (text === "") throw new Error("הקובץ ריק");
        doc = new DOMParser().parseFromString(text, "text/xml");
        if (doc.getElementsByTagName("parsererror").length) throw new Error("הקובץ אינו XML תקין");
        if (doc.documentElement.tagName !== "Mimshak") throw new Error("זה אינו קובץ של הממשק האחיד (שורש Mimshak חסר)");
        if (doc.getElementsByTagName("Mutzar").length === 0) throw new Error("לא נמצאו בקובץ מוצרים (Mutzar)");
      } catch (e) {
        diag.filesRejected.push({ name: "(קובץ)", reason: e instanceof Error ? e.message : "לא ניתן לקרוא את הקובץ" });
        continue;
      }
      diag.filesRead += 1;
      this.readFile(f.name, doc, diag, persons, candidates, loans);
    }

    // Newest extraction wins per product. Order: TAARICH-BITZUA, then data date, then the more complete file, then file name (deterministic).
    const byKey = new Map<string, Candidate[]>();
    for (const c of candidates) {
      const list = byKey.get(c.key);
      if (list) list.push(c);
      else byKey.set(c.key, [c]);
    }
    const newestDay: Record<string, string> = {};
    for (const c of candidates) if (c.bitzua.slice(0, 8) > (newestDay[c.group] ?? "")) newestDay[c.group] = c.bitzua.slice(0, 8);
    const products: Product[] = [];
    for (const versions of byKey.values()) {
      versions.sort((a, b) => b.bitzua.localeCompare(a.bitzua) || b.asOf.localeCompare(a.asOf) || b.complete - a.complete || a.file.localeCompare(b.file));
      const best = versions[0];
      if (versions.length > 1) {
        diag.superseded += versions.length - 1;
        diag.previousRun.replaced += 1;
        if (versions.slice(1).some((v) => v.signature !== best.signature)) diag.previousRun.changed += 1;
      }
      const older = best.bitzua.slice(0, 8) < (newestDay[best.group] ?? "");
      if (older) diag.previousRun.onlyInOlder += 1;
      products.push({ ...best.product, fromOlderExtraction: older });
    }
    products.sort((a, b) => a.id.localeCompare(b.id));

    const loanBest = new Map<string, { loan: Loan; bitzua: string }>();
    for (const l of loans) {
      const cur = loanBest.get(l.key);
      if (!cur || l.bitzua > cur.bitzua) loanBest.set(l.key, l);
    }
    const bump = (k: string) => { diag.groupsNotShown[k] = (diag.groupsNotShown[k] ?? 0) + 1; };
    for (const p of products) {
      const x = p.extras;
      if (x.feeBenefits.length) bump("MivneDmeiNihul (הטבות)");
      if (x.collection) bump("NetuneiGvia");
      if (x.hasClaim) bump("PirteyTvia");
      if (x.severance) bump("PerutShiabudIkul");
      if (x.hasProxy) bump("PerutMeyupeKoach");
    }
    const asOf = candidates.map((c) => c.asOf).filter(Boolean).sort().pop() ?? null;
    return { persons: [...persons.values()], products, loans: [...loanBest.values()].map((l) => l.loan), asOfDate: asOf, diagnostics: diag };
  }

  private t(el: Element | undefined | null, tag: string): string {
    if (!el) return "";
    this.consumedTags.add(tag);
    return cleanText(el.getElementsByTagName(tag)[0]?.textContent ?? "");
  }
  private kids(el: Element, name: string): Element[] {
    return Array.from(el.children).filter((c) => c.tagName === name);
  }

  private readFile(name: string, doc: Document, diag: ParseDiagnostics, persons: Map<string, Person>, out: Candidate[], loans: { loan: Loan; key: string; bitzua: string }[]) {
    const root = doc.documentElement;
    const head = root.getElementsByTagName("KoteretKovetz")[0];
    const bitzua = this.t(head, "TAARICH-BITZUA");
    const yatzran = root.getElementsByTagName("YeshutYatzran")[0];
    const mfrId = this.t(yatzran, "KOD-MEZAHE-YATZRAN");
    const mfrName = shortManufacturer(cleanText(Array.from(yatzran?.children ?? []).find((c) => c.tagName === "SHEM-YATZRAN")?.textContent ?? ""));
    this.consumedTags.add("SHEM-YATZRAN");
    const familyHint = familyHintFromName(name) ?? "";
    const fileClients = new Set<string>();
    const seenIds = new Map<string, number>();

    for (const m of Array.from(root.getElementsByTagName("Mutzar"))) {
      const nm = this.kids(m, "NetuneiMutzar")[0];
      const sugMutzar = this.t(nm, "SUG-MUTZAR");
      countCode(diag, "SUG-MUTZAR", sugMutzar);
      if (!SUG_MUTZAR[sugMutzar]) noteUnmapped(diag, "SUG-MUTZAR", sugMutzar || "(ריק)");
      const client = nm?.getElementsByTagName("YeshutLakoach")[0];
      const idRaw = this.t(client, "MISPAR-ZIHUY-LAKOACH");
      const key = opaqueKey(idRaw || `${familyHint}:${mfrId}`);
      fileClients.add(key);
      if (!persons.has(key)) {
        const bd = toIsoDate(this.t(client, "TAARICH-LEYDA"));
        persons.set(key, {
          key,
          displayName: `${this.t(client, "SHEM-PRATI")} ${this.t(client, "SHEM-MISHPACHA")}`.trim() || "לא התקבל שם",
          idMasked: idRaw.replace(/\D/g, "").length >= 4 ? `***-**-${idRaw.replace(/\D/g, "").slice(-3)}` : "***-**-***",
          role: persons.size === 0 ? "self" : "other",
          birthYear: bd ? Number(bd.slice(0, 4)) : null,
        });
      }
      const employer = this.t(nm?.getElementsByTagName("YeshutMaasik")[0], "SHEM-MAASIK") || null;

      for (const hs of this.kids(m, "HeshbonotOPolisot")) {
        for (const h of this.kids(hs, "HeshbonOPolisa")) {
          const plan = this.t(h, "SHEM-TOCHNIT");
          const policy = this.t(h, "MISPAR-POLISA-O-HESHBON");
          const decision = decideKind(sugMutzar, plan);
          const statusCode = this.t(h, "STATUS-POLISA-O-CHESHBON");
          countCode(diag, "STATUS-POLISA-O-CHESHBON", statusCode);
          const status = STATUS_POLISA[statusCode] ?? "unknown";
          if (!STATUS_POLISA[statusCode]) {
            if (STATUS_RECOGNISED_NO_MEANING.has(statusCode)) noteNoMeaning(diag, "STATUS-POLISA-O-CHESHBON", statusCode);
            else if (statusCode) noteUnmapped(diag, "STATUS-POLISA-O-CHESHBON", statusCode);
          }
          const asOf = toIsoDate(this.t(h, "TAARICH-NECHONUT")) ?? "";
          const baseKey = `${sugMutzar}|${mfrId}|${policy}|${plan}`;
          const nth = (seenIds.get(`${key}|${baseKey}`) ?? 0) + 1;
          seenIds.set(`${key}|${baseKey}`, nth);
          const id = `M-${opaqueKey(`${baseKey}|${key}`).slice(2)}${nth > 1 ? `-${nth}` : ""}`;
          const base: Product = {
            id, ownerKey: key, kind: decision.kind, insuranceType: decision.insuranceType, manufacturer: mfrName || "לא התקבל שם יצרן", planName: plan || "לא התקבל שם תוכנית",
            policyNumber: policy || null, status, joinDate: toIsoDate(this.t(h, "TAARICH-HITZTARFUT-MUTZAR")) ?? toIsoDate(this.t(h, "TAARICH-HITZTARFUT-RISHON")),
            endDate: null, asOfDate: asOf || null, sources: ["maslaka"], balance: null, balanceSplit: { employee: null, employer: null, severance: null, other: null },
            projectedPensionMonthlyNoDeposits: null, projectedPensionMonthlyWithDeposits: null, projectedCapitalNoDeposits: null, projectedCapitalWithDeposits: null,
            feeFromDepositPct: null, feeFromBalancePct: null, returnPct: null, tracks: [], employer: null, salary: null, salaryDate: null,
            lastDepositDate: null, currentMonthlyDeposit: null, deposits: [], monthlyPremium: null, premiumKind: "unknown", typeBasis: decision.basis, term: null, planClass: null,
            extras: { feeBenefits: [], collection: null, hasClaim: null, severance: null, hasProxy: null }, coverages: [], fromOlderExtraction: false,
          };
          const hasBalances = h.getElementsByTagName("PerutYitrot").length > 0;
          const isInsurance = decision.kind === "insurance" || (decision.kind === "unknown" && !hasBalances);
          const product = isInsurance ? this.insurance(base, h, key, plan) : this.savings(base, h, employer, diag);
          product.extras = this.extras(h);
          const complete = Array.from(h.getElementsByTagName("*")).filter((e) => e.children.length === 0 && (e.textContent ?? "").trim() !== "").length;
          const signature = JSON.stringify([product.balance, product.status, product.asOfDate, product.returnPct, product.monthlyPremium, product.deposits.length, product.tracks.length]);
          out.push({ product, key: `${key}|${baseKey}|${nth}`, bitzua, asOf, group: sugMutzar, complete, signature, file: name });
          this.loansOf(h, product, loans, bitzua);
        }
      }
    }
    if (fileClients.size > 1) diag.twoPersonFiles += 1;
  }

  /** Groups read into the model for which no report block exists yet. */
  private extras(h: Element): ProductExtras {
    const benefits: ProductExtras["feeBenefits"] = [];
    for (const s of Array.from(h.getElementsByTagName("PerutMivneDmeiNihul"))) {
      const pct = num(this.t(s, "ACHOZ-HATAVA"));
      const end = toIsoDate(this.t(s, "TAARICH-SIUM-HATAVA"));
      const type = this.t(s, "SUG-HATAVA");
      this.t(s, "KAYEMET-HATAVA");
      if ((pct !== null && pct > 0) || end) benefits.push({ kind: HOTZAA[this.t(s, "SUG-HOTZAA")] ?? "unknown", discountPct: pct, endDate: end, benefitType: type || null });
    }
    const gvia = h.getElementsByTagName("NetuneiGvia")[0];
    const freq = this.t(gvia, "TADIRUT-TASHLUM");
    const method = this.t(gvia, "OFEN-HATZMADAT-GVIA");
    const tvia = h.getElementsByTagName("PirteyTvia")[0];
    const shiabud = h.getElementsByTagName("PerutShiabudIkul")[0];
    const waived = this.t(shiabud, "HUTAL-SHIABUD");
    const forfeited = this.t(shiabud, "HUTAL-IKUL");
    const proxy = h.getElementsByTagName("PerutMeyupeKoach")[0];
    return {
      feeBenefits: benefits,
      collection: freq || method ? { frequency: freq || null, method: method || null } : null,
      hasClaim: tvia ? this.t(tvia, "YESH-TVIA") === "1" : null,
      severance: waived === "1" || forfeited === "1" ? { waived: waived || null, forfeited: forfeited || null } : null,
      hasProxy: proxy ? this.t(proxy, "KAYAM-MEYUPE-KOACH") === "1" : null,
    };
  }

  private insurance(p: Product, h: Element, ownerKey: string, plan: string): Product {
    if (p.insuranceType === null) p.insuranceType = decideKind("6", plan).insuranceType ?? "other";
    p.monthlyPremium = pos(this.sumTags(h, "DMEI-BITUAH-LETASHLUM-BAPOAL")) ?? pos(this.sumTags(h, "MESHALEM-HAKISUY"));
    // TODO-verify: payment frequency (TADIRUT-HATSHLUM) decides monthly vs annual; premiumKind stays "unknown" until confirmed
    const amount = pos(num(this.t(h, "SCHUM-BITUACH"))) ?? pos(num(this.t(h, "SCHUM-BITUAH-LEMAVET")));
    const kindMap: Record<string, Coverage["kind"] | undefined> = {
      life: "death", mortgageLife: "mortgageLife", health: "health", nursing: "nursing", personalAccidents: "personalAccidents",
      criticalIllness: "criticalIllness", disability: "disability", accidentDisability: "accidentDisability",
    };
    const k = kindMap[p.insuranceType];
    if (k) p.coverages.push({ kind: k, insuredKey: ownerKey, productId: p.id, amount: k === "disability" ? null : amount, monthlyBenefit: k === "disability" ? amount : null, premium: p.monthlyPremium });
    return p;
  }

  private sumTags(h: Element, tag: string): number | null {
    this.consumedTags.add(tag);
    const vals = Array.from(h.getElementsByTagName(tag)).map((e) => num(cleanText(e.textContent ?? ""))).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }

  private savings(p: Product, h: Element, employer: string | null, diag: ParseDiagnostics): Product {
    const pensionLike = p.kind === "pension";
    const hafrashaTable = pensionLike ? HAFRASHA_PENSION : HAFRASHA_PROVIDENT;
    // balance: every Yitrot block of the newest value date (each block is one investment track)
    const blocks = Array.from(h.getElementsByTagName("Yitrot"));
    const dates = blocks.map((b) => this.t(b, "TAARICH-ERECH-TZVIROT")).filter(Boolean).sort();
    const latest = dates[dates.length - 1];
    let total: number | null = null;
    const split = { employee: null as number | null, employer: null as number | null, severance: null as number | null, other: null as number | null };
    for (const b of blocks.filter((x) => this.t(x, "TAARICH-ERECH-TZVIROT") === latest)) {
      for (const y of Array.from(b.getElementsByTagName("PerutYitrot"))) {
        const v = num(this.t(y, "TOTAL-CHISACHON-MTZBR"));
        if (v === null) continue;
        total = (total ?? 0) + v;
        const code = this.t(y, "KOD-SUG-HAFRASHA");
        countCode(diag, "KOD-SUG-HAFRASHA", code);
        const comp = hafrashaTable[code];
        if (!comp && code && !HAFRASHA_PENSION[code] && !HAFRASHA_PROVIDENT[code]) noteUnmapped(diag, "KOD-SUG-HAFRASHA", code);
        split[comp ?? "other"] = (split[comp ?? "other"] ?? 0) + v;
      }
    }
    p.balance = total;
    p.balanceSplit = split;
    if (latest) p.asOfDate = toIsoDate(latest) ?? p.asOfDate;

    p.returnPct = num(this.t(h.getElementsByTagName("Tsua")[0], "SHEUR-TSUA-NETO"));
    p.projectedCapitalNoDeposits = num(this.t(h, "TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT"));
    p.projectedCapitalWithDeposits = num(this.t(h, "TOTAL-CHISACHON-MITZTABER-TZAFUY"));
    p.projectedPensionMonthlyNoDeposits = num(this.t(h, "KITZVAT-HODSHIT-TZFUYA"));
    p.projectedPensionMonthlyWithDeposits = num(this.t(h, "SCHUM-KITZVAT-ZIKNA"));

    // fees: structure first (by expense type), then the "actually charged" block. Empty value stays null; 0.00 stays 0.
    for (const s of Array.from(h.getElementsByTagName("PerutMivneDmeiNihul"))) {
      const code = this.t(s, "SUG-HOTZAA");
      countCode(diag, "SUG-HOTZAA", code);
      const kindOfFee = HOTZAA[code];
      const pct = num(this.t(s, "SHEUR-DMEI-NIHUL"));
      if (kindOfFee === "deposit" && p.feeFromDepositPct === null) p.feeFromDepositPct = pct;
      if (kindOfFee === "balance" && p.feeFromBalancePct === null) p.feeFromBalancePct = pct;
    }
    const act = h.getElementsByTagName("HotzaotBafoalLehodeshDivoach")[0];
    if (p.feeFromDepositPct === null) p.feeFromDepositPct = num(this.t(act, "SHEUR-DMEI-NIHUL-HAFKADA"));

    // tracks, merged by name (the same track repeats per deposit component)
    const tracks = new Map<string, InvestmentTrack>();
    for (const t of Array.from(h.getElementsByTagName("PerutMasluleiHashkaa"))) {
      const nameT = this.t(t, "SHEM-MASLUL-HASHKAA") || "מסלול ללא שם";
      const cur = tracks.get(nameT) ?? { name: nameT, balance: null, depositSharePct: null, annualCostPct: null, returnPct: null, return12mPct: null, return3yAvgPct: null, return5yAvgPct: null };
      const bal = num(this.t(t, "SCHUM-TZVIRA-BAMASLUL"));
      cur.balance = bal === null ? cur.balance : (cur.balance ?? 0) + bal;
      cur.depositSharePct = cur.depositSharePct ?? num(this.t(t, "ACHUZ-HAFKADA-LEHASHKAA"));
      cur.annualCostPct = cur.annualCostPct ?? num(this.t(t, "SHIUR-ALUT-SHNATIT-ZPUIA-LMSLUL-HASHKAH"));
      cur.returnPct = cur.returnPct ?? num(this.t(t, "TSUA-NETO"));
      tracks.set(nameT, cur);
    }
    p.tracks = [...tracks.values()];

    // employment (shown only with viewDeposits) and deposits
    p.employer = employer;
    const emp = h.getElementsByTagName("PirteiHaasaka")[0];
    p.salary = num(this.t(emp, "SACHAR-POLISA"));
    p.salaryDate = toIsoDate(this.t(emp, "TAARICH-MASKORET"));
    const rows = new Map<string, DepositRow>();
    let last: string | null = null;
    for (const d of Array.from(h.getElementsByTagName("PerutHafkadotMetchilatShana"))) {
      const iso = toIsoDate(this.t(d, "TAARICH-ERECH-HAFKADA"));
      if (!iso) continue;
      if (!last || iso > last) last = iso;
      const month = iso.slice(0, 7);
      const row = rows.get(month) ?? { month, employee: null, employer: null, severance: null, other: null, salary: null };
      const amt = num(this.t(d, "SCHUM-HAFKADA-SHESHULAM"));
      const mafkid = this.t(d, "SUG-MAFKID");
      const hafrasha = this.t(d, "SUG-HAFRASHA");
      countCode(diag, "SUG-MAFKID", mafkid);
      if (mafkid && !MAFKID[mafkid]) noteUnmapped(diag, "SUG-MAFKID", mafkid);
      const comp = pensionLike && hafrasha === "3" ? "severance" : MAFKID[mafkid] ?? "other";
      if (amt !== null) row[comp] = (row[comp] ?? 0) + amt;
      const sal = num(this.t(d, "SACHAR-BERAMAT-HAFKADA"));
      if (sal !== null) row.salary = Math.max(row.salary ?? 0, sal);
      rows.set(month, row);
    }
    p.deposits = [...rows.values()].sort((a, b) => b.month.localeCompare(a.month));
    p.lastDepositDate = last;

    // pension-fund risk covers (monthly benefits)
    if (pensionLike) {
      const dis = pos(num(this.t(h, "SACH-PENSIAT-NECHUT")));
      const surv = pos(num(this.t(h, "KITZBAT-SHEERIM-LEALMAN-O-ALMANA")));
      this.t(h, "KITZBAT-SHEERIM-LEYATOM"); this.t(h, "KITZBAT-SHEERIM-LEHORE-NITMACH");
      if (dis !== null) p.coverages.push({ kind: "disability", insuredKey: p.ownerKey, productId: p.id, amount: null, monthlyBenefit: dis, premium: null });
      if (surv !== null) p.coverages.push({ kind: "survivors", insuredKey: p.ownerKey, productId: p.id, amount: null, monthlyBenefit: surv, premium: null });
    }
    const death = pos(num(this.t(h, "SCHUM-BITUAH-LEMAVET")));
    if (death !== null) p.coverages.push({ kind: "death", insuredKey: p.ownerKey, productId: p.id, amount: death, monthlyBenefit: null, premium: null });
    return p;
  }

  private loansOf(h: Element, p: Product, out: { loan: Loan; key: string; bitzua: string }[], bitzua: string) {
    for (const l of Array.from(h.getElementsByTagName("Halvaa"))) {
      if (this.t(l, "YESH-HALVAA-BAMUTZAR") !== "1") continue; // 1 = has a loan (15 of 2,778 accounts in the corpus)
      const loan: Loan = {
        productId: p.id, productLabel: `${p.planName}, ${p.manufacturer}`,
        startDate: toIsoDate(this.t(l, "TAARICH-KABALAT-HALVAA")), amount: num(this.t(l, "SCHUM-HALVAA")), interestPct: num(this.t(l, "RIBIT")),
        monthlyPayment: num(this.t(l, "SCHUM-HECHZER-TKUFATI")), balance: num(this.t(l, "YITRAT-HALVAA")), endDate: toIsoDate(this.t(l, "TAARICH-SIYUM-HALVAA")),
      };
      out.push({ loan, key: `${p.id}|${this.t(l, "MISDAR-SIDURI-SHEL-HAHALVAA")}`, bitzua });
    }
  }
}
