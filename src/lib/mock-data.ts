export const mockUser = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

export const mockItemTypes = [
  { id: "type_snippet", name: "Snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { id: "type_prompt", name: "Prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { id: "type_command", name: "Command", icon: "Terminal", color: "#f97316", isSystem: true },
  { id: "type_note", name: "Note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { id: "type_link", name: "Link", icon: "Link", color: "#10b981", isSystem: true },
  { id: "type_file", name: "File", icon: "File", color: "#6b7280", isSystem: true },
  { id: "type_image", name: "Image", icon: "Image", color: "#ec4899", isSystem: true },
];

export const mockItems = [
  {
    id: "item_1",
    title: "useAuth Hook",
    contentType: "TEXT",
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthP')
  }
  return context
}`,
    description: "Custom authentication hook for React applications",
    language: "typescript",
    isFavorite: true,
    isPinned: true,
    itemTypeId: "type_snippet",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_react_patterns"],
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "item_2",
    title: "API Error Handling Pattern",
    contentType: "TEXT",
    content: `async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(res.statusText)
      return await res.json()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 2 ** i * 1000))
    }
  }
}`,
    description: "Fetch wrapper with exponential backoff retry logic",
    language: "javascript",
    isFavorite: false,
    isPinned: true,
    itemTypeId: "type_snippet",
    tags: ["fetch", "error-handling", "retry"],
    collectionIds: ["col_react_patterns"],
    createdAt: "2024-01-12T00:00:00.000Z",
    updatedAt: "2024-01-12T00:00:00.000Z",
  },
  {
    id: "item_3",
    title: "Git stash with message",
    contentType: "TEXT",
    content: "git stash push -m 'your message here'",
    description: "Stash changes with a descriptive message",
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_command",
    tags: ["git", "stash"],
    collectionIds: ["col_git_commands"],
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "item_4",
    title: "Explain this code",
    contentType: "TEXT",
    content:
      "Explain the following code in simple terms. Describe what it does, why it does it, and any potential issues:\n\n```\n{{code}}\n```",
    description: "General code explanation prompt",
    language: null,
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_prompt",
    tags: ["code", "explain", "ai"],
    collectionIds: ["col_ai_prompts"],
    createdAt: "2024-01-08T00:00:00.000Z",
    updatedAt: "2024-01-08T00:00:00.000Z",
  },
  {
    id: "item_5",
    title: "Python list comprehension",
    contentType: "TEXT",
    content: "squares = [x**2 for x in range(10) if x % 2 == 0]",
    description: "Filter and transform a list in one line",
    language: "python",
    isFavorite: false,
    isPinned: false,
    itemTypeId: "type_snippet",
    tags: ["python", "list", "comprehension"],
    collectionIds: ["col_python_snippets"],
    createdAt: "2024-01-06T00:00:00.000Z",
    updatedAt: "2024-01-06T00:00:00.000Z",
  },
];

export const mockCollections = [
  {
    id: "col_react_patterns",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
    itemTypeIds: ["type_snippet", "type_command", "type_link"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "col_python_snippets",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
    itemTypeIds: ["type_snippet"],
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-06T00:00:00.000Z",
  },
  {
    id: "col_context_files",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
    itemTypeIds: ["type_file"],
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z",
  },
  {
    id: "col_interview_prep",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
    itemTypeIds: ["type_snippet", "type_command", "type_link", "type_image"],
    createdAt: "2024-01-04T00:00:00.000Z",
    updatedAt: "2024-01-04T00:00:00.000Z",
  },
  {
    id: "col_git_commands",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
    itemTypeIds: ["type_command"],
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "col_ai_prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
    itemTypeIds: ["type_prompt"],
    createdAt: "2024-01-06T00:00:00.000Z",
    updatedAt: "2024-01-08T00:00:00.000Z",
  },
];

export const mockTypeCounts: Record<string, number> = {
  type_snippet: 24,
  type_prompt: 18,
  type_command: 15,
  type_note: 12,
  type_file: 5,
  type_image: 3,
  type_link: 8,
};
