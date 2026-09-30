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

  const [isMuted, setIsMuted] = useState(true);
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

  // Safe Autoplay attempt adhering strictly to browser autoplay policies (muted)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err: unknown) => {
          // Autoplay was blocked by browser policy (e.g. user power saving or browser preference)
          // Gracefully degrade: user can start playback via native controls
          console.debug("Autoplay blocked by browser policy:", err);
          setIsPlaying(false);
        });
    }
  }, []);

  // Auto-hide the subtle title overlay after 3 seconds of inactivity while playing
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

  // Handle user interaction to briefly show overlay
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
      // Gracefully catch fullscreen rejections (e.g. denied by browser policy or security settings)
      console.debug("Fullscreen toggle was not permitted by browser:", err);
    }
  };

  // Handle unmute user gesture
  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
      // If paused, ensure it continues playing
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
        muted
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

        {/* Action Controls (Unmute + Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Subtle Unmute Action (helpful when autoplay starts muted per browser requirements) */}
          {isMuted && (
            <button
              type="button"
              onClick={handleToggleMute}
              className="flex items-center gap-1.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-zinc-700/80 shadow-lg transition-colors cursor-pointer"
              aria-label="Unmute audio"
            >
              <VolumeX className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>Unmute</span>
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
