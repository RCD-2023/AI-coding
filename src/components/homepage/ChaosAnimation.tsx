"use client";

import { useEffect, useRef } from "react";

interface IconDef {
  title: string;
  bg: string;
  color: string;
  svg: string;
}

const ICONS: IconDef[] = [
  {
    title: "Notion",
    bg: "#000",
    color: "#fff",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><text x="12" y="17" text-anchor="middle" font-size="15" font-weight="800" font-family="Georgia,serif">N</text></svg>`,
  },
  {
    title: "GitHub",
    bg: "#24292e",
    color: "#fff",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`,
  },
  {
    title: "Slack",
    bg: "#4A154B",
    color: "#fff",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>`,
  },
  {
    title: "VS Code",
    bg: "#0078D7",
    color: "#fff",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>`,
  },
  {
    title: "Browser Tab",
    bg: "#1565C0",
    color: "#90CAF9",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="17" rx="2"/><path d="M2 8h20"/><circle cx="6" cy="5.5" r="0.8" fill="currentColor"/><circle cx="9" cy="5.5" r="0.8" fill="currentColor"/><circle cx="12" cy="5.5" r="0.8" fill="currentColor"/></svg>`,
  },
  {
    title: "Terminal",
    bg: "#111",
    color: "#22c55e",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  },
  {
    title: "Text File",
    bg: "#374151",
    color: "#9CA3AF",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  },
  {
    title: "Bookmark",
    bg: "#7C3AED",
    color: "#DDD6FE",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 2a2 2 0 0 0-2 2v17l9-4.5 9 4.5V4a2 2 0 0 0-2-2H5z"/></svg>`,
  },
];

const ICON_SIZE = 52;
const SPEED = 1.0;
const REPEL_RADIUS = 110;
const REPEL_FORCE = 4.0;
const MAX_SPEED = 4;
const DAMPING = 0.985;
const MIN_SPEED = 0.25;

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
}

export default function ChaosAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mouseX = -999;
    let mouseY = -999;
    let animationId: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouseX = -999;
      mouseY = -999;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const w = container.offsetWidth || 300;
    const h = container.offsetHeight || 280;

    const particles: Particle[] = ICONS.map((icon) => {
      const el = document.createElement("div");
      el.title = icon.title;
      el.style.cssText = `
        position: absolute;
        width: ${ICON_SIZE}px;
        height: ${ICON_SIZE}px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        background: ${icon.bg};
        color: ${icon.color};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        will-change: transform;
        left: 0;
        top: 0;
      `;
      el.innerHTML = icon.svg;
      container.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = SPEED * (0.6 + Math.random() * 0.8);

      return {
        el,
        x: Math.random() * (w - ICON_SIZE),
        y: Math.random() * (h - ICON_SIZE),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.2,
      };
    });

    function tick() {
      const W = container!.offsetWidth - ICON_SIZE;
      const H = container!.offsetHeight - ICON_SIZE;

      for (const p of particles) {
        const cx = p.x + ICON_SIZE / 2;
        const cy = p.y + ICON_SIZE / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 1) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        p.vx *= DAMPING;
        p.vy *= DAMPING;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < MIN_SPEED) {
          const a = Math.random() * Math.PI * 2;
          p.vx += Math.cos(a) * 0.4;
          p.vy += Math.sin(a) * 0.4;
        }

        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
      }

      animationId = requestAnimationFrame(tick);
    }

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!animationId) animationId = requestAnimationFrame(tick);
          } else {
            if (animationId) {
              cancelAnimationFrame(animationId);
              animationId = null;
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    visibilityObserver.observe(container);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      visibilityObserver.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      particles.forEach((p) => p.el.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ minHeight: 240 }}
    />
  );
}
