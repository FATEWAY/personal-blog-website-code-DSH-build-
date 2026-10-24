import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown/render";

const article = `# 大标题

## 第一节

正文包含 **粗体**、*斜体* 和 \`inline code\`。

### 小节

\`\`\`ts
const answer: number = 42;
\`\`\`

| 名称 | 值 |
| --- | --- |
| a | 1 |

> 引用内容

- 列表一
- 列表二

[外部链接](https://example.com)
`;

describe("renderMarkdown", () => {
  it("renders GFM, highlights code and extracts a matching table of contents", async () => {
    const { html, headings } = await renderMarkdown(article);

    expect(html).toContain("<h2");
    expect(html).toContain("hljs");
    expect(html).toContain("<table>");
    expect(html).toContain("target=\"_blank\"");
    expect(html).toContain("rel=\"nofollow noopener noreferrer\"");
    expect(headings.map((heading) => heading.text)).toEqual(["第一节", "小节"]);

    for (const heading of headings) {
      expect(html).toContain(`id="${heading.id}"`);
    }
  });

  it("strips raw HTML, event handlers and javascript: URLs", async () => {
    const { html } = await renderMarkdown(`
## 安全

<script>alert("xss")</script>

<img src="x" onerror="alert(1)" />

[点我](javascript:alert(1))

<iframe src="https://evil.example"></iframe>

[正常链接](https://example.com)
`);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<iframe");
    expect(html).toContain("正常链接");
  });

  it("keeps ids stable for duplicate headings", async () => {
    const { html, headings } = await renderMarkdown("## 重复\n\n## 重复");
    expect(headings).toHaveLength(2);
    expect(headings[0].id).not.toBe(headings[1].id);
    expect(html).toContain(headings[0].id);
    expect(html).toContain(headings[1].id);
  });
});
