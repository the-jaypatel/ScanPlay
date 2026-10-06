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

  // Step 4: Configure WebCodecs VideoEncoder
  let selectedCodec = "avc1.4d002a";
  let hardwarePreference: HardwareAcceleration = "prefer-hardware";

  try {
    const hwCheck = await VideoEncoder.isConfigSupported({
      codec: selectedCodec,
      width: targetWidth,
      height: targetHeight,
      bitrate: targetBitrate,
      hardwareAcceleration: "prefer-hardware",
    });
    if (hwCheck.supported) {
      hardwarePreference = "prefer-hardware";
    } else {
      const swCheck = await VideoEncoder.isConfigSupported({
        codec: selectedCodec,
        width: targetWidth,
        height: targetHeight,
        bitrate: targetBitrate,
        hardwareAcceleration: "prefer-software",
      });
      if (swCheck.supported) {
        hardwarePreference = "prefer-software";
      } else {
        selectedCodec = "avc1.42001f";
        hardwarePreference = "no-preference";
      }
    }
  } catch {
    selectedCodec = "avc1.42001f";
    hardwarePreference = "no-preference";
  }

  const muxerTarget = new ArrayBufferTarget();

  const muxer = new Muxer({
    target: muxerTarget,
    video: {
      codec: "avc",
      width: targetWidth,
      height: targetHeight,
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

    const decoderSupportCheck = await VideoDecoder.isConfigSupported(decoderConfig);
    if (!decoderSupportCheck.supported) {
      throw new Error(
        `Your browser's video decoder does not support this video's codec (${videoTrack.codec}). Please compress or convert it prior to uploading.`
      );
    }
    videoDecoder.configure(decoderConfig);

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

        const audioChunk = new EncodedAudioChunk({
          type: sample.is_sync ? "key" : "delta",
          timestamp: Math.round((sample.cts * 1_000_000) / (audioTrack.timescale || 1)),
          duration: Math.round((sample.duration * 1_000_000) / (audioTrack.timescale || 1)),
          data,
        });
        muxer.addAudioChunk(audioChunk);
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
    width: targetWidth,
    height: targetHeight,
    tierUsed: tierConfig.tier,
  };
}
