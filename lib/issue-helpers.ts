export type PriorityLevel = "critical" | "high" | "medium" | "low";

export function priorityLevel(score: number): PriorityLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export const PRIORITY_LEVEL_LABEL: Record<PriorityLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABEL: Record<string, string> = {
  Reported: "Reported",
  Analyzed: "Analyzed",
  Prioritized: "Prioritized",
  InProgress: "In Progress",
  Resolved: "Resolved",
};

export const STATUS_ORDER = ["Reported", "Analyzed", "Prioritized", "InProgress", "Resolved"] as const;

// Picks a handful of reports for the evidence view, cycling through
// languages so multilingual clustering is visible at a glance.
export function pickEvidence<T extends { language: string }>(reports: T[], count: number): T[] {
  const byLanguage = new Map<string, T[]>();
  for (const r of reports) {
    const list = byLanguage.get(r.language) ?? [];
    list.push(r);
    byLanguage.set(r.language, list);
  }
  const languages = [...byLanguage.keys()];
  const picked: T[] = [];
  let i = 0;
  while (picked.length < count && picked.length < reports.length) {
    const lang = languages[i % languages.length];
    const bucket = byLanguage.get(lang)!;
    if (bucket.length > 0) picked.push(bucket.shift()!);
    i++;
    if (languages.every((l) => (byLanguage.get(l)?.length ?? 0) === 0)) break;
  }
  return picked;
}
