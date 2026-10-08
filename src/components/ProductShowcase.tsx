import React from "react";
import Link from "next/link";
import { Play, Volume2, Maximize2, Sparkles, Smartphone, EyeOff } from "lucide-react";

export function ProductShowcase() {
  return (
    <section className="relative border-t border-zinc-800/70 bg-zinc-950 py-20 sm:py-28 overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[600px] w-[900px] rounded-full bg-zinc-800/20 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <span>The ScanPlay Guest Page</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            A dedicated stage for your video.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            No algorithms, comment sections, or recommended distractions. Just your video in full cinematic quality, hosted at a clean private URL.
          </p>
        </div>

        {/* Realistic Browser Window & Player Mockup */}
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Browser Window Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/80">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-zinc-700/60" />
              <span className="h-3 w-3 rounded-full bg-zinc-700/60" />
              <span className="h-3 w-3 rounded-full bg-zinc-700/60" />
            </div>

            {/* URL Pill */}
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1 text-xs font-mono text-zinc-300 shadow-inner">
              <span className="text-emerald-400 text-[10px]">●</span>
              <span className="text-zinc-500">https://</span>
              <span>scanplay.app/v/8Kx92Lm</span>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 hidden sm:block">
              Dedicated Guest Viewer
            </div>
          </div>

          {/* Video Player Canvas Mockup */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
            {/* Ambient image background representing an invitation video */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/70 to-zinc-900/40 opacity-90"
              aria-hidden="true"
            />

            {/* Cinematic subtle light burst */}
            <div
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-amber-500/10 blur-3xl"
              aria-hidden="true"
            />

            {/* Video Content Overlay */}
            <div className="relative z-10 text-center px-6 py-8 max-w-lg mx-auto">
              <p className="text-xs sm:text-sm font-serif italic text-amber-200/80 tracking-widest uppercase mb-2">
                Wedding Celebration
              </p>
              <h3 className="text-2xl sm:text-4xl font-serif font-medium text-white tracking-wide">
                Aarav &amp; Ananya
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-light">
                18 December 2026 &bull; Ahmedabad, Gujarat
              </p>

              {/* Center Play Button with subtle pulse */}
              <div className="mt-6 flex justify-center">
                <Link
                  href="/v/demo"
                  className="group/btn relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/95 text-zinc-950 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Play video demo"
                >
                  <span className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-25 group-hover/btn:opacity-40" />
                  <Play className="h-6 w-6 fill-zinc-950 ml-1 transition-transform group-hover/btn:scale-110" aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-4 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Click to preview live player
              </p>
            </div>

            {/* Bottom Player Controls Mockup */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 to-transparent px-4 py-3 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <Play className="h-4 w-4 fill-zinc-400 text-zinc-400" aria-hidden="true" />
                <Volume2 className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                <span className="font-mono text-[11px] text-zinc-400">0:00 / 0:18</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                  1080p HD
                </span>
                <Maximize2 className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Value Badges */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-left transition-colors hover:border-zinc-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-semibold text-white">Unlisted by Default</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Never publicly indexed, crawled, or surfaced in algorithmic search results. Only visitors with your specific link or QR code can watch.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-left transition-colors hover:border-zinc-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-semibold text-white">Audio-First Experience</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Designed so music, greetings, and vows are heard immediately. If mobile autoplay blocks unmuted sound, an explicit prompt unmutes with one tap.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 text-left transition-colors hover:border-zinc-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                <Smartphone className="h-4 w-4" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-semibold text-white">Zero Guest Friction</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No apps to install, no passwords to create, no cookies consent popups. Guests scan or tap, and the video starts playing immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
