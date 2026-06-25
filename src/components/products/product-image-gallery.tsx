"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ProductImageGallery({
  images,
  alt,
  className,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const gallery = images.length > 0 ? images : [];

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

  const activeImage = gallery[activeIndex] ?? gallery[0];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="aspect-video overflow-hidden rounded-md border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, index) => (
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
                src={image}
                alt={`${alt} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
