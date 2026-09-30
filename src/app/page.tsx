import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ThreeStepSection } from "@/components/ThreeStepSection";
import { InvitationFocus } from "@/components/InvitationFocus";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header />
      <main className="flex-1">
        <Hero />
        <ThreeStepSection />
        <InvitationFocus />
      </main>
      <Footer />
    </div>
  );
}
