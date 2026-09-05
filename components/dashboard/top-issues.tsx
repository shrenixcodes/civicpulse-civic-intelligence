import Link from "next/link";
import type { IssueCluster } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { priorityLevel, PRIORITY_LEVEL_LABEL } from "@/lib/issue-helpers";

export function TopIssues({ issues }: { issues: IssueCluster[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Priority Issues</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100 p-0">
        {issues.map((issue, i) => {
          const level = priorityLevel(issue.priorityScore);
          return (
            <Link
              key={issue.id}
              href={`/dashboard/issues/${issue.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <span className="w-6 text-lg font-semibold text-slate-300">#{i + 1}</span>
                <div>
                  <p className="font-medium text-slate-900">{issue.title}</p>
                  <p className="text-sm text-slate-500">
                    {issue.reportCount} reports · {issue.ward ?? "Citywide"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium ${issue.trend >= 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {issue.trend >= 0 ? "↑" : "↓"} {Math.abs(issue.trend).toFixed(0)}%
                </span>
                <div className="text-right">
                  <Badge variant={level}>{PRIORITY_LEVEL_LABEL[level]}</Badge>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{issue.priorityScore}/100</p>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
