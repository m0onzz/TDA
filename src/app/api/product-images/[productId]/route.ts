import { NextResponse } from "next/server";
import { getCuratedProductImages } from "@/data/curated-product-images";

export const dynamic = "force-dynamic";

const FALLBACK_PICSUM = (productId: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(productId)}/800/800`;

async function fetchImageBuffer(
  url: string
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TikTokDropshipAutomator/1.0",
        Accept: "image/*",
      },
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    return {
      buffer: await response.arrayBuffer(),
      contentType,
    };
  } catch {
    return null;
  }
}

function svgPlaceholder(productId: string): Response {
  const label = productId.replace(/-/g, " ").slice(0, 24);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f4f4f5"/>
  <text x="400" y="400" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="#71717a">${label}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: { productId: string } }
) {
  const productId = decodeURIComponent(context.params.productId);
  const { searchParams } = new URL(request.url);
  const index = Math.max(0, Number(searchParams.get("index") ?? "0") || 0);

  const curated = getCuratedProductImages(productId);
  const candidates = [
    curated[index],
    curated[0],
    FALLBACK_PICSUM(`${productId}-${index}`),
    FALLBACK_PICSUM(productId),
  ].filter((url): url is string => Boolean(url));

  for (const url of candidates) {
    const result = await fetchImageBuffer(url);
    if (result) {
      return new NextResponse(result.buffer, {
        headers: {
          "Content-Type": result.contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }
  }

  return svgPlaceholder(productId);
}
