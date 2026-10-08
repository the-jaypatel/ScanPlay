import React from "react";
import Link from "next/link";
import { Play, UploadCloud, Sparkles, ShieldCheck, QrCode } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-36">
      {/* Cinematic subtle ambient lighting */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-800/25 via-zinc-900/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -z-10 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[100px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle Pill Tag: Upload once. Share anywhere. */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md mb-8 shadow-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide">Upload once. Share anywhere.</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto">
          Your video deserves <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            more than a link.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="mt-6 text-lg sm:text-xl md:text-2xl text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed">
          Create a beautiful, distraction-free video page for invitations, events, and moments worth sharing.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto">
          <Link
            href="/admin"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-3.5 min-h-[48px] text-sm sm:text-base font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 hover:shadow-xl hover:shadow-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 w-full sm:w-auto"
          >
            <UploadCloud className="h-4 w-4 text-zinc-950 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
            <span>Upload a Video</span>
          </Link>

          <a
            href="#demo"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-7 py-3.5 min-h-[48px] text-sm sm:text-base font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 w-full sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 fill-zinc-300 group-hover:fill-white transition-colors" aria-hidden="true" />
            <span>Watch Demo</span>
          </a>
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-14 pt-8 border-t border-zinc-800/50 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Private Storage Bucket</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">&bull;</span>
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Built-in QR Code Export</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">&bull;</span>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Zero Guest Ads or Algorithms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
