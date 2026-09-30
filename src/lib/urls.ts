/**
 * Centralized URL management for ScanPlay.
 * Constructs canonical public URLs for guest video access (/v/[id]).
 */

/**
 * Returns the base URL of the application.
 * In browser: uses window.location.origin unless NEXT_PUBLIC_SITE_URL is explicitly defined.
 * In server: uses NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, or defaults to http://localhost:3000.
 */
export function getBaseUrl(): string {
  // If explicitly provided via environment
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  // Browser context fallback
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // Server default fallback
  return "http://localhost:3000";
}

/**
 * Returns the canonical relative path for a public video.
 * Format: /v/{public_id}
 */
export function getPublicVideoPath(publicId: string): string {
  return `/v/${encodeURIComponent(publicId)}`;
}

/**
 * Returns the absolute canonical public URL for a video.
 * Example: https://scanplay.vercel.app/v/8Kx92Lm or http://localhost:3000/v/8Kx92Lm
 *
 * CRITICAL:
 * This is the ONLY link copied by users and shared with guests.
 * It must NEVER return a direct Supabase Storage or signed playback URL.
 */
export function getPublicVideoUrl(publicId: string, customOrigin?: string): string {
  const base = (customOrigin || getBaseUrl()).replace(/\/$/, "");
  return `${base}${getPublicVideoPath(publicId)}`;
}
