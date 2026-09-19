import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";
import { getDashboardStats } from "@/lib/stats";
import { getAIProviderName } from "@/lib/ai";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TopIssues } from "@/components/dashboard/top-issues";
import { IssueMap } from "@/components/dashboard/issue-map";
import { AskPanel } from "@/components/dashboard/ask-panel";
import { AnalyzeButton } from "@/components/dashboard/analyze-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const provider = getAIProviderName();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              <ArrowLeft className="h-3 w-3" />
              CivicPulse
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">CivicPulse Command Center</h1>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">Turning citizen voices into civic action.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">{provider === "gemini" ? "Gemini AI" : "Demo AI (offline)"}</Badge>
            <AnalyzeButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <KpiCards
          totalReports={stats.totalReports}
          activeIssues={stats.activeIssues}
          criticalIssues={stats.criticalIssues}
          hotspots={stats.hotspots}
          resolvedIssues={stats.resolvedIssues}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TopIssues issues={stats.topIssues} />
          </div>
          <div className="lg:col-span-2">
            <AskPanel />
          </div>
        </div>

        <IssueMap clusters={stats.allClusters} />
      </main>
    </div>
  );
}
