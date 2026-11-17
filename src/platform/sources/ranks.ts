// Data-source trust ranking. LOWER NUMBER = MORE TRUSTED. Mirrors public.data_sources in 07_source_precedence.sql.
export const SOURCE_RANK = {
  clearing_house: 1, //                 מסלקה פנסיונית
  har_habituach: 2, //                  הר הביטוח
  surense_agent_report: 3, //           דוח סוכן Surense
  pre_treatment_questionnaire: 4, //    שאלון טרום טיפול
  manual_template: 5, //                תבנית ידנית
} as const;

export type SourceName = keyof typeof SOURCE_RANK;
export type SourceRank = 1 | 2 | 3 | 4 | 5;

export function isSourceName(v: unknown): v is SourceName {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(SOURCE_RANK, v);
}

export function rankOf(source: SourceName): SourceRank {
  return SOURCE_RANK[source];
}
