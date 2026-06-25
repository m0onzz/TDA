/**
 * TikTok Shop trend intelligence for Product Finder.
 *
 * Live TikTok Shop product browse/search requires authenticated TikTok Shop API
 * credentials (seller access token + app key). There is no public product-search
 * endpoint. When credentials are absent, we serve a curated bestseller dataset
 * modeled on 2024–2026 TikTok Shop dropshipping patterns (impulse $8–25 SKUs,
 * viral niches, title keyword structures).
 *
 * Set TIKTOK_SHOP_ACCESS_TOKEN (or store credentials in Settings) to enable a
 * future live snapshot hook; until a browse API is wired, curated data is used.
 */

export type TikTokTrendMomentum = "rising" | "steady" | "peak";

export type TikTokTrendSource = "curated" | "tiktok_shop_api";

export interface TikTokHotCategory {
  id: string;
  name: string;
  keywords: string[];
  priceMinUsd: number;
  priceMaxUsd: number;
  momentum: TikTokTrendMomentum;
}

export interface TikTokProductArchetype {
  id: string;
  label: string;
  keywords: string[];
  titlePatterns: string[];
  priceMinUsd: number;
  priceMaxUsd: number;
  catalogCategories: string[];
}

export interface TikTokShopTrendSnapshot {
  scannedAt: string;
  source: TikTokTrendSource;
  trendingKeywords: string[];
  hotCategories: TikTokHotCategory[];
  productArchetypes: TikTokProductArchetype[];
  impulsePriceMinUsd: number;
  impulsePriceMaxUsd: number;
}

export interface TikTokTrendMatchResult {
  boost: number;
  primaryMatch: string | null;
  matches: string[];
  tags: string[];
  isHot: boolean;
  matchReason: string | null;
}

/** Curated TikTok Shop bestseller categories (dropshipping niches). */
const HOT_CATEGORIES: TikTokHotCategory[] = [
  {
    id: "phone-accessories",
    name: "Phone Accessories",
    keywords: [
      "phone grip",
      "magsafe",
      "phone stand",
      "ring light",
      "selfie stick",
      "phone holder",
    ],
    priceMinUsd: 4,
    priceMaxUsd: 22,
    momentum: "peak",
  },
  {
    id: "beauty-tools",
    name: "Beauty Tools",
    keywords: [
      "ice roller",
      "gua sha",
      "led mask",
      "vanity mirror",
      "hair claw",
      "pimple patch",
      "facial steamer",
    ],
    priceMinUsd: 6,
    priceMaxUsd: 28,
    momentum: "rising",
  },
  {
    id: "kitchen-gadgets",
    name: "Kitchen Gadgets",
    keywords: [
      "portable blender",
      "mini waffle",
      "egg cooker",
      "vegetable chopper",
      "silicone utensils",
      "air fryer accessory",
    ],
    priceMinUsd: 8,
    priceMaxUsd: 25,
    momentum: "steady",
  },
  {
    id: "pet-products",
    name: "Pet Products",
    keywords: [
      "pet hair remover",
      "slow feeder",
      "dog treat",
      "cat fountain",
      "pet grooming",
      "lint roller pet",
    ],
    priceMinUsd: 5,
    priceMaxUsd: 20,
    momentum: "rising",
  },
  {
    id: "car-organizers",
    name: "Car Organizers",
    keywords: [
      "car cup holder",
      "seat gap",
      "trunk organizer",
      "car vacuum",
      "phone mount car",
      "sunshade",
    ],
    priceMinUsd: 6,
    priceMaxUsd: 24,
    momentum: "steady",
  },
  {
    id: "fitness-bands",
    name: "Fitness & Recovery",
    keywords: [
      "resistance bands",
      "cloud slides",
      "massage gun",
      "yoga mat",
      "posture corrector",
      "ankle weights",
    ],
    priceMinUsd: 7,
    priceMaxUsd: 30,
    momentum: "peak",
  },
  {
    id: "home-gadgets",
    name: "Home & LED",
    keywords: [
      "sunset lamp",
      "led strip",
      "mini vacuum",
      "wifi camera",
      "humidifier",
      "projector night light",
    ],
    priceMinUsd: 8,
    priceMaxUsd: 28,
    momentum: "rising",
  },
];

/** Product archetypes — how TikTok Shop bestsellers are titled and priced. */
const PRODUCT_ARCHETYPES: TikTokProductArchetype[] = [
  {
    id: "viral-comfort",
    label: "Viral comfort / recovery",
    keywords: ["cloud slides", "recovery slides", "memory foam", "plush"],
    titlePatterns: ["TikTok-Viral", "Cloud", "Recovery", "Comfort"],
    priceMinUsd: 8,
    priceMaxUsd: 22,
    catalogCategories: ["Fashion", "Fitness"],
  },
  {
    id: "portable-kitchen",
    label: "Portable kitchen impulse",
    keywords: ["portable blender", "mini blender", "smoothie", "usb rechargeable"],
    titlePatterns: ["Portable", "USB Rechargeable", "On The Go"],
    priceMinUsd: 10,
    priceMaxUsd: 18,
    catalogCategories: ["Kitchen"],
  },
  {
    id: "phone-grip-stand",
    label: "Phone grip & stand",
    keywords: ["phone grip", "magsafe", "pop socket", "phone stand", "hands-free"],
    titlePatterns: ["Grip", "Stand", "MagSafe", "Hands-Free"],
    priceMinUsd: 3,
    priceMaxUsd: 12,
    catalogCategories: ["Phone Accessories", "Gadgets"],
  },
  {
    id: "beauty-led",
    label: "Beauty LED / mirror",
    keywords: ["vanity mirror", "led mirror", "magnification", "makeup light"],
    titlePatterns: ["Vanity Mirror", "LED", "Magnification", "Studio Lighting"],
    priceMinUsd: 12,
    priceMaxUsd: 25,
    catalogCategories: ["Beauty"],
  },
  {
    id: "pet-hair",
    label: "Pet hair & grooming",
    keywords: ["pet hair", "lint roller", "fur remover", "grooming glove"],
    titlePatterns: ["Pet Hair", "Fur", "Lint", "Grooming"],
    priceMinUsd: 5,
    priceMaxUsd: 16,
    catalogCategories: ["Pets"],
  },
  {
    id: "home-security-cam",
    label: "Mini WiFi camera",
    keywords: ["wifi camera", "security camera", "pet cam", "1080p", "night vision"],
    titlePatterns: ["WiFi", "Security Camera", "1080p", "Night Vision"],
    priceMinUsd: 12,
    priceMaxUsd: 25,
    catalogCategories: ["Home", "Gadgets"],
  },
  {
    id: "resistance-fitness",
    label: "Home workout bands",
    keywords: ["resistance bands", "booty bands", "workout", "home gym"],
    titlePatterns: ["Resistance Bands", "Full-Body", "Home Workout"],
    priceMinUsd: 6,
    priceMaxUsd: 15,
    catalogCategories: ["Fitness"],
  },
  {
    id: "car-cup-gap",
    label: "Car cup & gap fillers",
    keywords: ["cup holder", "seat gap", "car organizer", "console"],
    titlePatterns: ["Cup Holder", "Gap", "Car", "Console"],
    priceMinUsd: 5,
    priceMaxUsd: 18,
    catalogCategories: ["Automotive", "Car"],
  },
  {
    id: "sunset-ambient",
    label: "Sunset / ambient lighting",
    keywords: ["sunset lamp", "projector", "galaxy light", "ambient", "mood light"],
    titlePatterns: ["Sunset", "Projector", "Galaxy", "Ambient", "Mood"],
    priceMinUsd: 10,
    priceMaxUsd: 22,
    catalogCategories: ["Home", "Gadgets"],
  },
  {
    id: "ice-beauty",
    label: "Ice roller / skin tools",
    keywords: ["ice roller", "face roller", "depuff", "gua sha", "jade roller"],
    titlePatterns: ["Ice Roller", "Depuff", "Gua Sha", "Facial"],
    priceMinUsd: 6,
    priceMaxUsd: 18,
    catalogCategories: ["Beauty"],
  },
];

const IMPULSE_PRICE_MIN = 8;
const IMPULSE_PRICE_MAX = 25;

const TIKTOK_HOT_BOOST_THRESHOLD = 15;

function flattenTrendKeywords(): string[] {
  const fromCategories = HOT_CATEGORIES.flatMap((cat) => cat.keywords);
  const fromArchetypes = PRODUCT_ARCHETYPES.flatMap((arch) => arch.keywords);
  const unique = new Set([...fromCategories, ...fromArchetypes]);
  return Array.from(unique);
}

function buildCuratedSnapshot(): TikTokShopTrendSnapshot {
  return {
    scannedAt: new Date().toISOString(),
    source: "curated",
    trendingKeywords: flattenTrendKeywords(),
    hotCategories: HOT_CATEGORIES,
    productArchetypes: PRODUCT_ARCHETYPES,
    impulsePriceMinUsd: IMPULSE_PRICE_MIN,
    impulsePriceMaxUsd: IMPULSE_PRICE_MAX,
  };
}

function hasTikTokShopApiCredentials(): boolean {
  return Boolean(
    process.env.TIKTOK_SHOP_ACCESS_TOKEN?.trim() ||
      process.env.TIKTOK_SHOP_API_BASE_URL?.trim()
  );
}

/**
 * Placeholder for a future live TikTok Shop seller API snapshot.
 * Product browse is not available without authenticated seller credentials.
 */
async function fetchLiveTikTokShopTrends(): Promise<TikTokShopTrendSnapshot | null> {
  if (!hasTikTokShopApiCredentials()) {
    return null;
  }

  // No public browse endpoint — return null so callers fall back to curated data.
  // Wire TikTok Shop Partner API category/trend endpoints here when available.
  return null;
}

/** Top trending keywords for chips and discovery merge. */
export function getCuratedTikTokTrendKeywords(): string[] {
  return flattenTrendKeywords().slice(0, 24);
}

/**
 * Returns the current TikTok Shop trend snapshot.
 * Uses curated bestseller patterns unless live API credentials are configured.
 */
export async function fetchTikTokShopTrends(): Promise<TikTokShopTrendSnapshot> {
  const live = await fetchLiveTikTokShopTrends();
  if (live) {
    return live;
  }
  return buildCuratedSnapshot();
}

function normalizeHaystack(title: string, description: string, category: string): string {
  return `${title} ${description} ${category}`.toLowerCase();
}

function keywordInHaystack(haystack: string, keyword: string): boolean {
  return haystack.includes(keyword.toLowerCase());
}

/**
 * Resolves TikTok trend tags for a catalog product at seed time.
 */
export function resolveTikTokTrendTags(input: {
  title: string;
  description: string;
  category: string;
  costUsd: number;
}): string[] {
  const haystack = normalizeHaystack(input.title, input.description, input.category);
  const tags = new Set<string>();

  for (const cat of HOT_CATEGORIES) {
    const categoryHit = cat.keywords.some((kw) => keywordInHaystack(haystack, kw));
    const priceHit =
      input.costUsd >= cat.priceMinUsd && input.costUsd <= cat.priceMaxUsd;
    if (categoryHit && priceHit) {
      tags.add(cat.id);
    }
  }

  for (const arch of PRODUCT_ARCHETYPES) {
    const keywordHit = arch.keywords.some((kw) => keywordInHaystack(haystack, kw));
    const categoryHit = arch.catalogCategories.some(
      (c) => c.toLowerCase() === input.category.toLowerCase()
    );
    if (keywordHit || (categoryHit && keywordInHaystack(haystack, arch.keywords[0] ?? ""))) {
      tags.add(arch.id);
    }
  }

  if (input.costUsd >= IMPULSE_PRICE_MIN && input.costUsd <= IMPULSE_PRICE_MAX) {
    tags.add("impulse-buy");
  }

  return Array.from(tags);
}

/**
 * Scores how well a product matches TikTok Shop bestseller patterns.
 */
export function scoreTikTokTrendMatch(
  input: {
    title: string;
    description: string;
    category: string;
    costPrice: number;
    catalogTags?: string[];
  },
  snapshot: TikTokShopTrendSnapshot
): TikTokTrendMatchResult {
  const haystack = normalizeHaystack(
    input.title,
    input.description,
    input.category
  );
  const matches: string[] = [];
  let boost = 0;

  for (const keyword of snapshot.trendingKeywords) {
    if (keywordInHaystack(haystack, keyword)) {
      matches.push(keyword);
      boost += keyword.split(" ").length * 8;
    }
  }

  for (const cat of snapshot.hotCategories) {
    const catKeyword = cat.keywords.find((kw) => keywordInHaystack(haystack, kw));
    if (catKeyword) {
      matches.push(catKeyword);
      boost += cat.momentum === "peak" ? 14 : cat.momentum === "rising" ? 12 : 8;
    }
    if (cat.name.toLowerCase() === input.category.toLowerCase()) {
      boost += 6;
    }
  }

  for (const arch of snapshot.productArchetypes) {
    const archKeyword = arch.keywords.find((kw) => keywordInHaystack(haystack, kw));
    if (archKeyword) {
      matches.push(archKeyword);
      boost += 10;
    }
    const patternHit = arch.titlePatterns.some((p) =>
      input.title.toLowerCase().includes(p.toLowerCase())
    );
    if (patternHit) {
      boost += 6;
    }
  }

  if (
    input.costPrice >= snapshot.impulsePriceMinUsd &&
    input.costPrice <= snapshot.impulsePriceMaxUsd
  ) {
    boost += 8;
    matches.push("impulse price");
  }

  if (input.catalogTags?.length) {
    boost += Math.min(input.catalogTags.length * 4, 16);
    for (const tag of input.catalogTags) {
      const cat = snapshot.hotCategories.find((c) => c.id === tag);
      if (cat) matches.push(cat.name);
      const arch = snapshot.productArchetypes.find((a) => a.id === tag);
      if (arch) matches.push(arch.label);
    }
  }

  const uniqueMatches = Array.from(new Set(matches));
  const primaryMatch = uniqueMatches.find((m) => m !== "impulse price") ?? null;
  const isHot = boost >= TIKTOK_HOT_BOOST_THRESHOLD;

  const matchReason = primaryMatch
    ? `Matches TikTok trend: ${primaryMatch}`
    : isHot
      ? "Aligned with TikTok Shop bestseller patterns"
      : null;

  return {
    boost,
    primaryMatch,
    matches: uniqueMatches,
    tags: input.catalogTags ?? [],
    isHot,
    matchReason,
  };
}
