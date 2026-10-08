import React from "react";
import Link from "next/link";
import { UploadCloud, Play, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative border-t border-zinc-800/70 bg-zinc-950 py-24 sm:py-32 overflow-hidden">
      {/* Ambient gradient glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 -z-10 h-[400px] w-[800px] rounded-full bg-gradient-to-t from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          <span>Upload once. Share anywhere.</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Give your video the stage it deserves.
        </h2>

        <p className="mt-5 text-base sm:text-xl text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
          Create a pristine, distraction-free video page and a print-ready QR code in minutes.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-md mx-auto">
          <Link
            href="/admin"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-3.5 min-h-[48px] text-sm sm:text-base font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 hover:shadow-xl hover:shadow-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 w-full sm:w-auto"
          >
            <UploadCloud className="h-4 w-4 text-zinc-950 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
            <span>Upload a Video</span>
          </Link>

          <Link
            href="/v/demo"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-7 py-3.5 min-h-[48px] text-sm sm:text-base font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 w-full sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 fill-zinc-300 group-hover:fill-white transition-colors" aria-hidden="true" />
            <span>Watch Fullscreen Demo</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
