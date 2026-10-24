import path from "node:path";
import GithubSlugger from "github-slugger";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import type { Heading, Root as MdastRoot } from "mdast";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type RenderedMarkdown = {
  html: string;
  headings: TocHeading[];
};

const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "summary",
    "kbd",
    "mark",
    "sup",
    "sub",
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Code language class is preserved; rehype-highlight runs afterwards and
    // only decorates text nodes, so it cannot reintroduce unsafe markup.
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./]],
    a: [...(defaultSchema.attributes?.a ?? []), "title"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const record = node as { type?: string; value?: unknown; alt?: unknown; children?: unknown[] };
  if (record.type === "text" || record.type === "inlineCode") {
    return typeof record.value === "string" ? record.value : "";
  }
  if (record.type === "image") {
    return typeof record.alt === "string" ? record.alt : "";
  }
  if (Array.isArray(record.children)) {
    return record.children.map(nodeText).join("");
  }
  return "";
}

function extractHeadings(markdown: string): TocHeading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastRoot;
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  visit(tree, "heading", (node: Heading) => {
    const text = nodeText(node).trim();
    // rehype-slug generates ids for every heading, so the slugger must see
    // all of them to keep ids identical.
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      headings.push({ id, text, level: node.depth });
    }
  });

  return headings;
}

function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string" || !/^https?:\/\//i.test(href)) return;
      node.properties = {
        ...node.properties,
        target: "_blank",
        rel: ["nofollow", "noopener", "noreferrer"],
      };
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeExternalLinks)
  .use(rehypeStringify);

// Small memoisation cache: article pages are rendered on every request, and
// the same Markdown is often rendered repeatedly (detail page + preview).
const htmlCache = new Map<string, RenderedMarkdown>();
const CACHE_LIMIT = 60;

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const cached = htmlCache.get(markdown);
  if (cached) return cached;

  const headings = extractHeadings(markdown);
  const file = await processor.process(markdown);
  const result: RenderedMarkdown = { html: String(file), headings };

  if (htmlCache.size >= CACHE_LIMIT) {
    const oldest = htmlCache.keys().next().value;
    if (oldest !== undefined) htmlCache.delete(oldest);
  }
  htmlCache.set(markdown, result);
  return result;
}

/** Only used by tests and server-side link checks. */
export function isLocalMediaPath(value: string): boolean {
  if (!value.startsWith("/media/")) return false;
  const normalized = path.posix.normalize(value);
  return normalized === value && !value.includes("..");
}
