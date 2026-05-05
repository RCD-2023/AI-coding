import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ContentType } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── System Item Types ────────────────────────────────────────────────────────

const SYSTEM_TYPES = [
  { name: "snippet", icon: "Code",       color: "#3b82f6" },
  { name: "prompt",  icon: "Sparkles",   color: "#8b5cf6" },
  { name: "command", icon: "Terminal",   color: "#f97316" },
  { name: "note",    icon: "StickyNote", color: "#fde047" },
  { name: "file",    icon: "File",       color: "#6b7280" },
  { name: "image",   icon: "Image",      color: "#ec4899" },
  { name: "link",    icon: "Link",       color: "#10b981" },
];

async function seedSystemTypes() {
  for (const type of SYSTEM_TYPES) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });
    if (!existing) {
      await prisma.itemType.create({ data: { ...type, isSystem: true, userId: null } });
    }
  }
  console.log("✓ System item types");
}

// ─── Demo User ────────────────────────────────────────────────────────────────

async function seedDemoUser() {
  // Delete existing demo user (cascade removes their items/collections)
  await prisma.user.deleteMany({ where: { email: "demo@devstash.io" } });

  const hashedPassword = await bcrypt.hash("12345678", 12);

  const user = await prisma.user.create({
    data: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  console.log("✓ Demo user");
  return user;
}

// ─── Collections & Items ──────────────────────────────────────────────────────

async function seedCollections(userId: string, typeMap: Record<string, string>) {
  // ── React Patterns ──────────────────────────────────────────────────────────
  const reactPatterns = await prisma.collection.create({
    data: { name: "React Patterns", description: "Reusable React patterns and hooks", userId },
  });

  const reactItems = await prisma.item.createManyAndReturn({
    data: [
      {
        title: "useDebounce & useLocalStorage Hooks",
        contentType: ContentType.TEXT,
        language: "typescript",
        userId,
        itemTypeId: typeMap.snippet,
        content: `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    setStoredValue(value);
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue] as const;
}`,
      },
      {
        title: "Generic Context Provider Pattern",
        contentType: ContentType.TEXT,
        language: "typescript",
        userId,
        itemTypeId: typeMap.snippet,
        content: `import React, { createContext, useContext, useState } from "react";

function createCtx<T>(defaultValue: T) {
  const Ctx = createContext<{
    state: T;
    setState: React.Dispatch<React.SetStateAction<T>>;
  } | null>(null);

  const Provider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<T>(defaultValue);
    return <Ctx.Provider value={{ state, setState }}>{children}</Ctx.Provider>;
  };

  const useCtx = () => {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useCtx must be used inside Provider");
    return ctx;
  };

  return [Provider, useCtx] as const;
}

// Usage
const [ThemeProvider, useTheme] = createCtx<"dark" | "light">("dark");`,
      },
      {
        title: "TypeScript Utility Functions",
        contentType: ContentType.TEXT,
        language: "typescript",
        userId,
        itemTypeId: typeMap.snippet,
        content: `export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  return str.length > length ? \`\${str.slice(0, length)}...\` : str;
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    acc[group] = [...(acc[group] ?? []), item];
    return acc;
  }, {});
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as Pick<T, K>);
}`,
      },
    ],
  });

  for (const item of reactItems) {
    await prisma.itemCollection.create({
      data: { itemId: item.id, collectionId: reactPatterns.id },
    });
  }

  // ── AI Workflows ─────────────────────────────────────────────────────────────
  const aiWorkflows = await prisma.collection.create({
    data: { name: "AI Workflows", description: "AI prompts and workflow automations", userId },
  });

  const aiItems = await prisma.item.createManyAndReturn({
    data: [
      {
        title: "Code Review Prompt",
        contentType: ContentType.TEXT,
        userId,
        itemTypeId: typeMap.prompt,
        content: `You are an expert code reviewer. Review the following code for:

- **Security vulnerabilities** (injections, exposed secrets, auth gaps)
- **Performance issues** (unnecessary re-renders, N+1 queries, blocking ops)
- **Code clarity** (naming, structure, complexity)
- **Best practices** (patterns, error handling, types)

For each issue found:
1. Identify the problem and its location
2. Explain why it's an issue
3. Provide a corrected version with a brief explanation

Code to review:
[paste code here]`,
      },
      {
        title: "Documentation Generator",
        contentType: ContentType.TEXT,
        userId,
        itemTypeId: typeMap.prompt,
        content: `Generate concise documentation for the following code. Include:

**Purpose** — What it does in one sentence.
**Parameters** — Name, type, and description for each.
**Returns** — Type and description.
**Example** — A realistic usage example.
**Edge cases** — Notable limitations or gotchas.

Keep it developer-focused: avoid filler, be precise.

Code:
[paste code here]`,
      },
      {
        title: "Refactoring Assistant",
        contentType: ContentType.TEXT,
        userId,
        itemTypeId: typeMap.prompt,
        content: `Analyze the following code and suggest refactoring improvements. Focus on:

1. Reducing complexity — simplify conditionals, extract helpers
2. Removing duplication — apply DRY where it adds clarity
3. Improving type safety — tighten TypeScript types
4. Applying patterns — where a design pattern genuinely helps
5. Readability — better naming, smaller functions

Provide the refactored version with inline comments explaining key changes. If a change is debatable, note the tradeoff.

Original code:
[paste code here]`,
      },
    ],
  });

  for (const item of aiItems) {
    await prisma.itemCollection.create({
      data: { itemId: item.id, collectionId: aiWorkflows.id },
    });
  }

  // ── DevOps ────────────────────────────────────────────────────────────────────
  const devops = await prisma.collection.create({
    data: { name: "DevOps", description: "Infrastructure and deployment resources", userId },
  });

  const devopsItems = await prisma.item.createManyAndReturn({
    data: [
      {
        title: "Multi-stage Next.js Dockerfile",
        contentType: ContentType.TEXT,
        language: "dockerfile",
        userId,
        itemTypeId: typeMap.snippet,
        content: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
      },
      {
        title: "Docker Build & Deploy",
        contentType: ContentType.TEXT,
        language: "bash",
        userId,
        itemTypeId: typeMap.command,
        content: `# Build, tag and push image, then roll out
IMAGE=myapp
REGISTRY=ghcr.io/my-org
TAG=$(git rev-parse --short HEAD)

docker build -t $IMAGE:$TAG .
docker tag $IMAGE:$TAG $REGISTRY/$IMAGE:$TAG
docker tag $IMAGE:$TAG $REGISTRY/$IMAGE:latest
docker push $REGISTRY/$IMAGE:$TAG
docker push $REGISTRY/$IMAGE:latest

# Kubernetes rollout
kubectl set image deployment/$IMAGE $IMAGE=$REGISTRY/$IMAGE:$TAG
kubectl rollout status deployment/$IMAGE`,
      },
      {
        title: "Docker Documentation",
        contentType: ContentType.URL,
        url: "https://docs.docker.com/",
        userId,
        itemTypeId: typeMap.link,
        description: "Official Docker documentation — engine, compose, and registry",
      },
      {
        title: "GitHub Actions Docs",
        contentType: ContentType.URL,
        url: "https://docs.github.com/en/actions",
        userId,
        itemTypeId: typeMap.link,
        description: "GitHub Actions — CI/CD workflows, triggers, reusable actions",
      },
    ],
  });

  for (const item of devopsItems) {
    await prisma.itemCollection.create({
      data: { itemId: item.id, collectionId: devops.id },
    });
  }

  // ── Terminal Commands ─────────────────────────────────────────────────────────
  const terminalCmds = await prisma.collection.create({
    data: {
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId,
    },
  });

  const terminalItems = await prisma.item.createManyAndReturn({
    data: [
      {
        title: "Git Productivity Commands",
        contentType: ContentType.TEXT,
        language: "bash",
        userId,
        itemTypeId: typeMap.command,
        content: `# Interactive rebase to squash/reorder last N commits
git rebase -i HEAD~3

# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Find which commit introduced a string
git log -S "search_string" --all --oneline

# Delete all local branches already merged to main
git branch --merged | grep -v '\\*\\|main\\|master' | xargs git branch -d

# Stash with a descriptive message
git stash push -m "WIP: feature description"

# Show all stashes and pop a specific one
git stash list
git stash pop stash@{2}`,
      },
      {
        title: "Docker Utility Commands",
        contentType: ContentType.TEXT,
        language: "bash",
        userId,
        itemTypeId: typeMap.command,
        content: `# Remove all stopped containers and dangling images
docker container prune -f && docker image prune -f

# Follow logs for a running container
docker logs -f <container_name>

# Open a shell in a running container
docker exec -it <container_name> sh

# Show all containers with their sizes
docker ps -as

# Remove everything (containers, images, volumes, networks)
docker system prune --volumes -f

# Inspect container environment variables
docker inspect <container_name> | jq '.[0].Config.Env'`,
      },
      {
        title: "Process & Port Management",
        contentType: ContentType.TEXT,
        language: "bash",
        userId,
        itemTypeId: typeMap.command,
        content: `# Find what is using a port
lsof -i :3000

# Kill the process on a specific port
kill -9 $(lsof -t -i:3000)

# List all node processes
ps aux | grep node

# Kill all node processes
pkill -f node

# Watch real-time CPU/memory per process
htop

# Show top 10 memory-hungry processes
ps aux --sort=-%mem | head -10`,
      },
      {
        title: "npm / Package Manager Utilities",
        contentType: ContentType.TEXT,
        language: "bash",
        userId,
        itemTypeId: typeMap.command,
        content: `# Check which packages have newer versions available
npm outdated

# Interactively update all packages to latest
npx npm-check-updates -u && npm install

# Audit and auto-fix vulnerabilities (non-breaking only)
npm audit fix

# List globally installed packages (top-level only)
npm list -g --depth=0

# Clear the npm cache
npm cache clean --force

# Find and remove duplicate packages
npm dedupe

# Show why a package was installed (dependency chain)
npm why <package-name>`,
      },
    ],
  });

  for (const item of terminalItems) {
    await prisma.itemCollection.create({
      data: { itemId: item.id, collectionId: terminalCmds.id },
    });
  }

  // ── Design Resources ──────────────────────────────────────────────────────────
  const designResources = await prisma.collection.create({
    data: { name: "Design Resources", description: "UI/UX resources and references", userId },
  });

  const designItems = await prisma.item.createManyAndReturn({
    data: [
      {
        title: "Tailwind CSS Docs",
        contentType: ContentType.URL,
        url: "https://tailwindcss.com/docs",
        userId,
        itemTypeId: typeMap.link,
        description: "Full Tailwind CSS documentation — utilities, configuration, and plugins",
      },
      {
        title: "shadcn/ui",
        contentType: ContentType.URL,
        url: "https://ui.shadcn.com",
        userId,
        itemTypeId: typeMap.link,
        description: "Beautifully designed components built with Radix UI and Tailwind CSS",
      },
      {
        title: "Radix UI Primitives",
        contentType: ContentType.URL,
        url: "https://www.radix-ui.com/primitives",
        userId,
        itemTypeId: typeMap.link,
        description: "Unstyled, accessible UI primitives — the foundation of shadcn/ui",
      },
      {
        title: "Lucide Icons",
        contentType: ContentType.URL,
        url: "https://lucide.dev/icons",
        userId,
        itemTypeId: typeMap.link,
        description: "Open-source icon library used throughout this project",
      },
    ],
  });

  for (const item of designItems) {
    await prisma.itemCollection.create({
      data: { itemId: item.id, collectionId: designResources.id },
    });
  }

  console.log("✓ Collections and items");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n");

  await seedSystemTypes();

  const user = await seedDemoUser();

  // Build a name → id map for system types
  const types = await prisma.itemType.findMany({ where: { userId: null } });
  const typeMap = Object.fromEntries(types.map((t) => [t.name, t.id]));

  await seedCollections(user.id, typeMap);

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());