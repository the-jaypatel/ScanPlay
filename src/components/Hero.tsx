import React from "react";
import Link from "next/link";
import { ArrowRight, Link2, Sparkles, QrCode } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-28 lg:pt-28">
      {/* Subtle radial ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-800/30 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-6 sm:mb-8">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          <span>Direct Video Hosting &amp; Viewing</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase leading-[1.1] break-words">
          Your video, one link away.
        </h1>

        {/* Supporting text */}
        <p className="mt-5 text-base sm:text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
          Upload your video. Get a shareable link. Generate a QR code. Share it anywhere.
        </p>

        {/* Primary CTA */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/admin"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 min-h-[44px] text-base font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 w-full sm:w-auto"
          >
            <span>Upload a Video</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Admin-managed video hosting with instant shareable links and built-in QR code generation.
        </p>

        {/* Visual Demonstration: Shareable Link & Built-in QR Code */}
        <div className="mt-12 sm:mt-16 mx-auto max-w-lg rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-3 px-1">
            <span className="font-mono tracking-wider uppercase text-[10px] text-zinc-400">
              Visual Demonstration &bull; Video Link &amp; QR
            </span>
            <span className="text-[11px] text-zinc-500">Distraction-free viewer</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 sm:px-4 sm:py-3 text-left">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300">
                <Link2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs sm:text-sm text-zinc-200">
                  https://scan-play-drab.vercel.app/v/[id]
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Dedicated guest viewing link
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] text-zinc-300">
                <QrCode className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                <span>QR Ready</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
