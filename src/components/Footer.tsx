import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-16 text-zinc-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 py-1"
              aria-label="ScanPlay Home"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-zinc-950">
                <Play className="h-3 w-3 fill-zinc-950 ml-0.5" aria-hidden="true" />
              </div>
              <span className="font-bold text-white tracking-tight">ScanPlay</span>
            </Link>
            <p className="mt-2 text-xs text-zinc-400 max-w-sm leading-relaxed">
              Distraction-free video hosting and playback for invitations, celebrations, and personal milestones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition-colors py-1">
              How It Works
            </a>
            <a href="#moments" className="hover:text-white transition-colors py-1">
              Moments
            </a>
            <a href="#guest-experience" className="hover:text-white transition-colors py-1">
              Guest Experience
            </a>
            <a href="#demo" className="hover:text-white transition-colors py-1">
              Live Demo
            </a>
            <Link href="/v/demo" className="hover:text-white transition-colors py-1">
              Fullscreen Viewer
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors py-1">
              Admin Portal
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>&copy; {currentYear} ScanPlay. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-zinc-400">Upload once. Share anywhere.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
