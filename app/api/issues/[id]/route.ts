import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computePriorityScore } from "@/lib/priority";

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

function pickEvidence<T extends { language: string }>(reports: T[], count: number): T[] {
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
