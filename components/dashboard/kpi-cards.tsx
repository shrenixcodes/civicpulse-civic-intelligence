import { FileText, Activity, AlertTriangle, Flame, CheckCircle2, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsProps {
  totalReports: number;
  activeIssues: number;
  criticalIssues: number;
  hotspots: number;
  resolvedIssues: number;
}

export function KpiCards({ totalReports, activeIssues, criticalIssues, hotspots, resolvedIssues }: KpiCardsProps) {
  const items: { label: string; value: number; icon: LucideIcon; iconBg: string; iconColor: string }[] = [
    { label: "Total Reports", value: totalReports, icon: FileText, iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    { label: "Active Issues", value: activeIssues, icon: Activity, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Critical Issues", value: criticalIssues, icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-600" },
    { label: "Hotspots", value: hotspots, icon: Flame, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
    { label: "Resolved Issues", value: resolvedIssues, icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-start justify-between py-5">
            <div>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</p>
            </div>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} strokeWidth={2} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
