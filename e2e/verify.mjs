import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const ADMIN = (process.env.ADMIN_PATH ?? "/admin").replace(/\/$/, "");
const USERNAME = process.env.E2E_USERNAME ?? "fateway";
const PASSWORD = process.env.E2E_PASSWORD;
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const ARTIFACTS = path.resolve("e2e", "artifacts");

if (!PASSWORD) {
  console.error("E2E_PASSWORD 环境变量未设置，无法登录后台。");
  process.exit(1);
}

await fs.mkdir(ARTIFACTS, { recursive: true });

const checks = [];
const consoleErrors = [];
const failedResponses = [];
const pageErrors = [];
let createdPostId = null;
let uploadedMediaUrl = null;
let e2eSlug = "";
let e2eTitle = "";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

async function step(name, fn) {
  process.stdout.write(`\n▶ ${name}\n`);
  try {
    await fn();
    checks.push({ name, ok: true });
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
    process.stdout.write(`  ✗ ${name}: ${error.message}\n`);
    throw error;
  }
}

async function shot(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(ARTIFACTS, name), fullPage });
  process.stdout.write(`  · screenshot ${name}\n`);
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  check(
    size.scrollWidth <= size.innerWidth + 1,
    `${label} 出现横向溢出：${size.scrollWidth} > ${size.innerWidth}`,
  );
}

async function goto(page, urlPath, ready) {
  const response = await page.goto(`${BASE}${urlPath}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  if (ready) await ready();
  await page.waitForTimeout(250);
  return response;
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "zh-CN",
  timezoneId: "Asia/Shanghai",
  reducedMotion: "reduce",
});
try {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
} catch {
  // Clipboard permissions are optional for the verification run.
}

const page = await context.newPage();
page.setDefaultTimeout(30_000);
page.setDefaultNavigationTimeout(45_000);
page.on("console", (message) => {
  if (message.type() === "error") {
    const location = message.location();
    consoleErrors.push(`${message.text()} (@${location.url}:${location.lineNumber})`);
  }
});
page.on("response", (response) => {
  if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
});
page.on("pageerror", (error) => pageErrors.push(error.message));

let csrfToken = "";

try {
  await step("首页渲染、导航、主题与搜索", async () => {
    await goto(page, "/", async () => {
      await page.getByRole("heading", { level: 1 }).first().waitFor();
    });

    const heading = await page.getByRole("heading", { level: 1 }).first().textContent();
    check(Boolean(heading && heading.trim().length > 4), "首页缺少主标题");
    check(await page.locator("#main").count() === 1, "缺少主内容区域");
    check(await page.getByRole("link", { name: "阅读博客" }).first().isVisible(), "缺少主按钮");
    await assertNoOverflow(page, "首页桌面端");
    await shot(page, "home-desktop.png", true);
    await shot(page, "home-hero.png");

    await page.getByRole("button", { name: "切换到深色模式" }).first().click();
    await page.waitForTimeout(350);
    check(
      await page.evaluate(() => document.documentElement.classList.contains("dark")),
      "深色模式未生效",
    );
    await shot(page, "home-dark.png");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    check(
      await page.evaluate(() => document.documentElement.classList.contains("dark")),
      "刷新后主题没有持久化",
    );
    await page.getByRole("button", { name: "切换到浅色模式" }).first().click();
    await page.waitForTimeout(250);

    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "站内搜索" });
    await dialog.waitFor();
    await dialog.getByRole("textbox", { name: "搜索关键词" }).fill("SQLite");
    await dialog.getByRole("button").filter({ hasText: "SQLite" }).first().waitFor();
    await shot(page, "search-dialog.png");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });

    const desktopNav = page.locator("header nav").first();
    await desktopNav.getByRole("link", { name: "博客", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/blog");
  });

  await step("博客列表搜索、分类筛选与文章详情", async () => {
    await page.getByRole("heading", { level: 1, name: "博客" }).waitFor();
    await page.locator('input[name="q"]').fill("SQLite");
    await page.getByRole("button", { name: "搜索", exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("q") === "SQLite");
    await page.getByText(/找到\s*\d+\s*篇文章/).first().waitFor();
    await shot(page, "blog-search.png");

    const firstResult = page.locator("ul.divide-y li a").first();
    const title = (await firstResult.textContent())?.trim();
    check(Boolean(title), "搜索没有返回可点击的文章");
    await firstResult.click();
    await page.waitForURL((url) => url.pathname.startsWith("/blog/"));
    await page.getByRole("heading", { level: 1 }).waitFor();

    await page.goto(`${BASE}/blog/building-this-blog`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor();

    check(await page.locator(".prose-article").count() === 1, "文章正文没有渲染");
    check(await page.locator(".prose-article table").count() > 0, "文章表格没有渲染");
    check(await page.locator(".prose-article pre code").count() > 0, "代码块没有渲染");
    await page.locator(".article-content .code-copy").first().waitFor({ timeout: 10_000 });
    check(await page.locator(".article-content .code-copy").count() > 0, "代码复制按钮缺失");
    check(await page.getByRole("navigation", { name: "文章目录" }).count() > 0, "桌面端目录缺失");
    await assertNoOverflow(page, "文章详情桌面端");
    await shot(page, "article-desktop.png", true);
    await shot(page, "article-top.png");

    const copyButton = page.locator(".code-copy").first();
    await copyButton.click({ force: true });
    await page.waitForTimeout(350);
    const copyText = (await copyButton.textContent()) ?? "";
    check(copyText === "已复制" || copyText === "复制失败", "复制按钮没有反馈状态");

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    check(
      canonical === `${SITE_URL}${new URL(page.url()).pathname}`,
      `canonical 不正确：${canonical}`,
    );
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    check(Boolean(ogTitle), "缺少 Open Graph 标题");
  });

  await step("未登录访问后台与 API 被拒绝", async () => {
    const anonContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "zh-CN",
    });
    const anonPage = await anonContext.newPage();
    await anonPage.goto(`${BASE}${ADMIN}/posts`, { waitUntil: "domcontentloaded" });
    await anonPage.waitForURL((url) => url.pathname === `${ADMIN}/login`);
    check(
      await anonPage.getByRole("heading", { name: "登录后台" }).isVisible(),
      "未登录没有被引导到登录页",
    );
    await shot(anonPage, "admin-login.png");

    const apiResponse = await anonContext.request.get(`${BASE}/api/admin/posts`);
    check(apiResponse.status() === 401, `未登录访问管理 API 返回 ${apiResponse.status()}，应为 401`);
    await anonContext.close();
  });

  await step("错误密码提示与管理员登录", async () => {
    await goto(page, `${ADMIN}/login`, async () => {
      await page.locator("#username").waitFor();
    });
    await page.locator("#username").fill(USERNAME);
    await page.locator("#password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: /登录后台/ }).click();
    const alert = page.locator("form").getByRole("alert");
    await alert.waitFor();
    check((await alert.textContent())?.includes("用户名或密码错误"), "错误凭据提示不正确");
    await shot(page, "admin-login-error.png");

    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: /登录后台/ }).click();
    await page.waitForURL((url) => url.pathname === ADMIN);
    await page.getByRole("heading", { name: "仪表盘" }).waitFor();
    await page.getByText("最近编辑").waitFor();
    await assertNoOverflow(page, "后台仪表盘桌面端");
    await shot(page, "admin-dashboard.png");

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    check(robots?.includes("noindex"), "后台页面缺少 noindex");

    const sessionResponse = await page.request.get(`${BASE}/api/auth/session`);
    const session = await sessionResponse.json();
    check(session.authenticated === true && typeof session.csrfToken === "string", "会话接口异常");
    csrfToken = session.csrfToken;

    const noCsrf = await page.request.post(`${BASE}/api/admin/posts`, {
      data: { title: "without-csrf" },
    });
    check(noCsrf.status() === 403, `缺少 CSRF 令牌的写请求返回 ${noCsrf.status()}，应为 403`);
  });

  await step("创建文章：Markdown、实时预览、封面上传与发布", async () => {
    const stamp = Date.now();
    const slug = `e2e-verify-${stamp}`;
    const title = "端到端验证文章";
    e2eSlug = slug;
    e2eTitle = title;
    const content = [
      "## 验证标题",
      "",
      "这是一段 **端到端验证** 内容，用来确认 Markdown、代码高亮与表格都能正常渲染。",
      "",
      "```ts",
      "const verified: boolean = true;",
      "console.log(verified);",
      "```",
      "",
      "| 项目 | 状态 |",
      "| --- | --- |",
      "| 渲染 | 通过 |",
      "| 安全 | 通过 |",
      "",
      "<script>alert(\"xss\")</script>",
      "",
      "[危险链接](javascript:alert(1))",
      "",
      "> 这段内容来自浏览器自动化测试。",
    ].join("\n");

    await goto(page, `${ADMIN}/posts/new`, async () => {
      await page.locator("#post-title").waitFor();
    });
    await page.locator("#post-title").fill(title);
    await page.locator("#post-slug").fill(slug);
    await page.locator("#post-summary").fill("由浏览器端到端测试创建的文章，用于验证发布与前台展示。");
    await page.locator("#post-content").fill(content);

    await page.locator('aside input[type="file"]').first().setInputFiles(
      path.resolve("public", "og.png"),
    );
    await page.locator('aside img[alt="已上传图片预览"]').waitFor({ timeout: 20_000 });
    const coverSrc = await page.locator('aside img[alt="已上传图片预览"]').getAttribute("src");
    check(
      Boolean(coverSrc) && decodeURIComponent(coverSrc).includes("/media/"),
      `封面上传后没有返回媒体地址：${coverSrc}`,
    );

    await page.getByRole("button", { name: "预览", exact: true }).click();
    await page.locator(".article-content h2").first().waitFor({ timeout: 15_000 });
    check(
      (await page.locator(".article-content h2").first().textContent())?.includes("验证标题"),
      "实时预览没有渲染 Markdown",
    );
    await shot(page, "editor-preview.png");
    await page.getByRole("button", { name: "编辑", exact: true }).click();
    await shot(page, "admin-editor.png");

    await page.getByRole("button", { name: "发布文章", exact: true }).click();
    await page.waitForURL((url) => /\/posts\/[0-9a-f-]{36}$/.test(url.pathname), {
      timeout: 30_000,
    });
    const match = new URL(page.url()).pathname.match(/\/posts\/([0-9a-f-]{36})$/);
    check(Boolean(match), "发布后没有进入文章编辑地址");
    createdPostId = match[1];
    await page.locator("#post-title").waitFor();
    await page.waitForTimeout(800);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#post-title").waitFor();
    check((await page.locator("#post-title").inputValue()) === title, "刷新后标题没有持久化");
    check((await page.locator("#post-content").inputValue()).includes("端到端验证"), "正文丢失");

    await page.goto(`${BASE}/blog/${slug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: title }).waitFor();
    const html = await page.content();
    check(!html.includes('alert("xss")'), "XSS 脚本没有被净化");
    check(!html.includes("javascript:alert"), "危险链接协议没有被移除");
    check(await page.locator(".prose-article table").count() > 0, "前台表格缺失");
    check(await page.locator(".prose-article pre code").count() > 0, "前台代码块缺失");
    check(await page.locator('img[alt$="封面"]').count() > 0, "前台封面缺失");
    await assertNoOverflow(page, "新建文章详情");
    await shot(page, "article-e2e.png", true);
  });

  await step("编辑文章并验证前台同步", async () => {
    const updatedTitle = "端到端验证文章 · 已修改";
    e2eTitle = updatedTitle;
    await goto(page, `${ADMIN}/posts/${createdPostId}`);
    await page.locator("#post-title").waitFor();
    await page.locator("#post-title").fill(updatedTitle);
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/admin/posts/${createdPostId}`) &&
        response.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: "保存并更新", exact: true }).click();
    const response = await responsePromise;
    check(response.ok(), `保存文章返回 ${response.status()}`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#post-title").waitFor();
    check((await page.locator("#post-title").inputValue()) === updatedTitle, "修改没有持久化");

    await page.goto(`${BASE}/blog/${e2eSlug}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1, name: updatedTitle }).waitFor();
  });

  await step("下架与删除文章", async () => {
    await goto(page, `${ADMIN}/posts`, async () => {
      await page.getByRole("heading", { name: "文章管理" }).waitFor();
    });

    let row = page.locator("li").filter({ hasText: e2eSlug }).first();
    await row.waitFor();
    await row.getByRole("button", { name: "下架", exact: true }).click();
    await page.getByText("文章已下架", { exact: true }).waitFor();
    await page.waitForTimeout(500);

    const hidden = await page.request.get(`${BASE}/blog/${e2eSlug}`);
    check(hidden.status() === 404, `下架后文章仍然公开：${hidden.status()}`);

    await page.reload({ waitUntil: "domcontentloaded" });
    row = page.locator("li").filter({ hasText: e2eSlug }).first();
    await row.waitFor();
    await row.getByRole("button", { name: `删除 ${e2eTitle}`, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "永久删除", exact: true }).click();
    await page.getByText("文章已删除", { exact: true }).waitFor();
    await page.waitForTimeout(400);
    check(
      (await page.locator("li").filter({ hasText: e2eSlug }).count()) === 0,
      "删除后列表仍有该文章",
    );
  });

  await step("上传安全校验与媒体访问", async () => {
    const badUpload = await page.request.post(`${BASE}/api/admin/upload`, {
      headers: { "x-csrf-token": csrfToken },
      multipart: {
        file: {
          name: "not-an-image.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("this is not an image"),
        },
      },
    });
    check(badUpload.status() === 415, `伪造图片返回 ${badUpload.status()}，应为 415`);

    const png = await fs.readFile(path.resolve("public", "og.png"));
    const goodUpload = await page.request.post(`${BASE}/api/admin/upload`, {
      headers: { "x-csrf-token": csrfToken },
      multipart: {
        file: { name: "cover.png", mimeType: "image/png", buffer: png },
      },
    });
    check(goodUpload.status() === 201, `合法图片上传返回 ${goodUpload.status()}`);
    const uploaded = await goodUpload.json();
    check(uploaded.url?.startsWith("/media/"), "上传响应缺少媒体地址");
    uploadedMediaUrl = uploaded.url;

    const mediaResponse = await page.request.get(`${BASE}${uploaded.url}`);
    check(mediaResponse.status() === 200, "媒体文件无法访问");
    check(
      mediaResponse.headers()["content-type"] === "image/webp",
      `媒体类型错误：${mediaResponse.headers()["content-type"]}`,
    );
  });

  await step("站点设置保存与账户页面", async () => {
    await goto(page, `${ADMIN}/settings`, async () => {
      await page.getByRole("heading", { name: "站点设置" }).waitFor();
    });
    await shot(page, "admin-settings.png");
    await page.getByRole("button", { name: "保存设置", exact: true }).first().click();
    await page.getByText("站点设置已保存", { exact: true }).waitFor();

    await goto(page, `${ADMIN}/account`, async () => {
      await page.getByRole("heading", { name: "账户安全" }).waitFor();
    });
    await assertNoOverflow(page, "账户安全页桌面端");
  });

  await step("移动端布局与主导航", async () => {
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
      locale: "zh-CN",
      timezoneId: "Asia/Shanghai",
      reducedMotion: "reduce",
      storageState: await context.storageState(),
    });
    const mobile = await mobileContext.newPage();
    mobile.setDefaultTimeout(30_000);

    await mobile.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await mobile.getByRole("heading", { level: 1 }).waitFor();
    await assertNoOverflow(mobile, "首页移动端");
    await shot(mobile, "mobile-home.png", true);

    await mobile.getByRole("button", { name: "打开菜单" }).click();
    const mobileNav = mobile.locator("#mobile-nav");
    await mobileNav.waitFor();
    await shot(mobile, "mobile-menu.png");
    await mobileNav.getByRole("link", { name: "博客", exact: true }).click();
    await mobile.waitForURL((url) => url.pathname === "/blog");
    await assertNoOverflow(mobile, "博客移动端");
    await shot(mobile, "mobile-blog.png");

    await mobile.locator("ul.divide-y li a").first().click();
    await mobile.waitForURL((url) => url.pathname.startsWith("/blog/"));
    await mobile.getByRole("heading", { level: 1 }).waitFor();
    await assertNoOverflow(mobile, "文章移动端");
    check(await mobile.locator("details summary").first().isVisible(), "移动端目录入口缺失");
    await shot(mobile, "mobile-article.png", true);

    await mobile.goto(`${BASE}${ADMIN}`, { waitUntil: "domcontentloaded" });
    await mobile.getByRole("heading", { name: "仪表盘" }).waitFor();
    await assertNoOverflow(mobile, "后台移动端");
    await shot(mobile, "mobile-admin.png");
    await mobile.waitForTimeout(1000);
    await mobile.getByRole("button", { name: "打开菜单" }).click();
    await mobile.locator("div.fixed.inset-0.z-50").waitFor({ timeout: 10_000 });
    await shot(mobile, "mobile-admin-menu.png");

    await mobileContext.close();
  });

  await step("SEO、草稿隔离与安全响应头", async () => {
    const robots = await page.request.get(`${BASE}/robots.txt`);
    const robotsText = await robots.text();
    check(robotsText.includes("Disallow: /admin"), "robots.txt 没有禁止后台");
    check(robotsText.includes("Sitemap:"), "robots.txt 缺少 sitemap");

    const sitemap = await page.request.get(`${BASE}/sitemap.xml`);
    const sitemapText = await sitemap.text();
    check(sitemapText.includes("/blog/building-this-blog"), "sitemap 缺少已发布文章");
    check(!sitemapText.includes("/admin"), "sitemap 暴露了后台路径");
    check(!sitemapText.includes("learning-notes-2026"), "sitemap 暴露了草稿");

    const draft = await page.request.get(`${BASE}/blog/learning-notes-2026`);
    check(draft.status() === 404, `草稿可以被公开访问：${draft.status()}`);

    const rss = await page.request.get(`${BASE}/rss.xml`);
    const rssText = await rss.text();
    check(rss.headers()["content-type"]?.includes("application/rss+xml"), "RSS Content-Type 错误");
    check(rssText.includes("building-this-blog"), "RSS 缺少已发布文章");

    await page.goto(`${BASE}/rss.xml`, { waitUntil: "domcontentloaded" });
    check(new URL(page.url()).pathname === "/rss.xml", `浏览器访问 RSS 被跳转：${page.url()}`);
    await page.getByRole("heading", { level: 1, name: "RSS 订阅源" }).waitFor();
    check(await page.locator("article.card").count() > 0, "RSS 预览页没有展示文章");
    check(await page.locator("details.raw pre").count() === 1, "RSS 预览页缺少原始 XML");

    const home = await page.request.get(`${BASE}/`);
    const headers = home.headers();
    check(headers["x-frame-options"] === "DENY", "缺少 X-Frame-Options");
    check(headers["x-content-type-options"] === "nosniff", "缺少 nosniff");
    check(headers["content-security-policy"]?.includes("frame-ancestors 'none'"), "CSP 配置缺失");
  });

  if (pageErrors.length > 0) {
    throw new Error(`页面运行时错误：${pageErrors.join(" | ")}`);
  }
} catch (error) {
  try {
    await page.screenshot({ path: path.join(ARTIFACTS, "failure.png"), fullPage: false });
  } catch {
    // Ignore screenshot failures during error handling.
  }
  console.error(`\n验证失败：${error.message}`);
  process.exitCode = 1;
} finally {
  // Clean up a post left behind by a failed run.
  if (createdPostId) {
    try {
      const session = await context.request.get(`${BASE}/api/auth/session`);
      const data = await session.json();
      if (data.authenticated && data.csrfToken) {
        await context.request.delete(`${BASE}/api/admin/posts/${createdPostId}`, {
          headers: { "x-csrf-token": data.csrfToken },
        });
      }
    } catch {
      // Best-effort cleanup.
    }
  }

  if (uploadedMediaUrl) {
    try {
      const relative = uploadedMediaUrl.replace(/^\/media\//, "");
      await fs.rm(path.resolve("storage", "uploads", relative));
    } catch {
      // Best-effort cleanup.
    }
  }

  const report = {
    base: BASE,
    finishedAt: new Date().toISOString(),
    checks,
    consoleErrors,
    failedResponses,
    pageErrors,
    artifacts: ARTIFACTS,
  };
  await fs.writeFile(path.join(ARTIFACTS, "report.json"), JSON.stringify(report, null, 2));

  console.log("\n──────── 验证摘要 ────────");
  for (const item of checks) {
    console.log(`${item.ok ? "✓" : "✗"} ${item.name}${item.ok ? "" : ` — ${item.error}`}`);
  }
  console.log(`\n通过 ${checks.filter((item) => item.ok).length}/${checks.length} 项`);
  if (consoleErrors.length > 0) {
    console.log(`\n浏览器控制台错误（${consoleErrors.length}）：`);
    for (const message of consoleErrors.slice(0, 10)) console.log(`- ${message}`);
  } else {
    console.log("浏览器控制台错误：0");
  }
  if (failedResponses.length > 0) {
    console.log(`\n失败的资源请求（${failedResponses.length}）：`);
    for (const message of failedResponses.slice(0, 10)) console.log(`- ${message}`);
  }
  console.log(`页面运行时异常：${pageErrors.length}`);
  console.log(`截图与报告目录：${ARTIFACTS}`);

  await browser.close();
}
