import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { config } from "@/lib/config";
import { getProject } from "@/lib/db/projects";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  return {
    title: project ? `编辑：${project.title}` : "编辑项目",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  return (
    <ProjectForm
      mode="edit"
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
      initial={{
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        tech: project.tech,
        coverImage: project.coverImage,
        demoUrl: project.demoUrl,
        repoUrl: project.repoUrl,
        sortOrder: project.sortOrder,
        visible: project.visible,
      }}
    />
  );
}
