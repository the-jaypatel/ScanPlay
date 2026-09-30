import { customAlphabet } from "nanoid";

/**
 * URL-safe alphanumeric alphabet (excluding lookalikes if needed, or standard safe set)
 * Satisfies PostgreSQL regex: ^[A-Za-z0-9_-]{5,32}$
 */
const ALPHANUMERIC_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const nanoid = customAlphabet(ALPHANUMERIC_ALPHABET, 8);

/**
 * Generates a short, non-sequential, secure, URL-safe public identifier.
 * Example: "8Kx92Lm"
 */
export function generatePublicId(): string {
  return nanoid();
}

/**
 * Extracts a safe file extension from a video File or MIME type.
 * Default fallback to 'mp4'
 */
export function getSafeVideoExtension(file: File): string {
  const mimeType = file.type.toLowerCase();
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("quicktime")) return "mov";
  if (mimeType.includes("ogg")) return "ogv";
  if (mimeType.includes("x-matroska") || mimeType.includes("mkv")) return "mkv";

  // Check filename extension if available
  const match = file.name.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (["mp4", "webm", "mov", "ogv", "mkv", "m4v"].includes(ext)) {
      return ext;
    }
  }

  return "mp4";
}
