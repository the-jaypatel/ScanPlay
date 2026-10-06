/// <reference lib="webworker" />
import { executeCompressionPipeline } from "@/lib/videoCompressionCore";
import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
} from "@/types/videoCompression";

let currentAbortController: AbortController | null = null;

self.onmessage = async (e: MessageEvent<MainToWorkerMessage>) => {
  const data = e.data;
  if (!data) return;

  if (data.type === "cancel") {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    return;
  }

  if (data.type === "start") {
    const { file, tier, targetMaxSizeBytes } = data;
    const controller = new AbortController();
    currentAbortController = controller;

    try {
      const pipelineResult = await executeCompressionPipeline(file, {
        tier,
        targetMaxSizeBytes,
        signal: controller.signal,
        onProgress: (progress) => {
          const msg: WorkerToMainMessage = {
            type: "progress",
            progress,
          };
          self.postMessage(msg);
        },
      });

      const { buffer, ...metadata } = pipelineResult;
      const successMsg: WorkerToMainMessage = {
        type: "success",
        result: metadata,
        buffer,
      };

      // Zero-copy transfer of output ArrayBuffer to main thread
      self.postMessage(successMsg, [buffer]);
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : "Error";
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during compression.";

      const errorMsg: WorkerToMainMessage = {
        type: "error",
        error: { name, message },
      };
      self.postMessage(errorMsg);
    } finally {
      currentAbortController = null;
    }
  }
};
