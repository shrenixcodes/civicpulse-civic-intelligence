// Deterministic, transparent priority scoring. No AI calls involved.

export const PRIORITY_WEIGHTS = {
  severity: 0.3,
  volume: 0.25,
  concentration: 0.2,
  trend: 0.15,
  urgency: 0.1,
} as const;

// Report count that maps to a "full" volume score. Tunable reference point,
// not a hard cap — counts above this still clamp at 100.
const VOLUME_REFERENCE = 50;

export interface PriorityInputs {
  severity: number; // 0-100
  urgency: number; // 0-100
  reportCount: number; // raw count
  trendPercent: number; // e.g. +42 means 42% growth recently
  coordinates: { latitude: number; longitude: number }[]; // all reports in the cluster
}

export interface PriorityFactor {
  key: "severity" | "volume" | "concentration" | "trend" | "urgency";
  label: string;
  weightPct: number;
  rawValue: number; // the normalized 0-100 sub-score before weighting
  points: number; // contribution to the final 0-100 score
  detail: string;
}

export interface PriorityResult {
  score: number;
  factors: PriorityFactor[];
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// Tighter clusters (reports close together) score higher concentration.
// Uses average distance from centroid, converted to km, mapped so that
// a cluster with everything within ~300m scores ~100 and one spread
// across ~5km scores near 0.
export function computeConcentration(
  coordinates: { latitude: number; longitude: number }[]
): number {
  if (coordinates.length <= 1) return 100;

  const centroid = coordinates.reduce(
    (acc, c) => ({ latitude: acc.latitude + c.latitude, longitude: acc.longitude + c.longitude }),
    { latitude: 0, longitude: 0 }
  );
  centroid.latitude /= coordinates.length;
  centroid.longitude /= coordinates.length;

  const avgDistanceKm =
    coordinates.reduce((sum, c) => sum + haversineKm(c, centroid), 0) / coordinates.length;

  const MAX_DISTANCE_KM = 5;
  return clamp(100 - (avgDistanceKm / MAX_DISTANCE_KM) * 100);
}

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computePriorityScore(inputs: PriorityInputs): PriorityResult {
  const volumeScore = clamp((inputs.reportCount / VOLUME_REFERENCE) * 100);
  const concentrationScore = computeConcentration(inputs.coordinates);
  const trendScore = clamp(50 + inputs.trendPercent);
  const severityScore = clamp(inputs.severity);
  const urgencyScore = clamp(inputs.urgency);

  const raw: Record<PriorityFactor["key"], number> = {
    severity: severityScore,
    volume: volumeScore,
    concentration: concentrationScore,
    trend: trendScore,
    urgency: urgencyScore,
  };

  const labels: Record<PriorityFactor["key"], string> = {
    severity: "Severity",
    volume: "Report volume",
    concentration: "Geographic concentration",
    trend: "Recent trend",
    urgency: "Urgency",
  };

  const details: Record<PriorityFactor["key"], string> = {
    severity: `AI-assessed severity of ${Math.round(severityScore)}/100`,
    volume: `${inputs.reportCount} reports (scaled against a ${VOLUME_REFERENCE}-report reference)`,
    concentration: `Reports are geographically ${
      concentrationScore > 66 ? "tightly clustered" : concentrationScore > 33 ? "moderately spread" : "widely spread"
    }`,
    trend: `${inputs.trendPercent >= 0 ? "+" : ""}${inputs.trendPercent.toFixed(0)}% change recently`,
    urgency: `AI-assessed urgency of ${Math.round(urgencyScore)}/100`,
  };

  const factors: PriorityFactor[] = (Object.keys(PRIORITY_WEIGHTS) as (keyof typeof PRIORITY_WEIGHTS)[]).map(
    (key) => {
      const weight = PRIORITY_WEIGHTS[key];
      const rawValue = raw[key];
      return {
        key,
        label: labels[key],
        weightPct: weight * 100,
        rawValue,
        points: Math.round(rawValue * weight),
        detail: details[key],
      };
    }
  );

  const score = clamp(factors.reduce((sum, f) => sum + f.points, 0), 0, 100);

  return { score: Math.round(score), factors };
}
