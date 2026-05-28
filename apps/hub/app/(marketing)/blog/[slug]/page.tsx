import type { Metadata } from "next";
import {
  blogPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/blog-data";
import { buildBlogPostingSchema, buildFaqSchema, buildTitle, buildBreadcrumbSchema } from "@/lib/seo";
import BlogPostClient from "./blog-post-client";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

function getPostBySlug(slug: string) {
  return getBlogPostBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: buildTitle(post.title),
      description: post.description,
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: new Date(post.date).toISOString(),
    },
    twitter: {
      title: buildTitle(post.title),
      description: post.description,
    },
    keywords: post.keywords,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = buildBlogPostingSchema(post);
  const faqJsonLd = buildFaqSchema(post.faq);
  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: "Home", item: "/" },
    { name: "Blog", item: "/blog" },
    { name: post.title, item: `/blog/${post.slug}` },
  ]);
  const relatedPosts = getRelatedBlogPosts(post.slug);

  return (
    <>
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
