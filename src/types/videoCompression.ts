import {
  CompressionTier,
  TierConfig,
  CompressionProgress,
  CompressionOptions,
  PipelineResult,
} from "@/lib/videoCompressionCore";

export type {
  CompressionTier,
  TierConfig,
  CompressionProgress,
  CompressionOptions,
  PipelineResult,
};

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  savedBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  tierUsed: CompressionTier;
}

// ==========================================
// Worker Message Protocol Types
// ==========================================

export interface WorkerStartMessage {
  type: "start";
  file: File;
  tier?: CompressionTier;
  targetMaxSizeBytes?: number;
}

export interface WorkerCancelMessage {
  type: "cancel";
}

export type MainToWorkerMessage = WorkerStartMessage | WorkerCancelMessage;

export interface WorkerProgressMessage {
  type: "progress";
  progress: CompressionProgress;
}

export interface WorkerSuccessMessage {
  type: "success";
  result: Omit<PipelineResult, "buffer">;
  buffer: ArrayBuffer;
}

export interface WorkerErrorMessage {
  type: "error";
  error: {
    name: string;
    message: string;
  };
}

export type WorkerToMainMessage =
  | WorkerProgressMessage
  | WorkerSuccessMessage
  | WorkerErrorMessage;
