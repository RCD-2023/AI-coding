"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  { check: true, label: "Up to 50 items" },
  { check: true, label: "3 collections" },
  { check: true, label: "All item types" },
  { check: true, label: "Instant search" },
  { check: true, label: "GitHub OAuth login" },
  { check: false, label: "AI features" },
  { check: false, label: "File uploads" },
  { check: false, label: "Unlimited items" },
];

const PRO_FEATURES = [
  { check: true, pro: false, label: "Unlimited items", bold: true },
  { check: true, pro: false, label: "Unlimited collections", bold: true },
  { check: true, pro: false, label: "All item types", bold: false },
  { check: true, pro: false, label: "Instant search", bold: false },
  { check: true, pro: false, label: "GitHub OAuth login", bold: false },
  { check: true, pro: true, label: "AI auto-tagging", bold: true },
  { check: true, pro: true, label: "File & image uploads", bold: true },
  { check: true, pro: true, label: "Semantic search", bold: true },
];

export default function PricingToggle() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span
          className={`text-sm font-medium transition-colors ${
            !yearly ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Monthly
        </span>
        <div
          role="switch"
          aria-checked={yearly}
          tabIndex={0}
          onClick={() => setYearly(!yearly)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setYearly(!yearly)}
          className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors select-none shrink-0 ${
            yearly ? "bg-blue-500" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              yearly ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
        <span
          className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
            yearly ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          Yearly
          <span className="text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
            Save 25%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="border border-border rounded-xl p-8 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">Free</h3>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground mb-2">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Everything you need to get started
            </p>
          </div>
          <ul className="flex flex-col gap-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm">
                <span
                  className={f.check ? "text-green-500 font-bold" : "text-muted-foreground"}
                >
                  {f.check ? "✓" : "✗"}
                </span>
                <span className={f.check ? "text-foreground" : "text-muted-foreground"}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/register" className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}>
            Get Started Free
          </Link>
        </div>

        {/* Pro */}
        <div className="relative border-2 border-blue-500 rounded-xl p-8 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-blue-500 text-white px-3 py-1 rounded-full">
            Most Popular
          </span>
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">Pro</h3>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-bold">
                {yearly ? "$6" : "$8"}
              </span>
              <span className="text-muted-foreground mb-2">/month</span>
            </div>
            <p
              className={`text-xs text-muted-foreground mb-1 transition-opacity ${
                yearly ? "opacity-100" : "opacity-0"
              }`}
            >
              Billed annually ($72/yr)
            </p>
            <p className="text-sm text-muted-foreground">
              For developers who are serious about their craft
            </p>
          </div>
          <ul className="flex flex-col gap-3 mb-8">
            {PRO_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm">
                <span
                  className={`font-bold ${f.pro ? "text-blue-500" : "text-green-500"}`}
                >
                  ✓
                </span>
                <span className={f.bold ? "font-semibold text-foreground" : "text-foreground"}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/register" className={cn(buttonVariants(), "w-full justify-center")}>
            Get Started with Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
