import { Code2, Sparkles, Search, Terminal, FileText, FolderOpen } from "lucide-react";
import FadeIn from "./FadeIn";

const FEATURES = [
  {
    icon: Code2,
    color: "#3b82f6",
    bgOpacity: "rgba(59,130,246,0.12)",
    title: "Code Snippets",
    desc: "Store reusable code with syntax highlighting, language tags, and instant copy. Never rewrite the same function twice.",
  },
  {
    icon: Sparkles,
    color: "#f59e0b",
    bgOpacity: "rgba(245,158,11,0.12)",
    title: "AI Prompts",
    desc: "Build a library of your best prompts with markdown formatting. Reuse them across ChatGPT, Claude, and any AI tool.",
  },
  {
    icon: Search,
    color: "#6366f1",
    bgOpacity: "rgba(99,102,241,0.12)",
    title: "Instant Search",
    desc: "Find anything in milliseconds with full-text search and a Cmd+K command palette across all your content.",
  },
  {
    icon: Terminal,
    color: "#06b6d4",
    bgOpacity: "rgba(6,182,212,0.12)",
    title: "Commands",
    desc: "Save CLI commands with descriptions so you stop Googling the same flags. Copy to clipboard in one click.",
  },
  {
    icon: FileText,
    color: "#94a3b8",
    bgOpacity: "rgba(100,116,139,0.12)",
    title: "Files & Docs",
    desc: "Upload reference docs, design specs, and any file. Preview images directly in the browser with no downloads.",
  },
  {
    icon: FolderOpen,
    color: "#22c55e",
    bgOpacity: "rgba(34,197,94,0.12)",
    title: "Collections",
    desc: "Group related items into collections — React Patterns, AI Workflows, DevOps Playbook. Share with your team.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="text-xs font-semibold tracking-widest text-blue-500 uppercase mb-3">
            Everything You Need
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            One place for every type of knowledge
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stop context-switching between apps. DevStash handles every kind of
            content developers actually save.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <FadeIn key={f.title}>
              <div className="border border-border rounded-xl p-6 bg-card h-full hover:border-border hover:bg-accent/5 transition-colors">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: f.bgOpacity, color: f.color }}
                >
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
