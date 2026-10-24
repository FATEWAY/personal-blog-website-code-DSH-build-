---
title: Markdown 渲染的安全边界
slug: markdown-rendering-security
summary: 示例文章：从 remark 到 sanitize 再到代码高亮，解释一条可控的 Markdown 渲染管线如何避免 XSS。
category: Web 安全
tags: 示例, Markdown, XSS
status: published
publishedAt: 2026-10-20T20:15:00+08:00
---

## 渲染管线

文章正文以 Markdown 存储，展示时经过一条固定的管线：

```ts
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, schema)
  .use(rehypeSlug)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true })
  .use(rehypeStringify);
```

每一步的职责都很明确：

1. **解析**：Markdown 转成 mdast，不执行任何内容；
2. **转换**：mdast 转成 hast，`allowDangerousHtml: false` 直接丢弃内嵌 HTML；
3. **净化**：只保留白名单标签、属性和协议；
4. **增强**：在安全结果之上生成标题锚点、代码高亮和链接属性。

## 为什么净化要放在高亮之前

`rehype-highlight` 会向 `<code>` 和 `<span>` 注入 class。这些 class 来自代码解析器，不来自用户输入，因此在高亮之后添加是安全的。

反过来，如果先高亮再净化，净化器需要放行高亮产生的全部属性，反而扩大了攻击面。**先净化不可信内容，再添加可信装饰**，顺序不能反。

## 危险内容会被怎么处理

| 输入 | 结果 |
| --- | --- |
| `<script>alert(1)</script>` | 被当作原始 HTML 丢弃 |
| `<img src=x onerror=...>` | 标签被移除，不保留事件属性 |
| `[链接](javascript:alert(1))` | 协议不在白名单，链接地址被移除 |
| `![](https://example.com/a.png)` | 保留图片，受 CSP 约束 |

注意：Markdown 原生语法可以生成链接和图片，因此协议白名单必须同时覆盖 `href` 和 `src`。

## 链接与图片策略

文章内的渲染结果直接由服务端返回 HTML，不经过 `dangerouslySetInnerHTML` 以外的客户端解析。外部链接统一加上：

```html
<a href="https://example.com" target="_blank" rel="nofollow noopener noreferrer">…</a>
```

CSP 中限制 `img-src`、`script-src` 和 `frame-ancestors`，即使净化器出现漏网之鱼，浏览器仍然会再拦一层。

> 安全不是某一个函数，而是“默认不信任 + 多层限制”的组合。

## 目录与阅读体验

目录标题从同一份 mdast 中抽取，并使用与 `rehype-slug` 相同的 slugger 生成 id，保证目录锚点和正文标题一致。三級及以下标题只参与 id 生成，不进入目录，避免侧栏过长。

代码块保持横向滚动，不强制换行；长行在移动端会撑破布局，滚动容器是最简单的解法。
