"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { LYNX_STATIC_PAGES } from "@/lib/lynx/config";

/**
 * A tiny, safe renderer for the handful of markdown features LYNX uses: paragraphs, **bold**, *italic*, lists and
 * links. It builds React elements (never HTML strings), so nothing the model writes can inject markup or scripts.
 *
 * Links are the security-relevant part. A link is only rendered as a link when it is a website path LYNX was actually
 * given by the database this turn (or a fixed page). Anything else, including invented paths and other websites,
 * shows as plain text, so the assistant can't send a visitor somewhere it made up.
 */

type LinkCheck = (href: string) => boolean;

const STATIC = new Set<string>(LYNX_STATIC_PAGES);

export function makeLinkCheck(known: readonly string[]): LinkCheck {
  const allowed = new Set([...STATIC, ...known]);
  return (href) => allowed.has(href);
}

const INLINE = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\s][^*\n]*\*)/g;

function renderInline(text: string, isAllowed: LinkCheck, onNavigate: () => void, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key} className="font-semibold">{renderInline(part.slice(2, -2), isAllowed, onNavigate, key)}</strong>;
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/") && !href.startsWith("//") && isAllowed(href)) {
        return (
          <Link
            key={key}
            href={href}
            onClick={onNavigate}
            className="font-medium underline decoration-[#121212]/40 underline-offset-4 transition-colors hover:decoration-[#121212] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
          >
            {label}
          </Link>
        );
      }
      return <Fragment key={key}>{label}</Fragment>;
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

type Block = { kind: "p"; text: string } | { kind: "ul" | "ol"; items: string[] };

function toBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.replace(/\r/g, "").split("\n")) {
    // Headings aren't part of LYNX's style; show them as plain bold-free lines rather than raw # marks.
    const line = raw.replace(/^#{1,6}\s+/, "").trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const number = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];

    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else if (number) {
      if (last?.kind === "ol") last.items.push(number[1]);
      else blocks.push({ kind: "ol", items: [number[1]] });
    } else if (line.trim() === "") {
      blocks.push({ kind: "p", text: "" });
    } else if (last?.kind === "p" && last.text !== "") {
      last.text += `\n${line}`;
    } else {
      blocks.push({ kind: "p", text: line });
    }
  }
  return blocks.filter((b) => b.kind !== "p" || b.text.trim() !== "");
}

export default function Markdown({
  text,
  knownLinks,
  onNavigate,
}: {
  text: string;
  knownLinks: readonly string[];
  onNavigate: () => void;
}) {
  const isAllowed = makeLinkCheck(knownLinks);
  return (
    <div className="flex flex-col gap-2 break-words">
      {toBlocks(text).map((block, i) => {
        const key = `b${i}`;
        if (block.kind === "p") {
          return (
            <p key={key} className="whitespace-pre-line">
              {renderInline(block.text, isAllowed, onNavigate, key)}
            </p>
          );
        }
        const Tag = block.kind;
        return (
          <Tag key={key} className={block.kind === "ul" ? "flex list-disc flex-col gap-1 pl-5 marker:text-[#555]" : "flex list-decimal flex-col gap-1 pl-5 marker:font-mono marker:text-[#555]"}>
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item, isAllowed, onNavigate, `${key}-${j}`)}</li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
