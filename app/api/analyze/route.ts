import { NextResponse } from "next/server";
import { IssueStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { analyzeReport, getEmbedding, getAIProviderName } from "@/lib/ai";
import { findBestCluster, type ClusterCandidate } from "@/lib/clustering";
import { computePriorityScore } from "@/lib/priority";

// Admin-triggered analysis pass. Only processes reports that don't yet have
// AI fields — submitted reports are already analyzed synchronously, so this
// is a safety-net / manual re-run, not a recurring job.
export async function POST() {
  const pending = await db.report.findMany({ where: { category: null } });

  if (pending.length === 0) {
    return NextResponse.json({ analyzed: 0, provider: getAIProviderName(), message: "All reports are already analyzed." });
  }

  let analyzed = 0;

  for (const report of pending) {
    const analysis = await analyzeReport({ description: report.description, language: report.language });
    const embedding = await getEmbedding(report.description);

    const candidateClusters = await db.issueCluster.findMany({
      where: { category: analysis.category },
      select: { id: true, category: true, title: true, summary: true, latitude: true, longitude: true, embedding: true },
    });

    const match = findBestCluster(
      {
        category: analysis.category,
        subcategory: analysis.subcategory,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        embedding,
      },
      candidateClusters as ClusterCandidate[]
    );

    let clusterId: string;
    let clusterStatus: IssueStatus;

    if (match) {
      const cluster = await db.issueCluster.findUniqueOrThrow({ where: { id: match.clusterId } });
      const newReportCount = cluster.reportCount + 1;
      const { score: priorityScore } = computePriorityScore({
        severity: Math.round((cluster.severity * cluster.reportCount + analysis.severity) / newReportCount),
        urgency: Math.round((cluster.urgency * cluster.reportCount + analysis.urgency) / newReportCount),
        reportCount: newReportCount,
        trendPercent: cluster.trend,
        coordinates: [{ latitude: report.latitude, longitude: report.longitude }],
      });
      await db.issueCluster.update({
        where: { id: cluster.id },
        data: { reportCount: newReportCount, priorityScore },
      });
      clusterId = cluster.id;
      clusterStatus = cluster.status;
    } else {
      const { score: priorityScore } = computePriorityScore({
        severity: analysis.severity,
        urgency: analysis.urgency,
        reportCount: 1,
        trendPercent: 0,
        coordinates: [{ latitude: report.latitude, longitude: report.longitude }],
      });
      const cluster = await db.issueCluster.create({
        data: {
          title: `${analysis.subcategory}${report.ward ? ` — ${report.ward}` : ""}`,
          category: analysis.category,
          summary: analysis.summary,
          reportCount: 1,
          severity: analysis.severity,
          urgency: analysis.urgency,
          priorityScore,
          latitude: report.latitude,
          longitude: report.longitude,
          ward: report.ward,
          recommendedAction: analysis.recommended_action,
          status: IssueStatus.Prioritized,
          embedding: embedding ?? [],
        },
      });
      clusterId = cluster.id;
      clusterStatus = cluster.status;
    }

    await db.report.update({
      where: { id: report.id },
      data: {
        category: analysis.category,
        subcategory: analysis.subcategory,
        summary: analysis.summary,
        severity: analysis.severity,
        urgency: analysis.urgency,
        confidence: analysis.confidence,
        clusterId,
        status: clusterStatus,
      },
    });

    analyzed++;
  }

  return NextResponse.json({ analyzed, provider: getAIProviderName() });
}
