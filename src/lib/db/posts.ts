import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type {
  AdjacentPosts,
  Category,
  CategoryWithCount,
  DashboardStats,
  PostDetail,
  PostListResult,
  PostStatus,
  PostSummary,
  Tag,
  TagWithCount,
} from "@/lib/types";
import { calculateReadingMinutes, slugify } from "@/lib/utils";
import type { PostInput } from "@/lib/validation";
import { getDb, nowIso, type DB } from "./client";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content?: string;
  cover_image: string | null;
  status: PostStatus;
  reading_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  tags_json: string | null;
};

const POST_SELECT = `
  SELECT p.id, p.slug, p.title, p.summary, p.cover_image, p.status, p.reading_minutes,
         p.published_at, p.created_at, p.updated_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
         COALESCE((
           SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'slug', t.slug))
           FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
           WHERE pt.post_id = p.id
         ), '[]') AS tags_json
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
`;

function parseTags(raw: string | null): Tag[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Tag => {
        if (!item || typeof item !== "object") return false;
        const tag = item as Record<string, unknown>;
        return typeof tag.id === "string" && typeof tag.name === "string" && typeof tag.slug === "string";
      })
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  } catch {
    return [];
  }
}

function mapPostRow(row: PostRow): PostSummary {
  const category: Category | null =
    row.category_id && row.category_name && row.category_slug
      ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
      : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImage: row.cover_image,
    status: row.status,
    category,
    tags: parseTags(row.tags_json),
    readingMinutes: row.reading_minutes,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPostDetail(row: PostRow): PostDetail {
  return { ...mapPostRow(row), content: row.content ?? "" };
}

function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}

export type PublicListOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  tag?: string;
  now?: string;
};

const PUBLIC_PAGE_SIZE = 9;

export function listPublishedPosts(options: PublicListOptions = {}, db: DB = getDb()): PostListResult {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const pageSize = Math.min(24, Math.max(1, Math.trunc(options.pageSize ?? PUBLIC_PAGE_SIZE)));
  const now = options.now ?? nowIso();
  const query = options.query?.trim() ?? "";

  const where: string[] = [
    "p.status = 'published'",
    "p.published_at IS NOT NULL",
    "p.published_at <= ?",
  ];
  const params: Array<string | number> = [now];

  if (query) {
    const pattern = likePattern(query);
    where.push("(p.title LIKE ? ESCAPE '\\' OR p.summary LIKE ? ESCAPE '\\' OR p.content LIKE ? ESCAPE '\\')");
    params.push(pattern, pattern, pattern);
  }
  if (options.category) {
    where.push("c.slug = ?");
    params.push(options.category);
  }
  if (options.tag) {
    where.push(
      "EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.slug = ?)",
    );
    params.push(options.tag);
  }

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`,
      )
      .get(...params) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `${POST_SELECT} WHERE ${whereSql} ORDER BY p.published_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, (page - 1) * pageSize) as PostRow[];

  return {
    posts: rows.map(mapPostRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function listLatestPublished(limit = 3, db: DB = getDb()): PostSummary[] {
  const now = nowIso();
  const rows = db
    .prepare(
      `${POST_SELECT}
       WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= ?
       ORDER BY p.published_at DESC, p.id DESC LIMIT ?`,
    )
    .all(now, Math.min(30, Math.max(1, limit))) as PostRow[];
  return rows.map(mapPostRow);
}

export function listPublishedSlugs(
  db: DB = getDb(),
): Array<{ slug: string; updatedAt: string; publishedAt: string | null }> {
  return db
    .prepare(
      `SELECT slug, updated_at AS updatedAt, published_at AS publishedAt
       FROM posts
       WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= ?
       ORDER BY published_at DESC`,
    )
    .all(nowIso()) as Array<{ slug: string; updatedAt: string; publishedAt: string | null }>;
}

export function getPublishedPostBySlug(slug: string, now = nowIso(), db: DB = getDb()): PostDetail | null {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              COALESCE((
                SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'slug', t.slug))
                FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                WHERE pt.post_id = p.id
              ), '[]') AS tags_json
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= ?`,
    )
    .get(slug, now) as PostRow | undefined;
  return row ? mapPostDetail(row) : null;
}

export function getAdjacentPosts(post: PostDetail, db: DB = getDb()): AdjacentPosts {
  const previous = db
    .prepare(
      `SELECT slug, title FROM posts
       WHERE status = 'published' AND published_at IS NOT NULL
         AND (published_at < ? OR (published_at = ? AND id < ?))
       ORDER BY published_at DESC, id DESC LIMIT 1`,
    )
    .get(post.publishedAt, post.publishedAt, post.id) as { slug: string; title: string } | undefined;

  const next = db
    .prepare(
      `SELECT slug, title FROM posts
       WHERE status = 'published' AND published_at IS NOT NULL
         AND (published_at > ? OR (published_at = ? AND id > ?))
       ORDER BY published_at ASC, id ASC LIMIT 1`,
    )
    .get(post.publishedAt, post.publishedAt, post.id) as { slug: string; title: string } | undefined;

  return { previous: previous ?? null, next: next ?? null };
}

export function listCategoriesWithCounts(db: DB = getDb()): CategoryWithCount[] {
  const now = nowIso();
  return db
    .prepare(
      `SELECT c.id, c.name, c.slug, COUNT(p.id) AS count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id
         AND p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= ?
       GROUP BY c.id
       ORDER BY count DESC, c.name ASC`,
    )
    .all(now)
    .filter((row) => (row as CategoryWithCount).count > 0) as CategoryWithCount[];
}

export function listTagsWithCounts(db: DB = getDb()): TagWithCount[] {
  const now = nowIso();
  return db
    .prepare(
      `SELECT t.id, t.name, t.slug, COUNT(p.id) AS count
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       JOIN posts p ON p.id = pt.post_id
         AND p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= ?
       GROUP BY t.id
       ORDER BY count DESC, t.name ASC
       LIMIT 40`,
    )
    .all(now) as TagWithCount[];
}

export function searchPublished(query: string, limit = 6, db: DB = getDb()): PostSummary[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const pattern = likePattern(trimmed);
  const rows = db
    .prepare(
      `${POST_SELECT}
       WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= ?
         AND (p.title LIKE ? ESCAPE '\\' OR p.summary LIKE ? ESCAPE '\\')
       ORDER BY p.published_at DESC LIMIT ?`,
    )
    .all(nowIso(), pattern, pattern, Math.min(20, Math.max(1, limit))) as PostRow[];
  return rows.map(mapPostRow);
}

export function listAdminPosts(
  options: { query?: string; status?: PostStatus | "all"; page?: number; pageSize?: number } = {},
  db: DB = getDb(),
): PostListResult {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.trunc(options.pageSize ?? 50)));
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (options.query?.trim()) {
    const pattern = likePattern(options.query.trim());
    where.push("(p.title LIKE ? ESCAPE '\\' OR p.slug LIKE ? ESCAPE '\\')");
    params.push(pattern, pattern);
  }
  if (options.status && options.status !== "all") {
    where.push("p.status = ?");
    params.push(options.status);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = (
    db.prepare(`SELECT COUNT(*) AS count FROM posts p ${whereSql}`).get(...params) as { count: number }
  ).count;

  const rows = db
    .prepare(
      `${POST_SELECT} ${whereSql} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, (page - 1) * pageSize) as PostRow[];

  return {
    posts: rows.map(mapPostRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function getAdminPost(id: string, db: DB = getDb()): PostDetail | null {
  const row = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              COALESCE((
                SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'slug', t.slug))
                FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                WHERE pt.post_id = p.id
              ), '[]') AS tags_json
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
    )
    .get(id) as PostRow | undefined;
  return row ? mapPostDetail(row) : null;
}

function ensureEntitySlug(
  db: DB,
  table: "categories" | "tags",
  base: string,
  fallbackPrefix: string,
): string {
  const baseSlug = slugify(base) || `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;
  let candidate = baseSlug.slice(0, 70);
  for (let index = 2; index < 100; index += 1) {
    const existing = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate);
    if (!existing) return candidate;
    candidate = `${baseSlug.slice(0, 70)}-${index}`;
  }
  return `${baseSlug.slice(0, 60)}-${randomUUID().slice(0, 6)}`;
}

function ensureCategoryId(db: DB, name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = db
    .prepare("SELECT id FROM categories WHERE name = ? COLLATE NOCASE")
    .get(trimmed) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = randomUUID();
  db.prepare("INSERT INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    trimmed,
    ensureEntitySlug(db, "categories", trimmed, "category"),
    nowIso(),
  );
  return id;
}

function ensureTagIds(db: DB, names: string[]): string[] {
  const ids: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const existing = db
      .prepare("SELECT id FROM tags WHERE name = ? COLLATE NOCASE")
      .get(trimmed) as { id: string } | undefined;
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const id = randomUUID();
    db.prepare("INSERT INTO tags (id, name, slug, created_at) VALUES (?, ?, ?, ?)").run(
      id,
      trimmed,
      ensureEntitySlug(db, "tags", trimmed, "tag"),
      nowIso(),
    );
    ids.push(id);
  }
  return ids;
}

function syncPostTags(db: DB, postId: string, tagIds: string[]): void {
  db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(postId);
  const insert = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  for (const tagId of tagIds) insert.run(postId, tagId);
}

function cleanupOrphanTags(db: DB): void {
  db.prepare("DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM post_tags)").run();
}

function assertSlugAvailable(db: DB, slug: string, excludeId?: string): void {
  const existing = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug) as
    | { id: string }
    | undefined;
  if (existing && existing.id !== excludeId) {
    throw new ConflictError("这个 slug 已被其他文章使用", "SLUG_TAKEN", { slug });
  }
}

export function createPost(input: PostInput, db: DB = getDb()): PostDetail {
  assertSlugAvailable(db, input.slug);
  const id = randomUUID();
  const timestamp = nowIso();
  const readingMinutes = calculateReadingMinutes(input.content);

  const create = db.transaction(() => {
    const categoryId = ensureCategoryId(db, input.category);
    const tagIds = ensureTagIds(db, input.tags);

    db.prepare(
      `INSERT INTO posts (
         id, slug, title, summary, content, cover_image, category_id, status,
         reading_minutes, published_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.slug,
      input.title,
      input.summary,
      input.content,
      input.coverImage,
      categoryId,
      input.status,
      readingMinutes,
      input.publishedAt,
      timestamp,
      timestamp,
    );

    syncPostTags(db, id, tagIds);
  });

  try {
    create();
  } catch (error) {
    if (error instanceof ConflictError) throw error;
    if (isUniqueConstraint(error)) {
      throw new ConflictError("这个 slug 已被其他文章使用", "SLUG_TAKEN", { slug: input.slug });
    }
    throw error;
  }

  const post = getAdminPost(id, db);
  if (!post) throw new Error("文章创建失败");
  return post;
}

function nextUpdatedAt(previous: string): string {
  const now = Date.now();
  const previousMs = new Date(previous).getTime();
  // ISO timestamps have millisecond precision; guarantee that an update always
  // produces a new value so optimistic concurrency checks cannot silently pass.
  const next = Number.isFinite(previousMs) && now <= previousMs ? previousMs + 1 : now;
  return new Date(next).toISOString();
}

export type UpdateResult = {
  post: PostDetail;
  previousSlug: string;
};

export function updatePost(
  id: string,
  input: PostInput,
  expectedUpdatedAt?: string | null,
  db: DB = getDb(),
): UpdateResult {
  const current = getAdminPost(id, db);
  if (!current) throw new NotFoundError("文章不存在或已被删除");

  if (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt) {
    throw new ConflictError("这篇文章已在其他页面被修改，请刷新后重试", "STALE_POST", {
      currentUpdatedAt: current.updatedAt,
    });
  }

  assertSlugAvailable(db, input.slug, id);
  const readingMinutes = calculateReadingMinutes(input.content);
  const updatedAt = nextUpdatedAt(current.updatedAt);

  const update = db.transaction(() => {
    const categoryId = ensureCategoryId(db, input.category);
    const tagIds = ensureTagIds(db, input.tags);

    db.prepare(
      `UPDATE posts SET
         slug = ?, title = ?, summary = ?, content = ?, cover_image = ?, category_id = ?,
         status = ?, reading_minutes = ?, published_at = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      input.slug,
      input.title,
      input.summary,
      input.content,
      input.coverImage,
      categoryId,
      input.status,
      readingMinutes,
      input.publishedAt,
      updatedAt,
      id,
    );

    syncPostTags(db, id, tagIds);
    cleanupOrphanTags(db);
  });

  try {
    update();
  } catch (error) {
    if (error instanceof ConflictError) throw error;
    if (isUniqueConstraint(error)) {
      throw new ConflictError("这个 slug 已被其他文章使用", "SLUG_TAKEN", { slug: input.slug });
    }
    throw error;
  }

  const post = getAdminPost(id, db);
  if (!post) throw new Error("文章更新失败");
  return { post, previousSlug: current.slug };
}

export function setPostStatus(id: string, status: PostStatus, db: DB = getDb()): PostDetail {
  const current = getAdminPost(id, db);
  if (!current) throw new NotFoundError("文章不存在或已被删除");

  if (status === "published" && !current.content.trim()) {
    throw new ConflictError("正文为空，无法发布", "EMPTY_CONTENT");
  }

  const updatedAt = nextUpdatedAt(current.updatedAt);
  const publishedAt = status === "published" ? current.publishedAt ?? updatedAt : current.publishedAt;
  db.prepare("UPDATE posts SET status = ?, published_at = ?, updated_at = ? WHERE id = ?").run(
    status,
    publishedAt,
    updatedAt,
    id,
  );

  const post = getAdminPost(id, db);
  if (!post) throw new Error("文章状态更新失败");
  return post;
}

export function deletePost(id: string, db: DB = getDb()): void {
  const remove = db.transaction(() => {
    const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    if (result.changes === 0) throw new NotFoundError("文章不存在或已被删除");
    cleanupOrphanTags(db);
  });
  remove();
}

export function getDashboardStats(db: DB = getDb()): DashboardStats {
  const counts = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts
       FROM posts`,
    )
    .get() as { total: number; published: number | null; drafts: number | null };

  const recentUpdated = db
    .prepare(`${POST_SELECT} ORDER BY p.updated_at DESC LIMIT 5`)
    .all() as PostRow[];

  const recentPublished = db
    .prepare(
      `${POST_SELECT} WHERE p.status = 'published' ORDER BY p.published_at DESC, p.updated_at DESC LIMIT 5`,
    )
    .all() as PostRow[];

  const projectCount = db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number };
  const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number };
  const tagCount = db.prepare("SELECT COUNT(*) AS count FROM tags").get() as { count: number };

  return {
    totalPosts: counts.total,
    publishedPosts: counts.published ?? 0,
    draftPosts: counts.drafts ?? 0,
    totalProjects: projectCount.count,
    totalCategories: categoryCount.count,
    totalTags: tagCount.count,
    recentUpdated: recentUpdated.map(mapPostRow),
    recentPublished: recentPublished.map(mapPostRow),
  };
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code.startsWith("SQLITE_CONSTRAINT")
  );
}
