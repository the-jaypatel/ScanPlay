declare module "mp4box" {
  export interface MP4Track {
    id: number;
    name?: string;
    codec: string;
    size?: number;
    movie_duration?: number;
    movie_timescale?: number;
    duration: number;
    timescale: number;
    nb_samples?: number;
    track_width?: number;
    track_height?: number;
    audio?: {
      sample_rate: number;
      channel_count: number;
      sample_size?: number;
    };
    matrix?: Int32Array | number[];
    type?: string;
    video?: {
      width: number;
      height: number;
    };
  }

  export interface MP4Info {
    duration: number;
    timescale: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4Track[];
    audioTracks: MP4Track[];
    videoTracks: MP4Track[];
    subtitleTracks: MP4Track[];
    otherTracks?: MP4Track[];
  }

  export interface MP4Sample {
    track_id: number;
    description: unknown;
    is_rap: boolean;
    is_sync: boolean;
    data?: Uint8Array;
    alreadyRead?: number;
    size: number;
    offset?: number;
    dts: number;
    cts: number;
    duration: number;
    timescale: number;
  }

  export interface MP4BoxFile {
    onReady?: (info: MP4Info) => void;
    onError?: (err: unknown) => void;
    onSamples?: (id: number, user: unknown, samples: MP4Sample[]) => void;
    appendBuffer(buffer: ArrayBuffer & { fileStart?: number }): number;
    flush(): void;
    setExtractionOptions(id: number, user?: unknown, options?: { nbSamples?: number }): void;
    start(): void;
    stop(): void;
    getTrackById(id: number): unknown;
  }

  export class DataStream {
    static BIG_ENDIAN: boolean;
    buffer: ArrayBuffer;
    position: number;
    constructor(buffer?: ArrayBuffer, byteOffset?: number, endianness?: boolean);
    writeUint8(val: number): void;
    writeUint16(val: number): void;
    writeUint32(val: number): void;
  }

  export interface MP4BoxLog {
    setLogLevel?: (level: number) => void;
    debug?: (module: string, msg: string) => void;
    log?: (module: string, msg: string) => void;
    info?: (module: string, msg: string) => void;
    warn?: (module: string, msg: string) => void;
    error?: (module: string, msg: string, isofile?: unknown) => void;
  }

  export const Log: MP4BoxLog;

  export function createFile(): MP4BoxFile;
}
