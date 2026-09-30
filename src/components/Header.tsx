import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="ScanPlay Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 transition-transform group-hover:scale-105">
            <Play className="h-4 w-4 fill-zinc-950 ml-0.5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            ScanPlay
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main Navigation">
          <a
            href="#how-it-works"
            className="inline-flex items-center min-h-[44px] px-3 text-xs sm:text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            How it works
          </a>
          <Link
            href="/admin"
            className="inline-flex items-center min-h-[44px] px-3.5 text-xs sm:text-sm font-medium text-zinc-200 hover:text-white transition-colors rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
