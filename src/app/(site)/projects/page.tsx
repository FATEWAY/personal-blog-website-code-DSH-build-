import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/project-card";
import { EmptyState } from "@/components/site/empty-state";
import { Folder } from "@/components/ui/icons";
import { listVisibleProjects } from "@/lib/db/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "项目",
  description: "正在维护和曾经投入过的项目。",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const projects = listVisibleProjects();

  return (
    <div className="container-page pb-4 pt-14 sm:pt-20">
      <header className="max-w-2xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Projects
        </p>
        <h1 className="mt-4 text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[3rem]">
          项目
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          一些正在维护或曾经投入过时间的工程实践。没有公开演示或仓库的项目，不会展示无效链接。
        </p>
        <p className="mt-3 text-[0.78rem] text-muted">共 {projects.length} 个公开项目</p>
      </header>

      <div className="mt-10">
        {projects.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Folder size={20} />}
            title="暂时还没有公开项目"
            description="在后台添加项目并标记为可见后，它会出现在这里。"
          />
        )}
      </div>
    </div>
  );
}
