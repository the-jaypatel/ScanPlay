import {
  executeCompressionPipeline,
  isWebCodecsSupported,
  isSupportedContainer,
  isAacAudioCodec,
  formatBytes,
  HARD_UPLOAD_LIMIT_BYTES,
  COMPRESSION_TIERS,
} from "./videoCompressionCore";

import {
  compressVideoInWorker,
  isWorkerCompressionSupported,
} from "./videoCompressionClient";

import type {
  CompressionTier,
  TierConfig,
  CompressionProgress,
  CompressionResult,
  CompressionOptions,
  PipelineResult,
} from "@/types/videoCompression";

export type {
  CompressionTier,
  TierConfig,
  CompressionProgress,
  CompressionResult,
  CompressionOptions,
  PipelineResult,
};

export {
  HARD_UPLOAD_LIMIT_BYTES,
  COMPRESSION_TIERS,
  isWebCodecsSupported,
  isWorkerCompressionSupported,
  isSupportedContainer,
  isAacAudioCodec,
  formatBytes,
  compressVideoInWorker,
};

/**
 * Direct main-thread compression fallback when Web Workers are unavailable.
 */
export async function compressVideoDirect(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const pipelineResult = await executeCompressionPipeline(file, options);
  const compressedBlob = new Blob([pipelineResult.buffer], { type: "video/mp4" });
  const compressedFile = new File([compressedBlob], pipelineResult.fileName, {
    type: "video/mp4",
    lastModified: Date.now(),
  });

  return {
    compressedFile,
    originalSize: pipelineResult.originalSize,
    compressedSize: pipelineResult.compressedSize,
    reductionPercentage: pipelineResult.reductionPercentage,
    savedBytes: pipelineResult.savedBytes,
    durationSeconds: pipelineResult.durationSeconds,
    width: pipelineResult.width,
    height: pipelineResult.height,
    tierUsed: pipelineResult.tierUsed,
  };
}

/**
 * Compresses an oversized video file for ScanPlay.
 * Uses a Dedicated Web Worker to keep the UI completely responsive.
 * Falls back to main-thread processing if Web Workers are not supported.
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  if (isWorkerCompressionSupported()) {
    try {
      return await compressVideoInWorker(file, options);
    } catch (err) {
      // If the compression was cancelled by the user, rethrow immediately
      if (
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error &&
          (err.name === "AbortError" || err.message.toLowerCase().includes("cancel")))
      ) {
        throw err;
      }

      // If it is an explicit container format or unsupported audio codec error,
      // it would fail identically on the main thread, so rethrow immediately.
      if (
        err instanceof Error &&
        (err.message.includes("Browser-side compression currently supports MP4 and MOV") ||
          err.message.includes("is not supported for in-browser compression"))
      ) {
        throw err;
      }

      console.warn(
        "[ScanPlay Compressor] Dedicated Web Worker execution encountered an error; falling back to direct main-thread compression:",
        err
      );
      return await compressVideoDirect(file, options);
    }
  }

  return await compressVideoDirect(file, options);
}
