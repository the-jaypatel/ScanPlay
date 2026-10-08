import * as MP4Box from "mp4box";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

// Suppress benign QuickTime metadata boxes (e.g. ©swr, ©TIM) and Wave terminator boxes ('' / \0\0\0\0)
// which are valid QuickTime atoms but trigger false-positive warnings in MP4Box's 7-bit ASCII regex.
if (typeof MP4Box !== "undefined" && MP4Box.Log && typeof MP4Box.Log.error === "function") {
  const originalMp4BoxLogError = MP4Box.Log.error;
  MP4Box.Log.error = function (module: string, msg: string, isofile?: unknown) {
    if (module === "BoxParser" && typeof msg === "string" && msg.includes("Invalid box type:")) {
      if (
        msg.includes("©") ||
        msg.includes("\xa9") ||
        /Invalid box type:\s*'(?:\0|\s)*'/.test(msg)
      ) {
        MP4Box.Log.debug?.(module, msg);
        return;
      }
    }
    originalMp4BoxLogError.call(this, module, msg, isofile);
  };
}

export type CompressionTier = "basic" | "medium" | "strong";

export interface TierConfig {
  tier: CompressionTier;
  label: string;
  description: string;
  maxW: number;
  maxH: number;
  bitrateFactor: number;
  targetMaxSizeBytes: number;
  minBitrate: number;
  maxBitrate: number;
}

export const COMPRESSION_TIERS: Record<CompressionTier, TierConfig> = {
  basic: {
    tier: "basic",
    label: "Basic",
    description: "Best quality",
    maxW: 1920,
    maxH: 1080,
    bitrateFactor: 1.0,
    targetMaxSizeBytes: 44 * 1024 * 1024, // 44 MB buffer under 50 MB
    minBitrate: 250_000,
    maxBitrate: 5_500_000,
  },
  medium: {
    tier: "medium",
    label: "Medium",
    description: "Smaller file",
    maxW: 1280,
    maxH: 720,
    bitrateFactor: 0.72,
    targetMaxSizeBytes: 38 * 1024 * 1024, // 38 MB
    minBitrate: 200_000,
    maxBitrate: 3_200_000,
  },
  strong: {
    tier: "strong",
    label: "Strong",
    description: "Smallest file",
    maxW: 854,
    maxH: 480,
    bitrateFactor: 0.50,
    targetMaxSizeBytes: 30 * 1024 * 1024, // 30 MB
    minBitrate: 150_000,
    maxBitrate: 1_800_000,
  },
};

export interface CompressionProgress {
  percent: number; // 0 to 100
  stage: "analyzing" | "encoding" | "finalizing";
  stageText: string;
  encodedFrames?: number;
  totalFrames?: number;
}

export interface CompressionOptions {
  tier?: CompressionTier;
  targetMaxSizeBytes?: number;
  onProgress?: (progress: CompressionProgress) => void;
  signal?: AbortSignal;
}

export interface PipelineResult {
  buffer: ArrayBuffer;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  savedBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  tierUsed: CompressionTier;
}

export const HARD_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Checks if the current environment supports the required WebCodecs APIs.
 */
export function isWebCodecsSupported(): boolean {
  if (typeof self === "undefined") return false;
  return (
    "VideoEncoder" in self &&
    "VideoDecoder" in self &&
    "EncodedVideoChunk" in self &&
    "VideoFrame" in self
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
 * Determines whether a codec string represents a standard, compatible AAC audio track.
 */
export function isAacAudioCodec(codec: string | undefined): boolean {
  if (!codec) return false;
  const lower = codec.toLowerCase().trim();
  return lower.startsWith("mp4a");
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
export function calculateTargetDimensions(
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

/**
 * Extracts the video rotation in degrees (0, 90, 180, 270) from the MP4 track matrix.
 * iPhone portrait videos are physically recorded landscape and rotated 90 or 270 degrees via matrix.
 */
export function getTrackRotation(
  matrix?: number[] | Int32Array | null
): 0 | 90 | 180 | 270 {
  if (!matrix || matrix.length < 5) return 0;
  const a = matrix[0] / 65536;
  const b = matrix[1] / 65536;
  const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized === 90) return 90;
  if (normalized === 180) return 180;
  if (normalized === 270) return 270;
  return 0;
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
export function getDecoderDescription(
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
 * High-performance file reader that caches contiguous byte windows from the source File.
 */
export class BatchedFileReader {
  private file: File;
  private windowStart = -1;
  private windowEnd = -1;
  private windowBuffer: Uint8Array | null = null;
  private readonly defaultWindowSize: number;

  constructor(file: File, windowSize = 8 * 1024 * 1024) {
    this.file = file;
    this.defaultWindowSize = windowSize;
  }

  async getSampleBytes(sample: MP4Box.MP4Sample): Promise<Uint8Array> {
    if (
      sample.data &&
      sample.data.length > 0 &&
      (sample.alreadyRead === undefined || sample.alreadyRead === sample.size)
    ) {
      return sample.data;
    }

    const offset = sample.offset;
    const size = sample.size;

    if (typeof offset !== "number" || typeof size !== "number" || size <= 0) {
      throw new Error(`Invalid sample geometry: offset=${offset}, size=${size}`);
    }

    if (offset < 0 || offset + size > this.file.size) {
      throw new Error(
        `Sample offset [${offset}, ${offset + size}] exceeds file bounds (${this.file.size} bytes).`
      );
    }

    if (
      this.windowBuffer &&
      offset >= this.windowStart &&
      offset + size <= this.windowEnd
    ) {
      const relOffset = offset - this.windowStart;
      return this.windowBuffer.subarray(relOffset, relOffset + size);
    }

    const loadSize = Math.max(this.defaultWindowSize, size);
    const end = Math.min(offset + loadSize, this.file.size);
    const slice = this.file.slice(offset, end);
    const buffer = await slice.arrayBuffer();

    this.windowStart = offset;
    this.windowEnd = end;
    this.windowBuffer = new Uint8Array(buffer);

    return this.windowBuffer.subarray(0, size);
  }

  clear(): void {
    this.windowBuffer = null;
    this.windowStart = -1;
    this.windowEnd = -1;
  }
}

/**
 * Pure compression pipeline function. Runs identically on either Worker or Main thread.
 * Returns the raw ArrayBuffer target along with compression metrics.
 */
export async function executeCompressionPipeline(
  file: File,
  options: CompressionOptions = {}
): Promise<PipelineResult> {
  const {
    tier = "basic",
    targetMaxSizeBytes,
    onProgress,
    signal,
  } = options;

  if (signal?.aborted) {
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  if (!isWebCodecsSupported()) {
    throw new Error(
      "WebCodecs video compression is not supported in this environment. Please use Chrome, Edge, or a modern Safari browser, or compress the video before uploading."
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

  const fileReader = new BatchedFileReader(file);

  // Step 1: Initialize MP4Box demuxer
  const mp4boxFile = MP4Box.createFile();

  const extractedVideoSamples: MP4Box.MP4Sample[] = [];
  const extractedAudioSamples: MP4Box.MP4Sample[] = [];

  interface DemuxHeaderResult {
    info: MP4Box.MP4Info;
    videoTrack: MP4Box.MP4Track;
    audioTrack: MP4Box.MP4Track | null;
    hasSourceAudio: boolean;
    incompatibleAudioCodec: string | null;
  }

  const fileInfoPromise = new Promise<DemuxHeaderResult>((resolve, reject) => {
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

      const vTrack = info.videoTracks[0];
      if (!vTrack) {
        reject(new Error("No valid video track found in the selected file."));
        return;
      }

      let audioTrack: MP4Box.MP4Track | null = null;
      let incompatibleCodec: string | null = null;
      let hasAudio = false;

      if (info.audioTracks && info.audioTracks.length > 0) {
        hasAudio = true;
        const aacTrack = info.audioTracks.find(
          (t) =>
            isAacAudioCodec(t.codec) &&
            Boolean(t.audio && t.audio.channel_count > 0 && t.audio.sample_rate > 0)
        );

        if (aacTrack) {
          audioTrack = aacTrack;
        } else {
          incompatibleCodec = info.audioTracks[0].codec || "Unknown";
        }
      }

      // Also inspect otherTracks for non-standard QuickTime audio streams (e.g. LPCM, sowt, twos, apac)
      if (!hasAudio && info.otherTracks && info.otherTracks.length > 0) {
        for (const ot of info.otherTracks) {
          const trak = mp4boxFile.getTrackById(ot.id) as { mdia?: { hdlr?: { handler?: string } } } | undefined;
          const isAudioHandler = ot.type === "audio" || trak?.mdia?.hdlr?.handler === "soun";
          const otCodec = (ot.codec || "").toLowerCase();
          const isAudioCodec =
            otCodec.startsWith("lpcm") ||
            otCodec.startsWith("sowt") ||
            otCodec.startsWith("twos") ||
            otCodec.startsWith("in24") ||
            otCodec.startsWith("in32") ||
            otCodec.startsWith("alac") ||
            otCodec.startsWith("apac") ||
            otCodec.startsWith("ac-3") ||
            otCodec.startsWith("ec-3") ||
            otCodec.startsWith("dts");

          if (isAudioHandler || isAudioCodec) {
            hasAudio = true;
            incompatibleCodec = ot.codec || "LPCM";
            break;
          }
        }
      }

      mp4boxFile.setExtractionOptions(vTrack.id, null, { nbSamples: 1000 });
      if (audioTrack) {
        mp4boxFile.setExtractionOptions(audioTrack.id, null, { nbSamples: 1000 });
      }

      mp4boxFile.onSamples = (trackId, _ref, samples) => {
        if (trackId === vTrack.id) {
          extractedVideoSamples.push(...samples);
        } else if (audioTrack && trackId === audioTrack.id) {
          extractedAudioSamples.push(...samples);
        }
      };

      mp4boxFile.start();
      resolve({
        info,
        videoTrack: vTrack,
        audioTrack,
        hasSourceAudio: hasAudio,
        incompatibleAudioCodec: incompatibleCodec,
      });
    };
  });

  // Step 2: Feed file buffers to MP4Box in 2 MB chunks
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

  const { info, videoTrack, audioTrack, hasSourceAudio, incompatibleAudioCodec } =
    await Promise.race([
      fileInfoPromise,
      readPromise.then(() => fileInfoPromise),
    ]);

  if (signal?.aborted) {
    fileReader.clear();
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  if (incompatibleAudioCodec) {
    fileReader.clear();
    throw new Error(
      `This video contains "${incompatibleAudioCodec}" audio, which is not supported for in-browser compression. ScanPlay only supports standard AAC (mp4a) audio. Please re-encode the audio to AAC or compress the video offline before uploading.`
    );
  }

  await readPromise;

  if (signal?.aborted) {
    fileReader.clear();
    throw new DOMException("Compression cancelled by user", "AbortError");
  }

  const vTrak = mp4boxFile.getTrackById(videoTrack.id) as { samples?: MP4Box.MP4Sample[] } | undefined;
  const rawVideoSamples: MP4Box.MP4Sample[] =
    extractedVideoSamples.length > 0
      ? extractedVideoSamples
      : (vTrak?.samples && vTrak.samples.length > 0 ? vTrak.samples : []);

  if (rawVideoSamples.length === 0) {
    fileReader.clear();
    throw new Error("No video samples could be found in the video file.");
  }

  let rawAudioSamples: MP4Box.MP4Sample[] = [];
  if (hasSourceAudio && audioTrack) {
    const aTrak = mp4boxFile.getTrackById(audioTrack.id) as { samples?: MP4Box.MP4Sample[] } | undefined;
    rawAudioSamples =
      extractedAudioSamples.length > 0
        ? extractedAudioSamples
        : (aTrak?.samples && aTrak.samples.length > 0 ? aTrak.samples : []);

    if (rawAudioSamples.length === 0) {
      fileReader.clear();
      throw new Error(
        "Audio stream extraction produced zero audio samples. ScanPlay cannot safely compress this video without losing audio. Your original file has not been uploaded."
      );
    }
  }

  const shouldIncludeAudio = Boolean(hasSourceAudio && audioTrack && rawAudioSamples.length > 0);

  const durationSec = Math.max(
    1,
    (info.duration || videoTrack.duration) / (info.timescale || videoTrack.timescale || 1000)
  );

  const srcWidth = videoTrack.track_width || videoTrack.video?.width || 1920;
  const srcHeight = videoTrack.track_height || videoTrack.video?.height || 1080;

  // Step 3: Determine compression parameters by tier
  const tierConfig = COMPRESSION_TIERS[tier] ?? COMPRESSION_TIERS.basic;
  const targetBytes = targetMaxSizeBytes ?? tierConfig.targetMaxSizeBytes;
  const { maxW, maxH, bitrateFactor, minBitrate, maxBitrate } = tierConfig;

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    srcWidth,
    srcHeight,
    maxW,
    maxH
  );

  const audioRateBps = shouldIncludeAudio ? 128_000 : 0;
  const totalAudioBits = audioRateBps * durationSec;
  const totalBudgetBits = targetBytes * 8;
  const availableVideoBits = Math.max(totalBudgetBits - totalAudioBits, totalBudgetBits * 0.75);

  let targetBitrate = Math.floor((availableVideoBits / durationSec) * bitrateFactor);
  targetBitrate = Math.max(minBitrate, Math.min(targetBitrate, maxBitrate));

  // Extract track rotation (for portrait/rotated iPhone videos)
  const trakInternal = mp4boxFile.getTrackById(videoTrack.id) as
    | (MP4BoxTrackInternal & { tkhd?: { matrix?: number[] | Int32Array }; samples?: MP4Box.MP4Sample[] })
    | undefined;
  const rawMatrix = videoTrack.matrix || trakInternal?.tkhd?.matrix;
  const rotation = getTrackRotation(rawMatrix);

  // Step 4: Configure WebCodecs VideoEncoder
  // Select an H.264 profile & level appropriate for the target resolution
  const maxDim = Math.max(targetWidth, targetHeight);
  const candidateCodecs: string[] = [];

  if (maxDim > 1280) {
    // 1080p+ requires H.264 Level 4.0 or above
    candidateCodecs.push(
      "avc1.4d002a", // Main Profile, Level 4.2
      "avc1.64002a", // High Profile, Level 4.2
      "avc1.4d0028", // Main Profile, Level 4.0
      "avc1.640028", // High Profile, Level 4.0
      "avc1.42002a", // Baseline Profile, Level 4.2
      "avc1.420028"  // Baseline Profile, Level 4.0
    );
  } else if (maxDim > 854) {
    // 720p requires H.264 Level 3.1 or above
    candidateCodecs.push(
      "avc1.4d001f", // Main Profile, Level 3.1
      "avc1.42001f", // Baseline Profile, Level 3.1
      "avc1.4d002a", // Main Profile, Level 4.2
      "avc1.640028"  // High Profile, Level 4.0
    );
  } else {
    // 480p requires H.264 Level 3.0 or above
    candidateCodecs.push(
      "avc1.4d001e", // Main Profile, Level 3.0
      "avc1.42001e", // Baseline Profile, Level 3.0
      "avc1.4d001f", // Main Profile, Level 3.1
      "avc1.42001f", // Baseline Profile, Level 3.1
      "avc1.4d002a"  // Main Profile, Level 4.2
    );
  }

  let selectedCodec = candidateCodecs[0];
  let hardwarePreference: HardwareAcceleration = "prefer-hardware";
  let encoderConfigFound = false;

  const accelPreferences: HardwareAcceleration[] = [
    "prefer-hardware",
    "no-preference",
    "prefer-software",
  ];

  for (const codec of candidateCodecs) {
    for (const accel of accelPreferences) {
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec,
          width: targetWidth,
          height: targetHeight,
          bitrate: targetBitrate,
          hardwareAcceleration: accel,
        });
        if (support.supported) {
          selectedCodec = codec;
          hardwarePreference = accel;
          encoderConfigFound = true;
          break;
        }
      } catch {}
    }
    if (encoderConfigFound) break;
  }

  const muxerTarget = new ArrayBufferTarget();

  const muxer = new Muxer({
    target: muxerTarget,
    video: {
      codec: "avc",
      width: targetWidth,
      height: targetHeight,
      rotation,
    },
    audio: shouldIncludeAudio
      ? {
          codec: "aac",
          numberOfChannels: audioTrack!.audio!.channel_count || 2,
          sampleRate: audioTrack!.audio!.sample_rate || 44100,
        }
      : undefined,
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  const is10BitOrHdr =
    videoTrack.codec.toLowerCase().includes("hvc1.2") ||
    videoTrack.codec.toLowerCase().includes("hev1.2");
  const needsRescale =
    targetWidth !== srcWidth || targetHeight !== srcHeight || is10BitOrHdr;
  let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;

  if (needsRescale) {
    if (typeof OffscreenCanvas !== "undefined") {
      try {
        const offCanvas = new OffscreenCanvas(targetWidth, targetHeight);
        const offCtx = offCanvas.getContext("2d");
        if (offCtx) {
          canvas = offCanvas;
          ctx = offCtx;
        }
      } catch {}
    }
    if (!ctx && typeof document !== "undefined") {
      const el = document.createElement("canvas");
      el.width = targetWidth;
      el.height = targetHeight;
      canvas = el;
      ctx = el.getContext("2d");
    }
  }

  const totalVideoFrames = rawVideoSamples.length;
  let encodedFrames = 0;
  let hasInjectedDecoderConfig = false;

  let lastProgressPercent = -1;
  let lastProgressTime = 0;

  // Video Encoder initialization
  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      const safeMeta: EncodedVideoChunkMetadata = { ...(meta ?? {}) };

      if (!hasInjectedDecoderConfig || safeMeta.decoderConfig) {
        hasInjectedDecoderConfig = true;

        const existingConfig = safeMeta.decoderConfig;
        const existingColorSpace = existingConfig?.colorSpace;

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
        const now = performance.now();
        if (
          percent !== lastProgressPercent ||
          now - lastProgressTime >= 180 ||
          encodedFrames === totalVideoFrames
        ) {
          lastProgressPercent = percent;
          lastProgressTime = now;
          onProgress?.({
            percent,
            stage: "encoding",
            stageText: `Compressing video frames (${percent}%)...`,
            encodedFrames,
            totalFrames: totalVideoFrames,
          });
        }
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
    hardwareAcceleration: hardwarePreference,
    avc: { format: "avc" },
  });

  let isCancelled = Boolean(signal?.aborted);
  const onAbort = () => {
    isCancelled = true;
  };
  signal?.addEventListener("abort", onAbort);

  // Video Decoder initialization
  let decoderError: Error | null = null;
  const videoDecoder = new VideoDecoder({
    output: (videoFrame: VideoFrame) => {
      try {
        if (signal?.aborted || isCancelled) {
          return;
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
      } catch (err) {
        console.error("[ScanPlay Compressor] Error in VideoDecoder output callback:", err);
        decoderError = err instanceof Error ? err : new Error(String(err));
      } finally {
        videoFrame.close();
      }
    },
    error: (err) => {
      console.error("[ScanPlay Compressor] VideoDecoder error event:", err);
      decoderError = err instanceof Error ? err : new Error(String(err));
    },
  });

  const safeCloseDecoder = () => {
    if (videoDecoder.state !== "closed") {
      try {
        videoDecoder.close();
      } catch {}
    }
  };

  const safeCloseEncoder = () => {
    if (videoEncoder.state !== "closed") {
      try {
        videoEncoder.close();
      } catch {}
    }
  };

  try {
    const decoderDescription = getDecoderDescription(mp4boxFile, videoTrack.id);
    const decoderConfig: VideoDecoderConfig = {
      codec: videoTrack.codec,
      codedWidth: srcWidth,
      codedHeight: srcHeight,
      description: decoderDescription,
    };

    let decoderSupported = false;
    try {
      const check = await VideoDecoder.isConfigSupported(decoderConfig);
      decoderSupported = Boolean(check.supported);
    } catch {}

    // Fallback 1: Test without description if config with description was rejected
    if (!decoderSupported && decoderDescription) {
      try {
        const noDescCheck = await VideoDecoder.isConfigSupported({
          codec: decoderConfig.codec,
          codedWidth: srcWidth,
          codedHeight: srcHeight,
        });
        if (noDescCheck.supported) {
          delete decoderConfig.description;
          decoderSupported = true;
        }
      } catch {}
    }

    // Fallback 2: Normalize hev1 to hvc1 (some browsers only accept hvc1)
    if (!decoderSupported && decoderConfig.codec.startsWith("hev1")) {
      const hvcCodec = decoderConfig.codec.replace(/^hev1/, "hvc1");
      try {
        const hvcCheck = await VideoDecoder.isConfigSupported({
          ...decoderConfig,
          codec: hvcCodec,
        });
        if (hvcCheck.supported) {
          decoderConfig.codec = hvcCodec;
          decoderSupported = true;
        }
      } catch {}
    }

    if (!decoderSupported) {
      const isHevc =
        videoTrack.codec.toLowerCase().startsWith("hvc") ||
        videoTrack.codec.toLowerCase().startsWith("hev");
      if (isHevc) {
        throw new Error(
          `Your device or browser does not have hardware HEVC/H.265 video decoding support. This iPhone video requires HEVC decoding. Please use Google Chrome on a supported device or convert the video to standard H.264 MP4 before uploading.`
        );
      }
      throw new Error(
        `Your browser's video decoder does not support this video's codec (${videoTrack.codec}). Please compress or convert it prior to uploading.`
      );
    }

    try {
      videoDecoder.configure(decoderConfig);
    } catch (cfgErr) {
      if (decoderConfig.description) {
        delete decoderConfig.description;
        videoDecoder.configure(decoderConfig);
      } else {
        throw cfgErr;
      }
    }

    console.log("[ScanPlay Compressor] Transcoding plan:", {
      sourceCodec: videoTrack.codec,
      srcDimensions: `${srcWidth}x${srcHeight}`,
      targetDimensions: `${targetWidth}x${targetHeight}`,
      targetBitrate: `${(targetBitrate / 1_000_000).toFixed(2)} Mbps`,
      durationSec: durationSec.toFixed(1),
      totalVideoSamples: rawVideoSamples.length,
      totalAudioSamples: rawAudioSamples.length,
      hasSourceAudio,
      shouldIncludeAudio,
      tier: tierConfig.tier,
    });

    onProgress?.({
      percent: 8,
      stage: "encoding",
      stageText: "Transcoding frames with hardware acceleration...",
    });

    let audioChunksAdded = 0;
    if (shouldIncludeAudio && audioTrack) {
      for (const sample of rawAudioSamples) {
        if (signal?.aborted || isCancelled) break;
        const data = await fileReader.getSampleBytes(sample);
        if (signal?.aborted || isCancelled) break;

        const timestamp = Math.round((sample.cts * 1_000_000) / (audioTrack.timescale || 1));
        const duration = Math.round((sample.duration * 1_000_000) / (audioTrack.timescale || 1));
        const chunkType: "key" | "delta" = sample.is_sync ? "key" : "delta";

        if (typeof muxer.addAudioChunkRaw === "function") {
          muxer.addAudioChunkRaw(data, chunkType, timestamp, duration);
        } else if (typeof globalThis.EncodedAudioChunk !== "undefined") {
          const audioChunk = new globalThis.EncodedAudioChunk({
            type: chunkType,
            timestamp,
            duration,
            data,
          });
          muxer.addAudioChunk(audioChunk);
        } else {
          throw new Error(
            "Unable to mux audio: neither addAudioChunkRaw nor EncodedAudioChunk is available in this browser."
          );
        }
        audioChunksAdded++;
      }

      if (signal?.aborted || isCancelled) {
        throw new DOMException("Compression cancelled by user", "AbortError");
      }

      if (audioChunksAdded === 0 || audioChunksAdded !== rawAudioSamples.length) {
        throw new Error(
          `Failed to add all audio samples to output (${audioChunksAdded}/${rawAudioSamples.length} added). Compression stopped to prevent corrupt audio.`
        );
      }
    }

    for (let i = 0; i < rawVideoSamples.length; i++) {
      const sample = rawVideoSamples[i];
      if (signal?.aborted || isCancelled) break;
      if (decoderError) throw decoderError;
      if (encoderError) throw encoderError;

      while (
        (videoDecoder.state === "configured" && videoDecoder.decodeQueueSize > 30) ||
        (videoEncoder.state === "configured" && videoEncoder.encodeQueueSize > 30)
      ) {
        if (signal?.aborted || isCancelled) break;
        if (decoderError || encoderError) break;
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 50);
          const onDequeue = () => {
            clearTimeout(timer);
            resolve();
          };
          videoDecoder.ondequeue = onDequeue;
          videoEncoder.ondequeue = onDequeue;
        });
      }

      if (signal?.aborted || isCancelled) break;
      if (decoderError) throw decoderError;
      if (encoderError) throw encoderError;
      if (videoDecoder.state !== "configured") {
        throw (
          decoderError ||
          new Error(`VideoDecoder is not configured (state: ${videoDecoder.state})`)
        );
      }

      const data = await fileReader.getSampleBytes(sample);

      if (signal?.aborted || isCancelled) break;
      if (decoderError) throw decoderError;
      if (encoderError) throw encoderError;
      if (videoDecoder.state !== "configured") {
        throw (
          decoderError ||
          new Error(`VideoDecoder is not configured (state: ${videoDecoder.state})`)
        );
      }

      const videoChunk = new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: Math.round((sample.cts * 1_000_000) / (videoTrack.timescale || 1)),
        duration: Math.round((sample.duration * 1_000_000) / (videoTrack.timescale || 1)),
        data,
      });

      try {
        videoDecoder.decode(videoChunk);
      } catch (decodeErr) {
        if (decoderError) throw decoderError;
        console.error(`[ScanPlay Compressor] Synchronous decode exception at sample ${i}:`, decodeErr);
        throw decodeErr;
      }
    }

    if (signal?.aborted || isCancelled) {
      throw new DOMException("Compression cancelled by user", "AbortError");
    }

    if (videoDecoder.state === "configured") {
      await videoDecoder.flush();
    }
    safeCloseDecoder();

    if (decoderError) {
      throw decoderError;
    }
    if (encoderError) {
      throw encoderError;
    }

    if (videoEncoder.state === "configured") {
      await videoEncoder.flush();
    }
    safeCloseEncoder();

    if (encodedFrames === 0) {
      throw new Error(
        "No video frames were successfully encoded. The video could not be decoded or processed on this device."
      );
    }

    if (shouldIncludeAudio && audioChunksAdded === 0) {
      throw new Error(
        "Audio track was configured but zero audio chunks were added. Compression stopped to prevent creating a silent video."
      );
    }

    onProgress?.({
      percent: 98,
      stage: "finalizing",
      stageText: "Finalizing MP4 container and metadata...",
    });

    muxer.finalize();
  } finally {
    signal?.removeEventListener("abort", onAbort);
    fileReader.clear();
    safeCloseDecoder();
    safeCloseEncoder();
  }

  const compressedBuffer = muxerTarget.buffer;
  const compressedSize = compressedBuffer.byteLength;
  const originalSize = file.size;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const reductionPercentage = Math.max(
    0,
    parseFloat(((savedBytes / originalSize) * 100).toFixed(1))
  );

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const compressedFileName = `${baseName}_compressed.mp4`;

  onProgress?.({
    percent: 100,
    stage: "finalizing",
    stageText: "Compression complete!",
  });

  return {
    buffer: compressedBuffer,
    fileName: compressedFileName,
    originalSize,
    compressedSize,
    reductionPercentage,
    savedBytes,
    durationSeconds: durationSec,
    width: rotation === 90 || rotation === 270 ? targetHeight : targetWidth,
    height: rotation === 90 || rotation === 270 ? targetWidth : targetHeight,
    tierUsed: tierConfig.tier,
  };
}
