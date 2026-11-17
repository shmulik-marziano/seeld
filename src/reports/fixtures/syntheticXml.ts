// SYNTHETIC uniform-interface XML and Har Habituach rows that mimic the STRUCTURE of the real files (tag names, nesting, code shapes,
// real quirks). Every value below is invented by hand; nothing is copied from a real file. Used by parser tests only.

export type SyntheticFamily = "INK" | "INP" | "KGM" | "PNN" | "ING" | "INM" | "PNO";

export interface XmlOpts {
  /** only picks the default plan name; the parser must not depend on it */
  family: SyntheticFamily;
  /** yyyymmddhhmmss */
  bitzua: string;
  manufacturerId?: string;
  manufacturerName?: string;
  policy?: string;
  plan?: string;
  /** SUG-MUTZAR override (default by family) */
  sugMutzar?: number | string;
  /** STATUS-POLISA-O-CHESHBON override */
  status?: number | string;
  balanceScale?: number;
  idNumber?: string;
  /** add a second client (a second Mutzar with its own YeshutLakoach) */
  secondClientId?: string;
  /** accounts per product (1..5) */
  accounts?: number;
  broken?: boolean;
  bom?: boolean;
  noDeclaration?: boolean;
  /** whitespace before the root element and after it */
  padding?: boolean;
  /** leave the savings skeleton with empty values */
  emptySkeleton?: boolean;
  /** put wrong ReshumatSgira counts in the file */
  wrongCounts?: boolean;
  /** add the "read, not shown yet" groups */
  extraGroups?: boolean;
  /** spaces and RLM marks around text values */
  dirtyText?: boolean;
  /** how many leaf values to blank (to make a less complete copy of the same run) */
  thin?: boolean;
}

const tag = (n: string, v: string | number = "") => `<${n}>${v}</${n}>`;
const empty = (n: string) => `<${n}/>`;

function client(id: string, first: string) {
  return `<YeshutLakoach>${tag("SUG-MEZAHE-LAKOACH", 1)}${tag("MISPAR-ZIHUY-LAKOACH", id)}${tag("SHEM-PRATI", first)}${tag("SHEM-MISHPACHA", "דוגמה")}${tag("MIN", 2)}${tag("TAARICH-LEYDA", "19840101")}</YeshutLakoach>`;
}

function savingsBody(o: { policy: string; plan: string; scale: number; pension: boolean; status: string; skeleton: boolean; extra: boolean; dirty: boolean; thin: boolean }) {
  const s = o.scale;
  const v = (x: string) => (o.skeleton ? "" : x);
  const yitrot = (comps: [number, number][]) =>
    `<Yitrot>${tag("TAARICH-ERECH-TZVIROT", "20261031")}${comps.map(([c, val]) => `<PerutYitrot>${tag("KOD-SUG-ITRA", 2)}${tag("KOD-SUG-HAFRASHA", c)}${tag("TOTAL-CHISACHON-MTZBR", v((val * s).toFixed(2)))}${tag("TOTAL-ERKEI-PIDION", v((val * s).toFixed(2)))}</PerutYitrot>`).join("")}</Yitrot>`;
  const deposits = o.skeleton ? "" : Array.from({ length: 4 }, (_, i) => {
    const d = `2026${String(10 - i).padStart(2, "0")}09`;
    const row = (mafkid: number, hafrasha: number, amt: number) => `<PerutHafkadotMetchilatShana>${tag("TAARICH-ERECH-HAFKADA", d)}${tag("KOD-SUG-HAFKADA", 2)}${tag("SUG-HAFRASHA", hafrasha)}${tag("SUG-MAFKID", mafkid)}${tag("SCHUM-HAFKADA-SHESHULAM", amt.toFixed(2))}${tag("SACHAR-BERAMAT-HAFKADA", "10000.00")}</PerutHafkadotMetchilatShana>`;
    return row(1, o.pension ? 1 : 8, 600) + row(2, o.pension ? 2 : 9, 650) + (o.pension ? row(2, 3, 833) : "") + (i === 0 ? row(5, 4, 25) : "");
  }).join("");
  const plan = o.dirty ? `‏  ${o.plan}  ` : o.plan;
  const extra = o.extra
    ? `<NetuneiGvia>${tag("TADIRUT-TASHLUM", 4)}${tag("OFEN-HATZMADAT-GVIA", 1)}</NetuneiGvia><PirteyTvia>${tag("YESH-TVIA", 1)}</PirteyTvia><PerutShiabudIkul>${tag("HUTAL-SHIABUD", 1)}${tag("HUTAL-IKUL", 2)}</PerutShiabudIkul><PerutMeyupeKoach>${tag("KAYAM-MEYUPE-KOACH", 1)}</PerutMeyupeKoach>`
    : `<NetuneiGvia>${empty("TADIRUT-TASHLUM")}${empty("OFEN-HATZMADAT-GVIA")}</NetuneiGvia><PirteyTvia>${tag("YESH-TVIA", 2)}</PirteyTvia><PerutShiabudIkul>${tag("HUTAL-SHIABUD", 2)}${tag("HUTAL-IKUL", 2)}</PerutShiabudIkul><PerutMeyupeKoach>${tag("KAYAM-MEYUPE-KOACH", 2)}</PerutMeyupeKoach>`;
  const benefit = o.extra ? `<PerutMivneDmeiNihul>${tag("SUG-HOTZAA", 1)}${tag("SHEUR-DMEI-NIHUL", "0.25")}${tag("SUG-HATAVA", 2)}${tag("ACHOZ-HATAVA", "10.00")}${tag("TAARICH-SIUM-HATAVA", "20271231")}</PerutMivneDmeiNihul>` : "";
  return `
  ${tag("ASMACHTA-MEKORIT", "X")}${tag("MISPAR-POLISA-O-HESHBON", o.policy)}${tag("SHEM-TOCHNIT", plan)}
  ${tag("TAARICH-NECHONUT", "20261031")}${tag("TAARICH-HITZTARFUT-MUTZAR", "20100101")}${tag("STATUS-POLISA-O-CHESHBON", o.status)}
  <Tsua>${tag("SHEUR-TSUA-NETO", v("5.50"))}</Tsua>
  <PirteiTaktziv>
    <PirteiHaasaka>${tag("SACHAR-POLISA", v("10000.00"))}${tag("TAARICH-MASKORET", "20260930")}</PirteiHaasaka>
    ${deposits}
    <PerutMasluleiHashkaa>${tag("KOD-SUG-MASLUL", 1)}${tag("KOD-SUG-HAFRASHA", 1)}${tag("ACHUZ-HAFKADA-LEHASHKAA", "60.00")}${tag("SCHUM-TZVIRA-BAMASLUL", v((30000 * s).toFixed(2)))}${tag("SHEM-MASLUL-HASHKAA", "מסלול כללי")}${tag("TSUA-NETO", "6.00")}</PerutMasluleiHashkaa>
    <PerutMasluleiHashkaa>${tag("KOD-SUG-MASLUL", 1)}${tag("KOD-SUG-HAFRASHA", 2)}${tag("ACHUZ-HAFKADA-LEHASHKAA", "60.00")}${tag("SCHUM-TZVIRA-BAMASLUL", v((20000 * s).toFixed(2)))}${tag("SHEM-MASLUL-HASHKAA", "מסלול כללי")}</PerutMasluleiHashkaa>
    <PerutMasluleiHashkaa>${tag("KOD-SUG-MASLUL", 2)}${tag("KOD-SUG-HAFRASHA", 1)}${tag("ACHUZ-HAFKADA-LEHASHKAA", "40.00")}${tag("SCHUM-TZVIRA-BAMASLUL", v((10000 * s).toFixed(2)))}${tag("SHEM-MASLUL-HASHKAA", "מסלול מניות")}</PerutMasluleiHashkaa>
    <PerutHotzaot><HotzaotBafoalLehodeshDivoach>${tag("SHEUR-DMEI-NIHUL-HAFKADA", "1.50")}${tag("SHEUR-DMEI-NIHUL-TZVIRA", "0.02")}</HotzaotBafoalLehodeshDivoach>
      <MivneDmeiNihul><PerutMivneDmeiNihul>${tag("SUG-HOTZAA", 2)}${tag("SHEUR-DMEI-NIHUL", v("1.40"))}</PerutMivneDmeiNihul><PerutMivneDmeiNihul>${tag("SUG-HOTZAA", 1)}${tag("SHEUR-DMEI-NIHUL", v("0.25"))}</PerutMivneDmeiNihul>${benefit}</MivneDmeiNihul></PerutHotzaot>
    <BlockItrot>${yitrot(o.pension ? [[1, 10000], [2, 20000]] : [[8, 30000]])}${yitrot(o.pension ? [[3, 30000]] : [[9, 30000]])}</BlockItrot>
    ${extra}
  </PirteiTaktziv>
  <YitraLefiGilPrisha>${tag("TOTAL-CHISACHON-MITZTABER-TZAFUY", v("900000.00"))}${tag("TZVIRAT-CHISACHON-CHAZUYA-LELO-PREMIYOT", v("500000.00"))}${tag("KITZVAT-HODSHIT-TZFUYA", v("2000.00"))}${tag("SCHUM-KITZVAT-ZIKNA", v("3500.00"))}</YitraLefiGilPrisha>
  ${o.pension && !o.skeleton ? tag("SACH-PENSIAT-NECHUT", "6000.00") + tag("KITZBAT-SHEERIM-LEALMAN-O-ALMANA", "3600.00") : ""}
  <Halvaa>${tag("YESH-HALVAA-BAMUTZAR", o.skeleton ? 2 : 1)}${tag("MISDAR-SIDURI-SHEL-HAHALVAA", 1)}${tag("SCHUM-HALVAA", v("20000.00"))}${tag("TAARICH-KABALAT-HALVAA", v("20240101"))}${tag("TAARICH-SIYUM-HALVAA", v("20290101"))}${tag("YITRAT-HALVAA", v("15000.00"))}${tag("RIBIT", v("4.00"))}${tag("SCHUM-HECHZER-TKUFATI", v("400.00"))}</Halvaa>`;
}

function insuranceBody(policy: string, plan: string, status: string) {
  return `${tag("MISPAR-POLISA-O-HESHBON", policy)}${tag("SHEM-TOCHNIT", plan)}${tag("TAARICH-NECHONUT", "20261031")}${tag("TAARICH-HITZTARFUT-MUTZAR", "20200101")}${tag("STATUS-POLISA-O-CHESHBON", status)}<Kisuim><ZihuiKisui><PirteiKisuiBeMutzar>${tag("SCHUM-BITUACH", "500000.00")}${tag("DMEI-BITUAH-LETASHLUM-BAPOAL", "70.00")}</PirteiKisuiBeMutzar></ZihuiKisui></Kisuim>`;
}

const DEFAULT_MUTZAR: Record<SyntheticFamily, number> = { PNN: 2, PNO: 2, KGM: 4, INK: 8, INP: 6, INM: 7, ING: 6 };

function mutzar(o: XmlOpts, idNumber: string, first: string, accountOffset: number): string {
  const sug = Number(o.sugMutzar ?? DEFAULT_MUTZAR[o.family]);
  const plan = o.plan ?? (sug === 2 ? "קרן פנסיה לדוגמה" : sug === 4 ? "קרן השתלמות לדוגמה" : sug === 3 ? "קופת גמל לדוגמה" : sug === 9 ? "גמל להשקעה לדוגמה" : sug === 10 ? "גמל להשקעה לילד לדוגמה" : sug === 1 || sug === 5 ? "ביטוח מנהלים לדוגמה" : sug === 7 ? "ריסק משכנתא לדוגמה" : "ביטוח חיים לדוגמה");
  const status = String(o.status ?? 1);
  const savings = [1, 2, 3, 4, 5, 9, 10].includes(sug);
  const accounts = Array.from({ length: o.accounts ?? 1 }, (_, i) => {
    const policy = `${o.policy ?? "900001"}${i === 0 && accountOffset === 0 ? "" : `${accountOffset}${i}`}`;
    const body = savings
      ? savingsBody({ policy, plan, scale: o.balanceScale ?? 1, pension: sug === 2, status, skeleton: !!o.emptySkeleton, extra: !!o.extraGroups, dirty: !!o.dirtyText, thin: !!o.thin })
      : insuranceBody(policy, plan, status);
    return `<HeshbonOPolisa>${body}</HeshbonOPolisa>`;
  }).join("");
  return `<Mutzar>
   <YeshutNimaansofi>${tag("KOD-NIMAAN", 2)}</YeshutNimaansofi>
   <NetuneiMutzar>${tag("SUG-MUTZAR", sug)}${tag("STATUS-RESHOMA", 1)}
     <YeshutMaasik>${tag("SHEM-MAASIK", "מעסיק דוגמה בע\"מ")}${tag("STATUS-MAASIK", 1)}</YeshutMaasik>${client(idNumber, first)}
   </NetuneiMutzar>
   <HeshbonotOPolisot>${accounts}</HeshbonotOPolisot>
  </Mutzar>`;
}

export function syntheticMaslakaXml(o: XmlOpts): string {
  if (o.broken) return "<Mimshak><KoteretKovetz>";
  const mutzarim = [mutzar(o, o.idNumber ?? "000000018", "אורית", 0)];
  if (o.secondClientId) mutzarim.push(mutzar({ ...o, policy: `${o.policy ?? "900001"}7` }, o.secondClientId, "יובל", 7));
  const reshuma = o.wrongCounts ? `<ReshumatSgira>${tag("KAMUT-METAFELIM", 9)}${tag("KAMUT-MUTZARIM", 99)}${tag("KAMUT-POLISOT", 0)}${tag("KAMUT-YATZRANIM", 5)}</ReshumatSgira>` : "";
  const xml = `${o.noDeclaration ? "" : '<?xml version="1.0" encoding="UTF-8"?>\n'}<Mimshak>
 <KoteretKovetz>${tag("SUG-MIMSHAK", 2)}${tag("MISPAR-GIRSAT-XML", "009")}${tag("TAARICH-BITZUA", o.bitzua)}${tag("KOD-SHOLEACH", "100000001")}</KoteretKovetz>
 ${reshuma}
 <YeshutYatzran>${tag("KOD-MEZAHE-YATZRAN", o.manufacturerId ?? "500000001")}${tag("SHEM-YATZRAN", o.manufacturerName ?? 'יצרן דוגמה בע"מ')}
  <Mutzarim>${mutzarim.join("\n")}</Mutzarim>
 </YeshutYatzran>
</Mimshak>`;
  return `${o.bom ? "﻿" : ""}${o.padding ? "\n  \t " : ""}${xml}${o.padding ? "\n \n" : ""}`;
}

const HEAD = ["תעודת זהות", "ענף ראשי", "ענף (משני)", "סוג מוצר", "חברה", "תקופת ביטוח", "פרטים נוספים", 'פרמיה בש"ח', "סוג פרמיה", "מספר פוליסה", "סיווג תכנית"];
const pad = (r: string[], n = 11) => [...r, ...Array(Math.max(0, n - r.length)).fill("")];
const domainRow = (t: string) => pad(["", t]);

/** Rows as the Har Habituach sheet gives them (layout of the real export: title on row 2, headers on row 4). All invented. */
export function syntheticHarRows(withProducts = true): string[][] {
  const rows: string[][] = [
    Array(11).fill(""),
    pad(["", "התיק הביטוחי, הופק מאתר 'הר הביטוח' של משרד האוצר, בתאריך", "", "", "", "11/11/2026"]),
    Array(11).fill(""),
    HEAD,
    domainRow("תחום - בריאות ותאונות אישיות"),
  ];
  if (withProducts) {
    rows.push(["000000018", "ביטוח בריאות", "השתלות", "פוליסת ביטוח", 'חברת דוגמה בע"מ', "01/01/2020 - 31/12/2030", "", "120", "חודשית", "900101", "אישי"]);
    rows.push(["000000018", "ביטוח בריאות", "תאונות אישיות", "תאונות אישיות", 'חברת דוגמה בע"מ', "01/03/2021", "", "480", "שנתית", "900102", "אישי"]);
    rows.push(domainRow("תחום - חיים ואבדן כושר עבודה"));
    rows.push(["000000018", "ביטוח חיים", "ביטוח חיים למקרה מוות", "פוליסת ביטוח", 'חברת דוגמה בע"מ', "01/01/2019 - 01/01/2020", "", "60", "חודשית", "900103", "קבוצתי"]);
  }
  return rows;
}

/** Every Har Habituach quirk in one hand-written sheet. */
export function syntheticHarRowsQuirks(): string[][] {
  const co = 'חברת דוגמה בע"מ';
  return [
    ...syntheticHarRows(false).slice(0, 4).map((r, i) => (i === 3 ? [...HEAD, ""] : [...r, ""])), // 12 columns: unnamed extra column
    [...domainRow("תחום - כללי"), ""],
    ["000000018", "ביטוח רכב", "רכב חובה", "פוליסת ביטוח", co, "מתחדש", "גיל הנהג הצעיר ביותר 30", "300", "שנתית", "12-345-", "אישי", ""],
    ["", "", "", "", "", "", "סה״כ חודשי", "25", "", "", "", ""], // continuation row (premium note)
    ["000000018", "ביטוח רכב", "רכב חובה", "פוליסת ביטוח", co, "מתחדש", "גיל הנהג הצעיר ביותר 30", "300", "שנתית", "12-345-", "אישי", ""], // exact duplicate
    ["000000018", "ביטוח דירה", "ביטוח מבנה", "פוליסת ביטוח", co, "לכל החיים", "", "1000", "חד פעמית", "55-1-", "אישי", ""],
    ["", "", "", "סיכום", "", "", "", "=H6+H7+H10)/12", "", "", "", ""], // summary row typed by hand (formula as text)
    [";", "", "", "", "", "", "", "", "", "", "", ""], // separator between two persons
    [...domainRow("תחום - בריאות ותאונות אישיות"), ""],
    ["000000026", "ביטוח בריאות", "ערך שלא מוכר", "כתב שירות רפואה משלימה", co, "01/01/2022 - 01/01/2027", "", "40", "חודשית", "777", "קבוצתי קופת חולים", "טקסט קבוע"],
    ["", "ביטוח סיעודי", "סיעודי עד 3 חודשים", "פוליסת ביטוח", co, "01/01/2022 - 01/01/2027", "", "50", "חודשית", "778", "קבוצתי", ""], // empty id: belongs to the previous person
  ];
}
