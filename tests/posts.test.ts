import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import {
  createPost,
  deletePost,
  getAdminPost,
  getAdjacentPosts,
  getDashboardStats,
  getPublishedPostBySlug,
  listCategoriesWithCounts,
  listPublishedPosts,
  setPostStatus,
  updatePost,
} from "@/lib/db/posts";
import type { PostInput } from "@/lib/validation";
import { ConflictError } from "@/lib/errors";

let db: Database.Database;

function postInput(overrides: Partial<PostInput> = {}): PostInput {
  return {
    title: "测试文章",
    slug: "test-post",
    summary: "摘要",
    content: "## 正文\n\n这是一篇用于测试的文章。",
    coverImage: null,
    category: "工程实践",
    tags: ["测试", "SQLite"],
    status: "draft",
    publishedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  db = openDatabase(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

describe("migrations", () => {
  it("is idempotent", () => {
    const second = runMigrations(db);
    expect(second.applied).toEqual([]);
    expect(second.skipped.length).toBeGreaterThan(0);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as { name: string }[];
    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining(["admins", "posts", "post_tags", "projects", "settings", "sessions"]),
    );
  });
});

describe("posts repository", () => {
  it("keeps drafts out of public queries", () => {
    const draft = createPost(postInput(), db);

    expect(getPublishedPostBySlug("test-post", undefined, db)).toBeNull();
    expect(listPublishedPosts({}, db).total).toBe(0);
    expect(getAdminPost(draft.id, db)?.content).toContain("测试");
  });

  it("only exposes published posts after their publish time", () => {
    createPost(
      postInput({
        slug: "future-post",
        status: "published",
        publishedAt: "2030-01-01T00:00:00.000Z",
      }),
      db,
    );

    expect(listPublishedPosts({ now: "2029-12-31T23:59:59.000Z" }, db).total).toBe(0);
    expect(getPublishedPostBySlug("future-post", "2029-12-31T23:59:59.000Z", db)).toBeNull();
    expect(listPublishedPosts({ now: "2030-01-02T00:00:00.000Z" }, db).total).toBe(1);
  });

  it("rejects duplicate slugs with a conflict error", () => {
    createPost(postInput({ slug: "duplicate" }), db);
    expect(() => createPost(postInput({ slug: "duplicate", title: "另一篇" }), db)).toThrowError(
      ConflictError,
    );
  });

  it("detects stale edits", () => {
    const created = createPost(postInput(), db);
    const edited = updatePost(created.id, postInput({ title: "新标题" }), created.updatedAt, db);
    expect(edited.post.title).toBe("新标题");

    expect(() =>
      updatePost(created.id, postInput({ title: "过期写入" }), created.updatedAt, db),
    ).toThrowError(ConflictError);
  });

  it("publishes and unpublishes without losing the timestamp", () => {
    const draft = createPost(postInput({ slug: "toggle-post" }), db);
    expect(draft.publishedAt).toBeNull();

    const published = setPostStatus(draft.id, "published", db);
    expect(published.status).toBe("published");
    expect(published.publishedAt).not.toBeNull();
    expect(listPublishedPosts({}, db).total).toBe(1);

    const unpublished = setPostStatus(draft.id, "draft", db);
    expect(unpublished.status).toBe("draft");
    expect(unpublished.publishedAt).not.toBeNull();
    expect(listPublishedPosts({}, db).total).toBe(0);
  });

  it("cleans up orphan tags after deletion", () => {
    const post = createPost(postInput({ tags: ["仅此一篇"] }), db);
    deletePost(post.id, db);
    const tags = db.prepare("SELECT COUNT(*) AS count FROM tags").get() as { count: number };
    expect(tags.count).toBe(0);
  });

  it("computes category counts for published posts only", () => {
    createPost(
      postInput({
        slug: "published-one",
        status: "published",
        publishedAt: "2026-01-01T00:00:00.000Z",
      }),
      db,
    );
    createPost(postInput({ slug: "draft-one" }), db);

    const categories = listCategoriesWithCounts(db);
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("工程实践");
    expect(categories[0].count).toBe(1);
  });

  it("provides previous and next posts", () => {
    createPost(
      postInput({ slug: "old", status: "published", publishedAt: "2026-01-01T00:00:00.000Z" }),
      db,
    );
    const middle = createPost(
      postInput({ slug: "middle", status: "published", publishedAt: "2026-02-01T00:00:00.000Z" }),
      db,
    );
    createPost(
      postInput({ slug: "new", status: "published", publishedAt: "2026-03-01T00:00:00.000Z" }),
      db,
    );

    const adjacent = getAdjacentPosts(middle, db);
    expect(adjacent.previous?.slug).toBe("old");
    expect(adjacent.next?.slug).toBe("new");
  });

  it("paginates and reports the real total", () => {
    for (let index = 0; index < 10; index += 1) {
      createPost(
        postInput({
          slug: `page-post-${index}`,
          status: "published",
          publishedAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        }),
        db,
      );
    }

    const page = listPublishedPosts({ page: 2, pageSize: 3 }, db);
    expect(page.total).toBe(10);
    expect(page.posts).toHaveLength(3);
    expect(page.totalPages).toBe(4);
  });

  it("returns real dashboard counts", () => {
    createPost(postInput({ slug: "dash-draft" }), db);
    createPost(
      postInput({
        slug: "dash-published",
        status: "published",
        publishedAt: "2026-01-01T00:00:00.000Z",
      }),
      db,
    );

    const stats = getDashboardStats(db);
    expect(stats.totalPosts).toBe(2);
    expect(stats.publishedPosts).toBe(1);
    expect(stats.draftPosts).toBe(1);
  });
});
