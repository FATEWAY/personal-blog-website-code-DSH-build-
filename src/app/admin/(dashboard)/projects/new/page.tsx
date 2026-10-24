import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/project-form";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "新建项目",
};

export default function NewProjectPage() {
  return (
    <ProjectForm
      mode="create"
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
      initial={{
        id: null,
        title: "",
        description: "",
        category: "",
        tech: [],
        coverImage: null,
        demoUrl: null,
        repoUrl: null,
        sortOrder: 0,
        visible: true,
      }}
    />
  );
}
