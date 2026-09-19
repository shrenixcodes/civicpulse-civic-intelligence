import Link from "next/link";
import { TrendingUp, TrendingDown, MapPin, ChevronRight } from "lucide-react";
import type { IssueCluster } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { priorityLevel, PRIORITY_LEVEL_LABEL } from "@/lib/issue-helpers";

const RANK_STYLES = [
  "bg-slate-900 text-white",
  "bg-slate-700 text-white",
  "bg-slate-200 text-slate-700",
  "bg-slate-100 text-slate-500",
  "bg-slate-100 text-slate-500",
];

export function TopIssues({ issues }: { issues: IssueCluster[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Priority Issues</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100 p-0">
        {issues.map((issue, i) => {
          const level = priorityLevel(issue.priorityScore);
          const TrendIcon = issue.trend >= 0 ? TrendingUp : TrendingDown;
          return (
            <Link
              key={issue.id}
              href={`/dashboard/issues/${issue.id}`}
              className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${RANK_STYLES[i] ?? RANK_STYLES[4]}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{issue.title}</p>
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    <span>{issue.reportCount} reports</span>
                    <span className="text-slate-300">·</span>
                    <MapPin className="h-3.5 w-3.5" />
                    {issue.ward ?? "Citywide"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${issue.trend >= 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {Math.abs(issue.trend).toFixed(0)}%
                </span>
                <div className="text-right">
                  <Badge variant={level}>{PRIORITY_LEVEL_LABEL[level]}</Badge>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{issue.priorityScore}/100</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
