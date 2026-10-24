---
title: 从零搭建一个可维护的个人博客系统
slug: building-this-blog
summary: 示例文章：记录这套站点的技术选型、数据模型与认证设计，方便以后回看当时的取舍。
category: 工程实践
tags: 示例, Next.js, SQLite, 架构
status: published
publishedAt: 2026-10-12T10:00:00+08:00
---

## 为什么重新做一遍

个人站点常见的两种状态：一种是静态模板，改一篇文章要重新构建；另一种是功能堆得很满，但每个部分都只完成了一半。

这个项目的目标很明确：**前台负责展示，后台负责维护，任何一篇文章都不需要改代码**。同时控制复杂度，单人博客不需要微服务、消息队列或复杂缓存。

## 技术选型

| 层次 | 选择 | 原因 |
| --- | --- | --- |
| 框架 | Next.js App Router | 服务端渲染、路由和 API 集中在一处 |
| 语言 | TypeScript | 数据边界更清晰 |
| 数据库 | SQLite | 单文件、零运维，适合个人规模 |
| 样式 | Tailwind CSS + 自定义设计令牌 | 保持统一，不引入整套组件库 |

选型的原则不是“看起来先进”，而是每个依赖都能回答一个问题：它解决了什么当前真实存在的问题？

## 数据模型

文章、分类、标签、项目分别建表，文章与标签通过关联表连接：

```sql
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

删除文章时由外键级联清理关联；更新标签之后再清理没有文章引用的标签，避免留下无法管理的孤立数据。

## 认证与安全

后台没有把“路径不公开”当作安全措施。所有管理 API 都在服务端检查会话、请求来源和 CSRF 令牌：

```ts
export async function requireAdminApi(request: NextRequest) {
  assertSameOrigin(request);
  const auth = await authenticateRequest(request);
  if (request.method !== "GET") assertCsrf(request, auth);
  return auth;
}
```

会话令牌只以 SHA-256 哈希形式写入数据库，Cookie 使用 `HttpOnly` 和 `SameSite=Lax`，生产环境自动启用 `Secure`。登录失败按 IP 和账号分别计数，超过阈值后短暂锁定。

## 上线前还要做什么

- [x] 文章 CRUD、发布与下架
- [x] Markdown 渲染、代码高亮、文章目录
- [ ] 图片对象存储（当前保存在本地目录）
- [ ] 访问统计（在没有真实数据前不做展示）

> 本文是初始化时的示例内容，可在后台直接编辑、下架或删除。

## 一次完整的请求会经过什么

以文章详情页为例：

1. 路由匹配 `/blog/[slug]`；
2. 服务端向 SQLite 查询已发布且到达发布时间的文章；
3. Markdown 经过统一管线渲染为 HTML，同时抽取目录标题；
4. 页面输出结构化数据、Open Graph 元信息和阅读进度组件。

整个过程没有客户端数据请求，首屏就是完整内容，对搜索引擎和分享预览都更友好。
