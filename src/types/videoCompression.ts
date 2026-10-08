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

export interface CompressionDiagnostic {
  stage: string;
  runtime: "worker" | "main-thread" | "unknown";
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  videoCodec?: string;
  audioCodec?: string;
  srcWidth?: number;
  srcHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
  duration?: number;
  rotation?: number;
  userAgent?: string;
  decoderConfigSupported?: boolean;
  encoderConfigSupported?: boolean;
  selectedEncoderCodec?: string;
  canvasType?: string;
  framesDecoded?: number;
  framesEncoded?: number;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  errorCause?: string;
  logs: string[];
}

export interface WorkerErrorMessage {
  type: "error";
  error: {
    name: string;
    message: string;
    stack?: string;
    diagnostic?: CompressionDiagnostic;
  };
}

export type WorkerToMainMessage =
  | WorkerProgressMessage
  | WorkerSuccessMessage
  | WorkerErrorMessage;
