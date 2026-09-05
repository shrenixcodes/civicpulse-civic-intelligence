// Static definitions used only by the seed script to build a realistic,
// fully deterministic demo dataset around one Indian city (Chennai).
// No AI calls are made for any of this data.

export type SeedCategory =
  | "Water"
  | "Roads"
  | "Garbage"
  | "Street Lighting"
  | "Sewage"
  | "Flooding"
  | "Electricity";

export const CITY_CENTER = { latitude: 13.0827, longitude: 80.2707 }; // Chennai

// A small deterministic pseudo-random generator (mulberry32) so re-running
// the seed script always produces the exact same dataset.
export function createRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Ward {
  name: string;
  latitude: number;
  longitude: number;
}

// 20 wards laid out in a deterministic ring/grid around the city center,
// roughly 1-6km apart — enough spread for a believable city map.
export const WARDS: Ward[] = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2;
  const radius = 0.015 + (i % 4) * 0.012; // ~1.6km - 5.8km
  return {
    name: `Ward ${i + 1}`,
    latitude: CITY_CENTER.latitude + Math.sin(angle) * radius,
    longitude: CITY_CENTER.longitude + Math.cos(angle) * radius,
  };
});

export interface Phrase {
  language: "English" | "Hindi" | "Tamil";
  text: string;
}

export const PHRASES: Record<SeedCategory, { subcategory: string; phrases: Phrase[] }> = {
  Water: {
    subcategory: "Water outage",
    phrases: [
      { language: "English", text: "No water for three days." },
      { language: "Hindi", text: "तीन दिन से पानी नहीं आ रहा है।" },
      { language: "Tamil", text: "மூன்று நாட்களாக தண்ணீர் வரவில்லை." },
      { language: "English", text: "Our street hasn't received water for three days." },
      { language: "Hindi", text: "हमारी गली में तीन दिन से पानी नहीं आया।" },
      { language: "Tamil", text: "எங்கள் தெருவில் மூன்று நாட்களாக தண்ணீர் வரவில்லை." },
      { language: "English", text: "Water supply stopped again." },
      { language: "Hindi", text: "पानी की आपूर्ति फिर से बंद हो गई है।" },
      { language: "Tamil", text: "தண்ணீர் விநியோகம் மீண்டும் நிறுத்தப்பட்டது." },
      { language: "English", text: "There has been no water supply since Monday in our area." },
      { language: "Hindi", text: "सोमवार से हमारे इलाके में पानी नहीं आ रहा।" },
      { language: "Tamil", text: "திங்கள்கிழமை முதல் எங்கள் பகுதியில் தண்ணீர் இல்லை." },
      { language: "English", text: "The water tanker hasn't come this week either." },
    ],
  },
  Roads: {
    subcategory: "Pothole",
    phrases: [
      { language: "English", text: "There is a large pothole on our street." },
      { language: "English", text: "The road near our house is badly damaged." },
      { language: "English", text: "Potholes are causing accidents on this road." },
      { language: "English", text: "This road has not been repaired in months." },
      { language: "Hindi", text: "हमारी सड़क पर बड़ा गड्ढा है।" },
      { language: "Hindi", text: "हमारे घर के पास सड़क बहुत खराब है।" },
      { language: "Hindi", text: "इस सड़क के गड्ढों की वजह से दुर्घटनाएं हो रही हैं।" },
      { language: "Tamil", text: "எங்கள் தெருவில் பெரிய குழி உள்ளது." },
      { language: "Tamil", text: "எங்கள் வீட்டிற்கு அருகில் சாலை மிகவும் சேதமடைந்துள்ளது." },
      { language: "Tamil", text: "இந்த சாலையில் குழிகள் காரணமாக விபத்துகள் ஏற்படுகின்றன." },
    ],
  },
  Garbage: {
    subcategory: "Uncollected waste",
    phrases: [
      { language: "English", text: "Garbage has not been collected for days." },
      { language: "English", text: "There is a huge pile of trash on our street." },
      { language: "English", text: "The garbage truck hasn't come this week." },
      { language: "English", text: "Waste is piling up near the market." },
      { language: "Hindi", text: "कई दिनों से कचरा नहीं उठाया गया।" },
      { language: "Hindi", text: "हमारी गली में कूड़े का ढेर लगा है।" },
      { language: "Hindi", text: "इस हफ्ते कचरा गाड़ी नहीं आई।" },
      { language: "Tamil", text: "பல நாட்களாக குப்பை அகற்றப்படவில்லை." },
      { language: "Tamil", text: "எங்கள் தெருவில் குப்பை குவியல் உள்ளது." },
      { language: "Tamil", text: "இந்த வாரம் குப்பை வண்டி வரவில்லை." },
    ],
  },
  "Street Lighting": {
    subcategory: "Streetlight outage",
    phrases: [
      { language: "English", text: "The streetlight on our road is not working." },
      { language: "English", text: "Our street has been dark for a week." },
      { language: "English", text: "Several streetlights are broken in this area." },
      { language: "Hindi", text: "हमारी सड़क की स्ट्रीट लाइट काम नहीं कर रही।" },
      { language: "Hindi", text: "एक हफ्ते से हमारी गली अंधेरी है।" },
      { language: "Tamil", text: "எங்கள் சாலையில் தெரு விளக்கு வேலை செய்யவில்லை." },
      { language: "Tamil", text: "ஒரு வாரமாக எங்கள் தெரு இருட்டாக உள்ளது." },
    ],
  },
  Sewage: {
    subcategory: "Sewage overflow",
    phrases: [
      { language: "English", text: "Sewage is overflowing onto our street." },
      { language: "English", text: "The drain near our house is blocked and overflowing." },
      { language: "English", text: "Sewage water has been stagnant for days." },
      { language: "Hindi", text: "हमारी सड़क पर सीवर का पानी बह रहा है।" },
      { language: "Hindi", text: "हमारे घर के पास नाला बंद है और बह रहा है।" },
      { language: "Tamil", text: "எங்கள் தெருவில் கழிவுநீர் வழிகிறது." },
      { language: "Tamil", text: "எங்கள் வீட்டிற்கு அருகில் வடிகால் அடைபட்டு வழிகிறது." },
    ],
  },
  Flooding: {
    subcategory: "Waterlogging",
    phrases: [
      { language: "English", text: "Our street floods every time it rains." },
      { language: "English", text: "There is severe waterlogging near our home." },
      { language: "English", text: "The road is flooded and impassable." },
      { language: "Hindi", text: "हर बार बारिश में हमारी सड़क में पानी भर जाता है।" },
      { language: "Hindi", text: "हमारे घर के पास गंभीर जलभराव है।" },
      { language: "Tamil", text: "மழை பெய்யும் போதெல்லாம் எங்கள் தெருவில் வெள்ளம் வருகிறது." },
      { language: "Tamil", text: "எங்கள் வீட்டிற்கு அருகில் கடுமையான வெள்ளம் உள்ளது." },
    ],
  },
  Electricity: {
    subcategory: "Power outage",
    phrases: [
      { language: "English", text: "Power has been cut for hours." },
      { language: "English", text: "Frequent power outages in our area." },
      { language: "English", text: "There is no electricity since morning." },
      { language: "Hindi", text: "कई घंटों से बिजली गुल है।" },
      { language: "Hindi", text: "हमारे इलाके में बार-बार बिजली जाती है।" },
      { language: "Tamil", text: "பல மணி நேரமாக மின்சாரம் இல்லை." },
      { language: "Tamil", text: "எங்கள் பகுதியில் அடிக்கடி மின்தடை ஏற்படுகிறது." },
    ],
  },
};

export const RECOMMENDED_ACTIONS: Record<SeedCategory, string> = {
  Water:
    "Inspect the local water distribution network and verify whether the outage originates from the primary pipeline or a local distribution line.",
  Roads: "Dispatch a road maintenance crew to assess and patch the reported surface damage.",
  Garbage: "Schedule an additional waste collection run and review the collection route for this area.",
  "Street Lighting": "Send an electrician to inspect and repair the affected streetlight fixtures.",
  Sewage: "Inspect the sewage line for blockages and dispatch a cleaning crew to the affected stretch.",
  Flooding: "Assess local drainage capacity and clear blocked storm drains in the affected area.",
  Electricity: "Inspect the local transformer and distribution line for faults causing the outage.",
};

export interface ClusterDef {
  category: SeedCategory;
  title: string;
  wardIndex: number;
  reportCount: number;
  severity: number;
  urgency: number;
  trendPercent: number;
  spreadKm: number; // how tightly reports jitter around the ward center
}

// 32 clusters, 200 reports total — matches the demo script exactly.
export const CLUSTER_DEFS: ClusterDef[] = [
  // Water — one dominant, city-leading cluster (the flagship demo issue)
  { category: "Water", title: "Water Supply Outage", wardIndex: 13, reportCount: 45, severity: 90, urgency: 88, trendPercent: 42, spreadKm: 0.3 },

  // Roads / Potholes — 9 clusters, 35 reports
  { category: "Roads", title: "Potholes on Anna Salai Stretch", wardIndex: 2, reportCount: 5, severity: 55, urgency: 50, trendPercent: 12, spreadKm: 0.6 },
  { category: "Roads", title: "Potholes near Market Road", wardIndex: 5, reportCount: 5, severity: 58, urgency: 52, trendPercent: 8, spreadKm: 0.5 },
  { category: "Roads", title: "Damaged Road Surface, Ward 8", wardIndex: 7, reportCount: 4, severity: 50, urgency: 45, trendPercent: 5, spreadKm: 0.7 },
  { category: "Roads", title: "Potholes near School Zone", wardIndex: 10, reportCount: 4, severity: 62, urgency: 60, trendPercent: 15, spreadKm: 0.4 },
  { category: "Roads", title: "Road Damage near Bus Depot", wardIndex: 16, reportCount: 4, severity: 48, urgency: 42, trendPercent: 3, spreadKm: 0.8 },
  { category: "Roads", title: "Potholes on Ring Road", wardIndex: 4, reportCount: 4, severity: 53, urgency: 48, trendPercent: 6, spreadKm: 0.9 },
  { category: "Roads", title: "Cracked Road near Residential Colony", wardIndex: 11, reportCount: 3, severity: 40, urgency: 35, trendPercent: -4, spreadKm: 0.5 },
  { category: "Roads", title: "Potholes near Railway Crossing", wardIndex: 18, reportCount: 3, severity: 45, urgency: 40, trendPercent: 2, spreadKm: 0.6 },
  { category: "Roads", title: "Road Damage near Industrial Area", wardIndex: 1, reportCount: 3, severity: 42, urgency: 38, trendPercent: -2, spreadKm: 0.7 },

  // Garbage — 6 clusters, 30 reports
  { category: "Garbage", title: "Uncollected Waste near Central Market", wardIndex: 6, reportCount: 6, severity: 55, urgency: 50, trendPercent: 18, spreadKm: 0.4 },
  { category: "Garbage", title: "Garbage Pileup, Residential Ward 3", wardIndex: 3, reportCount: 5, severity: 48, urgency: 44, trendPercent: 10, spreadKm: 0.5 },
  { category: "Garbage", title: "Waste Collection Delays near Bus Stand", wardIndex: 9, reportCount: 5, severity: 45, urgency: 40, trendPercent: 5, spreadKm: 0.6 },
  { category: "Garbage", title: "Overflowing Bins near School", wardIndex: 15, reportCount: 5, severity: 50, urgency: 46, trendPercent: 8, spreadKm: 0.4 },
  { category: "Garbage", title: "Garbage Dump near Riverside Colony", wardIndex: 19, reportCount: 5, severity: 60, urgency: 55, trendPercent: 20, spreadKm: 0.5 },
  { category: "Garbage", title: "Uncollected Waste, Ward 12", wardIndex: 12, reportCount: 4, severity: 40, urgency: 36, trendPercent: 0, spreadKm: 0.7 },

  // Street Lighting — 5 clusters, 25 reports
  { category: "Street Lighting", title: "Streetlight Outage near Park Avenue", wardIndex: 0, reportCount: 6, severity: 38, urgency: 45, trendPercent: 9, spreadKm: 0.5 },
  { category: "Street Lighting", title: "Dark Streets near Housing Colony", wardIndex: 8, reportCount: 5, severity: 35, urgency: 40, trendPercent: 4, spreadKm: 0.6 },
  { category: "Street Lighting", title: "Streetlight Failure near School Road", wardIndex: 14, reportCount: 5, severity: 42, urgency: 50, trendPercent: 14, spreadKm: 0.4 },
  { category: "Street Lighting", title: "Broken Streetlights near Bus Terminus", wardIndex: 17, reportCount: 5, severity: 30, urgency: 34, trendPercent: -3, spreadKm: 0.7 },
  { category: "Street Lighting", title: "Streetlight Outage, Ward 5", wardIndex: 5, reportCount: 4, severity: 33, urgency: 36, trendPercent: 1, spreadKm: 0.6 },

  // Sewage — 5 clusters, 25 reports
  { category: "Sewage", title: "Sewage Overflow near Lakeview Colony", wardIndex: 4, reportCount: 6, severity: 82, urgency: 78, trendPercent: 25, spreadKm: 0.4 },
  { category: "Sewage", title: "Blocked Drain near Market Street", wardIndex: 10, reportCount: 5, severity: 70, urgency: 65, trendPercent: 16, spreadKm: 0.5 },
  { category: "Sewage", title: "Sewage Overflow, Ward 7", wardIndex: 7, reportCount: 5, severity: 65, urgency: 60, trendPercent: 10, spreadKm: 0.6 },
  { category: "Sewage", title: "Drain Blockage near School Zone", wardIndex: 16, reportCount: 5, severity: 68, urgency: 62, trendPercent: 12, spreadKm: 0.5 },
  { category: "Sewage", title: "Sewage Overflow near Bus Depot", wardIndex: 2, reportCount: 4, severity: 60, urgency: 55, trendPercent: 6, spreadKm: 0.7 },

  // Flooding — 3 clusters, 20 reports
  { category: "Flooding", title: "Waterlogging near Riverside Colony", wardIndex: 19, reportCount: 8, severity: 88, urgency: 85, trendPercent: 30, spreadKm: 0.5 },
  { category: "Flooding", title: "Flooded Road near Low-Lying Ward", wardIndex: 12, reportCount: 7, severity: 78, urgency: 72, trendPercent: 20, spreadKm: 0.6 },
  { category: "Flooding", title: "Waterlogging near Market Road", wardIndex: 6, reportCount: 5, severity: 65, urgency: 60, trendPercent: 8, spreadKm: 0.6 },

  // Electricity — 3 clusters, 20 reports
  { category: "Electricity", title: "Power Outage near Industrial Area", wardIndex: 1, reportCount: 8, severity: 75, urgency: 70, trendPercent: 22, spreadKm: 0.5 },
  { category: "Electricity", title: "Frequent Power Cuts, Ward 9", wardIndex: 9, reportCount: 7, severity: 62, urgency: 58, trendPercent: 11, spreadKm: 0.6 },
  { category: "Electricity", title: "Power Outage near Residential Colony", wardIndex: 15, reportCount: 5, severity: 55, urgency: 50, trendPercent: 4, spreadKm: 0.6 },
];
