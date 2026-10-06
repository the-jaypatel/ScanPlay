"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Play,
  Copy,
  Check,
  QrCode as QrCodeIcon,
  Download,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { getPublicVideoUrl } from "@/lib/urls";

export function PublicDemoCard() {
  const browserOrigin = useSyncExternalStore(
    () => () => {},
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => ""
  );
  const demoUrl = getPublicVideoUrl("demo", browserOrigin || undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(demoUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch((err: unknown) => {
        console.error("Demo QR generation error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [demoUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(demoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-4 sm:p-6 backdrop-blur-md shadow-2xl text-left">
      {/* Top Header Badge */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-xs mb-4 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-950/40 px-2.5 py-0.5 text-[11px] font-medium text-sky-400">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Interactive Demo</span>
          </span>
          <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
            Direct Guest Viewer
          </span>
        </div>
        <Link
          href="/v/demo"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-md py-1"
        >
          <span>Open Fullscreen Viewer</span>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" aria-hidden="true" />
        </Link>
      </div>

      {/* Playable Video Preview Container */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner group">
        <video
          src="/demo.mp4"
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          aria-label="ScanPlay live public demo video"
        />
      </div>

      {/* Demo Link and QR Code Section */}
      <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* Link & Direct CTA Box */}
        <div className="sm:col-span-8 flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 sm:p-4">
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Shareable Guest URL
            </p>
            <p className="mt-1 font-mono text-xs sm:text-sm text-zinc-200 truncate select-all">
              {demoUrl}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400 leading-normal">
              Clean distraction-free player. No ads, algorithms, or account required.
            </p>
          </div>

          <div className="mt-3.5 pt-3 border-t border-zinc-800/70 flex flex-wrap items-center gap-2">
            <Link
              href="/v/demo"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2 min-h-[44px] text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white flex-1 sm:flex-initial"
            >
              <Play className="h-3.5 w-3.5 fill-zinc-950" aria-hidden="true" />
              <span>Watch Demo</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 min-h-[44px] text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
              aria-label="Copy demo video link"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real Demo QR Code Box */}
        <div className="sm:col-span-4 flex flex-col items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 sm:p-4 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
              <QrCodeIcon className="h-3 w-3 text-zinc-400" aria-hidden="true" />
              <span>Demo QR</span>
            </div>

            <div className="p-1.5 rounded-lg bg-white shadow-sm flex items-center justify-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR code to watch ScanPlay demo video"
                  className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                />
              ) : (
                <div className="w-20 h-20 sm:w-22 sm:h-22 bg-zinc-100 flex items-center justify-center animate-pulse">
                  <QrCodeIcon className="h-6 w-6 text-zinc-400" aria-hidden="true" />
                </div>
              )}
            </div>

            <p className="mt-2 text-[10px] text-zinc-400 leading-tight">
              Scan with phone camera to test mobile playback
            </p>
          </div>

          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download="scanplay-demo-qr.png"
              className="mt-2 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm"
              aria-label="Download demo QR code PNG"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              <span>Save PNG</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
