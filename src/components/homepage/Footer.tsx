import { Code2 } from "lucide-react";

const LINKS = [
  {
    heading: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: null },
      { label: "Roadmap", href: null },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Documentation", href: null },
      { label: "Blog", href: null },
      { label: "API", href: null },
      { label: "Status", href: null },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: null },
      { label: "Privacy", href: null },
      { label: "Terms", href: null },
      { label: "Contact", href: null },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Brand */}
          <div className="shrink-0">
            <a href="#" className="flex items-center gap-2 font-semibold text-lg mb-2">
              <Code2 className="w-5 h-5" />
              DevStash
            </a>
            <p className="text-sm text-muted-foreground">
              Your developer knowledge hub.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-10">
            {LINKS.map((col) => (
              <div key={col.heading}>
                <h4 className="text-sm font-semibold mb-4">{col.heading}</h4>
                <ul className="flex flex-col gap-2">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground/50 cursor-default">
                          {item.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          &copy; {year} DevStash. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
