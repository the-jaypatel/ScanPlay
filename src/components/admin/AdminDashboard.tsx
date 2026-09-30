"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generatePublicId, getSafeVideoExtension } from "@/lib/id";
import { getPublicVideoUrl, getPublicVideoPath } from "@/lib/urls";
import type { VideoRecord } from "@/types/database.types";
import {
  Play,
  LogOut,
  UploadCloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  Trash2,
  AlertCircle,
  Loader2,
  FileVideo,
  X,
} from "lucide-react";

interface AdminDashboardProps {
  userEmail: string;
  userId: string;
  initialVideos: VideoRecord[];
}

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export function AdminDashboard({
  userEmail,
  userId,
  initialVideos,
}: AdminDashboardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<VideoRecord[]>(initialVideos);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const origin = React.useSyncExternalStore(
    () => () => {},
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newlyUploadedVideo, setNewlyUploadedVideo] = useState<{
    publicId: string;
    title: string;
    publicUrl: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Handle Logout
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/admin/login");
    }
  };

  // Handle File Selection with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validation: MIME type
    if (!file.type.startsWith("video/") && !/\.(mp4|webm|mov|mkv|ogv|m4v)$/i.test(file.name)) {
      setUploadError("Only video files are supported. Please select a valid video format.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validation: File size limit (500 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("This video is larger than the maximum allowed size (500 MB).");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    // Autofill title with clean filename if title is currently empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").trim();
      setTitle(cleanName.slice(0, 150));
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload Flow with Lifecycle Hardening
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent accidental duplicate submissions
    if (isUploading) return;

    setUploadError(null);
    setNewlyUploadedVideo(null);

    if (!selectedFile) {
      setUploadError("Please select a video file.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setUploadError("Please enter a title for your video.");
      return;
    }

    if (cleanTitle.length > 150) {
      setUploadError("Title cannot exceed 150 characters.");
      return;
    }

    const cleanDescription = description.trim() || null;

    setIsUploading(true);

    try {
      const supabase = createClient();
      let publicId = generatePublicId();
      const ext = getSafeVideoExtension(selectedFile);
      let storagePath = `${publicId}.${ext}`;

      // Step 1: Upload to private Supabase Storage bucket 'videos'
      const { error: storageError } = await supabase.storage
        .from("videos")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // Step 2: Insert record into 'videos' database table
      const canonicalRelativeUrl = getPublicVideoPath(publicId);

      let dbInsertResult = await supabase
        .from("videos")
        .insert({
          public_id: publicId,
          user_id: userId,
          title: cleanTitle,
          description: cleanDescription,
          storage_path: storagePath,
          video_url: canonicalRelativeUrl,
          published: true,
        })
        .select()
        .single();

      // Retry if duplicate public_id collision occurred
      if (dbInsertResult.error && dbInsertResult.error.code === "23505") {
        // Rollback initial storage upload
        await supabase.storage.from("videos").remove([storagePath]);

        // Generate new public ID and retry once
        publicId = generatePublicId();
        storagePath = `${publicId}.${ext}`;

        const retryStorage = await supabase.storage
          .from("videos")
          .upload(storagePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (retryStorage.error) {
          throw new Error(`Storage retry failed: ${retryStorage.error.message}`);
        }

        dbInsertResult = await supabase
          .from("videos")
          .insert({
            public_id: publicId,
            user_id: userId,
            title: cleanTitle,
            description: cleanDescription,
            storage_path: storagePath,
            video_url: getPublicVideoPath(publicId),
            published: true,
          })
          .select()
          .single();
      }

      if (dbInsertResult.error) {
        // Cleanup storage file on database failure so orphaned files are not left behind
        const { error: cleanupError } = await supabase.storage
          .from("videos")
          .remove([storagePath]);

        if (cleanupError) {
          throw new Error(
            `Database record creation failed: ${dbInsertResult.error.message}. Storage cleanup could not be completed: ${cleanupError.message}.`
          );
        }
        throw new Error(`Database record creation failed: ${dbInsertResult.error.message}`);
      }

      const createdRecord = dbInsertResult.data;
      const fullPublicUrl = getPublicVideoUrl(publicId, origin);

      // Update state
      setVideos((prev) => [createdRecord, ...prev]);
      setNewlyUploadedVideo({
        publicId,
        title: createdRecord.title,
        publicUrl: fullPublicUrl,
      });

      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during upload.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Copy Link to clipboard with graceful error handling
  const handleCopyLink = async (publicUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      setUploadError("Unable to copy link. Please copy it manually.");
    }
  };

  // Hardened Delete Video Flow
  const handleDeleteVideo = async (video: VideoRecord) => {
    if (deletingId) return;

    setDeletingId(video.id);
    setUploadError(null);

    try {
      const supabase = createClient();

      // Step 1: Delete object from private storage bucket first
      const { error: storageDeleteError } = await supabase.storage
        .from("videos")
        .remove([video.storage_path]);

      if (storageDeleteError) {
        throw new Error(
          `Failed to remove video file from storage: ${storageDeleteError.message}. The database record was kept intact. Please try again.`
        );
      }

      // Step 2: Delete database record
      const { error: dbDeleteError } = await supabase
        .from("videos")
        .delete()
        .eq("id", video.id);

      if (dbDeleteError) {
        throw new Error(
          `Video file was removed from storage, but database record removal could not be completed: ${dbDeleteError.message}. Please refresh the dashboard.`
        );
      }

      // Step 3: Remove from local state
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      if (newlyUploadedVideo?.publicId === video.public_id) {
        setNewlyUploadedVideo(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during deletion.";
      setUploadError(message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              aria-label="ScanPlay Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950">
                <Play className="h-4 w-4 fill-zinc-950 ml-0.5" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                ScanPlay
              </span>
            </Link>
            <span className="hidden sm:inline-block text-zinc-600" aria-hidden="true">/</span>
            <span className="hidden sm:inline-block text-sm font-medium text-zinc-400">
              Admin Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden md:inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
              aria-label="Log out of admin"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Upload Error Alert */}
        {uploadError && (
          <div
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            className="mb-8 flex items-start gap-3 rounded-2xl border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200"
          >
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 break-words">{uploadError}</div>
            <button
              onClick={() => setUploadError(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-200 p-2 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success Banner (VIDEO READY) */}
        {newlyUploadedVideo && (
          <div
            role="status"
            aria-live="polite"
            className="mb-10 rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-6 sm:p-8 backdrop-blur-sm shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Video Ready</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight break-words">
                  {newlyUploadedVideo.title}
                </h2>
                <p className="font-mono text-xs sm:text-sm text-zinc-300 break-anywhere">
                  {newlyUploadedVideo.publicUrl}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyLink(
                      newlyUploadedVideo.publicUrl,
                      newlyUploadedVideo.publicId
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {copiedId === newlyUploadedVideo.publicId ? "Copied!" : "Copy Link"}
                  </span>
                </button>

                <a
                  href={getPublicVideoPath(newlyUploadedVideo.publicId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Open Video</span>
                </a>

                <button
                  type="button"
                  onClick={() => setNewlyUploadedVideo(null)}
                  className="min-h-[44px] px-3 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                  aria-label="Dismiss success message"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Upload a Video Card */}
        <section
          aria-labelledby="upload-section-title"
          className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 lg:p-10 backdrop-blur-sm shadow-xl mb-12"
        >
          <div className="mb-6">
            <h2
              id="upload-section-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-white"
            >
              Upload a Video
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Select a video file to host securely in your private storage and generate a shareable link.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* File Drop / Selection Area */}
            <div>
              <label
                htmlFor="video-file-input"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
              >
                Video File <span className="text-zinc-500 font-normal">(Max 500 MB)</span>
              </label>

              <div className="relative rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/60 p-6 sm:p-8 text-center transition-colors hover:border-zinc-700 focus-within:border-zinc-500">
                <input
                  ref={fileInputRef}
                  id="video-file-input"
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.mkv,.ogv"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Choose video file"
                />

                {selectedFile ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200">
                        <FileVideo className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate max-w-xs sm:max-w-md">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelectedFile();
                      }}
                      disabled={isUploading}
                      className="relative z-10 inline-flex items-center justify-center min-h-[44px] gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Change File</span>
                    </button>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center justify-center py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 mb-3">
                      <UploadCloud className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200">
                      Click to browse or drag and drop your video file
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      MP4, WebM, MOV up to 500 MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title & Description Fields */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="video-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
                >
                  Video Title <span className="text-zinc-500 font-normal">(Max 150 characters)</span>
                </label>
                <input
                  id="video-title"
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wedding Welcome Message"
                  disabled={isUploading}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-60 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="video-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
                >
                  Description <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="video-description"
                  rows={2}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or note for viewers..."
                  disabled={isUploading}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-3 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-60 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-white px-7 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Uploading Video...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" aria-hidden="true" />
                    <span>Upload Video</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Your Videos */}
        <section aria-labelledby="videos-list-title">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                id="videos-list-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-white"
              >
                Your Videos
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Manage your hosted videos and copy their shareable links.
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-400">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          </div>

          {videos.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/30 p-10 sm:p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500 mb-4">
                <FileVideo className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-white">No videos yet</h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
                Upload your first video to generate a shareable ScanPlay link.
              </p>
            </div>
          ) : (
            /* Video List Cards */
            <div className="space-y-4">
              {videos.map((video) => {
                const publicUrl = getPublicVideoUrl(video.public_id, origin);
                const publicPath = getPublicVideoPath(video.public_id);
                const formattedDate = new Date(video.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const isDeleting = deletingId === video.id;
                const isConfirming = confirmDeleteId === video.id;

                return (
                  <div
                    key={video.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm transition-colors hover:border-zinc-700/80"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-semibold text-white tracking-tight break-words">
                          {video.title}
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-emerald-900/50 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                          Published
                        </span>
                      </div>

                      {video.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 break-words">
                          {video.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-zinc-500">
                        <span>{formattedDate}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span className="font-mono text-zinc-400 break-anywhere">
                          {publicUrl}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800/60 shrink-0">
                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(publicUrl, video.id)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
                        aria-label={`Copy link for ${video.title}`}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{copiedId === video.id ? "Copied!" : "Copy Link"}</span>
                      </button>

                      {/* Open Video */}
                      <a
                        href={publicPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                        aria-label={`Open public link for ${video.title}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Open</span>
                      </a>

                      {/* Delete Flow with confirmation */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-900/60 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(video)}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center min-h-[38px] px-3 text-xs font-semibold text-red-200 hover:text-white bg-red-900/80 rounded transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center min-h-[38px] px-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(video.id)}
                          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-2 text-xs text-zinc-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer"
                          aria-label={`Delete video ${video.title}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Delete {video.title}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
