import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductShowcase } from "@/components/ProductShowcase";
import { HowItWorks } from "@/components/HowItWorks";
import { MadeForMoments } from "@/components/MadeForMoments";
import { GuestExperience } from "@/components/GuestExperience";
import { InteractiveDemoSection } from "@/components/InteractiveDemoSection";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-white selection:text-zinc-950">
      <Header />
      <main className="flex-1">
        {/* 1. Hero */}
        <Hero />

        {/* 2. See the Product */}
        <ProductShowcase />

        {/* 3. How It Works */}
        <HowItWorks />

        {/* 4. Made for Moments */}
        <MadeForMoments />

        {/* 5. The Guest Experience */}
        <GuestExperience />

        {/* 6. Interactive Demo */}
        <InteractiveDemoSection />

        {/* 7. Final CTA */}
        <FinalCTA />
      </main>
      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
