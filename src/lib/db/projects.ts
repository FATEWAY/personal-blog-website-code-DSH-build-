import { randomUUID } from "node:crypto";
import { NotFoundError } from "@/lib/errors";
import type { Project } from "@/lib/types";
import type { ProjectInput } from "@/lib/validation";
import { getDb, nowIso, type DB } from "./client";

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  tech: string;
  cover_image: string | null;
  demo_url: string | null;
  repo_url: string | null;
  sort_order: number;
  visible: number;
  created_at: string;
  updated_at: string;
};

function mapProject(row: ProjectRow): Project {
  let tech: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.tech);
    if (Array.isArray(parsed)) tech = parsed.filter((item): item is string => typeof item === "string");
  } catch {
    tech = [];
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    tech,
    coverImage: row.cover_image,
    demoUrl: row.demo_url,
    repoUrl: row.repo_url,
    sortOrder: row.sort_order,
    visible: row.visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listVisibleProjects(db: DB = getDb()): Project[] {
  return (
    db
      .prepare("SELECT * FROM projects WHERE visible = 1 ORDER BY sort_order ASC, created_at ASC")
      .all() as ProjectRow[]
  ).map(mapProject);
}

export function listAllProjects(db: DB = getDb()): Project[] {
  return (
    db
      .prepare("SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC")
      .all() as ProjectRow[]
  ).map(mapProject);
}

export function getProject(id: string, db: DB = getDb()): Project | null {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? mapProject(row) : null;
}

function insertProject(input: ProjectInput, id: string, timestamp: string, db: DB): void {
  db.prepare(
    `INSERT INTO projects (
       id, title, description, category, tech, cover_image, demo_url, repo_url,
       sort_order, visible, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.title,
    input.description,
    input.category,
    JSON.stringify(input.tech),
    input.coverImage,
    input.demoUrl,
    input.repoUrl,
    input.sortOrder,
    input.visible ? 1 : 0,
    timestamp,
    timestamp,
  );
}

export function createProject(input: ProjectInput, db: DB = getDb()): Project {
  const id = randomUUID();
  const timestamp = nowIso();
  insertProject(input, id, timestamp, db);
  const project = getProject(id, db);
  if (!project) throw new Error("项目创建失败");
  return project;
}

export function updateProject(id: string, input: ProjectInput, db: DB = getDb()): Project {
  const timestamp = nowIso();
  const result = db
    .prepare(
      `UPDATE projects SET
         title = ?, description = ?, category = ?, tech = ?, cover_image = ?,
         demo_url = ?, repo_url = ?, sort_order = ?, visible = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.title,
      input.description,
      input.category,
      JSON.stringify(input.tech),
      input.coverImage,
      input.demoUrl,
      input.repoUrl,
      input.sortOrder,
      input.visible ? 1 : 0,
      timestamp,
      id,
    );
  if (result.changes === 0) throw new NotFoundError("项目不存在或已被删除");
  const project = getProject(id, db);
  if (!project) throw new Error("项目更新失败");
  return project;
}

export function deleteProject(id: string, db: DB = getDb()): void {
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  if (result.changes === 0) throw new NotFoundError("项目不存在或已被删除");
}
