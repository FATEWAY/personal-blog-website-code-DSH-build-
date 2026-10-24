import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProjectActions } from "@/components/admin/project-actions";
import { EmptyState } from "@/components/site/empty-state";
import { CoverArt } from "@/components/site/cover-art";
import { Folder, Plus } from "@/components/ui/icons";
import { config } from "@/lib/config";
import { formatDateDot } from "@/lib/date";
import { listAllProjects } from "@/lib/db/projects";
import { adminHref } from "@/lib/route-path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "项目管理",
};

export default function AdminProjectsPage() {
  const projects = listAllProjects();
  const visibleCount = projects.filter((project) => project.visible).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Portfolio"
        title="项目管理"
        description={`共 ${projects.length} 个项目，其中 ${visibleCount} 个在前台公开展示。`}
        actions={
          <Link href={adminHref(config.adminPath, "/projects/new")} className="btn btn-primary btn-sm">
            <Plus size={15} />
            新建项目
          </Link>
        }
      />

      {projects.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="group flex flex-col overflow-hidden rounded-[16px] border border-line bg-card transition-colors hover:border-line-strong"
            >
              <div className="relative aspect-[16/7] overflow-hidden border-b border-line">
                {project.coverImage ? (
                  <Image
                    src={project.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <CoverArt title={project.title} category={project.category} label="fateway / project" />
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                    {project.category || "未分类"}
                  </span>
                  <span
                    className={
                      project.visible
                        ? "inline-flex items-center gap-1 rounded-full border border-success/30 bg-success-soft px-1.5 py-0.5 text-[0.6rem] text-success"
                        : "inline-flex items-center gap-1 rounded-full border border-line-strong bg-bg-subtle px-1.5 py-0.5 text-[0.6rem] text-muted"
                    }
                  >
                    <span
                      className={`size-1 rounded-full ${project.visible ? "bg-success" : "bg-muted"}`}
                      aria-hidden="true"
                    />
                    {project.visible ? "公开" : "隐藏"}
                  </span>
                </div>

                <h2 className="mt-2 truncate text-[0.95rem] font-semibold text-ink">{project.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-[0.75rem] leading-relaxed text-muted">
                  {project.description || "暂无简介"}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {project.tech.slice(0, 4).map((tech) => (
                    <span key={tech} className="chip text-[0.62rem]">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="font-mono text-[0.6rem] text-muted">
                    #{project.sortOrder} · {formatDateDot(project.updatedAt)}
                  </span>
                  <ProjectActions id={project.id} title={project.title} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Folder size={20} />}
          title="还没有项目"
          description="添加项目后，可以选择是否在前台公开展示。"
          action={{ href: adminHref(config.adminPath, "/projects/new"), label: "新建项目" }}
        />
      )}
    </div>
  );
}
