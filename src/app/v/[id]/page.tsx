import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedVideoByPublicId,
  getPublishedVideoPlayback,
} from "@/lib/supabase/videos";
import { getPublicVideoPath, getPublicVideoUrl } from "@/lib/urls";
import { FullscreenVideoViewer } from "@/components/FullscreenVideoViewer";

export const dynamic = "force-dynamic";

interface PublicVideoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PublicVideoPageProps): Promise<Metadata> {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const video = await getPublishedVideoByPublicId(id);

  if (!video) {
    notFound();
  }

  const title = video.title || "Untitled Video";
  const description =
    video.description || "Watch this shared video on ScanPlay.";

  return {
    title: `${title} — ScanPlay`,
    description,
    alternates: {
      canonical: getPublicVideoPath(id),
    },
    openGraph: {
      title: `${title} — ScanPlay`,
      description,
      url: getPublicVideoUrl(id),
      type: "video.other",
    },
  };
}

export default async function PublicVideoPage({
  params,
}: PublicVideoPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Retrieve playback and verify published status server-side
  const playback = await getPublishedVideoPlayback(id);

  if (!playback) {
    notFound();
  }

  return (
    <FullscreenVideoViewer
      playbackUrl={playback.playbackUrl}
      title={playback.video.title || "Untitled Video"}
      description={playback.video.description}
    />
  );
}
