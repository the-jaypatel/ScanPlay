import React from "react";
import { UploadCloud, QrCode, Play, Sparkles, Check } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      badge: "Admin Upload",
      title: "Upload & Optimize",
      description:
        "Upload your video directly through the secure admin portal. Files up to 50 MB upload instantly. Oversized videos are optimized locally in your browser using hardware-accelerated WebCodecs.",
      highlights: ["Up to 50 MB direct upload", "Hardware-accelerated WebCodecs", "Zero server conversion fees"],
      icon: UploadCloud,
    },
    {
      number: "02",
      badge: "Instant Generation",
      title: "Create Link & QR Code",
      description:
        "ScanPlay hosts your video in private cloud storage and creates a unique short public URL. A high-resolution, print-ready QR code is generated instantly for physical stationery.",
      highlights: ["Short clean public ID (/v/[id])", "Private storage with signed URLs", "512×512 print-ready PNG download"],
      icon: QrCode,
    },
    {
      number: "03",
      badge: "Guest Playback",
      title: "Effortless Guest Viewing",
      description:
        "Share the link in text messages or print the QR on cards. Guests tap or scan with any smartphone camera to watch immediately in full resolution with crystal-clear audio.",
      highlights: ["No app downloads or signups", "Audio-first autoplay support", "Zero ads, sidebars, or comments"],
      icon: Play,
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative border-t border-zinc-800/70 bg-zinc-950 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <span>Frictionless Workflow</span>
          </div>
          <h2
            id="how-it-works-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white"
          >
            How ScanPlay Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            From your raw video file to a shareable link and printed QR code in three straightforward steps.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50 hover:shadow-xl"
              >
                <div>
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                      Step {step.number}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 transition-colors group-hover:border-zinc-700 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Step Title & Badge */}
                  <div className="mb-3">
                    <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      {step.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="mt-6 space-y-2.5 pt-6 border-t border-zinc-800/60 text-xs text-zinc-300">
                    {step.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
