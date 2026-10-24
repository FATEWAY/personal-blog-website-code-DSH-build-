import { createHash, randomUUID } from "node:crypto";
import { NotFoundError } from "@/lib/errors";
import type { GalleryItem } from "@/lib/types";
import type { GalleryInput } from "@/lib/validation";
import { getDb, nowIso, type DB } from "./client";

type GalleryRow = {
  id: string;
  image_url: string;
  category: string;
  caption: string;
  note: string;
  sort_order: number;
  visible: number;
  created_at: string;
  updated_at: string;
};

function mapGalleryItem(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    imageUrl: row.image_url,
    category: row.category,
    caption: row.caption,
    note: row.note,
    sortOrder: row.sort_order,
    visible: row.visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Stable, URL-safe album slug derived from the category name. */
export function galleryCategorySlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  if (base.length >= 2) return base;
  return `album-${createHash("sha1").update(name, "utf8").digest("hex").slice(0, 8)}`;
}

export type GalleryAlbum = {
  name: string;
  slug: string;
  count: number;
  items: GalleryItem[];
};

export function groupGalleryItems(items: GalleryItem[]): GalleryAlbum[] {
  const groups = new Map<string, GalleryItem[]>();
  for (const item of items) {
    const name = item.category.trim() || "未分类";
    const current = groups.get(name);
    if (current) current.push(item);
    else groups.set(name, [item]);
  }

  return Array.from(groups, ([name, albumItems]) => ({
    name,
    slug: galleryCategorySlug(name),
    count: albumItems.length,
    items: albumItems,
  }));
}

export function getGalleryAlbumBySlug(slug: string, db: DB = getDb()): GalleryAlbum | null {
  const albums = groupGalleryItems(listVisibleGallery(db));
  return albums.find((album) => album.slug === slug) ?? null;
}

export function listVisibleGallery(db: DB = getDb()): GalleryItem[] {
  return (
    db
      .prepare(
        "SELECT * FROM gallery_items WHERE visible = 1 ORDER BY sort_order ASC, created_at ASC",
      )
      .all() as GalleryRow[]
  ).map(mapGalleryItem);
}

export function listAllGallery(db: DB = getDb()): GalleryItem[] {
  return (
    db
      .prepare("SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at ASC")
      .all() as GalleryRow[]
  ).map(mapGalleryItem);
}

export function getGalleryItem(id: string, db: DB = getDb()): GalleryItem | null {
  const row = db.prepare("SELECT * FROM gallery_items WHERE id = ?").get(id) as
    | GalleryRow
    | undefined;
  return row ? mapGalleryItem(row) : null;
}

export function createGalleryItem(input: GalleryInput, db: DB = getDb()): GalleryItem {
  const id = randomUUID();
  const timestamp = nowIso();
  db.prepare(
    `INSERT INTO gallery_items (id, image_url, category, caption, note, sort_order, visible, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.imageUrl,
    input.category,
    input.caption,
    input.note,
    input.sortOrder,
    input.visible ? 1 : 0,
    timestamp,
    timestamp,
  );

  const item = getGalleryItem(id, db);
  if (!item) throw new Error("照片创建失败");
  return item;
}

export function updateGalleryItem(id: string, input: GalleryInput, db: DB = getDb()): GalleryItem {
  const result = db
    .prepare(
      `UPDATE gallery_items SET
         image_url = ?, category = ?, caption = ?, note = ?, sort_order = ?, visible = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.imageUrl,
      input.category,
      input.caption,
      input.note,
      input.sortOrder,
      input.visible ? 1 : 0,
      nowIso(),
      id,
    );

  if (result.changes === 0) throw new NotFoundError("照片不存在或已被删除");
  const item = getGalleryItem(id, db);
  if (!item) throw new Error("照片更新失败");
  return item;
}

export function deleteGalleryItem(id: string, db: DB = getDb()): void {
  const result = db.prepare("DELETE FROM gallery_items WHERE id = ?").run(id);
  if (result.changes === 0) throw new NotFoundError("照片不存在或已被删除");
}
