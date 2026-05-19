import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FadeIn from "./FadeIn";
import ChaosAnimation from "./ChaosAnimation";
import DashboardMockup from "./DashboardMockup";

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center pt-16 px-4">
      <div className="max-w-6xl mx-auto w-full py-16 flex flex-col items-center gap-12">
        {/* Text — no FadeIn: above-fold content must be visible on first paint */}
        <div className="w-full text-center">
          <div className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-4">
            Developer Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Stop Losing Your
            <br />
            <span className="text-blue-500">
              Developer Knowledge
            </span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-lg mx-auto">
            Snippets in GitHub Gists. Prompts in Notion. Commands in your notes
            app. DevStash brings everything into one searchable, organized hub.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Get Started Free
            </Link>
            <a href="#features" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              See Features
            </a>
          </div>
        </div>

        {/* Visual */}
        <FadeIn className="w-full">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Chaos panel */}
            <div className="flex-1 w-full">
              <div className="text-xs text-muted-foreground text-center mb-2">
                Your knowledge today...
              </div>
              <div className="border border-border rounded-xl overflow-hidden bg-card" style={{ height: 280 }}>
                <ChaosAnimation />
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center shrink-0 rotate-90 md:rotate-0">
              <svg
                className="w-12 h-5"
                viewBox="0 0 60 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 12 H50"
                  stroke="url(#heroArrowGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M40 4 L52 12 L40 20"
                  stroke="url(#heroArrowGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <defs>
                  <linearGradient
                    id="heroArrowGrad"
                    x1="0"
                    y1="0"
                    x2="60"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Dashboard mockup */}
            <div className="flex-1 w-full">
              <div className="text-xs text-muted-foreground text-center mb-2">
                ...with DevStash
              </div>
              <div style={{ height: 280 }}>
                <DashboardMockup />
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
