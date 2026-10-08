import React from "react";
import { Volume2, Sparkles, MonitorSmartphone, Zap } from "lucide-react";

export function GuestExperience() {
  const pillars = [
    {
      title: "Audio-First Autoplay",
      subtitle: "Never Miss the Music",
      description:
        "The background music, personal vows, and spoken words are the heart of an invitation. ScanPlay prioritizes unmuted audio. If mobile OS restrictions block unmuted autoplay, a prominent 'PLAY WITH SOUND' prompt appears—never silently degrading to muted playback.",
      icon: Volume2,
      badge: "Sound Preserved",
    },
    {
      title: "Frictionless One-Tap Access",
      subtitle: "Built for All Generations",
      description:
        "Whether your guests are tech-savvy friends or elderly grandparents, anyone can watch instantly. No app installation, no user accounts, no passwords, and no cookie consent barriers.",
      icon: Zap,
      badge: "Zero Accounts",
    },
    {
      title: "Universal Screen Adaptation",
      subtitle: "Portrait & Widescreen Ready",
      description:
        "Handles vertical 9:16 smartphone clips, 16:9 landscape 4K films, and square formats gracefully. True black letterboxing ensures the video remains the sole centerpiece on mobile and desktop displays.",
      icon: MonitorSmartphone,
      badge: "Any Device",
    },
  ];

  return (
    <section id="guest-experience" className="relative border-t border-zinc-800/70 bg-zinc-950 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <span>The Guest Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Engineered for guests of every generation.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Every technical detail is tuned so your recipient experiences the video immediately, without confusion or technical hurdles.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      {pillar.badge}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 transition-colors group-hover:border-zinc-700 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>

                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    {pillar.subtitle}
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
