import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { groupGalleryItems, listVisibleGallery } from "@/lib/db/gallery";
import { listPublishedSlugs } from "@/lib/db/posts";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: config.siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${config.siteUrl}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${config.siteUrl}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${config.siteUrl}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${config.siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${config.siteUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${config.siteUrl}/subscribe`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  let albumRoutes: MetadataRoute.Sitemap = [];
  try {
    albumRoutes = groupGalleryItems(listVisibleGallery()).map((album) => ({
      url: `${config.siteUrl}/gallery/${album.slug}`,
      lastModified: new Date(
        Math.max(...album.items.map((item) => new Date(item.updatedAt).getTime())),
      ),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[sitemap] could not read gallery albums", error);
  }

  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    postRoutes = listPublishedSlugs().map((post) => ({
      url: `${config.siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] could not read posts", error);
  }

  return [...staticRoutes, ...albumRoutes, ...postRoutes];
}
