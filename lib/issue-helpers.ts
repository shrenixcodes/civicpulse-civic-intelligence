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
