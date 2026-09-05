import Link from "next/link";
import { Button } from "@/components/ui/button";

const PIPELINE = ["Citizen Reports", "AI Analysis", "Issue Clusters", "Priority Engine", "Civic Action"];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
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
            <Button size="lg" className="w-full sm:w-auto">
              Report an Issue
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Open Command Center
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-6 text-sm text-slate-500">
          {PIPELINE.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700">
                {step}
              </span>
              {i < PIPELINE.length - 1 && <span className="text-slate-300">→</span>}
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
