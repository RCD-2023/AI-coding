import { Code2 } from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Snippets", color: "#3b82f6" },
  { label: "Prompts", color: "#f59e0b" },
  { label: "Commands", color: "#06b6d4" },
  { label: "Notes", color: "#22c55e" },
  { label: "Links", color: "#6366f1" },
];

const CARDS = [
  { title: "useDebounce", meta: "Snippet", color: "#3b82f6" },
  { title: "GPT Reviewer", meta: "Prompt", color: "#f59e0b" },
  { title: "docker prune", meta: "Command", color: "#06b6d4" },
  { title: "Auth Notes", meta: "Note", color: "#22c55e" },
  { title: "MDN Fetch", meta: "Link", color: "#6366f1" },
  { title: "UI Kit", meta: "Image", color: "#ec4899" },
];

export default function DashboardMockup() {
  return (
    <div className="flex h-full rounded-lg overflow-hidden border border-border bg-card text-[10px]">
      {/* Sidebar */}
      <div className="w-20 border-r border-border p-2 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-1 font-bold text-[9px] mb-1 text-foreground">
          <Code2 className="w-2.5 h-2.5" />
          DevStash
        </div>
        {SIDEBAR_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1 px-1 py-0.5 rounded"
            style={{ color: item.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: item.color }}
            />
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-2 grid grid-cols-2 gap-1.5 content-start overflow-hidden">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="border border-border rounded p-1.5 bg-background"
            style={{ borderTopWidth: 2, borderTopColor: card.color }}
          >
            <div className="font-medium truncate text-foreground leading-tight">
              {card.title}
            </div>
            <div
              className="text-[9px] mt-0.5 font-medium"
              style={{ color: card.color }}
            >
              {card.meta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
