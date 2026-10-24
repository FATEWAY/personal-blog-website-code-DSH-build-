import type { SiteSettings } from "./types";

/**
 * Default site copy. These are deliberately neutral placeholders: the real
 * name, avatar, contact details and social profiles are meant to be filled in
 * from the admin panel and are never invented here.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "fateway",
  tagline: "个人技术博客 · 工程笔记与作品",
  description: "记录软件工程、系统设计与开发工具的实践笔记。",
  avatarUrl: "",
  contactEmail: "",
  footerNote: "",
  brand: {
    logoUrl: "",
    mark: "F",
    subtitle: "Personal site",
  },
  hero: {
    eyebrow: "FATEWAY.CN · PERSONAL SITE",
    title: "把复杂的事，做得清楚一点。",
    subtitle: "你好，我是站长。这里记录我的技术方向、工程实践与正在构建的东西。",
  },
  profile: {
    name: "站长",
    role: "独立开发者 · 技术爱好者",
    location: "",
    bio: [
      "这里是我的个人技术博客。我关注软件工程、系统设计与开发工具，也记录正在学习和构建的东西。",
      "相比堆叠功能，我更在意一件事是否被真正讲清楚 —— 代码如此，文章也如此。",
    ],
    focus: ["Web 工程", "系统与数据库", "开发者工具", "写作与记录"],
    principlesTitle: "做事原则",
    principles: [
      {
        title: "先让它真实可用",
        body: "能运行、能被验证的实现，优先于纸面上的完美架构。",
      },
      {
        title: "保持简单",
        body: "为当前的问题选择刚好的复杂度，把扩展留给真正需要的时候。",
      },
      {
        title: "安全是默认项",
        body: "认证、校验与最小权限，不该是上线前才补的清单。",
      },
    ],
  },
  skills: [
    {
      category: "前端与界面",
      items: ["TypeScript", "React", "Next.js", "CSS 设计系统"],
    },
    {
      category: "后端与数据",
      items: ["Node.js", "SQLite", "REST API", "认证与安全"],
    },
    {
      category: "系统与运维",
      items: ["Linux", "Nginx", "备份与迁移", "性能调优"],
    },
    {
      category: "工具与方法",
      items: ["Git", "Markdown", "自动化测试", "技术写作"],
    },
  ],
  socials: [],
};

export function cloneDefaultSettings(): SiteSettings {
  return structuredClone(DEFAULT_SETTINGS);
}

/** Merges a persisted (partial) settings object over the defaults. */
export function mergeSiteSettings(base: SiteSettings, stored: unknown): SiteSettings {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return structuredClone(base);
  }
  const value = stored as Partial<SiteSettings>;
  return {
    siteName: typeof value.siteName === "string" && value.siteName ? value.siteName : base.siteName,
    tagline: typeof value.tagline === "string" ? value.tagline : base.tagline,
    description: typeof value.description === "string" ? value.description : base.description,
    avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : base.avatarUrl,
    contactEmail: typeof value.contactEmail === "string" ? value.contactEmail : base.contactEmail,
    footerNote: typeof value.footerNote === "string" ? value.footerNote : base.footerNote,
    brand: {
      logoUrl:
        typeof value.brand?.logoUrl === "string" ? value.brand.logoUrl : base.brand.logoUrl,
      mark:
        typeof value.brand?.mark === "string" && value.brand.mark.trim()
          ? value.brand.mark
          : base.brand.mark,
      subtitle:
        typeof value.brand?.subtitle === "string"
          ? value.brand.subtitle
          : base.brand.subtitle,
    },
    hero: {
      ...base.hero,
      ...(value.hero && typeof value.hero === "object" ? value.hero : {}),
    },
    profile: {
      ...base.profile,
      ...(value.profile && typeof value.profile === "object" ? value.profile : {}),
      bio: Array.isArray(value.profile?.bio) ? value.profile.bio : base.profile.bio,
      focus: Array.isArray(value.profile?.focus) ? value.profile.focus : base.profile.focus,
      principles: Array.isArray(value.profile?.principles)
        ? value.profile.principles
        : base.profile.principles,
      principlesTitle:
        typeof value.profile?.principlesTitle === "string" && value.profile.principlesTitle.trim()
          ? value.profile.principlesTitle
          : base.profile.principlesTitle,
    },
    skills: Array.isArray(value.skills) ? value.skills : base.skills,
    socials: Array.isArray(value.socials) ? value.socials : base.socials,
  };
}
