import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";

const EXTENSIONS = [StarterKit.configure({ link: { openOnClick: false } }), Placeholder];

/** Renders an Article/Project's Tiptap ProseMirror JSON to trusted HTML —
 *  content is only ever authored by authenticated admins, so raw HTML output
 *  is safe to inject directly (no untrusted user input reaches this). */
export async function renderContentHtml(content: unknown): Promise<string> {
  if (!content || typeof content !== "object") return "";
  const { generateHTML } = await import("@tiptap/html/server");
  try {
    return generateHTML(content as JSONContent, EXTENSIONS);
  } catch {
    return "";
  }
}

/** Rough reading-time estimate from Tiptap JSON, for "N MIN READ" labels. */
export function estimateReadTime(content: unknown): string {
  const words = countWords(content);
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} MIN READ`;
}

function countWords(node: unknown): number {
  if (!node || typeof node !== "object") return 0;
  const n = node as { text?: string; content?: unknown[] };
  let count = n.text ? n.text.trim().split(/\s+/).filter(Boolean).length : 0;
  if (Array.isArray(n.content)) {
    count += n.content.reduce((sum: number, child) => sum + countWords(child), 0);
  }
  return count;
}
