import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-data";
import { absoluteUrl } from "@/lib/seo";

function parsePublishedDate(date: string) {
  return new Date(date);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/buy"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/phantom-wallet-simulator"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/fake-phantom-wallet"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: new Date("2026-04-23"),
      changeFrequency: "yearly",
      priority: 0.15,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: new Date("2026-04-23"),
      changeFrequency: "yearly",
      priority: 0.15,
    },
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: parsePublishedDate(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
