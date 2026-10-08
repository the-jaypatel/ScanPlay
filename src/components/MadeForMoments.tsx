import React from "react";
import { Heart, Calendar, Baby, Gift, Check, X, Sparkles } from "lucide-react";

export function MadeForMoments() {
  const moments = [
    {
      title: "Wedding Invitations & Save the Dates",
      subtitle: "Stationery + Cinematic Video",
      description:
        "Pair your printed invitation suite with an emotional video invite. Guests scan the card to watch your save-the-date film with original audio and music intact.",
      icon: Heart,
    },
    {
      title: "Milestone Anniversaries & Birthdays",
      subtitle: "Family Tributes & Retrospectives",
      description:
        "25th anniversaries, 50th birthday tributes, or celebration of life films. Share a single clean link with guests and family members across the globe.",
      icon: Calendar,
    },
    {
      title: "Baby & Family Announcements",
      subtitle: "Intimate Personal Milestones",
      description:
        "Baby arrivals, adoption announcements, and gender reveals shared directly with close friends and family without publishing to public social media feeds.",
      icon: Baby,
    },
    {
      title: "Printed Keepsakes & Event Stationery",
      subtitle: "Physical to Digital Bridge",
      description:
        "Download high-contrast 512×512 QR code PNGs to embed directly into printed ceremony programs, thank-you cards, and keepsake gift boxes.",
      icon: Gift,
    },
  ];

  return (
    <section id="moments" className="relative border-t border-zinc-800/70 bg-zinc-950 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            <span>Made for Moments</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Built for moments that deserve intention.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
            Mainstream video platforms are built for algorithms, ads, and engagement traps. ScanPlay gives your personal moments a respectful, distraction-free stage.
          </p>
        </div>

        {/* 4 Moments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {moments.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 transition-colors group-hover:border-zinc-700 group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      {item.subtitle}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Callout: ScanPlay vs Alternatives */}
        <div className="mt-16 sm:mt-20 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-10 backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Why not YouTube or Google Drive?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              When sharing an intimate invitation or tribute, the delivery environment matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            {/* YouTube */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60">
                <span className="font-semibold text-zinc-300">Public Video Platforms</span>
                <X className="h-4 w-4 text-red-400" aria-hidden="true" />
              </div>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li className="flex items-center gap-2 text-red-300/80">
                  <X className="h-3 w-3 shrink-0" /> Disruptive commercial ads
                </li>
                <li className="flex items-center gap-2 text-red-300/80">
                  <X className="h-3 w-3 shrink-0" /> Recommended videos of strangers
                </li>
                <li className="flex items-center gap-2 text-red-300/80">
                  <X className="h-3 w-3 shrink-0" /> Public search engine indexing
                </li>
                <li className="flex items-center gap-2 text-red-300/80">
                  <X className="h-3 w-3 shrink-0" /> Noisy comment sections
                </li>
              </ul>
            </div>

            {/* Cloud Drives */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60">
                <span className="font-semibold text-zinc-300">Cloud Storage Links</span>
                <X className="h-4 w-4 text-amber-400" aria-hidden="true" />
              </div>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li className="flex items-center gap-2 text-amber-300/80">
                  <X className="h-3 w-3 shrink-0" /> Requires Google / Microsoft login
                </li>
                <li className="flex items-center gap-2 text-amber-300/80">
                  <X className="h-3 w-3 shrink-0" /> &ldquo;Request access&rdquo; permission errors
                </li>
                <li className="flex items-center gap-2 text-amber-300/80">
                  <X className="h-3 w-3 shrink-0" /> Clunky file inspector UI
                </li>
                <li className="flex items-center gap-2 text-amber-300/80">
                  <X className="h-3 w-3 shrink-0" /> Prompts guests to download raw files
                </li>
              </ul>
            </div>

            {/* ScanPlay */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg shadow-emerald-950/10">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
                <span className="font-semibold text-white">ScanPlay</span>
                <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              </div>
              <ul className="space-y-2 text-zinc-300 text-xs">
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="h-3 w-3 shrink-0" /> Zero ads, feeds, or distractions
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="h-3 w-3 shrink-0" /> No login or account required for guests
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="h-3 w-3 shrink-0" /> Audio-first autoplay playback
                </li>
                <li className="flex items-center gap-2 text-emerald-300">
                  <Check className="h-3 w-3 shrink-0" /> Built-in high-res QR code generation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
