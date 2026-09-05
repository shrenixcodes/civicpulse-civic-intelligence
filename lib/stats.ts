import { db } from "./db";
import { priorityLevel } from "./issue-helpers";

export async function getDashboardStats() {
  const [clusters, totalReports] = await Promise.all([
    db.issueCluster.findMany({ orderBy: { priorityScore: "desc" } }),
    db.report.count(),
  ]);

  const activeIssues = clusters.filter((c) => c.status !== "Resolved").length;
  const criticalIssues = clusters.filter((c) => priorityLevel(c.priorityScore) === "critical").length;
  const resolvedIssues = clusters.filter((c) => c.status === "Resolved").length;

  const hotspotWards = new Set(
    clusters.filter((c) => c.ward && c.priorityScore >= 60).map((c) => c.ward)
  );

  return {
    totalReports,
    activeIssues,
    criticalIssues,
    resolvedIssues,
    hotspots: hotspotWards.size,
    topIssues: clusters.slice(0, 5),
    allClusters: clusters,
  };
}
