"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Maximize, Minimize, Play, Volume2, VolumeX } from "lucide-react";

interface FullscreenVideoViewerProps {
  playbackUrl: string;
  title: string;
  description?: string | null;
}

export function FullscreenVideoViewer({
  playbackUrl,
  title,
}: FullscreenVideoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio is enabled by default: muted is NEVER the default playback mode
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayWithSoundOverlay, setShowPlayWithSoundOverlay] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Subscribe to browser Fullscreen capability via useSyncExternalStore
  const supportsFullscreen = useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof document === "undefined") return false;
      const doc = document as Document & { webkitFullscreenEnabled?: boolean };
      return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
    },
    () => false
  );

  // Subscribe to Fullscreen change events via useSyncExternalStore
  const isFullscreen = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === "undefined") return () => {};
      document.addEventListener("fullscreenchange", onStoreChange);
      document.addEventListener("webkitfullscreenchange", onStoreChange);
      return () => {
        document.removeEventListener("fullscreenchange", onStoreChange);
        document.removeEventListener("webkitfullscreenchange", onStoreChange);
      };
    },
    () => {
      if (typeof document === "undefined") return false;
      const doc = document as Document & { webkitFullscreenElement?: Element };
      return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
    },
    () => false
  );

  // Attempt autoplay WITH SOUND on mount.
  // Case 1 (Browser allows): Video immediately starts playing with audio.
  // Case 2 (Browser blocks): Video remains paused, audio stays enabled, and "PLAY WITH SOUND" overlay appears.
  // CRITICAL: NEVER silently fall back to muted playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure audio is ON
    video.muted = false;
    setIsMuted(false);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Case 1: Browser permitted autoplay with sound
          setIsPlaying(true);
          setShowPlayWithSoundOverlay(false);
        })
        .catch(() => {
          // Case 2: Browser blocked autoplay with sound.
          // Keep video paused, keep audio enabled, and present the "PLAY WITH SOUND" button.
          // Do NOT retry muted playback. Do NOT set video.muted = true.
          setIsPlaying(false);
          setShowPlayWithSoundOverlay(true);
        });
    }
  }, []);

  // Handle explicit visitor tap on "PLAY WITH SOUND"
  const handlePlayWithSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = false;
      setIsMuted(false);
      await video.play();
      setIsPlaying(true);
      setShowPlayWithSoundOverlay(false);
    } catch (err: unknown) {
      console.debug("User-initiated playback failed:", err);
    }
  };

  // Auto-hide the subtle top overlay after 3 seconds of inactivity while playing
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying]);

  // Handle user interaction to briefly reveal top overlay
  const handleUserInteraction = () => {
    setShowOverlay(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
    }
  };

  // Handle Fullscreen toggle safely with graceful degradation
  const handleToggleFullscreen = async () => {
    try {
      const container = containerRef.current;
      const video = videoRef.current as (HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      }) | null;

      const doc = document as Document & {
        webkitFullscreenElement?: Element;
        webkitExitFullscreen?: () => Promise<void>;
      };

      const isCurrentlyFullscreen = Boolean(
        doc.fullscreenElement || doc.webkitFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        if (container?.requestFullscreen) {
          await container.requestFullscreen();
        } else if (
          container &&
          "webkitRequestFullscreen" in container &&
          typeof (container as { webkitRequestFullscreen?: () => Promise<void> })
            .webkitRequestFullscreen === "function"
        ) {
          await (
            container as { webkitRequestFullscreen: () => Promise<void> }
          ).webkitRequestFullscreen();
        } else if (video && typeof video.webkitEnterFullscreen === "function") {
          video.webkitEnterFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err: unknown) {
      console.debug("Fullscreen toggle was not permitted by browser:", err);
    }
  };

  // Handle manual mute toggle during active playback
  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="fixed inset-0 z-50 h-screen h-[100dvh] w-screen bg-black overflow-hidden flex items-center justify-center select-none"
    >
      {/* Native Video Element filling entire viewport with object-fit: contain */}
      <video
        ref={videoRef}
        src={playbackUrl}
        controls
        playsInline
        preload="auto"
        onPlay={() => {
          setIsPlaying(true);
          setShowPlayWithSoundOverlay(false);
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowOverlay(true);
        }}
        onVolumeChange={(e) => {
          const target = e.currentTarget;
          setIsMuted(target.muted || target.volume === 0);
        }}
        aria-label={title || "Fullscreen video player"}
        className="w-full h-full max-w-full max-h-full object-contain bg-black"
      />

      {/* Prominent Centered Fallback: "PLAY WITH SOUND" when autoplay with sound is blocked */}
      {showPlayWithSoundOverlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all animate-in fade-in duration-300">
          <button
            type="button"
            onClick={handlePlayWithSound}
            className="group relative flex items-center gap-3.5 rounded-full bg-white px-7 sm:px-9 py-4 sm:py-4.5 text-sm sm:text-base font-bold text-zinc-950 shadow-2xl hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer min-h-[52px] select-none border border-white/20"
            aria-label="Play video with sound"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-white group-hover:bg-zinc-800 transition-colors shrink-0">
              <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
            </div>
            <span className="tracking-wider">PLAY WITH SOUND</span>
            <Volume2 className="h-4 w-4 text-zinc-500 group-hover:text-zinc-900 transition-colors shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Subtle, unobtrusive top overlay for title & quick controls */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:p-5 transition-opacity duration-300 ${
          showOverlay && !showPlayWithSoundOverlay ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Subtle Title Badge */}
        {title ? (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-950/70 backdrop-blur-md px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-zinc-200 border border-zinc-800/80 shadow-lg truncate max-w-[65vw] sm:max-w-md">
          <span className="truncate">{title}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Action Controls (Volume Toggle + Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mute/Unmute button for active playback */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/70 hover:bg-zinc-900 backdrop-blur-md text-zinc-300 hover:text-white border border-zinc-800/80 shadow-lg transition-colors cursor-pointer"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>

          {/* Native Fullscreen API button (gracefully degrades if unsupported) */}
          {supportsFullscreen && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/70 hover:bg-zinc-900 backdrop-blur-md text-zinc-300 hover:text-white border border-zinc-800/80 shadow-lg transition-colors cursor-pointer"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Maximize className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
