import React from "react";
import Link from "next/link";
import { Play, Shield, Sparkles } from "lucide-react";
import { PublicDemoCard } from "@/components/PublicDemoCard";

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

        {/* Action CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto">
          <Link
            href="/v/demo"
            className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-7 py-3.5 min-h-[44px] text-base font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 w-full sm:w-auto"
          >
            <Play className="h-4 w-4 fill-zinc-950" aria-hidden="true" />
            <span>Watch Demo</span>
          </Link>

          <Link
            href="/admin"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 min-h-[44px] text-base font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 w-full sm:w-auto"
          >
            <Shield className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Admin Upload</span>
          </Link>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Admin-managed video hosting with instant shareable links and built-in QR code generation.
        </p>

        {/* Interactive Public Demo Showcase */}
        <div className="mt-12 sm:mt-16">
          <PublicDemoCard />
        </div>
      </div>
    </section>
  );
}
