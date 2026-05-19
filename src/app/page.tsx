import Navbar from "@/components/homepage/Navbar";
import HeroSection from "@/components/homepage/HeroSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import AiSection from "@/components/homepage/AiSection";
import PricingSection from "@/components/homepage/PricingSection";
import CtaSection from "@/components/homepage/CtaSection";
import Footer from "@/components/homepage/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
