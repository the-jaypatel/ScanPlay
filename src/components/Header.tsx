import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="ScanPlay Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950 transition-transform group-hover:scale-105 shadow-sm">
            <Play className="h-4 w-4 fill-zinc-950 ml-0.5" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            ScanPlay
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-xs sm:text-sm" aria-label="Main Navigation">
          <a
            href="#how-it-works"
            className="hidden sm:inline-flex items-center min-h-[44px] px-2 text-zinc-400 transition-colors hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            How It Works
          </a>
          <a
            href="#moments"
            className="hidden md:inline-flex items-center min-h-[44px] px-2 text-zinc-400 transition-colors hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Moments
          </a>
          <a
            href="#guest-experience"
            className="hidden md:inline-flex items-center min-h-[44px] px-2 text-zinc-400 transition-colors hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Experience
          </a>
          <a
            href="#demo"
            className="inline-flex items-center min-h-[44px] px-2 text-zinc-400 transition-colors hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Live Demo
          </a>

          {/* Admin CTA button */}
          <Link
            href="/admin"
            className="inline-flex items-center justify-center min-h-[40px] px-4 text-xs font-semibold text-zinc-200 hover:text-white transition-all rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ml-2"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
