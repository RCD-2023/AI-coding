import FadeIn from "./FadeIn";
import PricingToggle from "./PricingToggle";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-4">
          <div className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-3">
            Simple Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Start free, upgrade when you&apos;re ready
          </h2>
        </FadeIn>
        <PricingToggle />
      </div>
    </section>
  );
}
