import React from "react";
import { Sparkles } from "lucide-react";
import { PublicDemoCard } from "@/components/PublicDemoCard";

export function InteractiveDemoSection() {
  return (
    <section id="demo" className="relative border-t border-zinc-800/70 bg-zinc-950 py-20 sm:py-28">
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-zinc-800/20 blur-[140px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <span>Live Interactive Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Experience ScanPlay in action.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Watch the product explainer video below, or scan the live QR code with your phone camera to experience mobile guest playback firsthand.
          </p>
        </div>

        {/* Centerpiece: PublicDemoCard */}
        <div className="mx-auto max-w-3xl">
          <PublicDemoCard />
        </div>
      </div>
    </section>
  );
}
