import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computePriorityScore } from "@/lib/priority";
import { priorityLevel, PRIORITY_LEVEL_LABEL, STATUS_LABEL, pickEvidence } from "@/lib/issue-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBreakdown } from "@/components/dashboard/priority-breakdown";
import { StatusControl } from "@/components/dashboard/status-control";

export const dynamic = "force-dynamic";

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await db.issueCluster.findUnique({ where: { id } });
  if (!issue) notFound();

  const reports = await db.report.findMany({ where: { clusterId: id }, orderBy: { createdAt: "desc" } });

  const { factors } = computePriorityScore({
    severity: issue.severity,
    urgency: issue.urgency,
    reportCount: issue.reportCount,
    trendPercent: issue.trend,
    coordinates: reports.map((r) => ({ latitude: r.latitude, longitude: r.longitude })),
  });

  const evidence = pickEvidence(reports, 5);
  const level = priorityLevel(issue.priorityScore);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
            ← Command Center
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{issue.title}</h1>
              <p className="text-sm text-slate-500">
                {issue.category} · {issue.ward ?? "Citywide"}
              </p>
            </div>
            <StatusControl issueId={issue.id} currentStatus={issue.status} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Stat label="Severity" value={`${issue.severity}/100`} />
                <Stat label="Urgency" value={`${issue.urgency}/100`} />
                <Stat label="Reports" value={String(issue.reportCount)} />
                <Stat
                  label="Trend"
                  value={`${issue.trend >= 0 ? "+" : ""}${issue.trend.toFixed(0)}%`}
                  accent={issue.trend >= 0 ? "text-red-600" : "text-emerald-600"}
                />
                <Stat label="Status" value={STATUS_LABEL[issue.status]} />
                <Stat label="Priority" value={PRIORITY_LEVEL_LABEL[level]} accent="text-slate-900" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-400">
                {evidence.length} representative reports out of {issue.reportCount} clustered into this issue —
                including multiple languages where applicable.
              </p>
              {evidence.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="default">{r.language}</Badge>
                    <span className="text-xs text-slate-400">{r.code}</span>
                  </div>
                  <p className="text-sm text-slate-700">&ldquo;{r.description}&rdquo;</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{issue.recommendedAction}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Priority Score</CardTitle>
            </CardHeader>
            <CardContent>
              <PriorityBreakdown score={issue.priorityScore} factors={factors} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

