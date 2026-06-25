"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  fallbackImages?: string[];
  alt: string;
  className?: string;
}

function buildDisplaySources(
  images: string[],
  fallbackImages: string[]
): string[] {
  if (images.length === 0) {
    return fallbackImages;
  }

  return images.map((image, index) => image || fallbackImages[index] || fallbackImages[0] || "");
}

export function ProductImageGallery({
  images,
  fallbackImages = [],
  alt,
  className,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());

  const gallery = useMemo(
    () => buildDisplaySources(images, fallbackImages).filter(Boolean),
    [images, fallbackImages]
  );

  useEffect(() => {
    setActiveIndex(0);
    setFailedSources(new Set());
  }, [images, fallbackImages]);

  if (gallery.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-muted text-sm text-muted-foreground",
          className
        )}
      >
        No product images
      </div>
    );
  }

  function resolveImageSource(index: number): string {
    const primary = gallery[index] ?? gallery[0];
    if (!failedSources.has(primary)) {
      return primary;
    }

    const fallback =
      fallbackImages[index] ??
      fallbackImages[0] ??
      gallery.find((url) => !failedSources.has(url));

    return fallback ?? primary;
  }

  const activeImage = resolveImageSource(activeIndex);

  function handleImageError(url: string) {
    setFailedSources((current) => {
      const next = new Set(current);
      next.add(url);
      return next;
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => handleImageError(activeImage)}
        />
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, index) => {
            const thumbSource = resolveImageSource(index);
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-14 w-14 shrink-0 overflow-hidden rounded border-2",
                  index === activeIndex
                    ? "border-foreground"
                    : "border-border opacity-60 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbSource}
                  alt={`${alt} ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(thumbSource)}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
