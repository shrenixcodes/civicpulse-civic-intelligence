"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AnalyzeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      setMessage(data.message ?? `Analyzed ${data.analyzed} report(s) with ${data.provider}.`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={run} disabled={loading}>
        {loading ? "Analyzing…" : "Run AI Analysis"}
      </Button>
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  );
}
