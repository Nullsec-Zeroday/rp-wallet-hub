import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-data";
import { absoluteUrl } from "@/lib/seo";

const staticRoutes = [
  "",
  "/buy",
  "/blog",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      lastModified: now,
      changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
      priority: route === "" ? 1 : route === "/buy" ? 0.9 : 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
