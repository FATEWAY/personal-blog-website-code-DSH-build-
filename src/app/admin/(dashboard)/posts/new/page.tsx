import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/post-editor";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "新建文章",
};

export default function NewPostPage() {
  return (
    <PostEditor
      mode="create"
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
      initial={{
        id: null,
        title: "",
        slug: "",
        summary: "",
        content: "",
        coverImage: null,
        category: "",
        tags: [],
        status: "draft",
        publishedAt: null,
        updatedAt: null,
      }}
    />
  );
}
