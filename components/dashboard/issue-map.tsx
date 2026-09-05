"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { IssueCluster } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { priorityLevel, PRIORITY_LEVEL_LABEL } from "@/lib/issue-helpers";

const WIDTH = 640;
const HEIGHT = 420;
const PADDING = 40;

const FILL_BY_LEVEL: Record<string, string> = {
  critical: "fill-red-500",
  high: "fill-orange-500",
  medium: "fill-amber-500",
  low: "fill-emerald-500",
};

export function IssueMap({ clusters }: { clusters: IssueCluster[] }) {
  const [selected, setSelected] = useState<IssueCluster | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const points = useMemo(() => {
    if (clusters.length === 0) return [];
    const lats = clusters.map((c) => c.latitude);
    const lngs = clusters.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;

    const maxReports = Math.max(...clusters.map((c) => c.reportCount));

    return clusters.map((c) => {
      const x = PADDING + ((c.longitude - minLng) / lngRange) * (WIDTH - PADDING * 2);
      const y = HEIGHT - PADDING - ((c.latitude - minLat) / latRange) * (HEIGHT - PADDING * 2);
      const radius = 7 + (c.reportCount / maxReports) * 20;
      return { cluster: c, x, y, radius };
    });
  }, [clusters]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Civic Issue Map</CardTitle>
        <span className="text-xs text-slate-400">Bubble size = report volume</span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full flex-1 rounded-lg border border-slate-100 bg-slate-50"
          >
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />

            {points.map(({ cluster, x, y, radius }) => {
              const level = priorityLevel(cluster.priorityScore);
              return (
                <g key={cluster.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    className={`${FILL_BY_LEVEL[level]} cursor-pointer opacity-70 transition-opacity hover:opacity-100`}
                    stroke="white"
                    strokeWidth={2}
                    onMouseEnter={() => setHovered(cluster.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(cluster)}
                  />
                  {hovered === cluster.id && (
                    <text x={x} y={y - radius - 6} textAnchor="middle" className="fill-slate-700 text-[11px] font-medium">
                      {cluster.title}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="w-full lg:w-72">
            {selected ? (
              <HotspotPreview issue={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="flex h-full flex-col justify-center gap-3 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                <p>Click a hotspot to see details.</p>
                <Legend />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      {(["critical", "high", "medium", "low"] as const).map((level) => (
        <span key={level} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${FILL_BY_LEVEL[level]}`} />
          {PRIORITY_LEVEL_LABEL[level]}
        </span>
      ))}
    </div>
  );
}

function HotspotPreview({ issue, onClose }: { issue: IssueCluster; onClose: () => void }) {
  const level = priorityLevel(issue.priorityScore);
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-slate-900">{issue.title}</h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant={level}>{PRIORITY_LEVEL_LABEL[level]}</Badge>
        <span className="text-xs text-slate-500">{issue.ward ?? "Citywide"}</span>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Reports</dt>
          <dd className="font-medium">{issue.reportCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Trend</dt>
          <dd className={`font-medium ${issue.trend >= 0 ? "text-red-600" : "text-emerald-600"}`}>
            {issue.trend >= 0 ? "+" : ""}
            {issue.trend.toFixed(0)}%
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Recommended action: </span>
        {issue.recommendedAction}
      </p>
      <Link href={`/dashboard/issues/${issue.id}`}>
        <Button size="sm" variant="outline" className="mt-3 w-full">
          View full details
        </Button>
      </Link>
    </div>
  );
}
