import { describe, expect, it } from "vitest";
import {
  ValidationError,
  parsePostInput,
  parseProjectInput,
  parseSiteSettingsInput,
  validatePasswordStrength,
} from "@/lib/validation";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

const validPost = {
  title: "一篇文章",
  slug: "a-post",
  summary: "",
  content: "## 正文\n\n一些内容。",
  coverImage: null,
  category: "工程实践",
  tags: ["Next.js", "Next.js", " SQLite "],
  status: "published",
  publishedAt: null,
};

describe("parsePostInput", () => {
  it("normalises a valid post and fills publishedAt", () => {
    const input = parsePostInput(validPost);
    expect(input.title).toBe("一篇文章");
    expect(input.tags).toEqual(["Next.js", "SQLite"]);
    expect(input.publishedAt).not.toBeNull();
    expect(new Date(input.publishedAt as string).getTime()).not.toBeNaN();
  });

  it("rejects publishing an empty article", () => {
    expect(() => parsePostInput({ ...validPost, content: "   " })).toThrow(ValidationError);
  });

  it("rejects invalid slugs and unsafe cover paths", () => {
    try {
      parsePostInput({ ...validPost, slug: "中文路径" });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors.slug).toBeTruthy();
    }

    expect(() => parsePostInput({ ...validPost, coverImage: "https://example.com/a.png" })).toThrow();
    expect(() => parsePostInput({ ...validPost, coverImage: "/media/2026/10/x.webp" })).not.toThrow();
  });

  it("keeps a future publish date instead of replacing it", () => {
    const publishedAt = "2030-01-01T00:00:00.000Z";
    const input = parsePostInput({ ...validPost, publishedAt });
    expect(input.publishedAt).toBe(publishedAt);
  });
});

describe("parseProjectInput", () => {
  it("accepts empty optional links", () => {
    const project = parseProjectInput({
      title: "Demo",
      description: "",
      category: "网站",
      tech: ["Next.js", "Next.js", "SQLite"],
      coverImage: null,
      demoUrl: "",
      repoUrl: "",
      sortOrder: 2,
      visible: true,
    });
    expect(project.demoUrl).toBeNull();
    expect(project.tech).toEqual(["Next.js", "SQLite"]);
    expect(project.visible).toBe(true);
  });

  it("rejects non-http links", () => {
    expect(() =>
      parseProjectInput({
        title: "Demo",
        demoUrl: "javascript:alert(1)",
      }),
    ).toThrow(ValidationError);
  });
});

describe("parseSiteSettingsInput", () => {
  it("accepts the default settings shape", () => {
    const settings = parseSiteSettingsInput(DEFAULT_SETTINGS);
    expect(settings.siteName).toBe(DEFAULT_SETTINGS.siteName);
    expect(settings.profile.bio.length).toBeGreaterThan(0);
  });

  it("rejects invalid email and social URLs", () => {
    expect(() =>
      parseSiteSettingsInput({ ...DEFAULT_SETTINGS, contactEmail: "not-an-email" }),
    ).toThrow(ValidationError);

    expect(() =>
      parseSiteSettingsInput({
        ...DEFAULT_SETTINGS,
        socials: [{ label: "GitHub", url: "javascript:alert(1)" }],
      }),
    ).toThrow(ValidationError);
  });
});

describe("validatePasswordStrength", () => {
  it("rejects short and common passwords", () => {
    expect(validatePasswordStrength("short")).toBeTruthy();
    expect(validatePasswordStrength("password123")).toBeTruthy();
  });

  it("accepts long unique passwords", () => {
    expect(validatePasswordStrength("Ember!Local-2026-9x7Qm2", "fateway")).toBeNull();
    expect(validatePasswordStrength("this is a long passphrase with spaces")).toBeNull();
  });

  it("rejects passwords containing the username", () => {
    expect(validatePasswordStrength("fateway-is-my-name-2026!", "fateway")).toBeTruthy();
  });
});
