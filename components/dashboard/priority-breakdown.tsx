import type { PriorityFactor } from "@/lib/priority";

export function PriorityBreakdown({ score, factors }: { score: number; factors: PriorityFactor[] }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-slate-400">/100</span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-500">Why?</p>
      <div className="mt-3 space-y-3">
        {factors.map((f) => (
          <div key={f.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {f.label} <span className="text-slate-400">({f.weightPct.toFixed(0)}%)</span>
              </span>
              <span className="font-medium text-slate-900">+{f.points} pts</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${f.rawValue}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">{f.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
