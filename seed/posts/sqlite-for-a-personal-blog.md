---
title: SQLite 在个人博客里的正确打开方式
slug: sqlite-for-a-personal-blog
summary: 示例文章：单文件数据库并不等于可以随便用，WAL、迁移、备份和边界条件都值得认真对待。
category: 数据库
tags: 示例, SQLite, 性能
status: published
publishedAt: 2026-10-16T09:30:00+08:00
---

## 单文件不等于随便用

SQLite 非常适合个人博客：没有独立数据库进程，备份就是复制文件，查询性能对几千篇文章而言绰绰有余。

但它仍然是一个需要正确配置的数据库。几个几乎必开的设置：

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

- `WAL` 让读写可以并行，页面渲染时不会阻塞后台保存；
- `foreign_keys` 默认是关闭的，不显式开启，级联删除不会生效；
- `busy_timeout` 避免偶发锁冲突直接抛错。

## 用事务包住写操作

一次“更新文章 + 重新关联标签”包含多条语句。如果中途失败，文章内容和标签就会出现不一致：

```ts
const update = db.transaction(() => {
  db.prepare("UPDATE posts SET title = ?, updated_at = ? WHERE id = ?")
    .run(input.title, updatedAt, id);
  db.prepare("DELETE FROM post_tags WHERE post_id = ?").run(id);
  for (const tagId of tagIds) {
    db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)").run(id, tagId);
  }
});

update();
```

better-sqlite3 的事务是同步的，写法直观，也避免了异步事务常见的并发问题。

## 迁移必须可重复执行

项目启动时不应该依赖某个人记得“手动建表”。每个迁移文件只执行一次，并记录在 `schema_migrations` 中：

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  name       TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

迁移文件按文件名排序，在一个事务里执行，失败则整体回滚。生产环境可以选择构建阶段执行，或在发布流程里显式运行 `npm run db:migrate`。

## 备份与恢复

对 WAL 模式的数据库，直接复制 `.db` 文件可能拿到不一致的快照。更稳妥的方式：

1. 使用 `sqlite3 fateway.db ".backup backup.db"` 生成一致性备份；
2. 或者停掉进程后再复制 `.db`、`.db-wal`、`.db-shm` 三个文件；
3. 同时备份 `storage/uploads` 目录，文章里的图片并不在数据库中。

建议把备份任务写成 cron，保留最近若干份并定期验证恢复流程。

## 什么时候该换掉它

当出现以下情况时，SQLite 不再是合理选择：

- 需要多个应用实例同时写入；
- 写入量非常高，锁竞争明显；
- 需要细粒度的在线权限管理；
- 需要跨机器的高可用。

对一个个人站点来说，这些条件通常很久都不会出现。过早迁移到 PostgreSQL，只会增加运维负担。
