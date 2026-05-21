import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FadeIn from "./FadeIn";

export default function CtaSection() {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Organize Your
            <br />
            <span className="text-blue-500">
              Developer Knowledge?
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Join developers who&apos;ve stopped losing their best work to scattered
            apps.
          </p>
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Get Started Free — No Credit Card
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
