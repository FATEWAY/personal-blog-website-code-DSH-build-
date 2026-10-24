-- Photo wall / gallery entries managed from the admin panel.

CREATE TABLE IF NOT EXISTS gallery_items (
  id         TEXT PRIMARY KEY,
  image_url  TEXT NOT NULL,
  caption    TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery_items(visible, sort_order, created_at);
