import { getCatalogRefreshState } from "@/lib/catalog/rotation";
import { getCuratedTikTokTrendKeywords } from "@/services/tiktokShopTrends";

const REDDIT_TREND_SUBREDDITS = [
  "TikTokMadeMeBuyIt",
  "shutupandtakemymoney",
  "AmazonFinds",
] as const;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "your",
  "you",
  "are",
  "was",
  "has",
  "have",
  "just",
  "got",
  "my",
  "our",
  "buy",
  "bought",
]);

interface RedditListing {
  data?: {
    title?: string;
    ups?: number;
  };
}

interface RedditResponse {
  data?: {
    children?: RedditListing[];
  };
}

/** Curated TikTok Shop bestseller keywords used when live web scans are unavailable. */
const FALLBACK_TREND_KEYWORDS = getCuratedTikTokTrendKeywords().slice(0, 12);

function extractKeywordsFromTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function buildPhrases(title: string): string[] {
  const words = extractKeywordsFromTitle(title);
  const phrases: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }

  if (words.length >= 3) {
    phrases.push(`${words[0]} ${words[1]} ${words[2]}`);
  }

  return phrases;
}

async function fetchSubredditTrends(
  subreddit: string
): Promise<string[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`,
      {
        headers: {
          "User-Agent": "TikTokDropshipAutomator/1.0",
        },
        signal: controller.signal,
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as RedditResponse;
    const titles =
      json.data?.children
        ?.map((child) => child.data?.title ?? "")
        .filter(Boolean) ?? [];

    return titles.flatMap(buildPhrases);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

let webTrendCache:
  | { windowId: number; keywords: string[]; sources: string[] }
  | null = null;

/**
 * Scans public web trend signals (Reddit hot posts) for product keywords.
 * Falls back to curated TikTok bestseller terms if the network scan fails.
 */
export async function fetchWebTrendKeywords(): Promise<{
  keywords: string[];
  sources: string[];
}> {
  const { windowId } = getCatalogRefreshState();
  if (webTrendCache?.windowId === windowId) {
    return webTrendCache;
  }

  const scans = await Promise.all(
    REDDIT_TREND_SUBREDDITS.map(async (subreddit) => {
      const phrases = await fetchSubredditTrends(subreddit);
      return { subreddit, phrases };
    })
  );

  const keywordScores = new Map<string, number>();
  const sources: string[] = [];

  for (const scan of scans) {
    if (scan.phrases.length > 0) {
      sources.push(`reddit/r/${scan.subreddit}`);
      for (const phrase of scan.phrases) {
        keywordScores.set(phrase, (keywordScores.get(phrase) ?? 0) + 1);
      }
    }
  }

  if (keywordScores.size === 0) {
    webTrendCache = {
      windowId,
      keywords: [...FALLBACK_TREND_KEYWORDS],
      sources: ["curated/tiktok-bestsellers"],
    };
    return webTrendCache;
  }

  const keywords = Array.from(keywordScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([phrase]) => phrase);

  webTrendCache = { windowId, keywords, sources };
  return webTrendCache;
}

export function scoreWebTrendMatch(
  title: string,
  keywords: string[]
): { boost: number; match: string | null } {
  const normalizedTitle = title.toLowerCase();
  let bestScore = 0;
  let bestMatch: string | null = null;

  for (const keyword of keywords) {
    if (normalizedTitle.includes(keyword)) {
      const score = keyword.split(" ").length * 10;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = keyword;
      }
    }
  }

  return { boost: bestScore, match: bestMatch };
}
