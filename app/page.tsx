import Link from "next/link";
import { MessageSquareText, Sparkles, Layers, Gauge, CircleCheckBig, ArrowRight, Radio, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const PIPELINE = [
  { label: "Citizen Reports", icon: MessageSquareText },
  { label: "AI Analysis", icon: Sparkles },
  { label: "Issue Clusters", icon: Layers },
  { label: "Priority Engine", icon: Gauge },
  { label: "Civic Action", icon: CircleCheckBig },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <Radio className="h-3 w-3" strokeWidth={2.5} />
            CivicPulse
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Turn Citizen Voices Into Civic Action.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600">
            CivicPulse transforms thousands of citizen reports into prioritized, evidence-backed civic issues.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/report">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              Report an Issue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
              <LayoutDashboard className="h-4 w-4" />
              Open Command Center
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <step.icon className="h-3.5 w-3.5 text-slate-400" />
                {step.label}
              </span>
              {i < PIPELINE.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        CivicPulse — a civic intelligence demo.
      </footer>
    </div>
  );
}
