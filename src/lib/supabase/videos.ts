import "server-only";
import { createClient } from "./server";
import { createAdminClient } from "./admin";
import type { PublicVideo } from "@/types/database.types";

export interface PublishedVideoPlayback {
  video: PublicVideo;
  playbackUrl: string;
}

export const DEMO_PUBLIC_ID = "demo";

export const DEMO_VIDEO: PublicVideo = {
  public_id: DEMO_PUBLIC_ID,
  title: "ScanPlay Product Demo",
  description: "Experience ScanPlay's distraction-free guest video player with direct playback.",
  video_url: "/demo.mp4",
  created_at: "2026-01-01T00:00:00Z",
};

/**
 * Retrieves public video metadata for /v/[id] guests.
 * Enforces security constraints:
 * - Only queries published videos (published = true)
 * - Returns only public fields (public_id, title, description, video_url, created_at)
 * - Internal ID and user_id are never retrieved or returned
 */
export async function getPublishedVideoByPublicId(
  publicId: string
): Promise<PublicVideo | null> {
  // Safe bypass for the public demo video asset
  if (publicId === DEMO_PUBLIC_ID) {
    return DEMO_VIDEO;
  }

  // Validate public_id format before querying
  if (!publicId || !/^[A-Za-z0-9_-]{5,32}$/.test(publicId)) {
    return null;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("videos")
      .select("public_id, title, description, video_url, created_at")
      .eq("public_id", publicId)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error retrieving public video metadata:", err);
    return null;
  }
}

/**
 * Securely retrieves playback information for a published video.
 *
 * CRITICAL SECURITY ARCHITECTURE (Private Storage Bucket):
 * 1. Checks that the video record exists in the database and has published = true.
 * 2. Only if published = true, generates a time-limited signed URL from the private 'videos' bucket.
 * 3. Unpublished videos (published = false) or deleted records will NEVER receive a playback URL.
 */
export async function getPublishedVideoPlayback(
  publicId: string,
  expiresInSeconds: number = 3600
): Promise<PublishedVideoPlayback | null> {
  // Safe bypass for the public demo video asset
  if (publicId === DEMO_PUBLIC_ID) {
    return {
      video: DEMO_VIDEO,
      playbackUrl: "/demo.mp4",
    };
  }

  if (!publicId || !/^[A-Za-z0-9_-]{5,32}$/.test(publicId)) {
    return null;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return null;
    }

    const supabase = await createClient();

    // Query database: only records where published is true are accessible
    const { data, error } = await supabase
      .from("videos")
      .select("public_id, title, description, storage_path, video_url, created_at")
      .eq("public_id", publicId)
      .eq("published", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Generate signed URL using administrative server client for the private bucket
    const adminClient = createAdminClient();
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("videos")
      .createSignedUrl(data.storage_path, expiresInSeconds);

    if (signedError || !signedData?.signedUrl) {
      return null;
    }

    return {
      video: {
        public_id: data.public_id,
        title: data.title,
        description: data.description,
        video_url: data.video_url,
        created_at: data.created_at,
      },
      playbackUrl: signedData.signedUrl,
    };
  } catch (err) {
    console.error("Error retrieving video playback:", err);
    return null;
  }
}
