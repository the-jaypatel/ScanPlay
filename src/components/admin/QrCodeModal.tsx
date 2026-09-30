"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Download, X, QrCode, AlertCircle, Loader2, Check, Copy } from "lucide-react";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  publicId: string;
  publicUrl: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  videoTitle,
  publicId,
  publicUrl,
}: QrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate QR code when modal is mounted for a public URL
  useEffect(() => {
    if (!publicUrl) return;

    let isMounted = true;

    // High resolution (1024px) for crisp physical printing, with standard margin
    QRCode.toDataURL(publicUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("QR Code generation error:", err);
          setError("Failed to generate QR code. Please try again.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [publicUrl]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Download PNG
  const handleDownload = () => {
    if (!qrDataUrl) return;

    // Sanitize title for filename
    const sanitizedTitle = videoTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const filename = sanitizedTitle
      ? `scanplay-${sanitizedTitle}-${publicId}-qr.png`
      : `scanplay-${publicId}-qr.png`;

    const downloadLink = document.createElement("a");
    downloadLink.href = qrDataUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-7 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <QrCode className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 id="qr-modal-title" className="text-base font-semibold text-white tracking-tight">
              QR Code
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Video Title */}
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">
            Video Destination
          </p>
          <h3 className="text-lg font-bold text-white tracking-tight break-words">
            {videoTitle}
          </h3>
        </div>

        {/* QR Code Preview Box */}
        <div className="mt-5 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-60 h-60 sm:w-64 sm:h-64 rounded-2xl bg-white p-3 shadow-2xl border border-zinc-200">
            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-800" aria-hidden="true" />
                <span className="text-xs font-medium text-zinc-700">Generating QR…</span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center p-4 text-center text-red-600 gap-2">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            )}

            {!isLoading && !error && qrDataUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt={`QR code for ${videoTitle}`}
                className="w-full h-full object-contain select-none"
              />
            )}
          </div>
          <p className="mt-2 text-[11px] text-zinc-400 text-center">
            Scan with any smartphone camera to open the video.
          </p>
        </div>

        {/* Encoded Canonical URL */}
        <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-1">
            Encoded Link
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-zinc-200 break-anywhere select-all">
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Copy encoded link"
              title="Copy encoded link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto flex-1 min-h-[44px] flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl || isLoading}
            className="w-full sm:w-auto flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
