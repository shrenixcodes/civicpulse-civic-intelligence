// Deterministic answers for the "Ask CivicPulse" panel, built from live
// database aggregates. Gemini is only used as a fallback for questions
// that don't match a known pattern — see askAI() in lib/ai.ts.

import { db } from "./db";
import { askAI } from "./ai";
import { priorityLevel, PRIORITY_LEVEL_LABEL } from "./issue-helpers";

function normalize(q: string) {
  return q.toLowerCase();
}

export async function answerQuestion(question: string): Promise<{ answer: string; source: "deterministic" | "ai" }> {
  const q = normalize(question);
  const clusters = await db.issueCluster.findMany({ orderBy: { priorityScore: "desc" } });

  if (clusters.length === 0) {
    return { answer: "There's no issue data yet — seed or submit some reports first.", source: "deterministic" };
  }

  if (/top\s*\d*\s*issues?|most important|worst issues?/.test(q)) {
    const top = clusters.slice(0, 5);
    const lines = top.map(
      (c, i) => `${i + 1}. ${c.title} (${c.ward ?? "citywide"}) — priority ${c.priorityScore}/100, ${c.reportCount} reports`
    );
    return { answer: `Here are the top ${top.length} issues by priority score:\n${lines.join("\n")}`, source: "deterministic" };
  }

  if (/why.*(rank|top|first|priorit)/.test(q) || /why is .* (ranked|first|top)/.test(q)) {
    const top = clusters[0];
    const level = PRIORITY_LEVEL_LABEL[priorityLevel(top.priorityScore)];
    return {
      answer:
        `${top.title} is ranked #1 with a priority score of ${top.priorityScore}/100 (${level}). ` +
        `It has ${top.reportCount} reports, severity ${top.severity}/100, urgency ${top.urgency}/100, ` +
        `and a recent trend of ${top.trend >= 0 ? "+" : ""}${top.trend.toFixed(0)}% in ${top.ward ?? "the affected area"}. ` +
        `The priority formula weighs severity (30%), report volume (25%), geographic concentration (20%), recent trend (15%), and urgency (10%).`,
      source: "deterministic",
    };
  }

  if (/growing fastest|fastest.growing|biggest (increase|trend)|trending/.test(q)) {
    const fastest = [...clusters].sort((a, b) => b.trend - a.trend)[0];
    return {
      answer: `${fastest.title} is growing fastest, up ${fastest.trend >= 0 ? "+" : ""}${fastest.trend.toFixed(0)}% recently, with ${fastest.reportCount} reports in ${fastest.ward ?? "its area"}.`,
      source: "deterministic",
    };
  }

  if (/address first|start with|tackle first|prioritize first|what should we (do|fix)/.test(q)) {
    const top = clusters[0];
    return {
      answer: `Start with ${top.title} — it's the highest-priority issue (${top.priorityScore}/100). Recommended action: ${top.recommendedAction}`,
      source: "deterministic",
    };
  }

  if (/how many (reports|issues|clusters|hotspots)|total reports|total issues/.test(q)) {
    const totalReports = await db.report.count();
    const critical = clusters.filter((c) => priorityLevel(c.priorityScore) === "critical").length;
    const resolved = clusters.filter((c) => c.status === "Resolved").length;
    return {
      answer: `There are ${totalReports} total reports across ${clusters.length} issue clusters. ${critical} are critical, and ${resolved} have been resolved.`,
      source: "deterministic",
    };
  }

  // Fallback: build a compact context and let Gemini (or the mock) answer.
  const context = clusters
    .slice(0, 15)
    .map((c) => `${c.title} | ${c.ward ?? "citywide"} | priority ${c.priorityScore} | ${c.reportCount} reports | trend ${c.trend}% | status ${c.status}`)
    .join("\n");

  const answer = await askAI(question, context);
  return { answer, source: "ai" };
}
