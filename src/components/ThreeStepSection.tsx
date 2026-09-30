import React from "react";
import { UploadCloud, Link as LinkIcon, Share2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload",
    headline: "Upload your video.",
    description:
      "Select your finished video file. ScanPlay hosts it with high fidelity and lightning-fast streaming without ads or algorithmic clutter.",
    icon: UploadCloud,
  },
  {
    number: "02",
    title: "Get Your Link",
    headline: "ScanPlay creates a unique public video URL.",
    description:
      "A permanent, private-by-default short link is generated for your video's dedicated guest viewing page (/v/[id]).",
    icon: LinkIcon,
  },
  {
    number: "03",
    title: "Share",
    headline: "Copy the URL and use it anywhere.",
    description:
      "Copy your link instantly. Share it in digital messages or paste it into an external QR-code generator for printed cards and stationery.",
    icon: Share2,
  },
];

export function ThreeStepSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="border-t border-zinc-800/80 bg-zinc-950 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Simple &amp; Direct
          </p>
          <h2
            id="how-it-works-title"
            className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white"
          >
            How ScanPlay Works
          </h2>
          <p className="mt-4 text-base text-zinc-400">
            A frictionless path from your video file to a shareable link in three straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 transition-colors hover:border-zinc-700/80"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-sm font-semibold tracking-wider text-zinc-400">
                      {step.number} — {step.title}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white tracking-tight leading-snug">
                    {step.headline}
                  </h3>

                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/50">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Step {step.number}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explicit External QR Generator Notice */}
        <div className="mt-14 rounded-xl border border-zinc-800/70 bg-zinc-900/30 p-4 sm:p-5 text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-200">Using physical cards?</span>{" "}
            ScanPlay generates the clean video destination link. To create printed codes for wedding or event cards, simply paste your ScanPlay URL into any external QR-code generator.
          </p>
        </div>
      </div>
    </section>
  );
}
