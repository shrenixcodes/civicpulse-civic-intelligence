// Practical, deterministic clustering for newly submitted reports.
// Seeded demo data uses predefined cluster IDs and never runs through this.
//
// Strategy for a new report:
//   1. Only consider clusters in the same AI-assigned category.
//   2. If embeddings are available for the report and a candidate cluster,
//      use cosine similarity.
//   3. Otherwise fall back to keyword overlap + geographic proximity.
//   4. Attach to the best match above SIMILARITY_THRESHOLD, else signal
//      that a new cluster should be created.

import { haversineKm } from "./priority";

export const SIMILARITY_THRESHOLD = 0.45;
const NEARBY_KM = 2;

export interface ClusterCandidate {
  id: string;
  category: string;
  title: string;
  summary: string;
  latitude: number;
  longitude: number;
  embedding: number[];
}

export interface NewReportInput {
  category: string;
  subcategory: string;
  description: string;
  latitude: number;
  longitude: number;
  embedding?: number[] | null;
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "in",
  "on",
  "at",
  "for",
  "of",
  "to",
  "and",
  "our",
  "this",
  "has",
  "have",
  "since",
  "again",
  "not",
  "no",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ClusterMatch {
  clusterId: string;
  similarity: number;
  method: "embedding" | "keyword";
}

export function findBestCluster(
  report: NewReportInput,
  candidates: ClusterCandidate[]
): ClusterMatch | null {
  const sameCategory = candidates.filter((c) => c.category === report.category);
  if (sameCategory.length === 0) return null;

  let best: ClusterMatch | null = null;

  for (const cluster of sameCategory) {
    let similarity: number;
    let method: "embedding" | "keyword";

    if (report.embedding && cluster.embedding.length > 0) {
      similarity = cosineSimilarity(report.embedding, cluster.embedding);
      method = "embedding";
    } else {
      const reportTokens = tokenize(`${report.subcategory} ${report.description}`);
      const clusterTokens = tokenize(`${cluster.title} ${cluster.summary}`);
      const keywordScore = jaccardSimilarity(reportTokens, clusterTokens);

      const distanceKm = haversineKm(
        { latitude: report.latitude, longitude: report.longitude },
        { latitude: cluster.latitude, longitude: cluster.longitude }
      );
      const proximityScore = Math.max(0, 1 - distanceKm / NEARBY_KM);

      // Weight proximity higher than raw keyword overlap: two "pothole"
      // reports blocks apart are a weaker match than ones on the same street.
      similarity = keywordScore * 0.5 + proximityScore * 0.5;
      method = "keyword";
    }

    if (!best || similarity > best.similarity) {
      best = { clusterId: cluster.id, similarity, method };
    }
  }

  if (!best || best.similarity < SIMILARITY_THRESHOLD) return null;
  return best;
}
