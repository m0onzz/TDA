/** Square 800×800 crop — TikTok Shop 1:1 listing standard. */
export function unsplashSquare(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=800&h=800&fit=crop&crop=center&q=85&auto=format`;
}
