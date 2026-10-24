import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { PostStatus } from "@/lib/types";
import { getDb, type DB } from "./client";
import { runMigrations } from "./migrate";
import { createPost } from "./posts";
import { createProject } from "./projects";
import { loadSiteSettings, saveSiteSettings } from "./settings";

export type SeedResult = {
  insertedPosts: number;
  insertedProjects: number;
  settingsInitialised: boolean;
  skipped: boolean;
};

type SeedPost = {
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  status: PostStatus;
  publishedAt: string | null;
  content: string;
};

function parseFrontMatter(raw: string): { meta: Record<string, string>; content: string } {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) return { meta: {}, content: normalized.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, content: match[2].trim() };
}

function readSeedPosts(directory: string): SeedPost[] {
  if (!fs.existsSync(directory)) return [];
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(directory, file), "utf8");
    const { meta, content } = parseFrontMatter(raw);
    const status: PostStatus = meta.status === "published" ? "published" : "draft";
    return {
      title: meta.title || file.replace(/\.md$/, ""),
      slug: meta.slug || file.replace(/\.md$/, ""),
      summary: meta.summary || "",
      category: meta.category || "",
      tags: (meta.tags || "")
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      status,
      publishedAt:
        status === "published" && meta.publishedAt
          ? new Date(meta.publishedAt).toISOString()
          : null,
      content,
    };
  });
}

const SEED_PROJECTS: Array<{
  title: string;
  description: string;
  category: string;
  tech: string[];
  coverImage: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  sortOrder: number;
  visible: boolean;
}> = [
  {
    title: "fateway.cn 个人站",
    description:
      "示例项目：你现在浏览的站点，包含前台展示、编辑式排版与完整的内容管理后台。",
    category: "网站",
    tech: ["Next.js", "TypeScript", "SQLite"],
    coverImage: null,
    demoUrl: null,
    repoUrl: null,
    sortOrder: 1,
    visible: true,
  },
  {
    title: "Markdown 渲染管线",
    description:
      "示例项目：基于 unified / remark / rehype 的渲染管线，包含 GFM、代码高亮、目录与 XSS 净化。",
    category: "开发工具",
    tech: ["unified", "rehype", "Node.js"],
    coverImage: null,
    demoUrl: null,
    repoUrl: null,
    sortOrder: 2,
    visible: true,
  },
  {
    title: "个人知识库模板",
    description:
      "示例项目：用纯 Markdown 与 Git 组织长期笔记的目录结构和写作模板。",
    category: "效率",
    tech: ["Markdown", "Git"],
    coverImage: null,
    demoUrl: null,
    repoUrl: null,
    sortOrder: 3,
    visible: true,
  },
];

/**
 * Seeds a fresh database with sample content. It is idempotent: if any posts
 * exist nothing is inserted, so it is safe to run repeatedly.
 */
export function seedDatabase(db: DB = getDb(), options: { seedDir?: string } = {}): SeedResult {
  runMigrations(db);

  const postCount = (db.prepare("SELECT COUNT(*) AS count FROM posts").get() as { count: number })
    .count;
  const projectCount = (
    db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number }
  ).count;
  const settingsExists = db.prepare("SELECT COUNT(*) AS count FROM settings").get() as {
    count: number;
  };

  let insertedPosts = 0;
  let skipped = false;

  if (postCount === 0) {
    const seedDir = options.seedDir ?? path.resolve(process.cwd(), "seed", "posts");
    for (const post of readSeedPosts(seedDir)) {
      createPost(
        {
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          content: post.content,
          coverImage: null,
          category: post.category,
          tags: post.tags,
          status: post.status,
          publishedAt: post.publishedAt,
        },
        db,
      );
      insertedPosts += 1;
    }
  } else {
    skipped = true;
  }

  let insertedProjects = 0;
  if (projectCount === 0) {
    for (const project of SEED_PROJECTS) {
      createProject(project, db);
      insertedProjects += 1;
    }
  }

  let settingsInitialised = false;
  if (settingsExists.count === 0) {
    const current = loadSiteSettings(db);
    saveSiteSettings({ ...DEFAULT_SETTINGS, ...current }, db);
    settingsInitialised = true;
  }

  return { insertedPosts, insertedProjects, settingsInitialised, skipped };
}
