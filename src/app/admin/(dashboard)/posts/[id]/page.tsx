import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { config } from "@/lib/config";
import { getAdminPost } from "@/lib/db/posts";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = getAdminPost(id);
  return {
    title: post ? `编辑：${post.title}` : "编辑文章",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = getAdminPost(id);
  if (!post) notFound();

  return (
    <PostEditor
      mode="edit"
      maxMb={Math.round(config.maxUploadBytes / (1024 * 1024))}
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        coverImage: post.coverImage,
        category: post.category?.name ?? "",
        tags: post.tags.map((tag) => tag.name),
        status: post.status,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
      }}
    />
  );
}
