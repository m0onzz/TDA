export function normalizeListingTitle(title: string): string {
  const cleaned = title.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) {
    return cleaned;
  }

  return `${cleaned.slice(0, 57).trim()}...`;
}

export function normalizeListingDescription(description: string): string {
  const trimmed = description.trim();

  if (trimmed.length >= 20) {
    return trimmed;
  }

  return [
    trimmed,
    "",
    "• Fast shipping",
    "• Great value for TikTok Shop",
    "• Trending product",
  ]
    .filter(Boolean)
    .join("\n");
}

const STOP_WORDS = new Set([
  "with",
  "your",
  "this",
  "that",
  "from",
  "have",
  "been",
  "they",
  "will",
  "what",
  "when",
  "make",
  "like",
  "just",
  "over",
  "such",
  "into",
  "than",
  "them",
  "some",
  "only",
  "very",
  "also",
]);

export function buildListingTags(
  title: string,
  category: string | null
): [string, string, string, string, string] {
  const tags: string[] = [];

  if (category) {
    tags.push(category.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24));
  }

  const words = title.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [];
  for (const word of words) {
    if (!STOP_WORDS.has(word)) {
      tags.push(word.slice(0, 24));
    }
  }

  tags.push("tiktokshop", "fyp", "viral", "musthave", "shop");

  const unique = Array.from(
    new Set(tags.map((tag) => tag.replace(/^#/, "")))
  ).filter(Boolean);

  while (unique.length < 5) {
    unique.push("trending");
  }

  return unique.slice(0, 5) as [string, string, string, string, string];
}

export function buildDefaultTikTokMarketing(
  title: string,
  category: string | null,
  sellingPrice: number
) {
  const categoryTag = category
    ? `#${category.replace(/\s+/g, "")}`
    : "#TikTokMadeMeBuyIt";

  return {
    tiktokCaption: `${title} — now $${sellingPrice.toFixed(2)} on TikTok Shop. Tap to order.`,
    videoHook: `This ${category?.toLowerCase() ?? "find"} is under $${Math.ceil(sellingPrice)}`,
    hashtags: ["#tiktokshop", "#fyp", "#viral", categoryTag, "#musthave"],
    callToAction: "Shop now — link in bio",
  };
}
