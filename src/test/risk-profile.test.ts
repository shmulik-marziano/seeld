import { describe, it, expect } from "vitest";
import {
  classifyTrack, countByProduct, isComplete, levelForStockPct, levelForSum, normName, scoreRisk, tracksFor,
  type RiskAnswers, type TrackRow,
} from "@/lib/riskProfile";
import { RISK_COPY, RISK_FAQ, RISK_LEVEL_COPY, RISK_QUESTIONS } from "@/data/riskProfile";
import { answerSummaries } from "@/data/answerSummaries";
import { ROUTES } from "@/data/seo/routes";

const ans = (sleep: number, react: number, stab: number, regret: number): RiskAnswers =>
  ({ sleep_drop: sleep, drop_reaction: react, stability_vs_growth: stab, loss_vs_miss: regret });

describe("risk profile scoring", () => {
  it("all minimum answers give low, all maximum give high", () => {
    expect(scoreRisk(ans(0, 0, 0, 0))).toEqual({ sum: 0, baseLevel: "low", level: "low", guardrail: null });
    expect(scoreRisk(ans(3, 3, 3, 3))).toEqual({ sum: 12, baseLevel: "high", level: "high", guardrail: null });
  });

  it("sum thresholds are integers: 4 low, 5 and 7 medium, 8 high", () => {
    expect([0, 4, 5, 7, 8, 12].map(levelForSum)).toEqual(["low", "low", "medium", "medium", "high", "high"]);
    expect(scoreRisk(ans(1, 1, 1, 1))?.level).toBe("low"); // 4
    expect(scoreRisk(ans(1, 2, 1, 1))?.level).toBe("medium"); // 5
    expect(scoreRisk(ans(2, 1, 2, 2))?.level).toBe("medium"); // 7
    expect(scoreRisk(ans(2, 2, 2, 2))?.level).toBe("high"); // 8
  });

  it("matches every worked example of the spec", () => {
    const cases: [number[], number, string, string | null][] = [
      [[3, 3, 3, 3], 12, "high", null],
      [[2, 2, 2, 2], 8, "high", null],
      [[2, 1, 2, 2], 7, "medium", null],
      [[1, 2, 1, 1], 5, "medium", null],
      [[1, 1, 1, 1], 4, "low", null],
      [[3, 1, 3, 3], 10, "medium", "capped_medium"],
      [[0, 2, 3, 3], 8, "medium", "capped_medium"],
      [[3, 0, 3, 3], 9, "low", "forced_low"],
    ];
    for (const [[s, r, st, rg], sum, level, guard] of cases) {
      const res = scoreRisk(ans(s, r, st, rg));
      expect(res, `${s},${r},${st},${rg}`).toEqual(expect.objectContaining({ sum, level, guardrail: guard }));
    }
  });

  it("guardrails only lower the level, and a conflict always goes to the cautious side", () => {
    // "move everything" forces low whatever the sum; when the sum is already low there is nothing to report
    expect(scoreRisk(ans(3, 0, 2, 2))).toEqual(expect.objectContaining({ baseLevel: "medium", level: "low", guardrail: "forced_low" }));
    expect(scoreRisk(ans(1, 0, 1, 1))).toEqual(expect.objectContaining({ level: "low", guardrail: null }));
    // "move part" or "will not sleep" cap a high sum at medium, and leave medium and low untouched
    expect(scoreRisk(ans(3, 1, 3, 1))?.level).toBe("medium"); // 8
    expect(scoreRisk(ans(0, 3, 3, 3))?.level).toBe("medium"); // 9
    expect(scoreRisk(ans(0, 3, 1, 1))).toEqual(expect.objectContaining({ level: "medium", guardrail: null })); // 5
    expect(scoreRisk(ans(0, 1, 1, 1))).toEqual(expect.objectContaining({ level: "low", guardrail: null })); // 3
    // never raises: every one of the 256 combinations is at or below the sum level
    const rank = { low: 0, medium: 1, high: 2 } as const;
    for (let i = 0; i < 256; i++) {
      const [a, b, c, d] = [i & 3, (i >> 2) & 3, (i >> 4) & 3, (i >> 6) & 3];
      const res = scoreRisk(ans(a, b, c, d))!;
      expect(rank[res.level]).toBeLessThanOrEqual(rank[res.baseLevel]);
      if (b === 0) expect(res.level).toBe("low");
      if ((b === 1 || a === 0)) expect(res.level).not.toBe("high");
    }
  });

  it("no result while an answer is missing or out of range", () => {
    expect(scoreRisk({})).toBeNull();
    expect(scoreRisk({ sleep_drop: 3, drop_reaction: 3, stability_vs_growth: 3 })).toBeNull();
    expect(scoreRisk(ans(3, 3, 3, 4))).toBeNull();
    expect(scoreRisk(ans(3, 3, 1.5, 3))).toBeNull();
    expect(isComplete(ans(0, 0, 0, 0))).toBe(true);
  });

  it("the question data carries four questions with scores 0..3 in order", () => {
    expect(RISK_QUESTIONS.map((q) => q.id)).toEqual(["sleep_drop", "drop_reaction", "stability_vs_growth", "loss_vs_miss"]);
    for (const q of RISK_QUESTIONS) expect(q.options.map((o) => o.score)).toEqual([0, 1, 2, 3]);
  });
});

const row = (fund_name: string, track: string, stock_pct: number | null, board_product = "pensia", total_assets: number | null = 100): TrackRow =>
  ({ fund_name, track, stock_pct, board_product, total_assets });

describe("risk profile track matching", () => {
  it("excludes closed, self-managed and annuitant tracks by key and by name", () => {
    for (const k of ["guaranteed", "participating", "self_managed", "annuity"]) expect(classifyTrack(row("מסלול", k, 50))).toBe("excluded");
    expect(classifyTrack(row("קופה מרכזית לפיצויים כללי", "general", 0))).toBe("excluded");
    expect(classifyTrack(row("מסלול IRA מניות", "general", 70))).toBe("excluded");
    expect(classifyTrack(row("קרן ח׳ ותיקה", "general", 30))).toBe("excluded");
    expect(classifyTrack(row("מסלול קצבה לזכאים קיימים", "general", 30))).toBe("excluded");
    expect(classifyTrack(row("פנסיה תקציבית", "other", null))).toBe("excluded");
  });

  it("age-dependent default tracks get the separate note, not a level", () => {
    for (const k of ["age_under_50", "age_50_60", "age_over_60"]) expect(classifyTrack(row("מסלול", k, 56))).toBe("age");
    expect(classifyTrack(row("מסלול לבני 60 ומעלה", "other", null))).toBe("age");
  });

  it("names that cap stocks are low, before the key", () => {
    expect(classifyTrack(row("מסלול ללא מניות", "stocks", 4))).toBe("low");
    expect(classifyTrack(row("אשראי ואג״ח עד 25% מניות", "general", 24))).toBe("low");
    expect(classifyTrack(row("מסלול עד 10%מניות", "other", null))).toBe("low");
    // a cap above 25 does not decide; the exposure does
    expect(classifyTrack(row("מסלול עד 50% מניות", "other", 48))).toBe("medium");
  });

  it("bond-index trackers under index are low; stock indices are not", () => {
    expect(classifyTrack(row("עוקב מדדי אג\"ח", "index", 2))).toBe("low");
    expect(classifyTrack(row("עוקב מדדי אגח ממשלתי", "index_tracking", null))).toBe("low");
    expect(classifyTrack(row("עוקב מדדי מניות ואג״ח", "index", 70))).toBe("high");
    expect(classifyTrack(row("עוקב מדדים גמיש", "index", 45))).toBe("medium");
  });

  it("fixed-by-definition keys win over the reported exposure", () => {
    for (const k of ["money_market", "bonds", "bonds_tradable", "credit_bonds", "risk_low"]) expect(classifyTrack(row("מסלול", k, 40))).toBe("low");
    expect(classifyTrack(row("סיכון בינוני", "risk_mid", 80))).toBe("medium");
    // Ayalon S&P 500 trackers report 33.7-44.3% (exposure via derivatives): still high
    expect(classifyTrack(row("עוקב מדד S&P 500", "sp500", 33.7))).toBe("high");
    expect(classifyTrack(row("עוקב נאסד״ק", "nasdaq", 40))).toBe("high");
    expect(classifyTrack(row("סיכון מוגבר", "risk_high", null))).toBe("high");
  });

  it("the exposure band: up to 25 low, above 25 up to 60 medium, above 60 high", () => {
    expect([0, 25, 25.01, 60, 60.01, 99].map(levelForStockPct)).toEqual(["low", "low", "medium", "medium", "high", "high"]);
    expect(classifyTrack(row("כללי", "general", 25))).toBe("low");
    expect(classifyTrack(row("כללי", "general", 52))).toBe("medium");
    expect(classifyTrack(row("מניות", "stocks", 70.2))).toBe("high"); // pension stock tracks report about 70%
    expect(classifyTrack(row("הלכה", "halacha", 99.9))).toBe("high");
    expect(classifyTrack(row("הלכה", "halacha", 0))).toBe("low");
  });

  it("family defaults and name keywords when there is no figure", () => {
    for (const k of ["general", "combined_tradable", "halacha"]) expect(classifyTrack(row("מסלול", k, null))).toBe("medium");
    for (const k of ["stocks", "stocks_tradable", "index", "index_tracking", "foreign", "sustainability"]) expect(classifyTrack(row("מסלול", k, null))).toBe("high");
    expect(classifyTrack(row("מסלול שקלי", "other", null))).toBe("low");
    expect(classifyTrack(row("מסלול אג״ח ממשלתי", "other", null))).toBe("low");
    expect(classifyTrack(row("מסלול חו״ל", "other", null))).toBe("high");
    expect(classifyTrack(row("מסלול משולב", "other", null))).toBe("medium");
    expect(classifyTrack(row("מסלול נוסף", "other", null))).toBe("unmatched");
  });

  it("normalises gershayim and geresh", () => {
    expect(normName("אג״ח  ו׳")).toBe("אג\"ח ו'");
  });

  it("lists one product, by assets and never by return, capped at six", () => {
    const rows = [
      row("א", "general", 50, "pensia", 10),
      row("ב", "general", 50, "pensia", 900),
      row("ג", "general", 50, "pensia", null),
      row("ד", "general", 50, "gemel", 5000),
      row("ה", "stocks", 90, "pensia", 99999),
      ...Array.from({ length: 6 }, (_, i) => row(`ו${i}`, "general", 40, "pensia", 100 + i)),
    ];
    const { rows: out, total } = tracksFor(rows, "medium", "pensia");
    expect(total).toBe(9);
    expect(out).toHaveLength(6);
    expect(out[0].fund_name).toBe("ב");
    expect(out.map((r) => r.total_assets)).toEqual([900, 105, 104, 103, 102, 101]);
    expect(countByProduct(rows, "medium")).toEqual({ pensia: 9, gemel: 1 });
    expect(countByProduct(rows, "high")).toEqual({ pensia: 1 });
    // nulls go last
    expect(tracksFor(rows, "medium", "pensia", 20).rows.at(-1)?.fund_name).toBe("ג");
  });
});

describe("risk profile copy and registry", () => {
  const all = [
    RISK_COPY.intro, RISK_COPY.resultIntro, RISK_COPY.guardrail, RISK_COPY.disclaimer, RISK_COPY.cta, RISK_COPY.ageNote,
    ...RISK_FAQ.flatMap((f) => [f.q, f.a]),
    ...Object.values(RISK_LEVEL_COPY).flatMap((l) => [l.title, l.profile, l.policy, l.assetMix]),
    ...RISK_QUESTIONS.flatMap((q) => [q.text, q.help, ...q.options.map((o) => o.label)]),
  ].join(" ");

  it("has none of the forbidden words", () => {
    for (const re of [/תאגיד/u, /ייעוץ|יועץ|מתייעץ/u, /ללא עלות|בחינם/u, /מובטח|מבטיח/u, /בטוח/u, /ביותר/u]) expect(all).not.toMatch(re);
  });

  it("is registered as a digit-free tool route with a summary", () => {
    const r = ROUTES.find((x) => x.path === "/savings/risk-profile");
    expect(r?.kind).toBe("tool");
    expect(r?.parent).toBe("/savings");
    const s = answerSummaries["/savings/risk-profile"];
    expect(s).toBeTruthy();
    for (const t of [r!.title, r!.description, s]) expect(t).not.toMatch(/\d/);
  });
});
