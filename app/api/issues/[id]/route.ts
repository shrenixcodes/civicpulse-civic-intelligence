import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computePriorityScore } from "@/lib/priority";
import { pickEvidence } from "@/lib/issue-helpers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cluster = await db.issueCluster.findUnique({ where: { id } });
  if (!cluster) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }

  const reports = await db.report.findMany({
    where: { clusterId: id },
    orderBy: { createdAt: "desc" },
  });

  const { factors } = computePriorityScore({
    severity: cluster.severity,
    urgency: cluster.urgency,
    reportCount: cluster.reportCount,
    trendPercent: cluster.trend,
    coordinates: reports.map((r) => ({ latitude: r.latitude, longitude: r.longitude })),
  });

  // A handful of representative reports for the evidence view, favoring
  // a spread of languages so the multilingual clustering is visible.
  const evidence = pickEvidence(reports, 5);

  return NextResponse.json({ issue: cluster, priorityFactors: factors, evidence, reportCount: reports.length });
}
