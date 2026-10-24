"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminSession } from "@/components/admin/admin-session";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/ui/toast";
import { AlertCircle, Loader, Plus, Save, Trash } from "@/components/ui/icons";
import { adminHref } from "@/lib/route-path";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type Principle = { title: string; body: string };
type SkillGroup = { category: string; itemsText: string };
type SocialLink = { label: string; url: string };

type FormState = {
  siteName: string;
  tagline: string;
  description: string;
  contactEmail: string;
  footerNote: string;
  avatarUrl: string;
  brandLogoUrl: string;
  brandMark: string;
  brandSubtitle: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  profileName: string;
  profileRole: string;
  profileLocation: string;
  bioText: string;
  focusText: string;
  principlesTitle: string;
  principles: Principle[];
  skills: SkillGroup[];
  socials: SocialLink[];
};

function splitList(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SettingsForm({
  initial,
  maxMb,
}: {
  initial: SiteSettings;
  maxMb: number;
}) {
  const { csrfToken, adminPath } = useAdminSession();
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    siteName: initial.siteName,
    tagline: initial.tagline,
    description: initial.description,
    contactEmail: initial.contactEmail,
    footerNote: initial.footerNote,
    avatarUrl: initial.avatarUrl,
    brandLogoUrl: initial.brand.logoUrl,
    brandMark: initial.brand.mark || "F",
    brandSubtitle: initial.brand.subtitle,
    heroEyebrow: initial.hero.eyebrow,
    heroTitle: initial.hero.title,
    heroSubtitle: initial.hero.subtitle,
    profileName: initial.profile.name,
    profileRole: initial.profile.role,
    profileLocation: initial.profile.location,
    bioText: initial.profile.bio.join("\n"),
    focusText: initial.profile.focus.join(", "),
    principlesTitle: initial.profile.principlesTitle || "做事原则",
    principles: initial.profile.principles.map((item) => ({ ...item })),
    skills: initial.skills.map((item) => ({ category: item.category, itemsText: item.items.join(", ") })),
    socials: initial.socials.map((item) => ({ ...item })),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function updatePrinciple(index: number, key: keyof Principle, value: string) {
    setForm((current) => ({
      ...current,
      principles: current.principles.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
    setDirty(true);
  }

  function updateSkill(index: number, key: keyof SkillGroup, value: string) {
    setForm((current) => ({
      ...current,
      skills: current.skills.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
    setDirty(true);
  }

  function updateSocial(index: number, key: keyof SocialLink, value: string) {
    setForm((current) => ({
      ...current,
      socials: current.socials.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
    setDirty(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setErrors({});

    const payload = {
      siteName: form.siteName,
      tagline: form.tagline,
      description: form.description,
      contactEmail: form.contactEmail,
      footerNote: form.footerNote,
      avatarUrl: form.avatarUrl,
      brand: {
        logoUrl: form.brandLogoUrl,
        mark: form.brandMark.trim() || "F",
        subtitle: form.brandSubtitle.trim(),
      },
      hero: {
        eyebrow: form.heroEyebrow,
        title: form.heroTitle,
        subtitle: form.heroSubtitle,
      },
      profile: {
        name: form.profileName,
        role: form.profileRole,
        location: form.profileLocation,
        bio: form.bioText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        focus: splitList(form.focusText),
        principlesTitle: form.principlesTitle.trim() || "做事原则",
        principles: form.principles
          .filter((item) => item.title.trim())
          .map((item) => ({ title: item.title.trim(), body: item.body.trim() })),
      },
      skills: form.skills
        .filter((item) => item.category.trim())
        .map((item) => ({
          category: item.category.trim(),
          items: splitList(item.itemsText),
        })),
      socials: form.socials
        .filter((item) => item.label.trim() && item.url.trim())
        .map((item) => ({ label: item.label.trim(), url: item.url.trim() })),
    };

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        toast.error("登录状态已失效，请重新登录");
        router.replace(adminHref(adminPath, "/login"));
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | {
            settings?: SiteSettings;
            error?: { message?: string; fields?: Record<string, string>; details?: Record<string, unknown> };
          }
        | null;

      if (!response.ok || !data?.settings) {
        const fields =
          data?.error?.fields ??
          (data?.error?.details && typeof data.error.details === "object"
            ? (data.error.details as Record<string, string>)
            : undefined);
        if (fields) {
          const next: Record<string, string> = {};
          for (const [key, value] of Object.entries(fields)) {
            if (typeof value === "string") next[key] = value;
          }
          setErrors(next);
        }
        toast.error(data?.error?.message ?? "保存失败，请检查表单");
        return;
      }

      setDirty(false);
      toast.success("站点设置已保存");
      router.refresh();
    } catch {
      toast.error("网络请求失败，设置没有保存");
    } finally {
      setSaving(false);
    }
  }

  const errorList = Object.entries(errors);

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? <p className="field-error">{errors[name]}</p> : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Settings
          </p>
          <h1 className="mt-1.5 text-[1.6rem] font-semibold tracking-[-0.025em] text-ink">
            站点设置
          </h1>
          <p className="mt-2 text-sm text-muted">
            这些资料会显示在前台。留空的联系方式不会生成链接，也不会显示虚构内容。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="chip border-warning/30 bg-warning-soft text-warning">未保存</span>
          ) : null}
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <Loader size={14} /> : <Save size={14} />}
            保存设置
          </button>
        </div>
      </div>

      {errorList.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[0.78rem] text-danger"
        >
          <p className="flex items-center gap-1.5 font-medium">
            <AlertCircle size={14} />
            请修正以下问题
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errorList.map(([key, message]) => (
              <li key={key}>
                <span className="font-mono text-[0.68rem] opacity-80">{key}</span>：{message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="card-surface p-5 sm:p-6">
        <h2 className="text-[1rem] font-semibold text-ink">基本信息</h2>
        <p className="mt-1 text-[0.75rem] text-muted">站点名称、描述与页脚信息。</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="siteName" className="field-label">
              站点名称
            </label>
            <input
              id="siteName"
              value={form.siteName}
              onChange={(event) => update("siteName", event.target.value)}
              className="input"
              maxLength={40}
              aria-invalid={Boolean(errors.siteName)}
            />
            <FieldError name="siteName" />
          </div>
          <div>
            <label htmlFor="tagline" className="field-label">
              一句话介绍
            </label>
            <input
              id="tagline"
              value={form.tagline}
              onChange={(event) => update("tagline", event.target.value)}
              className="input"
              maxLength={80}
            />
            <FieldError name="tagline" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="field-label">
              站点描述
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              className="textarea"
              rows={2}
              maxLength={300}
            />
            <FieldError name="description" />
          </div>
          <div>
            <label htmlFor="contactEmail" className="field-label">
              联系邮箱（可选）
            </label>
            <input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(event) => update("contactEmail", event.target.value)}
              className="input"
              maxLength={120}
              placeholder="hello@example.com"
            />
            <FieldError name="contactEmail" />
            <p className="mt-1.5 text-[0.64rem] text-muted">留空时前台显示“联系方式尚未配置”。</p>
          </div>
          <div>
            <label htmlFor="footerNote" className="field-label">
              页脚补充文字（可选）
            </label>
            <input
              id="footerNote"
              value={form.footerNote}
              onChange={(event) => update("footerNote", event.target.value)}
              className="input"
              maxLength={200}
              placeholder="例如：保持好奇。"
            />
            <FieldError name="footerNote" />
          </div>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <h2 className="text-[1rem] font-semibold text-ink">品牌标识</h2>
        <p className="mt-1 text-[0.75rem] text-muted">
          控制左上角的 Logo、品牌文字与副标题；站点名称在「基本信息」中修改。
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <ImageUploader
            value={form.brandLogoUrl || null}
            onChange={(value) => update("brandLogoUrl", value ?? "")}
            label="Logo 图片（可选）"
            maxMb={maxMb}
            aspect="aspect-square"
            fit="contain"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brandMark" className="field-label">
                Logo 文字
              </label>
              <input
                id="brandMark"
                value={form.brandMark}
                onChange={(event) => update("brandMark", event.target.value)}
                className="input"
                maxLength={4}
                placeholder="F"
              />
              <FieldError name="brand.mark" />
              <p className="mt-1.5 text-[0.64rem] text-muted">
                未上传 Logo 图片时显示，建议 1–2 个字符。
              </p>
            </div>
            <div>
              <label htmlFor="brandSubtitle" className="field-label">
                品牌副标题
              </label>
              <input
                id="brandSubtitle"
                value={form.brandSubtitle}
                onChange={(event) => update("brandSubtitle", event.target.value)}
                className="input"
                maxLength={40}
                placeholder="Personal site"
              />
              <FieldError name="brand.subtitle" />
              <p className="mt-1.5 text-[0.64rem] text-muted">
                显示在站点名称下方；留空则隐藏。
              </p>
            </div>
            <p className="text-[0.66rem] leading-relaxed text-muted sm:col-span-2">
              上传 Logo 图片后会优先显示图片；网站图标、分享图不会随这里修改。
            </p>
          </div>
        </div>
        <FieldError name="brand.logoUrl" />
      </section>

      <section className="card-surface p-5 sm:p-6">
        <h2 className="text-[1rem] font-semibold text-ink">首页 Hero</h2>
        <p className="mt-1 text-[0.75rem] text-muted">首页第一屏的标题与副标题。</p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="heroEyebrow" className="field-label">
              顶部小字
            </label>
            <input
              id="heroEyebrow"
              value={form.heroEyebrow}
              onChange={(event) => update("heroEyebrow", event.target.value)}
              className="input"
              maxLength={80}
            />
            <FieldError name="hero.eyebrow" />
          </div>
          <div>
            <label htmlFor="heroTitle" className="field-label">
              主标题
            </label>
            <input
              id="heroTitle"
              value={form.heroTitle}
              onChange={(event) => update("heroTitle", event.target.value)}
              className="input"
              maxLength={100}
              aria-invalid={Boolean(errors["hero.title"])}
            />
            <FieldError name="hero.title" />
          </div>
          <div>
            <label htmlFor="heroSubtitle" className="field-label">
              副标题
            </label>
            <textarea
              id="heroSubtitle"
              value={form.heroSubtitle}
              onChange={(event) => update("heroSubtitle", event.target.value)}
              className="textarea"
              rows={2}
              maxLength={200}
            />
            <FieldError name="hero.subtitle" />
          </div>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <h2 className="text-[1rem] font-semibold text-ink">个人资料</h2>
        <p className="mt-1 text-[0.75rem] text-muted">
          昵称、身份说明与介绍。尚未确定的个人信息可以保持默认占位内容。
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <ImageUploader
            value={form.avatarUrl || null}
            onChange={(value) => update("avatarUrl", value ?? "")}
            label="头像"
            maxMb={maxMb}
            aspect="aspect-square"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profileName" className="field-label">
                显示名称
              </label>
              <input
                id="profileName"
                value={form.profileName}
                onChange={(event) => update("profileName", event.target.value)}
                className="input"
                maxLength={40}
                aria-invalid={Boolean(errors["profile.name"])}
              />
              <FieldError name="profile.name" />
            </div>
            <div>
              <label htmlFor="profileRole" className="field-label">
                身份 / 方向
              </label>
              <input
                id="profileRole"
                value={form.profileRole}
                onChange={(event) => update("profileRole", event.target.value)}
                className="input"
                maxLength={60}
              />
              <FieldError name="profile.role" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="profileLocation" className="field-label">
                所在地（可选）
              </label>
              <input
                id="profileLocation"
                value={form.profileLocation}
                onChange={(event) => update("profileLocation", event.target.value)}
                className="input"
                maxLength={60}
                placeholder="留空则不显示"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="bio" className="field-label">
              个人介绍（每行一段）
            </label>
            <textarea
              id="bio"
              value={form.bioText}
              onChange={(event) => update("bioText", event.target.value)}
              className="textarea"
              rows={5}
              placeholder="介绍你的技术方向与正在做的事"
            />
            <FieldError name="profile.bio" />
          </div>
          <div>
            <label htmlFor="focus" className="field-label">
              关注方向（逗号分隔）
            </label>
            <input
              id="focus"
              value={form.focusText}
              onChange={(event) => update("focusText", event.target.value)}
              className="input"
              placeholder="Web 工程, 系统与数据库, 开发者工具"
            />
            <FieldError name="profile.focus" />
          </div>
        </div>
      </section>

      <section className="card-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[1rem] font-semibold text-ink">
              {form.principlesTitle.trim() || "做事原则"}
            </h2>
            <p className="mt-1 text-[0.75rem] text-muted">最多 6 条，显示在首页和关于页。</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (form.principles.length >= 6) {
                toast.info("最多 6 条原则");
                return;
              }
              setForm((current) => ({
                ...current,
                principles: [...current.principles, { title: "", body: "" }],
              }));
              setDirty(true);
            }}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={13} />
            添加
          </button>
        </div>

        <div className="mt-4 max-w-md">
          <label htmlFor="principlesTitle" className="field-label">
            板块标题
          </label>
          <input
            id="principlesTitle"
            value={form.principlesTitle}
            onChange={(event) => update("principlesTitle", event.target.value)}
            className="input"
            maxLength={40}
            placeholder="做事原则"
            aria-invalid={Boolean(errors["profile.principlesTitle"])}
          />
          <FieldError name="profile.principlesTitle" />
          <p className="mt-1.5 text-[0.64rem] text-muted">
            显示在关于页；留空时使用「做事原则」。
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {form.principles.map((principle, index) => (
            <div key={index} className="rounded-xl border border-line bg-bg-subtle/30 p-3.5">
              <div className="flex items-center gap-2">
                <input
                  value={principle.title}
                  onChange={(event) => updatePrinciple(index, "title", event.target.value)}
                  className="input py-1.5 text-[0.82rem]"
                  placeholder="原则标题"
                  maxLength={60}
                  aria-label={`原则 ${index + 1} 标题`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      principles: current.principles.filter((_, itemIndex) => itemIndex !== index),
                    }));
                    setDirty(true);
                  }}
                  className="icon-btn size-8 flex-none text-muted hover:text-danger"
                  aria-label="删除这条原则"
                >
                  <Trash size={14} />
                </button>
              </div>
              <textarea
                value={principle.body}
                onChange={(event) => updatePrinciple(index, "body", event.target.value)}
                className="textarea mt-2 min-h-[3.5rem] py-2 text-[0.8rem]"
                placeholder="一句具体的说明"
                maxLength={240}
                aria-label={`原则 ${index + 1} 说明`}
              />
            </div>
          ))}
          {form.principles.length === 0 ? (
            <p className="text-[0.75rem] text-muted">还没有原则条目。</p>
          ) : null}
        </div>
        <FieldError name="profile.principles" />
      </section>

      <section className="card-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[1rem] font-semibold text-ink">技术方向</h2>
            <p className="mt-1 text-[0.75rem] text-muted">按分组展示，不使用百分比或评分。</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (form.skills.length >= 8) {
                toast.info("最多 8 个技术分组");
                return;
              }
              setForm((current) => ({
                ...current,
                skills: [...current.skills, { category: "", itemsText: "" }],
              }));
              setDirty(true);
            }}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={13} />
            添加分组
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {form.skills.map((skill, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-line bg-bg-subtle/30 p-3.5 sm:grid-cols-[12rem_minmax(0,1fr)_2rem] sm:items-start">
              <input
                value={skill.category}
                onChange={(event) => updateSkill(index, "category", event.target.value)}
                className="input py-1.5 text-[0.82rem]"
                placeholder="分组名称"
                maxLength={40}
                aria-label={`技能分组 ${index + 1} 名称`}
              />
              <input
                value={skill.itemsText}
                onChange={(event) => updateSkill(index, "itemsText", event.target.value)}
                className="input py-1.5 text-[0.82rem]"
                placeholder="TypeScript, React, Node.js"
                aria-label={`技能分组 ${index + 1} 内容`}
              />
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    skills: current.skills.filter((_, itemIndex) => itemIndex !== index),
                  }));
                  setDirty(true);
                }}
                className="icon-btn size-8 text-muted hover:text-danger"
                aria-label="删除这个分组"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
        <FieldError name="skills" />
      </section>

      <section className="card-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[1rem] font-semibold text-ink">社交链接</h2>
            <p className="mt-1 text-[0.75rem] text-muted">
              只添加真实可用的主页；留空的链接会被忽略。
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (form.socials.length >= 10) {
                toast.info("最多 10 个链接");
                return;
              }
              setForm((current) => ({
                ...current,
                socials: [...current.socials, { label: "", url: "" }],
              }));
              setDirty(true);
            }}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={13} />
            添加链接
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {form.socials.map((social, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-line bg-bg-subtle/30 p-3.5 sm:grid-cols-[10rem_minmax(0,1fr)_2rem] sm:items-start">
              <input
                value={social.label}
                onChange={(event) => updateSocial(index, "label", event.target.value)}
                className="input py-1.5 text-[0.82rem]"
                placeholder="GitHub"
                maxLength={30}
                aria-label={`链接 ${index + 1} 名称`}
              />
              <input
                value={social.url}
                onChange={(event) => updateSocial(index, "url", event.target.value)}
                className="input py-1.5 text-[0.82rem]"
                placeholder="https://github.com/username"
                aria-label={`链接 ${index + 1} 地址`}
              />
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({
                    ...current,
                    socials: current.socials.filter((_, itemIndex) => itemIndex !== index),
                  }));
                  setDirty(true);
                }}
                className="icon-btn size-8 text-muted hover:text-danger"
                aria-label="删除这个链接"
              >
                <Trash size={14} />
              </button>
              {errors[`socials.${index}.url`] ? (
                <p className="field-error sm:col-span-2">{errors[`socials.${index}.url`]}</p>
              ) : null}
            </div>
          ))}
          {form.socials.length === 0 ? (
            <p className="text-[0.75rem] text-muted">还没有配置社交链接。</p>
          ) : null}
        </div>
        <FieldError name="socials" />
      </section>

      <div className={cn("flex items-center justify-end gap-2 border-t border-line pt-5")}>
        {dirty ? <span className="mr-auto text-[0.7rem] text-warning">有未保存的修改</span> : null}
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader size={15} /> : <Save size={15} />}
          保存设置
        </button>
      </div>
    </div>
  );
}
