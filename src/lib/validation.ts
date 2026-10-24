import type { PostStatus, SiteSettings } from "./types";
import { isHttpUrl, isSafeImagePath, isValidSlug, stripMarkdown, truncate } from "./utils";
import { isValidDate } from "./date";

export type FieldErrors = Record<string, string>;

export class ValidationError extends Error {
  readonly errors: FieldErrors;

  constructor(errors: FieldErrors) {
    super("表单校验未通过");
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export type PostInput = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  status: PostStatus;
  publishedAt: string | null;
};

export type ProjectInput = {
  title: string;
  description: string;
  category: string;
  tech: string[];
  coverImage: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  sortOrder: number;
  visible: boolean;
};

export type GalleryInput = {
  imageUrl: string;
  category: string;
  caption: string;
  note: string;
  sortOrder: number;
  visible: boolean;
};

type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as UnknownRecord;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const name = tag.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function assertNoErrors(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
}

export function parsePostInput(body: unknown): PostInput {
  const data = asRecord(body);
  const errors: FieldErrors = {};

  const title = asString(data.title).trim();
  if (!title) errors.title = "请填写文章标题";
  else if (title.length > 160) errors.title = "标题不能超过 160 个字符";

  const slug = asString(data.slug).trim().toLowerCase();
  if (!slug) errors.slug = "请填写文章路径（slug）";
  else if (!isValidSlug(slug)) {
    errors.slug = "slug 只能包含小写字母、数字和连字符，长度 2–80";
  }

  const content = asString(data.content);
  if (content.length > 200_000) errors.content = "正文过长（最多 200,000 字符）";

  let summary = asString(data.summary).trim();
  if (summary.length > 300) errors.summary = "摘要不能超过 300 个字符";
  if (!summary && content) {
    summary = truncate(stripMarkdown(content), 120);
  }

  const coverRaw = asString(data.coverImage).trim();
  let coverImage: string | null = null;
  if (coverRaw) {
    if (!isSafeImagePath(coverRaw)) errors.coverImage = "封面地址不合法";
    else coverImage = coverRaw;
  }

  const category = asString(data.category).trim();
  if (category.length > 40) errors.category = "分类名称不能超过 40 个字符";

  const tags = normalizeTags(asStringArray(data.tags));
  if (tags.length > 8) errors.tags = "最多设置 8 个标签";
  else if (tags.some((tag) => tag.length > 24)) errors.tags = "单个标签不能超过 24 个字符";

  const statusRaw = asString(data.status) || "draft";
  const status: PostStatus = statusRaw === "published" ? "published" : "draft";
  if (statusRaw !== "draft" && statusRaw !== "published") {
    errors.status = "文章状态不合法";
  }

  const publishedAtRaw = asString(data.publishedAt).trim();
  let publishedAt: string | null = null;
  if (publishedAtRaw) {
    if (!isValidDate(publishedAtRaw)) errors.publishedAt = "发布时间格式不正确";
    else publishedAt = new Date(publishedAtRaw).toISOString();
  }

  if (status === "published") {
    if (!content.trim()) errors.content = "发布前请先填写正文";
    if (!publishedAt) publishedAt = new Date().toISOString();
  } else {
    // Drafts keep an optional scheduled timestamp, but it is never exposed
    // publicly while the status is draft.
    if (publishedAtRaw && !publishedAt) errors.publishedAt = "发布时间格式不正确";
  }

  assertNoErrors(errors);

  return {
    title,
    slug,
    summary,
    content,
    coverImage,
    category,
    tags,
    status,
    publishedAt,
  };
}

export function parseProjectInput(body: unknown): ProjectInput {
  const data = asRecord(body);
  const errors: FieldErrors = {};

  const title = asString(data.title).trim();
  if (!title) errors.title = "请填写项目名称";
  else if (title.length > 80) errors.title = "项目名称不能超过 80 个字符";

  const description = asString(data.description).trim();
  if (description.length > 500) errors.description = "项目简介不能超过 500 个字符";

  const category = asString(data.category).trim();
  if (category.length > 40) errors.category = "项目类别不能超过 40 个字符";

  const tech = normalizeTags(asStringArray(data.tech));
  if (tech.length > 10) errors.tech = "最多设置 10 个技术标签";
  else if (tech.some((item) => item.length > 24)) errors.tech = "单个技术标签不能超过 24 个字符";

  const coverRaw = asString(data.coverImage).trim();
  let coverImage: string | null = null;
  if (coverRaw) {
    if (!isSafeImagePath(coverRaw)) errors.coverImage = "封面地址不合法";
    else coverImage = coverRaw;
  }

  const parseUrl = (raw: string, field: string): string | null => {
    const value = raw.trim();
    if (!value) return null;
    if (!isHttpUrl(value)) {
      errors[field] = "请填写以 http:// 或 https:// 开头的完整地址";
      return null;
    }
    return value;
  };
  const demoUrl = parseUrl(asString(data.demoUrl), "demoUrl");
  const repoUrl = parseUrl(asString(data.repoUrl), "repoUrl");

  const sortOrderRaw = data.sortOrder;
  const sortOrder = typeof sortOrderRaw === "number" ? sortOrderRaw : Number.parseInt(asString(sortOrderRaw), 10);
  if (!Number.isFinite(sortOrder) || sortOrder < -999 || sortOrder > 999) {
    errors.sortOrder = "排序值需在 -999 到 999 之间";
  }

  const visible = typeof data.visible === "boolean" ? data.visible : data.visible !== "false";

  assertNoErrors(errors);

  return {
    title,
    description,
    category,
    tech,
    coverImage,
    demoUrl,
    repoUrl,
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    visible,
  };
}

function readText(
  value: unknown,
  field: string,
  errors: FieldErrors,
  options: { required?: boolean; max: number },
): string {
  const text = asString(value).trim();
  if (options.required && !text) errors[field] = "此项不能为空";
  if (text.length > options.max) errors[field] = `不能超过 ${options.max} 个字符`;
  return text;
}

export function parseGalleryInput(body: unknown): GalleryInput {
  const data = asRecord(body);
  const errors: FieldErrors = {};

  const imageUrl = asString(data.imageUrl).trim();
  if (!imageUrl) errors.imageUrl = "请先上传一张照片";
  else if (!isSafeImagePath(imageUrl)) errors.imageUrl = "照片地址不合法";

  const category = readText(data.category, "category", errors, { max: 40 }) || "未分类";

  const caption = readText(data.caption, "caption", errors, {
    required: true,
    max: 100,
  });
  const note = readText(data.note, "note", errors, { max: 300 });

  const sortOrderRaw = data.sortOrder;
  const sortOrder =
    typeof sortOrderRaw === "number" ? sortOrderRaw : Number.parseInt(asString(sortOrderRaw), 10);
  if (!Number.isFinite(sortOrder) || sortOrder < -999 || sortOrder > 999) {
    errors.sortOrder = "排序值需在 -999 到 999 之间";
  }

  const visible = typeof data.visible === "boolean" ? data.visible : data.visible !== "false";

  assertNoErrors(errors);

  return {
    imageUrl,
    category,
    caption,
    note,
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    visible,
  };
}

export function parseSiteSettingsInput(body: unknown): SiteSettings {
  const data = asRecord(body);
  const errors: FieldErrors = {};

  const siteName = readText(data.siteName, "siteName", errors, { required: true, max: 40 });
  const tagline = readText(data.tagline, "tagline", errors, { max: 80 });
  const description = readText(data.description, "description", errors, { max: 300 });
  const contactEmail = readText(data.contactEmail, "contactEmail", errors, { max: 120 });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    errors.contactEmail = "邮箱格式不正确";
  }
  const footerNote = readText(data.footerNote, "footerNote", errors, { max: 200 });

  const avatarUrl = readText(data.avatarUrl, "avatarUrl", errors, { max: 300 });
  if (avatarUrl && !isSafeImagePath(avatarUrl)) errors.avatarUrl = "头像地址不合法";

  const brandRaw = asRecord(data.brand);
  const brandLogoUrl = readText(brandRaw.logoUrl, "brand.logoUrl", errors, { max: 300 });
  if (brandLogoUrl && !isSafeImagePath(brandLogoUrl)) errors["brand.logoUrl"] = "Logo 地址不合法";
  const brandMark = readText(brandRaw.mark, "brand.mark", errors, { max: 4 }) || "F";
  const brandSubtitle = readText(brandRaw.subtitle, "brand.subtitle", errors, { max: 40 });
  const brand = {
    logoUrl: brandLogoUrl,
    mark: brandMark,
    subtitle: brandSubtitle,
  };

  const heroRaw = asRecord(data.hero);
  const hero = {
    eyebrow: readText(heroRaw.eyebrow, "hero.eyebrow", errors, { max: 80 }),
    title: readText(heroRaw.title, "hero.title", errors, { required: true, max: 100 }),
    subtitle: readText(heroRaw.subtitle, "hero.subtitle", errors, { max: 200 }),
  };

  const profileRaw = asRecord(data.profile);
  const bio = asStringArray(profileRaw.bio)
    .map((item) => item.trim())
    .filter(Boolean);
  if (bio.length > 10) errors["profile.bio"] = "个人介绍最多 10 段";
  if (bio.some((item) => item.length > 600)) errors["profile.bio"] = "单段介绍不能超过 600 个字符";

  const focus = normalizeTags(asStringArray(profileRaw.focus));
  if (focus.length > 8) errors["profile.focus"] = "技术方向最多 8 项";

  const principles = Array.isArray(profileRaw.principles)
    ? profileRaw.principles.map((item) => {
        const record = asRecord(item);
        return {
          title: asString(record.title).trim().slice(0, 60),
          body: asString(record.body).trim().slice(0, 240),
        };
      })
    : [];
  if (principles.length > 6) errors["profile.principles"] = "原则最多 6 条";

  const principlesTitle =
    readText(profileRaw.principlesTitle, "profile.principlesTitle", errors, { max: 40 }) ||
    "做事原则";

  const profile = {
    name: readText(profileRaw.name, "profile.name", errors, { required: true, max: 40 }),
    role: readText(profileRaw.role, "profile.role", errors, { max: 60 }),
    location: readText(profileRaw.location, "profile.location", errors, { max: 60 }),
    bio,
    focus,
    principles,
    principlesTitle,
  };

  const skillsRaw = Array.isArray(data.skills) ? data.skills : [];
  if (skillsRaw.length > 8) errors.skills = "最多 8 个技能分组";
  const skills = skillsRaw.slice(0, 8).map((group) => {
    const record = asRecord(group);
    return {
      category: asString(record.category).trim().slice(0, 40),
      items: normalizeTags(asStringArray(record.items)).slice(0, 12),
    };
  });
  if (skills.some((group) => !group.category)) errors.skills = "技能分组需要名称";

  const socialsRaw = Array.isArray(data.socials) ? data.socials : [];
  if (socialsRaw.length > 10) errors.socials = "最多配置 10 个链接";
  const socials = socialsRaw.slice(0, 10).map((item, index) => {
    const record = asRecord(item);
    const label = asString(record.label).trim().slice(0, 30);
    const url = asString(record.url).trim();
    if (!label) errors[`socials.${index}.label`] = "请填写链接名称";
    if (url && !isHttpUrl(url)) errors[`socials.${index}.url`] = "请填写以 http(s):// 开头的地址";
    return { label, url };
  });

  assertNoErrors(errors);

  return {
    siteName,
    tagline,
    description,
    avatarUrl,
    contactEmail,
    footerNote,
    brand,
    hero,
    profile,
    skills,
    socials: socials.filter((item) => item.label && item.url),
  };
}

export function parseLoginInput(body: unknown): { username: string; password: string } {
  const data = asRecord(body);
  const username = asString(data.username).trim();
  const password = asString(data.password);
  const errors: FieldErrors = {};
  if (!username) errors.username = "请输入用户名";
  else if (username.length > 64) errors.username = "用户名过长";
  if (!password) errors.password = "请输入密码";
  else if (password.length > 200) errors.password = "密码过长";
  assertNoErrors(errors);
  return { username, password };
}

const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "admin123",
  "administrator",
  "qwerty123",
  "letmein",
  "welcome123",
  "changeme",
  "fateway123",
  "iloveyou",
  "abc123456",
]);

export function validatePasswordStrength(password: string, username = ""): string | null {
  if (password.length < 12) return "密码至少需要 12 个字符";
  if (password.length > 200) return "密码不能超过 200 个字符";
  const lower = password.toLowerCase();
  if (WEAK_PASSWORDS.has(lower)) return "这个密码过于常见，请换一个";
  if (username && lower.includes(username.toLowerCase())) return "密码不能包含用户名";
  if (/^(.)\1+$/.test(password)) return "密码不能是重复字符";
  if (password.length < 16) {
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
    if (classes < 3) return "12–15 位密码需包含大小写字母、数字、符号中的至少三类";
  }
  return null;
}

export function parsePasswordChangeInput(body: unknown): { currentPassword: string; newPassword: string } {
  const data = asRecord(body);
  const currentPassword = asString(data.currentPassword);
  const newPassword = asString(data.newPassword);
  const errors: FieldErrors = {};
  if (!currentPassword) errors.currentPassword = "请输入当前密码";
  if (!newPassword) errors.newPassword = "请输入新密码";
  assertNoErrors(errors);
  return { currentPassword, newPassword };
}
