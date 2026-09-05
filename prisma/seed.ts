// Deterministic demo-data seeder. Generates ~200 realistic citizen reports
// across 32 issue clusters, with AI fields computed locally — this NEVER
// calls Gemini, so seeding is free and instant.

import { PrismaClient, IssueStatus } from "@prisma/client";
import {
  CLUSTER_DEFS,
  WARDS,
  PHRASES,
  RECOMMENDED_ACTIONS,
  createRng,
  type SeedCategory,
} from "../lib/demo-data";
import { computePriorityScore } from "../lib/priority";

const db = new PrismaClient();
const rng = createRng(42);

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function jitterCoordinate(center: { latitude: number; longitude: number }, spreadKm: number) {
  const angle = rng() * Math.PI * 2;
  const radiusKm = rng() * spreadKm;
  const dLat = (radiusKm / 111) * Math.sin(angle);
  const dLng = (radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180))) * Math.cos(angle);
  return { latitude: center.latitude + dLat, longitude: center.longitude + dLng };
}

function randomCreatedAt(trendPercent: number): Date {
  const now = Date.now();
  const maxDaysAgo = 21;
  // Positive-trend clusters skew their reports toward more recent days.
  const skew = trendPercent > 0 ? 0.55 : 1;
  const daysAgo = Math.pow(rng(), skew) * maxDaysAgo;
  return new Date(now - daysAgo * 24 * 60 * 60 * 1000);
}

const CLUSTER_STATUS_OVERRIDES: Record<string, IssueStatus> = {
  "Water Supply Outage": IssueStatus.Prioritized,
  "Sewage Overflow near Lakeview Colony": IssueStatus.InProgress,
  "Power Outage near Industrial Area": IssueStatus.InProgress,
  "Cracked Road near Residential Colony": IssueStatus.Resolved,
  "Road Damage near Industrial Area": IssueStatus.Resolved,
  "Uncollected Waste, Ward 12": IssueStatus.Resolved,
};

async function main() {
  console.log("Clearing existing data...");
  await db.statusHistory.deleteMany();
  await db.report.deleteMany();
  await db.issueCluster.deleteMany();

  let reportCounter = 1;
  const code = () => `CP-${String(reportCounter++).padStart(6, "0")}`;

  console.log(`Seeding ${CLUSTER_DEFS.length} clusters...`);

  for (const def of CLUSTER_DEFS) {
    const ward = WARDS[def.wardIndex];
    const { subcategory, phrases } = PHRASES[def.category as SeedCategory];

    // Water's flagship cluster keeps its canonical EN/HI/TA trio first so
    // the multilingual-clustering demo always has exact matches to point to.
    const orderedPhrases =
      def.category === "Water" ? phrases : shuffled(phrases);

    const coordinates = Array.from({ length: def.reportCount }, () =>
      jitterCoordinate(ward, def.spreadKm)
    );

    const { score: priorityScore } = computePriorityScore({
      severity: def.severity,
      urgency: def.urgency,
      reportCount: def.reportCount,
      trendPercent: def.trendPercent,
      coordinates,
    });

    const status = CLUSTER_STATUS_OVERRIDES[def.title] ?? IssueStatus.Prioritized;

    const cluster = await db.issueCluster.create({
      data: {
        title: def.title,
        category: def.category,
        summary: `${def.reportCount} reports of ${subcategory.toLowerCase()} in ${ward.name}.`,
        reportCount: def.reportCount,
        severity: def.severity,
        urgency: def.urgency,
        priorityScore,
        trend: def.trendPercent,
        latitude: ward.latitude,
        longitude: ward.longitude,
        ward: ward.name,
        recommendedAction: RECOMMENDED_ACTIONS[def.category as SeedCategory],
        status,
      },
    });

    const reportsData = coordinates.map((coord, i) => {
      const phrase = orderedPhrases[i % orderedPhrases.length];
      const severity = clamp(def.severity + Math.round((rng() - 0.5) * 12));
      const urgency = clamp(def.urgency + Math.round((rng() - 0.5) * 12));
      const confidence = Math.round((0.8 + rng() * 0.16) * 100) / 100;

      return {
        code: code(),
        description: phrase.text,
        language: phrase.language,
        latitude: coord.latitude,
        longitude: coord.longitude,
        ward: ward.name,
        category: def.category,
        subcategory,
        summary: `${subcategory} reported: ${phrase.text}`,
        severity,
        urgency,
        confidence,
        clusterId: cluster.id,
        status,
        createdAt: randomCreatedAt(def.trendPercent),
      };
    });

    await db.report.createMany({ data: reportsData });
  }

  const totalReports = await db.report.count();
  const totalClusters = await db.issueCluster.count();
  console.log(`Done. Seeded ${totalReports} reports across ${totalClusters} issue clusters.`);
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
