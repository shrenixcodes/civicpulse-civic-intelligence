import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/issue-helpers";

export default async function ReportStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const report = await db.report.findUnique({ where: { code } });

  if (!report) notFound();

  const currentIndex = STATUS_ORDER.indexOf(report.status as (typeof STATUS_ORDER)[number]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <Link href="/report" className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" />
        Report another issue
      </Link>

      <div>
        <p className="text-sm text-slate-500">Report ID</p>
        <p className="text-lg font-mono font-semibold tracking-tight">{report.code}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 py-5">
          <div>
            <p className="text-sm text-slate-500">Current status</p>
            <p className="text-xl font-semibold text-blue-700">{STATUS_LABEL[report.status]}</p>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span
                  className={
                    i <= currentIndex
                      ? "rounded-full bg-blue-600 px-2 py-1 font-medium text-white"
                      : "rounded-full bg-slate-100 px-2 py-1 text-slate-400"
                  }
                >
                  {STATUS_LABEL[s]}
                </span>
                {i < STATUS_ORDER.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            ))}
          </div>

          {report.status === "InProgress" && (
            <p className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <Wrench className="h-4 w-4 shrink-0" />
              Your issue is now being addressed.
            </p>
          )}
          {report.status === "Resolved" && (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This issue has been marked resolved.
            </p>
          )}

          {report.category && (
            <div className="border-t border-slate-100 pt-4 text-sm">
              <p>
                <span className="text-slate-500">Category:</span> {report.category}
                {report.subcategory ? ` — ${report.subcategory}` : ""}
              </p>
              {report.summary && <p className="mt-1 text-slate-600">{report.summary}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
