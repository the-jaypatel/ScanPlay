"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Maximize, Minimize, VolumeX, Volume2 } from "lucide-react";

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

  // Default to audio enabled: muted is NOT the intended initial state
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // Attempt autoplay with audio enabled first; gracefully fall back to muted autoplay if policy blocks it
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. First attempt: Autoplay with audio enabled
    video.muted = false;

    const unmutedPlayPromise = video.play();
    if (unmutedPlayPromise !== undefined) {
      unmutedPlayPromise
        .then(() => {
          // Autoplay with sound succeeded (browser allowed it)
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch((unmutedErr: unknown) => {
          // Browser autoplay policy rejected unmuted playback without prior user interaction.
          // Fall back gracefully to muted autoplay rather than breaking playback.
          console.debug("Autoplay with audio blocked by browser policy, falling back to muted:", unmutedErr);
          video.muted = true;
          setIsMuted(true);

          const mutedPlayPromise = video.play();
          if (mutedPlayPromise !== undefined) {
            mutedPlayPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch((mutedErr: unknown) => {
                // Both unmuted and muted autoplay were blocked by user agent
                console.debug("Muted autoplay also blocked:", mutedErr);
                setIsPlaying(false);
              });
          }
        });
    }
  }, []);

  // Overlay visibility:
  // - When playing with sound, auto-hides after 3 seconds of inactivity
  // - When muted, keeps the overlay / sound control visible so visitor can easily enable sound
  // - When paused, remains visible
  useEffect(() => {
    if (!isPlaying || isMuted) {
      return;
    }

    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying, isMuted]);

  // Handle user interaction to briefly show overlay
  const handleUserInteraction = () => {
    setShowOverlay(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    // Only schedule auto-hide if playing and sound is active
    if (isPlaying && !isMuted) {
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
          // iOS Safari native video fullscreen fallback
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

  // Handle unmute/mute user gesture
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
        autoPlay
        muted={isMuted}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
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

      {/* Subtle, unobtrusive top overlay for title & quick controls */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-5 transition-opacity duration-300 ${
          showOverlay ? "opacity-100" : "opacity-0"
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

        {/* Action Controls (Sound Toggle + Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Clearly visible control when video is muted so visitor can enable sound */}
          {isMuted && (
            <button
              type="button"
              onClick={handleToggleMute}
              className="flex items-center gap-1.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-white border border-zinc-700/80 shadow-lg transition-colors cursor-pointer"
              aria-label="Enable sound"
            >
              <VolumeX className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>Enable Sound</span>
            </button>
          )}

          {!isMuted && (
            <button
              type="button"
              onClick={handleToggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/70 hover:bg-zinc-900 backdrop-blur-md text-zinc-300 hover:text-white border border-zinc-800/80 shadow-lg transition-colors cursor-pointer"
              aria-label="Mute audio"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}

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
