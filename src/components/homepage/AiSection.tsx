import FadeIn from "./FadeIn";

const CHECKLIST = [
  {
    title: "Auto-tagging",
    desc: "AI reads your snippet or prompt and suggests relevant tags automatically.",
  },
  {
    title: "Smart descriptions",
    desc: "Generate concise summaries of code blocks so future-you knows what it does.",
  },
  {
    title: "Semantic search",
    desc: 'Find items by meaning, not just keywords. "authentication helper" finds your JWT snippet.',
  },
  {
    title: "Collection suggestions",
    desc: "AI recommends which collection a new item belongs to based on your existing structure.",
  },
];

export default function AiSection() {
  return (
    <section className="py-24 px-4 bg-card">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Left */}
        <FadeIn className="flex-1">
          <span className="inline-block text-xs font-semibold tracking-wider text-blue-400 border border-blue-500/40 bg-blue-500/10 px-3 py-1 rounded-full mb-6">
            Pro Feature
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AI that works{" "}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              for developers
            </span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            DevStash Pro brings AI-powered organization directly into your
            workflow — so your knowledge manages itself.
          </p>
          <ul className="flex flex-col gap-6">
            {CHECKLIST.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="text-blue-500 font-bold text-lg shrink-0 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-foreground">{item.title}</strong>
                  <p className="text-muted-foreground text-sm mt-1">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Right: code editor mockup */}
        <FadeIn className="flex-1 w-full">
          <div className="rounded-xl border border-border overflow-hidden bg-background font-mono text-sm">
            {/* Titlebar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-muted-foreground">
                useAuth.ts
              </span>
            </div>

            {/* Code body */}
            <div className="p-4 text-xs leading-relaxed overflow-x-auto">
              <pre className="text-foreground/90 whitespace-pre">
                <span className="text-purple-400">import</span>
                {" { useSession } "}
                <span className="text-purple-400">from</span>
                {" "}
                <span className="text-green-400">&apos;next-auth/react&apos;</span>
                {"\n\n"}
                <span className="text-purple-400">export function</span>
                {" "}
                <span className="text-blue-400">useAuth</span>
                {"() {\n  "}
                <span className="text-purple-400">const</span>
                {" { data"}
                <span className="text-muted-foreground">:</span>
                {" session, status } =\n    "}
                <span className="text-blue-400">useSession</span>
                {"()\n\n  "}
                <span className="text-purple-400">return</span>
                {" {\n    user"}
                <span className="text-muted-foreground">:</span>
                {" session?.user,\n    isLoading"}
                <span className="text-muted-foreground">:</span>
                {" status "}
                <span className="text-purple-400">===</span>
                {" "}
                <span className="text-green-400">&apos;loading&apos;</span>
                {",\n    isAuth"}
                <span className="text-muted-foreground">:</span>
                {" status "}
                <span className="text-purple-400">===</span>
                {" "}
                <span className="text-green-400">&apos;authenticated&apos;</span>
                {"\n  }\n}"}
              </pre>
            </div>

            {/* AI tags panel */}
            <div className="border-t border-border px-4 py-3 bg-card">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                AI Generated Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "next-auth",
                  "react",
                  "hook",
                  "authentication",
                  "typescript",
                  "session",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
