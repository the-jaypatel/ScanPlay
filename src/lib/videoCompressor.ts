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
      // If the worker threw an AbortError or a legitimate pipeline error (unsupported audio, invalid container, etc.), rethrow immediately!
      // Only fall back to direct execution if the Web Worker failed to instantiate.
      if (
        err instanceof Error &&
        (err.name === "AbortError" ||
          !err.message.includes("Failed to instantiate compression Web Worker"))
      ) {
        throw err;
      }
      console.warn(
        "Worker compression failed to instantiate, falling back to main-thread compression:",
        err
      );
      return await compressVideoDirect(file, options);
    }
  }

  return await compressVideoDirect(file, options);
}
