// Centralized AI access point. Every Gemini call in the app goes through
// this module so usage stays auditable and easy to cap.
//
// If GEMINI_API_KEY is unset, everything falls back to a deterministic
// local mock so the app runs (and demos) with zero API calls.

export type Category =
  | "Water"
  | "Roads"
  | "Garbage"
  | "Street Lighting"
  | "Sewage"
  | "Flooding"
  | "Electricity"
  | "Other";

export interface ReportAnalysisInput {
  description: string;
  language: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ReportAnalysis {
  category: Category;
  subcategory: string;
  summary: string;
  severity: number; // 0-100
  urgency: number; // 0-100
  confidence: number; // 0-1
  recommended_action: string;
}

interface AIProvider {
  name: string;
  analyze(input: ReportAnalysisInput): Promise<ReportAnalysis>;
  embed?(text: string): Promise<number[] | null>;
  ask?(question: string, context: string): Promise<string>;
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_EMBEDDING_MODEL = "text-embedding-004";

function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// ---------------------------------------------------------------------------
// Mock provider — deterministic, offline, zero cost.
// ---------------------------------------------------------------------------

const CATEGORY_RULES: { category: Category; subcategory: string; keywords: string[] }[] = [
  {
    category: "Water",
    subcategory: "Water outage",
    keywords: [
      "water",
      "no water",
      "tap",
      "pipeline",
      "supply",
      "पानी",
      "जलापूर्ति",
      "தண்ணீர்",
      "நீர்",
    ],
  },
  {
    category: "Roads",
    subcategory: "Pothole",
    keywords: ["pothole", "road", "street damage", "गड्ढ", "सड़क", "சாலை", "குழி"],
  },
  {
    category: "Garbage",
    subcategory: "Uncollected waste",
    keywords: ["garbage", "trash", "waste", "dump", "कचरा", "कूड़ा", "குப்பை"],
  },
  {
    category: "Street Lighting",
    subcategory: "Streetlight outage",
    keywords: ["streetlight", "street light", "lamp", "dark street", "स्ट्रीट लाइट", "தெரு விளக்கு"],
  },
  {
    category: "Sewage",
    subcategory: "Sewage overflow",
    keywords: ["sewage", "drain", "overflow", "सीवर", "गंदा पानी", "கழிவுநீர்"],
  },
  {
    category: "Flooding",
    subcategory: "Waterlogging",
    keywords: ["flood", "waterlogged", "flooding", "बाढ़", "जलभराव", "வெள்ளம்"],
  },
  {
    category: "Electricity",
    subcategory: "Power outage",
    keywords: ["electricity", "power cut", "power outage", "transformer", "बिजली", "மின்சாரம்"],
  },
];

const RECOMMENDED_ACTIONS: Record<Category, string> = {
  Water: "Inspect the local water distribution network and verify whether the outage originates from the primary pipeline or a local distribution line.",
  Roads: "Dispatch a road maintenance crew to assess and patch the reported surface damage.",
  Garbage: "Schedule an additional waste collection run and review the collection route for this area.",
  "Street Lighting": "Send an electrician to inspect and repair the affected streetlight fixtures.",
  Sewage: "Inspect the sewage line for blockages and dispatch a cleaning crew to the affected stretch.",
  Flooding: "Assess local drainage capacity and clear blocked storm drains in the affected area.",
  Electricity: "Inspect the local transformer and distribution line for faults causing the outage.",
  Other: "Route to the relevant civic department for manual review.",
};

const SEVERITY_RANGE: Record<Category, [number, number]> = {
  Water: [65, 95],
  Roads: [35, 70],
  Garbage: [30, 60],
  "Street Lighting": [20, 50],
  Sewage: [60, 90],
  Flooding: [70, 98],
  Electricity: [50, 85],
  Other: [25, 55],
};

// Small deterministic string hash (FNV-1a) so mock outputs vary per report
// but never require an external call.
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash);
}

function classifyCategory(description: string): { category: Category; subcategory: string } {
  const lower = description.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return { category: rule.category, subcategory: rule.subcategory };
    }
  }
  return { category: "Other", subcategory: "Uncategorized" };
}

function mockAnalyze(input: ReportAnalysisInput): ReportAnalysis {
  const { category, subcategory } = classifyCategory(input.description);
  const hash = hashString(input.description);

  const [min, max] = SEVERITY_RANGE[category];
  const severity = min + (hash % (max - min + 1));
  const urgency = Math.max(0, Math.min(100, severity - 5 + ((hash >> 3) % 15)));
  const confidence = 0.75 + ((hash >> 6) % 22) / 100; // 0.75 - 0.96

  const snippet = input.description.trim().slice(0, 90);
  const summary = `${subcategory} reported: ${snippet}${input.description.length > 90 ? "…" : ""}`;

  return {
    category,
    subcategory,
    summary,
    severity: Math.round(severity),
    urgency: Math.round(urgency),
    confidence: Math.round(confidence * 100) / 100,
    recommended_action: RECOMMENDED_ACTIONS[category],
  };
}

class MockAIProvider implements AIProvider {
  name = "mock";

  async analyze(input: ReportAnalysisInput): Promise<ReportAnalysis> {
    return mockAnalyze(input);
  }

  async embed(): Promise<number[] | null> {
    return null; // no embeddings without a real provider; clustering falls back to keywords
  }

  async ask(question: string): Promise<string> {
    return `I don't have a specific answer for "${question}" from the available data yet.`;
  }
}

// ---------------------------------------------------------------------------
// Gemini provider — used only when GEMINI_API_KEY is configured.
// ---------------------------------------------------------------------------

class GeminiAIProvider implements AIProvider {
  name = "gemini";
  private apiKey = process.env.GEMINI_API_KEY as string;

  private async generateContent(parts: object[], responseMimeType = "application/json") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType, temperature: 0.2 },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content");
    return text as string;
  }

  async analyze(input: ReportAnalysisInput): Promise<ReportAnalysis> {
    try {
      const prompt = `You are a civic complaint triage assistant for an Indian city. Analyze this citizen report (language: ${input.language}) and respond with ONLY a JSON object matching this exact shape:
{"category": "Water|Roads|Garbage|Street Lighting|Sewage|Flooding|Electricity|Other", "subcategory": string, "summary": string (one sentence, English), "severity": number 0-100, "urgency": number 0-100, "confidence": number 0-1, "recommended_action": string (one sentence, English)}

Citizen report: """${input.description}"""`;

      const parts: object[] = [{ text: prompt }];
      if (input.imageBase64 && input.imageMimeType) {
        parts.push({ inlineData: { mimeType: input.imageMimeType, data: input.imageBase64 } });
      }

      const text = await this.generateContent(parts);
      const parsed = JSON.parse(text);
      return {
        category: parsed.category ?? "Other",
        subcategory: parsed.subcategory ?? "Uncategorized",
        summary: parsed.summary ?? input.description.slice(0, 100),
        severity: Math.max(0, Math.min(100, Math.round(parsed.severity ?? 50))),
        urgency: Math.max(0, Math.min(100, Math.round(parsed.urgency ?? 50))),
        confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
        recommended_action: parsed.recommended_action ?? RECOMMENDED_ACTIONS.Other,
      };
    } catch {
      // A live API hiccup shouldn't break report submission during a demo.
      return mockAnalyze(input);
    }
  }

  async embed(text: string): Promise<number[] | null> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${GEMINI_EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.embedding?.values ?? null;
    } catch {
      return null;
    }
  }

  async ask(question: string, context: string): Promise<string> {
    try {
      const prompt = `You answer questions about civic issue data for a city dashboard. Use ONLY the context below. Be concise (2-4 sentences).\n\nContext:\n${context}\n\nQuestion: ${question}`;
      return await this.generateContent([{ text: prompt }], "text/plain");
    } catch {
      return "I couldn't reach the AI service to answer that right now.";
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let providerInstance: AIProvider | null = null;

function getProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = hasGeminiKey() ? new GeminiAIProvider() : new MockAIProvider();
  }
  return providerInstance;
}

export function getAIProviderName(): string {
  return getProvider().name;
}

export async function analyzeReport(input: ReportAnalysisInput): Promise<ReportAnalysis> {
  return getProvider().analyze(input);
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  const provider = getProvider();
  return provider.embed ? provider.embed(text) : null;
}

export async function askAI(question: string, context: string): Promise<string> {
  const provider = getProvider();
  return provider.ask ? provider.ask(question, context) : "AI fallback is unavailable.";
}
