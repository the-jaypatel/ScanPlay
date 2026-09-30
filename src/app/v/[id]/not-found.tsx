import React from "react";
import Link from "next/link";
import { Play, AlertCircle, ArrowLeft } from "lucide-react";

export default function VideoNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Minimal Header */}
      <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 min-h-[44px] py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-lg"
            aria-label="ScanPlay Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950">
              <Play className="h-4 w-4 fill-zinc-950 ml-0.5" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ScanPlay
            </span>
          </Link>
        </div>
      </header>

      {/* Main unavailable content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 mb-6">
            <AlertCircle className="h-7 w-7 text-zinc-400" aria-hidden="true" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Video unavailable
          </h1>

          <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            This video may have been removed or is no longer publicly available.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to ScanPlay</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
