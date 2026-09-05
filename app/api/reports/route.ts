import { NextRequest, NextResponse } from "next/server";
import { IssueStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { analyzeReport, getEmbedding } from "@/lib/ai";
import { findBestCluster, type ClusterCandidate } from "@/lib/clustering";
import { computePriorityScore } from "@/lib/priority";

export async function GET(req: NextRequest) {
  const clusterId = req.nextUrl.searchParams.get("clusterId");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");

  const reports = await db.report.findMany({
    where: clusterId ? { clusterId } : undefined,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
  });

  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { description, language, latitude, longitude, ward, imageBase64, imageMimeType } = body;

  if (!description || typeof description !== "string" || description.trim().length < 3) {
    return NextResponse.json({ error: "A description is required." }, { status: 400 });
  }
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "A location is required." }, { status: 400 });
  }

  const analysis = await analyzeReport({
    description,
    language: language ?? "English",
    imageBase64,
    imageMimeType,
  });

  const embedding = await getEmbedding(description);

  const candidateClusters = await db.issueCluster.findMany({
    where: { category: analysis.category },
    select: { id: true, category: true, title: true, summary: true, latitude: true, longitude: true, embedding: true },
  });

  const match = findBestCluster(
    {
      category: analysis.category,
      subcategory: analysis.subcategory,
      description,
      latitude,
      longitude,
      embedding,
    },
    candidateClusters as ClusterCandidate[]
  );

  let clusterId: string;
  let clusterStatus: IssueStatus;

  if (match) {
    const cluster = await db.issueCluster.findUniqueOrThrow({ where: { id: match.clusterId } });
    const existingReports = await db.report.findMany({
      where: { clusterId: cluster.id },
      select: { latitude: true, longitude: true },
    });

    const newReportCount = cluster.reportCount + 1;
    const blendedSeverity = Math.round(
      (cluster.severity * cluster.reportCount + analysis.severity) / newReportCount
    );
    const blendedUrgency = Math.round(
      (cluster.urgency * cluster.reportCount + analysis.urgency) / newReportCount
    );

    const { score: priorityScore } = computePriorityScore({
      severity: blendedSeverity,
      urgency: blendedUrgency,
      reportCount: newReportCount,
      trendPercent: cluster.trend,
      coordinates: [...existingReports, { latitude, longitude }],
    });

    await db.issueCluster.update({
      where: { id: cluster.id },
      data: {
        reportCount: newReportCount,
        severity: blendedSeverity,
        urgency: blendedUrgency,
        priorityScore,
      },
    });

    clusterId = cluster.id;
    clusterStatus = cluster.status;
  } else {
    const { score: priorityScore } = computePriorityScore({
      severity: analysis.severity,
      urgency: analysis.urgency,
      reportCount: 1,
      trendPercent: 0,
      coordinates: [{ latitude, longitude }],
    });

    const cluster = await db.issueCluster.create({
      data: {
        title: `${analysis.subcategory}${ward ? ` — ${ward}` : ""}`,
        category: analysis.category,
        summary: analysis.summary,
        reportCount: 1,
        severity: analysis.severity,
        urgency: analysis.urgency,
        priorityScore,
        trend: 0,
        latitude,
        longitude,
        ward: ward ?? null,
        recommendedAction: analysis.recommended_action,
        status: IssueStatus.Prioritized,
        embedding: embedding ?? [],
      },
    });

    clusterId = cluster.id;
    clusterStatus = cluster.status;
  }

  let counter = await db.report.count();
  let code = `CP-${String(counter + 1).padStart(6, "0")}`;
  // Guard against the rare race where two submissions land at once.
  while (await db.report.findUnique({ where: { code } })) {
    counter += 1;
    code = `CP-${String(counter + 1).padStart(6, "0")}`;
  }

  const report = await db.report.create({
    data: {
      code,
      description,
      language: language ?? "English",
      imageUrl: imageBase64 && imageMimeType ? `data:${imageMimeType};base64,${imageBase64}` : null,
      latitude,
      longitude,
      ward: ward ?? null,
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

  return NextResponse.json({
    code: report.code,
    status: report.status,
    category: analysis.category,
    clusterId,
  });
}
