-- Group gallery photos into albums by category.

ALTER TABLE gallery_items ADD COLUMN category TEXT NOT NULL DEFAULT '未分类';
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_items(category, sort_order);
