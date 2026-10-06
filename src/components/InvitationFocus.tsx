import React from "react";
import { CheckCircle2, ShieldCheck, Zap, QrCode } from "lucide-react";

export function InvitationFocus() {
  return (
    <section className="border-t border-zinc-800/80 bg-zinc-950/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for invitations and moments that matter.
            </h2>
            <p className="mt-4 text-base text-zinc-400 leading-relaxed">
              Mainstream video platforms are built for algorithms, ads, and engagement traps.
              ScanPlay is built for simplicity: your guests open the link and instantly experience your video in pristine quality without distractions.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-zinc-800/60">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-zinc-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Zero Distractions</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  No recommended videos, no comment sections, and no banner ads.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-zinc-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Unlisted by Default</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Your video isn&apos;t publicly listed or searchable. Share the unique link with whoever you want to watch it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-zinc-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Universal Playback</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Plays smoothly across iOS, Android, tablets, and desktop browsers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <QrCode className="h-5 w-5 text-zinc-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">QR Ready</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Generate a QR code directly from your video link and download it as a PNG for easy sharing or printing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
