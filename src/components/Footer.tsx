import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 py-12 text-zinc-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 py-1"
            aria-label="ScanPlay Home"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-950">
              <Play className="h-3 w-3 fill-zinc-950 ml-0.5" aria-hidden="true" />
            </div>
            <span className="font-semibold text-white tracking-tight">ScanPlay</span>
          </Link>

          <p className="text-xs text-center sm:text-right text-zinc-400 max-w-md leading-relaxed">
            Direct video hosting and viewing URLs for digital sharing. Works seamlessly with any external QR code generator for physical media.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>&copy; {currentYear} ScanPlay. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="hover:text-zinc-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm py-1"
            >
              Admin Portal
            </Link>
            <span>&bull;</span>
            <span className="font-mono text-[11px] text-zinc-600">Direct Video Hosting</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
