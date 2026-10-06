import type {
  CompressionOptions,
  CompressionResult,
  MainToWorkerMessage,
  WorkerToMainMessage,
} from "@/types/videoCompression";

/**
 * Checks whether Web Worker compression is supported in the current browser.
 */
export function isWorkerCompressionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof Worker !== "undefined" && "VideoEncoder" in window && "VideoDecoder" in window;
}

/**
 * Compresses an oversized video file inside a Dedicated Web Worker off the main thread.
 */
export function compressVideoInWorker(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const { tier = "basic", targetMaxSizeBytes, onProgress, signal } = options;

  if (signal?.aborted) {
    return Promise.reject(new DOMException("Compression cancelled by user", "AbortError"));
  }

  return new Promise<CompressionResult>((resolve, reject) => {
    let worker: Worker | null = null;
    let isSettled = false;

    const cleanup = () => {
      if (worker) {
        try {
          worker.terminate();
        } catch {}
        worker = null;
      }
      if (signal) {
        signal.removeEventListener("abort", handleAbort);
      }
    };

    const handleAbort = () => {
      if (isSettled) return;
      isSettled = true;
      if (worker) {
        try {
          const cancelMsg: MainToWorkerMessage = { type: "cancel" };
          worker.postMessage(cancelMsg);
        } catch {}
      }
      setTimeout(() => cleanup(), 50);
      reject(new DOMException("Compression cancelled by user", "AbortError"));
    };

    try {
      worker = new Worker(
        new URL("../workers/videoCompression.worker.ts", import.meta.url),
        { type: "module" }
      );
    } catch (err) {
      cleanup();
      return reject(
        new Error(
          `Failed to instantiate compression Web Worker: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }

    if (signal) {
      signal.addEventListener("abort", handleAbort);
    }

    worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
      const data = e.data;
      if (!data) return;

      if (data.type === "progress") {
        onProgress?.(data.progress);
        return;
      }

      if (data.type === "success") {
        if (isSettled) return;
        isSettled = true;

        const { result, buffer } = data;
        const compressedBlob = new Blob([buffer], { type: "video/mp4" });
        const compressedFile = new File([compressedBlob], result.fileName, {
          type: "video/mp4",
          lastModified: Date.now(),
        });

        const finalResult: CompressionResult = {
          compressedFile,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          reductionPercentage: result.reductionPercentage,
          savedBytes: result.savedBytes,
          durationSeconds: result.durationSeconds,
          width: result.width,
          height: result.height,
          tierUsed: result.tierUsed,
        };

        cleanup();
        resolve(finalResult);
        return;
      }

      if (data.type === "error") {
        if (isSettled) return;
        isSettled = true;

        cleanup();
        if (data.error.name === "AbortError" || data.error.message.includes("cancelled")) {
          reject(new DOMException("Compression cancelled by user", "AbortError"));
        } else {
          const err = new Error(data.error.message);
          err.name = data.error.name;
          reject(err);
        }
        return;
      }
    };

    worker.onerror = (err) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(new Error(`Worker encountered an unhandled error: ${err.message || "Unknown error"}`));
    };

    const startMsg: MainToWorkerMessage = {
      type: "start",
      file,
      tier,
      targetMaxSizeBytes,
    };
    worker.postMessage(startMsg);
  });
}
