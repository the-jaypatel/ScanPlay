/**
 * Centralized URL management for ScanPlay.
 * Constructs canonical public URLs for guest video access (/v/[id]).
 */

/**
 * Returns the base URL of the application.
 *
 * CANONICAL PRECEDENCE:
 * 1. NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL) if defined.
 *    In production on Vercel, this guarantees that canonical public links use
 *    the primary domain (e.g. https://scan-play-drab.vercel.app) rather than
 *    deployment-specific preview hostnames protected by Vercel deployment protection.
 * 2. In browser (only when NEXT_PUBLIC_SITE_URL is not set): window.location.origin.
 * 3. Server default fallback: http://localhost:3000.
 */
export function getBaseUrl(): string {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (configuredSiteUrl && configuredSiteUrl.trim() !== "") {
    return configuredSiteUrl.trim().replace(/\/$/, "");
  }

  // Browser context fallback when NEXT_PUBLIC_SITE_URL is not configured
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
 * Example: https://scan-play-drab.vercel.app/v/JDIhZTLU or http://localhost:3000/v/JDIhZTLU
 *
 * CRITICAL REQUIREMENTS:
 * 1. MUST use NEXT_PUBLIC_SITE_URL whenever configured.
 * 2. The browser's current origin (e.g. Vercel deployment preview hostname)
 *    MUST NOT override the configured production site URL.
 * 3. This is the ONLY link copied by users and shared with guests.
 * 4. It must NEVER return a direct Supabase Storage or signed playback URL.
 */
export function getPublicVideoUrl(publicId: string, customOrigin?: string): string {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

  // If NEXT_PUBLIC_SITE_URL is configured, it ALWAYS takes highest precedence.
  // Neither customOrigin nor window.location.origin can override it.
  const base =
    configuredSiteUrl && configuredSiteUrl.trim() !== ""
      ? configuredSiteUrl.trim().replace(/\/$/, "")
      : (customOrigin ? customOrigin.trim().replace(/\/$/, "") : getBaseUrl());

  return `${base}${getPublicVideoPath(publicId)}`;
}
