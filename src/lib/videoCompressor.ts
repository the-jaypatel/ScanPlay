import * as MP4Box from "mp4box";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

export type CompressionTier = "standard" | "strong" | "maximum";

export interface CompressionProgress {
  percent: number; // 0 to 100
  stage: "analyzing" | "encoding" | "finalizing";
  stageText: string;
  encodedFrames?: number;
  totalFrames?: number;
}

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

export interface CompressionOptions {
  tier?: CompressionTier;
  targetMaxSizeBytes?: number; // Defaults to 44 MB (safe buffer under 50 MB hard limit)
  onProgress?: (progress: CompressionProgress) => void;
  signal?: AbortSignal;
}

const DEFAULT_TARGET_MAX_BYTES = 44 * 1024 * 1024; // 44 MB
export const HARD_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Checks if the current browser environment supports the required WebCodecs APIs.
 */
export function isWebCodecsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "VideoEncoder" in window &&
    "VideoDecoder" in window &&
    "EncodedVideoChunk" in window &&
    "VideoFrame" in window
  );
}

/**
 * Checks whether the file extension/type is supported for client-side MP4Box demuxing.
 */
export function isSupportedContainer(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".m4v") ||
    file.type === "video/mp4" ||
    file.type === "video/quicktime" ||
    file.type === "video/x-m4v"
  );
}

/**
 * Formats byte values into clean, human-readable strings (e.g. 78.4 MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(decimals)} MB`;
}

/**
 * Calculates target dimensions preserving aspect ratio, ensuring even dimensions for H.264.
 */
function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (srcWidth > maxW || srcHeight > maxH) {
    const scale = Math.min(maxW / srcWidth, maxH / srcHeight);
    targetWidth = Math.round((srcWidth * scale) / 2) * 2;
    targetHeight = Math.round((srcHeight * scale) / 2) * 2;
  } else {
    targetWidth = Math.round(srcWidth / 2) * 2;
    targetHeight = Math.round(srcHeight / 2) * 2;
  }

  // Ensure minimum valid dimensions
  targetWidth = Math.max(16, targetWidth);
  targetHeight = Math.max(16, targetHeight);

  return { width: targetWidth, height: targetHeight };
}

interface MP4BoxEntryBox {
  write: (stream: MP4Box.DataStream) => void;
}

interface MP4BoxStsdEntry {
  avcC?: MP4BoxEntryBox;
  hvcC?: MP4BoxEntryBox;
}

interface MP4BoxTrackInternal {
  mdia?: {
    minf?: {
      stbl?: {
        stsd?: {
          entries?: MP4BoxStsdEntry[];
        };
      };
    };
  };
}

/**
 * Extracts the AVC or HEVC decoder configuration record (avcC / hvcC) from MP4Box metadata.
 */
function getDecoderDescription(
  mp4boxFile: MP4Box.MP4BoxFile,
  trackId: number
): Uint8Array | undefined {
  try {
    const trak = mp4boxFile.getTrackById(trackId) as MP4BoxTrackInternal | undefined;
    if (!trak?.mdia?.minf?.stbl?.stsd?.entries) return undefined;

    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC;
      if (box) {
        const stream = new MP4Box.DataStream(
          undefined,
          0,
          MP4Box.DataStream.BIG_ENDIAN
        );
        box.write(stream);
        // Remove 8-byte box header (4 bytes length + 4 bytes box type)
        const length = stream.position - 8;
        if (length <= 0) return undefined;
        // Make an independent copy with exact length
        return new Uint8Array(new Uint8Array(stream.buffer, 8, length));
      }
    }
  } catch (err) {
    console.warn("Failed to extract decoder description from MP4Box track:", err);
  }
  return undefined;
}

/**
 * Safely retrieves sample data, either from pre-loaded sample buffer
 * or by slicing the source File at the sample offset.
 */
async function getSampleBytes(
  sample: MP4Box.MP4Sample,
  file: File
): Promise<Uint8Array> {
  if (typeof sample.offset === "number" && typeof sample.size === "number") {
    const slice = file.slice(sample.offset, sample.offset + sample.size);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  }
  if (sample.data && sample.data.length > 0) {
    return sample.data;
  }
  throw new Error("Unable to locate sample data in file.");
}

/**
 * Compresses an oversized video file in the browser using WebCodecs and MP4Box.
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    tier = "standard",
    targetMaxSizeBytes = DEFAULT_TARGET_MAX_BYTES,
    onProgress,
    signal,
  } = options;

  if (signal?.aborted) {
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  if (!isWebCodecsSupported()) {
    throw new Error(
      "Your browser does not support WebCodecs video compression. Please use Chrome, Edge, or a modern Safari browser, or compress the video before uploading."
    );
  }

  if (!isSupportedContainer(file)) {
    throw new Error(
      "Browser-side compression currently supports MP4 and MOV files. For WebM or MKV files over 50 MB, please convert to MP4 or compress them before uploading."
    );
  }

  onProgress?.({
    percent: 2,
    stage: "analyzing",
    stageText: "Analyzing video stream and metadata...",
  });

  // Step 1: Initialize MP4Box demuxer
  const mp4boxFile = MP4Box.createFile();

  const fileInfoPromise = new Promise<{
    info: MP4Box.MP4Info;
    videoTrack: MP4Box.MP4Track;
    audioTrack: MP4Box.MP4Track | null;
  }>((resolve, reject) => {
    let settled = false;

    mp4boxFile.onError = (e) => {
      if (!settled) {
        settled = true;
        reject(new Error(`Failed to parse MP4 video container: ${String(e)}`));
      }
    };

    mp4boxFile.onReady = (info: MP4Box.MP4Info) => {
      if (settled) return;
      settled = true;

      const videoTrack = info.videoTracks[0];
      if (!videoTrack) {
        reject(new Error("No valid video track found in the selected file."));
        return;
      }

      // Find primary AAC audio track if available
      const audioTrack =
        info.audioTracks.find(
          (t) => t.codec && t.codec.toLowerCase().startsWith("mp4a")
        ) ||
        info.audioTracks[0] ||
        null;

      resolve({ info, videoTrack, audioTrack });
    };
  });

  // Step 2: Feed file buffers to MP4Box in 2 MB chunks for low memory overhead
  const CHUNK_SIZE = 2 * 1024 * 1024;
  let offset = 0;

  const readPromise = (async () => {
    while (offset < file.size) {
      if (signal?.aborted) {
        throw new DOMException("Compression cancelled by user", "AbortError");
      }

      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const slice = file.slice(offset, end);
      const arrayBuffer = await slice.arrayBuffer();

      (arrayBuffer as ArrayBuffer & { fileStart: number }).fileStart = offset;
      mp4boxFile.appendBuffer(arrayBuffer as ArrayBuffer & { fileStart: number });
      offset = end;
    }
    mp4boxFile.flush();
  })();

  // Wait for metadata ready
  const { info, videoTrack, audioTrack } = await Promise.race([
    fileInfoPromise,
    readPromise.then(() => fileInfoPromise),
  ]);

  if (signal?.aborted) {
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  // Duration in seconds
  const durationSec = Math.max(
    1,
    (info.duration || videoTrack.duration) / (info.timescale || videoTrack.timescale || 1000)
  );

  const srcWidth = videoTrack.track_width || videoTrack.video?.width || 1920;
  const srcHeight = videoTrack.track_height || videoTrack.video?.height || 1080;

  // Step 3: Determine compression parameters by tier
  let maxW = 1920;
  let maxH = 1080;
  let bitrateFactor = 1.0;
  let targetBytes = targetMaxSizeBytes;

  if (tier === "strong") {
    maxW = 1280;
    maxH = 720;
    bitrateFactor = 0.72;
    targetBytes = Math.min(targetMaxSizeBytes, 38 * 1024 * 1024);
  } else if (tier === "maximum") {
    maxW = 854;
    maxH = 480;
    bitrateFactor = 0.5;
    targetBytes = Math.min(targetMaxSizeBytes, 32 * 1024 * 1024);
  }

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    srcWidth,
    srcHeight,
    maxW,
    maxH
  );

  // Bitrate calculation
  const audioRateBps = audioTrack ? 128_000 : 0;
  const totalAudioBits = audioRateBps * durationSec;
  const totalBudgetBits = targetBytes * 8;
  const availableVideoBits = Math.max(totalBudgetBits - totalAudioBits, totalBudgetBits * 0.75);

  let targetBitrate = Math.floor((availableVideoBits / durationSec) * bitrateFactor);
  // Clamp target bitrate to reasonable bounds
  targetBitrate = Math.max(250_000, Math.min(targetBitrate, 5_500_000));

  // Step 4: Configure WebCodecs VideoEncoder
  // Test support for standard H.264 Main Profile
  let selectedCodec = "avc1.4d002a"; // H.264 Main Profile
  try {
    const supported = await VideoEncoder.isConfigSupported({
      codec: selectedCodec,
      width: targetWidth,
      height: targetHeight,
      bitrate: targetBitrate,
    });
    if (!supported.supported) {
      selectedCodec = "avc1.42001f"; // Fallback to Baseline Profile
    }
  } catch {
    selectedCodec = "avc1.42001f";
  }

  // Setup MP4 Muxer with ArrayBuffer target
  const muxerTarget = new ArrayBufferTarget();
  const hasAacAudio = Boolean(audioTrack && audioTrack.audio);

  const muxer = new Muxer({
    target: muxerTarget,
    video: {
      codec: "avc",
      width: targetWidth,
      height: targetHeight,
    },
    audio: hasAacAudio
      ? {
          codec: "aac",
          numberOfChannels: audioTrack!.audio!.channel_count || 2,
          sampleRate: audioTrack!.audio!.sample_rate || 44100,
        }
      : undefined,
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  // Prepare scaling canvas if resolution is changed
  const needsRescale = targetWidth !== srcWidth || targetHeight !== srcHeight;
  let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;

  if (needsRescale) {
    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(targetWidth, targetHeight);
      ctx = canvas.getContext("2d");
    } else if (typeof document !== "undefined") {
      const el = document.createElement("canvas");
      el.width = targetWidth;
      el.height = targetHeight;
      canvas = el;
      ctx = el.getContext("2d");
    }
  }

  let totalVideoFrames = videoTrack.nb_samples || 0;
  let encodedFrames = 0;
  let hasInjectedDecoderConfig = false;

  // Video Encoder initialization
  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      // Defensive copy and normalize metadata to prevent null colorSpace errors in muxer
      const safeMeta: EncodedVideoChunkMetadata = { ...(meta ?? {}) };

      if (!hasInjectedDecoderConfig || safeMeta.decoderConfig) {
        hasInjectedDecoderConfig = true;

        const existingConfig = safeMeta.decoderConfig;
        const existingColorSpace = existingConfig?.colorSpace;

        // Provide valid standard BT.709 SDR fallback if colorSpace is missing or incomplete
        const safeColorSpace: VideoColorSpaceInit = {
          primaries: existingColorSpace?.primaries ?? "bt709",
          transfer: existingColorSpace?.transfer ?? "bt709",
          matrix: existingColorSpace?.matrix ?? "bt709",
          fullRange: Boolean(existingColorSpace?.fullRange),
        };

        safeMeta.decoderConfig = {
          codec: selectedCodec,
          ...existingConfig,
          colorSpace: safeColorSpace,
        };
      }

      muxer.addVideoChunk(chunk, safeMeta);
      encodedFrames++;
      if (totalVideoFrames > 0) {
        const percent = Math.min(
          96,
          Math.max(5, Math.round((encodedFrames / totalVideoFrames) * 94))
        );
        onProgress?.({
          percent,
          stage: "encoding",
          stageText: `Compressing video frames (${percent}%)...`,
          encodedFrames,
          totalFrames: totalVideoFrames,
        });
      }
    },
    error: (err) => {
      encoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  videoEncoder.configure({
    codec: selectedCodec,
    width: targetWidth,
    height: targetHeight,
    bitrate: targetBitrate,
    framerate: 30,
    avc: { format: "avc" },
  });

  // Video Decoder initialization
  let decoderError: Error | null = null;
  const videoDecoder = new VideoDecoder({
    output: async (videoFrame: VideoFrame) => {
      try {
        if (signal?.aborted) {
          videoFrame.close();
          return;
        }

        // Diagnostic log on first decoded frame
        if (encodedFrames === 0) {
          const cs = videoFrame.colorSpace ?? null;
          console.log("[ScanPlay Compressor] First decoded frame:", {
            codedWidth: videoFrame.codedWidth,
            codedHeight: videoFrame.codedHeight,
            hasColorSpace: Boolean(cs),
            colorSpace: cs
              ? {
                  primaries: cs.primaries,
                  transfer: cs.transfer,
                  matrix: cs.matrix,
                  fullRange: cs.fullRange,
                }
              : null,
          });
        }

        // Apply backpressure if encoder queue is backed up
        while (videoEncoder.encodeQueueSize > 10) {
          if (signal?.aborted) break;
          await new Promise<void>((r) => {
            videoEncoder.ondequeue = () => r();
          });
        }

        const isKeyFrame = encodedFrames % 60 === 0;

        if (needsRescale && ctx && canvas) {
          ctx.drawImage(videoFrame, 0, 0, targetWidth, targetHeight);
          const scaledFrame = new VideoFrame(canvas as CanvasImageSource, {
            timestamp: videoFrame.timestamp,
            duration: videoFrame.duration ?? undefined,
          });
          videoEncoder.encode(scaledFrame, { keyFrame: isKeyFrame });
          scaledFrame.close();
        } else {
          videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
        }
      } finally {
        videoFrame.close();
      }
    },
    error: (err) => {
      console.error("[ScanPlay Compressor] VideoDecoder error event:", err);
      decoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  // Decoder description extracted from MP4Box
  const decoderDescription = getDecoderDescription(mp4boxFile, videoTrack.id);
  const decoderConfig: VideoDecoderConfig = {
    codec: videoTrack.codec,
    codedWidth: srcWidth,
    codedHeight: srcHeight,
    description: decoderDescription,
  };

  const supportCheck = await VideoDecoder.isConfigSupported(decoderConfig);
  if (!supportCheck.supported) {
    throw new Error(
      `Your browser's hardware video decoder does not support this video's codec (${videoTrack.codec}). Please compress or convert it prior to uploading.`
    );
  }
  videoDecoder.configure(decoderConfig);

  // Step 5: Extract samples via MP4Box
  const videoSamples: MP4Box.MP4Sample[] = [];
  const audioSamples: MP4Box.MP4Sample[] = [];

  mp4boxFile.setExtractionOptions(videoTrack.id, null, { nbSamples: 1000 });
  if (hasAacAudio && audioTrack) {
    mp4boxFile.setExtractionOptions(audioTrack.id, null, { nbSamples: 1000 });
  }

  mp4boxFile.onSamples = (trackId, _ref, samples) => {
    if (trackId === videoTrack.id) {
      videoSamples.push(...samples);
    } else if (audioTrack && trackId === audioTrack.id) {
      audioSamples.push(...samples);
    }
  };

  mp4boxFile.start();
  await readPromise;

  if (signal?.aborted) {
    videoDecoder.close();
    videoEncoder.close();
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  // Obtain all samples: either from onSamples callback or from mp4box trak.samples table
  const vTrak = mp4boxFile.getTrackById(videoTrack.id) as { samples?: MP4Box.MP4Sample[] } | undefined;
  const rawVideoSamples: MP4Box.MP4Sample[] =
    vTrak?.samples && vTrak.samples.length > 0 ? vTrak.samples : videoSamples;

  if (rawVideoSamples.length === 0) {
    throw new Error("No video samples could be found in the video file.");
  }

  totalVideoFrames = rawVideoSamples.length;

  const aTrak =
    hasAacAudio && audioTrack
      ? (mp4boxFile.getTrackById(audioTrack.id) as { samples?: MP4Box.MP4Sample[] } | undefined)
      : undefined;
  const rawAudioSamples: MP4Box.MP4Sample[] =
    aTrak?.samples && aTrak.samples.length > 0 ? aTrak.samples : audioSamples;

  console.log("[ScanPlay Compressor] Transcoding plan:", {
    sourceCodec: videoTrack.codec,
    srcDimensions: `${srcWidth}x${srcHeight}`,
    targetDimensions: `${targetWidth}x${targetHeight}`,
    targetBitrate: `${(targetBitrate / 1_000_000).toFixed(2)} Mbps`,
    durationSec: durationSec.toFixed(1),
    totalVideoSamples: rawVideoSamples.length,
    totalAudioSamples: rawAudioSamples.length,
    tier,
  });

  onProgress?.({
    percent: 8,
    stage: "encoding",
    stageText: "Transcoding frames with hardware acceleration...",
  });

  // Pass-through AAC audio samples directly to muxer
  if (hasAacAudio && audioTrack && rawAudioSamples.length > 0) {
    for (const sample of rawAudioSamples) {
      if (signal?.aborted) break;
      const data = await getSampleBytes(sample, file);
      const audioChunk = new EncodedAudioChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: Math.round((sample.cts * 1_000_000) / (audioTrack.timescale || 1)),
        duration: Math.round((sample.duration * 1_000_000) / (audioTrack.timescale || 1)),
        data,
      });
      muxer.addAudioChunk(audioChunk);
    }
  }

  // Feed video samples into VideoDecoder
  for (let i = 0; i < rawVideoSamples.length; i++) {
    const sample = rawVideoSamples[i];
    if (signal?.aborted) break;
    if (decoderError) throw decoderError;
    if (encoderError) throw encoderError;

    // Apply backpressure if decoder queue has more than 30 frames
    while (videoDecoder.decodeQueueSize > 30) {
      if (signal?.aborted) break;
      await new Promise<void>((r) => {
        videoDecoder.ondequeue = () => r();
      });
    }

    const data = await getSampleBytes(sample, file);

    const videoChunk = new EncodedVideoChunk({
      type: sample.is_sync ? "key" : "delta",
      timestamp: Math.round((sample.cts * 1_000_000) / (videoTrack.timescale || 1)),
      duration: Math.round((sample.duration * 1_000_000) / (videoTrack.timescale || 1)),
      data,
    });

    try {
      videoDecoder.decode(videoChunk);
    } catch (decodeErr) {
      console.error(`[ScanPlay Compressor] Synchronous decode exception at sample ${i}:`, decodeErr);
      throw decodeErr;
    }
  }

  if (signal?.aborted) {
    videoDecoder.close();
    videoEncoder.close();
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  // Flush decoder and encoder
  await videoDecoder.flush();
  videoDecoder.close();

  if (encoderError) throw encoderError;

  await videoEncoder.flush();
  videoEncoder.close();

  if (encodedFrames === 0) {
    throw new Error(
      "No video frames were successfully encoded. The video could not be decoded or processed on this device."
    );
  }

  onProgress?.({
    percent: 98,
    stage: "finalizing",
    stageText: "Finalizing MP4 container and metadata...",
  });

  muxer.finalize();

  const compressedBuffer = muxerTarget.buffer;
  const compressedSize = compressedBuffer.byteLength;
  const originalSize = file.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const reductionPercentage = Math.max(
    0,
    parseFloat(((savedBytes / originalSize) * 100).toFixed(1))
  );

  // Generate clean name for output file
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const compressedFileName = `${baseName}_compressed.mp4`;

  const compressedBlob = new Blob([compressedBuffer], { type: "video/mp4" });
  const compressedFile = new File([compressedBlob], compressedFileName, {
    type: "video/mp4",
    lastModified: Date.now(),
  });

  onProgress?.({
    percent: 100,
    stage: "finalizing",
    stageText: "Compression complete!",
  });

  return {
    compressedFile,
    originalSize,
    compressedSize,
    reductionPercentage,
    savedBytes,
    durationSeconds: durationSec,
    width: targetWidth,
    height: targetHeight,
    tierUsed: tier,
  };
}
