import type { Metadata } from "next";
import type { BlogPost } from "@/lib/blog-data";

export const siteConfig = {
  name: "RPWallet",
  url: "https://rpwallet.app",
  description:
    "RPWallet is the world's most realistic phantom simulator and crypto wallet mockup tool. Perfect for content creation, simulation, and roleplay. Flex millions in crypto with an indistinguishable fake crypto app interface.",
  ogImage: "/opengraph-image.png",
  xHandle: "@rpwallet",
};

export const homepageFaq = [
  {
    question: "Is RPWallet a real crypto wallet app?",
    answer:
      "No. RPWallet is a wallet simulator and visual production tool. It never asks for a seed phrase, never connects to your real wallet, and cannot process real blockchain transactions.",
  },
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function buildTitle(title: string) {
  return `${title} | ${siteConfig.name}`;
}

export function buildDefaultMetadata(): Metadata {
  const ogImageUrl = absoluteUrl(siteConfig.ogImage);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: "Premium Crypto Wallet Simulator & Fake phantom Wallet for Crypto Creators",
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [
      "larp",
      "larping",
      "content creation",
      "simulation",
      "fake crypto app",
      "fake phantom app",
      "fake phantom wallet",
      "phantom simulator",
      "simulator wallet",
      "larp wallet",
      "crypto wallet simulator",
      "wealth simulator",
      "fake crypto balance",
      "content creator tools",
      "wallet mockup app",
      "portfolio screenshot app",
      "crypto demo wallet",
      "wallet roleplay app",
      "novelty crypto wallet",
      "crypto screenshot tool",
      "RPWallet",
    ],
    authors: [{ name: "RPWallet Team" }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "technology",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: buildTitle("Show Off Millions in Crypto Instantly"),
      description: siteConfig.description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: buildTitle("Show Off Millions in Crypto Instantly"),
      description: siteConfig.description,
      creator: siteConfig.xHandle,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/logos/icon_512x512_nonglass.png",
    },
    alternates: {
      canonical: siteConfig.url,
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteConfig.name,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export function buildWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: ["FinanceApplication", "EntertainmentApplication"],
    operatingSystem: "iOS, Android, Windows, macOS",
    offers: {
      "@type": "Offer",
      price: "14.00",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "RPWallet Team",
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/logo.webp"),
  };
}

export function buildBlogPostingSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    author: {
      "@type": "Organization",
      name: "RPWallet Team",
    },
    datePublished: post.date,
    dateModified: post.date,
    image: absoluteUrl(post.image),
    wordCount: post.readingTime.split(" ")[0] ? parseInt(post.readingTime.split(" ")[0]) * 200 : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.webp"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  };
}

export function buildFaqSchema(
  faq: Array<{ question: string; answer: string }> | undefined,
) {
  if (!faq?.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.name,
      item: absoluteUrl(breadcrumb.item),
    })),
  };
}

export function buildSiteNavigationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: [
      "Home",
      "Features",
      "Pricing",
      "Blog",
      "Login",
    ],
    url: [
      absoluteUrl("/"),
      absoluteUrl("/#features"),
      absoluteUrl("/buy"),
      absoluteUrl("/blog"),
      absoluteUrl("/dashboard"),
    ],
  };
}
