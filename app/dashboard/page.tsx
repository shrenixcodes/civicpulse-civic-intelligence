import Link from "next/link";
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-xs text-slate-400 hover:underline">
              ← CivicPulse
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">CivicPulse Command Center</h1>
            <p className="text-sm text-slate-500">Turning citizen voices into civic action.</p>
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
