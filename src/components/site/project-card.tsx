import Image from "next/image";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Github, LinkIcon } from "@/components/ui/icons";
import { CoverArt } from "./cover-art";

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  const links: { href: string; label: string; icon: React.ReactNode }[] = [];
  if (project.demoUrl) {
    links.push({ href: project.demoUrl, label: "查看演示", icon: <ArrowUpRight size={14} /> });
  }
  if (project.repoUrl) {
    links.push({ href: project.repoUrl, label: "代码仓库", icon: <Github size={14} /> });
  }

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={`${project.title} 封面`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <CoverArt
            title={project.title}
            category={project.category}
            label={project.category ? `fateway / ${project.category}` : "fateway / project"}
          />
        )}
        {project.visible ? null : (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-ink/80 px-2 py-0.5 text-[0.62rem] text-bg backdrop-blur">
            已隐藏
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted">
            {project.category || "项目"}
          </span>
          <span className="font-mono text-[0.62rem] text-muted/70">
            {String(project.sortOrder).padStart(2, "0")}
          </span>
        </div>

        <h3 className="mt-2.5 text-[1.15rem] font-semibold tracking-[-0.01em] text-ink">
          {project.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{project.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 5).map((tech) => (
            <span key={tech} className="chip text-[0.67rem]">
              {tech}
            </span>
          ))}
        </div>

        {links.length > 0 ? (
          <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[0.8rem] text-ink-soft transition-colors hover:text-accent-strong"
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-auto flex items-center gap-1.5 pt-5 text-[0.72rem] text-muted">
            <LinkIcon size={13} />
            暂无公开链接
          </div>
        )}
      </div>
    </article>
  );
}
