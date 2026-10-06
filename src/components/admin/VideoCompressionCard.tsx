"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Zap,
  CheckCircle2,
  Loader2,
  XCircle,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import {
  compressVideo,
  formatBytes,
  isWebCodecsSupported,
  isSupportedContainer,
  CompressionProgress,
  CompressionResult,
  CompressionTier,
  COMPRESSION_TIERS,
  HARD_UPLOAD_LIMIT_BYTES,
} from "@/lib/videoCompressor";

export type CompressionCardState =
  | "idle"
  | "compressing"
  | "success"
  | "still_oversized"
  | "error";

interface VideoCompressionCardProps {
  originalFile: File;
  onUseCompressedFile: (file: File) => void;
  onCancelOrChangeFile: () => void;
}

export function VideoCompressionCard({
  originalFile,
  onUseCompressedFile,
  onCancelOrChangeFile,
}: VideoCompressionCardProps) {
  const [state, setState] = useState<CompressionCardState>("idle");
  const [currentTier, setCurrentTier] = useState<CompressionTier>("basic");
  const [progress, setProgress] = useState<CompressionProgress>({
    percent: 0,
    stage: "analyzing",
    stageText: "Preparing compression...",
  });
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const webCodecsSupported = isWebCodecsSupported();
  const containerSupported = isSupportedContainer(originalFile);

  // Clean up any in-flight compression if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartCompression = async (tier: CompressionTier) => {
    setCurrentTier(tier);
    setState("compressing");
    setErrorMessage(null);
    setProgress({
      percent: 2,
      stage: "analyzing",
      stageText: "Initializing hardware encoder...",
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await compressVideo(originalFile, {
        tier,
        signal: controller.signal,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      setResult(res);

      if (res.compressedSize <= HARD_UPLOAD_LIMIT_BYTES) {
        setState("success");
      } else {
        setState("still_oversized");
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setState("idle");
        return;
      }
      console.error("Compression error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during compression.";
      setErrorMessage(msg);
      setState("error");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelCompression = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState("idle");
    setProgress({
      percent: 0,
      stage: "analyzing",
      stageText: "Compression cancelled.",
    });
  };

  // Unsupported Browser State
  if (!webCodecsSupported) {
    return (
      <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5 sm:p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-white tracking-tight uppercase">
              Browser Compression Unavailable
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Your current browser does not support built-in WebCodecs video compression.
              ScanPlay requires video files to be <strong>50 MB or smaller</strong>.
            </p>
            <p className="text-xs text-zinc-400">
              To upload this <strong>{formatBytes(originalFile.size)}</strong> video, please use{" "}
              <strong>Google Chrome, Microsoft Edge, or a modern Safari browser</strong>, or
              compress the video file using an offline tool before uploading.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancelOrChangeFile}
                className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
              >
                Choose Different Video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unsupported Container State (e.g. WebM/MKV over 50MB)
  if (!containerSupported) {
    return (
      <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5 sm:p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold text-white tracking-tight uppercase">
              Unsupported Container for In-Browser Compression
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              ScanPlay&apos;s in-browser compression currently supports <strong>MP4 and MOV</strong> containers.
              Your file <code>{originalFile.name}</code> ({formatBytes(originalFile.size)}) cannot be compressed locally.
            </p>
            <p className="text-xs text-zinc-400">
              Please convert this video to an MP4 or compress it below 50 MB before uploading.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancelOrChangeFile}
                className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
              >
                Choose Different Video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 1: IDLE (Oversized Video Detected, Ready to Compress)
  if (state === "idle") {
    return (
      <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5 sm:p-7 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/40 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                <span>Video Exceeds 50 MB Limit</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight break-words mt-0.5">
                {originalFile.name}
              </h3>
              <p className="font-mono text-xs sm:text-sm text-amber-200/90 mt-0.5">
                File size: <strong>{formatBytes(originalFile.size)}</strong> &bull; Maximum upload size: <strong>50 MB</strong>
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              ScanPlay can compress this video directly in your browser to fit within the 50 MB limit.
              The original {formatBytes(originalFile.size)} file will <strong>not</strong> be uploaded to the server.
            </p>

            {/* Compression Tier Selector */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Compression Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(COMPRESSION_TIERS) as CompressionTier[]).map((tierKey) => {
                  const tierInfo = COMPRESSION_TIERS[tierKey];
                  const isSelected = currentTier === tierKey;
                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setCurrentTier(tierKey)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-400/80 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/50"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white">
                          {tierInfo.label}
                        </span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-300 mt-1 font-medium">
                        {tierInfo.description}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                        Up to {tierInfo.maxH}p
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleStartCompression(currentTier)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                <Zap className="h-4 w-4 fill-zinc-950" aria-hidden="true" />
                <span>Compress Video ({COMPRESSION_TIERS[currentTier].label})</span>
              </button>

              <button
                type="button"
                onClick={onCancelOrChangeFile}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Choose Different Video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: COMPRESSING (Active Progress)
  if (state === "compressing") {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 text-zinc-300 animate-spin" aria-hidden="true" />
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Compressing video locally...
                </h3>
                <span className="text-xs text-amber-400 font-mono">
                  {COMPRESSION_TIERS[currentTier].label} Tier &bull; {COMPRESSION_TIERS[currentTier].description} (up to {COMPRESSION_TIERS[currentTier].maxH}p)
                </span>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-zinc-200">
              {progress.percent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(3, progress.percent)}%` }}
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
            <p>{progress.stageText}</p>
            {progress.totalFrames && progress.encodedFrames ? (
              <p className="font-mono text-zinc-500">
                Frame {progress.encodedFrames} of {progress.totalFrames}
              </p>
            ) : null}
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleCancelCompression}
              className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel Compression
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: SUCCESS (Compressed file is <= 50 MB)
  if (state === "success" && result) {
    return (
      <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/25 p-6 sm:p-7 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Compression Complete &bull; {COMPRESSION_TIERS[result.tierUsed]?.label ?? "Basic"} Tier</span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">
              {result.compressedFile.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The compressed video meets ScanPlay&apos;s 50 MB limit and is ready to upload.
            </p>
          </div>

          {/* Size Comparison Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-emerald-900/40 bg-zinc-950/60 font-mono text-left">
            <div>
              <span className="block text-[10px] uppercase text-zinc-500">Original</span>
              <span className="text-sm font-semibold text-zinc-300">
                {formatBytes(result.originalSize)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-emerald-400">Compressed</span>
              <span className="text-sm font-semibold text-emerald-300">
                {formatBytes(result.compressedSize)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500">Saved</span>
              <span className="text-sm font-semibold text-zinc-200">
                {formatBytes(result.savedBytes)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-zinc-500">Reduction</span>
              <span className="text-sm font-semibold text-white">
                {result.reductionPercentage}%
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onUseCompressedFile(result.compressedFile)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              <span>Upload Compressed Video</span>
            </button>

            <button
              type="button"
              onClick={onCancelOrChangeFile}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: STILL OVERSIZED (Output is still > 50 MB)
  if (state === "still_oversized" && result) {
    const canTryMedium = currentTier === "basic";
    const canTryStrong = currentTier === "basic" || currentTier === "medium";

    return (
      <div className="rounded-2xl border border-amber-900/70 bg-amber-950/30 p-6 sm:p-7 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Video Still Exceeds 50 MB Limit</span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {COMPRESSION_TIERS[currentTier].label} compression did not reduce the file below 50 MB
            </h3>
            <p className="text-xs text-zinc-300 mt-1">
              Original: <strong>{formatBytes(result.originalSize)}</strong> &bull; Compressed:{" "}
              <strong className="text-amber-300">{formatBytes(result.compressedSize)}</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-900/50 bg-zinc-950/70 text-xs text-zinc-400">
            {canTryMedium ? (
              <p>
                Basic compression maintained maximum resolution. You can apply <strong>Medium compression (720p)</strong> or <strong>Strong compression (480p)</strong> to bring the file size under 50 MB.
              </p>
            ) : canTryStrong ? (
              <p>
                Medium compression was not enough. You can apply <strong>Strong compression (480p)</strong> to bring the file size under 50 MB.
              </p>
            ) : (
              <p>
                Strong compression (480p) was already applied, but this video is too long or complex to fit under 50 MB. Please compress or trim it offline before uploading.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {canTryMedium && (
              <button
                type="button"
                onClick={() => handleStartCompression("medium")}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Try Medium Compression (720p)</span>
              </button>
            )}

            {canTryStrong && (
              <button
                type="button"
                onClick={() => handleStartCompression("strong")}
                className={`inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl px-5 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 cursor-pointer ${
                  canTryMedium
                    ? "border border-amber-500/50 bg-zinc-900 text-amber-300 hover:bg-zinc-800 focus-visible:ring-amber-400"
                    : "bg-amber-400 hover:bg-amber-300 text-zinc-950 focus-visible:ring-amber-400"
                }`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Try Strong Compression (480p)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCancelOrChangeFile}
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              Choose Different Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 5: ERROR
  return (
    <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-6 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
      <div className="flex items-start gap-3.5">
        <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight uppercase">
              Compression Failed
            </h3>
            <p className="text-xs sm:text-sm text-red-200/90 mt-1">
              ScanPlay could not compress this video on this device. Your original file has not been uploaded.
            </p>
            {errorMessage && (
              <p className="font-mono text-xs text-zinc-400 mt-2 p-2 rounded bg-zinc-950/60 border border-zinc-800 break-words">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleStartCompression(currentTier)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={onCancelOrChangeFile}
              className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Choose Different Video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
