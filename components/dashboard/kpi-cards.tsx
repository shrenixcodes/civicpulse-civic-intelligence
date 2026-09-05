import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsProps {
  totalReports: number;
  activeIssues: number;
  criticalIssues: number;
  hotspots: number;
  resolvedIssues: number;
}

export function KpiCards({ totalReports, activeIssues, criticalIssues, hotspots, resolvedIssues }: KpiCardsProps) {
  const items = [
    { label: "Total Reports", value: totalReports, accent: "text-slate-900" },
    { label: "Active Issues", value: activeIssues, accent: "text-blue-600" },
    { label: "Critical Issues", value: criticalIssues, accent: "text-red-600" },
    { label: "Hotspots", value: hotspots, accent: "text-orange-600" },
    { label: "Resolved Issues", value: resolvedIssues, accent: "text-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className={`mt-1 text-3xl font-semibold ${item.accent}`}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
